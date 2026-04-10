import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ScheduledMessagesService } from './scheduled-messages.service';

jest.mock('src/common/utils/schedule', () => ({
  computeNextRunAt: jest.fn(() => new Date('2026-01-01T09:00:00Z')),
}));

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const DEVICE_ID = '00000000-0000-0000-0000-000000000003';
const SM_ID = '00000000-0000-0000-0000-000000000004';

const NEXT_RUN = new Date('2026-01-01T09:00:00Z');

const mockPrisma = {
  workspaceMember: { findUnique: jest.fn() },
  device: { findUnique: jest.fn() },
  scheduledMessage: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const member = { id: 'member-1', workspaceId: WS_ID, userId: USER_ID };
const device = { id: DEVICE_ID, workspaceId: WS_ID, name: 'CS 01' };
const sm = {
  id: SM_ID,
  workspaceId: WS_ID,
  deviceId: DEVICE_ID,
  name: 'Daily Reminder',
  type: 'TEXT',
  content: 'Hello!',
  recipient: '6281234567890',
  repeatType: 'DAILY',
  sendHour: 9,
  sendMinute: 0,
  dayOfWeek: null,
  dayOfMonth: null,
  isEnabled: true,
  nextRunAt: NEXT_RUN,
};

const createDto = {
  workspaceId: WS_ID,
  deviceId: DEVICE_ID,
  name: 'Daily Reminder',
  recipient: '6281234567890',
  repeatType: 'DAILY',
  sendHour: 9,
  content: 'Hello!',
};

describe('ScheduledMessagesService', () => {
  let service: ScheduledMessagesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ScheduledMessagesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ScheduledMessagesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a scheduled message with computed nextRunAt', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.scheduledMessage.create.mockResolvedValue(sm);

      const result = await service.create(USER_ID, createDto);

      expect(result.id).toBe(SM_ID);
      expect(mockPrisma.scheduledMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: WS_ID,
            deviceId: DEVICE_ID,
            name: 'Daily Reminder',
            repeatType: 'DAILY',
            sendHour: 9,
            nextRunAt: NEXT_RUN,
          }),
        }),
      );
    });

    it('throws ForbiddenException if not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.create(USER_ID, createDto)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.scheduledMessage.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if device does not belong to workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue({ ...device, workspaceId: 'other-ws' });

      await expect(service.create(USER_ID, createDto)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.scheduledMessage.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if device does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(null);

      await expect(service.create(USER_ID, createDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('list', () => {
    it('returns scheduled messages for a workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.scheduledMessage.findMany.mockResolvedValue([sm]);

      const result = await service.list(USER_ID, WS_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(SM_ID);
      expect(mockPrisma.scheduledMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId: WS_ID } }),
      );
    });

    it('throws ForbiddenException if not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.list(USER_ID, WS_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deletes a scheduled message and returns { success: true }', async () => {
      mockPrisma.scheduledMessage.findUnique.mockResolvedValue(sm);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.scheduledMessage.delete.mockResolvedValue(sm);

      const result = await service.remove(USER_ID, SM_ID);

      expect(result.success).toBe(true);
      expect(mockPrisma.scheduledMessage.delete).toHaveBeenCalledWith({ where: { id: SM_ID } });
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.scheduledMessage.findUnique.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.scheduledMessage.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if not a workspace member', async () => {
      mockPrisma.scheduledMessage.findUnique.mockResolvedValue(sm);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.remove(USER_ID, SM_ID)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.scheduledMessage.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('enables a scheduled message and recomputes nextRunAt', async () => {
      const disabledSm = { ...sm, isEnabled: false };
      const updatedSm = { ...sm, isEnabled: true, nextRunAt: NEXT_RUN };
      mockPrisma.scheduledMessage.findUnique.mockResolvedValue(disabledSm);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.scheduledMessage.update.mockResolvedValue(updatedSm);

      const result = await service.toggle(USER_ID, SM_ID, true);

      expect(result.isEnabled).toBe(true);
      expect(mockPrisma.scheduledMessage.update).toHaveBeenCalledWith({
        where: { id: SM_ID },
        data: { isEnabled: true, nextRunAt: NEXT_RUN },
      });
    });

    it('disables a scheduled message and keeps existing nextRunAt', async () => {
      const enabledSm = { ...sm, isEnabled: true };
      const updatedSm = { ...sm, isEnabled: false };
      mockPrisma.scheduledMessage.findUnique.mockResolvedValue(enabledSm);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.scheduledMessage.update.mockResolvedValue(updatedSm);

      await service.toggle(USER_ID, SM_ID, false);

      expect(mockPrisma.scheduledMessage.update).toHaveBeenCalledWith({
        where: { id: SM_ID },
        data: { isEnabled: false, nextRunAt: enabledSm.nextRunAt },
      });
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.scheduledMessage.findUnique.mockResolvedValue(null);

      await expect(service.toggle(USER_ID, 'nonexistent', true)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if not a workspace member', async () => {
      mockPrisma.scheduledMessage.findUnique.mockResolvedValue(sm);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.toggle(USER_ID, SM_ID, false)).rejects.toThrow(ForbiddenException);
    });
  });
});
