import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { DeviceTokenDto } from './dto/device-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, UtilisateurCourant } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private notifications: NotificationsService) {}

  @Post('login')
  @ApiOperation({ summary: 'Ouvrir une session' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.telephone, dto.motDePasse);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renouveler les jetons (usage unique)' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.rafraichirToken(refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fermer la session et révoquer le jeton de renouvellement' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: UtilisateurCourant) {
    return this.authService.logout(user.sub);
  }

  @Post('device-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enregistrer ou retirer le jeton FCM de cet appareil' })
  enregistrerJeton(@CurrentUser() user: UtilisateurCourant, @Body() dto: DeviceTokenDto) {
    return this.notifications.enregistrerToken(user.sub, dto.token ?? null);
  }
}
