import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GpsService } from './gps.service';
import { GpsGateway } from './gps.gateway';
import { GpsController } from './gps.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [GpsController],
  providers: [GpsService, GpsGateway],
  exports: [GpsService],
})
export class GpsModule {}
