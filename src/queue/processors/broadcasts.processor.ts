import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { QueueService } from '../queue.service';

@Processor('broadcasts')
export class BroadcastsProcessor extends WorkerHost {
  constructor(private prisma: PrismaService, private queue: QueueService) { super(); }

  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'broadcast.dispatch') return;
    const broadcast = await this.prisma.broadcast.findUnique({
      where: { id: job.data.broadcastId },
      include: { recipients: true },
    });
    if (!broadcast) return;

    await this.prisma.broadcast.update({ where: { id: broadcast.id }, data: { status: 'RUNNING', startedAt: new Date() } });

    for (const recipient of broadcast.recipients) {
      await this.queue.messages.add('message.send', {
        messageId: (await this.prisma.message.create({
          data: {
            workspaceId: broadcast.workspaceId,
            deviceId: broadcast.deviceId,
            direction: 'OUTBOUND',
            type: 'TEXT',
            recipient: recipient.phoneNumber,
            content: broadcast.messageTemplate,
            status: 'QUEUED',
            queuedAt: new Date(),
          },
        })).id,
      });
    }

    await this.prisma.broadcast.update({ where: { id: broadcast.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
  }
}
