import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, StatutCommande } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, UtilisateurCourant } from '../common/decorators/current-user.decorator';
import { CommandesService } from './commandes.service';
import { AffecterLivreurDto, ChangerStatutDto, CreateCommandeDto } from './dto/commande.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('Commandes')
@Controller('commandes')
export class CommandesController {
  constructor(private commandesService: CommandesService) {}

  @Roles(Role.ADMIN, Role.DISPATCHER)
  @Post()
  create(@Body() dto: CreateCommandeDto, @CurrentUser() user: UtilisateurCourant) {
    return this.commandesService.create(dto, user.sub);
  }

  @Roles(Role.ADMIN, Role.DISPATCHER)
  @Get()
  findAll(
    @Query('statut') statut?: StatutCommande,
    @Query('livreurId') livreurId?: string,
  ) {
    return this.commandesService.findAll({ statut, livreurId });
  }

  // Utilisé par l'application mobile livreur : uniquement ses commandes en cours.
  @Roles(Role.LIVREUR)
  @Get('mes-commandes')
  mesCommandes(@CurrentUser() user: UtilisateurCourant) {
    return this.commandesService.findMesCommandes(user.livreurId as string);
  }

  @Roles(Role.ADMIN, Role.DISPATCHER, Role.LIVREUR)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UtilisateurCourant) {
    return this.commandesService.findOneForUser(id, user);
  }

  @Roles(Role.ADMIN, Role.DISPATCHER)
  @Patch(':id/affecter')
  affecterLivreur(
    @Param('id') id: string,
    @Body() dto: AffecterLivreurDto,
    @CurrentUser() user: UtilisateurCourant,
  ) {
    return this.commandesService.affecterLivreur(id, dto, user.sub);
  }

  @Roles(Role.ADMIN, Role.DISPATCHER, Role.LIVREUR)
  @Patch(':id/statut')
  changerStatut(
    @Param('id') id: string,
    @Body() dto: ChangerStatutDto,
    @CurrentUser() user: UtilisateurCourant,
  ) {
    return this.commandesService.changerStatut(id, dto, user);
  }
}
