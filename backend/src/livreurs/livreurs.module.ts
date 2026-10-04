import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LivreursService } from './livreurs.service';
import { LivreursController } from './livreurs.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, PassportModule.register({})],
  controllers: [LivreursController],
  providers: [LivreursService],
  exports: [LivreursService],
})
export class LivreursModule {}
