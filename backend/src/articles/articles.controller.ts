import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../admin/admin-role.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ArticleSection } from '@prisma/client';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('sections')
  async getSections() {
    const sections = await this.articlesService.getAllSections();
    return { sections };
  }

  @Get('sections/:section')
  async getArticlesBySection(
    @Param('section') section: string,
    @Query('userId') userId?: string,
  ) {
    const normalizedSection = section.toLowerCase();
    if (!Object.values(ArticleSection).includes(normalizedSection as ArticleSection)) {
      throw new BadRequestException('Invalid section');
    }

    const articles = await this.articlesService.listBySection(
      normalizedSection as ArticleSection,
      userId,
    );
    return { articles };
  }

  @Get('sections/:section/slug/:slug')
  async getArticleBySlug(
    @Param('section') section: string,
    @Param('slug') slug: string,
    @Query('userId') userId?: string,
  ) {
    const normalizedSection = section.toLowerCase();
    if (!Object.values(ArticleSection).includes(normalizedSection as ArticleSection)) {
      throw new BadRequestException('Invalid section');
    }

    return this.articlesService.getBySectionAndSlug(
      normalizedSection as ArticleSection,
      decodeURIComponent(slug),
      userId,
    );
  }

  @Get('admin/sections/:section')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async getArticlesBySectionForAdmin(@Param('section') section: string) {
    const normalizedSection = section.toLowerCase();
    if (!Object.values(ArticleSection).includes(normalizedSection as ArticleSection)) {
      throw new BadRequestException('Invalid section');
    }

    const articles = await this.articlesService.listBySectionForAdmin(
      normalizedSection as ArticleSection,
    );
    return { articles };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async getArticleForAdmin(@Param('id') id: string) {
    return this.articlesService.getByIdForAdmin(id);
  }

  @Get(':id')
  async getArticle(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    const article = await this.articlesService.getById(id, userId);
    return article;
  }

  @Post(':section')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async createArticle(
    @Param('section') section: string,
    @Body()
    body: {
      title: string;
      content: string;
      excerpt?: string;
      coverImageUrl?: string;
      status?: string;
    },
    @CurrentUser() user: { sub: string },
  ) {
    const normalizedSection = section.toLowerCase();
    if (!Object.values(ArticleSection).includes(normalizedSection as ArticleSection)) {
      throw new BadRequestException('Invalid section');
    }

    const article = await this.articlesService.create(
      normalizedSection as ArticleSection,
      {
        title: body.title,
        content: body.content,
        excerpt: body.excerpt,
        coverImageUrl: body.coverImageUrl,
        status: (body.status as any) || 'draft',
      },
      user.sub,
    );

    return article;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async updateArticle(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      excerpt?: string;
      coverImageUrl?: string;
      status?: string;
    },
    @CurrentUser() user: { sub: string; role?: string },
  ) {
    const article = await this.articlesService.update(
      id,
      {
        title: body.title,
        content: body.content,
        excerpt: body.excerpt,
        coverImageUrl: body.coverImageUrl,
        status: (body.status as any) || undefined,
      },
      user.sub,
      user.role,
    );

    return article;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async deleteArticle(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role?: string },
  ) {
    return this.articlesService.delete(id, user.sub, user.role);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.articlesService.toggleLike(id, user.sub);
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    const comments = await this.articlesService.getComments(id);
    return { comments };
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') id: string,
    @Body() body: { content: string },
    @CurrentUser() user: { sub: string },
  ) {
    const comment = await this.articlesService.addComment(id, body.content, user.sub);
    return comment;
  }

  @Get('sections/:section/stats')
  async getSectionStats(@Param('section') section: string) {
    const normalizedSection = section.toLowerCase();
    if (!Object.values(ArticleSection).includes(normalizedSection as ArticleSection)) {
      throw new BadRequestException('Invalid section');
    }

    return this.articlesService.getSectionStats(normalizedSection as ArticleSection);
  }
}
