import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, StatutCommande } from '@prisma/client';
import { UtilisateurCourant } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AffecterLivreurDto, ChangerStatutDto, CreateCommandeDto } from './dto/commande.dto';

// États terminaux : une fois atteints, la commande ne devrait plus changer de statut.
const STATUTS_TERMINAUX: StatutCommande[] = [
  StatutCommande.TERMINEE,
  StatutCommande.ANNULEE,
  StatutCommande.ECHEC_LIVRAISON,
];

const ETAPES: StatutCommande[] = [
  StatutCommande.NOUVELLE,
  StatutCommande.CONFIRMEE,
  StatutCommande.LIVREUR_AFFECTE,
  StatutCommande.EN_ROUTE_FOURNISSEUR,
  StatutCommande.MARCHANDISE_RECUPEREE,
  StatutCommande.EN_ROUTE_CLIENT,
  StatutCommande.LIVREE,
  StatutCommande.TERMINEE,
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
        quantite: dto.quantite,
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

  async findOneForUser(id: string, user: UtilisateurCourant) {
    const commande = await this.findOne(id);
    if (user.role === Role.LIVREUR && commande.livreurId !== user.livreurId) {
      throw new ForbiddenException('Cette commande ne vous est pas affectée');
    }
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
    if (commande.statut !== StatutCommande.CONFIRMEE) {
      throw new BadRequestException('Une commande doit être confirmée avant son affectation');
    }
    const livreur = await this.prisma.livreur.findUnique({ where: { id: dto.livreurId } });
    if (!livreur) throw new NotFoundException('Livreur introuvable');

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

  async changerStatut(id: string, dto: ChangerStatutDto, user: UtilisateurCourant) {
    const commande = await this.findOne(id);
    this.assurerCommandeModifiable(commande.statut);

    if (user.role === Role.LIVREUR && commande.livreurId !== user.livreurId) {
      throw new ForbiddenException('Cette commande ne vous est pas affectée');
    }

    const courant = ETAPES.indexOf(commande.statut);
    const cible = ETAPES.indexOf(dto.statut);
    const terminalException = dto.statut === StatutCommande.ANNULEE || dto.statut === StatutCommande.ECHEC_LIVRAISON;
    const transitionNormale = cible === courant + 1;
    if (!transitionNormale && !terminalException) {
      throw new BadRequestException(`Transition interdite : ${commande.statut} → ${dto.statut}`);
    }
    if (user.role === Role.LIVREUR && (terminalException || dto.statut === StatutCommande.CONFIRMEE)) {
      throw new ForbiddenException('Cette transition est réservée au dispatcher');
    }
    if (dto.statut === StatutCommande.ECHEC_LIVRAISON && !dto.motifEchec) {
      throw new BadRequestException('Le motif de l’échec de livraison est obligatoire');
    }
    if (dto.statut !== StatutCommande.ECHEC_LIVRAISON && dto.motifEchec) {
      throw new BadRequestException('Le motif ne peut être fourni que pour un échec de livraison');
    }

    const misAJour = await this.prisma.commande.update({
      where: { id },
      data: {
        statut: dto.statut,
        motifEchecLivraison: dto.motifEchec ?? null,
        historique: {
          create: { statut: dto.statut, utilisateurId: user.sub },
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
