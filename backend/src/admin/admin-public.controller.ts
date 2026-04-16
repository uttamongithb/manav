import { Controller, Get, Param } from '@nestjs/common';
import { AdminManagementService } from './admin-management.service';
import { AdminService } from './admin.service';

@Controller('public')
export class AdminPublicController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminManagementService: AdminManagementService,
  ) {}

  @Get('home-config')
  getHomeConfig() {
    return this.adminService.getBannerSlides();
  }

  @Get('privacy-policy')
  getPrivacyPolicy() {
    return this.adminService.getPrivacyPolicy();
  }

  @Get('page-content/:slug')
  getPageContent(@Param('slug') slug: string) {
    return this.adminManagementService.getPageContent(slug);
  }

  @Get('poets')
  getPoets() {
    return this.adminManagementService.getPoets();
  }

  @Get('poets/:id')
  getPoetById(@Param('id') id: string) {
    return this.adminManagementService.getPoetById(id);
  }
}
