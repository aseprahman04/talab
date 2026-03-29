import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { QueueService } from 'src/queue/queue.service';
import { BroadcastsService } from './broadcasts.service';

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const DEVICE_ID = '00000000-0000-0000-0000-000000000003';
const BROADCAST_ID = '00000000-0000-0000-0000-000000000004';
const LIST_ID = '00000000-0000-0000-0000-000000000005';
const CONTACT_ID = '00000000-0000-0000-0000-000000000006';

const mockPrisma = {
  workspaceMember: { findUnique: jest.fn() },
  device: { findUnique: jest.fn() },
  broadcast: { create: jest.fn(), findUnique: jest.fn() },
  contactListMember: { findMany: jest.fn() },
};

const mockQueue = { broadcasts: { add: jest.fn() } };

const member = { id: 'member-1', workspaceId: WS_ID, userId: USER_ID };
const device = { id: DEVICE_ID, workspaceId: WS_ID, name: 'CS 01' };
const broadcast = { id: BROADCAST_ID, workspaceId: WS_ID, status: 'DRAFT', name: 'Promo' };

describe('BroadcastsService', () => {
  let service: BroadcastsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BroadcastsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
      ],
    }).compile();
    service = module.get(BroadcastsService);
    jest.clearAllMocks();
  });

  describe('create with inline recipients', () => {
    it('creates broadcast with phone list', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.broadcast.create.mockResolvedValue({ ...broadcast, recipients: [] });
      const result = await service.create(USER_ID, {
        workspaceId: WS_ID,
        deviceId: DEVICE_ID,
        name: 'Promo',
        messageTemplate: 'Halo {name}',
        recipients: ['6281234567890', '6289876543210'],
      });
      expect(result.name).toBe('Promo');
      expect(mockPrisma.broadcast.create).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.create(USER_ID, {
        workspaceId: WS_ID, deviceId: DEVICE_ID, name: 'x', messageTemplate: 'x', recipients: [],
      })).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if device not in workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue({ ...device, workspaceId: 'other-ws' });
      await expect(service.create(USER_ID, {
        workspaceId: WS_ID, deviceId: DEVICE_ID, name: 'x', messageTemplate: 'x', recipients: [],
      })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create with contactListId', () => {
    it('resolves contact list to phone numbers', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.contactListMember.findMany.mockResolvedValue([
        { contact: { id: CONTACT_ID, phoneNumber: '6281234567890' } },
        { contact: { id: 'c2', phoneNumber: '6289876543210' } },
      ]);
      mockPrisma.broadcast.create.mockResolvedValue({ ...broadcast, recipients: [] });
      await service.create(USER_ID, {
        workspaceId: WS_ID,
        deviceId: DEVICE_ID,
        name: 'Promo List',
        messageTemplate: 'Halo!',
        contactListId: LIST_ID,
      });
      const createCall = mockPrisma.broadcast.create.mock.calls[0][0];
      expect(createCall.data.totalTargets).toBe(2);
    });
  });

  describe('start', () => {
    it('enqueues broadcast dispatch', async () => {
      mockPrisma.broadcast.findUnique.mockResolvedValue(broadcast);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockQueue.broadcasts.add.mockResolvedValue({});
      const result = await service.start(USER_ID, BROADCAST_ID);
      expect(result.status).toBe('QUEUED');
      expect(mockQueue.broadcasts.add).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException for unknown broadcast', async () => {
      mockPrisma.broadcast.findUnique.mockResolvedValue(null);
      await expect(service.start(USER_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
