import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ContactsModule } from './contacts/contacts.module';
import { AutoRepliesModule } from './auto-replies/auto-replies.module';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { DemoRequestsModule } from './demo-requests/demo-requests.module';
import { DevicesModule } from './devices/devices.module';
import { HealthModule } from './health/health.module';
import { MessagesModule } from './messages/messages.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeModule } from './realtime/realtime.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

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
    JwtModule.register({}),
    PrismaModule,
    DemoRequestsModule,
    QueueModule,
    RealtimeModule,
    HealthModule,
    AuthModule,
    WorkspacesModule,
    DevicesModule,
    MessagesModule,
    WebhooksModule,
    BroadcastsModule,
    AutoRepliesModule,
    AuditLogsModule,
    ContactsModule,
  ],
})
export class AppModule {}
