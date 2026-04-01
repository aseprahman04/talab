import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { makeWASocket, DisconnectReason, WASocket, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { QueueService } from 'src/queue/queue.service';
import { JOB_NAMES } from 'src/queue/jobs/job-names';
import { usePrismaAuthState } from './whatsapp-auth-store';

@Injectable()
export class WhatsAppSessionManager implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppSessionManager.name);
  private sessions = new Map<string, WASocket>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly queue: QueueService,
  ) {}

  async onModuleInit() {
    const connected = await this.prisma.device.findMany({
      where: { status: 'CONNECTED' },
      select: { id: true },
    });
    for (const device of connected) {
      this.logger.log(`Restoring session for device ${device.id}`);
      await this.connect(device.id).catch((err) =>
        this.logger.error(`Failed to restore device ${device.id}: ${err}`),
      );
    }
  }

  async connect(deviceId: string): Promise<void> {
    this.disconnect(deviceId);

    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      this.logger.warn(`Device ${deviceId} not found, skipping connect`);
      return;
    }

    const { state, saveCreds } = await usePrismaAuthState(deviceId, this.prisma);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: this.makeSilentLogger(),
      browser: Browsers.appropriate('Chrome'),
      connectTimeoutMs: 30_000,
      keepAliveIntervalMs: 15_000,
    });

    this.sessions.set(deviceId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.logger.log(`QR code received for device ${deviceId}`);
        await this.prisma.device.update({
          where: { id: deviceId },
          data: { status: 'PAIRING' },
        });
        this.realtime.emitToWorkspace(device.workspaceId, 'device.status.updated', {
          deviceId,
          status: 'PAIRING',
          qrCode: qr,
        });
        await this.dispatchWebhooks(device.workspaceId, 'device.pairing', {
          event: 'device.pairing',
          workspaceId: device.workspaceId,
          deviceId,
          status: 'PAIRING',
          timestamp: new Date().toISOString(),
        });
      }

      if (connection === 'open') {
        this.logger.log(`Device ${deviceId} connected`);
        const phoneNumber = sock.user?.id?.split(':')[0] ?? null;
        const now = new Date();
        await this.prisma.device.update({
          where: { id: deviceId },
          data: { status: 'CONNECTED', connectedAt: now, lastSeenAt: now, phoneNumber },
        });
        this.realtime.emitToWorkspace(device.workspaceId, 'device.status.updated', {
          deviceId,
          status: 'CONNECTED',
          phoneNumber,
        });
        await this.dispatchWebhooks(device.workspaceId, 'device.connected', {
          event: 'device.connected',
          workspaceId: device.workspaceId,
          deviceId,
          status: 'CONNECTED',
          phoneNumber,
          timestamp: now.toISOString(),
        });
      }

      if (connection === 'close') {
        const boom = lastDisconnect?.error as Boom | undefined;
        const statusCode = boom?.output?.statusCode;
        const reason = boom?.message ?? boom?.output?.payload?.error ?? 'unknown';
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        // 403 = banned/forbidden, 405 = session not found on WA servers (never paired), 500 = bad session
        const isPermanent = loggedOut || statusCode === 403 || statusCode === 405 || statusCode === 500;
        this.logger.warn(`Device ${deviceId} disconnected — code=${statusCode} reason="${reason}" permanent=${isPermanent}`);

        // Only manage state if this socket is still the active one — prevents
        // a stale close event from a replaced socket from clobbering the new one
        const isActiveSocket = this.sessions.get(deviceId) === sock;
        if (isActiveSocket) {
          this.sessions.delete(deviceId);
        }

        if (isPermanent) {
          await this.prisma.deviceSession.deleteMany({ where: { deviceId } });
          await this.prisma.device.update({
            where: { id: deviceId },
            data: { status: 'DISCONNECTED' },
          });
          this.realtime.emitToWorkspace(device.workspaceId, 'device.status.updated', {
            deviceId,
            status: 'DISCONNECTED',
          });
        } else if (isActiveSocket) {
          // Only schedule reconnect for the active socket, not replaced ones
          setTimeout(() => {
            this.connect(deviceId).catch((err) =>
              this.logger.error(`Reconnect failed for device ${deviceId}: ${err}`),
            );
          }, 5000);
        }
      }
    });
  }

  disconnect(deviceId: string) {
    const existing = this.sessions.get(deviceId);
    if (existing) {
      existing.end(undefined);
      this.sessions.delete(deviceId);
    }
  }

  isConnected(deviceId: string): boolean {
    return this.sessions.has(deviceId);
  }

  private async dispatchWebhooks(workspaceId: string, eventType: string, payload: unknown) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { workspaceId, isActive: true },
      select: { id: true },
    });
    await Promise.all(webhooks.map(async (webhook: { id: string }) => {
      const delivery = await this.prisma.webhookDelivery.create({
        data: { webhookId: webhook.id, eventType, payload: payload as object },
      });
      await this.queue.webhooks.add(JOB_NAMES.WEBHOOK_DELIVERY, { deliveryId: delivery.id }, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      });
    }));
  }

  private makeSilentLogger() {
    const noop = () => {};
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const logger = {
      level: 'silent',
      trace: noop,
      debug: noop,
      info: noop,
      warn: (msg: unknown) => self.logger.warn(String(msg)),
      error: (msg: unknown) => self.logger.error(String(msg)),
      child: (_obj: Record<string, unknown>) => logger,
    };
    return logger;
  }
}
