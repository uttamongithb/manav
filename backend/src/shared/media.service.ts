import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ImageKit from '@imagekit/nodejs';

@Injectable()
export class MediaService {
  private imageKit: ImageKit;

  constructor() {
    this.imageKit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    } as any);
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
    folder: string = 'media',
  ): Promise<string> {
    try {
      const response = await (this.imageKit as any).upload({
        file: file.buffer,
        fileName: fileName,
        folder: `/${folder}`,
      });

      return response.url;
    } catch (error) {
      throw new InternalServerErrorException(
        `ImageKit upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await (this.imageKit as any).deleteFile(fileId);
    } catch (error) {
      throw new InternalServerErrorException(
        `ImageKit delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
