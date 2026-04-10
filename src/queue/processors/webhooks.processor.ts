import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { signHmac } from 'src/common/utils/hmac';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';

// concurrency=10: webhook deliveries are outbound HTTP calls — fully I/O-bound
// and independent of each other. High concurrency keeps delivery latency low
// even when a single message triggers deliveries to many registered endpoints.
@Processor('webhooks', { concurrency: 10 })
export class WebhooksProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) { super(); }

  async process(job: Job<{ deliveryId: string }>): Promise<void> {
    if (job.name !== JOB_NAMES.WEBHOOK_DELIVERY) return;
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: job.data.deliveryId },
      include: { webhook: true },
    });
    if (!delivery) return;

    const payload = delivery.payload as Record<string, unknown>;
    const signature = signHmac(delivery.webhook.secret, payload);

    try {
      const response = await fetch(delivery.webhook.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-watether-signature': signature,
          'x-watether-event': delivery.eventType,
        },
        body: JSON.stringify(payload),
      });

      const responseBody = (await response.text()).slice(0, 2000);
      if (!response.ok) {
        await this.markRetryState(delivery.id, job, response.status, responseBody);
        throw new Error(`Webhook responded with status ${response.status}`);
      }

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SUCCESS',
          responseCode: response.status,
          responseBody,
          retryCount: job.attemptsMade,
          nextRetryAt: null,
        },
      });
    } catch (error) {
      await this.markRetryState(delivery.id, job, null, error instanceof Error ? error.message : 'Unknown webhook error');
      throw error;
    }
  }

  private async markRetryState(deliveryId: string, job: Job<{ deliveryId: string }>, responseCode: number | null, responseBody: string) {
    const maxAttempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;
    const nextAttempt = job.attemptsMade + 1;
    const willRetry = nextAttempt < maxAttempts;
    const delayMs = 10000 * Math.max(1, 2 ** Math.max(0, job.attemptsMade));

    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: willRetry ? 'RETRYING' : 'FAILED',
        responseCode: responseCode ?? undefined,
        responseBody: responseBody.slice(0, 2000),
        retryCount: nextAttempt,
        nextRetryAt: willRetry ? new Date(Date.now() + delayMs) : null,
      },
    });
  }
}
