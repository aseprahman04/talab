import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { QueueService } from 'src/queue/queue.service';
import { WebhooksService } from './webhooks.service';

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const WEBHOOK_ID = '00000000-0000-0000-0000-000000000003';
const DELIVERY_ID = '00000000-0000-0000-0000-000000000004';

const mockPrisma = {
  workspaceMember: { findUnique: jest.fn() },
  webhook: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  webhookDelivery: { create: jest.fn(), findMany: jest.fn() },
};

const mockQueue = { webhooks: { add: jest.fn() } };

const member = { id: 'member-1', workspaceId: WS_ID, userId: USER_ID };
const webhook = { id: WEBHOOK_ID, workspaceId: WS_ID, name: 'Main Hook', url: 'https://example.com/hook', secret: 'secret123', isActive: true };
const delivery = { id: DELIVERY_ID, webhookId: WEBHOOK_ID, eventType: 'webhook.test', status: 'PENDING' };

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
      ],
    }).compile();
    service = module.get(WebhooksService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a webhook', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.webhook.create.mockResolvedValue(webhook);
      const result = await service.create(USER_ID, {
        workspaceId: WS_ID, name: 'Main Hook', url: 'https://example.com/hook', secret: 'secret123',
      });
      expect(result.name).toBe('Main Hook');
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.create(USER_ID, {
        workspaceId: WS_ID, name: 'x', url: 'https://x.com', secret: 'x',
      })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('list', () => {
    it('returns webhooks for workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.webhook.findMany.mockResolvedValue([webhook]);
      const result = await service.list(USER_ID, WS_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('logs', () => {
    it('returns delivery logs', async () => {
      mockPrisma.webhook.findUnique.mockResolvedValue(webhook);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.webhookDelivery.findMany.mockResolvedValue([delivery]);
      const result = await service.logs(USER_ID, WEBHOOK_ID);
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException for unknown webhook', async () => {
      mockPrisma.webhook.findUnique.mockResolvedValue(null);
      await expect(service.logs(USER_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('testDelivery', () => {
    it('enqueues a test delivery', async () => {
      mockPrisma.webhook.findUnique.mockResolvedValue(webhook);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.webhookDelivery.create.mockResolvedValue(delivery);
      mockQueue.webhooks.add.mockResolvedValue({});
      const result = await service.testDelivery(USER_ID, WEBHOOK_ID);
      expect(result.success).toBe(true);
      expect(result.status).toBe('QUEUED');
      expect(mockQueue.webhooks.add).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException for unknown webhook', async () => {
      mockPrisma.webhook.findUnique.mockResolvedValue(null);
      await expect(service.testDelivery(USER_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('enqueueDelivery', () => {
    it('creates delivery and adds to queue', async () => {
      mockPrisma.webhookDelivery.create.mockResolvedValue(delivery);
      mockQueue.webhooks.add.mockResolvedValue({});
      const result = await service.enqueueDelivery(WEBHOOK_ID, 'message.sent', { foo: 'bar' });
      expect(result.id).toBe(DELIVERY_ID);
      expect(mockQueue.webhooks.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('sign', () => {
    it('returns an HMAC signature string', () => {
      const sig = service.sign('mysecret', { event: 'test' });
      expect(typeof sig).toBe('string');
      expect(sig.length).toBeGreaterThan(0);
    });
  });
});
