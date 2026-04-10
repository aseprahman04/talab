import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@ApiTags('Broadcasts')
@ApiBearerAuth()
@Controller('broadcasts')
@UseGuards(JwtAuthGuard)
export class BroadcastsController {
  constructor(private service: BroadcastsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a broadcast campaign (starts in DRAFT)' })
  @ApiResponse({ status: 201, description: 'Broadcast created — call /start to enqueue' })
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateBroadcastDto) { return this.service.create(user.sub, dto); }

  @Get()
  @ApiOperation({ summary: 'List broadcasts for a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, description: 'Array of broadcasts with recipient list' })
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) { return this.service.list(user.sub, workspaceId); }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a draft broadcast — enqueues all recipients' })
  @ApiResponse({ status: 200, description: 'Broadcast queued, status → RUNNING' })
  start(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.start(user.sub, id); }
}
