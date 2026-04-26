import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SESSION_COOKIE = 'sid';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ long: { ttl: 3600000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new account with email & password' })
  @ApiResponse({ status: 201, description: 'Returns accessToken + refreshToken; also sets session cookie' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    res.cookie(SESSION_COOKIE, result.sessionToken, COOKIE_OPTS);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ medium: { ttl: 900000, limit: 10 } })
  @ApiOperation({ summary: 'Login with email & password' })
  @ApiResponse({ status: 200, description: 'Returns accessToken + refreshToken; also sets session cookie' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    res.cookie(SESSION_COOKIE, result.sessionToken, COOKIE_OPTS);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ medium: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Exchange refresh token for new access + refresh token pair' })
  @ApiResponse({ status: 200, description: 'Returns new accessToken + refreshToken' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out (revoke current session)' })
  async logout(@CurrentUser() user: { sub: string; sessionId?: string }, @Res({ passthrough: true }) res: Response) {
    if (user.sessionId) {
      await this.authService.revokeSession(user.sessionId, user.sub);
    }
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { success: true };
  }

  @Post('logout-all')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions for the current user' })
  async logoutAll(@CurrentUser() user: { sub: string }, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeAllSessions(user.sub);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { success: true };
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  listSessions(@CurrentUser() user: { sub: string }) {
    return this.authService.listSessions(user.sub);
  }

  @Delete('sessions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session by ID' })
  revokeSession(@Param('id') sessionId: string, @CurrentUser() user: { sub: string }) {
    return this.authService.revokeSession(sessionId, user.sub);
  }

  @Get('access-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exchange session cookie for a short-lived JWT access token (for API SDK clients)' })
  async getAccessToken(@CurrentUser() user: { sub: string; email: string }) {
    const accessToken = await this.authService.issueAccessToken(user.sub, user.email);
    return { accessToken };
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  @ApiResponse({ status: 302, description: 'Redirects to Google' })
  async googleLogin(@Res() res: Response) {
    const url = await this.authService.getGoogleAuthUrl();
    res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback — sets session cookie and redirects to frontend with tokens in fragment' })
  @ApiResponse({ status: 302, description: 'Redirects to /console#access_token=...&refresh_token=...' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.googleCallback(code, state);
    res.cookie(SESSION_COOKIE, result.sessionToken, {
      ...COOKIE_OPTS,
      userAgent: undefined,
      ipAddress: undefined,
    } as typeof COOKIE_OPTS);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(
      `${frontendUrl}/console#access_token=${result.accessToken}&refresh_token=${result.refreshToken}`,
    );
  }
}
