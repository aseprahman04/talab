import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(private readonly service: SubscriptionsService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'List all available plans' })
  getPlans() {
    return this.service.getPlans();
  }

  @Get(':workspaceId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the subscription for a workspace' })
  getSubscription(@Param('workspaceId') workspaceId: string) {
    return this.service.getSubscription(workspaceId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a LemonSqueezy checkout URL' })
  createCheckout(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.service.createCheckout(user.sub, dto.workspaceId, dto.planCode);
  }

  @Post('webhook/lemonsqueezy')
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'LemonSqueezy webhook receiver' })
  async handleWebhook(
    @Headers('x-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) throw new BadRequestException('Raw body unavailable');

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '';
    if (!secret) {
      this.logger.warn('LEMONSQUEEZY_WEBHOOK_SECRET not set — skipping signature verification');
    } else {
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
      try {
        const sigBuf = Buffer.from(signature ?? '', 'hex');
        const expBuf = Buffer.from(expected, 'hex');
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          throw new Error('mismatch');
        }
      } catch {
        this.logger.warn('Invalid LemonSqueezy webhook signature');
        throw new BadRequestException('Invalid signature');
      }
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as {
      meta?: { event_name?: string };
      data?: Record<string, unknown>;
    };

    const eventName = payload.meta?.event_name ?? '';
    const data = payload.data ?? {};

    await this.service.handleWebhook(eventName, { ...data, meta: payload.meta });
    return { ok: true };
  }
}
