import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  telephone: string;
}

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  telephone?: string;
}

export class CreateAdresseDto {
  @IsString()
  @IsOptional()
  libelle?: string;

  @IsOptional()
  gpsLat?: number;

  @IsOptional()
  gpsLng?: number;
}
