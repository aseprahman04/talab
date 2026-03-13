import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) { return this.authService.refresh(dto.refreshToken); }

  @Post('logout-all')
  logoutAll(@CurrentUser() user: { sub: string }) { return this.authService.revokeAllSessions(user.sub); }
}
