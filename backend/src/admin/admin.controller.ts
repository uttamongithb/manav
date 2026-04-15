import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardSummary();
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
}
