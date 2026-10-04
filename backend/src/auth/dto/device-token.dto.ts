import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeviceTokenDto {
  @ApiPropertyOptional({ description: 'Jeton FCM; null pour retirer l’appareil', maxLength: 4096, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  token?: string | null;
}
