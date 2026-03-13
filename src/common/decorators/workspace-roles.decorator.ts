import { SetMetadata } from '@nestjs/common';
import { WORKSPACE_ROLES_KEY } from '../guards/workspace-role.guard';
export const WorkspaceRoles = (...roles: string[]) => SetMetadata(WORKSPACE_ROLES_KEY, roles);
