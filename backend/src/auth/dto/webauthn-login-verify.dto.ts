import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class WebAuthnLoginVerifyDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  challengeId!: string;

  @IsObject()
  response!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  locale?: 'pt-BR' | 'en';
}
