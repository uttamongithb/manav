import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileRecord, ProfileService } from './profile.service';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import type { Request } from 'express';
import type { FileFilterCallback } from 'multer';

function resolveUploadsPath() {
  const basePath = process.env.VERCEL ? '/tmp' : process.cwd();
  return join(basePath, 'uploads');
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  private resolveUserId(req: Request): string | undefined {
    const headerValue = req.headers['x-user-id'];
    if (Array.isArray(headerValue)) {
      return headerValue[0];
    }
    return typeof headerValue === 'string' ? headerValue : undefined;
  }

  private resolveDisplayName(req: Request): string | undefined {
    const headerValue = req.headers['x-user-display-name'];
    if (Array.isArray(headerValue)) {
      return headerValue[0];
    }
    return typeof headerValue === 'string' ? headerValue : undefined;
  }

  @Get()
  async getProfile(@Req() req: Request): Promise<ProfileRecord> {
    return this.profileService.getProfile(
      this.resolveUserId(req),
      this.resolveDisplayName(req),
    );
  }

  @Put()
  async updateProfile(
    @Req() req: Request,
    @Body() body: Partial<ProfileRecord>,
  ): Promise<ProfileRecord> {
    return this.profileService.updateProfile(
      body,
      this.resolveUserId(req),
      this.resolveDisplayName(req),
    );
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _req: Request,
          _file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          const uploadDir = resolveUploadsPath();
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (
          _req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const timestamp = Date.now();
          const random = Math.round(Math.random() * 1e9);
          cb(null, `avatar-${timestamp}-${random}${extname(file.originalname)}`);
        },
      }),
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
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<ProfileRecord> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    return this.profileService.updateProfile(
      { avatarUrl },
      this.resolveUserId(req),
      this.resolveDisplayName(req),
    );
  }
}
