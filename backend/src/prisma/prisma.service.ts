import 'dotenv/config';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const rawUrl = process.env.DATABASE_URL ?? '';
    if (!rawUrl) {
      throw new Error('DATABASE_URL is missing. Add it to backend/.env before starting the server.');
    }

    const adapterUrl = rawUrl.replace(/^mysql:\/\//, 'mariadb://');
    const adapter = new PrismaMariaDb(adapterUrl);
    super({
      adapter,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn('Database connection is unavailable at startup. Profile DB persistence will retry on request.');
      this.logger.debug(String(error));
    }
  }
}
