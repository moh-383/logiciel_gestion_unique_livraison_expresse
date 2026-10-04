import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role, StatutCommande } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { UtilisateurCourant } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommandesService } from './commandes.service';

function serviceFor(commande: Record<string, unknown>) {
  const prisma = {
    commande: { findUnique: vi.fn().mockResolvedValue(commande), update: vi.fn() },
  } as unknown as PrismaService;
  const notifications = {} as NotificationsService;
  return { service: new CommandesService(prisma, notifications), prisma };
}

describe('CommandesService access and workflow', () => {
  it('rejects skipping workflow steps', async () => {
    const { service, prisma } = serviceFor({ id: 'order-1', statut: StatutCommande.NOUVELLE });
    const user: UtilisateurCourant = { sub: 'admin-1', telephone: '70000000', role: Role.ADMIN };

    await expect(
      service.changerStatut('order-1', { statut: StatutCommande.LIVREE }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.commande.update).not.toHaveBeenCalled();
  });

  it('prevents a driver from reading another driver’s order', async () => {
    const { service } = serviceFor({ id: 'order-1', livreurId: 'driver-2' });
    const user: UtilisateurCourant = {
      sub: 'user-1', telephone: '70000000', role: Role.LIVREUR, livreurId: 'driver-1',
    };

    await expect(service.findOneForUser('order-1', user)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
