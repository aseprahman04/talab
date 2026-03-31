import { createHmac } from 'crypto';

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
