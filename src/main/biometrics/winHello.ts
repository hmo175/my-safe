import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import { encryptAESGCM, decryptAESGCM, EncryptedPayload } from '../crypto/cipher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_PATH = path.join(__dirname, 'biometrics', 'winHello.ps1');

export class WindowsHelloService {
  private tokenPath: string;
  private scriptPath: string;

  constructor(vaultDir: string) {
    this.tokenPath = path.join(vaultDir, 'hello_token.enc');
    // When in dist-electron, resolve script
    this.scriptPath = fs.existsSync(SCRIPT_PATH) 
      ? SCRIPT_PATH 
      : path.join(process.cwd(), 'src', 'main', 'biometrics', 'winHello.ps1');
  }

  /**
   * Checks if Windows Hello (PIN, Fingerprint, or Face) is configured and available
   */
  public async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      execFile(
        'powershell.exe',
        ['-ExecutionPolicy', 'Bypass', '-File', this.scriptPath, '-Action', 'check'],
        { windowsHide: true },
        (error, stdout) => {
          if (error) {
            resolve(false);
            return;
          }
          const output = stdout.trim();
          resolve(output === 'Available');
        }
      );
    });
  }

  /**
   * Prompts the official Windows Hello biometric/PIN consent window on screen
   */
  public async requestVerification(promptMessage: string = 'My Safe - Authentication'): Promise<boolean> {
    return new Promise((resolve) => {
      execFile(
        'powershell.exe',
        ['-ExecutionPolicy', 'Bypass', '-File', this.scriptPath, '-Action', 'verify', '-Prompt', promptMessage],
        { windowsHide: false },
        (error, stdout) => {
          if (error) {
            resolve(false);
            return;
          }
          const output = stdout.trim();
          resolve(output === 'Verified');
        }
      );
    });
  }

  /**
   * Checks if Windows Hello has been enabled for this vault
   */
  public isEnabled(): boolean {
    return fs.existsSync(this.tokenPath);
  }

  /**
   * Enables Windows Hello by encrypting the Master Key with a machine-bound hardware secret
   */
  public enableWindowsHello(masterKey: Buffer): void {
    // Generate machine/user salt
    const machineKey = crypto.createHash('sha256').update(process.env.COMPUTERNAME + '_' + process.env.USERNAME + '_MY_SAFE_BIO').digest();
    const encrypted = encryptAESGCM(masterKey, machineKey);
    fs.writeFileSync(this.tokenPath, JSON.stringify(encrypted), 'utf-8');
  }

  /**
   * Disables Windows Hello
   */
  public disableWindowsHello(): void {
    if (fs.existsSync(this.tokenPath)) {
      fs.unlinkSync(this.tokenPath);
    }
  }

  /**
   * Retrieves the decrypted Master Key after successful biometric verification
   */
  public getMasterKey(): Buffer | null {
    if (!this.isEnabled()) return null;
    try {
      const machineKey = crypto.createHash('sha256').update(process.env.COMPUTERNAME + '_' + process.env.USERNAME + '_MY_SAFE_BIO').digest();
      const raw: EncryptedPayload = JSON.parse(fs.readFileSync(this.tokenPath, 'utf-8'));
      return decryptAESGCM(raw, machineKey);
    } catch {
      return null;
    }
  }
}
