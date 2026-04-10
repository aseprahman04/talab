import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
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
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
