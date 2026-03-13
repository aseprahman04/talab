import { createHash, randomBytes } from 'crypto';

export function generatePlainToken(prefix = 'wt'): string {
  return `${prefix}_${randomBytes(24).toString('hex')}`;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
