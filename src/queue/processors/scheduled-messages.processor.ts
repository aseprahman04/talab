import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { computeNextRunAt } from 'src/common/utils/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from '../jobs/job-names';
import { QueueService } from '../queue.service';

@Processor('scheduled-messages')
export class ScheduledMessagesProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(ScheduledMessagesProcessor.name);

  constructor(private prisma: PrismaService, private queue: QueueService) {
    super();
  }

  async onModuleInit() {
    await this.queue.scheduledMessages.add(
      JOB_NAMES.SCHEDULED_MESSAGES_TICK,
      {},
      {
        repeat: { every: 60_000 },
        jobId: 'scheduled-messages-tick',
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    );
    this.logger.log('Scheduled messages tick registered (every 60s)');
  }

  async process(job: Job): Promise<void> {
    if (job.name !== JOB_NAMES.SCHEDULED_MESSAGES_TICK) return;

    const now = new Date();
    const due = await this.prisma.scheduledMessage.findMany({
      where: { isEnabled: true, nextRunAt: { lte: now } },
    });

    if (!due.length) return;
    this.logger.log(`Tick: ${due.length} scheduled message(s) due`);

    for (const sm of due) {
      const newNextRunAt = computeNextRunAt(sm);

      // Optimistic update — if nextRunAt changed (another tick already handled it), skip
      const updated = await this.prisma.scheduledMessage.updateMany({
        where: { id: sm.id, nextRunAt: sm.nextRunAt },
        data: { nextRunAt: newNextRunAt, lastRunAt: now },
      });
      if (updated.count === 0) continue;

      const message = await this.prisma.message.create({
        data: {
          workspaceId: sm.workspaceId,
          deviceId: sm.deviceId,
          direction: 'OUTBOUND',
          type: sm.type,
          recipient: sm.recipient,
          content: sm.content ?? null,
          mediaUrl: sm.mediaUrl ?? null,
          status: 'QUEUED',
          queuedAt: now,
        },
      });

      await this.queue.messages.add(JOB_NAMES.MESSAGE_SEND, { messageId: message.id }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      });

      this.logger.log(`Scheduled message ${sm.id} fired → message ${message.id}, next run: ${newNextRunAt.toISOString()}`);
    }
  }
}
