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
const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

const member = { id: 'member-1', workspaceId: WS_ID, userId: USER_ID };
const device = { id: DEVICE_ID, workspaceId: WS_ID, name: 'CS 01' };
const message = {
  id: MSG_ID,
  workspaceId: WS_ID,
  deviceId: DEVICE_ID,
  direction: 'OUTBOUND',
  type: 'TEXT',
  recipient: '6281234567890',
  content: 'Halo dari WATether!',
  status: 'QUEUED',
};

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
    it('creates a message record and enqueues the send job', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.message.create.mockResolvedValue(message);
      mockQueue.messages.add.mockResolvedValue({});

      const result = await service.send(USER_ID, {
        workspaceId: WS_ID,
        deviceId: DEVICE_ID,
        target: '6281234567890',
        type: 'TEXT',
        message: 'Halo dari WATether!',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('QUEUED');
      expect(result.messageId).toBe(MSG_ID);
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(1);
      expect(mockQueue.messages.add).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'message.enqueue' }),
      );
    });

    it('throws ForbiddenException if user is not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.send(USER_ID, {
          workspaceId: WS_ID,
          deviceId: DEVICE_ID,
          target: '6281234567890',
          type: 'TEXT',
          message: 'hi',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.message.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if device belongs to another workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue({ ...device, workspaceId: 'other-ws' });

      await expect(
        service.send(USER_ID, {
          workspaceId: WS_ID,
          deviceId: DEVICE_ID,
          target: '6281234567890',
          type: 'TEXT',
          message: 'hi',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if device does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(null);

      await expect(
        service.send(USER_ID, {
          workspaceId: WS_ID,
          deviceId: DEVICE_ID,
          target: '6281234567890',
          type: 'TEXT',
          message: 'hi',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('list', () => {
    it('returns messages for a workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.message.findMany.mockResolvedValue([message]);

      const result = await service.list(USER_ID, WS_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(MSG_ID);
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.list(USER_ID, WS_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('retry', () => {
    it('resets status to QUEUED and re-enqueues the message', async () => {
      const failedMsg = { ...message, status: 'FAILED', workspaceId: WS_ID };
      const updatedMsg = { ...failedMsg, status: 'QUEUED', id: MSG_ID };
      mockPrisma.message.findUnique.mockResolvedValue(failedMsg);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.message.update.mockResolvedValue(updatedMsg);
      mockQueue.messages.add.mockResolvedValue({});

      const result = await service.retry(USER_ID, MSG_ID);

      expect(result.success).toBe(true);
      expect(result.status).toBe('QUEUED');
      expect(result.messageId).toBe(MSG_ID);
      expect(mockQueue.messages.add).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'message.retry' }),
      );
    });

    it('throws NotFoundException for an unknown message ID', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);

      await expect(service.retry(USER_ID, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(mockQueue.messages.add).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if user is not a workspace member', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(message);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.retry(USER_ID, MSG_ID)).rejects.toThrow(ForbiddenException);
      expect(mockQueue.messages.add).not.toHaveBeenCalled();
    });
  });
});
