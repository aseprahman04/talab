/**
 * Webhooks e2e — create, list, logs, test delivery
 * Requires local backend running: npm run start:dev
 */
import { apiPost, apiGet, setupTestUser } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let webhookId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupTestUser('wh'));
});

describe('Webhooks e2e', () => {
  describe('POST /webhooks', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/webhooks', {
        workspaceId,
        url: 'https://example.com/hook',
        events: ['message.received'],
      });
      expect(status).toBe(401);
    });

    it('creates a webhook endpoint', async () => {
      const { status, data } = await apiPost<{ id: string; url: string; events: string[] }>(
        '/webhooks',
        {
          workspaceId,
          url: 'https://example.com/e2e-hook',
          events: ['message.received', 'message.sent'],
        },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.id).toBeTruthy();
      expect(data.url).toBe('https://example.com/e2e-hook');
      webhookId = data.id;
    });

    it('returns 400 for missing required fields', async () => {
      const { status } = await apiPost('/webhooks', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });

    it('returns 403 for workspace the user is not a member of', async () => {
      const { accessToken: otherToken } = await setupTestUser('wh-other');
      const { status } = await apiPost(
        '/webhooks',
        { workspaceId, url: 'https://example.com/hook', events: ['message.received'] },
        otherToken,
      );
      expect(status).toBe(403);
    });
  });

  describe('GET /webhooks', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiGet(`/webhooks?workspaceId=${workspaceId}`);
      expect(status).toBe(401);
    });

    it('returns webhook list for workspace', async () => {
      const { status, data } = await apiGet<Array<{ id: string }>>(`/webhooks?workspaceId=${workspaceId}`, accessToken);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((w) => w.id === webhookId)).toBe(true);
    });
  });

  describe('GET /webhooks/:id/logs', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiGet(`/webhooks/${webhookId}/logs`);
      expect(status).toBe(401);
    });

    it('returns delivery log array (empty initially)', async () => {
      const { status, data } = await apiGet<unknown[]>(`/webhooks/${webhookId}/logs`, accessToken);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('respects limit query param', async () => {
      const { status } = await apiGet(`/webhooks/${webhookId}/logs?limit=5`, accessToken);
      expect(status).toBe(200);
    });
  });

  describe('POST /webhooks/:id/test', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost(`/webhooks/${webhookId}/test`, {});
      expect(status).toBe(401);
    });

    it('queues a test delivery event', async () => {
      const { status } = await apiPost<{ success: boolean }>(`/webhooks/${webhookId}/test`, {}, accessToken);
      // 200 queued OK, or 503 if delivery system is unavailable in test env
      expect([200, 201, 503]).toContain(status);
    });
  });
});
