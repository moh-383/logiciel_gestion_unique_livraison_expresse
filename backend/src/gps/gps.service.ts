import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StatutLivreur } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EnregistrerPositionDto } from './dto/position.dto';

@Injectable()
export class GpsService {
  constructor(private prisma: PrismaService) {}

  async enregistrerPosition(livreurId: string, dto: EnregistrerPositionDto) {
    const livreur = await this.prisma.livreur.findUnique({ where: { id: livreurId }, select: { statut: true } });
    if (!livreur) throw new NotFoundException('Livreur introuvable');
    if (livreur.statut === StatutLivreur.HORS_LIGNE || livreur.statut === StatutLivreur.DESACTIVE) {
      throw new ForbiddenException('La position GPS est désactivée lorsque le livreur est hors service');
    }
    return this.prisma.positionLivreur.create({
      data: {
        livreurId,
        gpsLat: dto.gpsLat,
        gpsLng: dto.gpsLng,
      },
    });
  }

  // Dernière position connue de chaque livreur — alimente la carte du dashboard.
  // Note MVP : une requête par livreur ; à optimiser (DISTINCT ON en SQL brut,
  // ou vue dédiée) si le nombre de livreurs devient important (cf. V2).
  async dernieresPositions() {
    const livreurs = await this.prisma.livreur.findMany({
      select: { id: true, statut: true, utilisateur: { select: { nom: true } } },
    });

    const positions = await Promise.all(
      livreurs.map(async (livreur) => {
        const derniere = await this.prisma.positionLivreur.findFirst({
          where: { livreurId: livreur.id },
          orderBy: { horodatage: 'desc' },
        });
        return {
          livreurId: livreur.id,
          nom: livreur.utilisateur.nom,
          statut: livreur.statut,
          dernierePosition: derniere ?? null,
        };
      }),
    );

    return positions;
  }
}
