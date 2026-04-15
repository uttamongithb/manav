import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AdminPendingPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  createdAt: string;
};

@Injectable()
export class AdminService {
  private readonly defaultTenantId = 'public-tenant';
  private readonly defaultTenantSlug = 'public-tenant';

  constructor(private readonly prisma: PrismaService) {}

  private async ensurePublicTenant() {
    return this.prisma.tenant.upsert({
      where: { id: this.defaultTenantId },
      update: {},
      create: {
        id: this.defaultTenantId,
        name: 'Public Tenant',
        slug: this.defaultTenantSlug,
      },
    });
  }

  async getPrivacyPolicy() {
    const tenant = await this.ensurePublicTenant();
    const settings = (tenant.settings as Record<string, unknown> | null) ?? {};
    const privacy = (settings.privacyPolicy as Record<string, unknown> | undefined) ?? {};

    return {
      content:
        typeof privacy.content === 'string' && privacy.content.trim().length > 0
          ? privacy.content
          : 'Privacy policy has not been set yet.',
      updatedAt:
        typeof privacy.updatedAt === 'string' ? privacy.updatedAt : null,
      updatedBy:
        typeof privacy.updatedBy === 'string' ? privacy.updatedBy : null,
    };
  }

  async updatePrivacyPolicy(content: string, adminUserId: string) {
    const tenant = await this.ensurePublicTenant();
    const settings = (tenant.settings as Record<string, unknown> | null) ?? {};

    const nextSettings = {
      ...settings,
      privacyPolicy: {
        content,
        updatedAt: new Date().toISOString(),
        updatedBy: adminUserId,
      },
    };

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        settings: nextSettings,
      },
    });

    return this.getPrivacyPolicy();
  }

  async listPendingPosts(): Promise<AdminPendingPost[]> {
    const rows = await this.prisma.content.findMany({
      where: { status: 'review' },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            displayName: true,
            username: true,
          },
        },
        collection: {
          select: {
            title: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      section: row.collection?.title ?? 'GENERAL',
      author: row.author.displayName ?? row.author.username,
      content: row.body ?? row.excerpt ?? row.title,
      createdAt: (row.createdAt ?? new Date()).toISOString(),
    }));
  }

  async approvePost(postId: string) {
    const updated = await this.prisma.content.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        metadata: {
          visibility: 'public',
          moderated: true,
        },
      },
      include: {
        author: {
          select: {
            displayName: true,
            username: true,
          },
        },
        collection: {
          select: {
            title: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      section: updated.collection?.title ?? 'GENERAL',
      author: updated.author.displayName ?? updated.author.username,
      content: updated.body ?? updated.excerpt ?? updated.title,
      createdAt: (updated.createdAt ?? new Date()).toISOString(),
      moderationStatus: 'published' as const,
    };
  }
}
