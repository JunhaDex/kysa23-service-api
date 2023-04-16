import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  console.log(process.env.GOOGLE_APPLICATION_SECRET);
  const secret = process.env.GOOGLE_APPLICATION_SECRET;
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(process.cwd(), secret);
  path.join(process.cwd(), secret);
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
