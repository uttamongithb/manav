import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('public')
export class AdminPublicController {
  constructor(private readonly adminService: AdminService) {}

  @Get('home-config')
  getHomeConfig() {
    return this.adminService.getBannerSlides();
  }

  @Get('privacy-policy')
  getPrivacyPolicy() {
    return this.adminService.getPrivacyPolicy();
  }
}
