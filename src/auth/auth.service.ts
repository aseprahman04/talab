import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

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
