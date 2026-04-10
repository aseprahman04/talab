import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { computeNextRunAt } from 'src/common/utils/schedule';
import { CreateScheduledMessageDto } from './dto/create-scheduled-message.dto';

@Injectable()
export class ScheduledMessagesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateScheduledMessageDto) {
    await this.assertWorkspaceMembership(userId, dto.workspaceId);
    await this.assertDeviceInWorkspace(dto.deviceId, dto.workspaceId);

    const smLike = {
      repeatType: dto.repeatType,
      sendHour: dto.sendHour,
      sendMinute: dto.sendMinute ?? 0,
      dayOfWeek: dto.dayOfWeek ?? null,
      dayOfMonth: dto.dayOfMonth ?? null,
    };

    const nextRunAt = computeNextRunAt(smLike);

    return this.prisma.scheduledMessage.create({
      data: {
        workspaceId: dto.workspaceId,
        deviceId: dto.deviceId,
        name: dto.name,
        type: (dto.type ?? 'TEXT') as never,
        content: dto.content ?? null,
        mediaUrl: dto.mediaUrl ?? null,
        recipient: dto.recipient,
        repeatType: dto.repeatType as never,
        sendHour: dto.sendHour,
        sendMinute: dto.sendMinute ?? 0,
        dayOfWeek: dto.dayOfWeek ?? null,
        dayOfMonth: dto.dayOfMonth ?? null,
        isEnabled: dto.isEnabled ?? true,
        nextRunAt,
      },
    });
  }

  async list(userId: string, workspaceId: string) {
    await this.assertWorkspaceMembership(userId, workspaceId);
    return this.prisma.scheduledMessage.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const sm = await this.prisma.scheduledMessage.findUnique({ where: { id } });
    if (!sm) throw new NotFoundException('Scheduled message not found');
    await this.assertWorkspaceMembership(userId, sm.workspaceId);
    await this.prisma.scheduledMessage.delete({ where: { id } });
    return { success: true };
  }

  async toggle(userId: string, id: string, isEnabled: boolean) {
    const sm = await this.prisma.scheduledMessage.findUnique({ where: { id } });
    if (!sm) throw new NotFoundException('Scheduled message not found');
    await this.assertWorkspaceMembership(userId, sm.workspaceId);

    // Recompute nextRunAt when re-enabling so it fires at correct future time
    const nextRunAt = isEnabled ? computeNextRunAt(sm) : sm.nextRunAt;
    return this.prisma.scheduledMessage.update({
      where: { id },
      data: { isEnabled, nextRunAt },
    });
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
