import { Module } from '@nestjs/common';
import { PaymentProofsController } from './payment-proofs.controller';
import { PaymentProofsService } from './payment-proofs.service';
import { OcrModule } from 'src/ocr/ocr.module';
import { PrismaModule } from 'src/database/prisma/prisma.module';

@Module({ imports: [PrismaModule, OcrModule], controllers: [PaymentProofsController], providers: [PaymentProofsService], exports: [PaymentProofsService] })
export class PaymentProofsModule {}
