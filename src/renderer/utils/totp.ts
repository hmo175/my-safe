// Base32 decoding helper
function base32ToUint8Array(base32: string): Uint8Array {
  const cleanBase32 = base32.replace(/[\s=-]/g, '').toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleanBase32.length; i++) {
    const idx = alphabet.indexOf(cleanBase32[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Computes the 6-digit TOTP code and remaining seconds for a given Base32 secret using Web Crypto API.
 */
export async function generateTOTP(secret: string): Promise<{ code: string; remainingSeconds: number }> {
  try {
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const counter = Math.floor(epoch / timeStep);
    const remainingSeconds = timeStep - (epoch % timeStep);

    // Counter as 8-byte big-endian buffer
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);

    const keyBytes = base32ToUint8Array(secret);
    if (keyBytes.length === 0) {
      return { code: '------', remainingSeconds: 0 };
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hmacResult = new Uint8Array(signature);

    // Truncate dynamically according to RFC 6238 / RFC 4226
    const offset = hmacResult[hmacResult.length - 1] & 0x0f;
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);

    const otp = binary % 1000000;
    const formattedCode = otp.toString().padStart(6, '0');

    return {
      code: `${formattedCode.slice(0, 3)} ${formattedCode.slice(3)}`,
      remainingSeconds,
    };
  } catch {
    return { code: '------', remainingSeconds: 0 };
  }
}
