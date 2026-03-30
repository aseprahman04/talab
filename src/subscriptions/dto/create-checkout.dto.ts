import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Workspace ID to create a checkout for' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ description: 'Plan code (e.g. STARTER, PRO, ENTERPRISE)' })
  @IsString()
  @IsNotEmpty()
  planCode!: string;
}
