import { ForbiddenException, Injectable } from '@nestjs/common';
import { signHmac } from 'src/common/utils/hmac';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService, private queue: QueueService) {}

  async create(userId: string, dto: CreateWebhookDto) {
    await this.assertWorkspaceMembership(userId, dto.workspaceId);
    return this.prisma.webhook.create({ data: { ...dto, isActive: dto.isActive ?? true } });
  }

  async list(userId: string, workspaceId: string) {
    await this.assertWorkspaceMembership(userId, workspaceId);
    return this.prisma.webhook.findMany({ where: { workspaceId } });
  }

  async enqueueDelivery(webhookId: string, eventType: string, payload: unknown) {
    const delivery = await this.prisma.webhookDelivery.create({
      data: { webhookId, eventType, payload: payload as never },
    });
    await this.queue.webhooks.add(JOB_NAMES.WEBHOOK_DELIVERY, { deliveryId: delivery.id });
    return delivery;
  }

  sign(secret: string, payload: unknown) {
    return signHmac(secret, payload);
  }

  private async assertWorkspaceMembership(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this workspace');
  }
}
