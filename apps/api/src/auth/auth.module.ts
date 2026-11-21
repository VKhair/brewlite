import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtOptions } from './jwt.config';
import { JwtGuard } from './jwt.guard';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, AdminGuard],
  exports: [JwtModule, JwtGuard, AdminGuard],
})
export class AuthModule {}
