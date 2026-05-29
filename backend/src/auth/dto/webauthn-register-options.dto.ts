import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class WebAuthnRegisterOptionsDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  userId!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;
}
