import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ProfileRecord = {
  name: string;
  role: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  bio: string;
  avatarUrl: string;
};

const DEFAULT_PROFILE: ProfileRecord = {
  name: 'User',
  role: 'Member',
  city: '',
  state: '',
  country: '',
  timezone: '',
  bio: '',
  avatarUrl: '',
};

@Injectable()
export class ProfileService {
  private readonly fallbackUserId = 'demo-user';

  constructor(private readonly prisma: PrismaService) {}

  private async resolveUserContext(userId?: string, displayNameHint?: string) {
    const resolvedUserId = userId?.trim() || this.fallbackUserId;

    const user = await this.prisma.user.findUnique({
      where: { id: resolvedUserId },
      select: {
        id: true,
        displayName: true,
        role: true,
        avatarUrl: true,
      },
    });

    return {
      userId: resolvedUserId,
      displayName: user?.displayName?.trim() || displayNameHint?.trim() || DEFAULT_PROFILE.name,
      role: user?.role ? String(user.role) : DEFAULT_PROFILE.role,
      avatarUrl: user?.avatarUrl?.trim() || DEFAULT_PROFILE.avatarUrl,
    };
  }

  async getProfile(userId?: string, displayNameHint?: string): Promise<ProfileRecord> {
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
          city: DEFAULT_PROFILE.city,
          state: DEFAULT_PROFILE.state,
          country: DEFAULT_PROFILE.country,
          timezone: DEFAULT_PROFILE.timezone,
          bio: DEFAULT_PROFILE.bio,
          avatarUrl: context.avatarUrl,
        },
      });

      return {
        name: created.name,
        role: created.role,
        city: created.city,
        state: created.state,
        country: created.country,
        timezone: created.timezone,
        bio: created.bio,
        avatarUrl: created.avatarUrl ?? context.avatarUrl,
      };
    }

    return {
      name: record.name,
      role: record.role,
      city: record.city,
      state: record.state,
      country: record.country,
      timezone: record.timezone,
      bio: record.bio,
      avatarUrl: record.avatarUrl ?? context.avatarUrl,
    };
  }

  async updateProfile(
    input: Partial<ProfileRecord>,
    userId?: string,
    displayNameHint?: string,
  ): Promise<ProfileRecord> {
    const context = await this.resolveUserContext(userId, displayNameHint);
    const current = await this.getProfile(context.userId);

    const updated = await this.prisma.userProfile.upsert({
      where: { userId: context.userId },
      update: {
        name: (input.name ?? current.name).trim() || current.name,
        role: (input.role ?? current.role).trim() || current.role,
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
        city: (input.city ?? DEFAULT_PROFILE.city).trim() || DEFAULT_PROFILE.city,
        state: (input.state ?? DEFAULT_PROFILE.state).trim() || DEFAULT_PROFILE.state,
        country: (input.country ?? DEFAULT_PROFILE.country).trim() || DEFAULT_PROFILE.country,
        timezone: (input.timezone ?? DEFAULT_PROFILE.timezone).trim() || DEFAULT_PROFILE.timezone,
        bio: (input.bio ?? DEFAULT_PROFILE.bio).trim() || DEFAULT_PROFILE.bio,
        avatarUrl: (input.avatarUrl ?? context.avatarUrl).trim() || context.avatarUrl,
      },
    });

    return {
      name: updated.name,
      role: updated.role,
      city: updated.city,
      state: updated.state,
      country: updated.country,
      timezone: updated.timezone,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl ?? context.avatarUrl,
    };
  }
}
