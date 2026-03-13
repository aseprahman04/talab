import { IsBoolean, IsInt, IsString, IsUUID } from 'class-validator';
export class CreateAutoReplyDto {
  @IsUUID() workspaceId!: string;
  @IsUUID() deviceId!: string;
  @IsString() name!: string;
  @IsString() matchType!: string;
  @IsString() keyword!: string;
  @IsString() response!: string;
  @IsInt() priority!: number;
  @IsBoolean() isEnabled!: boolean;
}
