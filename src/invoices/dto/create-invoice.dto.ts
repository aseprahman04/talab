import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateInvoiceDto {
  @IsString() orderId: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) vatRate?: number;
  @IsOptional() @IsString() logoUrl?: string;
}
