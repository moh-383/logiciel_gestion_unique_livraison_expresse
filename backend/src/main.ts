import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*' }); // À restreindre au domaine du dashboard en production
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // retire les champs non déclarés dans les DTO
      transform: true, // convertit automatiquement les payloads vers les types des DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
