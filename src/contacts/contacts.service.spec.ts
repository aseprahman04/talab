import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ContactsService } from './contacts.service';

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const CONTACT_ID = '00000000-0000-0000-0000-000000000003';
const LIST_ID = '00000000-0000-0000-0000-000000000004';
const PHONE = '6281234567890';

const mockPrisma = {
  workspaceMember: { findUnique: jest.fn() },
  contact: { upsert: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  contactList: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  contactListMember: { create: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
};

const member = { id: 'member-1', workspaceId: WS_ID, userId: USER_ID };
const contact = { id: CONTACT_ID, workspaceId: WS_ID, phoneNumber: PHONE, name: 'Budi' };
const list = { id: LIST_ID, workspaceId: WS_ID, name: 'Pelanggan VIP' };

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ContactsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ContactsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a contact', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.contact.upsert.mockResolvedValue(contact);
      const result = await service.create(USER_ID, { workspaceId: WS_ID, phoneNumber: PHONE });
      expect(result.phoneNumber).toBe(PHONE);
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.create(USER_ID, { workspaceId: WS_ID, phoneNumber: PHONE }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('bulkImport', () => {
    it('imports contacts and counts skipped', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.contact.upsert
        .mockResolvedValueOnce(contact)
        .mockRejectedValueOnce(new Error('duplicate'));
      const result = await service.bulkImport(USER_ID, {
        workspaceId: WS_ID,
        contacts: [{ phoneNumber: PHONE }, { phoneNumber: '6289876543210' }],
      });
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  describe('findAll', () => {
    it('returns contacts for workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.contact.findMany.mockResolvedValue([contact]);
      const result = await service.findAll(USER_ID, WS_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('deletes a contact', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue(contact);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.contact.delete.mockResolvedValue(contact);
      const result = await service.remove(USER_ID, CONTACT_ID);
      expect(result.success).toBe(true);
    });

    it('throws NotFoundException for unknown contact', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue(null);
      await expect(service.remove(USER_ID, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createList', () => {
    it('creates a contact list', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.contactList.create.mockResolvedValue(list);
      const result = await service.createList(USER_ID, { workspaceId: WS_ID, name: 'Pelanggan VIP' });
      expect(result.name).toBe('Pelanggan VIP');
    });
  });

  describe('findAllLists', () => {
    it('returns lists with memberCount', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.contactList.findMany.mockResolvedValue([{ ...list, _count: { members: 3 } }]);
      const result = await service.findAllLists(USER_ID, WS_ID);
      expect(result[0].memberCount).toBe(3);
    });
  });

  describe('addToList', () => {
    it('adds contacts to list', async () => {
      mockPrisma.contactList.findUnique.mockResolvedValue(list);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.contactListMember.create.mockResolvedValue({});
      const result = await service.addToList(USER_ID, LIST_ID, [CONTACT_ID]);
      expect(result.added).toBe(1);
    });

    it('throws NotFoundException for unknown list', async () => {
      mockPrisma.contactList.findUnique.mockResolvedValue(null);
      await expect(service.addToList(USER_ID, 'bad-id', [])).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromList', () => {
    it('removes contact from list', async () => {
      mockPrisma.contactList.findUnique.mockResolvedValue(list);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.contactListMember.delete.mockResolvedValue({});
      const result = await service.removeFromList(USER_ID, LIST_ID, CONTACT_ID);
      expect(result.success).toBe(true);
    });
  });
});
