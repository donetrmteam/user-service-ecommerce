import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.TCP_HOST || 'localhost',
      port: parseInt(process.env.TCP_PORT || '3001'),
      retryAttempts: 5,
      retryDelay: 3000,
    },
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  await app.listen();
  console.log(`Microservicio de usuarios iniciado en ${process.env.TCP_HOST || 'localhost'}:${process.env.TCP_PORT || 3001}`);
}
bootstrap();