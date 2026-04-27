import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateOrderDto) {
    const total = dto.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return this.prisma.order.create({
      data: {
        workspaceId,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        notes: dto.notes,
        totalAmount: total,
        items: { create: dto.items },
      },
      include: { items: true },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.order.findMany({
      where: { workspaceId },
      include: { items: true, invoice: { select: { id: true, invoiceNo: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, invoice: { include: { paymentProofs: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.workspaceId !== workspaceId) throw new ForbiddenException();
    return order;
  }

  async updateStatus(workspaceId: string, id: string, dto: UpdateOrderStatusDto) {
    await this.findOne(workspaceId, id);
    return this.prisma.order.update({ where: { id }, data: { status: dto.status } });
  }

  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.prisma.order.delete({ where: { id } });
  }
}
