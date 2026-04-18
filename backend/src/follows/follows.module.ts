import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';

@Module({
  imports: [AuthModule],
  controllers: [FollowsController],
  providers: [FollowsService, JwtAuthGuard],
  exports: [FollowsService],
})
export class FollowsModule {}
