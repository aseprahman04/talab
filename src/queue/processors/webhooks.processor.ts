import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) { super(); }

  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'webhook.delivery') return;
    const delivery = await this.prisma.webhookDelivery.findUnique({ where: { id: job.data.deliveryId } });
    if (!delivery) return;
    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: { status: 'SUCCESS', responseCode: 200, responseBody: 'stubbed worker delivery' },
    });
  }
}
