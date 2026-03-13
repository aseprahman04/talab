import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Processor('messages')
export class MessagesProcessor extends WorkerHost {
  constructor(private prisma: PrismaService, private queue: QueueService, private realtime: RealtimeGateway) { super(); }

  async process(job: Job<{ messageId: string }>): Promise<void> {
    if (job.name !== JOB_NAMES.MESSAGE_SEND) return;
    const message = await this.prisma.message.findUnique({ where: { id: job.data.messageId } });
    if (!message) return;
    if (['SENT', 'DELIVERED', 'READ'].includes(message.status)) return;

    await this.prisma.message.update({ where: { id: message.id }, data: { status: 'PROCESSING' } });
    // Placeholder: integrate actual WA session engine here.
    await this.prisma.message.update({
      where: { id: message.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        providerMessageId: `stub-${message.id}`,
      },
    });

    const webhooks = await this.prisma.webhook.findMany({
      where: { workspaceId: message.workspaceId, isActive: true },
      select: { id: true },
    });

    await Promise.all(webhooks.map(async (webhook: { id: string }) => {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: 'message.sent',
          payload: {
            event: 'message.sent',
            workspaceId: message.workspaceId,
            deviceId: message.deviceId,
            messageId: message.id,
            target: message.recipient,
            type: message.type,
            status: 'SENT',
            timestamp: new Date().toISOString(),
          },
        },
      });

      await this.queue.webhooks.add(JOB_NAMES.WEBHOOK_DELIVERY, { deliveryId: delivery.id }, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      });
    }));

    this.realtime.emitToWorkspace(message.workspaceId, 'message.sent', { messageId: message.id });
  }
}
