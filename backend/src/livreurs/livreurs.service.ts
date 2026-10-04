import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UtilisateurCourant } from '../common/decorators/current-user.decorator';
import { CreateLivreurDto, UpdateLivreurDto, UpdateStatutLivreurDto } from './dto/livreur.dto';

@Injectable()
export class LivreursService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLivreurDto) {
    const telephoneExistant = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
    });
    if (telephoneExistant) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    const motDePasseHash = await AuthService.hasherMotDePasse(dto.motDePasse);

    // Utilisateur + Livreur sont créés ensemble : un livreur est avant tout
    // un utilisateur du système (cf. schéma Prisma, relation 1—1).
    return this.prisma.utilisateur.create({
      data: {
        nom: dto.nom,
        telephone: dto.telephone,
        motDePasse: motDePasseHash,
        role: Role.LIVREUR,
        livreur: {
          create: {
            vehicule: dto.vehicule,
            immatriculation: dto.immatriculation,
          },
        },
      },
      include: { livreur: true },
    });
  }

  findAll() {
    return this.prisma.livreur.findMany({
      include: { utilisateur: { select: { id: true, nom: true, telephone: true } } },
    });
  }

  async findOne(id: string) {
    const livreur = await this.prisma.livreur.findUnique({
      where: { id },
      include: {
        utilisateur: { select: { id: true, nom: true, telephone: true } },
        commandes: true,
      },
    });
    if (!livreur) throw new NotFoundException('Livreur introuvable');
    return livreur;
  }

  async update(id: string, dto: UpdateLivreurDto) {
    await this.findOne(id);
    return this.prisma.livreur.update({ where: { id }, data: dto });
  }

  async updateStatut(id: string, dto: UpdateStatutLivreurDto, user: UtilisateurCourant) {
    await this.findOne(id);
    if (user.role === Role.LIVREUR && user.livreurId !== id) {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre statut');
    }
    return this.prisma.livreur.update({ where: { id }, data: { statut: dto.statut } });
  }

  async remove(id: string) {
    const livreur = await this.findOne(id);
    // On supprime l'utilisateur associé, ce qui supprime le livreur en cascade
    // si la relation est configurée avec onDelete: Cascade côté BDD.
    return this.prisma.utilisateur.delete({ where: { id: livreur.utilisateurId } });
  }

  async historiquePositions(livreurId: string, limite = 100) {
    await this.findOne(livreurId);
    return this.prisma.positionLivreur.findMany({
      where: { livreurId },
      orderBy: { horodatage: 'desc' },
      take: limite,
    });
  }
}
