import { Module } from '@nestjs/common';
import { AutoRepliesProcessor } from './processors/auto-replies.processor';
import { BroadcastsProcessor } from './processors/broadcasts.processor';
import { DevicesProcessor } from './processors/devices.processor';
import { MessagesProcessor } from './processors/messages.processor';
import { ScheduledMessagesProcessor } from './processors/scheduled-messages.processor';
import { WebhooksProcessor } from './processors/webhooks.processor';

/** Registers all BullMQ consumers (processors). Only imported by WorkerModule. */
@Module({
  providers: [
    MessagesProcessor,
    WebhooksProcessor,
    BroadcastsProcessor,
    AutoRepliesProcessor,
    DevicesProcessor,
    ScheduledMessagesProcessor,
  ],
})
export class WorkerQueueModule {}
