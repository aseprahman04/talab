import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentProofsService } from './payment-proofs.service';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../workspaces/workspace.guard';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/payment-proofs')
export class PaymentProofsController {
  constructor(private readonly service: PaymentProofsService) {}

  @Post()
  upload(@Param('workspaceId') wid: string, @Body() dto: CreatePaymentProofDto) {
    return this.service.upload(wid, dto);
  }

  @Get('invoice/:invoiceId')
  findByInvoice(@Param('workspaceId') wid: string, @Param('invoiceId') invoiceId: string) {
    return this.service.findByInvoice(wid, invoiceId);
  }

  @Patch(':id/approve')
  approve(@Param('workspaceId') wid: string, @Param('id') id: string) {
    return this.service.approve(wid, id);
  }

  @Patch(':id/reject')
  reject(@Param('workspaceId') wid: string, @Param('id') id: string) {
    return this.service.reject(wid, id);
  }
}
