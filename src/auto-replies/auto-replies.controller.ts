import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AutoRepliesService } from './auto-replies.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';

@Controller('auto-replies')
@UseGuards(JwtAuthGuard)
export class AutoRepliesController {
  constructor(private service: AutoRepliesService) {}
  @Post() create(@CurrentUser() user: { sub: string }, @Body() dto: CreateAutoReplyDto) { return this.service.create(user.sub, dto); }
  @Get() list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string, @Query('deviceId') deviceId?: string) { return this.service.list(user.sub, workspaceId, deviceId); }
}
