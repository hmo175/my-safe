import React, { useState, useEffect } from 'react';
import {
  X,
  Fingerprint,
  FileSpreadsheet,
  Download,
  Shield,
  KeyRound,
  Languages,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { Translations } from '../../locales/translations';

interface SettingsModalProps {
  t: Translations;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  t,
  lang,
  onToggleLang,
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [helloAvailable, setHelloAvailable] = useState(false);
  const [helloEnabled, setHelloEnabled] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (isOpen && window.mySafe) {
      window.mySafe.isBiometricsAvailable().then(setHelloAvailable);
      window.mySafe.isBiometricsEnabled().then(setHelloEnabled);
    }
  }, [isOpen]);

  const handleToggleHello = async () => {
    if (!window.mySafe) return;
    if (helloEnabled) {
      await window.mySafe.disableBiometrics();
      setHelloEnabled(false);
      setMessage('تم تعطيل Windows Hello.');
    } else {
      const success = await window.mySafe.enableBiometrics();
      if (success) {
        setHelloEnabled(true);
        setMessage('تم تفعيل بصمة Windows Hello بنجاح!');
      }
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError(t.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordMismatch);
      return;
    }

    setPasswordLoading(true);
    try {
      if (window.mySafe) {
        const success = await window.mySafe.changeMasterPassword(oldPassword, newPassword);
        if (success) {
          setMessage('تم تغيير كلمة المرور الرئيسية بنجاح!');
          setIsChangingPassword(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setPasswordError('كلمة المرور الحالية غير صحيحة.');
        }
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'فشل في تغيير كلمة المرور.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleImportCsv = async () => {
    setImportStatus(null);
    if (window.mySafe) {
      const res = await window.mySafe.importCsv();
      if (res && res.count > 0) {
        setImportStatus(`تم استيراد ${res.count} حساب بنجاح إلى الخزنة! 🎉`);
        onRefreshData();
      } else {
        setImportStatus('لم يتم استيراد أي حسابات أو تم إلغاء العملية.');
      }
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleExportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupPassword || backupPassword.length < 6) {
      alert('يجب أن تتكون كلمة مرور النسخة الاحتياطية من 6 أحرف على الأقل.');
      return;
    }

    if (window.mySafe) {
      const success = await window.mySafe.exportEncryptedBackup(backupPassword);
      if (success) {
        setMessage('تم تصدير النسخة الاحتياطية المشفرة بنجاح!');
        setIsExporting(false);
        setBackupPassword('');
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111723] border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#0C101A]">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">{t.settings}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* 1. Language Toggle */}
          <div className="p-4 rounded-xl bg-[#090D14] border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">لغة الواجهة (Language)</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {lang === 'ar' ? 'اللغة الحالية: العربية (RTL)' : 'Current Language: English (LTR)'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggleLang}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors"
            >
              {lang === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}
            </button>
          </div>

          {/* 2. Windows Hello Biometrics */}
          <div className="p-4 rounded-xl bg-[#090D14] border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">Windows Hello (البصمة / الوجه)</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {helloAvailable ? 'متاح ومفعل لفك القفل السريع' : 'غير متوفر في هذا الجهاز'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleHello}
              disabled={!helloAvailable}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                helloEnabled
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              {helloEnabled ? 'مفعّل ✓' : 'تفعيل'}
            </button>
          </div>

          {/* 3. Change Master Password */}
          <div className="p-4 rounded-xl bg-[#090D14] border border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">تغيير كلمة المرور الرئيسية</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    إعادة تشفير الخزنة بكلمة مرور رئيسية جديدة
                  </p>
                </div>
              </div>

              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors"
                >
                  تغيير الرمز
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form onSubmit={handleChangePassword} className="mt-4 pt-3 border-t border-gray-800 space-y-3">
                <div>
                  <label className="block text-[11px] text-gray-400 font-medium mb-1">كلمة المرور الحالية</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="كلمة المرور الحالية..."
                      className="w-full bg-[#111723] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400 hover:text-white"
                    >
                      {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">كلمة المرور الجديدة</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="8 خانات على الأقل..."
                      className="w-full bg-[#111723] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">تأكيد الكلمة الجديدة</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال الكلمة..."
                      className="w-full bg-[#111723] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordError(null);
                    }}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow"
                  >
                    {passwordLoading ? 'جاري التحديث...' : 'تحديث وتشفير'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 4. Import all Browser Passwords (Chrome / Edge / Bitwarden) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/30 to-[#090D14] border border-sky-500/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">نقل جميع كلمات المرور من المتصفح دفعة واحدة</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  استيراد مباشر لجميع حساباتك المحفوظة في Chrome أو Edge
                </p>
              </div>
            </div>

            <div className="text-[11px] text-gray-300/90 leading-relaxed bg-[#0C101A] p-3 rounded-lg border border-gray-800 my-2 space-y-1">
              <div>1. في كروم اذهب إلى: <code className="text-sky-400">chrome://password-manager/settings</code></div>
              <div>2. اضغط زر <strong>"تصدير كلمات المرور" (Export passwords)</strong> واحفظ ملف CSV.</div>
              <div>3. اضغط الزر بالأسفل واختر الملف لنقلها كلها فوراً!</div>
            </div>

            <button
              onClick={handleImportCsv}
              className="w-full mt-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>استيراد جميع كلمات المرور الآن (CSV)</span>
            </button>

            {importStatus && (
              <div className="mt-2 p-2.5 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs text-center font-medium">
                {importStatus}
              </div>
            )}
          </div>

          {/* 5. Encrypted Backup Export */}
          <div className="p-4 rounded-xl bg-[#090D14] border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">تصدير نسخة احتياطية مشفرة (.mysafe)</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    حفظ نسخة احتياطية آمنة على فلاشة خارجية USB
                  </p>
                </div>
              </div>

              {!isExporting && (
                <button
                  onClick={() => setIsExporting(true)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors"
                >
                  تصدير الخزنة
                </button>
              )}
            </div>

            {isExporting && (
              <form onSubmit={handleExportBackup} className="mt-3 pt-3 border-t border-gray-800/80 space-y-2">
                <label className="block text-[11px] text-gray-300 font-medium">
                  عيّن كلمة مرور لحماية هذه النسخة الاحتياطية:
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="كلمة مرور النسخة الاحتياطية..."
                    className="flex-1 bg-[#111723] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow"
                  >
                    حفظ الملف
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExporting(false)}
                    className="px-2 py-1.5 text-gray-400 hover:text-white text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 6. Developer & Project Credits */}
          <div className="p-4 rounded-xl bg-gradient-to-tr from-[#0F1420] to-[#131B2A] border border-emerald-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-500/20">
                  <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center font-bold text-emerald-400 text-xs">
                    EG
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-xs">Eng. Mohammed Al-Gunaid</h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      المطور ومبتكر المشروع
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                    My Safe Digital Vault • v1.0.0
                  </p>
                </div>
              </div>

              <a
                href="https://github.com/hmo175"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#1F2937] hover:bg-gray-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-gray-600/60 shadow transition-colors"
              >
                <span>GitHub</span>
                <span className="text-emerald-400 font-mono">@hmo175</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </div>
            
            <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
              <span>جميع الحقوق محفوظة للمهندس محمد الجنيد</span>
              <span className="font-mono">© 2026 Eng. Mohammed Al-Gunaid</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#0C101A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
