import { Global, Module } from '@nestjs/common';
import { WhatsAppSessionManager } from './whatsapp-session.manager';

@Global()
@Module({
  providers: [WhatsAppSessionManager],
  exports: [WhatsAppSessionManager],
})
export class WhatsAppModule {}
