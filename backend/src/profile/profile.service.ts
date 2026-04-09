import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

function resolveDataDir() {
  const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
  return join(basePath, 'data');
}

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
  private readonly dataDir = resolveDataDir();
  private readonly fallbackFile = join(this.dataDir, 'profile.json');

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(): Promise<ProfileRecord> {
    try {
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

        const result = {
          name: created.name,
          role: created.role,
          city: created.city,
          state: created.state,
          country: created.country,
          timezone: created.timezone,
          bio: created.bio,
          avatarUrl: created.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
        };

        await this.writeFallbackProfile(result);
        return result;
      }

      const result = {
        name: record.name,
        role: record.role,
        city: record.city,
        state: record.state,
        country: record.country,
        timezone: record.timezone,
        bio: record.bio,
        avatarUrl: record.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
      };
      await this.writeFallbackProfile(result);
      return result;
    } catch {
      return this.readFallbackProfile();
    }
  }

  async updateProfile(input: Partial<ProfileRecord>): Promise<ProfileRecord> {
    const current = await this.getProfile();

    try {
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

      const result = {
        name: updated.name,
        role: updated.role,
        city: updated.city,
        state: updated.state,
        country: updated.country,
        timezone: updated.timezone,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
      };
      await this.writeFallbackProfile(result);
      return result;
    } catch {
      const fallbackUpdated: ProfileRecord = {
        name: (input.name ?? current.name).trim() || current.name,
        role: (input.role ?? current.role).trim() || current.role,
        city: (input.city ?? current.city).trim() || current.city,
        state: (input.state ?? current.state).trim() || current.state,
        country: (input.country ?? current.country).trim() || current.country,
        timezone: (input.timezone ?? current.timezone).trim() || current.timezone,
        bio: (input.bio ?? current.bio).trim() || current.bio,
        avatarUrl: (input.avatarUrl ?? current.avatarUrl).trim() || current.avatarUrl,
      };

      await this.writeFallbackProfile(fallbackUpdated);
      return fallbackUpdated;
    }
  }

  private async readFallbackProfile(): Promise<ProfileRecord> {
    await this.ensureFallbackFile();

    try {
      const raw = await readFile(this.fallbackFile, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ProfileRecord>;

      return {
        name: parsed.name?.trim() || DEFAULT_PROFILE.name,
        role: parsed.role?.trim() || DEFAULT_PROFILE.role,
        city: parsed.city?.trim() || DEFAULT_PROFILE.city,
        state: parsed.state?.trim() || DEFAULT_PROFILE.state,
        country: parsed.country?.trim() || DEFAULT_PROFILE.country,
        timezone: parsed.timezone?.trim() || DEFAULT_PROFILE.timezone,
        bio: parsed.bio?.trim() || DEFAULT_PROFILE.bio,
        avatarUrl: parsed.avatarUrl?.trim() || DEFAULT_PROFILE.avatarUrl,
      };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  private async writeFallbackProfile(profile: ProfileRecord): Promise<void> {
    await this.ensureFallbackFile();
    await writeFile(this.fallbackFile, JSON.stringify(profile, null, 2), 'utf8');
  }

  private async ensureFallbackFile(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });

    try {
      await readFile(this.fallbackFile, 'utf8');
    } catch {
      await writeFile(this.fallbackFile, JSON.stringify(DEFAULT_PROFILE, null, 2), 'utf8');
    }
  }
}
