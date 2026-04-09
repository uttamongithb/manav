import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async list(@Query('section') section?: string) {
    return this.postsService.list(section);
  }

  @Get('public')
  async listPublic() {
    return this.postsService.list();
  }

  @Post()
  async create(@Body() body: { section?: string; content?: string; author?: string }) {
    if (!body.section?.trim()) {
      throw new BadRequestException('section is required');
    }

    if (!body.content?.trim()) {
      throw new BadRequestException('content is required');
    }

    return this.postsService.create({
      section: body.section,
      content: body.content,
      author: body.author,
    });
  }
}
