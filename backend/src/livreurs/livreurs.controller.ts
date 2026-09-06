import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LivreursService } from './livreurs.service';
import { CreateLivreurDto, UpdateLivreurDto, UpdateStatutLivreurDto } from './dto/livreur.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('livreurs')
export class LivreursController {
  constructor(private livreursService: LivreursService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateLivreurDto) {
    return this.livreursService.create(dto);
  }

  @Roles(Role.ADMIN, Role.DISPATCHER)
  @Get()
  findAll() {
    return this.livreursService.findAll();
  }

  @Roles(Role.ADMIN, Role.DISPATCHER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.livreursService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLivreurDto) {
    return this.livreursService.update(id, dto);
  }

  // Le livreur lui-même peut mettre à jour son statut depuis l'app mobile,
  // tout comme un admin/dispatcher depuis le dashboard.
  @Roles(Role.ADMIN, Role.DISPATCHER, Role.LIVREUR)
  @Patch(':id/statut')
  updateStatut(@Param('id') id: string, @Body() dto: UpdateStatutLivreurDto) {
    return this.livreursService.updateStatut(id, dto);
  }

  @Roles(Role.ADMIN, Role.DISPATCHER)
  @Get(':id/positions')
  historiquePositions(@Param('id') id: string) {
    return this.livreursService.historiquePositions(id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.livreursService.remove(id);
  }
}
