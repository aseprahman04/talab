import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService, private audit: AuditLogsService) {}

  async create(ownerId: string, dto: CreateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Workspace slug already exists');

    const workspace = await this.prisma.workspace.create({
      data: {
        ownerId,
        name: dto.name,
        slug: dto.slug,
        members: { create: { userId: ownerId, role: 'OWNER' } },
      },
    });
    await this.audit.log({ workspaceId: workspace.id, userId: ownerId, action: 'workspace.create', entityType: 'Workspace', entityId: workspace.id, payload: dto });
    return workspace;
  }

  listForUser(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
  }
}
