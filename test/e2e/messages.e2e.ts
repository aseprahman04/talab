/**
 * Messages e2e — send, list, retry
 * Requires backend running. Point to VPS via .env.e2e.
 *
 * With TEST_DEVICE_ID set the device is CONNECTED and messages go through
 * the full WA pipeline. Without it a new CREATED device is used (QUEUED only).
 */
import { apiPost, apiGet, setupOrReuseTestUser, getOrCreateDevice } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let deviceId: string;
let isConnected: boolean;
let messageId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupOrReuseTestUser());
  ({ deviceId, isConnected } = await getOrCreateDevice(workspaceId, accessToken, 'msg'));
});

describe('Messages e2e', () => {
  describe('POST /messages/send', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/messages/send', {
        workspaceId,
        deviceId,
        target: '6281234567890',
        type: 'TEXT',
        message: 'hello',
      });
      expect(status).toBe(401);
    });

    it('enqueues a message and returns QUEUED status', async () => {
      const recipient = process.env.TEST_RECIPIENT ?? '6281234567890';
      const { status, data } = await apiPost<{ success: boolean; messageId: string; status: string }>(
        '/messages/send',
        {
          workspaceId,
          deviceId,
          target: recipient,
          type: 'TEXT',
          message: `[E2E] Test message — ${new Date().toISOString()}`,
        },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.status).toBe('QUEUED');
      expect(data.messageId).toBeTruthy();
      messageId = data.messageId;
    });

    it('message reaches SENT/DELIVERED status when device is connected', async () => {
      if (!isConnected) {
        console.log('Skipping delivery check — no connected device (set TEST_DEVICE_ID to enable)');
        return;
      }
      // Poll up to 15 s for status to advance past QUEUED
      let finalStatus = 'QUEUED';
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const { data } = await apiGet<Array<{ id: string; status: string }>>(`/messages?workspaceId=${workspaceId}`, accessToken);
        const found = data.find((m) => m.id === messageId);
        if (found && found.status !== 'QUEUED') { finalStatus = found.status; break; }
      }
      expect(['SENT', 'DELIVERED', 'READ']).toContain(finalStatus);
    });

    it('returns 400 for missing required fields', async () => {
      const { status } = await apiPost('/messages/send', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });

    it('returns 403 when device does not belong to workspace', async () => {
      const { accessToken: otherToken, workspaceId: otherWs } = await setupOrReuseTestUser();
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
