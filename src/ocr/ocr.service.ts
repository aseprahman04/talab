import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import axios from 'axios';
import * as sharp from 'sharp';
import { recognize } from 'node-tesseract-ocr';

export interface OcrResult {
  amount: number | null;
  date: string | null;
  reference: string | null;
  rawText: string;
  confidence: number; // 0-1
}

// Gulf currencies
const CURRENCY_RE = /(?:SAR|AED|KWD|QAR|BHD|OMR|USD|ريال|درهم|دينار|ر\.س|د\.إ)/i;

// Amount patterns — handle Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) + Western
const AMOUNT_RE =
  /(?:المبلغ|مبلغ|amount|total|إجمالي|القيمة)[^\d٠-٩]*([٠-٩\d][٠-٩\d,،.]*)/i;
const AMOUNT_FALLBACK_RE =
  /([١-٩٠\d]{1,3}(?:[,،][٠-٩\d]{3})*(?:\.[٠-٩\d]{2})?)\s*(?:SAR|AED|KWD|QAR|BHD|OMR|USD|ريال|درهم|دينار|ر\.س)/i;
const LARGE_NUMBER_RE = /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g;

// Date patterns
const DATE_RE =
  /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/;

// Reference / transaction number
const REF_RE =
  /(?:رقم\s*(?:العملية|المرجع|التحويل)|transaction\s*(?:id|no|number)|ref(?:erence)?)[:\s#]*([A-Z0-9]{6,20})/i;
const REF_FALLBACK_RE = /\b([A-Z]{2,4}\d{8,16})\b/;

function arabicToWestern(str: string): string {
  const map: Record<string, string> = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','،':',' };
  return str.replace(/[٠-٩،]/g, c => map[c] ?? c);
}

function parseAmount(text: string): number | null {
  const normalized = arabicToWestern(text);

  // Try labelled match first
  const m1 = AMOUNT_RE.exec(normalized);
  if (m1) {
    const val = parseFloat(m1[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) return val;
  }

  // Try currency-suffixed number
  const m2 = AMOUNT_FALLBACK_RE.exec(normalized);
  if (m2) {
    const val = parseFloat(m2[1].replace(/[,،]/g, ''));
    if (!isNaN(val) && val > 0) return val;
  }

  // Last resort: largest number in page that looks like a payment amount
  const candidates: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(LARGE_NUMBER_RE.source, 'g');
  while ((m = re.exec(normalized)) !== null) {
    const val = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(val) && val >= 1 && val <= 999999) candidates.push(val);
  }
  // Return the most common / most prominent number
  if (candidates.length > 0) {
    return candidates.sort((a, b) => b - a)[0];
  }

  return null;
}

function calcConfidence(rawText: string, amount: number | null): number {
  if (!amount) return 0.1;
  const hasCurrency = CURRENCY_RE.test(rawText);
  const hasDate = DATE_RE.test(rawText);
  const hasRef = REF_RE.test(rawText) || REF_FALLBACK_RE.test(rawText);
  let score = 0.4;
  if (hasCurrency) score += 0.25;
  if (hasDate) score += 0.2;
  if (hasRef) score += 0.15;
  return Math.min(score, 0.99);
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractPaymentData(imageUrl: string): Promise<OcrResult> {
    const tmpDir = os.tmpdir();
    const tmpInput = path.join(tmpDir, `ocr_in_${Date.now()}.png`);
    const tmpProcessed = path.join(tmpDir, `ocr_proc_${Date.now()}.png`);

    try {
      // Download image
      const resp = await axios.get<Buffer>(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
      fs.writeFileSync(tmpInput, Buffer.from(resp.data));

      // Preprocess: grayscale + upscale + sharpen for better OCR accuracy
      await sharp(tmpInput)
        .grayscale()
        .resize({ width: 1400, withoutEnlargement: false })
        .sharpen()
        .normalise()
        .png()
        .toFile(tmpProcessed);

      // Run Tesseract with Arabic + English
      const rawText = await recognize(tmpProcessed, {
        lang: 'ara+eng',
        oem: 1,   // LSTM only — most accurate
        psm: 6,   // Assume uniform block of text
      });

      this.logger.debug(`OCR raw (${imageUrl.slice(-30)}): ${rawText.slice(0, 200)}`);

      const amount = parseAmount(rawText);
      const dateMatch = DATE_RE.exec(rawText);
      const refMatch = REF_RE.exec(rawText) ?? REF_FALLBACK_RE.exec(rawText);

      return {
        amount,
        date: dateMatch?.[1] ?? null,
        reference: refMatch?.[1] ?? null,
        rawText,
        confidence: calcConfidence(rawText, amount),
      };
    } catch (error) {
      this.logger.error(`OCR failed for ${imageUrl}: ${(error as Error).message}`);
      return { amount: null, date: null, reference: null, rawText: '', confidence: 0 };
    } finally {
      for (const f of [tmpInput, tmpProcessed]) {
        try { fs.unlinkSync(f); } catch {}
      }
    }
  }

  matchAmount(
    ocrAmount: number | null,
    invoiceAmount: number,
  ): 'MATCHED' | 'MISMATCH' | 'LOW_CONFIDENCE' {
    if (ocrAmount === null) return 'LOW_CONFIDENCE';
    const diff = Math.abs(ocrAmount - invoiceAmount);
    const pct = diff / invoiceAmount;
    if (pct <= 0.01) return 'MATCHED';        // ≤1% difference → matched
    if (pct <= 0.05) return 'LOW_CONFIDENCE'; // 1-5% → flag for review
    return 'MISMATCH';
  }
}
