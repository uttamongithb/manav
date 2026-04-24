import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

export type ProfileRecord = {
  name: string;
  role: string;
  visibility: 'public' | 'private';
  city: string;
  state: string;
  country: string;
  timezone: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
};

const DEFAULT_PROFILE: ProfileRecord = {
  name: 'User',
  role: 'Member',
  visibility: 'public',
  city: '',
  state: '',
  country: '',
  timezone: '',
  bio: '',
  avatarUrl: '',
  followersCount: 0,
  followingCount: 0,
};

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveUploadsPath() {
    const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
    return join(basePath, 'uploads');
  }

  private isDataUrl(value: string) {
    return value.startsWith('data:');
  }

  private extractUploadsFilename(value: string) {
    try {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        const parsed = new URL(value);
        const uploadsIndex = parsed.pathname.indexOf('/uploads/');
        if (uploadsIndex === -1) return null;
        return basename(parsed.pathname.slice(uploadsIndex + '/uploads/'.length));
      }
    } catch {
      // Fall through to pathname parsing.
    }

    const match = value.match(/(?:^|\/)(?:uploads\/)([^\s?#/]+)$/i);
    return match ? match[1] : null;
  }

  private async convertLegacyAvatarUrl(avatarUrl: string | null): Promise<string> {
    if (!avatarUrl) return '';

    const trimmed = avatarUrl.trim();
    if (!trimmed || this.isDataUrl(trimmed)) {
      return trimmed;
    }

    const filename = this.extractUploadsFilename(trimmed);
    if (!filename) {
      return trimmed;
    }

    const filePath = join(this.resolveUploadsPath(), filename);
    if (!existsSync(filePath)) {
      return trimmed;
    }

    const mimeType =
      filename.toLowerCase().endsWith('.png')
        ? 'image/png'
        : filename.toLowerCase().endsWith('.gif')
          ? 'image/gif'
          : filename.toLowerCase().endsWith('.webp')
            ? 'image/webp'
            : filename.toLowerCase().endsWith('.svg')
              ? 'image/svg+xml'
              : 'image/jpeg';

    const buffer = await readFile(filePath);
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  private async getFollowCounts(userId: string): Promise<{
    followersCount: number;
    followingCount: number;
  }> {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return { followersCount, followingCount };
  }

  private normalizeVisibility(value: unknown): 'public' | 'private' {
    return value === 'private' ? 'private' : 'public';
  }

  private readVisibility(record: { visibility?: unknown }): 'public' | 'private' {
    return this.normalizeVisibility(record.visibility);
  }

  private async resolveUserContext(userId: string, displayNameHint?: string) {
    const resolvedUserId = userId.trim();

    const user = await this.prisma.user.findUnique({
      where: { id: resolvedUserId },
      select: {
        id: true,
        displayName: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found for profile operations');
    }

    return {
      userId: resolvedUserId,
      displayName: user?.displayName?.trim() || displayNameHint?.trim() || DEFAULT_PROFILE.name,
      role: user?.role ? String(user.role) : DEFAULT_PROFILE.role,
      avatarUrl: await this.convertLegacyAvatarUrl(user?.avatarUrl) || DEFAULT_PROFILE.avatarUrl,
    };
  }

  async getProfile(userId: string, displayNameHint?: string): Promise<ProfileRecord> {
    const context = await this.resolveUserContext(userId, displayNameHint);

    const record = await this.prisma.userProfile.findUnique({
      where: { userId: context.userId },
    });

    if (!record) {
      const created = await this.prisma.userProfile.create({
        data: {
          userId: context.userId,
          name: context.displayName,
          role: context.role,
          visibility: DEFAULT_PROFILE.visibility,
          city: DEFAULT_PROFILE.city,
          state: DEFAULT_PROFILE.state,
          country: DEFAULT_PROFILE.country,
          timezone: DEFAULT_PROFILE.timezone,
          bio: DEFAULT_PROFILE.bio,
          avatarUrl: context.avatarUrl,
        },
      });

      const counts = await this.getFollowCounts(context.userId);

      return {
        name: created.name,
        role: created.role,
        visibility: this.readVisibility(created as { visibility?: unknown }),
        city: created.city,
        state: created.state,
        country: created.country,
        timezone: created.timezone,
        bio: created.bio,
        avatarUrl: created.avatarUrl ?? context.avatarUrl,
        followersCount: counts.followersCount,
        followingCount: counts.followingCount,
      };
    }

    const counts = await this.getFollowCounts(context.userId);

    return {
      name: record.name,
      role: record.role,
      visibility: this.readVisibility(record as { visibility?: unknown }),
      city: record.city,
      state: record.state,
      country: record.country,
      timezone: record.timezone,
      bio: record.bio,
      avatarUrl: (await this.convertLegacyAvatarUrl(record.avatarUrl)) || context.avatarUrl,
      followersCount: counts.followersCount,
      followingCount: counts.followingCount,
    };
  }

  async updateProfile(
    input: Partial<ProfileRecord>,
    userId: string,
    displayNameHint?: string,
  ): Promise<ProfileRecord> {
    const context = await this.resolveUserContext(userId, displayNameHint);
    const current = await this.getProfile(context.userId);
    const nextAvatarUrl = typeof input.avatarUrl === 'string' ? input.avatarUrl.trim() : '';

    const updated = await this.prisma.userProfile.upsert({
      where: { userId: context.userId },
      update: {
        name: (input.name ?? current.name).trim() || current.name,
        role: (input.role ?? current.role).trim() || current.role,
        visibility: this.normalizeVisibility(input.visibility ?? current.visibility),
        city: (input.city ?? current.city).trim() || current.city,
        state: (input.state ?? current.state).trim() || current.state,
        country: (input.country ?? current.country).trim() || current.country,
        timezone: (input.timezone ?? current.timezone).trim() || current.timezone,
        bio: (input.bio ?? current.bio).trim() || current.bio,
        avatarUrl: (input.avatarUrl ?? current.avatarUrl).trim() || current.avatarUrl,
      },
      create: {
        userId: context.userId,
        name: (input.name ?? context.displayName).trim() || context.displayName,
        role: (input.role ?? context.role).trim() || context.role,
        visibility: this.normalizeVisibility(input.visibility ?? DEFAULT_PROFILE.visibility),
        city: (input.city ?? DEFAULT_PROFILE.city).trim() || DEFAULT_PROFILE.city,
        state: (input.state ?? DEFAULT_PROFILE.state).trim() || DEFAULT_PROFILE.state,
        country: (input.country ?? DEFAULT_PROFILE.country).trim() || DEFAULT_PROFILE.country,
        timezone: (input.timezone ?? DEFAULT_PROFILE.timezone).trim() || DEFAULT_PROFILE.timezone,
        bio: (input.bio ?? DEFAULT_PROFILE.bio).trim() || DEFAULT_PROFILE.bio,
        avatarUrl: (input.avatarUrl ?? context.avatarUrl).trim() || context.avatarUrl,
      },
    });

    const normalizedAvatarUrl = await this.convertLegacyAvatarUrl(updated.avatarUrl ?? context.avatarUrl);

    if (normalizedAvatarUrl && normalizedAvatarUrl !== updated.avatarUrl) {
      await this.prisma.userProfile.update({
        where: { userId: context.userId },
        data: { avatarUrl: normalizedAvatarUrl },
      });

      await this.prisma.user.update({
        where: { id: context.userId },
        data: { avatarUrl: normalizedAvatarUrl },
      });
    }

    if (nextAvatarUrl) {
      await this.prisma.user.update({
        where: { id: context.userId },
        data: {
          avatarUrl: nextAvatarUrl,
        },
      });
    }

    return {
      name: updated.name,
      role: updated.role,
      visibility: this.readVisibility(updated as { visibility?: unknown }),
      city: updated.city,
      state: updated.state,
      country: updated.country,
      timezone: updated.timezone,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl ?? context.avatarUrl,
      followersCount: current.followersCount,
      followingCount: current.followingCount,
    };
  }
}
