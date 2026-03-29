import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContactListDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID() workspaceId!: string;

  @ApiProperty({ example: 'Pelanggan VIP' })
  @IsString() name!: string;

  @ApiPropertyOptional({ example: 'Daftar pelanggan tier VIP' })
  @IsOptional() @IsString() description?: string;
}
