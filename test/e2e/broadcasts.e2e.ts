/**
 * Broadcasts e2e — create campaign + start
 * Requires local backend running: npm run start:dev
 */
import { apiPost, setupTestUser } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let deviceId: string;
let broadcastId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupTestUser('bc'));

  const dev = await apiPost<{ id: string }>('/devices', { workspaceId, name: 'E2E BC Device' }, accessToken);
  deviceId = dev.data.id;
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

    it('creates a broadcast campaign in DRAFT state', async () => {
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
          name: 'E2E Test Broadcast',
          messageTemplate: 'Hello {{name}}!',
          recipients: ['6281234567890', '6289876543210'],
        },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.id).toBeTruthy();
      expect(data.name).toBe('E2E Test Broadcast');
      expect(data.totalTargets).toBe(2);
      expect(data.recipients).toHaveLength(2);
      broadcastId = data.id;
    });

    it('returns 400 for missing required fields', async () => {
      const { status } = await apiPost('/broadcasts', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });

    it('returns 403 when device does not belong to workspace', async () => {
      const { accessToken: otherToken, workspaceId: otherWs } = await setupTestUser('bc-other');
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
