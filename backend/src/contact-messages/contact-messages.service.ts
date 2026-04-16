import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContactMessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ContactMessageRecord = {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  status: ContactMessageStatus;
  readAt: string | null;
  createdAt: string;
};

@Injectable()
export class ContactMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value: string | undefined, label: string, maxLength: number) {
    const text = value?.trim();
    if (!text) {
      throw new BadRequestException(`${label} is required`);
    }

    return text.slice(0, maxLength);
  }

  async createMessage(input: { name?: string; email?: string; category?: string; message?: string }) {
    const name = this.normalizeText(input.name, 'name', 120);
    const email = this.normalizeText(input.email, 'email', 255).toLowerCase();
    const category = this.normalizeText(input.category, 'category', 100);
    const message = this.normalizeText(input.message, 'message', 5000);

    const created = await this.prisma.contactMessage.create({
      data: {
        name,
        email,
        category,
        message,
      },
    });

    return this.toRecord(created);
  }

  async listMessages(status?: ContactMessageStatus) {
    const messages = await this.prisma.contactMessage.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return messages.map((message) => this.toRecord(message));
  }

  async unreadCount() {
    return this.prisma.contactMessage.count({
      where: { status: 'unread' },
    });
  }

  async markRead(messageId: string) {
    const existing = await this.prisma.contactMessage.findUnique({
      where: { id: messageId },
    });

    if (!existing) {
      throw new NotFoundException('Contact message not found');
    }

    const updated = await this.prisma.contactMessage.update({
      where: { id: messageId },
      data: {
        status: 'read',
        readAt: existing.readAt ?? new Date(),
      },
    });

    return this.toRecord(updated);
  }

  private toRecord(message: {
    id: string;
    name: string;
    email: string;
    category: string;
    message: string;
    status: ContactMessageStatus;
    readAt: Date | null;
    createdAt: Date;
  }): ContactMessageRecord {
    return {
      id: message.id,
      name: message.name,
      email: message.email,
      category: message.category,
      message: message.message,
      status: message.status,
      readAt: message.readAt ? message.readAt.toISOString() : null,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
