import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class WebAuthnRegisterVerifyDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  userId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  challengeId!: string;

  @IsObject()
  response!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  friendlyName?: string;
}
