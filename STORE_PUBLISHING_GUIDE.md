# دليل نشر إضافة My Safe على متاجر جميع المتصفحات 🌍🚀

**إعداد المطور:** hmo (`@hmo175`)  
**الملفات الجاهزة للرفع في مجلد `release/`:**
- **للمتصفحات المبنية على Chromium (Chrome, Edge, Brave, Opera, Vivaldi):**  
  `release/MySafe-Extension-Chromium-v1.0.0.zip`
- **لمتصفح Mozilla Firefox:**  
  `release/MySafe-Extension-Firefox-v1.0.0.zip`

---

## 📋 معلومات مشتركة ستحتاجها عند الرفع في أي متجر:

1. **الاسم (Name):** `My Safe - Digital Password Vault`
2. **الوصف المختصر (Summary):**  
   `Zero-knowledge autofill companion for My Safe Desktop Vault. Securely fill and save passwords locally via encrypted loopback bridge.`
3. **الفئة (Category):** Productivity / Security & Privacy
4. **رابط سياسة الخصوصية (Privacy Policy URL):**  
   بعد رفع المشروع على حسابك في GitHub، استخدم الرابط المباشر لملف `PRIVACY_POLICY.md`:  
   `https://github.com/hmo175/my-safe/blob/main/PRIVACY_POLICY.md`
5. **تبرير الصلاحيات (Permission Justifications - انسخها للمراجعين):**
   - **Single Purpose:** *Autofill and securely save login credentials by communicating exclusively with the user's local My Safe desktop vault over `127.0.0.1`.*
   - **`activeTab` Justification:** *Used when opening the toolbar popup to read the active tab's hostname and display matching local vault accounts.*
   - **`storage` Justification:** *Stores only the local pairing token (`mysafe_token`) required to authenticate requests to the local desktop bridge.*
   - **Host Permission (`http://127.0.0.1/*`) & Content Scripts:** *`http://127.0.0.1/*` allows connecting exclusively to the local desktop companion server running on port 48521. Content scripts detect login password fields so the user can autofill or save credentials locally.*
   - **Remote Code:** *No — all code is bundled inside the extension package.*

---

## 1️⃣ Google Chrome Web Store (ويستفيد منه Chrome + Brave + Vivaldi + Arc)
1. توجه إلى لوحة مطوري كروم: https://chrome.google.com/webstore/devconsole
2. سجّل حساب مطور (رسوم تسجيل لمرة واحدة في العمر بقيمة **$5** من جوجل).
3. اضغط **New Item** ثم ارفع ملف: `release/MySafe-Extension-Chromium-v1.0.0.zip`.
4. أضف أيقونة المتجر `extension/icons/icon128.png` ولقطة شاشة لإضافة المتصفح + التطبيق.
5. في تبويب **Privacy practices** أجب بأن الإضافة لا تستخدم كوداً عن بُعد (No remote code) وضع رابط `PRIVACY_POLICY.md` وتبريرات الصلاحيات أعلاه.
6. اضغط **Submit for review** (تستغرق المراجعة عادة 1–3 أيام).

---

## 2️⃣ Microsoft Edge Add-ons (مجاناً 100%)
1. توجه إلى مركز شركاء مايكروسوفت: https://partner.microsoft.com/dashboard/microsoftedge
2. سجّل حساب مطور Microsoft Edge (**مجاني تماماً**).
3. اضغط **Create new extension** وارفع نفس الملف: `release/MySafe-Extension-Chromium-v1.0.0.zip`.
4. املأ بيانات الخصوصية والوصف والأيقونة (`extension/icons/icon128.png`) واضغط **Publish**.

---

## 3️⃣ Mozilla Firefox Add-ons / AMO (مجاناً 100%)
1. توجه إلى بوابة مطوري موزيلا: https://addons.mozilla.org/developers/
2. سجّل الدخول بحساب Mozilla (**مجاني تماماً**).
3. اضغط **Submit a New Add-on** ← اختر **On this site**.
4. ارفع الحزمة المخصصة لفايرفوكس: `release/MySafe-Extension-Firefox-v1.0.0.zip`.  
   *(هذه الحزمة مُعدّة مسبقاً بـ `background.scripts` و `browser_specific_settings.gecko.data_collection_permissions` المتوافقة مع معايير موزيلا 2025/2026)*.
5. اجتز الفحص التلقائي واضغط **Submit**.

---

## 4️⃣ Opera Add-ons (مجاناً 100%)
1. توجه إلى: https://addons.opera.com/developer/
2. ارفع نفس حزمة Chromium: `release/MySafe-Extension-Chromium-v1.0.0.zip`.
3. أضف الوصف والخصوصية وقدّم للمراجعة.

---

## 💡 تجربة التثبيت المحلية الفورية الآن (قبل موافقة المتاجر):
* **Chrome:** `chrome://extensions` ← تفعيل Developer mode ← **Load unpacked** ← اختر مجلد `extension`
* **Edge:** `edge://extensions` ← تفعيل Developer mode ← **Load unpacked** ← اختر مجلد `extension`
* **Brave:** `brave://extensions` ← تفعيل Developer mode ← **Load unpacked** ← اختر مجلد `extension`
* **Opera:** `opera://extensions` ← تفعيل Developer mode ← **Load unpacked** ← اختر مجلد `extension`
* **Firefox:** `about:debugging#/runtime/this-firefox` ← **Load Temporary Add-on** ← اختر `extension-firefox/manifest.json`
