// My Safe Content Script - Cross-Browser In-Field Detection & Autofill
// Author: Eng. Mohammed Al-Gunaid (@hmo175)
(function () {
  if (window.__mySafeContentLoaded) return;
  window.__mySafeContentLoaded = true;

  const ext = typeof browser !== 'undefined' ? browser : chrome;
  let activeDropdown = null;

  function createShieldSvg() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');

    const shieldPath = document.createElementNS(svgNS, 'path');
    shieldPath.setAttribute('d', 'M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z');
    shieldPath.setAttribute('fill', '#10B981');
    shieldPath.setAttribute('fill-opacity', '0.2');
    shieldPath.setAttribute('stroke', '#10B981');
    shieldPath.setAttribute('stroke-width', '2');
    shieldPath.setAttribute('stroke-linecap', 'round');
    shieldPath.setAttribute('stroke-linejoin', 'round');

    const checkPath = document.createElementNS(svgNS, 'path');
    checkPath.setAttribute('d', 'M9 12L11 14L15 10');
    checkPath.setAttribute('stroke', '#10B981');
    checkPath.setAttribute('stroke-width', '2');
    checkPath.setAttribute('stroke-linecap', 'round');
    checkPath.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(shieldPath);
    svg.appendChild(checkPath);
    return svg;
  }

  function closeDropdown() {
    if (activeDropdown) {
      activeDropdown.remove();
      activeDropdown = null;
    }
  }

  document.addEventListener('click', (e) => {
    if (
      activeDropdown &&
      !activeDropdown.contains(e.target) &&
      (!e.target.closest || !e.target.closest('.mysafe-field-icon'))
    ) {
      closeDropdown();
    }
  });

  function attachIconToField(field) {
    if (field.dataset.mysafeAttached || !document.body) return;
    field.dataset.mysafeAttached = 'true';

    const icon = document.createElement('div');
    icon.className = 'mysafe-field-icon';
    icon.appendChild(createShieldSvg());
    icon.title = 'تعبئة سريعة عبر My Safe';

    document.body.appendChild(icon);

    function updateIconPosition() {
      if (!document.body.contains(field)) {
        icon.remove();
        window.removeEventListener('resize', updateIconPosition);
        window.removeEventListener('scroll', updateIconPosition, true);
        return;
      }

      const rect = field.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || field.offsetParent === null) {
        icon.style.display = 'none';
        return;
      }
      icon.style.display = 'flex';

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
    window.addEventListener('resize', updateIconPosition);
    window.addEventListener('scroll', updateIconPosition, true);

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (activeDropdown) {
        closeDropdown();
        return;
      }

      ext.runtime.sendMessage(
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

    const header = document.createElement('div');
    header.className = 'mysafe-dropdown-header';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'My Safe';
    header.appendChild(titleSpan);

    const bodyDiv = document.createElement('div');
    bodyDiv.style.cssText = 'padding: 14px; text-align: center; font-size: 11px; color: #9CA3AF;';
    bodyDiv.textContent = 'لا توجد حسابات محفوظة لهذا الموقع بعد.';

    notice.appendChild(header);
    notice.appendChild(bodyDiv);
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

    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'My Safe • اختر حساباً';

    const countSpan = document.createElement('span');
    countSpan.style.cssText = 'font-size: 10px; color: #6B7280; font-family: monospace;';
    countSpan.textContent = `${accounts.length} حساب`;

    header.appendChild(headerTitle);
    header.appendChild(countSpan);
    dropdown.appendChild(header);

    const list = document.createElement('div');
    list.className = 'mysafe-dropdown-items';

    accounts.forEach((acc) => {
      const item = document.createElement('div');
      item.className = 'mysafe-dropdown-item';

      const avatar = document.createElement('div');
      avatar.className = 'mysafe-item-avatar';
      avatar.textContent = (acc.title || 'M')[0].toUpperCase();

      const info = document.createElement('div');
      info.className = 'mysafe-item-info';

      const itemTitle = document.createElement('div');
      itemTitle.className = 'mysafe-item-title';
      itemTitle.textContent = acc.title || '';

      const itemSub = document.createElement('div');
      itemSub.className = 'mysafe-item-sub';
      itemSub.textContent = acc.username || acc.email || '••••••';

      info.appendChild(itemTitle);
      info.appendChild(itemSub);
      item.appendChild(avatar);
      item.appendChild(info);

      item.addEventListener('click', () => {
        closeDropdown();
        ext.runtime.sendMessage(
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
    const inputs = Array.from(document.querySelectorAll('input'));
    const passwordInput = inputs.find((i) => i.type === 'password' && isVisible(i));

    const userInput = inputs.find(
      (i) =>
        (i.type === 'email' ||
          i.type === 'text' ||
          (i.name && i.name.toLowerCase().includes('user')) ||
          (i.name && i.name.toLowerCase().includes('email'))) &&
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
    if (!document.body) return;
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach((passInput) => {
      attachIconToField(passInput);
    });
  }

  // Listen to autofill requests triggered from extension toolbar popup
  ext.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request && request.action === 'autofillFromPopup' && request.accountId) {
      ext.runtime.sendMessage(
        { action: 'requestAutofill', accountId: request.accountId, url: window.location.href },
        (res) => {
          if (res && res.success && res.credentials) {
            fillCredentials(res.credentials);
          }
          sendResponse({ done: true });
        }
      );
      return true;
    }
    return false;
  });

  scanInputs();
  if (document.body) {
    const observer = new MutationObserver(scanInputs);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Auto-Save prompt when user submits a login/registration form
  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target;
      if (!form || !form.querySelectorAll) return;

      const passwordInput = form.querySelector('input[type="password"]');
      if (!passwordInput || !passwordInput.value) return;

      const usernameInput = form.querySelector(
        'input[type="email"], input[type="text"], input[name*="user"], input[name*="email"]'
      );
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
    },
    true
  );

  function showAutoSaveBanner(accountData) {
    if (document.getElementById('mysafe-autosave-banner') || !document.body) return;

    const banner = document.createElement('div');
    banner.id = 'mysafe-autosave-banner';
    banner.className = 'mysafe-autosave-banner';

    const header = document.createElement('div');
    header.className = 'mysafe-autosave-header';

    const title = document.createElement('span');
    title.className = 'mysafe-autosave-title';
    title.textContent = 'My Safe • حفظ حساب جديد؟';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mysafe-autosave-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => banner.remove();

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'mysafe-autosave-body';
    body.appendChild(document.createTextNode('هل تريد حفظ بيانات الدخول لموقع '));
    const domainB = document.createElement('b');
    domainB.textContent = accountData.domain || '';
    body.appendChild(domainB);
    body.appendChild(document.createTextNode(' في خزنتك؟'));

    if (accountData.username) {
      const userDiv = document.createElement('div');
      userDiv.className = 'mysafe-autosave-user';
      userDiv.textContent = accountData.username;
      body.appendChild(userDiv);
    }

    const actions = document.createElement('div');
    actions.className = 'mysafe-autosave-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'mysafe-btn-save';
    saveBtn.type = 'button';
    saveBtn.textContent = 'حفظ في الخزنة';

    const ignoreBtn = document.createElement('button');
    ignoreBtn.className = 'mysafe-btn-ignore';
    ignoreBtn.type = 'button';
    ignoreBtn.textContent = 'ليس الآن';
    ignoreBtn.onclick = () => banner.remove();

    saveBtn.onclick = () => {
      ext.runtime.sendMessage({ action: 'autoSaveAccount', account: accountData }, (res) => {
        if (res && res.success) {
          banner.textContent = '';
          const okDiv = document.createElement('div');
          okDiv.style.cssText = 'color: #10B981; font-weight: bold; text-align: center; padding: 10px;';
          okDiv.textContent = '✓ تم الحفظ بنجاح في My Safe!';
          banner.appendChild(okDiv);
          setTimeout(() => banner.remove(), 2500);
        } else {
          banner.remove();
        }
      });
    };

    actions.appendChild(saveBtn);
    actions.appendChild(ignoreBtn);

    banner.appendChild(header);
    banner.appendChild(body);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }
})();
