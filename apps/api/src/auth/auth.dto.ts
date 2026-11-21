import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MaxUtf8Bytes } from '../common/validation/max-utf8-bytes.decorator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const email = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @Transform(email) @IsEmail() @MaxLength(254) email!: string;
  @IsString() @Length(6, 72) @MaxUtf8Bytes(72) password!: string;
}
export class RegisterDto {
  @Transform(email) @IsEmail() @MaxLength(254) email!: string;
  @IsString()
  @Length(6, 72)
  @MaxUtf8Bytes(72)
  @Matches(/^(?=.*\p{L})(?=.*\d)[\s\S]+$/u, {
    message: 'password must contain letters and digits',
  })
  password!: string;
  @Transform(trim)
  @IsString()
  @Length(2, 50)
  @Matches(/^(?=.*\p{L})[\p{L}\p{M} .'-]+$/u)
  fullName!: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/^0[35789]\d{8}$/)
  phone?: string;
}
