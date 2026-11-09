import crypto from 'crypto';

export interface EncryptedPayload {
  iv: string;         // Hex encoded initialization vector (12 bytes)
  ciphertext: string; // Hex encoded encrypted data
  tag: string;        // Hex encoded GCM authentication tag (16 bytes)
}

/**
 * Encrypts a string or Buffer using AES-256-GCM.
 * Authenticated Encryption ensures both confidentiality and tamper-proof integrity.
 */
export function encryptAESGCM(plaintext: string | Buffer, key: Buffer): EncryptedPayload {
  if (key.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (256 bits).');
  }

  // 96-bit (12 bytes) IV recommended for AES-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const inputBuffer = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf-8');
  const encrypted = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    ciphertext: encrypted.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypts an AES-256-GCM payload.
 * Throws an error if the tag fails authentication (tampering detected) or key is wrong.
 */
export function decryptAESGCM(payload: EncryptedPayload, key: Buffer): Buffer {
  if (key.length !== 32) {
    throw new Error('Decryption key must be exactly 32 bytes (256 bits).');
  }

  const iv = Buffer.from(payload.iv, 'hex');
  const ciphertext = Buffer.from(payload.ciphertext, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Helper to decrypt directly to UTF-8 string
 */
export function decryptAESGCMString(payload: EncryptedPayload, key: Buffer): string {
  const decryptedBuffer = decryptAESGCM(payload, key);
  return decryptedBuffer.toString('utf-8');
}
