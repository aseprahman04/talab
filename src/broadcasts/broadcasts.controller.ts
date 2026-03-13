import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@Controller('broadcasts')
@UseGuards(JwtAuthGuard)
export class BroadcastsController {
  constructor(private service: BroadcastsService) {}

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateBroadcastDto) { return this.service.create(user.sub, dto); }

  @Post(':id/start')
  start(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.start(user.sub, id); }
}
