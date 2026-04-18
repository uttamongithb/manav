import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async list(@Query('section') section?: string, @Query('author') author?: string) {
    return this.postsService.list(section, author);
  }

  @Get('public')
  async listPublic(@Query('author') author?: string) {
    return this.postsService.list(undefined, author);
  }

  @Get('favorites')
  async listFavorites(@Query('author') author?: string) {
    return this.postsService.listFavorites(author);
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

  @Post(':id/likes')
  async like(@Param('id') id: string, @Body() body: { author?: string }) {
    return this.postsService.like(id, { author: body.author });
  }

  @Post(':id/favorites')
  async toggleFavorite(@Param('id') id: string, @Body() body: { author?: string }) {
    return this.postsService.toggleFavorite(id, { author: body.author });
  }

  @Get(':id/comments')
  async listComments(@Param('id') id: string) {
    return this.postsService.listComments(id);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() body: { content?: string; author?: string },
  ) {
    if (!body.content?.trim()) {
      throw new BadRequestException('content is required');
    }

    return this.postsService.addComment(id, {
      content: body.content,
      author: body.author,
    });
  }
}
