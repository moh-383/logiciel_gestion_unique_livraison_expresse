import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MotifEchecLivraison, StatutCommande } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommandeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fournisseurId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  adresseLivraisonId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descriptionMarchandise: string;

  @ApiProperty({ example: '2 cartons' })
  @IsString()
  @IsNotEmpty()
  quantite: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  montantMarchandise?: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  fraisLivraison: number;
}

export class AffecterLivreurDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  livreurId: string;
}

export class ChangerStatutDto {
  @ApiProperty({ enum: StatutCommande })
  @IsEnum(StatutCommande)
  statut: StatutCommande;

  @ApiPropertyOptional({ enum: MotifEchecLivraison })
  @IsOptional()
  @IsEnum(MotifEchecLivraison)
  motifEchec?: MotifEchecLivraison;
}
