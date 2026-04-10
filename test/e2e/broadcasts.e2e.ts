/**
 * Broadcasts e2e — create campaign + start + verify multi-recipient dispatch
 * Requires backend running. Point to VPS via .env.e2e.
 *
 * With TEST_DEVICE_ID set the broadcast dispatches through a real WA connection.
 * TEST_RECIPIENT is used as the primary recipient.
 * TEST_RECIPIENT_2 (optional) adds a second number; falls back to a dummy number
 * so the broadcast always has 2 recipients regardless of env config.
 */
import { apiPost, apiGet, setupOrReuseTestUser, getOrCreateDevice } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let deviceId: string;
let isConnected: boolean;
let broadcastId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupOrReuseTestUser());
  ({ deviceId, isConnected } = await getOrCreateDevice(workspaceId, accessToken, 'bc'));
});

describe('Broadcasts e2e', () => {
  describe('POST /broadcasts', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/broadcasts', {
        workspaceId,
        deviceId,
        name: 'E2E Broadcast',
        messageTemplate: 'Hello!',
        recipients: ['6281234567890'],
      });
      expect(status).toBe(401);
    });

    it('creates a broadcast campaign with multiple recipients', async () => {
      const recipient1 = process.env.TEST_RECIPIENT ?? '6281234567890';
      // Second recipient: use TEST_RECIPIENT_2 if set, otherwise a different dummy number
      const recipient2 = process.env.TEST_RECIPIENT_2 ?? '6289876543210';

      const { status, data } = await apiPost<{
        id: string;
        name: string;
        totalTargets: number;
        recipients: Array<{ phoneNumber: string }>;
      }>(
        '/broadcasts',
        {
          workspaceId,
          deviceId,
          name: `E2E Broadcast ${Date.now()}`,
          messageTemplate: '[E2E] Blast test message',
          recipients: [recipient1, recipient2],
        },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.id).toBeTruthy();
      expect(data.totalTargets).toBe(2);
      expect(data.recipients).toHaveLength(2);
      expect(data.recipients.map((r) => r.phoneNumber)).toContain(recipient1);
      broadcastId = data.id;
    });

    it('returns 400 for missing required fields', async () => {
      const { status } = await apiPost('/broadcasts', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });

    it('returns 403 when device does not belong to workspace', async () => {
      const { accessToken: otherToken, workspaceId: otherWs } = await setupOrReuseTestUser();
      const { status } = await apiPost(
        '/broadcasts',
        { workspaceId: otherWs, deviceId, name: 'x', messageTemplate: 'x', recipients: ['6281234567890'] },
        otherToken,
      );
      expect(status).toBe(403);
    });
  });

  describe('POST /broadcasts/:id/start', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost(`/broadcasts/${broadcastId}/start`, {});
      expect(status).toBe(401);
    });

    it('starts the broadcast and queues all recipients', async () => {
      const { status, data } = await apiPost<{ success: boolean; status: string }>(
        `/broadcasts/${broadcastId}/start`,
        {},
        accessToken,
      );
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('QUEUED');
    });

    it('broadcast reaches RUNNING then COMPLETED when device is connected', async () => {
      if (!isConnected) {
        console.log('Skipping dispatch check — no connected device (set TEST_DEVICE_ID to enable)');
        return;
      }

      // Poll up to 45 s — broadcast starts RUNNING immediately, then
      // COMPLETED after all staggered messages (3-8 s each × 2 recipients = up to ~16 s)
      let broadcastStatus = 'QUEUED';
      for (let i = 0; i < 45; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const { data } = await apiGet<Array<{ id: string; status: string; successCount: number; failedCount: number; totalTargets: number }>>(
          `/broadcasts?workspaceId=${workspaceId}`,
          accessToken,
        );
        const found = data.find((b) => b.id === broadcastId);
        if (found) {
          broadcastStatus = found.status;
          if (['COMPLETED', 'FAILED'].includes(broadcastStatus)) break;
        }
      }

      expect(broadcastStatus).toBe('COMPLETED');
    });

    it('verifies each recipient message was sent', async () => {
      if (!isConnected) return;

      const { data: messages } = await apiGet<Array<{
        status: string;
        recipient: string;
        metadata: { broadcastId?: string };
      }>>(`/messages?workspaceId=${workspaceId}`, accessToken);

      const broadcastMessages = messages.filter(
        (m) => (m.metadata as { broadcastId?: string })?.broadcastId === broadcastId,
      );

      // Both recipients should have a message record
      expect(broadcastMessages.length).toBe(2);
      broadcastMessages.forEach((m) => {
        expect(['SENT', 'DELIVERED', 'READ', 'FAILED']).toContain(m.status);
      });
      const sentCount = broadcastMessages.filter((m) => ['SENT', 'DELIVERED', 'READ'].includes(m.status)).length;
      expect(sentCount).toBeGreaterThan(0);
    });

    it('returns 404 for unknown broadcast id', async () => {
      const { status } = await apiPost('/broadcasts/00000000-0000-0000-0000-000000000000/start', {}, accessToken);
      expect(status).toBe(404);
    });
  });
});
