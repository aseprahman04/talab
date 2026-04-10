/**
 * Contacts e2e — CRUD + lists + bulk import
 * Requires backend running. Point to VPS via .env.e2e.
 */
import { apiPost, apiGet, apiDelete, setupOrReuseTestUser } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let contactId: string;
let listId: string;

const PHONE_1 = '6281234567890';
const PHONE_2 = '6289876543210';

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupOrReuseTestUser());
});

describe('Contacts e2e', () => {
  describe('POST /contacts', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/contacts', { workspaceId, phoneNumber: PHONE_1 });
      expect(status).toBe(401);
    });

    it('creates a contact', async () => {
      const { status, data } = await apiPost<{ id: string; phoneNumber: string; name?: string }>(
        '/contacts',
        { workspaceId, phoneNumber: PHONE_1, name: 'Budi Santoso' },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.id).toBeTruthy();
      expect(data.phoneNumber).toBe(PHONE_1);
      contactId = data.id;
    });

    it('upserts on duplicate phone number', async () => {
      const { status, data } = await apiPost<{ id: string }>(
        '/contacts',
        { workspaceId, phoneNumber: PHONE_1, name: 'Budi Updated' },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.id).toBe(contactId);
    });

    it('returns 400 for missing phoneNumber', async () => {
      const { status } = await apiPost('/contacts', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });
  });

  describe('POST /contacts/bulk-import', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/contacts/bulk-import', {
        workspaceId,
        contacts: [{ phoneNumber: PHONE_2 }],
      });
      expect(status).toBe(401);
    });

    it('imports contacts and returns counts', async () => {
      const { status, data } = await apiPost<{ imported: number; skipped: number }>(
        '/contacts/bulk-import',
        {
          workspaceId,
          contacts: [
            { phoneNumber: PHONE_2, name: 'Citra' },
            { phoneNumber: PHONE_1, name: 'Budi Dup' },
          ],
        },
        accessToken,
      );
      expect(status).toBe(201);
      expect(typeof data.imported).toBe('number');
      expect(typeof data.skipped).toBe('number');
      expect(data.imported + data.skipped).toBe(2);
    });
  });

  describe('GET /contacts', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiGet(`/contacts?workspaceId=${workspaceId}`);
      expect(status).toBe(401);
    });

    it('returns contacts for workspace', async () => {
      const { status, data } = await apiGet<Array<{ id: string; phoneNumber: string }>>(
        `/contacts?workspaceId=${workspaceId}`,
        accessToken,
      );
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((c) => c.id === contactId)).toBe(true);
    });
  });

  describe('Contact lists', () => {
    describe('POST /contacts/lists', () => {
      it('returns 401 without auth', async () => {
        const { status } = await apiPost('/contacts/lists', { workspaceId, name: 'VIP' });
        expect(status).toBe(401);
      });

      it('creates a contact list', async () => {
        const { status, data } = await apiPost<{ id: string; name: string }>(
          '/contacts/lists',
          { workspaceId, name: `E2E VIP List ${Date.now()}` },
          accessToken,
        );
        expect(status).toBe(201);
        expect(data.id).toBeTruthy();
        listId = data.id;
      });
    });

    describe('GET /contacts/lists', () => {
      it('returns 401 without auth', async () => {
        const { status } = await apiGet(`/contacts/lists?workspaceId=${workspaceId}`);
        expect(status).toBe(401);
      });

      it('returns lists with member counts', async () => {
        const { status, data } = await apiGet<Array<{ id: string; memberCount: number }>>(
          `/contacts/lists?workspaceId=${workspaceId}`,
          accessToken,
        );
        expect(status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        const found = data.find((l) => l.id === listId);
        expect(found).toBeDefined();
        expect(typeof found!.memberCount).toBe('number');
      });
    });

    describe('POST /contacts/lists/:listId/members', () => {
      it('adds contacts to list', async () => {
        const { status, data } = await apiPost<{ added: number }>(
          `/contacts/lists/${listId}/members`,
          { contactIds: [contactId] },
          accessToken,
        );
        expect(status).toBe(201);
        expect(data.added).toBe(1);
      });
    });

    describe('GET /contacts/lists/:listId/members', () => {
      it('returns list members', async () => {
        const { status, data } = await apiGet<Array<{ contact: { id: string } }>>(
          `/contacts/lists/${listId}/members`,
          accessToken,
        );
        expect(status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data.some((m) => m.contact.id === contactId)).toBe(true);
      });
    });

    describe('DELETE /contacts/lists/:listId/members/:contactId', () => {
      it('removes contact from list', async () => {
        const { status } = await apiDelete(`/contacts/lists/${listId}/members/${contactId}`, accessToken);
        expect(status).toBe(200);
      });

      it('list is now empty', async () => {
        const { data } = await apiGet<unknown[]>(`/contacts/lists/${listId}/members`, accessToken);
        expect(data).toHaveLength(0);
      });
    });
  });

  describe('DELETE /contacts/:id', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiDelete(`/contacts/${contactId}`);
      expect(status).toBe(401);
    });

    it('deletes a contact', async () => {
      const { status } = await apiDelete(`/contacts/${contactId}`, accessToken);
      expect(status).toBe(200);
    });

    it('returns 404 for unknown contact id', async () => {
      const { status } = await apiDelete('/contacts/00000000-0000-0000-0000-000000000000', accessToken);
      expect(status).toBe(404);
    });
  });
});
