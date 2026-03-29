import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';

export class ContactEntryDto {
  @ApiProperty({ example: '6281234567890' })
  @Matches(/^62\d{8,15}$/) phoneNumber!: string;

  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() notes?: string;
}

export class BulkImportContactsDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID() workspaceId!: string;

  @ApiProperty({ type: [ContactEntryDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ContactEntryDto) contacts!: ContactEntryDto[];
}
