
export const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3003/api';

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  return { status: res.status, data };
}

export async function apiGet<T>(path: string, token?: string): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : (null as T);
  return { status: res.status, data };
}

export async function apiDelete(path: string, token?: string): Promise<{ status: number }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  return { status: res.status };
}

export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  return { status: res.status, data };
}

/** POST raw body with HMAC signature (for webhook tests) */
export async function apiPostRaw(path: string, body: string, signature: string): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-signature': signature },
    body,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  return { status: res.status, data };
}

/** Register + login → return accessToken and workspaceId */
export async function setupTestUser(suffix: string): Promise<{ accessToken: string; workspaceId: string }> {
  const email = `e2e_${suffix}_${Date.now()}@test.watether.com`;
  const password = 'E2eTestPass123!';
  const slug = `e2e-ws-${suffix}-${Date.now()}`;

  const reg = await apiPost<{ accessToken: string }>('/auth/register', {
    email, password, name: `E2E ${suffix}`,
  });
  let accessToken = reg.data.accessToken;
  if (!accessToken) {
    const login = await apiPost<{ accessToken: string }>('/auth/login', { email, password });
    accessToken = login.data.accessToken;
  }

  const ws = await apiPost<{ id: string }>('/workspaces', { name: `E2E ${suffix} WS`, slug }, accessToken);
  const workspaceId = ws.data.id;

  return { accessToken, workspaceId };
}

/**
 * VPS-aware setup: if TEST_USER_EMAIL + TEST_USER_PASSWORD are set, log in and
 * return the pre-configured workspace. Otherwise fall back to creating a fresh user.
 *
 * Set in .env.e2e:
 *   TEST_USER_EMAIL=you@watether.com
 *   TEST_USER_PASSWORD=yourpassword
 *   TEST_WORKSPACE_ID=<uuid>
 */
export async function setupOrReuseTestUser(): Promise<{ accessToken: string; workspaceId: string; isVps: boolean }> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const workspaceId = process.env.TEST_WORKSPACE_ID;

  if (email && password && workspaceId) {
    const { data } = await apiPost<{ accessToken: string }>('/auth/login', { email, password });
    return { accessToken: data.accessToken, workspaceId, isVps: true };
  }

  const fresh = await setupTestUser('vps');
  return { ...fresh, isVps: false };
}

/**
 * VPS-aware device: if TEST_DEVICE_ID is set, return it directly (it should be CONNECTED).
 * Otherwise create a new device under the given workspaceId.
 *
 * Set in .env.e2e:
 *   TEST_DEVICE_ID=<device-id>
 */
export async function getOrCreateDevice(
  workspaceId: string,
  accessToken: string,
  label: string,
): Promise<{ deviceId: string; isConnected: boolean }> {
  const envDeviceId = process.env.TEST_DEVICE_ID;
  if (envDeviceId) {
    return { deviceId: envDeviceId, isConnected: true };
  }

  const { data } = await apiPost<{ id: string }>('/devices', { workspaceId, name: `E2E ${label} Device` }, accessToken);
  return { deviceId: data.id, isConnected: false };
}
