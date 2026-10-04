import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3001', 'http://127.0.0.1:3001']);
  app.enableCors({ origin: corsOrigins });
  app.setGlobalPrefix('api');
  const openApiConfig = new DocumentBuilder()
    .setTitle('UNIQUE Livraison Expresse API')
    .setDescription('API de gestion des clients, commandes, livreurs, GPS et notifications.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api/docs', app, openApiDocument, { jsonDocumentUrl: 'api/docs-json' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // retire les champs non déclarés dans les DTO
      transform: true, // convertit automatiquement les payloads vers les types des DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
