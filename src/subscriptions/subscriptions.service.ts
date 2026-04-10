import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

interface LsCheckoutResponse {
  data: {
    attributes: {
      url: string;
    };
  };
}

interface LsSubscriptionAttributes {
  status: string;
  customer_id: number;
  order_id: number;
  variant_id: number;
  renews_at: string | null;
  ends_at: string | null;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly apiBase = 'https://api.lemonsqueezy.com/v1';

  constructor(private readonly prisma: PrismaService) {}

  private get apiKey(): string {
    return process.env.LEMONSQUEEZY_API_KEY ?? '';
  }

  private async lsRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`LemonSqueezy ${path} → ${res.status}: ${body}`);
      throw new BadRequestException(`LemonSqueezy error: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async createCheckout(userId: string, workspaceId: string, planCode: string): Promise<{ url: string }> {
    // Verify user is OWNER or ADMIN of the workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Only workspace owners and admins can manage subscriptions');
    }

    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) throw new NotFoundException(`Plan '${planCode}' not found`);
    if (!plan.lemonSqueezyVariantId) {
      throw new BadRequestException(`Plan '${planCode}' is not linked to a LemonSqueezy variant`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Try to create a dynamic checkout via API (injects custom_data for webhook auto-provisioning)
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://watheter.com';
      const checkoutPayload = {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_options: {
              embed: false,
              redirect_url: `${frontendUrl}/console?billing=1`,
            },
            checkout_data: {
              email: user.email,
              name: user.name,
              custom: { workspaceId, planCode, userId },
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID ?? '' },
            },
            variant: {
              data: { type: 'variants', id: plan.lemonSqueezyVariantId },
            },
          },
        },
      };

      const response = await this.lsRequest<LsCheckoutResponse>('/checkouts', {
        method: 'POST',
        body: JSON.stringify(checkoutPayload),
      });

      return { url: response.data.attributes.url };
    } catch {
      // Fallback: direct checkout URL with custom metadata in query string
      // LS supports ?checkout[custom][key]=value; webhook will carry these back
      if (!plan.lemonSqueezyCheckoutUrl) {
        throw new BadRequestException(`No checkout URL configured for plan '${planCode}'`);
      }
      const fallbackFrontendUrl = process.env.FRONTEND_URL || 'https://watheter.com';
      const params = new URLSearchParams({
        'checkout[custom][workspaceId]': workspaceId,
        'checkout[custom][planCode]': planCode,
        'checkout[custom][userId]': userId,
        'checkout[email]': user.email,
        'checkout[name]': user.name,
        'redirect_url': `${fallbackFrontendUrl}/console?billing=1`,
      });
      return { url: `${plan.lemonSqueezyCheckoutUrl}?${params.toString()}` };
    }
  }

  async handleWebhook(eventName: string, data: Record<string, unknown>): Promise<void> {
    this.logger.log(`LemonSqueezy webhook: ${eventName}`);

    const attrs = data['attributes'] as LsSubscriptionAttributes | undefined;
    if (!attrs) return;

    const lsSubscriptionId = String(data['id']);

    // Extract workspaceId from custom data passed at checkout time
    const meta = (data as unknown as { meta?: { custom_data?: { workspaceId?: string } } })['meta'];
    const workspaceId: string | undefined = meta?.custom_data?.workspaceId;

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        if (!workspaceId) {
          this.logger.warn(`No workspaceId in webhook custom_data for ${eventName}`);
          return;
        }

        const plan = await this.prisma.plan.findFirst({
          where: { lemonSqueezyVariantId: String(attrs.variant_id) },
        });
        if (!plan) {
          this.logger.warn(`No plan found for variant ${attrs.variant_id}`);
          return;
        }

        const status = this.mapLsStatus(attrs.status);
        const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : null;
        const endedAt = attrs.ends_at ? new Date(attrs.ends_at) : null;

        await this.prisma.subscription.upsert({
          where: { workspaceId },
          create: {
            workspaceId,
            planId: plan.id,
            status,
            startedAt: new Date(),
            endedAt,
            renewsAt,
            lemonSqueezySubscriptionId: lsSubscriptionId,
            lemonSqueezyCustomerId: String(attrs.customer_id),
            lemonSqueezyOrderId: String(attrs.order_id),
          },
          update: {
            planId: plan.id,
            status,
            endedAt,
            renewsAt,
            lemonSqueezySubscriptionId: lsSubscriptionId,
            lemonSqueezyCustomerId: String(attrs.customer_id),
            lemonSqueezyOrderId: String(attrs.order_id),
          },
        });

        // Sync workspace status
        const wsStatus = status === 'ACTIVE' ? 'ACTIVE' : status === 'PAST_DUE' ? 'ACTIVE' : 'EXPIRED';
        await this.prisma.workspace.update({
          where: { id: workspaceId },
          data: { status: wsStatus as 'ACTIVE' | 'EXPIRED' },
        });
        break;
      }

      case 'subscription_expired':
      case 'subscription_cancelled':
      case 'subscription_payment_refunded': {
        const sub = await this.prisma.subscription.findUnique({
          where: { lemonSqueezySubscriptionId: lsSubscriptionId },
        });
        if (!sub) return;

        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED', endedAt: new Date() },
        });
        await this.prisma.workspace.update({
          where: { id: sub.workspaceId },
          data: { status: 'EXPIRED' },
        });
        break;
      }

      case 'subscription_payment_success': {
        // Refresh renews_at on successful payment
        const sub = await this.prisma.subscription.findUnique({
          where: { lemonSqueezySubscriptionId: lsSubscriptionId },
        });
        if (!sub) return;
        const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : null;
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'ACTIVE', renewsAt },
        });
        break;
      }

      default:
        this.logger.log(`Unhandled LemonSqueezy event: ${eventName}`);
    }
  }

  private mapLsStatus(lsStatus: string): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' {
    switch (lsStatus) {
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'cancelled':
      case 'canceled':
        return 'CANCELED';
      case 'expired':
        return 'EXPIRED';
      default:
        return 'TRIAL';
    }
  }

  getSubscription(workspaceId: string) {
    return this.prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: true },
    });
  }

  getPlans() {
    return this.prisma.plan.findMany({ orderBy: { price: 'asc' } });
  }
}
