import crypto from 'crypto';
import { deriveKeyScrypt } from './keyDerivation';

// Crockford's Base32 alphabet (omits easily confused letters like I, L, O, 0)
const SAFE_ALPHABET = '123456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates an emergency recovery key: 32 characters in 8 groups of 4.
 * Example: 'K9W2-8FGH-3JKL-MN5P-QR7T-UV9X-YZ21-4567'
 */
export function generateRecoveryKey(): string {
  const bytes = crypto.randomBytes(32);
  let raw = '';
  for (let i = 0; i < 32; i++) {
    raw += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length];
  }

  // Format into 8 chunks of 4 characters
  const chunks: string[] = [];
  for (let i = 0; i < 32; i += 4) {
    chunks.push(raw.slice(i, i + 4));
  }
  return chunks.join('-');
}

/**
 * Normalizes a user-input recovery key by removing dashes and converting to uppercase.
 */
export function normalizeRecoveryKey(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Derives a key from the emergency recovery key using a fixed recovery salt
 */
export function deriveKeyFromRecovery(recoveryKey: string, vaultSalt: string): Buffer {
  const normalized = normalizeRecoveryKey(recoveryKey);
  const recoverySalt = crypto.createHash('sha256').update(vaultSalt + '_recovery').digest('hex');
  return deriveKeyScrypt(normalized, recoverySalt).key;
}
