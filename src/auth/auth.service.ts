import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(private prisma: PrismaService, private jwt: JwtService) {
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

  /** Exchange authorization code, verify CSRF state, find-or-create user, issue JWTs */
  async googleCallback(code: string, state: string) {
    // Verify CSRF state (signed JWT, 5-minute expiry)
    try {
      await this.jwt.verifyAsync(state, {
        secret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
      });
    } catch {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    // Exchange code for tokens
    const { tokens } = await this.googleClient.getToken(code);

    // Verify the ID token audience and extract claims
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new UnauthorizedException('Google account has no email');

    const { sub: googleId, email, name } = payload;

    // Find-or-create user
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      // Link googleId if they registered via email/password earlier
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

    return this.issueTokens(user.id, user.email, user.refreshVersion);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });
    return this.issueTokens(user.id, user.email, user.refreshVersion);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.email, user.refreshVersion);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.refreshVersion !== payload.refreshVersion) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.issueTokens(user.id, user.email, user.refreshVersion);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshVersion: { increment: 1 } },
    });
    return { success: true };
  }

  private async issueTokens(sub: string, email: string, refreshVersion: number) {
    const accessToken = await this.jwt.signAsync(
      { sub, email, refreshVersion },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
        expiresIn: process.env.JWT_ACCESS_TTL || '15m',
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub, email, refreshVersion },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
        expiresIn: process.env.JWT_REFRESH_TTL || '30d',
      },
    );
    return { accessToken, refreshToken };
  }
}
