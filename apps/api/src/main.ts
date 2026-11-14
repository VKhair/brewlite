import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

config({ path: resolve(__dirname, '../../../.env') });
config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(resolve(__dirname, '../public'));
  app.enableShutdownHooks();
  await app.listen(Number(process.env.API_PORT || 3001));
}
bootstrap().catch((error) => { console.error(error); process.exitCode = 1; });
