import 'dotenv/config';
import express from 'express';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';

let cachedServer: express.Express | null = null;

function resolveUploadsPath() {
  const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
  return join(basePath, 'uploads');
}

async function bootstrapServer() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors();

  const uploadsPath = resolveUploadsPath();
  try {
    if (!existsSync(uploadsPath)) {
      mkdirSync(uploadsPath, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsPath));
  } catch (error) {
    console.warn('Uploads storage unavailable:', String(error));
  }

  await app.init();
  return server;
}

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return cachedServer(req, res);
}
