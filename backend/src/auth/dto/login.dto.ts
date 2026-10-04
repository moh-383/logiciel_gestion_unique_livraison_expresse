import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '+22670000003' })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiProperty({ example: 'mot-de-passe' })
  @IsString()
  @IsNotEmpty()
  motDePasse: string;
}
