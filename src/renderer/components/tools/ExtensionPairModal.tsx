import React, { useState, useEffect } from 'react';
import { X, Globe, RefreshCw, ShieldCheck, Copy, Check, FolderOpen } from 'lucide-react';
import { Translations } from '../../locales/translations';

interface ExtensionPairModalProps {
  t: Translations;
  isOpen: boolean;
  onClose: () => void;
}

type BrowserTab = 'chromium' | 'firefox';

export const ExtensionPairModal: React.FC<ExtensionPairModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [pairingCode, setPairingCode] = useState('------');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [browserTab, setBrowserTab] = useState<BrowserTab>('chromium');
  const [extPath, setExtPath] = useState('');

  const fetchCode = async () => {
    if (window.mySafe) {
      setLoading(true);
      try {
        const code = await window.mySafe.getPairingCode();
        setPairingCode(code);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen && window.mySafe?.getExtensionPath) {
      window.mySafe.getExtensionPath(browserTab).then(setExtPath);
    }
  }, [isOpen, browserTab]);

  const handleRegenerate = async () => {
    if (window.mySafe) {
      setLoading(true);
      try {
        const code = await window.mySafe.generateNewPairingCode();
        setPairingCode(code);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCode();
    }
  }, [isOpen]);

  const handleCopy = async () => {
    if (window.mySafe) {
      await window.mySafe.copyToClipboard(pairingCode, 30);
    } else {
      await navigator.clipboard.writeText(pairingCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111723] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">ربط إضافة المتصفحات (جميع المتصفحات)</h3>
              <span className="text-[11px] text-gray-400">Chrome • Edge • Brave • Opera • Firefox</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Type Switcher */}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => setBrowserTab('chromium')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              browserTab === 'chromium'
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                : 'bg-[#090D14] border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            Chrome / Edge / Brave / Opera
          </button>
          <button
            type="button"
            onClick={() => setBrowserTab('firefox')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              browserTab === 'firefox'
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                : 'bg-[#090D14] border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            Mozilla Firefox
          </button>
        </div>

        {/* Instructions */}
        <div className="my-4 space-y-3 text-xs text-gray-300">
          {browserTab === 'chromium' ? (
            <div className="p-3.5 rounded-xl bg-[#090D14] border border-gray-800 space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>
                  افتح صفحة الإضافات في متصفحك:{' '}
                  <code className="text-emerald-400 bg-gray-900 px-1 py-0.5 rounded">chrome://extensions</code>{' '}
                  أو <code className="text-emerald-400 bg-gray-900 px-1 py-0.5 rounded">edge://extensions</code>{' '}
                  أو <code className="text-emerald-400 bg-gray-900 px-1 py-0.5 rounded">brave://extensions</code>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>فعّل خيار <strong>وضع المطور (Developer Mode)</strong> في الزاوية العلوية.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span>
                  اضغط <strong>Load unpacked (تحميل حزمة غير مضغوطة)</strong> واختر مجلد <code className="text-emerald-400 bg-gray-900 px-1 py-0.5 rounded font-mono">extension</code> (أو ثبّتها مباشرة من المتجر الرسمي فور النشر).
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#090D14] border border-gray-800 space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>
                  في متصفح Firefox انتقل إلى:{' '}
                  <code className="text-emerald-400 bg-gray-900 px-1 py-0.5 rounded">about:debugging#/runtime/this-firefox</code>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>اضغط على <strong>Load Temporary Add-on</strong> (أو ثبّتها دائماً من متجر Firefox Add-ons بعد النشر).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span>
                  اختر ملف <code className="text-emerald-400 bg-gray-900 px-1 py-0.5 rounded font-mono">extension-firefox/manifest.json</code>.
                </span>
              </div>
            </div>
          )}

          {extPath && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#090D14] border border-gray-800/80">
              <span className="text-[10px] text-gray-400 font-mono truncate" dir="ltr" title={extPath}>
                {extPath}
              </span>
              <button
                type="button"
                onClick={() => window.mySafe?.openExtensionFolder?.(browserTab)}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>فتح المجلد</span>
              </button>
            </div>
          )}

          {/* Pairing Code Card */}
          <div className="text-center pt-1">
            <span className="block text-[11px] font-semibold text-gray-400 mb-2">
              كود الاقتران المؤقت (أدخله في نافذة الإضافة بالمتصفح):
            </span>
            <div className="bg-[#090D14] p-4 rounded-xl border border-gray-800 inline-flex items-center gap-4">
              <span className="font-mono text-2xl font-bold tracking-[8px] text-emerald-400">
                {pairingCode}
              </span>
              <div className="flex items-center gap-1 border-s border-gray-800 ps-3">
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  title="توليد كود جديد"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleCopy}
                  title="نسخ الكود"
                  className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-2.5 text-[11px] text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>الربط مشفر ومحمي برمز لمرة واحدة ويعمل محلياً عبر منفذ آمن دون خروج أي بيانات للإنترنت.</span>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
