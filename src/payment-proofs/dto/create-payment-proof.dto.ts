import { IsString } from 'class-validator';

export class CreatePaymentProofDto {
  @IsString() invoiceId: string;
  @IsString() imageUrl: string;
}
