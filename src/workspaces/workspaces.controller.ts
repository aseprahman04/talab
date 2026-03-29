import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private service: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created, owner membership added' })
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateWorkspaceDto) {
    return this.service.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces the current user is a member of' })
  @ApiResponse({ status: 200, description: 'Array of workspace memberships with workspace details' })
  list(@CurrentUser() user: { sub: string }) {
    return this.service.listForUser(user.sub);
  }
}
