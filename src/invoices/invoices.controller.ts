import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Param('workspaceId') wid: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(wid, dto);
  }

  @Get()
  findAll(@Param('workspaceId') wid: string) {
    return this.invoicesService.findAll(wid);
  }

  @Get(':id')
  findOne(@Param('workspaceId') wid: string, @Param('id') id: string) {
    return this.invoicesService.findOne(wid, id);
  }

  @Patch(':id/mark-paid')
  markPaid(@Param('workspaceId') wid: string, @Param('id') id: string) {
    return this.invoicesService.markPaid(wid, id);
  }
}
