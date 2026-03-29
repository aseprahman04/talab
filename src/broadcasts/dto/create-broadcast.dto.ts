import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID, Matches } from 'class-validator';

export class CreateBroadcastDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID() workspaceId!: string;

  @ApiProperty({ example: 'seed-device-01' })
  @IsUUID() deviceId!: string;

  @ApiProperty({ example: 'Promo Ramadan 2025' })
  @IsString() name!: string;

  @ApiProperty({ example: 'Halo {name}, ada promo spesial untuk kamu hari ini!' })
  @IsString() messageTemplate!: string;

  @ApiProperty({ type: [String], example: ['6285795950115', '628579590115'] })
  @IsArray() @Matches(/^62\d{8,15}$/, { each: true }) recipients!: string[];
}
