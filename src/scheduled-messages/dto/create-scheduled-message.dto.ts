import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduledMessageDto {
  @ApiProperty() @IsUUID() workspaceId!: string;
  @ApiProperty() @IsString() deviceId!: string;
  @ApiProperty() @IsString() name!: string;

  @ApiPropertyOptional({ enum: ['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO'], default: 'TEXT' })
  @IsOptional() @IsIn(['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO']) type?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mediaUrl?: string;

  @ApiProperty({ example: '6281234567890' })
  @Matches(/^62\d{8,15}$/) recipient!: string;

  @ApiProperty({ enum: ['DAILY', 'WEEKLY', 'MONTHLY'] })
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY']) repeatType!: string;

  @ApiProperty({ description: 'Hour in WIB (0–23)', example: 9 })
  @IsInt() @Min(0) @Max(23) sendHour!: number;

  @ApiPropertyOptional({ description: 'Minute (0–59)', default: 0 })
  @IsOptional() @IsInt() @Min(0) @Max(59) sendMinute?: number;

  @ApiPropertyOptional({ description: 'Day of week (0=Sun, 6=Sat) — required for WEEKLY' })
  @IsOptional() @IsInt() @Min(0) @Max(6) dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Day of month (1–31) — required for MONTHLY' })
  @IsOptional() @IsInt() @Min(1) @Max(31) dayOfMonth?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean() isEnabled?: boolean;
}
