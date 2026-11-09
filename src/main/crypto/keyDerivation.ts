import crypto from 'crypto';
import { argon2id } from 'hash-wasm';

export interface DerivedKeyResult {
  key: Buffer;       // 32-byte derived encryption key
  salt: string;      // Hex encoded salt (32 bytes)
}

/**
 * Derives a 256-bit Master Encryption Key from a user password using Argon2id.
 * Argon2id is the industry-standard memory-hard function resistant to GPU cracking.
 */
export async function deriveKeyArgon2(password: string, existingSaltHex?: string): Promise<DerivedKeyResult> {
  const saltBytes = existingSaltHex 
    ? Buffer.from(existingSaltHex, 'hex') 
    : crypto.randomBytes(32);

  const uint8Key = await argon2id({
    password,
    salt: new Uint8Array(saltBytes),
    parallelism: 4,
    iterations: 3,
    memorySize: 65536, // 64 MB memory cost
    hashLength: 32,    // 256 bits output
    outputType: 'binary',
  });

  return {
    key: Buffer.from(uint8Key),
    salt: saltBytes.toString('hex'),
  };
}

/**
 * Fallback / fast key derivation via Node crypto Scrypt
 */
export function deriveKeyScrypt(password: string, existingSaltHex?: string): DerivedKeyResult {
  const saltBytes = existingSaltHex 
    ? Buffer.from(existingSaltHex, 'hex') 
    : crypto.randomBytes(32);

  const key = crypto.scryptSync(password, saltBytes, 32, { N: 16384, r: 8, p: 1 });

  return {
    key,
    salt: saltBytes.toString('hex'),
  };
}
