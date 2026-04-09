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
  name: 'Drake',
  role: 'Writer',
  city: 'Los Angeles',
  state: 'California',
  country: 'United States',
  timezone: 'PST (UTC-08:00)',
  bio: 'Urdu poetry enthusiast sharing verses and literary reflections.',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
};

@Injectable()
export class ProfileService {
  private readonly defaultUserId = 'demo-user';

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(): Promise<ProfileRecord> {
    const record = await this.prisma.userProfile.findUnique({
      where: { userId: this.defaultUserId },
    });

    if (!record) {
      const created = await this.prisma.userProfile.create({
        data: {
          userId: this.defaultUserId,
          name: DEFAULT_PROFILE.name,
          role: DEFAULT_PROFILE.role,
          city: DEFAULT_PROFILE.city,
          state: DEFAULT_PROFILE.state,
          country: DEFAULT_PROFILE.country,
          timezone: DEFAULT_PROFILE.timezone,
          bio: DEFAULT_PROFILE.bio,
          avatarUrl: DEFAULT_PROFILE.avatarUrl,
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
        avatarUrl: created.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
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
      avatarUrl: record.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
    };
  }

  async updateProfile(input: Partial<ProfileRecord>): Promise<ProfileRecord> {
    const current = await this.getProfile();

    const updated = await this.prisma.userProfile.upsert({
      where: { userId: this.defaultUserId },
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
        userId: this.defaultUserId,
        name: (input.name ?? DEFAULT_PROFILE.name).trim() || DEFAULT_PROFILE.name,
        role: (input.role ?? DEFAULT_PROFILE.role).trim() || DEFAULT_PROFILE.role,
        city: (input.city ?? DEFAULT_PROFILE.city).trim() || DEFAULT_PROFILE.city,
        state: (input.state ?? DEFAULT_PROFILE.state).trim() || DEFAULT_PROFILE.state,
        country: (input.country ?? DEFAULT_PROFILE.country).trim() || DEFAULT_PROFILE.country,
        timezone: (input.timezone ?? DEFAULT_PROFILE.timezone).trim() || DEFAULT_PROFILE.timezone,
        bio: (input.bio ?? DEFAULT_PROFILE.bio).trim() || DEFAULT_PROFILE.bio,
        avatarUrl: (input.avatarUrl ?? DEFAULT_PROFILE.avatarUrl).trim() || DEFAULT_PROFILE.avatarUrl,
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
      avatarUrl: updated.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
    };
  }
}
