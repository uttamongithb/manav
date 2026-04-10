import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const rawUrl = process.env.DATABASE_URL ?? '';
    if (!rawUrl) {
      throw new Error('DATABASE_URL is missing. Add it to backend/.env before starting the server.');
    }

    const databaseUrl = rawUrl.includes('?')
      ? `${rawUrl}&connection_limit=1&pool_timeout=30`
      : `${rawUrl}?connection_limit=1&pool_timeout=30`;
    const adapterUrl = databaseUrl.replace(/^mysql:\/\//, 'mariadb://');
    const adapter = new PrismaMariaDb(adapterUrl);
    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
