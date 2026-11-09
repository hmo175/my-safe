import React, { useState } from 'react';
import { X, RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react';
import { Translations } from '../../locales/translations';

interface PasswordGeneratorModalProps {
  t: Translations;
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  t,
  isOpen,
  onClose,
  onSelectPassword,
}) => {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    let chars = '';
    if (useUpper) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (useLower) chars += 'abcdefghijkmnpqrstuvwxyz';
    if (useNumbers) chars += '23456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) chars = 'abcdefghijkmnpqrstuvwxyz';

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  };

  const [password, setPassword] = useState(() => generate());

  const handleRegenerate = () => {
    setPassword(generate());
  };

  const handleCopy = async () => {
    if (window.mySafe) {
      await window.mySafe.copyToClipboard(password, 30);
    } else {
      await navigator.clipboard.writeText(password);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111723] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">{t.generator}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Password Display Box */}
        <div className="mt-5 p-4 rounded-xl bg-[#090D14] border border-gray-800 flex items-center justify-between gap-3">
          <span className="font-mono text-emerald-400 text-lg font-bold tracking-wider select-all break-all">
            {password}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRegenerate}
              title="توليد كلمة سر أخرى"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              title={t.copy}
              className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5 font-medium">
              <span>طول كلمة المرور:</span>
              <span className="text-emerald-400 font-bold">{length} خانة</span>
            </div>
            <input
              type="range"
              min={8}
              max={48}
              value={length}
              onChange={(e) => {
                setLength(Number(e.target.value));
                setPassword(generate());
              }}
              className="w-full accent-emerald-500 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 cursor-pointer hover:border-gray-700">
              <input
                type="checkbox"
                checked={useUpper}
                onChange={(e) => {
                  setUseUpper(e.target.checked);
                  setPassword(generate());
                }}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-gray-300">أحرف كبيرة (A-Z)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 cursor-pointer hover:border-gray-700">
              <input
                type="checkbox"
                checked={useLower}
                onChange={(e) => {
                  setUseLower(e.target.checked);
                  setPassword(generate());
                }}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-gray-300">أحرف صغيرة (a-z)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 cursor-pointer hover:border-gray-700">
              <input
                type="checkbox"
                checked={useNumbers}
                onChange={(e) => {
                  setUseNumbers(e.target.checked);
                  setPassword(generate());
                }}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-gray-300">أرقام (0-9)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 cursor-pointer hover:border-gray-700">
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={(e) => {
                  setUseSymbols(e.target.checked);
                  setPassword(generate());
                }}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-gray-300">رموز خاصة (!@#$)</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            {t.cancel}
          </button>
          {onSelectPassword && (
            <button
              onClick={() => {
                onSelectPassword(password);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition-colors"
            >
              استخدام هذه الكلمة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
