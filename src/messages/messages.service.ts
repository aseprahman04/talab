import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService, private queue: QueueService, private audit: AuditLogsService) {}

  async send(userId: string, dto: SendMessageDto) {
    await this.assertWorkspaceMembership(userId, dto.workspaceId);
    await this.assertDeviceInWorkspace(dto.deviceId, dto.workspaceId);

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    const delay = scheduledAt && scheduledAt > new Date() ? scheduledAt.getTime() - Date.now() : undefined;

    const message = await this.prisma.message.create({
      data: {
        workspaceId: dto.workspaceId,
        deviceId: dto.deviceId,
        direction: 'OUTBOUND',
        type: dto.type,
        recipient: dto.target,
        content: dto.message,
        mediaUrl: dto.mediaUrl,
        status: 'QUEUED',
        scheduledAt: scheduledAt ?? null,
        queuedAt: new Date(),
      },
    });

    await this.queue.messages.add(JOB_NAMES.MESSAGE_SEND, { messageId: message.id }, {
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    await this.audit.log({ workspaceId: dto.workspaceId, userId, action: 'message.enqueue', entityType: 'Message', entityId: message.id, payload: dto });
    return { success: true, messageId: message.id, status: 'QUEUED', scheduledAt: scheduledAt?.toISOString() ?? null };
  }

  async list(userId: string, workspaceId: string) {
    await this.assertWorkspaceMembership(userId, workspaceId);
    return this.prisma.message.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async retry(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    await this.assertWorkspaceMembership(userId, message.workspaceId);

    const retriedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'QUEUED',
        queuedAt: new Date(),
        failedAt: null,
        errorMessage: null,
      },
    });

    await this.queue.messages.add(JOB_NAMES.MESSAGE_SEND, { messageId: retriedMessage.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    await this.audit.log({
      workspaceId: retriedMessage.workspaceId,
      userId,
      action: 'message.retry',
      entityType: 'Message',
      entityId: retriedMessage.id,
      payload: { previousStatus: message.status },
    });

    return { success: true, messageId: retriedMessage.id, status: 'QUEUED' };
  }

  private async assertWorkspaceMembership(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this workspace');
  }

  private async assertDeviceInWorkspace(deviceId: string, workspaceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device || device.workspaceId !== workspaceId) {
      throw new ForbiddenException('Device does not belong to this workspace');
    }
  }
}
