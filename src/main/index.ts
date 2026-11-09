import { app, BrowserWindow, powerMonitor, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { VaultManager } from './storage/vaultDb';
import { registerIpcHandlers } from './ipc/handlers';
import { ExtensionBridgeServer } from './nativeMessaging/bridgeServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Emerald shield icon base64 for System Tray
const TRAY_ICON_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAXpJREFUOE+tk7tLw1AUxr+btEnV4KCD4ODm4CCIdXBw6uDgIDiog4ODv4EgCA5u/QOiuDoIOjmI4OIkuIgI4lQQ1NfW5pLzSpukbdKq4HDvueee33fP4Z5zBMVScBwHOp1OsVgsrlKp1Hqe9wEg4jnvA+AAMBMRjUYj0e1227Ztr7P7v7muu2yavFwu1/v9fs3zvD0AYwA5AGq73V7I5/PNsVisrWnarz9ZluXWajVL1/XhSCQSTiQSq1KpVEuSpHq/368DOAMwY38BwGAYxsbX4FsgEBgGg8EvhmFMm6bpxONxf09+q6XjOI5m23bYMIyN179V1/Vhy7IO/1I8f81EImGlqurM8/wtpZRWKpWZcDh84Pv+DkmSOq7r6qqqrv4t/0Aul9vK5/NruVxuDkAdwAiAkx8/39h+AHABiAEQALzY9tVjJ5PJqUQikdf1n6NfWZa7mqYtA3gFcPoj/B2fADQBtAE0AHz3j/ELeAFg4rW/rYg7LwAAAABJRU5ErkJggg==';

process.on('uncaughtException', (err) => {
  console.error('[Main Error] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Main Error] Unhandled Rejection:', reason);
});

let mainWindow: BrowserWindow | null = null;
let vaultManager: VaultManager | null = null;
let bridgeServer: ExtensionBridgeServer | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, 'tray.png');
  console.log('[Main] Loading Tray icon from:', iconPath);
  const image = nativeImage.createFromPath(iconPath);
  tray = new Tray(image);
  tray.setToolTip('My Safe - الخزنة الرقمية (يعمل في الخلفية)');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'فتح الخزنة',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'قفل الخزنة الآن',
      click: () => {
        if (vaultManager) {
          vaultManager.lock();
          mainWindow?.webContents.send('vault:autoLocked');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'خروج نهائي من التطبيق',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  tray.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function createWindow() {
  console.log('[Main] Initializing VaultManager...');
  vaultManager = new VaultManager();

  console.log('[Main] Initializing ExtensionBridgeServer...');
  bridgeServer = new ExtensionBridgeServer(vaultManager, () => mainWindow);
  bridgeServer.start();

  console.log('[Main] Creating BrowserWindow...');
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    show: true,
    icon: path.join(__dirname, 'tray.png'),
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0B0F17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Register IPC handlers
  registerIpcHandlers(vaultManager, mainWindow, bridgeServer);

  const htmlPath = path.join(__dirname, '../dist/index.html');
  console.log('[Main] Loading UI from:', htmlPath);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(htmlPath).then(() => {
      console.log('[Main] UI loaded successfully!');
      mainWindow?.show();
      mainWindow?.focus();
    }).catch(err => {
      console.error('[Main] Failed to load HTML:', err);
    });
  }

  // Auto-lock when workstation is locked (Win + L) or system suspends/sleeps
  powerMonitor.on('lock-screen', () => {
    if (vaultManager) {
      vaultManager.lock();
      mainWindow?.webContents.send('vault:autoLocked');
    }
  });

  powerMonitor.on('suspend', () => {
    if (vaultManager) {
      vaultManager.lock();
      mainWindow?.webContents.send('vault:autoLocked');
    }
  });

  // Minimize to System Tray instead of quitting when close (X) is clicked
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create or restore system tray icon
  createTray();
}

app.whenReady().then(createWindow);

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // Prevent quitting so background bridge keeps running for browser autofill
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
});
