import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('messages') private messagesQueue: Queue,
    @InjectQueue('webhooks') private webhooksQueue: Queue,
    @InjectQueue('broadcasts') private broadcastsQueue: Queue,
    @InjectQueue('devices') private devicesQueue: Queue,
    @InjectQueue('auto-replies') private autoRepliesQueue: Queue,
  ) {}

  async onModuleInit() {
    // BullMQ requires noeviction; override allkeys-lru set by the shared Redis container
    try {
      const redis = await this.messagesQueue.client;
      await (redis as unknown as { config(cmd: string, key: string, val: string): Promise<unknown> })
        .config('SET', 'maxmemory-policy', 'noeviction');
      this.logger.log('Redis maxmemory-policy set to noeviction');
    } catch (err) {
      this.logger.warn(`Could not set Redis maxmemory-policy: ${err}`);
    }
  }

  get messages() { return this.messagesQueue; }
  get webhooks() { return this.webhooksQueue; }
  get broadcasts() { return this.broadcastsQueue; }
  get devices() { return this.devicesQueue; }
  get autoReplies() { return this.autoRepliesQueue; }
}
