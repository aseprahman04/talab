import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { WhatsAppSessionManager } from 'src/whatsapp/whatsapp-session.manager';

// concurrency=3: allows up to 3 parallel WA sends per worker.
// Broadcast recipients are already staggered with 3-8s delays, so at most
// a handful of jobs are ready simultaneously — 3 slots is enough without
// risk of flooding a single WA account.
@Processor({ name: 'messages', concurrency: 3 })
export class MessagesProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private realtime: RealtimeGateway,
    private sessionManager: WhatsAppSessionManager,
  ) { super(); }

  async process(job: Job<{ messageId: string }>): Promise<void> {
    if (job.name !== JOB_NAMES.MESSAGE_SEND) return;
    const message = await this.prisma.message.findUnique({ where: { id: job.data.messageId } });
    if (!message) return;
    if (['SENT', 'DELIVERED', 'READ'].includes(message.status)) return;

    // Enforce monthly workspace quota + per-device daily limit
    const subscription = await this.prisma.subscription.findUnique({
      where: { workspaceId: message.workspaceId },
      include: { plan: { select: { monthlyMessageQuota: true, dailyDeviceLimit: true } } },
    });

    const monthlyQuota = subscription?.plan?.monthlyMessageQuota ?? 0;
    // dailyDeviceLimit=0 means unlimited; default 200 protects numbers from WA ban
    const dailyLimit = subscription?.plan?.dailyDeviceLimit ?? 200;

    // ── Monthly workspace quota ────────────────────────────────────────────────
    if (monthlyQuota > 0) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const sentThisMonth = await this.prisma.message.count({
        where: {
          workspaceId: message.workspaceId,
          direction: 'OUTBOUND',
          status: { in: ['SENT', 'DELIVERED', 'READ'] },
          sentAt: { gte: startOfMonth },
        },
      });
      if (sentThisMonth >= monthlyQuota) {
        return this.failMessage(message, `Monthly message quota exceeded (${monthlyQuota}/month)`);
      }
    }

    // ── Per-device daily limit (anti-ban) ─────────────────────────────────────
    // Each WA number has a reputation score. Sending too many messages in a single
    // day is the most reliable way to get a number banned. 200/day is conservative;
    // well-warmed numbers can handle more, but we default safe.
    if (dailyLimit > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const sentToday = await this.prisma.message.count({
        where: {
          deviceId: message.deviceId,
          direction: 'OUTBOUND',
          status: { in: ['SENT', 'DELIVERED', 'READ'] },
          sentAt: { gte: startOfDay },
        },
      });
      if (sentToday >= dailyLimit) {
        return this.failMessage(message, `Device daily limit reached (${dailyLimit}/day) — message deferred to protect the number`);
      }
    }

    const device = await this.prisma.device.findUnique({ where: { id: message.deviceId } });
    if (!device || device.status !== 'CONNECTED') {
      return this.failMessage(message, !device ? 'Device not found' : `Device is ${device.status}`);
    }

    await this.prisma.message.update({ where: { id: message.id }, data: { status: 'PROCESSING' } });

    let providerMessageId: string;
    try {
      providerMessageId = await this.sessionManager.sendMessage(
        message.deviceId,
        message.recipient!,
        message.type as 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO',
        message.content ?? undefined,
        message.mediaUrl ?? undefined,
      );
    } catch (err) {
      return this.failMessage(message, String(err));
    }

    const sentAt = new Date();
    await this.prisma.message.update({
      where: { id: message.id },
      data: { status: 'SENT', sentAt, providerMessageId, errorMessage: null },
    });

    // Auto-upsert recipient as a lead so tested numbers are instantly available in Leads
    if (message.recipient) {
      await this.prisma.contact.upsert({
        where: { workspaceId_phoneNumber: { workspaceId: message.workspaceId, phoneNumber: message.recipient } },
        create: { workspaceId: message.workspaceId, phoneNumber: message.recipient },
        update: {},
      });
    }

    // Track broadcast completion
    const meta = message.metadata as { broadcastRecipientId?: string } | null;
    if (meta?.broadcastRecipientId) {
      await this.updateBroadcastProgress(meta.broadcastRecipientId, 'SENT', sentAt, null);
    }

    await this.enqueueWebhookDeliveries(message.workspaceId, 'message.sent', {
      event: 'message.sent',
      workspaceId: message.workspaceId,
      deviceId: message.deviceId,
      messageId: message.id,
      target: message.recipient,
      type: message.type,
      status: 'SENT',
      timestamp: sentAt.toISOString(),
    });

    this.realtime.emitToWorkspace(message.workspaceId, 'message.sent', { messageId: message.id });
  }

  private async updateBroadcastProgress(
    broadcastRecipientId: string,
    status: 'SENT' | 'FAILED',
    sentAt: Date | null,
    errorMessage: string | null,
  ) {
    const recipient = await this.prisma.broadcastRecipient.update({
      where: { id: broadcastRecipientId },
      data: { status, sentAt: sentAt ?? undefined, errorMessage: errorMessage ?? undefined },
    });
    const field = status === 'SENT' ? { successCount: { increment: 1 } } : { failedCount: { increment: 1 } };
    const broadcast = await this.prisma.broadcast.update({
      where: { id: recipient.broadcastId },
      data: field,
    });
    if (broadcast.successCount + broadcast.failedCount >= broadcast.totalTargets) {
      await this.prisma.broadcast.update({
        where: { id: broadcast.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
  }

  /** Centralised failure handler: marks message FAILED, updates broadcast, fires webhook. */
  private async failMessage(
    message: { id: string; workspaceId: string; deviceId: string; recipient: string | null; type: string; metadata: unknown },
    errorMessage: string,
  ): Promise<void> {
    const failedAt = new Date();
    await this.prisma.message.update({
      where: { id: message.id },
      data: { status: 'FAILED', failedAt, errorMessage },
    });
    const meta = message.metadata as { broadcastRecipientId?: string } | null;
    if (meta?.broadcastRecipientId) {
      await this.updateBroadcastProgress(meta.broadcastRecipientId, 'FAILED', null, errorMessage);
    }
    await this.enqueueWebhookDeliveries(message.workspaceId, 'message.failed', {
      event: 'message.failed',
      workspaceId: message.workspaceId,
      deviceId: message.deviceId,
      messageId: message.id,
      target: message.recipient,
      type: message.type,
      status: 'FAILED',
      error: errorMessage,
      timestamp: failedAt.toISOString(),
    });
    this.realtime.emitToWorkspace(message.workspaceId, 'message.failed', { messageId: message.id });
  }

  private async enqueueWebhookDeliveries(workspaceId: string, eventType: string, payload: Record<string, unknown>) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { workspaceId, isActive: true },
      select: { id: true },
    });

    await Promise.all(webhooks.map(async (webhook: { id: string }) => {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType,
          payload: payload as object,
        },
      });

      await this.queue.webhooks.add(JOB_NAMES.WEBHOOK_DELIVERY, { deliveryId: delivery.id }, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      });
    }));
  }
}
