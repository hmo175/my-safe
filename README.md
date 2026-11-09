# 🛡️ My Safe - الخزنة الرقمية فائقة الأمان
### Ultra-Secure Desktop Password Manager & Digital Vault with Browser Autofill

<div align="center">

![My Safe Banner](https://img.shields.io/badge/Security-Argon2id%20%2B%20AES--256--GCM-10B981?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-blue?style=for-the-badge&logo=windows)
![Framework](https://img.shields.io/badge/Framework-Electron%20%2B%20React%20%2B%20Tailwind-61DAFB?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)

<br/>

**Created & Developed by [Eng. Mohammed Al-Gunaid](https://github.com/hmo175)**  
GitHub: [@hmo175](https://github.com/hmo175)

</div>

---

## 🌟 نبذة عن المشروع (About My Safe)

**My Safe** هو تطبيق سطح مكتب متكامل لإدارة كلمات المرور وحفظ الملفات والمستندات الحساسة بأعلى معايير التشفير العسكرية العالمية. صُمم التطبيق بنظام **المعرفة الصفرية (Zero-Knowledge)** والتخزين المحلي المحمي بالكامل داخل جهاز المستخدم، مع تكامل مباشر مع بصمة الويندوز **(Windows Hello)** وإضافة متصفح ذكية للتعبئة التلقائية وحفظ الحسابات في المتصفحات الشائعة (Chrome, Edge, Brave, Opera).

---

## 🚀 الميزات الرئيسية (Key Features)

* **🔐 تشفير عسكري معتمد:**
  * اشتقاق المفاتيح بخوارزمية **Argon2id** المقاومة لهجمات كروت الشاشة و ASIC.
  * تشفير السجلات والملفات بنظام **AES-256-GCM** مع ختم سلامة ومقاومة التلاعب.
  * مفتاح استرداد طارئ مكون من 32 رمزاً في حال نسيان كلمة المرور الرئيسية.

* **🖐️ المصادقة البيومترية (Windows Hello):**
  * دعم كامل وفوري لبصمة الإصبع، التعرف على الوجه، أو رمز PIN عبر واجهات WinRT الرسمية.
  * تفعيل تلقائي ذكي وفك قفل فوري للخزنة.

* **🌐 التكامل التام مع المتصفحات (Chrome / Edge / Brave / Opera):**
  * إضافة متصفح مبنية بمعيار **Manifest V3** الأحدث من جوجل.
  * كشف حقول الدخول وإظهار أيقونة الخزنة داخل الحقول.
  * **تأكيد إلزامي بالبصمة** على سطح المكتب قبل تعبئة كلمات المرور لحمايتك من التجسس.
  * **الحفظ التلقائي (Auto-Save):** رصد الحسابات الجديدة عند تسجيل الدخول وعرض نافذة لحفظها بنقرة واحدة.

* **📂 خزنة الملفات وعارض المستندات السري (In-App RAM Viewer):**
  * تشفير ملفات PDF، صور الجوازات، والهويات وحفظها داخل مجلد الخزنة المشفر.
  * فك تشفير الملفات **في الذاكرة العشوائية (RAM) فقط** لمعاينتها داخل التطبيق دون إنشاء ملفات غير مشفرة على القرص الصلب نهائياً.

* **⚙️ صينية النظام والبقاء في الخلفية (System Tray):**
  * عند الضغط على إغلاق `(X)`، يستمر التطبيق بالعمل بأيقونة درع خضراء بجوار ساعة الويندوز، لضمان استمرار عمل الإضافة والتعبئة الفورية في أي وقت.

* **⚡ أدوات الأمان المدمجة:**
  * **مولد أكواد 2FA / TOTP:** مولد رموز تحقق بخطوتين دوار كل 30 ثانية (بديل متكامل لـ Google Authenticator).
  * **مولد كلمات المرور:** تخصيص الطول والرموز مع شريط قياس القوة.
  * **استيراد وتصدير شامل:** استيراد جميع كلمات المرور من Chrome و Edge بملف CSV بنقرة واحدة، وتصدير نسخ احتياطية مشفرة بصيغة `.mysafe`.
  * **واجهة ثنائية اللغة:** دعم كامل للعربية (RTL) والإنجليزية (LTR).

---

## 🛠️ البنية التقنية (Tech Stack)

* **محرك سطح المكتب:** Electron v36+ (Node.js)
* **واجهة المستخدم:** React 18, TypeScript, Tailwind CSS v4, Lucide Icons
* **خوارزميات التشفير:** Argon2id (WebAssembly / Native), AES-256-GCM, Scrypt
* **التكامل البيومتري:** Windows Runtime (WinRT) `UserConsentVerifier`
* **إضافة المتصفح:** Chromium Extensions API (Manifest V3)

---

## 💻 التشغيل والتثبيت (Getting Started)

### المتطلبات:
* نظام التشغيل: Windows 10 أو Windows 11.
* بيئة Node.js (v18 فما فوق).

### خطوات التشغيل:
```bash
# 1. تثبيت الحزم
npm install

# 2. بناء وتجميع المشروع
npm run build

# 3. تشغيل التطبيق
npm start
# أو تشغيل الملف المباشر: Run-MySafe.bat
```

---

## 👤 حقوق المطور والملكية الفكرية (Author & Credits)

تم تصميم وهندسة وتطوير هذا المشروع بواسطة:

### **المهندس: محمد الجنيد (Eng. Mohammed Al-Gunaid)**
* **GitHub:** [@hmo175](https://github.com/hmo175)
* **المشروع:** [My Safe Repository](https://github.com/hmo175/my-safe)

---

## 📄 الترخيص (License)

هذا المشروع مرخص تحت رخصة **MIT License** - حقوق الملكية محفوظة © 2026 المهندس محمد الجنيد (Eng. Mohammed Al-Gunaid).
