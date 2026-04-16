import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../admin/admin-role.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactMessagesService } from './contact-messages.service';

@Controller('contact-messages')
export class ContactMessagesController {
  constructor(private readonly contactMessagesService: ContactMessagesService) {}

  @Post()
  create(@Body() body: { name?: string; email?: string; category?: string; message?: string }) {
    return this.contactMessagesService.createMessage(body);
  }
}

@Controller('admin/contact-messages')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminContactMessagesController {
  constructor(private readonly contactMessagesService: ContactMessagesService) {}

  @Get()
  list(@Query('status') status?: string) {
    const normalizedStatus = status?.trim().toLowerCase();
    return this.contactMessagesService.listMessages(
      normalizedStatus === 'read' || normalizedStatus === 'archived'
        ? (normalizedStatus as 'read' | 'archived')
        : undefined,
    );
  }

  @Get('unread-count')
  unreadCount() {
    return this.contactMessagesService.unreadCount();
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.contactMessagesService.markRead(id);
  }
}
