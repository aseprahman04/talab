import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { SessionService } from './session.service';
import { SessionAuthGuard } from 'src/common/guards/session-auth.guard';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SessionService, SessionAuthGuard],
  exports: [AuthService, SessionService, SessionAuthGuard, JwtModule],
})
export class AuthModule {}
