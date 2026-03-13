import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AutoRepliesProcessor } from './processors/auto-replies.processor';
import { BroadcastsProcessor } from './processors/broadcasts.processor';
import { MessagesProcessor } from './processors/messages.processor';
import { WebhooksProcessor } from './processors/webhooks.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'messages' },
      { name: 'webhooks' },
      { name: 'broadcasts' },
      { name: 'devices' },
      { name: 'auto-replies' },
    ),
  ],
  providers: [QueueService, MessagesProcessor, WebhooksProcessor, BroadcastsProcessor, AutoRepliesProcessor],
  exports: [QueueService],
})
export class QueueModule {}
