import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type BannerSlide = {
  title: string;
  subtitle: string;
  image: string;
  tag: string;
};

type AdminDashboardSummary = {
  totalUsers: number;
  totalPosts: number;
  pendingPosts: number;
  publishedPosts: number;
  bannerSlides: number;
};

type AdminPendingPost = {
  id: string;
  section: string;
  author: string;
  content: string;
  createdAt: string;
};

const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    title: 'A Living Library of Words',
    subtitle: 'Move through poetry, essays, and reflections in one continuous reading experience.',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2200&q=80',
    tag: 'Editorial Collection',
  },
  {
    title: 'Stories That Travel Across Eras',
    subtitle: 'From classic voices to new writers, discover writing that stays with you long after reading.',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=80',
    tag: 'Curated Timeline',
  },
  {
    title: 'Designed for Reading Flow',
    subtitle: 'Clean typography, focused rhythm, and thoughtful pacing built for desktop and mobile alike.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=80',
    tag: 'Reader First',
  },
];

@Injectable()
export class AdminService {
  private readonly defaultTenantId = 'public-tenant';
  private readonly defaultTenantSlug = 'public-tenant';

  constructor(private readonly prisma: PrismaService) {}

  private getSettingsObject(rawSettings: unknown) {
    return (rawSettings as Record<string, unknown> | null) ?? {};
  }

  private getHomepageSettings(settings: Record<string, unknown>) {
    return (settings.homepage as Record<string, unknown> | undefined) ?? {};
  }

  private normalizeBannerSlides(input: unknown): BannerSlide[] {
    if (!Array.isArray(input)) {
      return DEFAULT_BANNER_SLIDES;
    }

    const slides = input
      .map((item) => {
        const slide = item as Partial<BannerSlide> | null | undefined;
        const title = typeof slide?.title === 'string' ? slide.title.trim() : '';
        const subtitle = typeof slide?.subtitle === 'string' ? slide.subtitle.trim() : '';
        const image = typeof slide?.image === 'string' ? slide.image.trim() : '';
        const tag = typeof slide?.tag === 'string' ? slide.tag.trim() : '';

        if (!title || !subtitle || !image || !tag) {
          return null;
        }

        return { title, subtitle, image, tag };
      })
      .filter((slide): slide is BannerSlide => !!slide);

    return slides.length > 0 ? slides : DEFAULT_BANNER_SLIDES;
  }

  private async updateSettings(nextSettings: Record<string, unknown>) {
    const tenant = await this.ensurePublicTenant();

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        settings: nextSettings as Prisma.InputJsonValue,
      },
    });

    return nextSettings;
  }

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
    const settings = this.getSettingsObject(tenant.settings);
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
    const settings = this.getSettingsObject(tenant.settings);

    const nextSettings = {
      ...settings,
      privacyPolicy: {
        content,
        updatedAt: new Date().toISOString(),
        updatedBy: adminUserId,
      },
    };

    await this.updateSettings(nextSettings);

    return this.getPrivacyPolicy();
  }

  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const tenant = await this.ensurePublicTenant();
    const settings = this.getSettingsObject(tenant.settings);
    const homepage = this.getHomepageSettings(settings);
    const heroSlides = this.normalizeBannerSlides(homepage.heroSlides);

    const [totalUsers, totalPosts, pendingPosts, publishedPosts] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: tenant.id } }),
      this.prisma.content.count({ where: { tenantId: tenant.id } }),
      this.prisma.content.count({ where: { tenantId: tenant.id, status: 'review' } }),
      this.prisma.content.count({ where: { tenantId: tenant.id, status: 'published' } }),
    ]);

    return {
      totalUsers,
      totalPosts,
      pendingPosts,
      publishedPosts,
      bannerSlides: heroSlides.length,
    };
  }

  async getBannerSlides() {
    const tenant = await this.ensurePublicTenant();
    const settings = this.getSettingsObject(tenant.settings);
    const homepage = this.getHomepageSettings(settings);

    return {
      slides: this.normalizeBannerSlides(homepage.heroSlides),
      updatedAt: typeof homepage.updatedAt === 'string' ? homepage.updatedAt : null,
      updatedBy: typeof homepage.updatedBy === 'string' ? homepage.updatedBy : null,
    };
  }

  async updateBannerSlides(slides: unknown, adminUserId: string) {
    const tenant = await this.ensurePublicTenant();
    const settings = this.getSettingsObject(tenant.settings);

    const nextSettings = {
      ...settings,
      homepage: {
        heroSlides: this.normalizeBannerSlides(slides),
        updatedAt: new Date().toISOString(),
        updatedBy: adminUserId,
      },
    };

    await this.updateSettings(nextSettings);

    return this.getBannerSlides();
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
