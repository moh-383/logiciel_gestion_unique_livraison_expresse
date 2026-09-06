import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StatutCommande } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AffecterLivreurDto, ChangerStatutDto, CreateCommandeDto } from './dto/commande.dto';

// États terminaux : une fois atteints, la commande ne devrait plus changer de statut.
const STATUTS_TERMINAUX: StatutCommande[] = [
  StatutCommande.TERMINEE,
  StatutCommande.ANNULEE,
];

@Injectable()
export class CommandesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateCommandeDto, utilisateurId: string) {
    const commande = await this.prisma.commande.create({
      data: {
        clientId: dto.clientId,
        fournisseurId: dto.fournisseurId,
        adresseLivraisonId: dto.adresseLivraisonId,
        descriptionMarchandise: dto.descriptionMarchandise,
        montantMarchandise: dto.montantMarchandise,
        fraisLivraison: dto.fraisLivraison,
        statut: StatutCommande.NOUVELLE,
        historique: {
          create: { statut: StatutCommande.NOUVELLE, utilisateurId },
        },
      },
      include: { client: true, fournisseur: true, adresseLivraison: true },
    });

    return commande;
  }

  findAll(filtres: { statut?: StatutCommande; livreurId?: string }) {
    return this.prisma.commande.findMany({
      where: {
        statut: filtres.statut,
        livreurId: filtres.livreurId,
      },
      include: {
        client: true,
        fournisseur: true,
        livreur: { include: { utilisateur: { select: { nom: true, telephone: true } } } },
        adresseLivraison: true,
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  async findOne(id: string) {
    const commande = await this.prisma.commande.findUnique({
      where: { id },
      include: {
        client: true,
        fournisseur: true,
        livreur: { include: { utilisateur: { select: { nom: true, telephone: true } } } },
        adresseLivraison: true,
        historique: { orderBy: { horodatage: 'asc' } },
      },
    });
    if (!commande) throw new NotFoundException('Commande introuvable');
    return commande;
  }

  private assurerCommandeModifiable(statutActuel: StatutCommande) {
    if (STATUTS_TERMINAUX.includes(statutActuel)) {
      throw new BadRequestException(
        `Impossible de modifier une commande au statut terminal "${statutActuel}"`,
      );
    }
  }

  async affecterLivreur(id: string, dto: AffecterLivreurDto, utilisateurId: string) {
    const commande = await this.findOne(id);
    this.assurerCommandeModifiable(commande.statut);

    const misAJour = await this.prisma.commande.update({
      where: { id },
      data: {
        livreurId: dto.livreurId,
        statut: StatutCommande.LIVREUR_AFFECTE,
        historique: {
          create: { statut: StatutCommande.LIVREUR_AFFECTE, utilisateurId },
        },
      },
    });

    await this.notifications.notifierNouvelleCommande(dto.livreurId, id);
    return misAJour;
  }

  async changerStatut(id: string, dto: ChangerStatutDto, utilisateurId?: string) {
    const commande = await this.findOne(id);
    this.assurerCommandeModifiable(commande.statut);

    const misAJour = await this.prisma.commande.update({
      where: { id },
      data: {
        statut: dto.statut,
        historique: {
          create: { statut: dto.statut, utilisateurId },
        },
      },
    });

    await this.notifications.notifierChangementStatut(id, dto.statut);
    return misAJour;
  }

  // Utilisé par l'application livreur : ses commandes en cours uniquement.
  findMesCommandes(livreurId: string) {
    return this.prisma.commande.findMany({
      where: {
        livreurId,
        statut: { notIn: STATUTS_TERMINAUX },
      },
      include: { client: true, fournisseur: true, adresseLivraison: true },
      orderBy: { creeLe: 'asc' },
    });
  }
}
