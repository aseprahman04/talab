import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Processor('messages')
export class MessagesProcessor extends WorkerHost {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) { super(); }

  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'message.send') return;
    const message = await this.prisma.message.findUnique({ where: { id: job.data.messageId } });
    if (!message) return;
    if (['SENT', 'DELIVERED', 'READ'].includes(message.status)) return;

    await this.prisma.message.update({ where: { id: message.id }, data: { status: 'PROCESSING' } });
    // Placeholder: integrate actual WA session engine here.
    await this.prisma.message.update({
      where: { id: message.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        providerMessageId: `stub-${message.id}`,
      },
    });
    this.realtime.emitToWorkspace(message.workspaceId, 'message.sent', { messageId: message.id });
  }
}
