import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StatutLivreur } from '@prisma/client';

export class CreateLivreurDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsString()
  @IsNotEmpty()
  motDePasse: string;

  @IsString()
  @IsOptional()
  vehicule?: string;

  @IsString()
  @IsOptional()
  immatriculation?: string;
}

export class UpdateLivreurDto {
  @IsString()
  @IsOptional()
  vehicule?: string;

  @IsString()
  @IsOptional()
  immatriculation?: string;
}

export class UpdateStatutLivreurDto {
  @IsEnum(StatutLivreur)
  statut: StatutLivreur;
}
