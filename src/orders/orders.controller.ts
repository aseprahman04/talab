import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../workspaces/workspace.guard';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Param('workspaceId') wid: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(wid, dto);
  }

  @Get()
  findAll(@Param('workspaceId') wid: string) {
    return this.ordersService.findAll(wid);
  }

  @Get(':id')
  findOne(@Param('workspaceId') wid: string, @Param('id') id: string) {
    return this.ordersService.findOne(wid, id);
  }

  @Patch(':id/status')
  updateStatus(@Param('workspaceId') wid: string, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(wid, id, dto);
  }

  @Delete(':id')
  remove(@Param('workspaceId') wid: string, @Param('id') id: string) {
    return this.ordersService.remove(wid, id);
  }
}
