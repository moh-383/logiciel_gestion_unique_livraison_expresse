import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GpsService } from './gps.service';
import { EnregistrerPositionDto } from './dto/position.dto';

/**
 * Canal temps réel pour la position des livreurs.
 *
 * - Un livreur se connecte et envoie l'événement "position:update" à
 *   intervalle régulier (30-60s, cf. cahier des charges §6.6) tant qu'il est
 *   en service.
 * - Le dashboard admin se connecte, rejoint la room "dashboard" et reçoit
 *   l'événement "position:livreur" à chaque mise à jour.
 *
 * En cas de connexion instable côté livreur, l'app mobile doit privilégier le
 * fallback REST (POST /gps/position) qui fonctionne aussi hors WebSocket.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class GpsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GpsGateway.name);

  constructor(
    private gpsService: GpsService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('Token manquant');

      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      (client.data as any).utilisateur = payload;

      if (payload.role === 'ADMIN' || payload.role === 'DISPATCHER') {
        client.join('dashboard');
      }
    } catch (erreur) {
      this.logger.warn(`Connexion WebSocket refusée : ${(erreur as Error).message}`);
      client.disconnect();
    }
  }

  @SubscribeMessage('position:update')
  async handlePosition(
    @MessageBody() dto: EnregistrerPositionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const position = await this.gpsService.enregistrerPosition(dto);
    this.server.to('dashboard').emit('position:livreur', position);
    return { ok: true };
  }
}
