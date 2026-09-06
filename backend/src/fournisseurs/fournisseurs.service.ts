import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFournisseurDto,
  CreateProduitDto,
  UpdateFournisseurDto,
} from './dto/fournisseur.dto';

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateFournisseurDto) {
    return this.prisma.fournisseur.create({ data: dto });
  }

  findAll(recherche?: string) {
    return this.prisma.fournisseur.findMany({
      where: recherche ? { nom: { contains: recherche, mode: 'insensitive' } } : undefined,
      include: { produits: true },
    });
  }

  async findOne(id: string) {
    const fournisseur = await this.prisma.fournisseur.findUnique({
      where: { id },
      include: { produits: true },
    });
    if (!fournisseur) throw new NotFoundException('Fournisseur introuvable');
    return fournisseur;
  }

  async update(id: string, dto: UpdateFournisseurDto) {
    await this.findOne(id);
    return this.prisma.fournisseur.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.fournisseur.delete({ where: { id } });
  }

  async ajouterProduit(fournisseurId: string, dto: CreateProduitDto) {
    await this.findOne(fournisseurId);
    return this.prisma.produitFournisseur.create({
      data: { ...dto, fournisseurId },
    });
  }
}
