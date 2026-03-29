import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private service: MessagesService) {}

  @Post('send')
  @ApiOperation({ summary: 'Queue a message for delivery' })
  @ApiResponse({ status: 201, description: 'Message queued, returns message record' })
  send(@CurrentUser() user: { sub: string }, @Body() dto: SendMessageDto) { return this.service.send(user.sub, dto); }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed message' })
  @ApiResponse({ status: 200, description: 'Message re-queued' })
  retry(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.retry(user.sub, id); }

  @Get()
  @ApiOperation({ summary: 'List messages for a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, description: 'Array of messages ordered by createdAt desc' })
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) { return this.service.list(user.sub, workspaceId); }
}
