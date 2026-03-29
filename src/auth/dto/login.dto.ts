import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'aseprahmanurhakim04@gmail.com' })
  @IsEmail() email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @MinLength(8) password!: string;
}
