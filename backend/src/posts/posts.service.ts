import { Injectable } from '@nestjs/common';
import { ContentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Visibility = 'public';

export interface PostRecord {
  id: string;
  section: string;
  author: string;
  content: string;
  visibility: Visibility;
  createdAt: string;
}

@Injectable()
export class PostsService {
  private readonly defaultTenantId = 'public-tenant';
  private readonly defaultAuthorId = 'system-author';

  constructor(private readonly prisma: PrismaService) {}

  private normalizeSection(section: string): string {
    return section.trim().toUpperCase();
  }

  private sectionToSlug(section: string): string {
    return section.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private sectionToContentType(section: string): ContentType {
    const normalized = this.normalizeSection(section);
    if (normalized === 'SHER') return ContentType.sher;
    if (normalized === 'PROSE') return ContentType.essay;
    return ContentType.article;
  }

  private createSlug(text: string): string {
    const core = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const seed = core || 'post';
    return `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private async ensureBaseEntities() {
    await this.prisma.tenant.upsert({
      where: { id: this.defaultTenantId },
      update: {},
      create: {
        id: this.defaultTenantId,
        name: 'Public Tenant',
        slug: 'public-tenant',
      },
    });

    await this.prisma.user.upsert({
      where: { id: this.defaultAuthorId },
      update: {},
      create: {
        id: this.defaultAuthorId,
        email: 'system@author.local',
        username: 'system_author',
        displayName: 'System Author',
        role: 'publisher',
        status: 'active',
        tenantId: this.defaultTenantId,
        isVerified: true,
        emailVerified: true,
      },
    });
  }

  private async resolveAuthor(author?: string) {
    const name = (author?.trim() || 'Drake').slice(0, 50);
    const usernameBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'author';
    const username = usernameBase.slice(0, 50);
    const email = `${username}@author.local`;

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      return existing;
    }

    const withEmail = await this.prisma.user.findUnique({ where: { email } });
    if (withEmail) {
      return withEmail;
    }

    return this.prisma.user.create({
      data: {
        email,
        username,
        displayName: name,
        role: 'reader',
        status: 'active',
        tenantId: this.defaultTenantId,
        isVerified: true,
        emailVerified: true,
      },
    });
  }

  private async resolveCollection(section: string) {
    const normalizedSection = this.normalizeSection(section);
    const slug = this.sectionToSlug(normalizedSection);

    return this.prisma.collection.upsert({
      where: { slug },
      update: { title: normalizedSection },
      create: {
        title: normalizedSection,
        slug,
        curatorId: this.defaultAuthorId,
        tenantId: this.defaultTenantId,
      },
    });
  }

  async list(section?: string): Promise<PostRecord[]> {
    const normalizedSection = section ? this.normalizeSection(section) : undefined;
    const collectionSlug = normalizedSection ? this.sectionToSlug(normalizedSection) : undefined;

    const posts = await this.prisma.content.findMany({
      where: {
        status: 'published',
        ...(collectionSlug
          ? {
              collection: {
                slug: collectionSlug,
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
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

    return posts.map((post) => ({
      id: post.id,
      section: post.collection?.title ?? normalizedSection ?? 'GENERAL',
      author: post.author.displayName ?? post.author.username,
      content: post.body ?? post.excerpt ?? post.title,
      visibility: 'public',
      createdAt: (post.createdAt ?? new Date()).toISOString(),
    }));
  }

  async create(input: { section: string; content: string; author?: string }): Promise<PostRecord> {
    const normalizedSection = this.normalizeSection(input.section);
    const trimmedContent = input.content.trim();
    const excerpt = trimmedContent.slice(0, 240);

    await this.ensureBaseEntities();

    const [author, collection] = await Promise.all([
      this.resolveAuthor(input.author),
      this.resolveCollection(normalizedSection),
    ]);

    const created = await this.prisma.content.create({
      data: {
        title: excerpt || normalizedSection,
        slug: this.createSlug(excerpt || normalizedSection),
        body: trimmedContent,
        excerpt,
        contentType: this.sectionToContentType(normalizedSection),
        language: 'ur',
        authorId: author.id,
        tenantId: this.defaultTenantId,
        collectionId: collection.id,
        status: 'published',
        publishedAt: new Date(),
        metadata: {
          section: normalizedSection,
          visibility: 'public',
        },
      },
      include: {
        author: {
          select: {
            displayName: true,
            username: true,
          },
        },
      },
    });

    return {
      id: created.id,
      section: normalizedSection,
      author: created.author.displayName ?? created.author.username,
      content: created.body ?? created.excerpt ?? created.title,
      visibility: 'public',
      createdAt: (created.createdAt ?? new Date()).toISOString(),
    };
  }
}
