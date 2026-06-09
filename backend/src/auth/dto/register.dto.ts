import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const AUTH_LOCALES = ['pt-BR', 'en'] as const;

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long.' })
  @MaxLength(256)
  password!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsIn(AUTH_LOCALES)
  locale?: (typeof AUTH_LOCALES)[number];
}
