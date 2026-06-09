import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MaxLength(512)
  token!: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long.' })
  @MaxLength(256)
  password!: string;
}
