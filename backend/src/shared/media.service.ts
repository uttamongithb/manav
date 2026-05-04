import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ImageKit, { toFile } from '@imagekit/nodejs';

@Injectable()
export class MediaService {
  private imageKit: ImageKit;

  constructor() {
    this.imageKit = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
    folder: string = 'media',
  ): Promise<string> {
    try {
      const response = await this.imageKit.files.upload({
        file: await toFile(file.buffer, fileName, { type: file.mimetype }),
        fileName: fileName,
        folder: `/${folder}`,
      });

      if (!response.url) {
        throw new InternalServerErrorException('ImageKit upload did not return a URL');
      }

      return response.url;
    } catch (error) {
      throw new InternalServerErrorException(
        `ImageKit upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.imageKit.files.delete(fileId);
    } catch (error) {
      throw new InternalServerErrorException(
        `ImageKit delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
