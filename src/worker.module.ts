import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './database/prisma/prisma.module';
import { WorkerQueueModule } from './queue/worker-queue.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeModule } from './realtime/realtime.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

/**
 * WorkerModule — runs as a separate process from the API.
 *
 * Responsibilities:
 *  - Hold all WhatsApp WebSocket sessions (WhatsAppSessionManager)
 *  - Consume all BullMQ queues (messages, broadcasts, auto-replies, etc.)
 *  - Emit Socket.IO events via RealtimeGateway
 *
 * Note: RealtimeGateway here emits to its own Socket.IO server (port WORKER_PORT).
 * No frontend clients connect here — emits are no-ops until a Redis Socket.IO
 * adapter is added (Phase 2.5). The API's Socket.IO server on port 3009 serves clients.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const password = config.get<string>('REDIS_PASSWORD');
        return {
          connection: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: Number(config.get<string>('REDIS_PORT', '6379')),
            ...(password ? { password } : {}),
          },
        };
      },
    }),
    PrismaModule,
    RealtimeModule,
    QueueModule,
    WorkerQueueModule,
    WhatsAppModule,
  ],
})
export class WorkerModule {}
