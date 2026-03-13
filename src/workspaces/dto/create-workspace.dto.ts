import { IsString, Length, Matches } from 'class-validator';
export class CreateWorkspaceDto {
  @IsString() @Length(2, 80) name!: string;
  @Matches(/^[a-z0-9-]{3,40}$/) slug!: string;
}
