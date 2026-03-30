import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { WhatsAppSessionManager } from 'src/whatsapp/whatsapp-session.manager';

@Processor('devices')
export class DevicesProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private sessionManager: WhatsAppSessionManager,
  ) {
    super();
  }

  async process(job: Job<{ deviceId: string }>): Promise<void> {
    if (job.name === JOB_NAMES.DEVICE_PAIR_START || job.name === JOB_NAMES.DEVICE_RECONNECT) {
      await this.sessionManager.connect(job.data.deviceId);
    }
  }
}