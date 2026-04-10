/**
 * Scheduled messages e2e — create, list, toggle, delete
 * Requires backend running. Point to VPS via .env.e2e.
 */
import { apiPost, apiGet, apiDelete, apiPatch, setupOrReuseTestUser, getOrCreateDevice } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let deviceId: string;
let smId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupOrReuseTestUser());
  ({ deviceId } = await getOrCreateDevice(workspaceId, accessToken, 'sm'));
});

const validDto = () => ({
  workspaceId,
  deviceId,
  name: `Daily Reminder ${Date.now()}`,
  recipient: process.env.TEST_RECIPIENT ?? '6281234567890',
  repeatType: 'DAILY',
  sendHour: 9,
  content: 'Good morning!',
});

describe('Scheduled messages e2e', () => {
  describe('POST /scheduled-messages', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/scheduled-messages', validDto());
      expect(status).toBe(401);
    });

    it('creates a scheduled message', async () => {
      const { status, data } = await apiPost<{
        id: string;
        name: string;
        repeatType: string;
        isEnabled: boolean;
        nextRunAt: string;
      }>('/scheduled-messages', validDto(), accessToken);
      expect(status).toBe(201);
      expect(data.id).toBeTruthy();
      expect(data.repeatType).toBe('DAILY');
      expect(data.isEnabled).toBe(true);
      expect(data.nextRunAt).toBeTruthy();
      smId = data.id;
    });

    it('returns 400 for missing required fields', async () => {
      const { status } = await apiPost('/scheduled-messages', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });

    it('returns 400 for invalid phone format', async () => {
      const { status } = await apiPost('/scheduled-messages', { ...validDto(), recipient: '0812345' }, accessToken);
      expect(status).toBe(400);
    });

    it('returns 403 when device does not belong to workspace', async () => {
      const { accessToken: otherToken, workspaceId: otherWs } = await setupOrReuseTestUser();
      const { status } = await apiPost(
        '/scheduled-messages',
        { ...validDto(), workspaceId: otherWs },
        otherToken,
      );
      expect(status).toBe(403);
    });
  });

  describe('GET /scheduled-messages', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiGet(`/scheduled-messages?workspaceId=${workspaceId}`);
      expect(status).toBe(401);
    });

    it('lists scheduled messages for workspace', async () => {
      const { status, data } = await apiGet<Array<{ id: string }>>(`/scheduled-messages?workspaceId=${workspaceId}`, accessToken);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((s) => s.id === smId)).toBe(true);
    });
  });

  describe('PATCH /scheduled-messages/:id/toggle', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPatch(`/scheduled-messages/${smId}/toggle`, { isEnabled: false });
      expect(status).toBe(401);
    });

    it('disables a scheduled message', async () => {
      const { status, data } = await apiPatch<{ id: string; isEnabled: boolean }>(
        `/scheduled-messages/${smId}/toggle`,
        { isEnabled: false },
        accessToken,
      );
      expect(status).toBe(200);
      expect(data.isEnabled).toBe(false);
    });

    it('re-enables a scheduled message and recomputes nextRunAt', async () => {
      const { status, data } = await apiPatch<{ id: string; isEnabled: boolean; nextRunAt: string }>(
        `/scheduled-messages/${smId}/toggle`,
        { isEnabled: true },
        accessToken,
      );
      expect(status).toBe(200);
      expect(data.isEnabled).toBe(true);
      expect(data.nextRunAt).toBeTruthy();
    });

    it('returns 404 for unknown id', async () => {
      const { status } = await apiPatch('/scheduled-messages/00000000-0000-0000-0000-000000000000/toggle', { isEnabled: false }, accessToken);
      expect(status).toBe(404);
    });
  });

  describe('DELETE /scheduled-messages/:id', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiDelete(`/scheduled-messages/${smId}`);
      expect(status).toBe(401);
    });

    it('deletes a scheduled message', async () => {
      const { status } = await apiDelete(`/scheduled-messages/${smId}`, accessToken);
      expect(status).toBe(200);
    });

    it('returns 404 after deletion', async () => {
      const { status } = await apiPatch(`/scheduled-messages/${smId}/toggle`, { isEnabled: true }, accessToken);
      expect(status).toBe(404);
    });

    it('returns 404 for unknown id', async () => {
      const { status } = await apiDelete('/scheduled-messages/00000000-0000-0000-0000-000000000000', accessToken);
      expect(status).toBe(404);
    });
  });
});
