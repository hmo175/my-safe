export interface Translations {
  appName: string;
  appSubtitle: string;
  statusLocked: string;
  statusUnlocked: string;
  lockVault: string;
  unlockVault: string;
  masterPassword: string;
  confirmPassword: string;
  enterPassword: string;
  passwordMismatch: string;
  passwordTooShort: string;
  weakPassword: string;
  goodPassword: string;
  strongPassword: string;
  createVault: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  recoveryKeyTitle: string;
  recoveryKeyDesc: string;
  recoveryKeyWarning: string;
  copyRecoveryKey: string;
  recoveryKeyCopied: string;
  savedRecoveryKeyProceed: string;
  allItems: string;
  logins: string;
  cards: string;
  notes: string;
  files: string;
  favorites: string;
  generator: string;
  settings: string;
  searchPlaceholder: string;
  addItem: string;
  title: string;
  username: string;
  email: string;
  password: string;
  websiteUrl: string;
  totpSecret: string;
  copy: string;
  copied: string;
  reveal: string;
  hide: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  emptyVaultTitle: string;
  emptyVaultDesc: string;
  unlockWithBiometrics: string;
  unlockWithRecovery: string;
  useRecoveryKey: string;
  invalidCredentials: string;
}

export const translations: Record<'ar' | 'en', Translations> = {
  ar: {
    appName: 'My Safe',
    appSubtitle: 'خزنتك الرقمية فائقة الأمان',
    statusLocked: 'الخزنة مقفلة',
    statusUnlocked: 'الخزنة مفتوحة',
    lockVault: 'قفل الخزنة الآن',
    unlockVault: 'فتح الخزنة',
    masterPassword: 'كلمة المرور الرئيسية',
    confirmPassword: 'تأكيد كلمة المرور',
    enterPassword: 'أدخل كلمة المرور الرئيسية لفك القفل...',
    passwordMismatch: 'كلمتا المرور غير متطابقتين',
    passwordTooShort: 'يجب ألا تقل كلمة المرور عن 8 خانات',
    weakPassword: 'ضعيفة',
    goodPassword: 'جيدة',
    strongPassword: 'قوية جداً',
    createVault: 'إنشاء وتشفير خزنـتي',
    welcomeTitle: 'مرحباً بك في My Safe',
    welcomeSubtitle: 'لنقم بتهيئة خزنتك المشفرة لأول مرة لحماية كلمات مرورك ومستنداتك الحساسة بأمان تام.',
    recoveryKeyTitle: 'مفتاح الاسترداد الطارئ (Recovery Key)',
    recoveryKeyDesc: 'هذا هو مفتاحك السري الوحيد لاستعادة بياناتك إذا نسيت كلمة المرور الرئيسية. احتفظ به في مكان آمن جداً بعيداً عن المتناول.',
    recoveryKeyWarning: 'تنبيه: لن يتم إظهار هذا المفتاح مرة أخرى. إذا فقدت كلمة المرور والمفتاح معاً، فلن يتمكن أحد من فك تشفير بياناتك.',
    copyRecoveryKey: 'نسخ مفتاح الاسترداد',
    recoveryKeyCopied: 'تم نسخ المفتاح إلى الحافظة بأمان!',
    savedRecoveryKeyProceed: 'لقد حفظت المفتاح بأمان، افتح خزنـتي الآن',
    allItems: 'جميع العناصر',
    logins: 'الحسابات والمواقع',
    cards: 'البطاقات البنكية',
    notes: 'الملاحظات الآمنة',
    files: 'المستندات والملفات',
    favorites: 'المفضلة',
    generator: 'مولد كلمات المرور',
    settings: 'الإعدادات والأمان',
    searchPlaceholder: 'بحث في العناصر المحفوظة...',
    addItem: 'عنصر جديد',
    title: 'العنوان',
    username: 'اسم المستخدم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    websiteUrl: 'رابط الموقع (URL)',
    totpSecret: 'مفتاح التحقق بخطوتين (TOTP 2FA)',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    reveal: 'إظهار',
    hide: 'إخفاء',
    save: 'حفظ العنصر',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    emptyVaultTitle: 'لا توجد عناصر محفوظة هنا بعد',
    emptyVaultDesc: 'ابدأ بالضغط على زر "عنصر جديد" لحفظ أول حساب أو كلمة سر بأمان.',
    unlockWithBiometrics: 'فتح بالبصمة / التعرف على الوجه',
    unlockWithRecovery: 'استعادة باستخدام مفتاح الطوارئ',
    useRecoveryKey: 'استخدام مفتاح الاسترداد',
    invalidCredentials: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى',
  },
  en: {
    appName: 'My Safe',
    appSubtitle: 'Ultra-Secure Digital Vault',
    statusLocked: 'Vault Locked',
    statusUnlocked: 'Vault Unlocked',
    lockVault: 'Lock Vault Now',
    unlockVault: 'Unlock Vault',
    masterPassword: 'Master Password',
    confirmPassword: 'Confirm Password',
    enterPassword: 'Enter your master password...',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    weakPassword: 'Weak',
    goodPassword: 'Good',
    strongPassword: 'Very Strong',
    createVault: 'Create & Encrypt My Vault',
    welcomeTitle: 'Welcome to My Safe',
    welcomeSubtitle: 'Let us set up your encrypted vault to protect your passwords and sensitive files.',
    recoveryKeyTitle: 'Emergency Recovery Key',
    recoveryKeyDesc: 'This is your single recovery key if you ever forget your master password. Keep it offline in a safe place.',
    recoveryKeyWarning: 'Warning: This key will never be shown again. If lost, zero-knowledge encryption means no one can recover your data.',
    copyRecoveryKey: 'Copy Recovery Key',
    recoveryKeyCopied: 'Key copied securely to clipboard!',
    savedRecoveryKeyProceed: 'I have safely backed up my key, Enter Vault',
    allItems: 'All Items',
    logins: 'Logins',
    cards: 'Payment Cards',
    notes: 'Secure Notes',
    files: 'Documents & Files',
    favorites: 'Favorites',
    generator: 'Password Generator',
    settings: 'Settings & Security',
    searchPlaceholder: 'Search vault items...',
    addItem: 'New Item',
    title: 'Title',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    websiteUrl: 'Website URL',
    totpSecret: '2FA TOTP Secret Key',
    copy: 'Copy',
    copied: 'Copied!',
    reveal: 'Reveal',
    hide: 'Hide',
    save: 'Save Item',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    emptyVaultTitle: 'No items saved here yet',
    emptyVaultDesc: 'Click "New Item" to securely store your first account or password.',
    unlockWithBiometrics: 'Unlock with Biometrics (Windows Hello)',
    unlockWithRecovery: 'Unlock with Emergency Recovery Key',
    useRecoveryKey: 'Use Recovery Key',
    invalidCredentials: 'Incorrect password, please try again',
  },
};
