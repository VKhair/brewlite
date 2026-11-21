import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto } from './auth.dto';
import type { AuthUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private async session(user: AuthUser) {
    return {
      access_token: await this.jwt.signAsync({ sub: user.id }),
      token_type: 'Bearer',
      user,
    };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await hash(dto.password, 12);
    try {
      const user = await this.db.user.create({
        data: {
          id: randomUUID(),
          email: dto.email,
          fullName: dto.fullName,
          phone: dto.phone,
          passwordHash,
        },
      });
      return this.session({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as AuthUser['role'],
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Email đã được đăng ký',
        });
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.db.user.findUnique({ where: { email: dto.email } });
    // A valid cost-12 dummy hash keeps unknown-email and wrong-password work similar.
    const valid = await compare(
      dto.password,
      user?.passwordHash ??
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxT3XgE7bHiSdUhADgoNRaL8k1K',
    );
    if (!valid || !user || Buffer.byteLength(dto.password) > 72) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Thông tin đăng nhập không chính xác',
      });
    }
    return this.session({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as AuthUser['role'],
    });
  }
}
