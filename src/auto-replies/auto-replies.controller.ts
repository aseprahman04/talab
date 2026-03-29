import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AutoRepliesService } from './auto-replies.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';

@ApiTags('Auto Replies')
@ApiBearerAuth()
@Controller('auto-replies')
@UseGuards(JwtAuthGuard)
export class AutoRepliesController {
  constructor(private service: AutoRepliesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a keyword auto-reply rule' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateAutoReplyDto) { return this.service.create(user.sub, dto); }

  @Get()
  @ApiOperation({ summary: 'List auto-reply rules for a workspace (optionally filtered by device)' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiResponse({ status: 200, description: 'Array of AutoReplyRule records' })
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string, @Query('deviceId') deviceId?: string) { return this.service.list(user.sub, workspaceId, deviceId); }
}
