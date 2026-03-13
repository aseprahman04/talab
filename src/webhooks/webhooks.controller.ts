import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private service: WebhooksService) {}

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateWebhookDto) { return this.service.create(user.sub, dto); }

  @Get()
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) { return this.service.list(user.sub, workspaceId); }

  @Get(':id/logs')
  logs(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.service.logs(user.sub, id, limit ? Number(limit) : undefined);
  }

  @Post(':id/test')
  test(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.testDelivery(user.sub, id); }
}
