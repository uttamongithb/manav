import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';

function resolveUploadsPath() {
  const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
  return join(basePath, 'uploads');
}

function resolveCorsOrigins(): string[] {
  const rawOrigins = process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '';
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, '').toLowerCase())
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

      const normalizedOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();

      if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  attachServerMiddleware(app);

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
