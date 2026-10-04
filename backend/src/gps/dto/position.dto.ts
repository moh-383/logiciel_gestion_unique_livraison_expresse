import { IsLatitude, IsLongitude } from 'class-validator';

export class EnregistrerPositionDto {
  @IsLatitude()
  gpsLat: number;

  @IsLongitude()
  gpsLng: number;
}
