import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

// Use nodejs runtime so we can connect to Redis
export const runtime = 'nodejs';

// Singleton Redis client
let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.on('error', () => {
      // Silently swallow — rate limiting degrades gracefully
    });
  }
  return redis;
}

interface RateRule {
  prefix: string;
  windowMs: number;
  max: number;
}

const RULES: RateRule[] = [
  // Auth pages (login, register, etc.)
  { prefix: 'rl:auth:', windowMs: 60_000, max: 10 },
  // Console (authenticated) pages
  { prefix: 'rl:console:', windowMs: 60_000, max: 200 },
  // Everything else
  { prefix: 'rl:default:', windowMs: 60_000, max: 200 },
];

function getRuleFor(pathname: string): RateRule {
  if (pathname.startsWith('/auth') || pathname === '/') {
    return RULES[0];
  }
  if (pathname.startsWith('/console')) {
    return RULES[1];
  }
  return RULES[2];
}

async function checkRateLimit(
  rule: RateRule,
  ip: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `${rule.prefix}${ip}`;
  const now = Date.now();
  const windowStart = now - rule.windowMs;
  const windowExpiry = Math.ceil(rule.windowMs / 1000);

  try {
    const client = getRedis();
    const pipeline = client.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.expire(key, windowExpiry);
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    const resetAt = now + rule.windowMs;

    if (count > rule.max) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return { allowed: true, remaining: Math.max(0, rule.max - count), resetAt };
  } catch {
    // Redis unavailable — fail open (allow request)
    return { allowed: true, remaining: rule.max, resetAt: now + rule.windowMs };
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0'
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);
  const rule = getRuleFor(pathname);

  const { allowed, remaining, resetAt } = await checkRateLimit(rule, ip);

  if (!allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        'X-RateLimit-Limit': String(rule.max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', String(rule.max));
  res.headers.set('X-RateLimit-Remaining', String(remaining));
  res.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.svg
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg).*)',
  ],
};
