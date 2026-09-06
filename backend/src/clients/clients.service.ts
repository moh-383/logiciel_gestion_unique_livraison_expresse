import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdresseDto, CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  findAll(recherche?: string) {
    return this.prisma.client.findMany({
      where: recherche
        ? {
            OR: [
              { nom: { contains: recherche, mode: 'insensitive' } },
              { telephone: { contains: recherche } },
            ],
          }
        : undefined,
      include: { adresses: true },
      orderBy: { creeLe: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { adresses: true, commandes: true },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }

  async ajouterAdresse(clientId: string, dto: CreateAdresseDto) {
    await this.findOne(clientId);
    return this.prisma.adresse.create({ data: { ...dto, clientId } });
  }
}
