/**
 * Messages e2e — send, list, retry
 * Requires local backend running: npm run start:dev
 * Note: messages require a CONNECTED device to actually deliver. Tests verify API contract only.
 */
import { apiPost, apiGet, setupTestUser } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let deviceId: string;
let messageId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupTestUser('msg'));

  const dev = await apiPost<{ id: string }>('/devices', { workspaceId, name: 'E2E Msg Device' }, accessToken);
  deviceId = dev.data.id;
});

describe('Messages e2e', () => {
  describe('POST /messages/send', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/messages/send', {
        workspaceId,
        deviceId: 'any',
        target: '6281234567890',
        type: 'TEXT',
        message: 'hello',
      });
      expect(status).toBe(401);
    });

    it('enqueues a message and returns QUEUED status', async () => {
      const { status, data } = await apiPost<{ success: boolean; messageId: string; status: string }>(
        '/messages/send',
        {
          workspaceId,
          deviceId,
          target: '6281234567890',
          type: 'TEXT',
          message: 'E2E test message',
        },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.status).toBe('QUEUED');
      expect(data.messageId).toBeTruthy();
      messageId = data.messageId;
    });

    it('returns 400 for missing required fields', async () => {
      const { status } = await apiPost('/messages/send', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });

    it('returns 403 when device does not belong to workspace', async () => {
      const { accessToken: otherToken, workspaceId: otherWs } = await setupTestUser('msg-other');
      const { status } = await apiPost(
        '/messages/send',
        { workspaceId: otherWs, deviceId, target: '6281234567890', type: 'TEXT', message: 'hi' },
        otherToken,
      );
      expect(status).toBe(403);
    });
  });

  describe('GET /messages', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiGet(`/messages?workspaceId=${workspaceId}`);
      expect(status).toBe(401);
    });

    it('returns message list for workspace', async () => {
      const { status, data } = await apiGet<Array<{ id: string; status: string }>>(`/messages?workspaceId=${workspaceId}`, accessToken);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((m) => m.id === messageId)).toBe(true);
    });
  });

  describe('POST /messages/:id/retry', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost(`/messages/${messageId}/retry`, {});
      expect(status).toBe(401);
    });

    it('re-enqueues the message and returns QUEUED', async () => {
      const { status, data } = await apiPost<{ success: boolean; status: string }>(
        `/messages/${messageId}/retry`,
        {},
        accessToken,
      );
      // Accept 200/201 — controller may return either for retry
      expect([200, 201]).toContain(status);
      expect(data.success).toBe(true);
      expect(data.status).toBe('QUEUED');
    });

    it('returns 404 for unknown message id', async () => {
      const { status } = await apiPost('/messages/00000000-0000-0000-0000-000000000000/retry', {}, accessToken);
      expect(status).toBe(404);
    });
  });
});
