import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';
import { encryptAESGCM, decryptAESGCM, EncryptedPayload } from '../crypto/cipher';

const WIN_HELLO_POWERSHELL_SCRIPT = `# Windows Hello Native Biometric Bridge
param (
    [string]$Action = "check",
    [string]$Prompt = "My Safe - Authentication"
)

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    [Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType = WindowsRuntime] | Out-Null
    [Windows.Security.Credentials.UI.UserConsentVerificationResult, Windows.Security.Credentials.UI, ContentType = WindowsRuntime] | Out-Null
    [Windows.Security.Credentials.UI.UserConsentVerifierAvailability, Windows.Security.Credentials.UI, ContentType = WindowsRuntime] | Out-Null

    $methods = [System.WindowsRuntimeSystemExtensions].GetMethods()
    $asTaskMethod = $null
    foreach ($m in $methods) {
        if ($m.Name -eq 'AsTask' -and $m.GetParameters().Count -eq 1) {
            $p = $m.GetParameters()[0]
            if ($p.ParameterType.Name -eq 'IAsyncOperation\`1') {
                $asTaskMethod = $m
                break
            }
        }
    }

    if ($Action -eq "check") {
        $op = [Windows.Security.Credentials.UI.UserConsentVerifier]::CheckAvailabilityAsync()
        $targetType = [Windows.Security.Credentials.UI.UserConsentVerifierAvailability]
        $genericMethod = $asTaskMethod.MakeGenericMethod($targetType)
        $task = $genericMethod.Invoke($null, @($op))
        $res = $task.Result
        [Console]::Out.WriteLine("$res")
    }
    elseif ($Action -eq "verify") {
        $op = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync($Prompt)
        $targetType = [Windows.Security.Credentials.UI.UserConsentVerificationResult]
        $genericMethod = $asTaskMethod.MakeGenericMethod($targetType)
        $task = $genericMethod.Invoke($null, @($op))
        $res = $task.Result
        [Console]::Out.WriteLine("$res")
    }
}
catch {
    [Console]::Out.WriteLine("Error: $($_.Exception.Message)")
}
`;

export class WindowsHelloService {
  private tokenPath: string;
  private scriptPath: string;

  constructor(vaultDir: string) {
    this.tokenPath = path.join(vaultDir, 'hello_token.enc');
    // Always write script to real filesystem directory (vaultDir) so powershell can access it outside app.asar
    this.scriptPath = path.join(vaultDir, 'winHello.ps1');
    this.ensureScript();
  }

  private ensureScript(): void {
    try {
      fs.writeFileSync(this.scriptPath, WIN_HELLO_POWERSHELL_SCRIPT, 'utf-8');
    } catch (err) {
      console.error('[WindowsHello] Failed to write winHello.ps1 script:', err);
    }
  }

  private getMachineKey(): Buffer {
    const machineName = process.env.COMPUTERNAME || os.hostname() || 'DEFAULT_MACHINE';
    const userName = process.env.USERNAME || (os.userInfo && os.userInfo().username) || 'DEFAULT_USER';
    return crypto.createHash('sha256').update(`${machineName}_${userName}_MY_SAFE_BIO`).digest();
  }

  /**
   * Checks if Windows Hello (PIN, Fingerprint, or Face) is configured and available on this PC
   */
  public async isAvailable(): Promise<boolean> {
    this.ensureScript();
    return new Promise((resolve) => {
      execFile(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          this.scriptPath,
          '-Action',
          'check',
        ],
        { windowsHide: true, timeout: 10000 },
        (error, stdout, stderr) => {
          if (error) {
            console.error('[WindowsHello] check error:', error, stderr);
            resolve(false);
            return;
          }
          const output = stdout.trim();
          console.log('[WindowsHello] check output:', output);
          resolve(output.includes('Available'));
        }
      );
    });
  }

  /**
   * Prompts the official Windows Hello biometric/PIN consent window on screen
   */
  public async requestVerification(promptMessage: string = 'My Safe - Authentication'): Promise<{ success: boolean; status: string }> {
    this.ensureScript();
    return new Promise((resolve) => {
      execFile(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          this.scriptPath,
          '-Action',
          'verify',
          '-Prompt',
          promptMessage,
        ],
        { windowsHide: false, timeout: 60000 },
        (error, stdout, stderr) => {
          if (error) {
            console.error('[WindowsHello] verify error:', error, stderr);
            resolve({ success: false, status: 'Error' });
            return;
          }
          const output = stdout.trim();
          console.log('[WindowsHello] verify output:', output);
          if (output.includes('Verified')) {
            resolve({ success: true, status: 'Verified' });
          } else if (output.includes('Canceled')) {
            resolve({ success: false, status: 'Canceled' });
          } else {
            resolve({ success: false, status: output || 'Failed' });
          }
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
    const machineKey = this.getMachineKey();
    const encrypted = encryptAESGCM(masterKey, machineKey);
    fs.writeFileSync(this.tokenPath, JSON.stringify(encrypted), 'utf-8');
    console.log('[WindowsHello] Successfully enabled token at:', this.tokenPath);
  }

  /**
   * Disables Windows Hello
   */
  public disableWindowsHello(): void {
    if (fs.existsSync(this.tokenPath)) {
      fs.unlinkSync(this.tokenPath);
      console.log('[WindowsHello] Disabled and removed token.');
    }
  }

  /**
   * Retrieves the decrypted Master Key after successful biometric verification
   */
  public getMasterKey(): Buffer | null {
    if (!this.isEnabled()) return null;
    try {
      const machineKey = this.getMachineKey();
      const raw: EncryptedPayload = JSON.parse(fs.readFileSync(this.tokenPath, 'utf-8'));
      return decryptAESGCM(raw, machineKey);
    } catch (err) {
      console.error('[WindowsHello] Failed to decrypt master key from token:', err);
      return null;
    }
  }
}
