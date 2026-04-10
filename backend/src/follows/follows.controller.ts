import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  FollowListResponse,
  FollowsService,
  FollowStatsResponse,
} from './follows.service';

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get('followers')
  getFollowers(
    @CurrentUser() user: { sub: string },
    @Query('userId') userId?: string,
  ): Promise<FollowListResponse> {
    return this.followsService.getFollowers(userId?.trim() || user.sub);
  }

  @Get('following')
  getFollowing(
    @CurrentUser() user: { sub: string },
    @Query('userId') userId?: string,
  ): Promise<FollowListResponse> {
    return this.followsService.getFollowing(userId?.trim() || user.sub);
  }

  @Get('stats')
  getStats(
    @CurrentUser() user: { sub: string },
    @Query('userId') userId?: string,
  ): Promise<FollowStatsResponse> {
    const resolvedUserId = userId?.trim() || user.sub;
    return this.followsService.getStats(resolvedUserId, user.sub);
  }

  @Post(':targetUserId')
  follow(
    @CurrentUser() user: { sub: string },
    @Param('targetUserId') targetUserId: string,
  ): Promise<FollowStatsResponse> {
    return this.followsService.follow(user.sub, targetUserId);
  }

  @Delete(':targetUserId')
  unfollow(
    @CurrentUser() user: { sub: string },
    @Param('targetUserId') targetUserId: string,
  ): Promise<FollowStatsResponse> {
    return this.followsService.unfollow(user.sub, targetUserId);
  }
}
