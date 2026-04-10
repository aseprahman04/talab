import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { QueueService } from '../queue.service';

// concurrency=5: multiple devices can receive inbound messages simultaneously.
// Each auto-reply job is independent (different device/sender), so parallel
// processing is safe and keeps response latency low across all devices.
@Processor('auto-replies', { concurrency: 5 })
export class AutoRepliesProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoRepliesProcessor.name);

  constructor(private prisma: PrismaService, private queue: QueueService) { super(); }

  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'auto-reply.process') return;
    const inbound = await this.prisma.message.findUnique({ where: { id: job.data.messageId } });
    if (!inbound) return;
    const rules = await this.prisma.autoReplyRule.findMany({
      where: { workspaceId: inbound.workspaceId, deviceId: inbound.deviceId, isEnabled: true },
      orderBy: { priority: 'desc' },
    });
    const content = (inbound.content || '').toLowerCase().trim();
    const match = rules.find((rule: { keyword: string; matchType: string }) => {
      const kw = rule.keyword.toLowerCase();
      return rule.matchType === 'exact' ? content === kw : content.includes(kw);
    });
    if (!match) return;

    let replyContent: string;

    if (match.webhookUrl) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch(match.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: inbound.sender,
            keyword: match.keyword,
            message: inbound.content,
            workspaceId: inbound.workspaceId,
            deviceId: inbound.deviceId,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          this.logger.warn(`Webhook auto-reply ${match.id} returned ${res.status} — skipping reply`);
          return;
        }
        const data = await res.json() as { reply?: unknown };
        if (typeof data.reply !== 'string' || !data.reply.trim()) {
          this.logger.warn(`Webhook auto-reply ${match.id} missing "reply" field — skipping reply`);
          return;
        }
        replyContent = data.reply;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Webhook auto-reply ${match.id} failed: ${message} — skipping reply`);
        return;
      } finally {
        clearTimeout(timer);
      }
    } else {
      if (!match.response) return;
      replyContent = match.response;
    }

    const reply = await this.prisma.message.create({
      data: {
        workspaceId: inbound.workspaceId,
        deviceId: inbound.deviceId,
        direction: 'OUTBOUND',
        type: 'TEXT',
        recipient: inbound.sender || inbound.recipient || '',
        content: replyContent,
        status: 'QUEUED',
        queuedAt: new Date(),
      },
    });
    await this.queue.messages.add('message.send', { messageId: reply.id }, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
