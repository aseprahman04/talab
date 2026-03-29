import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private service: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Webhook created' })
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateWebhookDto) { return this.service.create(user.sub, dto); }

  @Get()
  @ApiOperation({ summary: 'List webhooks for a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, description: 'Array of webhooks' })
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) { return this.service.list(user.sub, workspaceId); }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get delivery logs for a webhook' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Array of WebhookDelivery records' })
  logs(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.service.logs(user.sub, id, limit ? Number(limit) : undefined);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test event to a webhook' })
  @ApiResponse({ status: 200, description: 'Test event queued' })
  test(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.testDelivery(user.sub, id); }
}
