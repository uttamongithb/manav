import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ImageKit, { toFile } from '@imagekit/nodejs';
import { createHmac } from 'crypto';

@Injectable()
export class MediaService {
  private imageKit: ImageKit;
  private readonly publicKey: string;
  private readonly urlEndpoint: string;

  constructor() {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    this.publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
    this.urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

    this.imageKit = new ImageKit({
      privateKey,
      publicKey: this.publicKey,
      urlEndpoint: this.urlEndpoint,
    } as any);
  }

  getAuthenticationParameters() {
    const token = Math.random().toString(36).substring(2, 15);
    const expire = Math.floor(Date.now() / 1000) + 3600;
    const signature = createHmac('sha1', process.env.IMAGEKIT_PRIVATE_KEY || '')
      .update(`${token}${expire}`)
      .digest('hex');

    return { token, expire, signature };
  }

  getClientUploadAuth() {
    if (!this.publicKey || !this.urlEndpoint) {
      throw new InternalServerErrorException('ImageKit upload configuration is incomplete');
    }

    const authParams = this.getAuthenticationParameters();
    return {
      ...authParams,
      publicKey: this.publicKey,
      urlEndpoint: this.urlEndpoint,
    };
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
