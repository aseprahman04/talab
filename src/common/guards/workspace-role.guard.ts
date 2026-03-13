import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/database/prisma/prisma.service';

export const WORKSPACE_ROLES_KEY = 'workspaceRoles';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<string[]>(WORKSPACE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const workspaceId = req.body.workspaceId || req.params.workspaceId || req.query.workspaceId;
    if (!workspaceId) throw new ForbiddenException('workspaceId is required');

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.sub } },
    });
    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenException('Insufficient workspace role');
    }
    return true;
  }
}
