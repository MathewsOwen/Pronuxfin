import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
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
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, {
    message: 'Password must contain at least one letter.',
  })
  @Matches(/[0-9]/, { message: 'Password must contain at least one digit.' })
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
