import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private service: MessagesService) {}

  @Post('send')
  send(@CurrentUser() user: { sub: string }, @Body() dto: SendMessageDto) { return this.service.send(user.sub, dto); }

  @Post(':id/retry')
  retry(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.retry(user.sub, id); }

  @Get()
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) { return this.service.list(user.sub, workspaceId); }
}
