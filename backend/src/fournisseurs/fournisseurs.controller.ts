import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FournisseursService } from './fournisseurs.service';
import {
  CreateFournisseurDto,
  CreateProduitDto,
  UpdateFournisseurDto,
} from './dto/fournisseur.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.DISPATCHER)
@ApiTags('Fournisseurs')
@Controller('fournisseurs')
export class FournisseursController {
  constructor(private fournisseursService: FournisseursService) {}

  @Post()
  create(@Body() dto: CreateFournisseurDto) {
    return this.fournisseursService.create(dto);
  }

  @Get()
  findAll(@Query('recherche') recherche?: string) {
    return this.fournisseursService.findAll(recherche);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fournisseursService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFournisseurDto) {
    return this.fournisseursService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fournisseursService.remove(id);
  }

  @Post(':id/produits')
  ajouterProduit(@Param('id') id: string, @Body() dto: CreateProduitDto) {
    return this.fournisseursService.ajouterProduit(id, dto);
  }
}
