import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID() workspaceId!: string;

  @ApiProperty({ example: '6281234567890' })
  @Matches(/^62\d{8,15}$/) phoneNumber!: string;

  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ example: 'budi@example.com' })
  @IsOptional() @IsEmail() email?: string;

  @ApiPropertyOptional({ type: [String], example: ['pelanggan', 'vip'] })
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @ApiPropertyOptional({ example: 'Met at expo 2025' })
  @IsOptional() @IsString() notes?: string;
}
