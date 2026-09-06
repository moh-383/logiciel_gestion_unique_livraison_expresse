import { IsLatitude, IsLongitude, IsNotEmpty, IsString } from 'class-validator';

export class EnregistrerPositionDto {
  @IsString()
  @IsNotEmpty()
  livreurId: string;

  @IsLatitude()
  gpsLat: number;

  @IsLongitude()
  gpsLng: number;
}
