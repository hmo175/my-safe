import { ipcMain, clipboard, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { VaultManager, VaultItem } from '../storage/vaultDb';
import { ExtensionBridgeServer } from '../nativeMessaging/bridgeServer';
import { WindowsHelloService } from '../biometrics/winHello';
import { BackupManager } from '../storage/backupManager';

let clipboardTimeout: NodeJS.Timeout | null = null;

export function registerIpcHandlers(
  vaultManager: VaultManager,
  mainWindow: BrowserWindow,
  bridgeServer?: ExtensionBridgeServer | null
) {
  const winHello = new WindowsHelloService(vaultManager.getBaseDir());
  // Vault status
  ipcMain.handle('vault:status', async () => {
    return {
      initialized: vaultManager.isVaultInitialized(),
      unlocked: vaultManager.isUnlocked(),
    };
  });

  // Initialize vault with master password
  ipcMain.handle('vault:initialize', async (_, password: string) => {
    const result = await vaultManager.initializeVault(password);
    try {
      if ((await winHello.isAvailable()) && !winHello.isEnabled()) {
        const key = vaultManager.getMasterKey();
        if (key) winHello.enableWindowsHello(key);
      }
    } catch (err) {
      console.warn('Failed to auto-enable biometrics on init:', err);
    }
    return result;
  });

  // Unlock with password
  ipcMain.handle('vault:unlock', async (_, password: string) => {
    const success = await vaultManager.unlockWithPassword(password);
    if (success) {
      try {
        if ((await winHello.isAvailable()) && !winHello.isEnabled()) {
          const key = vaultManager.getMasterKey();
          if (key) winHello.enableWindowsHello(key);
        }
      } catch (err) {
        console.warn('Failed to auto-enable biometrics on unlock:', err);
      }
    }
    return success;
  });

  // Unlock with recovery key
  ipcMain.handle('vault:unlockRecovery', async (_, recoveryKey: string) => {
    return vaultManager.unlockWithRecoveryKey(recoveryKey);
  });

  // Change master password
  ipcMain.handle('vault:changePassword', async (_, { oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => {
    const success = await vaultManager.changeMasterPassword(oldPassword, newPassword);
    if (success) {
      const key = vaultManager.getMasterKey();
      if (key && winHello.isEnabled()) {
        winHello.enableWindowsHello(key);
      }
    }
    return success;
  });

  // Lock vault
  ipcMain.handle('vault:lock', async () => {
    vaultManager.lock();
    return true;
  });

  // Get all decrypted vault data
  ipcMain.handle('vault:getData', async () => {
    return vaultManager.getData();
  });

  // Add item
  ipcMain.handle('vault:addItem', async (_, item: VaultItem) => {
    vaultManager.addItem(item);
    return true;
  });

  // Update item
  ipcMain.handle('vault:updateItem', async (_, { id, updated }: { id: string; updated: Partial<VaultItem> }) => {
    vaultManager.updateItem(id, updated);
    return true;
  });

  // Delete item
  ipcMain.handle('vault:deleteItem', async (_, id: string) => {
    vaultManager.deleteItem(id);
    return true;
  });

  // Save settings
  ipcMain.handle('vault:saveSettings', async (_, settings) => {
    const data = vaultManager.getData();
    data.settings = settings;
    vaultManager.saveVaultData();
    return true;
  });

  // Secure clipboard write with auto-wipe
  ipcMain.handle('clipboard:copy', async (_, { text, clearSeconds = 30 }: { text: string; clearSeconds?: number }) => {
    clipboard.writeText(text);

    if (clipboardTimeout) {
      clearTimeout(clipboardTimeout);
    }

    if (clearSeconds > 0) {
      clipboardTimeout = setTimeout(() => {
        const current = clipboard.readText();
        if (typeof current === 'string' && current === text) {
          clipboard.clear();
        }
      }, clearSeconds * 1000);
    }

    return true;
  });

  // Windows Hello / Biometrics Integration
  ipcMain.handle('biometrics:isAvailable', async () => {
    return await winHello.isAvailable();
  });

  ipcMain.handle('biometrics:isEnabled', async () => {
    return winHello.isEnabled();
  });

  ipcMain.handle('biometrics:enable', async () => {
    const masterKey = vaultManager.getMasterKey();
    if (!masterKey) return false;
    winHello.enableWindowsHello(masterKey);
    return true;
  });

  ipcMain.handle('biometrics:disable', async () => {
    winHello.disableWindowsHello();
    return true;
  });

  ipcMain.handle('biometrics:unlock', async () => {
    if (!winHello.isEnabled()) {
      return { success: false, error: 'بصمة Windows Hello غير مفعلة بعد. يرجى تسجيل الدخول أولاً بكلمة المرور الرئيسية لتفعيلها.' };
    }

    const { success, status } = await winHello.requestVerification('My Safe - تسجيل الدخول بالبصمة');
    if (!success) {
      if (status === 'Canceled') {
        return { success: false, error: 'تم إلغاء عملية المصادقة بالبصمة من قبل المستخدم.' };
      }
      return { success: false, error: `فشلت المصادقة بالبصمة (${status}). يرجى المحاولة مجدداً أو استخدام كلمة المرور الرئيسية.` };
    }

    const masterKey = winHello.getMasterKey();
    if (!masterKey) {
      return { success: false, error: 'تعذر استرجاع مفتاح الخزنة المحمي. يرجى تسجيل الدخول بكلمة المرور الرئيسية.' };
    }

    const unlocked = vaultManager.unlockWithKey(masterKey);
    return { success: unlocked };
  });

  // CSV Import (Chrome / Edge / Bitwarden)
  ipcMain.handle('vault:importCsv', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'اختر ملف CSV لاستيراد كلمات المرور منه (Chrome / Edge / Bitwarden)',
      properties: ['openFile'],
      filters: [{ name: 'ملفات CSV', extensions: ['csv'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { count: 0 };
    }

    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    const items = BackupManager.parseCsv(content);
    for (const it of items) {
      vaultManager.addItem(it);
    }
    return { count: items.length };
  });

  // Encrypted Backup Export (.mysafe)
  ipcMain.handle('vault:exportEncryptedBackup', async (_, backupPassword: string) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ وتصدير النسخة الاحتياطية المشفرة',
      defaultPath: `MySafe_Backup_${new Date().toISOString().slice(0, 10)}.mysafe`,
      filters: [{ name: 'My Safe Encrypted Backup', extensions: ['mysafe'] }],
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    const data = vaultManager.getData();
    const backupJson = BackupManager.createEncryptedBackup(data, backupPassword);
    fs.writeFileSync(result.filePath, backupJson, 'utf-8');
    return true;
  });

  // Select and upload file to secure encrypted vault
  ipcMain.handle('vault:selectAndUploadFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'اختر ملفاً لتشفيره وحفظه في الخزنة',
      properties: ['openFile'],
      filters: [
        { name: 'جميع الملفات المدعومة', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'docx', 'zip'] },
        { name: 'مستندات PDF', extensions: ['pdf'] },
        { name: 'صور', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
        { name: 'جميع الملفات', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    // Simple mime detector based on extension
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.txt') mimeType = 'text/plain';

    return vaultManager.saveEncryptedFile(fileBuffer, fileName, mimeType);
  });

  // Decrypt file into RAM and return as Base64 data URL for in-app secure preview
  ipcMain.handle('vault:getFilePreview', async (_, { storedFileName, mimeType }: { storedFileName: string; mimeType: string }) => {
    const decryptedBuffer = vaultManager.readDecryptedFile(storedFileName);
    const base64 = decryptedBuffer.toString('base64');
    return {
      dataUrl: `data:${mimeType};base64,${base64}`,
      mimeType,
      size: decryptedBuffer.length,
    };
  });

  // Securely export decrypted file to disk upon user confirmation
  ipcMain.handle('vault:exportFile', async (_, { storedFileName, defaultName }: { storedFileName: string; defaultName: string }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ وتصدير الملف',
      defaultPath: defaultName,
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    const decryptedBuffer = vaultManager.readDecryptedFile(storedFileName);
    fs.writeFileSync(result.filePath, decryptedBuffer);
    return true;
  });

  // Pairing code management for Chrome Extension
  ipcMain.handle('bridge:getPairingCode', async () => {
    return bridgeServer?.getCurrentPairingCode() || '000000';
  });

  ipcMain.handle('bridge:generateNewCode', async () => {
    return bridgeServer?.generateNewPairingCode() || '000000';
  });
}
