# Privacy Policy — My Safe Browser Extension & Desktop Vault

**Effective Date:** 2026-11-11  
**Developer:** hmo (`@hmo175`)  
**Repository:** https://github.com/hmo175/my-safe  

---

## 1. Zero-Knowledge & Local-Only Architecture

**My Safe** (both the Desktop Application and the Browser Extension) is built on a strict **100% offline, zero-knowledge architecture**:

- **No External Servers / No Cloud Sync:** We do **not** operate remote servers, analytics services, telemetry endpoints, or crash-reporting servers.
- **No Data Collection:** We do **not** collect, read, transmit, sell, or share any personal information, browsing history, credentials, IP addresses, or usage metrics.
- **Local Loopback Bridge Only:** The browser extension communicates strictly with the local My Safe desktop application running on your own computer via `http://127.0.0.1:48521`, authenticated by a locally generated one-time pairing token stored in local extension storage.

---

## 2. Permissions Justification

To provide autofill and password saving functionality securely, the extension requests only the minimum required browser permissions:

| Permission | Purpose |
| :--- | :--- |
| `activeTab` | Reads the active tab's URL/hostname only when you open the extension popup so it can display matching accounts from your local vault. |
| `storage` | Stores only the local pairing token (`mysafe_token`) inside the browser's `storage.local` so your extension stays paired with your desktop app. No passwords are stored in browser storage. |
| `http://127.0.0.1/*` (Host Permission) | Allows the extension's background script to communicate exclusively with the My Safe desktop bridge on your local machine (`127.0.0.1:48521`). |
| Content Scripts (`http://*/*`, `https://*/*`) | Detects password input fields on web pages you visit so you can trigger autofill or save new credentials upon form submission — strictly on your explicit click/action. |

---

## 3. Data Security

All vault entries and encrypted files remain inside your Windows user profile encrypted with **Argon2id + AES-256-GCM**. Autofill responses from the desktop app require user pairing and biometric/approval confirmation where configured.

---

## 4. سياسة الخصوصية (بالعربية)

تم تصميم تطبيق وإضافة **My Safe** وفق مبدأ **انعدام المعرفة (Zero-Knowledge)** والعمل المحلي الكامل بنسبة 100%:

- لا يتم إرسال أو جمع أي بيانات شخصية أو كلمات مرور أو سجل تصفح إلى أي خوادم خارجية على الإنترنت.
- تتواصل إضافة المتصفح حصرياً مع برنامج سطح المكتب على جهازك الشخصي عبر العنوان المحلي (`http://127.0.0.1:48521`) وباستخدام رمز اقتران محلي مشفر.
- جميع الصلاحيات المطلوبة مقتصرة فقط على تعبئة وحفظ الحقول عند تفاعلك المباشر معها.

---

## 5. Contact

For questions or security disclosures, contact the developer via GitHub:  
**hmo** — https://github.com/hmo175
