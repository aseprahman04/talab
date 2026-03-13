import { IsArray, IsString, IsUUID, Matches } from 'class-validator';
export class CreateBroadcastDto {
  @IsUUID() workspaceId!: string;
  @IsUUID() deviceId!: string;
  @IsString() name!: string;
  @IsString() messageTemplate!: string;
  @IsArray() @Matches(/^62\d{8,15}$/, { each: true }) recipients!: string[];
}
