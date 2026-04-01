import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { QueueService } from 'src/queue/queue.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { DevicesService } from './devices.service';

// Mock token utilities to avoid crypto side-effects
jest.mock('src/common/utils/token', () => ({
  generatePlainToken: jest.fn(() => 'plaintoken123'),
  hashToken: jest.fn(() => 'hashedtoken123'),
}));

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const DEVICE_ID = '00000000-0000-0000-0000-000000000003';
const TOKEN_ID = '00000000-0000-0000-0000-000000000004';

const mockPrisma = {
  workspaceMember: { findUnique: jest.fn() },
  device: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  deviceToken: { create: jest.fn() },
  deviceSession: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
};

const mockQueue = { devices: { add: jest.fn() } };
const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
const mockRealtime = { emitToWorkspace: jest.fn() };

const member = { id: 'member-1', workspaceId: WS_ID, userId: USER_ID };
const device = { id: DEVICE_ID, workspaceId: WS_ID, name: 'CS 01', status: 'DISCONNECTED' };

describe('DevicesService', () => {
  let service: DevicesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
        { provide: AuditLogsService, useValue: mockAudit },
        { provide: RealtimeGateway, useValue: mockRealtime },
      ],
    }).compile();
    service = module.get(DevicesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a device and logs audit event', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.create.mockResolvedValue(device);

      const result = await service.create(USER_ID, { workspaceId: WS_ID, name: 'CS 01' });

      expect(result.id).toBe(DEVICE_ID);
      expect(mockPrisma.device.create).toHaveBeenCalledWith({
        data: { workspaceId: WS_ID, name: 'CS 01' },
      });
      expect(mockAudit.log).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.create(USER_ID, { workspaceId: WS_ID, name: 'CS 01' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.device.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns devices for workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.findMany.mockResolvedValue([device]);
      const result = await service.list(USER_ID, WS_ID);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(DEVICE_ID);
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.list(USER_ID, WS_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('startPairing', () => {
    it('sets device to PAIRING, clears session, and enqueues job', async () => {
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.update.mockResolvedValue({ ...device, status: 'PAIRING' });
      mockQueue.devices.add.mockResolvedValue({});

      const result = await service.startPairing(USER_ID, DEVICE_ID);

      expect(result.status).toBe('PAIRING');
      expect(mockPrisma.deviceSession.deleteMany).toHaveBeenCalledWith({ where: { deviceId: DEVICE_ID } });
      expect(mockPrisma.device.update).toHaveBeenCalledWith({
        where: { id: DEVICE_ID },
        data: { status: 'PAIRING' },
      });
      expect(mockQueue.devices.add).toHaveBeenCalledTimes(1);
      expect(mockRealtime.emitToWorkspace).toHaveBeenCalledWith(
        WS_ID,
        'device.status.updated',
        { deviceId: DEVICE_ID, status: 'PAIRING' },
      );
    });

    it('throws NotFoundException for unknown device', async () => {
      mockPrisma.device.findUnique.mockResolvedValue(null);
      await expect(service.startPairing(USER_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if not a workspace member', async () => {
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.startPairing(USER_ID, DEVICE_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reconnect', () => {
    it('sets device to RECONNECTING and enqueues job', async () => {
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.device.update.mockResolvedValue({ ...device, status: 'RECONNECTING' });
      mockQueue.devices.add.mockResolvedValue({});

      const result = await service.reconnect(USER_ID, DEVICE_ID);

      expect(result.success).toBe(true);
      expect(mockRealtime.emitToWorkspace).toHaveBeenCalledWith(
        WS_ID,
        'device.status.updated',
        { deviceId: DEVICE_ID, status: 'RECONNECTING' },
      );
    });

    it('throws NotFoundException for unknown device', async () => {
      mockPrisma.device.findUnique.mockResolvedValue(null);
      await expect(service.reconnect(USER_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createToken', () => {
    it('creates a device API token and returns the plain token', async () => {
      mockPrisma.device.findUnique.mockResolvedValue(device);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.deviceToken.create.mockResolvedValue({
        id: TOKEN_ID,
        deviceId: DEVICE_ID,
        name: 'CI Token',
        tokenHash: 'hashedtoken123',
      });

      const result = await service.createToken(USER_ID, DEVICE_ID, 'CI Token');

      expect(result.tokenId).toBe(TOKEN_ID);
      expect(result.token).toBe('plaintoken123');
      expect(mockPrisma.deviceToken.create).toHaveBeenCalledWith({
        data: { deviceId: DEVICE_ID, name: 'CI Token', tokenHash: 'hashedtoken123' },
      });
    });

    it('throws NotFoundException for unknown device', async () => {
      mockPrisma.device.findUnique.mockResolvedValue(null);
      await expect(service.createToken(USER_ID, 'bad-id', 'tok')).rejects.toThrow(NotFoundException);
    });
  });
});
