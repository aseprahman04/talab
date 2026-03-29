import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Ops Sales' })
  @IsString() @Length(2, 80) name!: string;

  @ApiProperty({ example: 'ops-sales', pattern: '^[a-z0-9-]{3,40}$' })
  @Matches(/^[a-z0-9-]{3,40}$/) slug!: string;
}
