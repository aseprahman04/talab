import { Injectable, Logger } from '@nestjs/common';

export interface OcrResult {
  amount: number | null;
  date: string | null;
  reference: string | null;
  confidence: number; // 0-1
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractPaymentData(imageUrl: string): Promise<OcrResult> {
    // Stub — replace with real OCR provider (Google Vision, AWS Textract, or local model)
    // Expected env vars: OCR_PROVIDER=google|aws|local, OCR_API_KEY=...
    this.logger.log(`OCR extract: ${imageUrl}`);
    return { amount: null, date: null, reference: null, confidence: 0 };
  }

  matchAmount(ocrAmount: number | null, invoiceAmount: number): 'MATCHED' | 'MISMATCH' | 'LOW_CONFIDENCE' {
    if (ocrAmount === null) return 'LOW_CONFIDENCE';
    const diff = Math.abs(ocrAmount - invoiceAmount);
    const pct = diff / invoiceAmount;
    if (pct < 0.01) return 'MATCHED';
    return 'MISMATCH';
  }
}
