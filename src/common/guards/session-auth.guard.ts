import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionService } from 'src/auth/session.service';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();

    // 1. Try session cookie first (web browser clients)
    const sessionToken = req.cookies?.['sid'];
    if (sessionToken) {
      const { userId, sessionId } = await this.sessionService.validate(sessionToken);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, refreshVersion: true },
      });
      if (!user) throw new UnauthorizedException('User not found');
      req.user = { sub: user.id, email: user.email, sessionId };
      return true;
    }

    // 2. Fall back to JWT Bearer token (API clients, device SDK)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
        });
        req.user = payload;
        return true;
      } catch {
        throw new UnauthorizedException('Invalid token');
      }
    }

    throw new UnauthorizedException('Authentication required');
  }
}
