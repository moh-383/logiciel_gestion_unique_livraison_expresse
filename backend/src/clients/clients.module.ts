import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, PassportModule.register({})],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
