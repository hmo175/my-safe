// My Safe Popup Controller (Chromium & Firefox Compatible)
// Author: hmo (@hmo175)

const ext = typeof browser !== 'undefined' ? browser : chrome;

function getActiveTab() {
  return new Promise((resolve) => {
    try {
      ext.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs && tabs[0] ? tabs[0] : null);
      });
    } catch {
      resolve(null);
    }
  });
}

function renderMessage(container, text, color) {
  container.textContent = '';
  const msg = document.createElement('div');
  msg.style.cssText = `text-align: center; padding: 20px; font-size: 11px; color: ${color}; line-height: 1.6;`;
  msg.textContent = text;
  container.appendChild(msg);
}

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const pairSection = document.getElementById('pairSection');
  const connectedSection = document.getElementById('connectedSection');
  const pairCodeInput = document.getElementById('pairCodeInput');
  const pairError = document.getElementById('pairError');
  const pairBtn = document.getElementById('pairBtn');
  const currentDomainEl = document.getElementById('currentDomain');
  const accountsListEl = document.getElementById('accountsList');

  const tab = await getActiveTab();
  const currentUrl = (tab && tab.url) ? tab.url : '';
  try {
    const parsed = new URL(currentUrl);
    currentDomainEl.textContent = parsed.hostname || 'غير محدد';
  } catch {
    currentDomainEl.textContent = 'غير محدد';
  }

  ext.runtime.sendMessage({ action: 'checkStatus' }, (res) => {
    if (!res || !res.success) {
      statusDot.className = 'status-dot disconnected';
      renderMessage(
        accountsListEl,
        'برنامج سطح المكتب غير متصل. يرجى فتح My Safe على جهازك.',
        '#EF4444'
      );
      return;
    }

    if (res.paired === false) {
      statusDot.className = 'status-dot disconnected';
      pairSection.style.display = 'block';
      connectedSection.style.display = 'none';
      return;
    }

    statusDot.className = 'status-dot';
    pairSection.style.display = 'none';
    connectedSection.style.display = 'block';

    ext.runtime.sendMessage({ action: 'getMatchingAccounts', url: currentUrl }, (matchRes) => {
      if (!matchRes || !matchRes.accounts || matchRes.accounts.length === 0) {
        renderMessage(
          accountsListEl,
          'لا توجد حسابات مسجلة لهذا الرابط في الخزنة.',
          '#6B7280'
        );
        return;
      }

      accountsListEl.textContent = '';
      matchRes.accounts.forEach((acc) => {
        const item = document.createElement('div');
        item.className = 'account-item';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'account-title';
        titleDiv.textContent = acc.title || '';

        const userDiv = document.createElement('div');
        userDiv.className = 'account-user';
        userDiv.textContent = acc.username || acc.email || '••••••';

        item.appendChild(titleDiv);
        item.appendChild(userDiv);

        item.addEventListener('click', () => {
          if (tab && tab.id !== undefined) {
            ext.tabs.sendMessage(tab.id, {
              action: 'autofillFromPopup',
              accountId: acc.id,
            });
          }
          window.close();
        });
        accountsListEl.appendChild(item);
      });
    });
  });

  pairBtn.addEventListener('click', () => {
    const code = pairCodeInput.value.trim();
    pairError.style.display = 'none';

    if (code.length !== 6) {
      pairError.textContent = 'يرجى إدخال رمز الاقتران المكون من 6 أرقام.';
      pairError.style.display = 'block';
      return;
    }

    ext.runtime.sendMessage({ action: 'pair', code }, (pairRes) => {
      if (pairRes && pairRes.success) {
        window.location.reload();
      } else {
        pairError.textContent = 'كود الاقتران غير صحيح، يرجى التأكد من الكود الظاهر في تطبيق سطح المكتب.';
        pairError.style.display = 'block';
      }
    });
  });
});
