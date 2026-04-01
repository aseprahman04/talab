import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from '../queue.service';

/** Random delay between messages: 3–8 seconds to mimic human pacing */
function randomDelay(minMs = 3000, maxMs = 8000): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

@Processor('broadcasts')
export class BroadcastsProcessor extends WorkerHost {
  constructor(private prisma: PrismaService, private queue: QueueService) { super(); }

  async process(job: Job<{ broadcastId: string }>): Promise<void> {
    if (job.name !== JOB_NAMES.BROADCAST_DISPATCH) return;

    const broadcast = await this.prisma.broadcast.findUnique({
      where: { id: job.data.broadcastId },
      include: { recipients: true },
    });
    if (!broadcast) return;

    await this.prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    let cumulativeDelay = 0;
    let activeCount = 0;

    for (const recipient of broadcast.recipients) {
      // Respect opt-out and blacklist — look up contact by phoneNumber
      const contact = await this.prisma.contact.findUnique({
        where: { workspaceId_phoneNumber: { workspaceId: broadcast.workspaceId, phoneNumber: recipient.phoneNumber } },
        select: { isOptOut: true, isBlacklisted: true },
      });
      if (contact?.isOptOut || contact?.isBlacklisted) {
        await this.prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', errorMessage: contact.isOptOut ? 'Opt-out' : 'Blacklisted' },
        });
        continue;
      }

      const message = await this.prisma.message.create({
        data: {
          workspaceId: broadcast.workspaceId,
          deviceId: broadcast.deviceId,
          direction: 'OUTBOUND',
          type: 'TEXT',
          recipient: recipient.phoneNumber,
          content: broadcast.messageTemplate,
          status: 'QUEUED',
          queuedAt: new Date(),
          // Link back so MessagesProcessor can update this recipient's status
          metadata: { broadcastRecipientId: recipient.id, broadcastId: broadcast.id },
        },
      });

      cumulativeDelay += randomDelay();
      await this.queue.messages.add(JOB_NAMES.MESSAGE_SEND, { messageId: message.id }, {
        delay: cumulativeDelay,
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      });

      activeCount++;
    }

    // Update totalTargets to reflect only active (non-skipped) recipients
    await this.prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { totalTargets: activeCount },
    });

    // If nothing was queued (all skipped), complete immediately
    if (activeCount === 0) {
      await this.prisma.broadcast.update({
        where: { id: broadcast.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
  }
}
