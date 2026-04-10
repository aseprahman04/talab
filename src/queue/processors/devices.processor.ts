import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { QueueService } from 'src/queue/queue.service';
import { WhatsAppSessionManager } from 'src/whatsapp/whatsapp-session.manager';
import { readShardConfig, shardForDevice } from 'src/common/utils/shard';

@Processor('devices')
export class DevicesProcessor extends WorkerHost {
  private readonly shardId: number;
  private readonly totalShards: number;

  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private sessionManager: WhatsAppSessionManager,
  ) {
    super();
    const cfg = readShardConfig();
    this.shardId = cfg.shardId;
    this.totalShards = cfg.totalShards;
  }

  async process(job: Job<{ deviceId: string }>, token?: string): Promise<void> {
    if (job.name !== JOB_NAMES.DEVICE_PAIR_START && job.name !== JOB_NAMES.DEVICE_RECONNECT) return;

    // Shard guard: only the shard that owns this device can manage its WA session
    if (shardForDevice(job.data.deviceId, this.totalShards) !== this.shardId) {
      await job.moveToDelayed(Date.now() + 300, token);
      return;
    }

    await this.sessionManager.connect(job.data.deviceId);
  }
}