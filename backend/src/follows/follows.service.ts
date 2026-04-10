import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type FollowUserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

export type FollowListResponse = {
  users: FollowUserSummary[];
  total: number;
};

export type FollowStatsResponse = {
  userId: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
};

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDisplayName(displayName: string | null, username: string): string {
    return displayName?.trim() || username;
  }

  private normalizeAvatar(avatarUrl: string | null): string {
    return avatarUrl?.trim() || '';
  }

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async follow(currentUserId: string, targetUserId: string): Promise<FollowStatsResponse> {
    const followerId = currentUserId.trim();
    const followingId = targetUserId.trim();

    if (!followingId) {
      throw new BadRequestException('targetUserId is required');
    }

    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    await Promise.all([
      this.assertUserExists(followerId),
      this.assertUserExists(followingId),
    ]);

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      update: {},
      create: {
        followerId,
        followingId,
      },
    });

    return this.getStats(followingId, followerId);
  }

  async unfollow(currentUserId: string, targetUserId: string): Promise<FollowStatsResponse> {
    const followerId = currentUserId.trim();
    const followingId = targetUserId.trim();

    if (!followingId) {
      throw new BadRequestException('targetUserId is required');
    }

    if (followerId === followingId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });

    return this.getStats(followingId, followerId);
  }

  async getFollowers(userId: string): Promise<FollowListResponse> {
    const resolvedUserId = userId.trim();
    await this.assertUserExists(resolvedUserId);

    const rows = await this.prisma.follow.findMany({
      where: { followingId: resolvedUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const users = rows.map((row) => ({
      id: row.follower.id,
      username: row.follower.username,
      displayName: this.normalizeDisplayName(
        row.follower.displayName,
        row.follower.username,
      ),
      avatarUrl: this.normalizeAvatar(row.follower.avatarUrl),
    }));

    return {
      users,
      total: users.length,
    };
  }

  async getFollowing(userId: string): Promise<FollowListResponse> {
    const resolvedUserId = userId.trim();
    await this.assertUserExists(resolvedUserId);

    const rows = await this.prisma.follow.findMany({
      where: { followerId: resolvedUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const users = rows.map((row) => ({
      id: row.following.id,
      username: row.following.username,
      displayName: this.normalizeDisplayName(
        row.following.displayName,
        row.following.username,
      ),
      avatarUrl: this.normalizeAvatar(row.following.avatarUrl),
    }));

    return {
      users,
      total: users.length,
    };
  }

  async getStats(userId: string, viewerUserId?: string): Promise<FollowStatsResponse> {
    const resolvedUserId = userId.trim();
    await this.assertUserExists(resolvedUserId);

    const [followersCount, followingCount, isFollowing] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: resolvedUserId } }),
      this.prisma.follow.count({ where: { followerId: resolvedUserId } }),
      viewerUserId
        ? this.prisma.follow
            .count({
              where: {
                followerId: viewerUserId,
                followingId: resolvedUserId,
              },
            })
            .then((count) => count > 0)
        : Promise.resolve(false),
    ]);

    return {
      userId: resolvedUserId,
      followersCount,
      followingCount,
      isFollowing,
    };
  }
}
