import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { INestApplication, Logger } from '@nestjs/common';
import { ServerOptions } from 'socket.io';

/**
 * Socket.IO adapter backed by Redis pub/sub.
 *
 * Both the API process and each worker process use this adapter.
 * Any emit from a worker (e.g. "message.sent") is published to Redis
 * and forwarded by the API's Socket.IO server to connected frontend clients.
 *
 * Usage:
 *   const adapter = new RedisIoAdapter(app);
 *   await adapter.connectToRedis();
 *   app.useWebSocketAdapter(adapter);
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  constructor(app: INestApplication) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const opts = {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
    };
    const pubClient = new Redis(opts);
    const subClient = pubClient.duplicate();

    try {
      await Promise.all([
        new Promise<void>((res, rej) => {
          const t = setTimeout(() => rej(new Error('Redis pub timeout')), 5000);
          pubClient.once('ready', () => { clearTimeout(t); res(); });
          pubClient.once('error', rej);
        }),
        new Promise<void>((res, rej) => {
          const t = setTimeout(() => rej(new Error('Redis sub timeout')), 5000);
          subClient.once('ready', () => { clearTimeout(t); res(); });
          subClient.once('error', rej);
        }),
      ]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Redis Socket.IO adapter connected');
    } catch (err) {
      // Non-fatal: fall back to in-process Socket.IO adapter.
      // Worker emits won't reach API clients until Redis is available,
      // but the process still starts and processes queue jobs.
      this.logger.warn(`Redis Socket.IO adapter failed, falling back to in-process: ${String(err)}`);
      pubClient.disconnect();
      subClient.disconnect();
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
