import { IsString, MaxLength, MinLength } from 'class-validator';

export class WebAuthnListDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  userId!: string;
}
