import { Module } from '@nestjs/common';
import { PaymentProofsController } from './payment-proofs.controller';
import { PaymentProofsService } from './payment-proofs.service';
import { OcrModule } from '../ocr/ocr.module';

@Module({ imports: [OcrModule], controllers: [PaymentProofsController], providers: [PaymentProofsService], exports: [PaymentProofsService] })
export class PaymentProofsModule {}
