import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';

function resolveUploadsPath() {
  const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
  return join(basePath, 'uploads');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const uploadsPath = resolveUploadsPath();
  try {
    if (!existsSync(uploadsPath)) {
      mkdirSync(uploadsPath, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsPath));
  } catch (error) {
    // Keep service booting even if upload storage cannot be mounted.
    console.warn('Uploads storage unavailable:', String(error));
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
