import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDemoRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(180)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  desiredPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  useCase?: string;
}
