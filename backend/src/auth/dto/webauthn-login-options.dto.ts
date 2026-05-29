import { IsString, MaxLength, MinLength } from 'class-validator';

export class WebAuthnLoginOptionsDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  challengeId!: string;
}
