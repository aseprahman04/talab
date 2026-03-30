export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type WorkspaceMembership = {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
  workspace: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
};

export type Device = {
  id: string;
  workspaceId: string;
  name: string;
  phoneNumber?: string | null;
  status: string;
  healthScore: number;
  lastSeenAt?: string | null;
};

export type Message = {
  id: string;
  workspaceId: string;
  deviceId: string;
  direction: string;
  type: string;
  recipient?: string | null;
  sender?: string | null;
  content?: string | null;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
};

export type Webhook = {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
};

export type WebhookDelivery = {
  id: string;
  webhookId: string;
  eventType: string;
  status: string;
  attemptCount: number;
  responseCode?: number | null;
  responseBody?: string | null;
  lastAttemptAt?: string | null;
  nextRetryAt?: string | null;
  createdAt: string;
};

export type Broadcast = {
  id: string;
  workspaceId: string;
  deviceId: string;
  name: string;
  messageTemplate: string;
  status: string;
  totalTargets: number;
  createdAt: string;
};

export type AutoReplyRule = {
  id: string;
  workspaceId: string;
  deviceId: string;
  name: string;
  matchType: string;
  keyword: string;
  response: string;
  priority: number;
  isEnabled: boolean;
};

export type Contact = {
  id: string;
  workspaceId: string;
  name?: string | null;
  phoneNumber: string;
  email?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  isBlacklisted: boolean;
  isOptOut: boolean;
  createdAt: string;
};

export type ContactList = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  memberCount: number;
  createdAt: string;
};

// Use relative /api in production (no env var needed); set NEXT_PUBLIC_API_BASE_URL for local dev
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      const text = await response.text();
      if (text) message = text;
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function formatDateTime(value?: string | null) {
  if (!value) return 'Belum ada';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}