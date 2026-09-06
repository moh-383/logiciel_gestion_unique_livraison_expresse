import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFournisseurDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsOptional()
  gpsLat?: number;

  @IsOptional()
  gpsLng?: number;
}

export class UpdateFournisseurDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsOptional()
  gpsLat?: number;

  @IsOptional()
  gpsLng?: number;
}

export class CreateProduitDto {
  @IsString()
  @IsNotEmpty()
  libelle: string;
}
