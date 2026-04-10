import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString, IsUrl, IsUUID, ValidateIf } from 'class-validator';

export class CreateAutoReplyDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID() workspaceId!: string;

  @ApiProperty({ example: 'seed-device-01' })
  @IsString() deviceId!: string;

  @ApiProperty({ example: 'Cek Status Order' })
  @IsString() name!: string;

  @ApiProperty({ example: 'contains', description: 'contains | exact' })
  @IsString() matchType!: string;

  @ApiProperty({ example: 'cek pesanan' })
  @IsString() keyword!: string;

  @ApiPropertyOptional({ example: 'Halo! Silakan kirim nomor order kamu ya.' })
  @ValidateIf((o: CreateAutoReplyDto) => !o.webhookUrl)
  @IsString() response?: string;

  @ApiPropertyOptional({ example: 'https://esekolah.com/api/wa/handler' })
  @ValidateIf((o: CreateAutoReplyDto) => !o.response)
  @IsUrl() webhookUrl?: string;

  @ApiProperty({ example: 10, description: '0–100, higher = checked first' })
  @IsInt() priority!: number;

  @ApiProperty({ example: true })
  @IsBoolean() isEnabled!: boolean;
}
