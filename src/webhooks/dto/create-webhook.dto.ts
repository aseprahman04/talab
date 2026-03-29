import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl, IsUUID, Length } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID() workspaceId!: string;

  @ApiProperty({ example: 'Order Notifications', minLength: 2, maxLength: 50 })
  @IsString() @Length(2, 50) name!: string;

  @ApiProperty({ example: 'https://api.example.com/webhooks/watether' })
  @IsUrl({ require_protocol: true }) url!: string;

  @ApiProperty({ example: 'supersecretkey123', minLength: 8, maxLength: 128 })
  @IsString() @Length(8, 128) secret!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() isActive?: boolean;
}
