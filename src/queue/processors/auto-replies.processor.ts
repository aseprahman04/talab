import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { QueueService } from '../queue.service';

@Processor('auto-replies')
export class AutoRepliesProcessor extends WorkerHost {
  constructor(private prisma: PrismaService, private queue: QueueService) { super(); }

  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'auto-reply.process') return;
    const inbound = await this.prisma.message.findUnique({ where: { id: job.data.messageId } });
    if (!inbound) return;
    const rules = await this.prisma.autoReplyRule.findMany({
      where: { workspaceId: inbound.workspaceId, deviceId: inbound.deviceId, isEnabled: true },
      orderBy: { priority: 'desc' },
    });
    const content = (inbound.content || '').toLowerCase();
    const match = rules.find((rule: { keyword: string }) => content.includes(rule.keyword.toLowerCase()));
    if (!match) return;

    const reply = await this.prisma.message.create({
      data: {
        workspaceId: inbound.workspaceId,
        deviceId: inbound.deviceId,
        direction: 'OUTBOUND',
        type: 'TEXT',
        recipient: inbound.sender || inbound.recipient || '',
        content: match.response,
        status: 'QUEUED',
        queuedAt: new Date(),
      },
    });
    await this.queue.messages.add('message.send', { messageId: reply.id });
  }
}
