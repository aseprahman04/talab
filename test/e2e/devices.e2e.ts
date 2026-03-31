/**
 * Devices e2e — CRUD operations within a workspace
 * Requires local backend running: npm run start:dev
 */
import { apiPost, apiGet, apiDelete, setupTestUser } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let deviceId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupTestUser('dev'));
});

describe('Devices e2e', () => {
  describe('POST /devices', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/devices', { workspaceId, name: 'Unauth' });
      expect(status).toBe(401);
    });

    it('creates a device in the workspace', async () => {
      const { status, data } = await apiPost<{ id: string; name: string; status: string }>(
        '/devices',
        { workspaceId, name: 'E2E Test Device' },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.id).toBeTruthy();
      expect(data.name).toBe('E2E Test Device');
      expect(data.status).toBe('CREATED');
      deviceId = data.id;
    });
  });

  describe('GET /devices', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiGet(`/devices?workspaceId=${workspaceId}`);
      expect(status).toBe(401);
    });

    it('lists devices for the workspace', async () => {
      const { status, data } = await apiGet<Array<{ id: string }>>(`/devices?workspaceId=${workspaceId}`, accessToken);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((d) => d.id === deviceId)).toBe(true);
    });
  });

  describe('POST /devices/:id/pair', () => {
    it('starts pairing for a device', async () => {
      const { status, data } = await apiPost<{ deviceId: string }>(
        `/devices/${deviceId}/pair`,
        {},
        accessToken,
      );
      // 200/201 pairing started, 400/409 if already paired, 503 if WA unavailable
      expect([200, 201, 400, 409, 503]).toContain(status);
    });
  });
});
