import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AutoRepliesProcessor } from './processors/auto-replies.processor';
import { BroadcastsProcessor } from './processors/broadcasts.processor';
import { DevicesProcessor } from './processors/devices.processor';
import { MessagesProcessor } from './processors/messages.processor';
import { ScheduledMessagesProcessor } from './processors/scheduled-messages.processor';
import { WebhooksProcessor } from './processors/webhooks.processor';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'messages' },
      { name: 'webhooks' },
      { name: 'broadcasts' },
      { name: 'devices' },
      { name: 'auto-replies' },
      { name: 'scheduled-messages' },
    ),
  ],
  providers: [QueueService, MessagesProcessor, WebhooksProcessor, BroadcastsProcessor, AutoRepliesProcessor, DevicesProcessor, ScheduledMessagesProcessor],
  exports: [QueueService],
})
export class QueueModule {}
