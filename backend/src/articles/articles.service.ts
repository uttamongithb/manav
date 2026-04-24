import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArticleSection, ContentStatus } from '@prisma/client';

export interface ArticleDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  section: ArticleSection;
  author: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  status: ContentStatus;
  viewCount: number;
  likeCount: number;
  isPinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  likedByUser?: boolean;
  commentCount?: number;
}

@Injectable()
export class ArticlesService {
  private readonly defaultTenantId = 'public-tenant';

  constructor(private readonly prisma: PrismaService) {}

  private formatArticle(article: any, likedByUser: boolean = false): ArticleDTO {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      coverImageUrl: article.coverImageUrl,
      section: article.section,
      author: {
        id: article.author.id,
        displayName: article.author.displayName,
        avatarUrl: article.author.avatarUrl,
      },
      status: article.status,
      viewCount: Number(article.viewCount),
      likeCount: Number(article.likeCount),
      isPinned: article.isPinned,
      publishedAt: article.publishedAt?.toISOString() || null,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      likedByUser,
      commentCount: article._count?.comments || 0,
    };
  }

  async listBySection(section: ArticleSection, userId?: string) {
    const articles = await this.prisma.article.findMany({
      where: {
        section,
        status: 'published',
        deletedAt: null,
      },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: 50,
    });

    if (!userId) {
      return articles.map((a) => this.formatArticle(a, false));
    }

    const likedArticleIds = await this.prisma.articleLike.findMany({
      where: { userId },
      select: { articleId: true },
    });

    const likedSet = new Set(likedArticleIds.map((l) => l.articleId));

    return articles.map((a) => this.formatArticle(a, likedSet.has(a.id)));
  }

  async getById(id: string, userId?: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!article || (article.status !== 'published' && article.deletedAt)) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count
    await this.prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const likedByUser =
      userId && (await this.prisma.articleLike.findUnique({
        where: { userId_articleId: { userId, articleId: id } },
      }))
        ? true
        : false;

    return this.formatArticle(article, likedByUser);
  }

  async create(
    section: ArticleSection,
    data: {
      title: string;
      content: string;
      excerpt?: string;
      coverImageUrl?: string;
      status?: ContentStatus;
      publishedAt?: Date;
    },
    authorId: string,
  ) {
    if (!data.title?.trim() || !data.content?.trim()) {
      throw new BadRequestException('Title and content are required');
    }

    const slug = this.generateSlug(data.title);

    const article = await this.prisma.article.create({
      data: {
        section,
        title: data.title.trim(),
        slug,
        content: data.content.trim(),
        excerpt: data.excerpt?.trim(),
        coverImageUrl: data.coverImageUrl,
        authorId,
        tenantId: this.defaultTenantId,
        status: data.status || 'draft',
        publishedAt: data.status === 'published' ? new Date() : data.publishedAt,
      },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
    });

    return this.formatArticle(article, false);
  }

  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      coverImageUrl?: string;
      status?: ContentStatus;
    },
    authorId: string,
  ) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== authorId) {
      throw new BadRequestException('Unauthorized to update this article');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.content) updateData.content = data.content.trim();
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt?.trim();
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'published') {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
    });

    return this.formatArticle(updated, false);
  }

  async delete(id: string, authorId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== authorId) {
      throw new BadRequestException('Unauthorized to delete this article');
    }

    await this.prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async toggleLike(articleId: string, userId: string) {
    const existing = await this.prisma.articleLike.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });

    if (existing) {
      await this.prisma.articleLike.delete({
        where: { userId_articleId: { userId, articleId } },
      });

      await this.prisma.article.update({
        where: { id: articleId },
        data: { likeCount: { decrement: 1 } },
      });

      return { liked: false };
    } else {
      await this.prisma.articleLike.create({
        data: { userId, articleId },
      });

      await this.prisma.article.update({
        where: { id: articleId },
        data: { likeCount: { increment: 1 } },
      });

      return { liked: true };
    }
  }

  async getComments(articleId: string) {
    return this.prisma.articleComment.findMany({
      where: {
        articleId,
        status: 'visible',
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(articleId: string, content: string, userId: string) {
    if (!content?.trim()) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const comment = await this.prisma.articleComment.create({
      data: {
        articleId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return comment;
  }

  private generateSlug(title: string): string {
    const base = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${base}-${Date.now()}`;
  }

  async getAllSections() {
    return Object.values(ArticleSection);
  }

  async getSectionStats(section: ArticleSection) {
    const [published, draft, total] = await Promise.all([
      this.prisma.article.count({
        where: { section, status: 'published', deletedAt: null },
      }),
      this.prisma.article.count({
        where: { section, status: 'draft', deletedAt: null },
      }),
      this.prisma.article.count({
        where: { section, deletedAt: null },
      }),
    ]);

    return { section, published, draft, total };
  }
}
