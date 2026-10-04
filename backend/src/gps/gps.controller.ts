import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, UtilisateurCourant } from '../common/decorators/current-user.decorator';
import { GpsService } from './gps.service';
import { EnregistrerPositionDto } from './dto/position.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('GPS')
@Controller('gps')
export class GpsController {
  constructor(private gpsService: GpsService) {}

  // Fallback REST : à utiliser côté app livreur si la connexion WebSocket
  // n'est pas disponible (cf. cahier des charges §6.6, gestion offline).
  @Roles(Role.LIVREUR)
  @Post('position')
  enregistrerPosition(@Body() dto: EnregistrerPositionDto, @CurrentUser() user: UtilisateurCourant) {
    return this.gpsService.enregistrerPosition(user.livreurId as string, dto);
  }

  @Roles(Role.ADMIN, Role.DISPATCHER)
  @Get('livreurs/dernieres-positions')
  dernieresPositions() {
    return this.gpsService.dernieresPositions();
  }
}
