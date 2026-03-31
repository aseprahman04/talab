/**
 * Auth e2e — register → login → workspaces → sessions → logout
 * Requires local backend running: npm run start:dev
 */
import { apiPost, apiGet, setupTestUser } from '../helpers/api';

const EMAIL = `e2e_auth_${Date.now()}@test.watether.com`;
const PASSWORD = 'E2eTestPass123!';

let accessToken: string;
let workspaceId: string;

describe('Auth e2e', () => {
  describe('POST /auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const { status, data } = await apiPost<{ accessToken: string; refreshToken: string }>(
        '/auth/register',
        { email: EMAIL, password: PASSWORD, name: 'E2E Auth User' },
      );
      expect(status).toBe(201);
      expect(data.accessToken).toBeTruthy();
      expect(data.refreshToken).toBeTruthy();
      accessToken = data.accessToken;
    });

    it('returns 409 on duplicate email', async () => {
      const { status } = await apiPost('/auth/register', {
        email: EMAIL, password: PASSWORD, name: 'Dup',
      });
      expect(status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with correct credentials', async () => {
      const { status, data } = await apiPost<{ accessToken: string; refreshToken: string }>(
        '/auth/login',
        { email: EMAIL, password: PASSWORD },
      );
      expect(status).toBe(200);
      expect(data.accessToken).toBeTruthy();
      accessToken = data.accessToken;
    });

    it('returns 401 for wrong password', async () => {
      const { status } = await apiPost('/auth/login', { email: EMAIL, password: 'WrongPass!' });
      expect(status).toBe(401);
    });
  });

  describe('GET /workspaces (requires auth)', () => {
    it('returns 401 without token', async () => {
      const { status } = await apiGet('/workspaces');
      expect(status).toBe(401);
    });

    it('returns workspace list when authenticated', async () => {
      // Create workspace first
      await apiPost('/workspaces', { name: 'Auth Test WS', slug: `auth-ws-${Date.now()}` }, accessToken);
      const { status, data } = await apiGet<Array<{ workspace: { id: string } }>>('/workspaces', accessToken);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      workspaceId = data[0].workspace.id;
    });
  });

  describe('GET /auth/sessions', () => {
    it('returns active sessions list', async () => {
      const { status, data } = await apiGet<unknown[]>('/auth/sessions', accessToken);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/logout', () => {
    it('logs out successfully', async () => {
      const { status } = await apiPost('/auth/logout', {}, accessToken);
      expect(status).toBe(200);
    });

    // Note: JWT Bearer tokens remain valid until expiry even after session revocation.
    // Session cookie (sid) is revoked. For full revocation, use /auth/logout-all.
  });
});
