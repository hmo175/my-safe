document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const pairSection = document.getElementById('pairSection');
  const connectedSection = document.getElementById('connectedSection');
  const pairCodeInput = document.getElementById('pairCodeInput');
  const pairBtn = document.getElementById('pairBtn');
  const currentDomainEl = document.getElementById('currentDomain');
  const accountsListEl = document.getElementById('accountsList');

  // Query active tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let currentUrl = tab?.url || '';
  let domain = '';
  try {
    const parsed = new URL(currentUrl);
    domain = parsed.hostname;
    currentDomainEl.textContent = domain;
  } catch {
    currentDomainEl.textContent = 'غير محدد';
  }

  // Check connection status
  chrome.runtime.sendMessage({ action: 'checkStatus' }, (res) => {
    if (!res || !res.success) {
      statusDot.className = 'status-dot disconnected';
      accountsListEl.innerHTML = `
        <div style="text-align: center; padding: 20px; font-size: 11px; color: #EF4444;">
          برنامج سطح المكتب غير متصل.<br>يرجى فتح My Safe على جهازك.
        </div>
      `;
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

    // Fetch accounts for current tab
    chrome.runtime.sendMessage({ action: 'getMatchingAccounts', url: currentUrl }, (matchRes) => {
      if (!matchRes || !matchRes.accounts || matchRes.accounts.length === 0) {
        accountsListEl.innerHTML = `
          <div style="text-align: center; padding: 20px; font-size: 11px; color: #6B7280;">
            لا توجد حسابات مسجلة لهذا الرابط في الخزنة.
          </div>
        `;
        return;
      }

      accountsListEl.innerHTML = '';
      matchRes.accounts.forEach((acc) => {
        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `
          <div class="account-title">${acc.title}</div>
          <div class="account-user">${acc.username || acc.email || '••••••'}</div>
        `;
        item.addEventListener('click', () => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'autofillFromPopup',
            accountId: acc.id,
          });
          window.close();
        });
        accountsListEl.appendChild(item);
      });
    });
  });

  pairBtn.addEventListener('click', () => {
    const code = pairCodeInput.value.trim();
    if (code.length === 6) {
      chrome.runtime.sendMessage({ action: 'pair', code }, (pairRes) => {
        if (pairRes && pairRes.success) {
          window.location.reload();
        } else {
          alert('كود الاقتران غير صحيح، يرجى التأكد من الكود الظاهر في تطبيق سطح المكتب.');
        }
      });
    }
  });
});
