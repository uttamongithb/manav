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

function resolveCorsOrigins(): string[] {
  const rawOrigins = process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '';
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function attachServerMiddleware(app: any) {
  const allowedOrigins = resolveCorsOrigins();

  app.use((req: any, _res: any, next: any) => {
    if (req.url === '/api') {
      req.url = '/';
    } else if (req.url?.startsWith('/api/')) {
      req.url = req.url.slice(4);
    }

    next();
  });

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

async function bootstrapServer() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  attachServerMiddleware(app);

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
