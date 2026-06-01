import { IsString, MaxLength, MinLength } from 'class-validator';

export class WebAuthnRemoveDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  credentialId!: string;
}
