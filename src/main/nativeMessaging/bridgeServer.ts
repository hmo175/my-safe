import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { dialog, BrowserWindow } from 'electron';
import { VaultManager } from '../storage/vaultDb';

export class ExtensionBridgeServer {
  private server: http.Server | null = null;
  private vaultManager: VaultManager;
  private getMainWindow: () => BrowserWindow | null;
  private currentPairingCode: string = '';
  private validPairingToken: string | null = null;
  private port = 48521;

  constructor(vaultManager: VaultManager, getMainWindow: () => BrowserWindow | null) {
    this.vaultManager = vaultManager;
    this.getMainWindow = getMainWindow;
    this.generateNewPairingCode();
    this.loadStoredPairingToken();
  }

  private loadStoredPairingToken(): void {
    try {
      const configPath = path.join(this.vaultManager.getBaseDir(), 'bridge_pairing.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && data.token) {
          this.validPairingToken = data.token;
          console.log('[Bridge] Loaded persistent pairing token successfully.');
        }
      }
    } catch (err) {
      console.warn('[Bridge] Failed to load stored pairing token:', err);
    }
  }

  private savePairingToken(token: string): void {
    try {
      this.validPairingToken = token;
      const configPath = path.join(this.vaultManager.getBaseDir(), 'bridge_pairing.json');
      fs.writeFileSync(configPath, JSON.stringify({ token, createdAt: new Date().toISOString() }), 'utf-8');
      console.log('[Bridge] Persistent pairing token saved successfully.');
    } catch (err) {
      console.warn('[Bridge] Failed to save pairing token:', err);
    }
  }

  public generateNewPairingCode(): string {
    // Generate 6-digit numeric pairing code
    this.currentPairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    return this.currentPairingCode;
  }

  public getCurrentPairingCode(): string {
    return this.currentPairingCode;
  }

  public start() {
    this.server = http.createServer((req, res) => {
      // CORS headers for Chrome Extension
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-MySafe-Token');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        let payload: any = {};
        try {
          if (body) payload = JSON.parse(body);
        } catch {}

        const token = req.headers['x-mysafe-token'];

        // 1. Status Check
        if (req.url === '/api/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              unlocked: this.vaultManager.isUnlocked(),
              paired: this.validPairingToken !== null && token === this.validPairingToken,
            })
          );
          return;
        }

        // 2. Pairing Request
        if (req.url === '/api/pair') {
          if (payload.code && payload.code === this.currentPairingCode) {
            const newToken = crypto.randomBytes(32).toString('hex');
            this.savePairingToken(newToken);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, token: this.validPairingToken }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid pairing code' }));
          }
          return;
        }

        // Verification check for authenticated endpoints
        const isAuthorized = this.validPairingToken && token === this.validPairingToken;
        if (!isAuthorized) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized. Pairing required.' }));
          return;
        }

        // If vault is locked, return locked status
        if (!this.vaultManager.isUnlocked()) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'الخزنة مقفلة. يرجى فتح التطبيق أولاً.' }));
          return;
        }

        // 3. Matching accounts for URL
        if (req.url === '/api/matches') {
          const items = this.vaultManager.getData().items || [];
          const domain = (payload.domain || '').toLowerCase();
          const targetUrl = (payload.url || '').toLowerCase();

          const matches = items
            .filter((it: any) => {
              if (it.type !== 'login') return false;
              if (!it.url) return false;
              const itemUrl = it.url.toLowerCase();
              return itemUrl.includes(domain) || (domain && domain.includes(itemUrl)) || targetUrl.includes(itemUrl);
            })
            .map((it: any) => ({
              id: it.id,
              title: it.title,
              username: it.username,
              email: it.email,
              url: it.url,
            }));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, accounts: matches }));
          return;
        }

        // 4. Request Autofill (Requires user confirmation dialog on desktop)
        if (req.url === '/api/autofill') {
          const items = this.vaultManager.getData().items || [];
          const account: any = items.find((it: any) => it.id === payload.accountId);

          if (!account) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'الحساب غير موجود' }));
            return;
          }

          const win = this.getMainWindow();
          if (win) {
            win.show();
            win.focus();

            // Explicit confirmation prompt on desktop before releasing credentials
            const choice = dialog.showMessageBoxSync(win, {
              type: 'question',
              buttons: ['موافق وتعبئة تلقائية', 'إلغاء ورفض'],
              defaultId: 0,
              cancelId: 1,
              title: 'تأكيد تعبئة بيانات الدخول',
              message: `هل توافق على تعبئة كلمة المرور لحساب:\n"${account.title}" (${account.username || account.email})؟`,
              detail: `الرابط المطلوب: ${payload.url || 'موقع ويب'}`,
            });

            if (choice === 0) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  credentials: {
                    username: account.username || account.email || '',
                    password: account.password || '',
                  },
                })
              );
              return;
            }
          }

          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'تم رفض طلب التعبئة من قبل المستخدم.' }));
          return;
        }

        // 5. Auto-Save new login from browser
        if (req.url === '/api/saveAccount') {
          if (!payload.username && !payload.password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Missing username or password' }));
            return;
          }

          const newItem: any = {
            id: crypto.randomUUID(),
            type: 'login',
            title: payload.title || payload.domain || 'موقع ويب',
            url: payload.url || '',
            username: payload.username || '',
            email: payload.email || '',
            password: payload.password || '',
            notes: payload.notes || 'تم الحفظ تلقائياً من المتصفح',
            folder: 'Personal',
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          this.vaultManager.addItem(newItem);

          // Notify window of data update
          const win = this.getMainWindow();
          if (win) {
            win.webContents.send('vault:dataUpdated');
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, item: newItem }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });
    });

    this.server.listen(this.port, '127.0.0.1', () => {
      console.log(`[Bridge] My Safe Extension Bridge running on http://127.0.0.1:${this.port}`);
    });
  }

  public stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
