import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get() check() { return { ok: true, service: 'watether-backend', at: new Date().toISOString() }; }
}
