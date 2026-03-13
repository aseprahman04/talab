import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';

@Injectable()
export class AutoRepliesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAutoReplyDto) {
    await this.assertWorkspaceMembership(userId, dto.workspaceId);
    await this.assertDeviceInWorkspace(dto.deviceId, dto.workspaceId);
    return this.prisma.autoReplyRule.create({ data: dto });
  }

  async list(userId: string, workspaceId: string, deviceId?: string) {
    await this.assertWorkspaceMembership(userId, workspaceId);
    if (deviceId) await this.assertDeviceInWorkspace(deviceId, workspaceId);
    return this.prisma.autoReplyRule.findMany({ where: { workspaceId, ...(deviceId ? { deviceId } : {}) } });
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
