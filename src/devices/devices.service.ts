import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { CreateDeviceDto } from './dto/create-device.dto';
import { generatePlainToken, hashToken } from 'src/common/utils/token';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService, private queue: QueueService, private audit: AuditLogsService, private realtime: RealtimeGateway) {}

  async create(userId: string, dto: CreateDeviceDto) {
    await this.assertWorkspaceMembership(userId, dto.workspaceId);
    const device = await this.prisma.device.create({
      data: { workspaceId: dto.workspaceId, name: dto.name },
    });
    await this.audit.log({ workspaceId: dto.workspaceId, userId, action: 'device.create', entityType: 'Device', entityId: device.id, payload: dto });
    return device;
  }

  async list(userId: string, workspaceId: string) {
    await this.assertWorkspaceMembership(userId, workspaceId);
    return this.prisma.device.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
  }

  async startPairing(userId: string, deviceId: string) {
    const device = await this.getOwnedDeviceForUser(userId, deviceId);
    // Clear old session so Baileys always starts fresh and emits a QR
    await this.prisma.deviceSession.deleteMany({ where: { deviceId } });
    await this.prisma.device.update({ where: { id: deviceId }, data: { status: 'PAIRING' } });
    await this.queue.devices.add(JOB_NAMES.DEVICE_PAIR_START, { deviceId });
    this.realtime.emitToWorkspace(device.workspaceId, 'device.status.updated', { deviceId, status: 'PAIRING' });
    return { success: true, status: 'PAIRING', workspaceId: device.workspaceId };
  }

  async reconnect(userId: string, deviceId: string) {
    const device = await this.getOwnedDeviceForUser(userId, deviceId);
    await this.prisma.device.update({ where: { id: deviceId }, data: { status: 'RECONNECTING' } });
    await this.queue.devices.add(JOB_NAMES.DEVICE_RECONNECT, { deviceId });
    this.realtime.emitToWorkspace(device.workspaceId, 'device.status.updated', { deviceId, status: 'RECONNECTING' });
    return { success: true };
  }

  async createToken(userId: string, deviceId: string, name: string) {
    const device = await this.getOwnedDeviceForUser(userId, deviceId);
    await this.assertPlanFeature(device.workspaceId, 'hasApi');
    const plain = generatePlainToken();
    const token = await this.prisma.deviceToken.create({
      data: { deviceId, name, tokenHash: hashToken(plain) },
    });
    return { tokenId: token.id, token: plain };
  }

  private async assertWorkspaceMembership(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this workspace');
  }

  private async getOwnedDeviceForUser(userId: string, deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');
    await this.assertWorkspaceMembership(userId, device.workspaceId);
    return device;
  }

  private async assertPlanFeature(workspaceId: string, feature: 'hasAutoReply' | 'hasWebhook' | 'hasApi') {
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: { select: { hasAutoReply: true, hasWebhook: true, hasApi: true } } },
    });
    if (!sub?.plan[feature]) {
      throw new ForbiddenException(`Your current plan does not include this feature. Please upgrade.`);
    }
  }
}
