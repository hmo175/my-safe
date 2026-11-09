// My Safe Extension Background Service Worker
const BRIDGE_URL = 'http://127.0.0.1:48521';
let pairedToken = null;

// Load saved pairing token
chrome.storage.local.get(['mysafe_token'], (res) => {
  if (res.mysafe_token) {
    pairedToken = res.mysafe_token;
  }
});

// Helper to query desktop app
async function queryDesktop(endpoint, body = {}) {
  try {
    const res = await fetch(`${BRIDGE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MySafe-Token': pairedToken || '',
      },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'تعذر الاتصال ببرنامج My Safe لسطح المكتب. تأكد أن البرنامج مفتوح.' };
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMatchingAccounts') {
    const domain = extractDomain(request.url);
    queryDesktop('/api/matches', { url: request.url, domain }).then((res) => {
      sendResponse(res);
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'requestAutofill') {
    queryDesktop('/api/autofill', { accountId: request.accountId, url: request.url }).then((res) => {
      sendResponse(res);
    });
    return true;
  }

  if (request.action === 'checkStatus') {
    queryDesktop('/api/status').then((res) => {
      sendResponse(res);
    });
    return true;
  }

  if (request.action === 'pair') {
    queryDesktop('/api/pair', { code: request.code }).then((res) => {
      if (res && res.success && res.token) {
        pairedToken = res.token;
        chrome.storage.local.set({ mysafe_token: res.token });
      }
      sendResponse(res);
    });
    return true;
  }

  if (request.action === 'autoSaveAccount') {
    queryDesktop('/api/saveAccount', request.account).then((res) => {
      sendResponse(res);
    });
    return true;
  }
});
