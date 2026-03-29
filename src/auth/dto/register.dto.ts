import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Asep Rahmanurhakim' })
  @IsString() name!: string;

  @ApiProperty({ example: 'asep@example.com' })
  @IsEmail() email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @MinLength(8) password!: string;
}
