import { IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, IsUrl } from 'class-validator';

export enum MessageTypeEnum { TEXT='TEXT', IMAGE='IMAGE', DOCUMENT='DOCUMENT', AUDIO='AUDIO', VIDEO='VIDEO' }

export class SendMessageDto {
  @IsUUID() workspaceId!: string;
  @IsUUID() deviceId!: string;
  @Matches(/^62\d{8,15}$/) target!: string;
  @IsEnum(MessageTypeEnum) type!: MessageTypeEnum;
  @IsOptional() @IsString() @MaxLength(4096) message?: string;
  @IsOptional() @IsUrl() mediaUrl?: string;
}
