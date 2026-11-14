import { Body, CanActivate, ConflictException, Controller, ExecutionContext,
  HttpCode, Injectable, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { isUUID } from 'class-validator';
import { Database } from './database';
import { LoginDto, RegisterDto } from './dto';

export interface AuthUser { id: string; email: string; fullName: string; role: 'CUSTOMER' | 'STAFF'; }
export interface AuthRequest { headers: { authorization?: string }; user: AuthUser; }

export function jwtOptions() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes');
  const expires = process.env.JWT_EXPIRES_IN || '1d';
  const match = /^(\d+)(s|m|h|d)$/.exec(expires);
  if (!match) throw new Error('JWT_EXPIRES_IN must be a positive duration such as 1d or 30m');
  const seconds = Number(match[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 }[match[2]]!);
  if (!Number.isSafeInteger(seconds) || seconds <= 0) throw new Error('Invalid JWT_EXPIRES_IN');
  return { secret, signOptions: { algorithm: 'HS256' as const, expiresIn: seconds,
    issuer: 'brewlite-api', audience: 'brewlite-client' },
    verifyOptions: { algorithms: ['HS256' as const], issuer: 'brewlite-api', audience: 'brewlite-client' } };
}

@Injectable()
export class AuthService {
  constructor(private readonly db: Database, private readonly jwt: JwtService) {}

  private async session(user: AuthUser) {
    return { access_token: await this.jwt.signAsync({ sub: user.id }), token_type: 'Bearer', user };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await hash(dto.password, 12);
    try {
      const result = await this.db.query<AuthUser>(`INSERT INTO users (id, email, full_name, phone, password_hash)
        VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name AS "fullName", role`,
      [randomUUID(), dto.email, dto.fullName, dto.phone ?? null, passwordHash]);
      return this.session(result.rows[0]);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException({ code: 'EMAIL_ALREADY_REGISTERED', message: 'Email đã được đăng ký' });
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const result = await this.db.query(`SELECT id, email, full_name AS "fullName", role,
      password_hash AS "passwordHash" FROM users WHERE email = $1`, [dto.email]);
    const user = result.rows[0];
    // A valid cost-12 dummy hash keeps unknown-email and wrong-password work similar.
    const valid = await compare(dto.password, user?.passwordHash ??
      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxT3XgE7bHiSdUhADgoNRaL8k1K');
    if (!valid || !user || Buffer.byteLength(dto.password) > 72) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Thông tin đăng nhập không chính xác' });
    }
    return this.session({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
  }
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly db: Database) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const match = /^Bearer ([^\s]+)$/i.exec(request.headers.authorization || '');
    if (!match) throw new UnauthorizedException();
    let sub: string;
    try {
      const payload = await this.jwt.verifyAsync(match[1]);
      if (typeof payload.sub !== 'string' || !isUUID(payload.sub) ||
        typeof payload.exp !== 'number') throw new Error('Invalid claims');
      sub = payload.sub;
    } catch { throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Invalid or expired token' }); }
    const result = await this.db.query<AuthUser>(`SELECT id, email, full_name AS "fullName", role
      FROM users WHERE id = $1`, [sub]);
    if (!result.rows[0]) throw new UnauthorizedException();
    request.user = result.rows[0];
    return true;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login') @HttpCode(200) login(@Body() dto: LoginDto) { return this.auth.login(dto); }
}
