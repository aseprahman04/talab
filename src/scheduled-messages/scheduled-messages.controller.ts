import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateScheduledMessageDto } from './dto/create-scheduled-message.dto';
import { ScheduledMessagesService } from './scheduled-messages.service';

@ApiTags('scheduled-messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduled-messages')
export class ScheduledMessagesController {
  constructor(private service: ScheduledMessagesService) {}

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateScheduledMessageDto) {
    return this.service.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) {
    return this.service.list(user.sub, workspaceId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.service.remove(user.sub, id);
  }

  @Patch(':id/toggle')
  toggle(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body() body: { isEnabled: boolean }) {
    return this.service.toggle(user.sub, id, body.isEnabled);
  }
}
