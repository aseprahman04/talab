import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new account with email & password' })
  @ApiResponse({ status: 201, description: 'Returns accessToken + refreshToken' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email & password' })
  @ApiResponse({ status: 200, description: 'Returns accessToken + refreshToken' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Returns new accessToken + refreshToken' })
  refresh(@Body() dto: RefreshDto) { return this.authService.refresh(dto.refreshToken); }

  @Post('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions for the current user' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  logoutAll(@CurrentUser() user: { sub: string }) { return this.authService.revokeAllSessions(user.sub); }

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
  @ApiOperation({ summary: 'Google OAuth callback — redirects to frontend with tokens in fragment' })
  @ApiResponse({ status: 302, description: 'Redirects to /console#access_token=...&refresh_token=...' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.googleCallback(code, state);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(
      `${frontendUrl}/console#access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`,
    );
  }
}
