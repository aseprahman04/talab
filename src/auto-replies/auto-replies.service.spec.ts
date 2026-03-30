import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AutoRepliesService } from './auto-replies.service';

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const DEVICE_ID = '00000000-0000-0000-0000-000000000003';
const RULE_ID = '00000000-0000-0000-0000-000000000004';

const mockPrisma = {
  workspaceMember: { findUnique: jest.fn() },
  device: { findUnique: jest.fn() },
  autoReplyRule: { create: jest.fn(), findMany: jest.fn() },
};

const member = { id: 'member-1', workspaceId: WS_ID, userId: USER_ID };
const device = { id: DEVICE_ID, workspaceId: WS_ID, name: 'CS 01' };
const rule = { id: RULE_ID, workspaceId: WS_ID, deviceId: DEVICE_ID, name: 'Greeting', keyword: 'halo', response: 'Halo juga!', matchType: 'contains', priority: 10, isEnabled: true };

describe('AutoRepliesService', () => {
  let service: AutoRepliesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AutoRepliesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AutoRepliesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates an auto-reply rule for a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.autoReplyRule.create.mockResolvedValue(rule);

      const result = await service.create(USER_ID, {
        workspaceId: WS_ID,
        deviceId: DEVICE_ID,
        name: 'Greeting',
        keyword: 'halo',
        matchType: 'contains',
        response: 'Halo juga!',
        priority: 10,
        isEnabled: true,
      });

      expect(result.id).toBe(RULE_ID);
      expect(mockPrisma.autoReplyRule.create).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException if user is not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.create(USER_ID, { workspaceId: WS_ID, deviceId: DEVICE_ID, name: 'x', keyword: 'x', matchType: 'exact', response: 'y', priority: 1, isEnabled: true }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.autoReplyRule.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if device does not belong to workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue({ ...device, workspaceId: 'other-ws' });

      await expect(
        service.create(USER_ID, { workspaceId: WS_ID, deviceId: DEVICE_ID, name: 'x', keyword: 'x', matchType: 'exact', response: 'y', priority: 1, isEnabled: true }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('list', () => {
    it('returns all rules for a workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.autoReplyRule.findMany.mockResolvedValue([rule]);

      const result = await service.list(USER_ID, WS_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(RULE_ID);
    });

    it('filters by deviceId when provided', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.autoReplyRule.findMany.mockResolvedValue([rule]);

      await service.list(USER_ID, WS_ID, DEVICE_ID);

      expect(mockPrisma.autoReplyRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deviceId: DEVICE_ID }) }),
      );
    });

    it('throws ForbiddenException if not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.list(USER_ID, WS_ID)).rejects.toThrow(ForbiddenException);
    });
  });
});
