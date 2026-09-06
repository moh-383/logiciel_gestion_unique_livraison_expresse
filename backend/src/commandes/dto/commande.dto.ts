import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { StatutCommande } from '@prisma/client';

export class CreateCommandeDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  fournisseurId: string;

  @IsString()
  @IsNotEmpty()
  adresseLivraisonId: string;

  @IsString()
  @IsNotEmpty()
  descriptionMarchandise: string;

  @IsNumber()
  @IsOptional()
  montantMarchandise?: number;

  @IsNumber()
  @IsNotEmpty()
  fraisLivraison: number;
}

export class AffecterLivreurDto {
  @IsString()
  @IsNotEmpty()
  livreurId: string;
}

export class ChangerStatutDto {
  @IsEnum(StatutCommande)
  statut: StatutCommande;
}
