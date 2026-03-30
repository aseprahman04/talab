import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { SessionService } from './session.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  sessionToken: string;
  user: { id: string; email: string; name: string };
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private sessionService: SessionService,
  ) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );
  }

  /** Returns the Google OAuth2 authorization URL with a signed CSRF state */
  async getGoogleAuthUrl(): Promise<string> {
    const state = await this.jwt.signAsync(
      { nonce: Math.random().toString(36).slice(2) },
      { secret: process.env.JWT_ACCESS_SECRET || 'change_me_access', expiresIn: '5m' },
    );
    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state,
    });
  }

  /** Exchange authorization code, verify CSRF state, find-or-create user, issue tokens */
  async googleCallback(code: string, state: string): Promise<AuthResult> {
    try {
      await this.jwt.verifyAsync(state, {
        secret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
      });
    } catch {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const { tokens } = await this.googleClient.getToken(code);

    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new UnauthorizedException('Google account has no email');

    const { sub: googleId, email, name } = payload;

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: { email, name: name ?? email, googleId },
      });
    }

    return this.issueAll(user.id, user.email, user.name);
  }

  async register(dto: RegisterDto, opts: { userAgent?: string; ipAddress?: string } = {}): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });
    return this.issueAll(user.id, user.email, user.name, opts);
  }

  async login(dto: LoginDto, opts: { userAgent?: string; ipAddress?: string } = {}): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueAll(user.id, user.email, user.name, opts);
  }

  async revokeAllSessions(userId: string) {
    await this.sessionService.revokeAll(userId);
    return { success: true };
  }

  async revokeSession(sessionId: string, userId: string) {
    await this.sessionService.revoke(sessionId, userId);
    return { success: true };
  }

  listSessions(userId: string) {
    return this.sessionService.listSessions(userId);
  }

  async issueAccessToken(userId: string, email: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
        expiresIn: process.env.JWT_ACCESS_TTL || '15m',
      },
    );
  }

  private async issueAll(
    userId: string,
    email: string,
    name: string,
    opts: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<AuthResult> {
    const [accessToken, refreshToken, sessionToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_ACCESS_SECRET || 'change_me_access', expiresIn: process.env.JWT_ACCESS_TTL || '15m' },
      ),
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh', expiresIn: process.env.JWT_REFRESH_TTL || '30d' },
      ),
      this.sessionService.create(userId, opts),
    ]);
    return { accessToken, refreshToken, sessionToken, user: { id: userId, email, name } };
  }
}
