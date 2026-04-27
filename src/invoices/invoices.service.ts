import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNo(workspaceId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { workspaceId } });
    const pad = String(count + 1).padStart(4, '0');
    const year = new Date().getFullYear();
    return `INV-${year}-${pad}`;
  }

  async create(workspaceId: string, dto: CreateInvoiceDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId }, include: { invoice: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.workspaceId !== workspaceId) throw new ForbiddenException();
    if (order.invoice) throw new BadRequestException('Invoice already exists for this order');

    const vatRate = dto.vatRate ?? 0;
    const vatAmount = Number(order.totalAmount) * (vatRate / 100);
    const invoiceNo = await this.generateInvoiceNo(workspaceId);

    return this.prisma.invoice.create({
      data: {
        orderId: dto.orderId,
        workspaceId,
        invoiceNo,
        totalAmount: order.totalAmount,
        vatRate,
        vatAmount,
        logoUrl: dto.logoUrl,
      },
      include: { order: { include: { items: true } } },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: { workspaceId },
      include: {
        order: { select: { contactName: true, contactPhone: true, status: true } },
        paymentProofs: { select: { id: true, status: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: { include: { items: true } }, paymentProofs: true },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (inv.workspaceId !== workspaceId) throw new ForbiddenException();
    return inv;
  }

  async markPaid(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.invoice.update({ where: { id }, data: { status: 'PAID' } });
  }
}
