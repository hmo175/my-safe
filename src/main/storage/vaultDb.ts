import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';
import { encryptAESGCM, decryptAESGCM, decryptAESGCMString, EncryptedPayload } from '../crypto/cipher';
import { deriveKeyArgon2, deriveKeyScrypt } from '../crypto/keyDerivation';
import { generateRecoveryKey, deriveKeyFromRecovery } from '../crypto/recovery';

export interface VaultMetadata {
  vaultId: string;
  version: number;
  salt: string;                      // Salt for Master Password (Argon2id)
  testPayload: EncryptedPayload;     // Encrypted verification token "MY_SAFE_UNLOCKED"
  recoveryEncryptedKey: EncryptedPayload; // Master key encrypted with recovery key
  createdAt: string;
  updatedAt: string;
}

export type ItemType = 'login' | 'note' | 'card' | 'file';

export interface BaseVaultItem {
  id: string;
  type: ItemType;
  title: string;
  folder?: string;
  favorite?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginItem extends BaseVaultItem {
  type: 'login';
  username?: string;
  email?: string;
  password?: string;
  url?: string;
  totpSecret?: string;
  notes?: string;
}

export interface NoteItem extends BaseVaultItem {
  type: 'note';
  content: string;
}

export interface CardItem extends BaseVaultItem {
  type: 'card';
  cardholderName?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  pin?: string;
  notes?: string;
}

export interface FileItem extends BaseVaultItem {
  type: 'file';
  fileName: string;
  fileSize: number;
  mimeType: string;
  storedFileName: string; // Name of encrypted file on disk
  notes?: string;
}

export type VaultItem = LoginItem | NoteItem | CardItem | FileItem;

export interface VaultData {
  items: VaultItem[];
  folders: string[];
  settings: {
    autoLockMinutes: number;
    clipboardClearSeconds: number;
    antiScreenCapture: boolean;
    language: 'ar' | 'en';
    theme: 'dark' | 'light';
    lockOnCloseToTray: boolean;
    lockOnMinimize: boolean;
  };
}

const VERIFICATION_TOKEN = 'MY_SAFE_UNLOCKED_V1';

export class VaultManager {
  private baseDir: string;
  private metaPath: string;
  private dataPath: string;
  private filesDir: string;

  // Active in-memory session (cleared on lock)
  private masterKey: Buffer | null = null;
  private cachedData: VaultData | null = null;

  constructor(customPath?: string) {
    this.baseDir = customPath || path.join(app ? app.getPath('userData') : process.cwd(), 'mysafe_vault');
    this.metaPath = path.join(this.baseDir, 'meta.json');
    this.dataPath = path.join(this.baseDir, 'vault.enc');
    this.filesDir = path.join(this.baseDir, 'files');

    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
    }
  }

  public isVaultInitialized(): boolean {
    return fs.existsSync(this.metaPath);
  }

  public isUnlocked(): boolean {
    return this.masterKey !== null;
  }

  /**
   * Changes the Master Password, re-derives a new key with Argon2id, and re-encrypts all vault data
   */
  public async changeMasterPassword(oldPassword: string, newPassword: string): Promise<boolean> {
    if (!this.isUnlocked() || !this.cachedData) {
      throw new Error('Vault is locked.');
    }

    // 1. Verify old password first
    const metadata: VaultMetadata = JSON.parse(fs.readFileSync(this.metaPath, 'utf-8'));
    const { key: oldKey } = await deriveKeyArgon2(oldPassword, metadata.salt);

    try {
      const decryptedToken = decryptAESGCMString(metadata.testPayload, oldKey);
      if (decryptedToken !== VERIFICATION_TOKEN) {
        return false;
      }
    } catch {
      return false;
    }

    // 2. Derive new key with brand new salt
    const { key: newKey, salt: newSalt } = await deriveKeyArgon2(newPassword);

    // 3. Re-encrypt test payload
    const newTestPayload = encryptAESGCM(VERIFICATION_TOKEN, newKey);

    // 4. Update recovery key binding
    const recoveryKey = generateRecoveryKey();
    const recoveryDerivedKey = deriveKeyFromRecovery(recoveryKey, newSalt);
    const newRecoveryEncryptedKey = encryptAESGCM(newKey, recoveryDerivedKey);

    // 5. Update metadata
    metadata.salt = newSalt;
    metadata.testPayload = newTestPayload;
    metadata.recoveryEncryptedKey = newRecoveryEncryptedKey;
    metadata.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

    // 6. Set new active key in memory and re-save vault data
    this.masterKey = newKey;
    this.saveVaultData();

    return true;
  }

  /**
   * Initializes a brand new vault with Master Password and generates Emergency Recovery Key
   */
  public async initializeVault(masterPassword: string): Promise<{ recoveryKey: string }> {
    if (this.isVaultInitialized()) {
      throw new Error('Vault is already initialized.');
    }

    // 1. Derive Master Encryption Key (MEK) via Argon2id
    const { key: masterKey, salt } = await deriveKeyArgon2(masterPassword);

    // 2. Generate Emergency Recovery Key and encrypt the MEK with it
    const recoveryKey = generateRecoveryKey();
    const recoveryDerivedKey = deriveKeyFromRecovery(recoveryKey, salt);
    const recoveryEncryptedKey = encryptAESGCM(masterKey, recoveryDerivedKey);

    // 3. Create verification token encrypted with MEK
    const testPayload = encryptAESGCM(VERIFICATION_TOKEN, masterKey);

    // 4. Save metadata
    const metadata: VaultMetadata = {
      vaultId: crypto.randomUUID(),
      version: 1,
      salt,
      testPayload,
      recoveryEncryptedKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(this.metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

    // 5. Initialize empty vault data
    const initialData: VaultData = {
      items: [],
      folders: ['Personal', 'Work', 'Finance'],
      settings: {
        autoLockMinutes: 5,
        clipboardClearSeconds: 30,
        antiScreenCapture: true,
        language: 'ar',
        theme: 'dark',
        lockOnCloseToTray: true,
        lockOnMinimize: true,
      },
    };

    this.masterKey = masterKey;
    this.cachedData = initialData;
    this.saveVaultData();

    return { recoveryKey };
  }

  /**
   * Unlocks the vault using Master Password
   */
  public async unlockWithPassword(password: string): Promise<boolean> {
    if (!this.isVaultInitialized()) {
      throw new Error('Vault is not initialized.');
    }

    const metadata: VaultMetadata = JSON.parse(fs.readFileSync(this.metaPath, 'utf-8'));
    
    // Derive key using existing salt
    const { key } = await deriveKeyArgon2(password, metadata.salt);

    // Verify key by decrypting verification token
    try {
      const decryptedToken = decryptAESGCMString(metadata.testPayload, key);
      if (decryptedToken === VERIFICATION_TOKEN) {
        this.masterKey = key;
        this.loadVaultData();
        return true;
      }
    } catch {
      // Decryption tag mismatch means invalid password
      return false;
    }

    return false;
  }

  /**
   * Unlocks the vault using Emergency Recovery Key
   */
  public unlockWithRecoveryKey(recoveryKey: string): boolean {
    if (!this.isVaultInitialized()) {
      throw new Error('Vault is not initialized.');
    }

    const metadata: VaultMetadata = JSON.parse(fs.readFileSync(this.metaPath, 'utf-8'));
    const recoveryDerivedKey = deriveKeyFromRecovery(recoveryKey, metadata.salt);

    try {
      const decryptedMasterKey = decryptAESGCM(
        metadata.recoveryEncryptedKey,
        recoveryDerivedKey
      );

      // Verify the decrypted master key against test payload
      const decryptedToken = decryptAESGCMString(metadata.testPayload, decryptedMasterKey);
      if (decryptedToken === VERIFICATION_TOKEN) {
        this.masterKey = decryptedMasterKey;
        this.loadVaultData();
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  /**
   * Unlocks the vault using an already decrypted Master Key (e.g. from Windows Hello / Biometrics)
   */
  public unlockWithKey(key: Buffer): boolean {
    if (!this.isVaultInitialized()) {
      throw new Error('Vault is not initialized.');
    }

    const metadata: VaultMetadata = JSON.parse(fs.readFileSync(this.metaPath, 'utf-8'));
    try {
      const decryptedToken = decryptAESGCMString(metadata.testPayload, key);
      if (decryptedToken === VERIFICATION_TOKEN) {
        this.masterKey = key;
        this.loadVaultData();
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Locks the vault and securely scrubs keys and plaintext items from memory
   */
  public lock(): void {
    if (this.masterKey) {
      this.masterKey.fill(0); // Overwrite key buffer in memory
      this.masterKey = null;
    }
    this.cachedData = null;
  }

  /**
   * Loads encrypted vault data from disk into memory
   */
  private loadVaultData(): void {
    if (!this.masterKey) throw new Error('Vault is locked.');

    if (!fs.existsSync(this.dataPath)) {
      this.cachedData = {
        items: [],
        folders: ['Personal', 'Work', 'Finance'],
        settings: {
          autoLockMinutes: 5,
          clipboardClearSeconds: 30,
          antiScreenCapture: true,
          language: 'ar',
          theme: 'dark',
          lockOnCloseToTray: true,
          lockOnMinimize: true,
        },
      };
      return;
    }

    const rawEncrypted: EncryptedPayload = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
    const decryptedJson = decryptAESGCMString(rawEncrypted, this.masterKey);
    this.cachedData = JSON.parse(decryptedJson);
    if (this.cachedData && this.cachedData.settings) {
      if (this.cachedData.settings.autoLockMinutes === undefined) {
        this.cachedData.settings.autoLockMinutes = 5;
      }
      if (this.cachedData.settings.lockOnCloseToTray === undefined) {
        this.cachedData.settings.lockOnCloseToTray = true;
      }
      if (this.cachedData.settings.lockOnMinimize === undefined) {
        this.cachedData.settings.lockOnMinimize = true;
      }
    }
  }

  /**
   * Saves cached data back to encrypted disk storage with atomic write
   */
  public saveVaultData(): void {
    if (!this.masterKey || !this.cachedData) throw new Error('Vault is locked.');

    const json = JSON.stringify(this.cachedData);
    const encrypted = encryptAESGCM(json, this.masterKey);

    const tempPath = `${this.dataPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(encrypted, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.dataPath);
  }

  public getData(): VaultData {
    if (!this.isUnlocked() || !this.cachedData) {
      throw new Error('Vault is locked.');
    }
    return this.cachedData;
  }

  public addItem(item: VaultItem): void {
    if (!this.isUnlocked() || !this.cachedData) throw new Error('Vault is locked.');
    this.cachedData.items.push(item);
    this.saveVaultData();
  }

  /**
   * Encrypts and saves a binary file into the secure files vault
   */
  public saveEncryptedFile(fileBuffer: Buffer, fileName: string, mimeType: string): FileItem {
    if (!this.isUnlocked() || !this.masterKey || !this.cachedData) {
      throw new Error('Vault is locked.');
    }

    const fileId = crypto.randomUUID();
    const storedFileName = `file_${fileId}.enc`;
    const targetPath = path.join(this.filesDir, storedFileName);

    // Encrypt the binary file buffer directly with AES-256-GCM
    const encrypted = encryptAESGCM(fileBuffer, this.masterKey);
    fs.writeFileSync(targetPath, JSON.stringify(encrypted), 'utf-8');

    const fileItem: FileItem = {
      id: fileId,
      type: 'file',
      title: fileName,
      fileName,
      fileSize: fileBuffer.length,
      mimeType,
      storedFileName,
      folder: 'Personal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorite: false,
    };

    this.cachedData.items.push(fileItem);
    this.saveVaultData();

    return fileItem;
  }

  /**
   * Decrypts a file in memory (RAM) without writing any plaintext to disk
   */
  public readDecryptedFile(storedFileName: string): Buffer {
    if (!this.isUnlocked() || !this.masterKey) {
      throw new Error('Vault is locked.');
    }

    const filePath = path.join(this.filesDir, storedFileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('Encrypted file not found on disk.');
    }

    const rawEncrypted: EncryptedPayload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return decryptAESGCM(rawEncrypted, this.masterKey);
  }

  /**
   * Deletes an encrypted file from disk and its metadata record
   */
  public deleteEncryptedFile(storedFileName: string): void {
    const filePath = path.join(this.filesDir, storedFileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to unlink encrypted file:', err);
      }
    }
  }

  public updateItem(id: string, updated: Partial<VaultItem>): void {
    if (!this.isUnlocked() || !this.cachedData) throw new Error('Vault is locked.');
    const index = this.cachedData.items.findIndex(it => it.id === id);
    if (index !== -1) {
      this.cachedData.items[index] = {
        ...this.cachedData.items[index],
        ...updated,
        updatedAt: new Date().toISOString(),
      } as VaultItem;
      this.saveVaultData();
    }
  }

  public deleteItem(id: string): void {
    if (!this.isUnlocked() || !this.cachedData) throw new Error('Vault is locked.');
    const item = this.cachedData.items.find(it => it.id === id);
    if (item && item.type === 'file' && item.storedFileName) {
      this.deleteEncryptedFile(item.storedFileName);
    }
    this.cachedData.items = this.cachedData.items.filter(it => it.id !== id);
    this.saveVaultData();
  }

  public getFilesDir(): string {
    return this.filesDir;
  }

  public getBaseDir(): string {
    return this.baseDir;
  }

  public getMasterKey(): Buffer | null {
    return this.masterKey;
  }
}
