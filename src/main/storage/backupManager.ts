import crypto from 'crypto';
import { encryptAESGCM, decryptAESGCMString, EncryptedPayload } from '../crypto/cipher';
import { deriveKeyScrypt } from '../crypto/keyDerivation';
import { VaultData, VaultItem, LoginItem } from './vaultDb';

export class BackupManager {
  /**
   * Parses CSV exported from Google Chrome, Edge, or Bitwarden into My Safe Login Items
   */
  public static parseCsv(csvText: string): LoginItem[] {
    const lines = this.splitCsvLines(csvText);
    if (lines.length < 2) return [];

    const headers = this.parseCsvRow(lines[0]).map((h) => h.trim().toLowerCase());
    const items: LoginItem[] = [];

    // Detect format
    const isChromeOrEdge = headers.includes('name') && headers.includes('url') && (headers.includes('username') || headers.includes('email'));
    const isBitwarden = headers.includes('login_uri') && headers.includes('login_username');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row = this.parseCsvRow(line);
      if (row.length === 0) continue;

      let title = '';
      let url = '';
      let username = '';
      let password = '';
      let notes = '';

      if (isBitwarden) {
        const nameIdx = headers.indexOf('name');
        const uriIdx = headers.indexOf('login_uri');
        const userIdx = headers.indexOf('login_username');
        const passIdx = headers.indexOf('login_password');
        const noteIdx = headers.indexOf('notes');

        title = row[nameIdx] || 'حساب مستورد';
        url = row[uriIdx] || '';
        username = row[userIdx] || '';
        password = row[passIdx] || '';
        notes = row[noteIdx] || '';
      } else if (isChromeOrEdge) {
        const nameIdx = headers.indexOf('name');
        const urlIdx = headers.indexOf('url');
        const userIdx = headers.indexOf('username') !== -1 ? headers.indexOf('username') : headers.indexOf('email');
        const passIdx = headers.indexOf('password');
        const noteIdx = headers.indexOf('note');

        title = row[nameIdx] || row[urlIdx] || 'حساب مستورد';
        url = row[urlIdx] || '';
        username = row[userIdx] || '';
        password = row[passIdx] || '';
        notes = noteIdx !== -1 ? row[noteIdx] : '';
      } else {
        // Fallback generic CSV
        title = row[0] || 'حساب مستورد';
        url = row[1] || '';
        username = row[2] || '';
        password = row[3] || '';
      }

      if (title || username || password) {
        items.push({
          id: crypto.randomUUID(),
          type: 'login',
          title: title.trim(),
          url: url.trim(),
          username: username.trim(),
          password: password.trim(),
          notes: notes.trim(),
          folder: 'Personal',
          favorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return items;
  }

  /**
   * Helper to parse CSV row handling quotes and commas
   */
  private static parseCsvRow(rowText: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private static splitCsvLines(text: string): string[] {
    return text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  }

  /**
   * Exports an encrypted .mysafe backup file
   */
  public static createEncryptedBackup(vaultData: VaultData, backupPassword: string): string {
    const salt = crypto.randomBytes(32).toString('hex');
    const { key } = deriveKeyScrypt(backupPassword, salt);
    const json = JSON.stringify(vaultData);
    const payload = encryptAESGCM(json, key);

    const backupFile = {
      format: 'MY_SAFE_ENCRYPTED_BACKUP',
      version: 1,
      salt,
      payload,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(backupFile, null, 2);
  }

  /**
   * Restores an encrypted .mysafe backup file
   */
  public static restoreEncryptedBackup(fileContent: string, backupPassword: string): VaultData {
    const parsed = JSON.parse(fileContent);
    if (parsed.format !== 'MY_SAFE_ENCRYPTED_BACKUP') {
      throw new Error('صيغة ملف النسخ الاحتياطي غير صالحة.');
    }

    const { key } = deriveKeyScrypt(backupPassword, parsed.salt);
    const decryptedJson = decryptAESGCMString(parsed.payload, key);
    return JSON.parse(decryptedJson);
  }
}
