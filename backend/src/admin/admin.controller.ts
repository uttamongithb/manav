import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminManagementService } from './admin-management.service';
import { AdminService } from './admin.service';
import { MediaService } from '../shared/media.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminManagementService: AdminManagementService,
    private readonly mediaService: MediaService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    const [dashboard, extras] = await Promise.all([
      this.adminService.getDashboardSummary(),
      this.adminManagementService.getDashboardExtras(),
    ]);

    return {
      ...dashboard,
      ...extras,
    };
  }

  @Get('banners')
  getBanners() {
    return this.adminService.getBannerSlides();
  }

  @Put('banners')
  updateBanners(
    @Body() body: { slides?: unknown },
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminService.updateBannerSlides(body.slides, user.sub);
  }

  @Get('privacy-policy')
  getPrivacyPolicy() {
    return this.adminService.getPrivacyPolicy();
  }

  @Put('privacy-policy')
  updatePrivacyPolicy(
    @Body() body: { content?: string },
    @CurrentUser() user: { sub: string },
  ) {
    const content = body.content?.trim();
    if (!content) {
      throw new BadRequestException('content is required');
    }
    return this.adminService.updatePrivacyPolicy(content, user.sub);
  }

  @Get('posts/pending')
  listPendingPosts() {
    return this.adminService.listPendingPosts();
  }

  @Patch('posts/:id/approve')
  approvePost(@Param('id') id: string) {
    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }
    return this.adminService.approvePost(id.trim());
  }

  @Get('users')
  listUsers() {
    return this.adminManagementService.getUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: { role?: string }) {
    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }

    if (!body.role?.trim()) {
      throw new BadRequestException('role is required');
    }

    return this.adminManagementService.updateUserRole(id.trim(), body.role.trim());
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body() body: { status?: string }) {
    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }

    if (!body.status?.trim()) {
      throw new BadRequestException('status is required');
    }

    return this.adminManagementService.updateUserStatus(id.trim(), body.status.trim());
  }

  @Get('page-content/:slug')
  getPageContent(@Param('slug') slug: string) {
    return this.adminManagementService.getPageContent(slug);
  }

  @Put('page-content/:slug')
  updatePageContent(
    @Param('slug') slug: string,
    @Body()
    body: {
      title?: string;
      subtitle?: string;
      ctaLabel?: string;
      ctaHref?: string;
      sections?: { heading: string; body: string }[];
    },
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminManagementService.updatePageContent(
      slug,
      {
        title: body.title,
        subtitle: body.subtitle,
        ctaLabel: body.ctaLabel,
        ctaHref: body.ctaHref,
        sections: body.sections,
      },
      user.sub,
    );
  }

  @Get('pages')
  listPages() {
    return this.adminManagementService.listEditablePages();
  }

  @Get('poets')
  listPoets() {
    return this.adminManagementService.getPoets();
  }

  @Get('poets/:id')
  getPoet(@Param('id') id: string) {
    return this.adminManagementService.getPoetById(id);
  }

  @Put('poets')
  updatePoets(@Body() body: { poets?: unknown }, @CurrentUser() user: { sub: string }) {
    return this.adminManagementService.updatePoets(body.poets, user.sub);
  }

  @Get('media')
  listMedia() {
    return this.adminManagementService.listMediaAssets();
  }

  @Post('media/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Allow images and videos
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'video/mp4',
          'video/webm',
          'application/pdf',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    }),
  )
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string },
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const fileName = `media-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const mediaUrl = await this.mediaService.uploadFile(
      file,
      fileName,
      'media',
    );

    // Store in tenant settings
    return this.adminManagementService.addMediaAsset(
      {
        url: mediaUrl,
        filename: fileName,
        mimeType: file.mimetype,
        size: file.size,
      },
      user.sub,
    );
  }

  @Delete('media/:url')
  async deleteMedia(
    @Param('url') encodedUrl: string,
    @CurrentUser() user: { sub: string },
  ) {
    const url = decodeURIComponent(encodedUrl);
    return this.adminManagementService.deleteMediaAsset(url, user.sub);
  }

  @Post('articles/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Allow only images
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    }),
  )
  async uploadArticleImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string },
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const fileName = `article-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const imageUrl = await this.mediaService.uploadFile(
      file,
      fileName,
      'articles',
    );

    return { imageUrl };
  }

  @Post('pages/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Allow only images
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    }),
  )
  async uploadPageImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string },
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const fileName = `page-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const imageUrl = await this.mediaService.uploadFile(
      file,
      fileName,
      'pages',
    );

    return { imageUrl };
  }
}
