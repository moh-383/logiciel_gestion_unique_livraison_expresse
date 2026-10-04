import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';
import { GpsService } from './gps.service';
import { GpsGateway } from './gps.gateway';
import { GpsController } from './gps.controller';

@Module({
  imports: [AuthModule, PassportModule.register({})],
  controllers: [GpsController],
  providers: [GpsService, GpsGateway],
  exports: [GpsService],
})
export class GpsModule {}
