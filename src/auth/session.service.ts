import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'src/database/prisma/prisma.service';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new session, return the raw (unhashed) token. */
  async create(
    userId: string,
    opts: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.prisma.userSession.create({
      data: {
        userId,
        tokenHash,
        userAgent: opts.userAgent,
        ipAddress: opts.ipAddress,
        expiresAt,
      },
    });

    return rawToken;
  }

  /** Validate a raw token. Returns the userId if valid, throws otherwise. */
  async validate(rawToken: string): Promise<{ userId: string; sessionId: string }> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const session = await this.prisma.userSession.findUnique({ where: { tokenHash } });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        // Expired — clean up
        await this.prisma.userSession.delete({ where: { id: session.id } }).catch(() => null);
      }
      throw new UnauthorizedException('Session expired or invalid');
    }

    return { userId: session.userId, sessionId: session.id };
  }

  /** Revoke a single session by its DB id. */
  async revoke(sessionId: string, userId: string): Promise<void> {
    await this.prisma.userSession.deleteMany({ where: { id: sessionId, userId } });
  }

  /** Revoke all sessions for a user. */
  async revokeAll(userId: string): Promise<void> {
    await this.prisma.userSession.deleteMany({ where: { userId } });
  }

  /** List all active sessions for a user (for session management UI). */
  listSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
