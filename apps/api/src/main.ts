import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { configureHttp } from './common/http/configure-http';

async function bootstrap() {
  const localEnv = resolve(__dirname, '../../..', '.env');
  if (existsSync(localEnv)) process.loadEnvFile(localEnv);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  configureHttp(app);
  const port = Number(process.env.API_PORT ?? 3003);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
