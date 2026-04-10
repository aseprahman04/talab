import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

const logger = new Logger('WATether Worker');

async function bootstrap() {
  // Use create() (not createApplicationContext) so RealtimeGateway has an
  // HTTP server to bind its Socket.IO instance to.
  const port = Number(process.env.WORKER_PORT ?? 3099);
  const app = await NestFactory.create(WorkerModule, { logger: ['log', 'warn', 'error'] });
  app.enableShutdownHooks();
  await app.listen(port);
  logger.log(`Started on port ${port} — listening for BullMQ jobs`);
}

bootstrap().catch((err: unknown) => {
  logger.error(`Fatal startup error: ${String(err)}`);
  process.exit(1);
});
