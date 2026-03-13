import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async logs(userId: string, webhookId: string, limit = 20) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) throw new NotFoundException('Webhook not found');
    await this.assertWorkspaceMembership(userId, webhook.workspaceId);

    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  async testDelivery(userId: string, webhookId: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) throw new NotFoundException('Webhook not found');
    await this.assertWorkspaceMembership(userId, webhook.workspaceId);

    const payload = {
      event: 'webhook.test',
      workspaceId: webhook.workspaceId,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      source: 'dashboard.manual-test',
    };

    const delivery = await this.enqueueDelivery(webhook.id, 'webhook.test', payload);
    return { success: true, deliveryId: delivery.id, status: 'QUEUED' };
  }

  async enqueueDelivery(webhookId: string, eventType: string, payload: unknown) {
    const delivery = await this.prisma.webhookDelivery.create({
      data: { webhookId, eventType, payload: payload as never },
    });
    await this.queue.webhooks.add(JOB_NAMES.WEBHOOK_DELIVERY, { deliveryId: delivery.id }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
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
