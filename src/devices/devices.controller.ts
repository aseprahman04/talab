import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { WorkspaceRoles } from 'src/common/decorators/workspace-roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from 'src/common/guards/workspace-role.guard';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DevicesService } from './devices.service';

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class DevicesController {
  constructor(private service: DevicesService) {}

  @Post()
  @WorkspaceRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new device in a workspace' })
  @ApiResponse({ status: 201, description: 'Device created' })
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateDeviceDto) { return this.service.create(user.sub, dto); }

  @Get()
  @ApiOperation({ summary: 'List all devices in a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, description: 'Array of devices' })
  list(@CurrentUser() user: { sub: string }, @Query('workspaceId') workspaceId: string) { return this.service.list(user.sub, workspaceId); }

  @Post(':id/pair')
  @ApiOperation({ summary: 'Start WhatsApp pairing for a device' })
  @ApiResponse({ status: 200, description: 'Pairing started, returns QR stub' })
  startPairing(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.startPairing(user.sub, id); }

  @Post(':id/reconnect')
  @ApiOperation({ summary: 'Reconnect a disconnected device' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  reconnect(@CurrentUser() user: { sub: string }, @Param('id') id: string) { return this.service.reconnect(user.sub, id); }

  @Post(':id/tokens')
  @ApiOperation({ summary: 'Generate a new API token for a device' })
  @ApiBody({ schema: { properties: { name: { type: 'string', example: 'Production token' } } } })
  @ApiResponse({ status: 201, description: 'Returns tokenId and plain token — store securely, shown once' })
  createToken(@CurrentUser() user: { sub: string }, @Param('id') id: string, @Body('name') name: string) { return this.service.createToken(user.sub, id, name || 'Default token'); }
}
