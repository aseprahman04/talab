import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  log(input: {
    workspaceId?: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    payload?: unknown;
  }) {
    return this.prisma.auditLog.create({ data: input as never });
  }
}
