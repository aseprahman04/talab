import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { QueueService } from 'src/queue/queue.service';
import { MessagesService } from './messages.service';

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const DEVICE_ID = '00000000-0000-0000-0000-000000000003';
const MSG_ID = '00000000-0000-0000-0000-000000000004';

const mockPrisma = {
  workspaceMember: { findUnique: jest.fn() },
  device: { findUnique: jest.fn() },
  message: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
};

const mockQueue = { messages: { add: jest.fn() } };
const mockAudit = { log: jest.fn() };

const member = { id: 'member-1', workspaceId: WS_ID, userId: USER_ID };
const device = { id: DEVICE_ID, workspaceId: WS_ID };
const message = { id: MSG_ID, workspaceId: WS_ID, deviceId: DEVICE_ID, status: 'QUEUED' };

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(MessagesService);
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('queues a message', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.message.create.mockResolvedValue(message);
      mockQueue.messages.add.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});
      const result = await service.send(USER_ID, {
        workspaceId: WS_ID, deviceId: DEVICE_ID, target: '6281234567890',
        type: 'TEXT', message: 'Test pesan', mediaUrl: undefined,
      });
      expect(result.status).toBe('QUEUED');
      expect(result.messageId).toBe(MSG_ID);
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.send(USER_ID, {
        workspaceId: WS_ID, deviceId: DEVICE_ID, target: '6281234567890', type: 'TEXT', message: 'x',
      })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('list', () => {
    it('returns messages for workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.message.findMany.mockResolvedValue([message]);
      const result = await service.list(USER_ID, WS_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('retry', () => {
    it('re-queues a failed message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({ ...message, status: 'FAILED' });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.message.update.mockResolvedValue({ ...message, status: 'QUEUED' });
      mockQueue.messages.add.mockResolvedValue({});
      mockAudit.log.mockResolvedValue({});
      const result = await service.retry(USER_ID, MSG_ID);
      expect(result.status).toBe('QUEUED');
    });

    it('throws NotFoundException for unknown message', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);
      await expect(service.retry(USER_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
