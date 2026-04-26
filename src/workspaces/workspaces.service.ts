import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

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

    // Auto-provision free plan so new workspaces can send messages immediately
    const freePlan = await this.prisma.plan.findUnique({ where: { code: 'free' } });
    if (freePlan) {
      await this.prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          startedAt: new Date(),
        },
      });
    } else {
      this.logger.warn('Free plan not found — workspace created without subscription. Run: npx prisma db seed');
    }

    await this.audit.log({
      workspaceId: workspace.id,
      userId: ownerId,
      action: 'workspace.create',
      entityType: 'Workspace',
      entityId: workspace.id,
      payload: dto,
    });
    return workspace;
  }

  listForUser(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
  }
}
