import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { PrismaService } from '../prisma/prisma.service';
import { App, cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly firebaseApp?: App;

  constructor(private readonly prisma: PrismaService, config: ConfigService) {
    const serviceAccountJson = config.get<string>('FCM_SERVICE_ACCOUNT_JSON');
    const serviceAccountPath = config.get<string>('FCM_SERVICE_ACCOUNT_PATH');
    if (!serviceAccountJson && !serviceAccountPath) {
      this.logger.warn('FCM désactivé : renseignez FCM_SERVICE_ACCOUNT_PATH ou FCM_SERVICE_ACCOUNT_JSON.');
      return;
    }
    try {
      const credentialContent = serviceAccountJson || readFileSync(serviceAccountPath!, 'utf8');
      const credentials = JSON.parse(credentialContent) as ServiceAccount;
      this.firebaseApp = getApps()[0] ?? initializeApp({ credential: cert(credentials) });
    } catch (error) {
      this.logger.error('Configuration FCM invalide; les notifications push sont désactivées.', error);
    }
  }

  async enregistrerToken(utilisateurId: string, token: string | null) {
    await this.prisma.utilisateur.update({ where: { id: utilisateurId }, data: { fcmToken: token } });
    return { ok: true };
  }

  async notifierNouvelleCommande(livreurId: string, commandeId: string) {
    const livreur = await this.prisma.livreur.findUnique({ where: { id: livreurId }, select: { utilisateurId: true } });
    if (livreur) await this.envoyer(livreur.utilisateurId, 'Nouvelle livraison', 'Une commande vous a été attribuée.', { commandeId });
  }

  async notifierChangementStatut(commandeId: string, statut: string) {
    const commande = await this.prisma.commande.findUnique({
      where: { id: commandeId },
      select: { livreur: { select: { utilisateurId: true } } },
    });
    if (commande?.livreur) await this.envoyer(commande.livreur.utilisateurId, 'Mise à jour de livraison', `Nouveau statut : ${statut}`, { commandeId, statut });
  }

  private async envoyer(utilisateurId: string, title: string, body: string, data: Record<string, string>) {
    if (!this.firebaseApp) return;
    const user = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId }, select: { fcmToken: true } });
    if (!user?.fcmToken) return;
    const message: Message = { token: user.fcmToken, notification: { title, body }, data };
    try {
      await getMessaging(this.firebaseApp).send(message);
    } catch (error) {
      this.logger.warn(`Envoi FCM impossible pour l’utilisateur ${utilisateurId}: ${String(error)}`);
      if (typeof error === 'object' && error !== null && 'code' in error && String(error.code).includes('registration-token-not-registered')) {
        await this.prisma.utilisateur.updateMany({ where: { id: utilisateurId, fcmToken: user.fcmToken }, data: { fcmToken: null } });
      }
    }
  }
}
