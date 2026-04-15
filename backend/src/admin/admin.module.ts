import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminController } from './admin.controller';
import { AdminPublicController } from './admin-public.controller';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, AdminPublicController],
  providers: [AdminService, JwtAuthGuard, AdminRoleGuard],
})
export class AdminModule {}
