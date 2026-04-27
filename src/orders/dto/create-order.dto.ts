import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString() name!: string;
  @IsNumber() @Min(0) price!: number;
  @IsNumber() @Min(1) qty!: number;
}

export class CreateOrderDto {
  @IsString() contactName!: string;
  @IsString() contactPhone!: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items!: OrderItemDto[];
}
