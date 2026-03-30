import { NextRequest, NextResponse } from 'next/server';

// In-memory store for Edge Runtime (per isolate, resets on cold start)
// Rate limiting is defense-in-depth; primary limiting is on the NestJS backend
const hits = new Map<string, { count: number; resetAt: number }>();

const RULES: Record<string, { windowMs: number; max: number }> = {
  auth:    { windowMs: 60_000, max: 20 },
  default: { windowMs: 60_000, max: 300 },
};

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0'
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  const rule = pathname.startsWith('/auth') || pathname === '/'
    ? RULES.auth
    : RULES.default;

  const key = `${ip}:${pathname.startsWith('/auth') ? 'auth' : 'default'}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + rule.windowMs });
    return NextResponse.next();
  }

  entry.count += 1;

  if (entry.count > rule.max) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        'X-RateLimit-Limit': String(rule.max),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
