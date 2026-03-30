import { Test } from '@nestjs/testing';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { DemoRequestsService } from './demo-requests.service';

const REQUEST_ID = '00000000-0000-0000-0000-000000000001';

const mockPrisma = {
  demoRequest: { create: jest.fn() },
};

const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

const demoRequestDto = {
  name: 'Budi Santoso',
  email: 'Budi@Example.COM',
  phoneNumber: '6281234567890',
  companyName: 'PT Maju Jaya',
  desiredPlan: 'STARTER',
  useCase: 'Customer support otomatisasi',
};

const savedRequest = {
  id: REQUEST_ID,
  ...demoRequestDto,
  email: 'budi@example.com',
  source: 'WEBSITE',
};

describe('DemoRequestsService', () => {
  let service: DemoRequestsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DemoRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogsService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(DemoRequestsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('persists the demo request and returns success', async () => {
      mockPrisma.demoRequest.create.mockResolvedValue(savedRequest);

      const result = await service.create(demoRequestDto);

      expect(result.success).toBe(true);
      expect(result.requestId).toBe(REQUEST_ID);
      expect(mockPrisma.demoRequest.create).toHaveBeenCalledTimes(1);
    });

    it('lowercases the email before saving', async () => {
      mockPrisma.demoRequest.create.mockResolvedValue(savedRequest);

      await service.create(demoRequestDto);

      const createCall = mockPrisma.demoRequest.create.mock.calls[0][0];
      expect(createCall.data.email).toBe('budi@example.com');
    });

    it('logs an audit event after creation', async () => {
      mockPrisma.demoRequest.create.mockResolvedValue(savedRequest);

      await service.create(demoRequestDto);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'demo-request.create', entityId: REQUEST_ID }),
      );
    });
  });
});
