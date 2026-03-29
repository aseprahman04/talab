import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID() workspaceId!: string;

  @ApiProperty({ example: 'CS Jakarta 01', minLength: 2, maxLength: 50 })
  @IsString() @Length(2, 50) name!: string;
}
