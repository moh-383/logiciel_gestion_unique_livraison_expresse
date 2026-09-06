import { Injectable, Logger } from '@nestjs/common';

/**
 * Squelette du service de notifications push (Firebase Cloud Messaging).
 *
 * Ce service ne fait qu'un `log` pour le moment : l'intégration réelle avec
 * Firebase Admin SDK nécessite un compte de service (fichier JSON) que le
 * client devra fournir. Une fois ce fichier disponible :
 *
 *   1. npm install firebase-admin
 *   2. Initialiser admin.initializeApp({ credential: admin.credential.cert(...) })
 *   3. Remplacer les `Logger.log` ci-dessous par de vrais appels
 *      `admin.messaging().send(...)`.
 *
 * Voir docs/cahier-des-charges.md §6.8 pour le détail des notifications prévues.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notifierNouvelleCommande(livreurId: string, commandeId: string) {
    this.logger.log(
      `[À implémenter avec FCM] Notification "nouvelle commande" → livreur ${livreurId}, commande ${commandeId}`,
    );
  }

  async notifierChangementStatut(commandeId: string, statut: string) {
    this.logger.log(
      `[À implémenter avec FCM] Notification "changement de statut" → commande ${commandeId}, statut ${statut}`,
    );
  }
}
