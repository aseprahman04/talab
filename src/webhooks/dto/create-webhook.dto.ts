import { IsBoolean, IsOptional, IsString, IsUrl, IsUUID, Length } from 'class-validator';
export class CreateWebhookDto {
  @IsUUID() workspaceId!: string;
  @IsString() @Length(2, 50) name!: string;
  @IsUrl({ require_protocol: true }) url!: string;
  @IsString() @Length(8, 128) secret!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
