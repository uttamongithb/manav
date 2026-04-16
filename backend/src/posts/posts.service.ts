import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Visibility = 'public' | 'pending';

export interface PostRecord {
  id: string;
  section: string;
  author: string;
  avatarUrl?: string;
  content: string;
  visibility: Visibility;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByUser: boolean;
  favoritedByUser: boolean;
  moderationStatus?: 'review' | 'published';
}

export interface PostCommentRecord {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly defaultTenantId = 'public-tenant';
  private readonly defaultAuthorId = 'system-author';
  private readonly inMemoryPosts: PostRecord[] = [];
  private readonly inMemoryComments = new Map<string, PostCommentRecord[]>();
  private readonly inMemoryLikes = new Set<string>();
  private readonly inMemoryFavorites = new Set<string>();
  private readonly inMemoryStats = new Map<string, { likeCount: number; commentCount: number }>();

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

  private countToNumber(value: bigint | number | null | undefined): number {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    if (typeof value === 'number') {
      return value;
    }
    return 0;
  }

  private createInMemoryComment(input: { postId: string; content: string; author?: string }): PostCommentRecord {
    return {
      id: `local-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postId: input.postId,
      author: (input.author?.trim() || 'User').slice(0, 50),
      content: input.content.trim(),
      createdAt: new Date().toISOString(),
    };
  }

  private appendInMemoryComment(postId: string, comment: PostCommentRecord) {
    const comments = this.inMemoryComments.get(postId) ?? [];
    this.inMemoryComments.set(postId, [comment, ...comments]);
  }

  private getInMemoryPost(postId: string): PostRecord | undefined {
    return this.inMemoryPosts.find((post) => post.id === postId);
  }

  private actorKey(author?: string): string {
    const normalized = author?.trim().toLowerCase();
    if (!normalized) {
      return 'guest';
    }
    return normalized.slice(0, 50);
  }

  private actorPostKey(author: string | undefined, postId: string): string {
    return `${this.actorKey(author)}:${postId}`;
  }

  private getInMemoryStats(postId: string) {
    const existing = this.inMemoryStats.get(postId);
    if (existing) {
      return existing;
    }

    const initialized = { likeCount: 0, commentCount: 0 };
    this.inMemoryStats.set(postId, initialized);
    return initialized;
  }

  private async ensureBaseEntities() {
    const tenant =
      (await this.prisma.tenant.findFirst({
        where: {
          OR: [{ id: this.defaultTenantId }, { slug: 'public-tenant' }],
        },
      })) ??
      (await this.prisma.tenant.create({
        data: {
          id: this.defaultTenantId,
          name: 'Public Tenant',
          slug: 'public-tenant',
        },
      }));

    const systemAuthor =
      (await this.prisma.user.findFirst({
        where: {
          OR: [
            { id: this.defaultAuthorId },
            { email: 'system@author.local' },
            { username: 'system_author' },
          ],
        },
      })) ??
      (await this.prisma.user.create({
        data: {
          id: this.defaultAuthorId,
          email: 'system@author.local',
          username: 'system_author',
          displayName: 'System Author',
          role: 'publisher',
          status: 'active',
          tenantId: tenant.id,
          isVerified: true,
          emailVerified: true,
        },
      }));

    if (systemAuthor.tenantId !== tenant.id) {
      await this.prisma.user.update({
        where: { id: systemAuthor.id },
        data: { tenantId: tenant.id },
      });
    }
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

  async list(section?: string, actor?: string): Promise<PostRecord[]> {
    const normalizedSection = section ? this.normalizeSection(section) : undefined;
    const collectionSlug = normalizedSection ? this.sectionToSlug(normalizedSection) : undefined;

    try {
      let actorUserId: string | null = null;
      if (actor?.trim()) {
        await this.ensureBaseEntities();
        const actorUser = await this.resolveAuthor(actor);
        actorUserId = actorUser.id;
      }

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
              avatarUrl: true,
            },
          },
          collection: {
            select: {
              title: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
          likes: actorUserId
            ? {
                where: {
                  userId: actorUserId,
                },
                select: {
                  userId: true,
                },
              }
            : false,
          bookmarks: actorUserId
            ? {
                where: {
                  userId: actorUserId,
                },
                select: {
                  userId: true,
                },
              }
            : false,
        },
      });

      return posts.map((post) => ({
        id: post.id,
        section: post.collection?.title ?? normalizedSection ?? 'GENERAL',
        author: post.author.displayName ?? post.author.username,
        avatarUrl: post.author.avatarUrl ?? undefined,
        content: post.body ?? post.excerpt ?? post.title,
        visibility: 'public',
        createdAt: (post.createdAt ?? new Date()).toISOString(),
        likeCount: this.countToNumber(post.likeCount),
        commentCount: post._count.comments,
        likedByUser: Array.isArray(post.likes) && post.likes.length > 0,
        favoritedByUser: Array.isArray(post.bookmarks) && post.bookmarks.length > 0,
      }));
    } catch (error) {
      this.logger.warn(`Failed to list posts: ${String(error)}`);
      const fallback = this.inMemoryPosts
        .filter((post) => !normalizedSection || this.normalizeSection(post.section) === normalizedSection)
        .map((post) => {
          const likedByUser = this.inMemoryLikes.has(this.actorPostKey(actor, post.id));
          const favoritedByUser = this.inMemoryFavorites.has(this.actorPostKey(actor, post.id));
          return {
            ...post,
            likedByUser,
            favoritedByUser,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return fallback;
    }
  }

  async create(input: { section: string; content: string; author?: string }): Promise<PostRecord> {
    const normalizedSection = this.normalizeSection(input.section);
    const trimmedContent = input.content.trim();
    const excerpt = trimmedContent.slice(0, 240);

    try {
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
            moderated: true,
          },
        },
        include: {
          author: {
            select: {
              displayName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      return {
        id: created.id,
        section: normalizedSection,
        author: created.author.displayName ?? created.author.username,
        avatarUrl: created.author.avatarUrl ?? undefined,
        content: created.body ?? created.excerpt ?? created.title,
        visibility: 'public',
        createdAt: (created.createdAt ?? new Date()).toISOString(),
        likeCount: 0,
        commentCount: 0,
        likedByUser: false,
        favoritedByUser: false,
        moderationStatus: 'published',
      };
    } catch (error) {
      this.logger.warn(`Failed to create post in database, using in-memory fallback: ${String(error)}`);
      const fallback: PostRecord = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        section: normalizedSection,
        author: (input.author?.trim() || 'User').slice(0, 50),
        avatarUrl: undefined,
        content: trimmedContent,
        visibility: 'public',
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        likedByUser: false,
        favoritedByUser: false,
        moderationStatus: 'published',
      };
      this.inMemoryPosts.unshift(fallback);
      return fallback;
    }
  }

  async like(
    postId: string,
    input: { author?: string },
  ): Promise<{ postId: string; likeCount: number; commentCount: number; likedByUser: boolean }> {
    const inMemoryPost = this.getInMemoryPost(postId);
    if (inMemoryPost) {
      const key = this.actorPostKey(input.author, postId);
      const hasLiked = this.inMemoryLikes.has(key);
      if (hasLiked) {
        this.inMemoryLikes.delete(key);
        inMemoryPost.likeCount = Math.max(0, inMemoryPost.likeCount - 1);
      } else {
        this.inMemoryLikes.add(key);
        inMemoryPost.likeCount += 1;
      }

      return {
        postId,
        likeCount: inMemoryPost.likeCount,
        commentCount: inMemoryPost.commentCount,
        likedByUser: !hasLiked,
      };
    }

    try {
      await this.ensureBaseEntities();
      const actor = await this.resolveAuthor(input.author);

      const existing = await this.prisma.contentLike.findUnique({
        where: {
          userId_contentId: {
            userId: actor.id,
            contentId: postId,
          },
        },
      });

      let likedByUser = false;

      if (existing) {
        await this.prisma.$transaction([
          this.prisma.contentLike.delete({
            where: {
              userId_contentId: {
                userId: actor.id,
                contentId: postId,
              },
            },
          }),
          this.prisma.content.update({
            where: { id: postId },
            data: {
              likeCount: {
                decrement: 1,
              },
            },
          }),
        ]);
      } else {
        await this.prisma.$transaction([
          this.prisma.contentLike.create({
            data: {
              userId: actor.id,
              contentId: postId,
            },
          }),
          this.prisma.content.update({
            where: { id: postId },
            data: {
              likeCount: {
                increment: 1,
              },
            },
          }),
        ]);
        likedByUser = true;
      }

      const refreshed = await this.prisma.content.findUnique({
        where: { id: postId },
        select: {
          id: true,
          likeCount: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      if (!refreshed) {
        throw new NotFoundException('post not found');
      }

      return {
        postId: refreshed.id,
        likeCount: Math.max(0, this.countToNumber(refreshed.likeCount)),
        commentCount: refreshed._count.comments,
        likedByUser,
      };
    } catch (error) {
      this.logger.warn(`Failed to like post ${postId}: ${String(error)}`);
      const key = this.actorPostKey(input.author, postId);
      const hasLiked = this.inMemoryLikes.has(key);
      if (hasLiked) {
        this.inMemoryLikes.delete(key);
      } else {
        this.inMemoryLikes.add(key);
      }

      const stats = this.getInMemoryStats(postId);
      stats.likeCount = Math.max(0, stats.likeCount + (hasLiked ? -1 : 1));

      return {
        postId,
        likeCount: stats.likeCount,
        commentCount: stats.commentCount,
        likedByUser: !hasLiked,
      };
    }
  }

  async toggleFavorite(
    postId: string,
    input: { author?: string },
  ): Promise<{ postId: string; favoritedByUser: boolean }> {
    const inMemoryPost = this.getInMemoryPost(postId);
    if (inMemoryPost) {
      const key = this.actorPostKey(input.author, postId);
      const hasFavorited = this.inMemoryFavorites.has(key);
      if (hasFavorited) {
        this.inMemoryFavorites.delete(key);
      } else {
        this.inMemoryFavorites.add(key);
      }

      return {
        postId,
        favoritedByUser: !hasFavorited,
      };
    }

    try {
      await this.ensureBaseEntities();
      const actor = await this.resolveAuthor(input.author);

      const existing = await this.prisma.bookmark.findUnique({
        where: {
          userId_contentId: {
            userId: actor.id,
            contentId: postId,
          },
        },
      });

      if (existing) {
        await this.prisma.$transaction([
          this.prisma.bookmark.delete({
            where: {
              userId_contentId: {
                userId: actor.id,
                contentId: postId,
              },
            },
          }),
          this.prisma.content.update({
            where: { id: postId },
            data: {
              bookmarkCount: {
                decrement: 1,
              },
            },
          }),
        ]);

        return {
          postId,
          favoritedByUser: false,
        };
      }

      await this.prisma.$transaction([
        this.prisma.bookmark.create({
          data: {
            userId: actor.id,
            contentId: postId,
          },
        }),
        this.prisma.content.update({
          where: { id: postId },
          data: {
            bookmarkCount: {
              increment: 1,
            },
          },
        }),
      ]);

      return {
        postId,
        favoritedByUser: true,
      };
    } catch (error) {
      this.logger.warn(`Failed to toggle favorite for post ${postId}: ${String(error)}`);
      const key = this.actorPostKey(input.author, postId);
      const hasFavorited = this.inMemoryFavorites.has(key);
      if (hasFavorited) {
        this.inMemoryFavorites.delete(key);
      } else {
        this.inMemoryFavorites.add(key);
      }

      return {
        postId,
        favoritedByUser: !hasFavorited,
      };
    }
  }

  async listFavorites(author?: string): Promise<PostRecord[]> {
    if (!author?.trim()) {
      return [];
    }

    const actorKey = this.actorKey(author);

    try {
      await this.ensureBaseEntities();
      const actor = await this.resolveAuthor(author);

      const bookmarks = await this.prisma.bookmark.findMany({
        where: {
          userId: actor.id,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          content: {
            include: {
              author: {
                select: {
                  displayName: true,
                  username: true,
                  avatarUrl: true,
                },
              },
              collection: {
                select: {
                  title: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                },
              },
              likes: {
                where: {
                  userId: actor.id,
                },
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      return bookmarks
        .filter((bookmark) => bookmark.content.status === 'published')
        .map((bookmark) => ({
          id: bookmark.content.id,
          section: bookmark.content.collection?.title ?? 'GENERAL',
          author: bookmark.content.author.displayName ?? bookmark.content.author.username,
          avatarUrl: bookmark.content.author.avatarUrl ?? undefined,
          content: bookmark.content.body ?? bookmark.content.excerpt ?? bookmark.content.title,
          visibility: 'public',
          createdAt: (bookmark.content.createdAt ?? new Date()).toISOString(),
          likeCount: this.countToNumber(bookmark.content.likeCount),
          commentCount: bookmark.content._count.comments,
          likedByUser: bookmark.content.likes.length > 0,
          favoritedByUser: true,
          moderationStatus: 'published',
        }));
    } catch (error) {
      this.logger.warn(`Failed to list favorites for actor ${actorKey}: ${String(error)}`);
      return this.inMemoryPosts
        .filter((post) => this.inMemoryFavorites.has(`${actorKey}:${post.id}`))
        .map((post) => ({
          ...post,
          likedByUser: this.inMemoryLikes.has(`${actorKey}:${post.id}`),
          favoritedByUser: true,
        }));
    }
  }

  async listComments(postId: string): Promise<PostCommentRecord[]> {
    const inMemoryPost = this.getInMemoryPost(postId);
    if (inMemoryPost) {
      return this.inMemoryComments.get(postId) ?? [];
    }

    try {
      const comments = await this.prisma.comment.findMany({
        where: { contentId: postId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              displayName: true,
              username: true,
            },
          },
        },
      });

      return comments.map((comment) => ({
        id: comment.id,
        postId,
        author: comment.user.displayName ?? comment.user.username,
        content: comment.body,
        createdAt: (comment.createdAt ?? new Date()).toISOString(),
      }));
    } catch (error) {
      this.logger.warn(`Failed to list comments for post ${postId}: ${String(error)}`);
      return this.inMemoryComments.get(postId) ?? [];
    }
  }

  async addComment(
    postId: string,
    input: { content: string; author?: string },
  ): Promise<{ comment: PostCommentRecord; commentCount: number }> {
    const trimmed = input.content.trim();
    if (!trimmed) {
      throw new BadRequestException('comment content is required');
    }

    const inMemoryPost = this.getInMemoryPost(postId);
    if (inMemoryPost) {
      const comment = this.createInMemoryComment({
        postId,
        content: trimmed,
        author: input.author,
      });
      this.appendInMemoryComment(postId, comment);
      inMemoryPost.commentCount += 1;
      return {
        comment,
        commentCount: inMemoryPost.commentCount,
      };
    }

    try {
      await this.ensureBaseEntities();
      const author = await this.resolveAuthor(input.author);

      const created = await this.prisma.comment.create({
        data: {
          contentId: postId,
          userId: author.id,
          body: trimmed,
          status: 'visible',
        },
        include: {
          user: {
            select: {
              displayName: true,
              username: true,
            },
          },
        },
      });

      const commentCount = await this.prisma.comment.count({
        where: { contentId: postId },
      });

      return {
        comment: {
          id: created.id,
          postId,
          author: created.user.displayName ?? created.user.username,
          content: created.body,
          createdAt: (created.createdAt ?? new Date()).toISOString(),
        },
        commentCount,
      };
    } catch (error) {
      this.logger.warn(`Failed to add comment for post ${postId}: ${String(error)}`);
      const shadowComment = this.createInMemoryComment({
        postId,
        content: trimmed,
        author: input.author,
      });
      this.appendInMemoryComment(postId, shadowComment);

      return {
        comment: shadowComment,
        commentCount: (this.inMemoryComments.get(postId) ?? []).length,
      };
    }
  }
}
