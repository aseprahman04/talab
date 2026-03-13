import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { WorkspaceRoles } from 'src/common/decorators/workspace-roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from 'src/common/guards/workspace-role.guard';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DevicesService } from './devices.service';

@Controller('devices')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class DevicesController {
  constructor(private service: DevicesService) {}

  @Post()
  @WorkspaceRoles('OWNER', 'ADMIN')
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateDeviceDto) { return this.service.create(user.sub, dto); }

  @Get()
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) { return this.service.list(user.sub, workspaceId); }

  @Post(':id/pair')
  startPairing(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.startPairing(user.sub, id); }

  @Post(':id/reconnect')
  reconnect(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.reconnect(user.sub, id); }

  @Post(':id/tokens')
  createToken(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body('name') name: string) { return this.service.createToken(user.sub, id, name || 'Default token'); }
}
