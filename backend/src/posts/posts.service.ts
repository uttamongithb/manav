import { Injectable, OnModuleInit } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

function resolveDataDir() {
  const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
  return join(basePath, 'data');
}

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
export class PostsService implements OnModuleInit {
  private readonly dataDir = resolveDataDir();
  private readonly dataFile = join(this.dataDir, 'posts.json');

  async onModuleInit() {
    await this.ensureDataFile();
  }

  async list(section?: string): Promise<PostRecord[]> {
    const posts = await this.readPosts();

    return posts
      .filter((post) => (!section ? true : post.section.toUpperCase() === section.toUpperCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(input: { section: string; content: string; author?: string }): Promise<PostRecord> {
    const posts = await this.readPosts();

    const record: PostRecord = {
      id: randomUUID(),
      section: input.section.toUpperCase(),
      author: input.author?.trim() || 'Drake',
      content: input.content.trim(),
      visibility: 'public',
      createdAt: new Date().toISOString(),
    };

    posts.unshift(record);
    await this.writePosts(posts);

    return record;
  }

  private async ensureDataFile() {
    await mkdir(this.dataDir, { recursive: true });
    try {
      await readFile(this.dataFile, 'utf8');
    } catch {
      await writeFile(this.dataFile, '[]', 'utf8');
    }
  }

  private async readPosts(): Promise<PostRecord[]> {
    await this.ensureDataFile();
    const raw = await readFile(this.dataFile, 'utf8');

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as PostRecord[];
      }
      return [];
    } catch {
      return [];
    }
  }

  private async writePosts(posts: PostRecord[]): Promise<void> {
    await writeFile(this.dataFile, JSON.stringify(posts, null, 2), 'utf8');
  }
}
