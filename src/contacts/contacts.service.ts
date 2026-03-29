import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { BulkImportContactsDto } from './dto/bulk-import-contacts.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactListDto } from './dto/create-contact-list.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateContactDto) {
    await this.assertMembership(userId, dto.workspaceId);
    return this.prisma.contact.upsert({
      where: { workspaceId_phoneNumber: { workspaceId: dto.workspaceId, phoneNumber: dto.phoneNumber } },
      update: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      create: {
        workspaceId: dto.workspaceId,
        phoneNumber: dto.phoneNumber,
        name: dto.name,
        email: dto.email,
        tags: dto.tags ?? [],
        notes: dto.notes,
      },
    });
  }

  async bulkImport(userId: string, dto: BulkImportContactsDto) {
    await this.assertMembership(userId, dto.workspaceId);
    let imported = 0;
    let skipped = 0;
    for (const entry of dto.contacts) {
      try {
        await this.prisma.contact.upsert({
          where: { workspaceId_phoneNumber: { workspaceId: dto.workspaceId, phoneNumber: entry.phoneNumber } },
          update: {
            ...(entry.name !== undefined && { name: entry.name }),
            ...(entry.email !== undefined && { email: entry.email }),
            ...(entry.tags !== undefined && { tags: entry.tags }),
            ...(entry.notes !== undefined && { notes: entry.notes }),
          },
          create: {
            workspaceId: dto.workspaceId,
            phoneNumber: entry.phoneNumber,
            name: entry.name,
            email: entry.email,
            tags: entry.tags ?? [],
            notes: entry.notes,
          },
        });
        imported++;
      } catch {
        skipped++;
      }
    }
    return { imported, skipped };
  }

  async findAll(userId: string, workspaceId: string) {
    await this.assertMembership(userId, workspaceId);
    return this.prisma.contact.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Contact not found');
    await this.assertMembership(userId, contact.workspaceId);
    await this.prisma.contact.delete({ where: { id } });
    return { success: true };
  }

  async createList(userId: string, dto: CreateContactListDto) {
    await this.assertMembership(userId, dto.workspaceId);
    return this.prisma.contactList.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findAllLists(userId: string, workspaceId: string) {
    await this.assertMembership(userId, workspaceId);
    const lists = await this.prisma.contactList.findMany({
      where: { workspaceId },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return lists.map((list: typeof lists[number]) => ({ ...list, memberCount: list._count.members }));
  }

  async addToList(userId: string, contactListId: string, contactIds: string[]) {
    const list = await this.prisma.contactList.findUnique({ where: { id: contactListId } });
    if (!list) throw new NotFoundException('Contact list not found');
    await this.assertMembership(userId, list.workspaceId);
    const results = await Promise.allSettled(
      contactIds.map((contactId) =>
        this.prisma.contactListMember.create({ data: { contactListId, contactId } }),
      ),
    );
    const added = results.filter((r) => r.status === 'fulfilled').length;
    return { added, skipped: results.length - added };
  }

  async removeFromList(userId: string, contactListId: string, contactId: string) {
    const list = await this.prisma.contactList.findUnique({ where: { id: contactListId } });
    if (!list) throw new NotFoundException('Contact list not found');
    await this.assertMembership(userId, list.workspaceId);
    await this.prisma.contactListMember.delete({
      where: { contactListId_contactId: { contactListId, contactId } },
    });
    return { success: true };
  }

  async getListMembers(userId: string, contactListId: string) {
    const list = await this.prisma.contactList.findUnique({ where: { id: contactListId } });
    if (!list) throw new NotFoundException('Contact list not found');
    await this.assertMembership(userId, list.workspaceId);
    const members = await this.prisma.contactListMember.findMany({
      where: { contactListId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
    return members.map((m: { contact: unknown }) => m.contact);
  }

  private async assertMembership(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a workspace member');
  }
}
