import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional } from 'class-validator';

const AUTH_LOCALES = ['pt-BR', 'en'] as const;

export class ForgotPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(AUTH_LOCALES)
  locale?: (typeof AUTH_LOCALES)[number];
}
