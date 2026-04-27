import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ContactsModule } from './contacts/contacts.module';
import { AutoRepliesModule } from './auto-replies/auto-replies.module';
import { ScheduledMessagesModule } from './scheduled-messages/scheduled-messages.module';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { DemoRequestsModule } from './demo-requests/demo-requests.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DevicesModule } from './devices/devices.module';
import { HealthModule } from './health/health.module';
import { MessagesModule } from './messages/messages.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeModule } from './realtime/realtime.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { OrdersModule } from './orders/orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentProofsModule } from './payment-proofs/payment-proofs.module';
import { OcrModule } from './ocr/ocr.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    PrismaModule,
    MailModule,
    DemoRequestsModule,
    SubscriptionsModule,
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
    ScheduledMessagesModule,
    AuditLogsModule,
    ContactsModule,
    OcrModule,
    OrdersModule,
    InvoicesModule,
    PaymentProofsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
