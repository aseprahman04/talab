import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@Injectable()
export class BroadcastsService {
  constructor(private prisma: PrismaService, private queue: QueueService) {}

  async create(userId: string, dto: CreateBroadcastDto) {
    await this.assertWorkspaceMembership(userId, dto.workspaceId);
    await this.assertDeviceInWorkspace(dto.deviceId, dto.workspaceId);

    let recipientPhones = dto.recipients ?? [];
    if (dto.contactListId) {
      const members = await this.prisma.contactListMember.findMany({
        where: { contactListId: dto.contactListId },
        include: { contact: true },
      });
      recipientPhones = members.map((m: { contact: { phoneNumber: string } }) => m.contact.phoneNumber);
    }

    return this.prisma.broadcast.create({
      data: {
        workspaceId: dto.workspaceId,
        deviceId: dto.deviceId,
        name: dto.name,
        messageTemplate: dto.messageTemplate,
        totalTargets: recipientPhones.length,
        recipients: { create: recipientPhones.map((phoneNumber) => ({ phoneNumber })) },
      },
      include: { recipients: true },
    });
  }

  async start(userId: string, id: string) {
    const broadcast = await this.prisma.broadcast.findUnique({ where: { id } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    await this.assertWorkspaceMembership(userId, broadcast.workspaceId);
    await this.queue.broadcasts.add(JOB_NAMES.BROADCAST_DISPATCH, { broadcastId: id });
    return { success: true, status: 'QUEUED' };
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
