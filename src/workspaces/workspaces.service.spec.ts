import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { WorkspacesService } from './workspaces.service';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const WS_ID = '00000000-0000-0000-0000-000000000002';

const PLAN_ID = '00000000-0000-0000-0000-000000000099';
const freePlan = { id: PLAN_ID, code: 'free' };

const mockPrisma = {
  workspace: { findUnique: jest.fn(), create: jest.fn() },
  workspaceMember: { findMany: jest.fn() },
  plan: { findUnique: jest.fn().mockResolvedValue(freePlan) },
  subscription: { create: jest.fn().mockResolvedValue({}) },
};
const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

const workspace = { id: WS_ID, ownerId: USER_ID, name: 'Dev WS', slug: 'dev-ws' };

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(WorkspacesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a workspace and adds owner as member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.create.mockResolvedValue(workspace);
      const result = await service.create(USER_ID, { name: 'Dev WS', slug: 'dev-ws' });
      expect(result.slug).toBe('dev-ws');
      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: USER_ID,
            members: { create: { userId: USER_ID, role: 'OWNER' } },
          }),
        }),
      );
    });

    it('throws ConflictException if slug already exists', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      await expect(service.create(USER_ID, { name: 'Dev WS', slug: 'dev-ws' }))
        .rejects.toThrow(ConflictException);
      expect(mockPrisma.workspace.create).not.toHaveBeenCalled();
    });
  });

  describe('listForUser', () => {
    it('returns workspace memberships for user', async () => {
      mockPrisma.workspaceMember.findMany.mockResolvedValue([{ workspace }]);
      const result = await service.listForUser(USER_ID);
      expect(result).toHaveLength(1);
    });
  });
});
