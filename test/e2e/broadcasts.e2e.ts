/**
 * Broadcasts e2e — create campaign + start
 * Requires backend running. Point to VPS via .env.e2e.
 *
 * With TEST_DEVICE_ID set the broadcast will be dispatched through a real WA connection.
 * TEST_RECIPIENT overrides the target phone number used in the broadcast.
 */
import { apiPost, setupOrReuseTestUser, getOrCreateDevice } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let deviceId: string;
let broadcastId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupOrReuseTestUser());
  ({ deviceId } = await getOrCreateDevice(workspaceId, accessToken, 'bc'));
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

    it('creates a broadcast campaign', async () => {
      const recipient = process.env.TEST_RECIPIENT ?? '6281234567890';
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
          messageTemplate: '[E2E] Test broadcast message',
          recipients: [recipient],
        },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.id).toBeTruthy();
      expect(data.totalTargets).toBe(1);
      expect(data.recipients).toHaveLength(1);
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

    it('starts the broadcast and returns QUEUED status', async () => {
      const { status, data } = await apiPost<{ success: boolean; status: string }>(
        `/broadcasts/${broadcastId}/start`,
        {},
        accessToken,
      );
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('QUEUED');
    });

    it('returns 404 for unknown broadcast id', async () => {
      const { status } = await apiPost('/broadcasts/00000000-0000-0000-0000-000000000000/start', {}, accessToken);
      expect(status).toBe(404);
    });
  });
});
