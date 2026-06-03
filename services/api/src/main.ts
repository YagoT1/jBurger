import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
async function bootstrap() { const app = await NestFactory.create(AppModule, { bufferLogs: true }); const config = app.get(ConfigService); const origins = String(config.get('CORS_ORIGINS') ?? '').split(',').filter(Boolean); app.use(helmet()); app.enableCors({ origin: origins.length ? origins : true }); app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })); const port = Number(config.get('PORT') ?? 3001); await app.listen(port); }
void bootstrap();
