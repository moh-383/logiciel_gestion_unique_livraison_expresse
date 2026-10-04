import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FournisseursService } from './fournisseurs.service';
import { FournisseursController } from './fournisseurs.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, PassportModule.register({})],
  controllers: [FournisseursController],
  providers: [FournisseursService],
  exports: [FournisseursService],
})
export class FournisseursModule {}
