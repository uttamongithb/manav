import { BadRequestException, Body, Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { MediaService } from '../shared/media.service';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import type { FileFilterCallback } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  async list(@Query('section') section?: string, @Query('author') author?: string) {
    return this.postsService.list(section, author);
  }

  @Get('public')
  async listPublic(@Query('section') section?: string, @Query('author') author?: string) {
    return this.postsService.list(section, author);
  }

  @Get('favorites')
  async listFavorites(@Query('author') author?: string) {
    return this.postsService.listFavorites(author);
  }

  @Post()
  async create(@Body() body: { section?: string; content?: string; author?: string }) {
    if (!body.section?.trim()) {
      throw new BadRequestException('section is required');
    }

    if (!body.content?.trim()) {
      throw new BadRequestException('content is required');
    }

    return this.postsService.create({
      section: body.section,
      content: body.content,
      author: body.author,
    });
  }

  @Post('shorts')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
      fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (!file.mimetype.startsWith('video/')) {
          cb(null, false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async createShort(
    @Body() body: { title?: string; durationSeconds?: string },
    @CurrentUser() user: { displayName?: string | null; username?: string | null },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('video file is required');
    }

    if (!body.title?.trim()) {
      throw new BadRequestException('title is required');
    }

    const durationSeconds = Number.parseFloat(String(body.durationSeconds ?? ''));
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new BadRequestException('video duration is required');
    }
    if (durationSeconds > 60) {
      throw new BadRequestException('video duration must be less than 1 minute');
    }

    const fileName = `short-${Date.now()}-${file.originalname}`;
    const videoUrl = await this.mediaService.uploadFile(
      file,
      fileName,
      'shorts',
    );

    return this.postsService.create({
      section: 'INSAAN_RECENT',
      content: body.title,
      author: user.displayName ?? user.username ?? 'User',
      videoUrl,
    });
  }

  @Post(':id/likes')
  async like(@Param('id') id: string, @Body() body: { author?: string }) {
    return this.postsService.like(id, { author: body.author });
  }

  @Post(':id/favorites')
  async toggleFavorite(@Param('id') id: string, @Body() body: { author?: string }) {
    return this.postsService.toggleFavorite(id, { author: body.author });
  }

  @Get(':id/comments')
  async listComments(@Param('id') id: string) {
    return this.postsService.listComments(id);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() body: { content?: string; author?: string },
  ) {
    if (!body.content?.trim()) {
      throw new BadRequestException('content is required');
    }

    return this.postsService.addComment(id, {
      content: body.content,
      author: body.author,
    });
  }
}
