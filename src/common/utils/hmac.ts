import { createHmac } from 'crypto';

export function signHmac(secret: string, payload: unknown): string {
  return createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}
