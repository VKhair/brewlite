import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthRequest, AuthUser } from './auth.types';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const match = /^Bearer ([^\s]+)$/i.exec(
      request.headers.authorization || '',
    );
    if (!match) throw new UnauthorizedException();
    let sub: string;
    try {
      const payload = await this.jwt.verifyAsync(match[1]);
      if (
        typeof payload.sub !== 'string' ||
        !isUUID(payload.sub) ||
        typeof payload.exp !== 'number'
      )
        throw new Error('Invalid claims');
      sub = payload.sub;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      });
    }
    const user = await this.db.user.findUnique({
      where: { id: sub },
      select: { id: true, email: true, fullName: true, role: true },
    });
    if (!user) throw new UnauthorizedException();
    request.user = { ...user, role: user.role as AuthUser['role'] };
    return true;
  }
}
