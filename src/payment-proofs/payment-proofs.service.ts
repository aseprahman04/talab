import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OcrService } from '../ocr/ocr.service';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';

@Injectable()
export class PaymentProofsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ocr: OcrService,
  ) {}

  async upload(workspaceId: string, dto: CreatePaymentProofDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.workspaceId !== workspaceId) throw new ForbiddenException();

    // Run OCR
    const ocrResult = await this.ocr.extractPaymentData(dto.imageUrl);
    const matchStatus = this.ocr.matchAmount(ocrResult.amount, Number(invoice.totalAmount));

    const proof = await this.prisma.paymentProof.create({
      data: {
        invoiceId: dto.invoiceId,
        imageUrl: dto.imageUrl,
        ocrAmount: ocrResult.amount,
        ocrDate: ocrResult.date,
        ocrRef: ocrResult.reference,
        matchScore: ocrResult.confidence,
        status: matchStatus,
      },
    });

    // Auto-update invoice status
    const invoiceStatus =
      matchStatus === 'MATCHED' ? 'AUTO_MATCHED' :
      matchStatus === 'MISMATCH' ? 'NEEDS_REVIEW' :
      'PROOF_UPLOADED';

    await this.prisma.invoice.update({ where: { id: dto.invoiceId }, data: { status: invoiceStatus } });

    return { proof, ocrResult, matchStatus };
  }

  async findByInvoice(workspaceId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.workspaceId !== workspaceId) throw new ForbiddenException();
    return this.prisma.paymentProof.findMany({ where: { invoiceId }, orderBy: { createdAt: 'desc' } });
  }

  async approve(workspaceId: string, proofId: string) {
    const proof = await this.prisma.paymentProof.findUnique({ where: { id: proofId }, include: { invoice: true } });
    if (!proof) throw new NotFoundException();
    if (proof.invoice.workspaceId !== workspaceId) throw new ForbiddenException();

    await this.prisma.paymentProof.update({ where: { id: proofId }, data: { status: 'APPROVED', reviewedAt: new Date() } });
    await this.prisma.invoice.update({ where: { id: proof.invoiceId }, data: { status: 'PAID' } });
    await this.prisma.order.update({ where: { id: proof.invoice.orderId }, data: { status: 'PAID' } });

    return { approved: true };
  }

  async reject(workspaceId: string, proofId: string) {
    const proof = await this.prisma.paymentProof.findUnique({ where: { id: proofId }, include: { invoice: true } });
    if (!proof) throw new NotFoundException();
    if (proof.invoice.workspaceId !== workspaceId) throw new ForbiddenException();

    await this.prisma.paymentProof.update({ where: { id: proofId }, data: { status: 'REJECTED', reviewedAt: new Date() } });
    await this.prisma.invoice.update({ where: { id: proof.invoiceId }, data: { status: 'NEEDS_REVIEW' } });

    return { rejected: true };
  }
}
