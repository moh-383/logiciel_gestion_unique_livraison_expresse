import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CommandesService } from './commandes.service';
import { CommandesController } from './commandes.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule, PassportModule.register({})],
  controllers: [CommandesController],
  providers: [CommandesService],
  exports: [CommandesService],
})
export class CommandesModule {}
