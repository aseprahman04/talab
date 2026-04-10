/**
 * Auto-replies e2e — create and list auto-reply rules
 * Requires backend running. Point to VPS via .env.e2e.
 */
import { apiPost, apiGet, setupOrReuseTestUser, getOrCreateDevice } from '../helpers/api';

let accessToken: string;
let workspaceId: string;
let deviceId: string;
let ruleId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupOrReuseTestUser());
  ({ deviceId } = await getOrCreateDevice(workspaceId, accessToken, 'ar'));
});

describe('Auto-replies e2e', () => {
  describe('POST /auto-replies', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/auto-replies', {
        workspaceId,
        deviceId,
        name: 'Test',
        keyword: 'hello',
        matchType: 'exact',
        response: 'Hi!',
        priority: 1,
      });
      expect(status).toBe(401);
    });

    it('creates an auto-reply rule', async () => {
      const { status, data } = await apiPost<{ id: string; name: string; keyword: string }>(
        '/auto-replies',
        {
          workspaceId,
          deviceId,
          name: 'E2E Greeting',
          keyword: `e2e_hello_${Date.now()}`,
          matchType: 'exact',
          response: 'Hi there from E2E!',
          priority: 10,
          isEnabled: true,
        },
        accessToken,
      );
      expect(status).toBe(201);
      expect(data.id).toBeTruthy();
      ruleId = data.id;
    });

    it('returns 400 for missing required fields', async () => {
      const { status } = await apiPost('/auto-replies', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });

    it('returns 403 when device does not belong to workspace', async () => {
      const { accessToken: otherToken, workspaceId: otherWs } = await setupOrReuseTestUser();
      const { status } = await apiPost(
        '/auto-replies',
        { workspaceId: otherWs, deviceId, name: 'x', keyword: 'x', matchType: 'exact', response: 'y', priority: 1 },
        otherToken,
      );
      expect(status).toBe(403);
    });
  });

  describe('GET /auto-replies', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiGet(`/auto-replies?workspaceId=${workspaceId}`);
      expect(status).toBe(401);
    });

    it('returns all rules for workspace', async () => {
      const { status, data } = await apiGet<Array<{ id: string }>>(`/auto-replies?workspaceId=${workspaceId}`, accessToken);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((r) => r.id === ruleId)).toBe(true);
    });

    it('filters by deviceId when provided', async () => {
      const { status, data } = await apiGet<Array<{ id: string; deviceId: string }>>(
        `/auto-replies?workspaceId=${workspaceId}&deviceId=${deviceId}`,
        accessToken,
      );
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      data.forEach((r) => expect(r.deviceId).toBe(deviceId));
    });
  });
});
