import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { readdir, stat, unlink } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';

type PageSection = {
  heading: string;
  body: string;
};

type PageContent = {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  sections: PageSection[];
};

type PoetStats = {
  sher: number;
  ghazal: number;
  nazm: number;
};

type PoetRecord = {
  id: string;
  name: string;
  years: string;
  location: string;
  avatarUrl: string;
  heroImage: string;
  group: string[];
  shortBio: string;
  signatureLine: string;
  stats: PoetStats;
};

type AdminUserRecord = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  followersCount: number;
  followingCount: number;
  contentCount: number;
};

type MediaAssetRecord = {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  updatedAt: string;
};

type ManagementSummary = {
  unreadMessages: number;
  totalPoets: number;
  totalPages: number;
};

type EditablePageSlug = 'about-us' | 'contact-us' | 'links' | 'archives' | 'ebook-download';

const EDITABLE_PAGE_ORDER: EditablePageSlug[] = ['about-us', 'contact-us', 'links', 'archives', 'ebook-download'];

function isEditablePageSlug(value: string): value is EditablePageSlug {
  return (EDITABLE_PAGE_ORDER as string[]).includes(value);
}

const DEFAULT_PAGE_CONTENTS: Record<EditablePageSlug, PageContent> = {
  'about-us': {
    title: 'About INSAAN',
    subtitle:
      'A literary platform designed to make poetry, prose, and thoughtful writing accessible, discoverable, and beautifully presented.',
    sections: [
      {
        heading: 'Who We Are',
        body: 'INSAAN is a focused reading and writing space where classic voices and contemporary authors can be explored in one place. We blend editorial curation with a modern, distraction-light interface.',
      },
      {
        heading: 'What We Build',
        body: 'From short-form sher to long-form essays, our product experience is built around clarity, visual rhythm, and meaningful discovery so readers can move naturally across literary formats.',
      },
      {
        heading: 'Our Design Ethos',
        body: 'We prioritize elegance and readability. Typography, spacing, and color are tuned to support long reading sessions while keeping navigation quick and intuitive.',
      },
      {
        heading: 'Community First',
        body: 'Writers and readers grow this ecosystem together. Every section, profile, and timeline component is designed to celebrate voice, context, and literary depth.',
      },
    ],
  },
  'contact-us': {
    title: 'Get In Touch',
    subtitle:
      'Whether you have feedback, collaboration ideas, or support questions, we would love to hear from you.',
    sections: [
      {
        heading: 'General Support',
        body: 'For account help, sign-in issues, or profile-related questions, contact our support team with a short description and screenshots when possible.',
      },
      {
        heading: 'Editorial & Partnerships',
        body: 'If you are a publisher, literary group, or editor interested in collaboration, reach out with your proposal and publishing goals.',
      },
      {
        heading: 'Response Time',
        body: 'Most messages receive a response within 24 to 48 hours on business days. We prioritize critical account and platform access concerns first.',
      },
      {
        heading: 'Best Contact Channel',
        body: 'Use your registered email when contacting us so we can verify account context quickly and provide faster resolution.',
      },
    ],
    ctaLabel: 'Back to Home',
    ctaHref: '/',
  },
  links: {
    title: 'Platform Navigation',
    subtitle: 'A quick jump table to major reading, writing, and profile areas across INSAAN.',
    sections: [
      {
        heading: 'Reading',
        body: 'Browse Public Feed, Poets, and thematic sections to discover new voices and revisit timeless works.',
      },
      {
        heading: 'Writing',
        body: 'Use your profile composer to publish pieces across supported categories and manage visibility settings.',
      },
      {
        heading: 'Community',
        body: 'Follow writers, explore profile pages, and engage with contributions in section timelines.',
      },
      {
        heading: 'Account',
        body: 'Manage sign-in, profile updates, avatar settings, and personal information controls.',
      },
    ],
    ctaLabel: 'Go to Profile',
    ctaHref: '/my-profile',
  },
  archives: {
    title: 'Literary Archives',
    subtitle: 'An indexed historical layer of writings, references, and curated records across the platform.',
    sections: [
      {
        heading: 'Classic Collections',
        body: 'Explore enduring works organized for easy retrieval across poets, genres, and historical periods.',
      },
      {
        heading: 'Thematic Index',
        body: 'Navigate by motifs, emotions, and literary structures to discover contextually related writing.',
      },
      {
        heading: 'Timeline View',
        body: 'Trace movement across eras by following curated progression from foundational voices to modern expression.',
      },
      {
        heading: 'Reference Utility',
        body: 'Use archives for research, study, and rediscovery with a reading-first interface and stable organization.',
      },
    ],
    ctaLabel: 'Explore More',
    ctaHref: '/more',
  },
  'ebook-download': {
    title: 'Digital Reading Library',
    subtitle: 'Access downloadable reading formats, curated collections, and extended literary resources.',
    sections: [
      {
        heading: 'Curated Packs',
        body: 'Discover editor-picked bundles organized by style, era, and theme for a structured reading journey.',
      },
      {
        heading: 'Format Access',
        body: 'Support for reader-friendly digital formats is designed to keep typography, spacing, and chapter rhythm intact.',
      },
      {
        heading: 'Offline Experience',
        body: 'Use downloadable content for uninterrupted reading and revisit your library without network dependency.',
      },
      {
        heading: 'Collections',
        body: 'Move from short-form selections to full anthologies with coherent classification and discoverability.',
      },
    ],
    ctaLabel: 'Open E-Books Section',
    ctaHref: '/e-books',
  },
};

const DEFAULT_POETS: PoetRecord[] = [
  {
    id: 'mir',
    name: 'Mir Taqi Mir',
    years: '1723 - 1810',
    location: 'Delhi',
    avatarUrl: 'https://ui-avatars.com/api/?name=Mir%20Taqi%20Mir&background=0f766e&color=ffffff&bold=true&size=128',
    heroImage: 'https://picsum.photos/seed/Mir%20Taqi%20Mir/1200/850',
    group: ['Classical'],
    shortBio: 'The foundational voice of Urdu ghazal, known for emotional clarity and lyrical grace.',
    signatureLine: 'Patta patta boota boota haal hamara jaane hai',
    stats: { sher: 112, ghazal: 81, nazm: 12 },
  },
  {
    id: 'ghalib',
    name: 'Mirza Ghalib',
    years: '1797 - 1869',
    location: 'Delhi',
    avatarUrl: 'https://ui-avatars.com/api/?name=Mirza%20Ghalib&background=0f766e&color=ffffff&bold=true&size=128',
    heroImage: 'https://picsum.photos/seed/Mirza%20Ghalib/1200/850',
    group: ['Classical', 'Modern'],
    shortBio: 'A timeless master whose verse combines intellect, irony, and philosophical tenderness.',
    signatureLine: 'Hazaron khwahishen aisi ke har khwahish pe dam nikle',
    stats: { sher: 136, ghazal: 94, nazm: 9 },
  },
  {
    id: 'faiz',
    name: 'Faiz Ahmed Faiz',
    years: '1911 - 1984',
    location: 'Lahore',
    avatarUrl: 'https://ui-avatars.com/api/?name=Faiz%20Ahmed%20Faiz&background=0f766e&color=ffffff&bold=true&size=128',
    heroImage: 'https://picsum.photos/seed/Faiz%20Ahmed%20Faiz/1200/850',
    group: ['Modern'],
    shortBio: 'A progressive poet whose language of love and resistance still resonates deeply.',
    signatureLine: 'Bol ke lab azaad hain tere',
    stats: { sher: 86, ghazal: 57, nazm: 31 },
  },
  {
    id: 'parveen',
    name: 'Parveen Shakir',
    years: '1952 - 1994',
    location: 'Karachi',
    avatarUrl: 'https://ui-avatars.com/api/?name=Parveen%20Shakir&background=0f766e&color=ffffff&bold=true&size=128',
    heroImage: 'https://picsum.photos/seed/Parveen%20Shakir/1200/850',
    group: ['Women', 'Modern'],
    shortBio: 'A defining feminine voice in Urdu poetry with intimacy, elegance, and contemporary tone.',
    signatureLine: 'Khushbu jaise log mile afsane mein',
    stats: { sher: 63, ghazal: 42, nazm: 21 },
  },
  {
    id: 'jaun',
    name: 'Jaun Eliya',
    years: '1931 - 2002',
    location: 'Karachi',
    avatarUrl: 'https://ui-avatars.com/api/?name=Jaun%20Eliya&background=0f766e&color=ffffff&bold=true&size=128',
    heroImage: 'https://picsum.photos/seed/Jaun%20Eliya/1200/850',
    group: ['Modern', 'Contemporary'],
    shortBio: 'Beloved for his existential intensity, conversational rhythm, and sharp reflective style.',
    signatureLine: 'Shayad mujhe kisi se mohabbat nahin hui',
    stats: { sher: 99, ghazal: 64, nazm: 26 },
  },
  {
    id: 'ada',
    name: 'Ada Jafri',
    years: '1924 - 2015',
    location: 'Karachi',
    avatarUrl: 'https://ui-avatars.com/api/?name=Ada%20Jafri&background=0f766e&color=ffffff&bold=true&size=128',
    heroImage: 'https://picsum.photos/seed/Ada%20Jafri/1200/850',
    group: ['Women', 'Modern'],
    shortBio: 'A pioneering woman poet who introduced a gentle yet assertive lyrical identity.',
    signatureLine: 'Jinhen main dhoondti thi woh nazar ke saamne the',
    stats: { sher: 41, ghazal: 33, nazm: 17 },
  },
  {
    id: 'nida',
    name: 'Nida Fazli',
    years: '1938 - 2016',
    location: 'Mumbai',
    avatarUrl: 'https://ui-avatars.com/api/?name=Nida%20Fazli&background=0f766e&color=ffffff&bold=true&size=128',
    heroImage: 'https://picsum.photos/seed/Nida%20Fazli/1200/850',
    group: ['Modern'],
    shortBio: 'Known for simplicity and depth, with poems that blend urban realism and inward thought.',
    signatureLine: 'Ghar se masjid hai bahut door chalo yun kar lein',
    stats: { sher: 54, ghazal: 39, nazm: 24 },
  },
  {
    id: 'wasi',
    name: 'Wasi Shah',
    years: '1976 -',
    location: 'Lahore',
    avatarUrl: 'https://ui-avatars.com/api/?name=Wasi%20Shah&background=0f766e&color=ffffff&bold=true&size=128',
    heroImage: 'https://picsum.photos/seed/Wasi%20Shah/1200/850',
    group: ['Contemporary'],
    shortBio: 'A widely-read contemporary poet with accessible language and emotional clarity.',
    signatureLine: 'Tum mere paas raho',
    stats: { sher: 29, ghazal: 17, nazm: 14 },
  },
];

function resolveUploadsPath() {
  return join(process.env.VERCEL ? '/tmp' : process.cwd(), 'uploads', 'media');
}

function toBoolean(value: unknown) {
  return Boolean(value);
}

@Injectable()
export class AdminManagementService {
  constructor(private readonly prisma: PrismaService) {}

  private getSettingsObject(rawSettings: unknown) {
    return (rawSettings as Record<string, unknown> | null) ?? {};
  }

  private getContentPagesSettings(settings: Record<string, unknown>) {
    return (settings.contentPages as Record<string, unknown> | undefined) ?? {};
  }

  private getPoetsSettings(settings: Record<string, unknown>) {
    return (settings.poets as PoetRecord[] | undefined) ?? [];
  }

  private async ensurePublicTenant() {
    return this.prisma.tenant.upsert({
      where: { id: 'public-tenant' },
      update: {},
      create: {
        id: 'public-tenant',
        name: 'Public Tenant',
        slug: 'public-tenant',
      },
    });
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

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private parseEditablePageSlug(slug: string): EditablePageSlug {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!isEditablePageSlug(normalizedSlug)) {
      throw new NotFoundException('Page not found');
    }

    return normalizedSlug;
  }

  private normalizePageSections(input: unknown): PageSection[] {
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .map((item) => {
        const section = item as Partial<PageSection> | null | undefined;
        const heading = typeof section?.heading === 'string' ? section.heading.trim() : '';
        const body = typeof section?.body === 'string' ? section.body.trim() : '';
        if (!heading || !body) {
          return null;
        }
        return { heading, body };
      })
      .filter((section): section is PageSection => !!section);
  }

  private normalizePageContent(slug: EditablePageSlug, input?: Partial<PageContent> | null): PageContent {
    const fallback = DEFAULT_PAGE_CONTENTS[slug];
    const sections = this.normalizePageSections(input?.sections);

    return {
      title: typeof input?.title === 'string' && input.title.trim() ? input.title.trim() : fallback.title,
      subtitle:
        typeof input?.subtitle === 'string' && input.subtitle.trim()
          ? input.subtitle.trim()
          : fallback.subtitle,
      ctaLabel:
        typeof input?.ctaLabel === 'string' && input.ctaLabel.trim()
          ? input.ctaLabel.trim()
          : fallback.ctaLabel,
      ctaHref:
        typeof input?.ctaHref === 'string' && input.ctaHref.trim()
          ? input.ctaHref.trim()
          : fallback.ctaHref,
      sections: sections.length > 0 ? sections : fallback.sections,
    };
  }

  private normalizePoetStats(input: unknown): PoetStats {
    const stats = (input as Partial<PoetStats> | null | undefined) ?? {};
    return {
      sher: Number.isFinite(Number(stats.sher)) ? Math.max(0, Math.round(Number(stats.sher))) : 0,
      ghazal: Number.isFinite(Number(stats.ghazal)) ? Math.max(0, Math.round(Number(stats.ghazal))) : 0,
      nazm: Number.isFinite(Number(stats.nazm)) ? Math.max(0, Math.round(Number(stats.nazm))) : 0,
    };
  }

  private normalizePoet(input: Partial<PoetRecord>, fallbackId: string, index: number): PoetRecord {
    const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim() : `Poet ${index + 1}`;
    const id = (typeof input.id === 'string' && input.id.trim() ? input.id.trim() : this.slugify(name)) || fallbackId;
    const group = Array.isArray(input.group)
      ? input.group.map((item) => String(item).trim()).filter(Boolean)
      : [];

    return {
      id,
      name,
      years: typeof input.years === 'string' && input.years.trim() ? input.years.trim() : '',
      location: typeof input.location === 'string' && input.location.trim() ? input.location.trim() : '',
      avatarUrl: typeof input.avatarUrl === 'string' && input.avatarUrl.trim() ? input.avatarUrl.trim() : '',
      heroImage: typeof input.heroImage === 'string' && input.heroImage.trim() ? input.heroImage.trim() : '',
      group: group.length > 0 ? group : ['Contemporary'],
      shortBio: typeof input.shortBio === 'string' && input.shortBio.trim() ? input.shortBio.trim() : '',
      signatureLine:
        typeof input.signatureLine === 'string' && input.signatureLine.trim()
          ? input.signatureLine.trim()
          : '',
      stats: this.normalizePoetStats(input.stats),
    };
  }

  private normalizeMediaMimeType(filename: string) {
    const extension = extname(filename).toLowerCase();
    if (['.jpg', '.jpeg'].includes(extension)) return 'image/jpeg';
    if (extension === '.png') return 'image/png';
    if (extension === '.gif') return 'image/gif';
    if (extension === '.webp') return 'image/webp';
    if (extension === '.svg') return 'image/svg+xml';
    if (extension === '.pdf') return 'application/pdf';
    return 'application/octet-stream';
  }

  private normalizeMediaPath(filename: string) {
    return `/uploads/media/${encodeURIComponent(filename)}`;
  }

  private async ensureMediaDirectory() {
    const directory = resolveUploadsPath();
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    return directory;
  }

  private mapUserRecord(row: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    role: string;
    status: string;
    avatarUrl: string | null;
    isVerified: boolean | null;
    lastLoginAt: Date | null;
    createdAt: Date | null;
    _count: {
      followers: number;
      following: number;
      contents: number;
    };
  }): AdminUserRecord {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      displayName: row.displayName,
      role: row.role,
      status: row.status,
      avatarUrl: row.avatarUrl,
      isVerified: toBoolean(row.isVerified),
      lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      followersCount: row._count.followers,
      followingCount: row._count.following,
      contentCount: row._count.contents,
    };
  }

  async getDashboardExtras(): Promise<ManagementSummary> {
    const tenant = await this.ensurePublicTenant();
    const settings = this.getSettingsObject(tenant.settings);
    const poets = this.getPoetsSettings(settings);
    const contentPages = this.getContentPagesSettings(settings);

    const unreadMessages = await this.prisma.contactMessage.count({ where: { status: 'unread' } });

    return {
      unreadMessages,
      totalPoets: poets.length > 0 ? poets.length : DEFAULT_POETS.length,
      totalPages: Object.keys(contentPages).length > 0 ? Object.keys(contentPages).length : EDITABLE_PAGE_ORDER.length,
    };
  }

  async getUsers(): Promise<AdminUserRecord[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        avatarUrl: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            contents: true,
          },
        },
      },
    });

    return rows.map((row) => this.mapUserRecord(row));
  }

  async updateUserRole(userId: string, role: string) {
    const normalizedRole = role.trim().toLowerCase();
    if (!['superadmin', 'admin', 'editor', 'publisher', 'poet', 'reader'].includes(normalizedRole)) {
      throw new NotFoundException('Invalid role');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole as never },
    });

    return this.getUsers().then((users) => users.find((user) => user.id === userId) ?? null);
  }

  async updateUserStatus(userId: string, status: string) {
    const normalizedStatus = status.trim().toLowerCase();
    if (!['active', 'inactive', 'suspended', 'pending_verification'].includes(normalizedStatus)) {
      throw new NotFoundException('Invalid status');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: normalizedStatus as never },
    });

    return this.getUsers().then((users) => users.find((user) => user.id === userId) ?? null);
  }

  async getPageContent(slug: string) {
    const normalizedSlug = this.parseEditablePageSlug(slug);
    const tenant = await this.ensurePublicTenant();
    const settings = this.getSettingsObject(tenant.settings);
    const contentPages = this.getContentPagesSettings(settings);
    const stored = contentPages[normalizedSlug] as (Partial<PageContent> & { updatedAt?: string; updatedBy?: string }) | undefined;
    const page = this.normalizePageContent(normalizedSlug, stored);

    return {
      slug: normalizedSlug,
      ...page,
      updatedAt: typeof stored?.updatedAt === 'string' ? stored.updatedAt : null,
      updatedBy: typeof stored?.updatedBy === 'string' ? stored.updatedBy : null,
    };
  }

  async updatePageContent(slug: string, input: Partial<PageContent>, adminUserId: string) {
    const normalizedSlug = this.parseEditablePageSlug(slug);
    const tenant = await this.ensurePublicTenant();
    const settings = this.getSettingsObject(tenant.settings);
    const contentPages = this.getContentPagesSettings(settings);
    const nextPage = this.normalizePageContent(normalizedSlug, input);

    const nextSettings = {
      ...settings,
      contentPages: {
        ...contentPages,
        [normalizedSlug]: {
          ...nextPage,
          updatedAt: new Date().toISOString(),
          updatedBy: adminUserId,
        },
      },
    };

    await this.updateSettings(nextSettings);
    return this.getPageContent(normalizedSlug);
  }

  async listEditablePages() {
    return EDITABLE_PAGE_ORDER.map((slug) => ({
      slug,
      defaultContent: DEFAULT_PAGE_CONTENTS[slug],
    }));
  }

  async getPoets(): Promise<PoetRecord[]> {
    const tenant = await this.ensurePublicTenant();
    const settings = this.getSettingsObject(tenant.settings);
    const storedPoets = this.getPoetsSettings(settings);

    if (storedPoets.length === 0) {
      return DEFAULT_POETS;
    }

    return storedPoets.map((poet, index) => this.normalizePoet(poet, `poet-${index + 1}`, index));
  }

  async getPoetById(poetId: string) {
    const poets = await this.getPoets();
    return poets.find((poet) => poet.id === poetId.trim().toLowerCase()) ?? null;
  }

  async updatePoets(input: unknown, adminUserId: string) {
    const poets = Array.isArray(input)
      ? input.map((poet, index) => this.normalizePoet(poet as Partial<PoetRecord>, `poet-${index + 1}`, index))
      : DEFAULT_POETS;

    const tenant = await this.ensurePublicTenant();
    const settings = this.getSettingsObject(tenant.settings);

    const nextSettings = {
      ...settings,
      poets,
      poetsMeta: {
        updatedAt: new Date().toISOString(),
        updatedBy: adminUserId,
      },
    };

    await this.updateSettings(nextSettings);
    return this.getPoets();
  }

  async listMediaAssets(): Promise<MediaAssetRecord[]> {
    const directory = await this.ensureMediaDirectory();
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      const files = entries.filter((entry) => entry.isFile());

      const assets = await Promise.all(
        files.map(async (entry) => {
          const filePath = join(directory, entry.name);
          const fileStat = await stat(filePath);
          return {
            filename: entry.name,
            path: this.normalizeMediaPath(entry.name),
            size: fileStat.size,
            mimeType: this.normalizeMediaMimeType(entry.name),
            updatedAt: fileStat.mtime.toISOString(),
          } satisfies MediaAssetRecord;
        }),
      );

      return assets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch {
      return [];
    }
  }

  async deleteMediaAsset(filename: string) {
    const safeFilename = filename.trim().replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeFilename) {
      throw new NotFoundException('Invalid file name');
    }

    const filePath = join(await this.ensureMediaDirectory(), safeFilename);
    await unlink(filePath);
    return this.listMediaAssets();
  }
}
