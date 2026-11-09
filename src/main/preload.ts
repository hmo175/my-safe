import { contextBridge, ipcRenderer } from 'electron';

export interface MySafeAPI {
  checkStatus: () => Promise<{ initialized: boolean; unlocked: boolean }>;
  initializeVault: (password: string) => Promise<{ recoveryKey: string }>;
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  unlock: (password: string) => Promise<boolean>;
  unlockRecovery: (recoveryKey: string) => Promise<boolean>;
  lock: () => Promise<boolean>;
  getData: () => Promise<any>;
  addItem: (item: any) => Promise<boolean>;
  updateItem: (id: string, updated: any) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  saveSettings: (settings: any) => Promise<boolean>;
  copyToClipboard: (text: string, clearSeconds?: number) => Promise<boolean>;
  isBiometricsAvailable: () => Promise<boolean>;
  isBiometricsEnabled: () => Promise<boolean>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<boolean>;
  unlockBiometrics: () => Promise<{ success: boolean; error?: string }>;
  importCsv: () => Promise<{ count: number }>;
  exportEncryptedBackup: (backupPassword: string) => Promise<boolean>;
  selectAndUploadFile: () => Promise<any>;
  getFilePreview: (storedFileName: string, mimeType: string) => Promise<{ dataUrl: string; mimeType: string; size: number }>;
  exportFile: (storedFileName: string, defaultName: string) => Promise<boolean>;
  getPairingCode: () => Promise<string>;
  generateNewPairingCode: () => Promise<string>;
}

const api: MySafeAPI = {
  checkStatus: () => ipcRenderer.invoke('vault:status'),
  initializeVault: (password: string) => ipcRenderer.invoke('vault:initialize', password),
  changeMasterPassword: (oldPassword: string, newPassword: string) => ipcRenderer.invoke('vault:changePassword', { oldPassword, newPassword }),
  unlock: (password: string) => ipcRenderer.invoke('vault:unlock', password),
  unlockRecovery: (recoveryKey: string) => ipcRenderer.invoke('vault:unlockRecovery', recoveryKey),
  lock: () => ipcRenderer.invoke('vault:lock'),
  getData: () => ipcRenderer.invoke('vault:getData'),
  addItem: (item: any) => ipcRenderer.invoke('vault:addItem', item),
  updateItem: (id: string, updated: any) => ipcRenderer.invoke('vault:updateItem', { id, updated }),
  deleteItem: (id: string) => ipcRenderer.invoke('vault:deleteItem', id),
  saveSettings: (settings: any) => ipcRenderer.invoke('vault:saveSettings', settings),
  copyToClipboard: (text: string, clearSeconds?: number) => ipcRenderer.invoke('clipboard:copy', { text, clearSeconds }),
  isBiometricsAvailable: () => ipcRenderer.invoke('biometrics:isAvailable'),
  isBiometricsEnabled: () => ipcRenderer.invoke('biometrics:isEnabled'),
  enableBiometrics: () => ipcRenderer.invoke('biometrics:enable'),
  disableBiometrics: () => ipcRenderer.invoke('biometrics:disable'),
  unlockBiometrics: () => ipcRenderer.invoke('biometrics:unlock'),
  importCsv: () => ipcRenderer.invoke('vault:importCsv'),
  exportEncryptedBackup: (backupPassword: string) => ipcRenderer.invoke('vault:exportEncryptedBackup', backupPassword),
  selectAndUploadFile: () => ipcRenderer.invoke('vault:selectAndUploadFile'),
  getFilePreview: (storedFileName: string, mimeType: string) => ipcRenderer.invoke('vault:getFilePreview', { storedFileName, mimeType }),
  exportFile: (storedFileName: string, defaultName: string) => ipcRenderer.invoke('vault:exportFile', { storedFileName, defaultName }),
  getPairingCode: () => ipcRenderer.invoke('bridge:getPairingCode'),
  generateNewPairingCode: () => ipcRenderer.invoke('bridge:generateNewCode'),
};

contextBridge.exposeInMainWorld('mySafe', api);

declare global {
  interface Window {
    mySafe: MySafeAPI;
  }
}
