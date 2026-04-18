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
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminManagementService } from './admin-management.service';
import { AdminService } from './admin.service';

function resolveMediaUploadsPath() {
  return join(process.env.VERCEL ? '/tmp' : process.cwd(), 'uploads', 'media');
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminManagementService: AdminManagementService,
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
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = resolveMediaUploadsPath();
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const timestamp = Date.now();
          const random = Math.round(Math.random() * 1e9);
          const extension = file.originalname.includes('.')
            ? `.${file.originalname.split('.').pop()}`
            : '';
          cb(null, `media-${timestamp}-${random}${extension}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    return this.adminManagementService.listMediaAssets();
  }

  @Delete('media/:filename')
  deleteMedia(@Param('filename') filename: string) {
    return this.adminManagementService.deleteMediaAsset(filename);
  }
}
