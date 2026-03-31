/**
 * Subscriptions e2e — plans list, checkout URL, webhook signature
 * Requires local backend running: npm run start:dev
 */
import { createHmac } from 'crypto';
import { apiPost, apiGet, apiPostRaw, setupTestUser } from '../helpers/api';

const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '0cd4a8ecdb9e4743b4ad7cec326e6200';

let accessToken: string;
let workspaceId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupTestUser('sub'));
});

describe('Subscriptions e2e', () => {
  describe('GET /subscriptions/plans', () => {
    it('returns plans list without auth', async () => {
      const { status, data } = await apiGet<Array<{ code: string; name: string; price: unknown }>>('/subscriptions/plans');
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      const codes = data.map((p) => p.code);
      expect(codes).toContain('free');
      expect(codes).toContain('bisnis');
      expect(codes).toContain('tim');
    });

    it('paid plans have lemonSqueezyVariantId', async () => {
      const { data } = await apiGet<Array<{ code: string; lemonSqueezyVariantId: string | null }>>('/subscriptions/plans');
      const bisnis = data.find((p) => p.code === 'bisnis');
      const tim = data.find((p) => p.code === 'tim');
      expect(bisnis?.lemonSqueezyVariantId).toBeTruthy();
      expect(tim?.lemonSqueezyVariantId).toBeTruthy();
    });
  });

  describe('GET /subscriptions/:workspaceId', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiGet(`/subscriptions/${workspaceId}`);
      expect(status).toBe(401);
    });

    it('returns subscription info when authenticated', async () => {
      const { status } = await apiGet(`/subscriptions/${workspaceId}`, accessToken);
      // null subscription returns 200 with null body, or 404 — both acceptable
      expect([200, 404]).toContain(status);
    });
  });

  describe('POST /subscriptions/checkout', () => {
    it('returns 401 without auth', async () => {
      const { status } = await apiPost('/subscriptions/checkout', { workspaceId, planCode: 'bisnis' });
      expect(status).toBe(401);
    });

    it('returns checkout URL for bisnis plan', async () => {
      const { status, data } = await apiPost<{ url: string }>(
        '/subscriptions/checkout',
        { workspaceId, planCode: 'bisnis' },
        accessToken,
      );
      expect([200, 201]).toContain(status);
      expect(data.url).toBeTruthy();
      expect(data.url).toContain('lemonsqueezy.com');
    });

    it('returns checkout URL for tim plan', async () => {
      const { status, data } = await apiPost<{ url: string }>(
        '/subscriptions/checkout',
        { workspaceId, planCode: 'tim' },
        accessToken,
      );
      expect([200, 201]).toContain(status);
      expect(data.url).toBeTruthy();
    });

    it('returns 404 for unknown plan', async () => {
      const { status } = await apiPost(
        '/subscriptions/checkout',
        { workspaceId, planCode: 'nonexistent_plan' },
        accessToken,
      );
      expect(status).toBe(404);
    });

    it('returns 400 for missing fields', async () => {
      const { status } = await apiPost('/subscriptions/checkout', { workspaceId }, accessToken);
      expect(status).toBe(400);
    });
  });

  describe('POST /subscriptions/webhook/lemonsqueezy', () => {
    it('rejects webhook with invalid signature', async () => {
      const payload = {
        meta: { event_name: 'subscription_created', custom_data: {} },
        data: { id: '999', attributes: {} },
      };
      const { status } = await apiPostRaw(
        '/subscriptions/webhook/lemonsqueezy',
        JSON.stringify(payload),
        'badhmacsignature',
      );
      expect(status).toBe(400);
    });

    it('accepts valid HMAC-signed webhook and upserts subscription', async () => {
      const lsSubId = `e2e-${Date.now()}`;
      const payload = {
        meta: {
          event_name: 'subscription_created',
          custom_data: { workspaceId, planCode: 'bisnis', userId: 'e2e-user' },
        },
        data: {
          id: lsSubId,
          attributes: {
            status: 'active',
            customer_id: 11111,
            order_id: 22222,
            variant_id: 1464622,
            renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            ends_at: null,
          },
        },
      };
      const body = JSON.stringify(payload);
      const sig = createHmac('sha256', LS_WEBHOOK_SECRET).update(body).digest('hex');
      const { status, data } = await apiPostRaw('/subscriptions/webhook/lemonsqueezy', body, sig);
      expect(status).toBe(200);
      expect((data as { ok: boolean }).ok).toBe(true);
    });

    it('subscription is ACTIVE after webhook', async () => {
      const { status, data } = await apiGet<{ status: string; plan: { code: string } } | null>(
        `/subscriptions/${workspaceId}`,
        accessToken,
      );
      expect(status).toBe(200);
      expect(data?.status).toBe('ACTIVE');
      expect(data?.plan?.code).toBe('bisnis');
    });
  });
});
