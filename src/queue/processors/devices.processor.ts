import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Processor('devices')
export class DevicesProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private realtime: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<{ deviceId: string }>): Promise<void> {
    if (job.name === JOB_NAMES.DEVICE_PAIR_START) {
      await this.handlePairStart(job.data.deviceId);
      return;
    }

    if (job.name === JOB_NAMES.DEVICE_RECONNECT) {
      await this.handleReconnect(job.data.deviceId);
    }
  }

  private async handlePairStart(deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) return;

    const now = new Date();

    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        status: 'PAIRING',
        connectedAt: null,
        lastSeenAt: now,
      },
    });

    const webhooks = await this.prisma.webhook.findMany({
      where: { workspaceId: device.workspaceId, isActive: true },
      select: { id: true },
    });

    await Promise.all(webhooks.map(async (webhook: { id: string }) => {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: 'device.pairing',
          payload: {
            event: 'device.pairing',
            workspaceId: device.workspaceId,
            deviceId: device.id,
            status: 'PAIRING',
            qrCode: 'stubbed-qr-from-worker',
            timestamp: now.toISOString(),
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

    await this.queue.devices.add(JOB_NAMES.DEVICE_RECONNECT, { deviceId }, {
      delay: 8000,
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.realtime.emitToWorkspace(device.workspaceId, 'device.status.updated', {
      deviceId,
      status: 'PAIRING',
      qrCode: 'stubbed-qr-from-worker',
    });
  }

  private async handleReconnect(deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) return;

    const now = new Date();
    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        status: 'CONNECTED',
        connectedAt: now,
        lastSeenAt: now,
      },
    });

    const webhooks = await this.prisma.webhook.findMany({
      where: { workspaceId: device.workspaceId, isActive: true },
      select: { id: true },
    });

    await Promise.all(webhooks.map(async (webhook: { id: string }) => {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: 'device.connected',
          payload: {
            event: 'device.connected',
            workspaceId: device.workspaceId,
            deviceId: device.id,
            status: 'CONNECTED',
            timestamp: now.toISOString(),
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

    this.realtime.emitToWorkspace(device.workspaceId, 'device.status.updated', {
      deviceId,
      status: 'CONNECTED',
    });
  }
}