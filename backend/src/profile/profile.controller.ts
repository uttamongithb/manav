import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileRecord, ProfileService } from './profile.service';
import { MediaService } from '../shared/media.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import type { FileFilterCallback } from 'multer';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  async getProfile(
    @CurrentUser() user: { sub: string; displayName?: string | null },
  ): Promise<ProfileRecord> {
    return this.profileService.getProfile(
      user.sub,
      user.displayName ?? undefined,
    );
  }

  @Put()
  async updateProfile(
    @CurrentUser() user: { sub: string; displayName?: string | null },
    @Body() body: Partial<ProfileRecord>,
  ): Promise<ProfileRecord> {
    return this.profileService.updateProfile(
      body,
      user.sub,
      user.displayName ?? undefined,
    );
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(null, false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: { sub: string; displayName?: string | null },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProfileRecord> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const fileName = `${user.sub}-${Date.now()}-${file.originalname}`;
    const avatarUrl = await this.mediaService.uploadFile(
      file,
      fileName,
      'profiles',
    );

    return this.profileService.updateProfile(
      { avatarUrl },
      user.sub,
      user.displayName ?? undefined,
    );
  }
}
