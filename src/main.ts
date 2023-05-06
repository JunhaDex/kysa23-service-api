import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log(process.env.GOOGLE_APPLICATION_SECRET);
  const secret = process.env.GOOGLE_APPLICATION_SECRET;
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(process.cwd(), secret);
  path.join(process.cwd(), secret);
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}

bootstrap();
