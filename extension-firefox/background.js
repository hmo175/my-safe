// My Safe Extension - Universal Background Worker / Script (Chromium & Firefox)
// Author: hmo (@hmo175)

const ext = typeof browser !== 'undefined' ? browser : chrome;
const BRIDGE_URL = 'http://127.0.0.1:48521';

function getStoredToken() {
  return new Promise((resolve) => {
    try {
      ext.storage.local.get(['mysafe_token'], (res) => {
        resolve((res && res.mysafe_token) ? res.mysafe_token : '');
      });
    } catch {
      resolve('');
    }
  });
}

function setStoredToken(token) {
  return new Promise((resolve) => {
    try {
      ext.storage.local.set({ mysafe_token: token }, () => resolve(true));
    } catch {
      resolve(false);
    }
  });
}

// Helper to query local My Safe desktop bridge
async function queryDesktop(endpoint, body = {}) {
  try {
    const token = await getStoredToken();
    const res = await fetch(`${BRIDGE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MySafe-Token': token,
      },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return {
      success: false,
      error: 'تعذر الاتصال ببرنامج My Safe لسطح المكتب. تأكد أن البرنامج يعمل.',
    };
  }
}

// Extract base domain from URL (e.g. accounts.google.com -> google.com)
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return parsed.hostname;
  } catch {
    return '';
  }
}

ext.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (!request || !request.action) return false;

  if (request.action === 'getMatchingAccounts') {
    const domain = extractDomain(request.url);
    queryDesktop('/api/matches', { url: request.url, domain }).then(sendResponse);
    return true;
  }

  if (request.action === 'requestAutofill') {
    queryDesktop('/api/autofill', {
      accountId: request.accountId,
      url: request.url,
    }).then(sendResponse);
    return true;
  }

  if (request.action === 'checkStatus') {
    queryDesktop('/api/status').then(sendResponse);
    return true;
  }

  if (request.action === 'pair') {
    queryDesktop('/api/pair', { code: request.code }).then(async (res) => {
      if (res && res.success && res.token) {
        await setStoredToken(res.token);
      }
      sendResponse(res);
    });
    return true;
  }

  if (request.action === 'autoSaveAccount') {
    queryDesktop('/api/saveAccount', request.account).then(sendResponse);
    return true;
  }

  return false;
});
