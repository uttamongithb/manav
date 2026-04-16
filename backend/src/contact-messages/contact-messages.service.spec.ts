import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';

describe('ContactMessagesService', () => {
  const createPrismaMock = () => ({
    contactMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  });

  it('throws for missing required fields', async () => {
    const prisma = createPrismaMock();
    const service = new ContactMessagesService(prisma as never);

    await expect(service.createMessage({ email: 'a@b.com', category: 'General', message: 'Hello' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createMessage({ name: 'User', category: 'General', message: 'Hello' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createMessage({ name: 'User', email: 'a@b.com', message: 'Hello' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createMessage({ name: 'User', email: 'a@b.com', category: 'General' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes email and returns created record', async () => {
    const prisma = createPrismaMock();
    prisma.contactMessage.create.mockResolvedValue({
      id: 'msg-1',
      name: 'Demo User',
      email: 'demo@example.com',
      category: 'Support',
      message: 'Need help',
      status: 'unread',
      readAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const service = new ContactMessagesService(prisma as never);
    const result = await service.createMessage({
      name: 'Demo User',
      email: '  Demo@Example.com ',
      category: 'Support',
      message: 'Need help',
    });

    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: {
        name: 'Demo User',
        email: 'demo@example.com',
        category: 'Support',
        message: 'Need help',
      },
    });

    expect(result.id).toBe('msg-1');
    expect(result.email).toBe('demo@example.com');
    expect(result.status).toBe('unread');
  });

  it('throws NotFoundException when marking unknown message as read', async () => {
    const prisma = createPrismaMock();
    prisma.contactMessage.findUnique.mockResolvedValue(null);
    const service = new ContactMessagesService(prisma as never);

    await expect(service.markRead('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
