import { ForbiddenException, Injectable } from '@nestjs/common';
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
        queuedAt: new Date(),
      },
    });

    await this.queue.messages.add(JOB_NAMES.MESSAGE_SEND, { messageId: message.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    await this.audit.log({ workspaceId: dto.workspaceId, userId, action: 'message.enqueue', entityType: 'Message', entityId: message.id, payload: dto });
    return { success: true, messageId: message.id, status: 'QUEUED' };
  }

  async list(userId: string, workspaceId: string) {
    await this.assertWorkspaceMembership(userId, workspaceId);
    return this.prisma.message.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 100 });
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
