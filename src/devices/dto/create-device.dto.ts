import { IsString, IsUUID, Length } from 'class-validator';
export class CreateDeviceDto {
  @IsUUID() workspaceId!: string;
  @IsString() @Length(2, 50) name!: string;
}
