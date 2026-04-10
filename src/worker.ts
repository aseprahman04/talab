import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { RedisIoAdapter } from './realtime/redis-io.adapter';
import { readShardConfig } from './common/utils/shard';

const logger = new Logger('WATether Worker');

async function bootstrap() {
  const { shardId, totalShards } = readShardConfig();
  const port = Number(process.env.WORKER_PORT ?? 3099);

  const app = await NestFactory.create(WorkerModule, { logger: ['log', 'warn', 'error'] });
  app.enableShutdownHooks();

  // Redis Socket.IO adapter so this worker's emits reach frontend clients
  // connected to the API's Socket.IO server on port 3009.
  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);

  await app.listen(port);
  logger.log(`Started on port ${port} — shard ${shardId}/${totalShards} — listening for BullMQ jobs`);
}

bootstrap().catch((err: unknown) => {
  logger.error(`Fatal startup error: ${String(err)}`);
  process.exit(1);
});
