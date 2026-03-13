import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('messages') private messagesQueue: Queue,
    @InjectQueue('webhooks') private webhooksQueue: Queue,
    @InjectQueue('broadcasts') private broadcastsQueue: Queue,
    @InjectQueue('devices') private devicesQueue: Queue,
    @InjectQueue('auto-replies') private autoRepliesQueue: Queue,
  ) {}

  get messages() { return this.messagesQueue; }
  get webhooks() { return this.webhooksQueue; }
  get broadcasts() { return this.broadcastsQueue; }
  get devices() { return this.devicesQueue; }
  get autoReplies() { return this.autoRepliesQueue; }
}
