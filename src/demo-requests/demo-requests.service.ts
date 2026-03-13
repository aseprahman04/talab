import { Injectable } from '@nestjs/common';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';

@Injectable()
export class DemoRequestsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogsService,
  ) {}

  async create(dto: CreateDemoRequestDto) {
    const request = await this.prisma.demoRequest.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        phoneNumber: dto.phoneNumber,
        companyName: dto.companyName,
        desiredPlan: dto.desiredPlan,
        useCase: dto.useCase,
      },
    });

    await this.audit.log({
      action: 'demo-request.create',
      entityType: 'DemoRequest',
      entityId: request.id,
      payload: {
        email: request.email,
        desiredPlan: request.desiredPlan,
        source: request.source,
      },
    });

    return {
      success: true,
      requestId: request.id,
      message: 'Request demo berhasil dikirim. Tim kami akan menghubungi Anda.',
    };
  }
}
