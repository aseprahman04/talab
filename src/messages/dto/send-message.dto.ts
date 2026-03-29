import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, IsUrl } from 'class-validator';

export enum MessageTypeEnum { TEXT='TEXT', IMAGE='IMAGE', DOCUMENT='DOCUMENT', AUDIO='AUDIO', VIDEO='VIDEO' }

export class SendMessageDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID() workspaceId!: string;

  @ApiProperty({ example: 'seed-device-01' })
  @IsUUID() deviceId!: string;

  @ApiProperty({ example: '6285795950115', description: 'Indonesian phone number starting with 62' })
  @Matches(/^62\d{8,15}$/) target!: string;

  @ApiProperty({ enum: MessageTypeEnum, example: MessageTypeEnum.TEXT })
  @IsEnum(MessageTypeEnum) type!: MessageTypeEnum;

  @ApiPropertyOptional({ example: 'Halo, pesanan kamu sedang diproses!', maxLength: 4096 })
  @IsOptional() @IsString() @MaxLength(4096) message?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/invoice.pdf' })
  @IsOptional() @IsUrl() mediaUrl?: string;
}
