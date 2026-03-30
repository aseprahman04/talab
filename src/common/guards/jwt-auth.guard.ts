import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionService } from 'src/auth/session.service';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private sessionService: SessionService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();

    // Try session cookie first (web browser clients)
    const sessionToken = req.cookies?.['sid'];
    if (sessionToken) {
      try {
        const { userId, sessionId } = await this.sessionService.validate(sessionToken);
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, refreshVersion: true },
        });
        if (user) {
          req.user = { sub: user.id, email: user.email, sessionId };
          return true;
        }
      } catch {
        // Cookie invalid — fall through to Bearer token check
      }
    }

    // Fall back to JWT Bearer token (Passport)
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<T>(err: unknown, user: T): T {
    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
