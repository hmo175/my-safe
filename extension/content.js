// My Safe Content Script - In-Field Detection & Autofill
(function () {
  const SHIELD_SVG = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="#10B981" fill-opacity="0.2" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 12L11 14L15 10" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  let activeDropdown = null;

  function closeDropdown() {
    if (activeDropdown) {
      activeDropdown.remove();
      activeDropdown = null;
    }
  }

  document.addEventListener('click', (e) => {
    if (activeDropdown && !activeDropdown.contains(e.target) && !e.target.closest('.mysafe-field-icon')) {
      closeDropdown();
    }
  });

  function attachIconToField(field) {
    if (field.dataset.mysafeAttached) return;
    field.dataset.mysafeAttached = 'true';

    const icon = document.createElement('div');
    icon.className = 'mysafe-field-icon';
    icon.innerHTML = SHIELD_SVG;
    icon.title = 'تعبئة سريعة عبر My Safe';

    document.body.appendChild(icon);

    function updateIconPosition() {
      const rect = field.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || field.offsetParent === null) {
        icon.style.display = 'none';
        return;
      }
      icon.style.display = 'flex';
      
      // Position icon inside the right/left of the input
      const isRtl = document.dir === 'rtl' || getComputedStyle(field).direction === 'rtl';
      const offset = 8;
      
      icon.style.top = `${window.scrollY + rect.top + (rect.height - 22) / 2}px`;
      if (isRtl) {
        icon.style.left = `${window.scrollX + rect.left + offset}px`;
      } else {
        icon.style.left = `${window.scrollX + rect.right - 22 - offset}px`;
      }
    }

    updateIconPosition();

    // Listen for resize/scroll
    window.addEventListener('resize', updateIconPosition);
    window.addEventListener('scroll', updateIconPosition, true);

    icon.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (activeDropdown) {
        closeDropdown();
        return;
      }

      // Query extension for credentials for current URL
      chrome.runtime.sendMessage(
        { action: 'getMatchingAccounts', url: window.location.href },
        (response) => {
          if (!response || !response.accounts || response.accounts.length === 0) {
            showEmptyNotice(field);
            return;
          }
          showDropdown(field, response.accounts);
        }
      );
    });
  }

  function showEmptyNotice(field) {
    closeDropdown();
    const notice = document.createElement('div');
    notice.className = 'mysafe-dropdown';
    notice.innerHTML = `
      <div class="mysafe-dropdown-header">
        <span>My Safe</span>
      </div>
      <div style="padding: 14px; text-align: center; font-size: 11px; color: #9CA3AF;">
        لا توجد حسابات محفوظة لهذا الموقع بعد.
      </div>
    `;
    positionDropdown(notice, field);
    document.body.appendChild(notice);
    activeDropdown = notice;
  }

  function showDropdown(field, accounts) {
    closeDropdown();

    const dropdown = document.createElement('div');
    dropdown.className = 'mysafe-dropdown';

    const header = document.createElement('div');
    header.className = 'mysafe-dropdown-header';
    header.innerHTML = `
      <span>My Safe • اختر حساباً</span>
      <span style="font-size: 10px; color: #6B7280; font-family: monospace;">${accounts.length} حساب</span>
    `;
    dropdown.appendChild(header);

    const list = document.createElement('div');
    list.className = 'mysafe-dropdown-items';

    accounts.forEach((acc) => {
      const item = document.createElement('div');
      item.className = 'mysafe-dropdown-item';
      item.innerHTML = `
        <div class="mysafe-item-avatar">${(acc.title || 'M')[0].toUpperCase()}</div>
        <div class="mysafe-item-info">
          <div class="mysafe-item-title">${acc.title}</div>
          <div class="mysafe-item-sub">${acc.username || acc.email || '••••••'}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        closeDropdown();
        // Request autofill with approval
        chrome.runtime.sendMessage(
          { action: 'requestAutofill', accountId: acc.id, url: window.location.href },
          (res) => {
            if (res && res.success && res.credentials) {
              fillCredentials(res.credentials);
            }
          }
        );
      });

      list.appendChild(item);
    });

    dropdown.appendChild(list);
    positionDropdown(dropdown, field);
    document.body.appendChild(dropdown);
    activeDropdown = dropdown;
  }

  function positionDropdown(dropdown, field) {
    const rect = field.getBoundingClientRect();
    dropdown.style.top = `${window.scrollY + rect.bottom + 6}px`;
    dropdown.style.left = `${window.scrollX + rect.left}px`;
  }

  function fillCredentials(credentials) {
    const forms = document.forms;
    const inputs = Array.from(document.querySelectorAll('input'));

    // Find password input
    const passwordInput = inputs.find((i) => i.type === 'password' && isVisible(i));
    
    // Find username or email input
    const userInput = inputs.find(
      (i) =>
        (i.type === 'email' || i.type === 'text' || i.name?.toLowerCase().includes('user') || i.name?.toLowerCase().includes('email')) &&
        i !== passwordInput &&
        isVisible(i)
    );

    if (userInput && (credentials.username || credentials.email)) {
      setNativeValue(userInput, credentials.username || credentials.email);
    }

    if (passwordInput && credentials.password) {
      setNativeValue(passwordInput, credentials.password);
    }
  }

  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function scanInputs() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach((passInput) => {
      attachIconToField(passInput);
    });
  }

  // Scan on load and DOM changes
  scanInputs();
  const observer = new MutationObserver(scanInputs);
  observer.observe(document.body, { childList: true, subtree: true });

  // Auto-Save prompt when user submits a login/registration form
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form || !form.querySelectorAll) return;

    const passwordInput = form.querySelector('input[type="password"]');
    if (!passwordInput || !passwordInput.value) return;

    const usernameInput = form.querySelector('input[type="email"], input[type="text"], input[name*="user"], input[name*="email"]');
    const username = usernameInput ? usernameInput.value : '';
    const password = passwordInput.value;

    if (password.length >= 4) {
      showAutoSaveBanner({
        username,
        password,
        url: window.location.href,
        domain: window.location.hostname,
        title: document.title || window.location.hostname,
      });
    }
  }, true);

  function showAutoSaveBanner(accountData) {
    if (document.getElementById('mysafe-autosave-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'mysafe-autosave-banner';
    banner.className = 'mysafe-autosave-banner';
    banner.innerHTML = `
      <div class="mysafe-autosave-header">
        <span class="mysafe-autosave-title">My Safe • حفظ حساب جديد؟</span>
        <button class="mysafe-autosave-close" id="mysafe-close-banner">&times;</button>
      </div>
      <div class="mysafe-autosave-body">
        هل تريد حفظ بيانات الدخول لموقع <b>${accountData.domain}</b> في خزنـتك؟
        ${accountData.username ? `<div class="mysafe-autosave-user">${accountData.username}</div>` : ''}
      </div>
      <div class="mysafe-autosave-actions">
        <button class="mysafe-btn-save" id="mysafe-btn-save-act">حفظ في الخزنة</button>
        <button class="mysafe-btn-ignore" id="mysafe-btn-ignore-act">ليس الآن</button>
      </div>
    `;

    document.body.appendChild(banner);

    const closeBtn = document.getElementById('mysafe-close-banner');
    const ignoreBtn = document.getElementById('mysafe-btn-ignore-act');
    const saveBtn = document.getElementById('mysafe-btn-save-act');

    if (closeBtn) closeBtn.onclick = () => banner.remove();
    if (ignoreBtn) ignoreBtn.onclick = () => banner.remove();
    if (saveBtn) {
      saveBtn.onclick = () => {
        chrome.runtime.sendMessage({ action: 'autoSaveAccount', account: accountData }, (res) => {
          if (res && res.success) {
            banner.innerHTML = '<div style="color: #10B981; font-weight: bold; text-align: center; padding: 10px;">✓ تم الحفظ بنجاح في My Safe!</div>';
            setTimeout(() => banner.remove(), 2500);
          } else {
            banner.remove();
          }
        });
      };
    }
  }
})();
