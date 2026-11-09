import React, { useState } from 'react';
import { Lock, Fingerprint, KeyRound, Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Translations } from '../../locales/translations';

interface UnlockScreenProps {
  t: Translations;
  lang: 'ar' | 'en';
  onUnlocked: (data: any) => void;
}

export const UnlockScreen: React.FC<UnlockScreenProps> = ({ t, lang, onUnlocked }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (window.mySafe) {
        let success = false;
        if (useRecovery) {
          success = await window.mySafe.unlockRecovery(recoveryKey.trim());
        } else {
          success = await window.mySafe.unlock(password);
        }

        if (success) {
          const data = await window.mySafe.getData();
          onUnlocked(data);
        } else {
          setError(t.invalidCredentials);
        }
      } else {
        // Fallback for demo
        onUnlocked({ items: [], folders: ['Personal', 'Work'], settings: { theme: 'dark' } });
      }
    } catch (err: any) {
      setError(err?.message || t.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setError('');
    setLoading(true);
    try {
      if (window.mySafe) {
        const isEnabled = await window.mySafe.isBiometricsEnabled();
        if (!isEnabled) {
          setError('بصمة Windows Hello غير مفعلة بعد. يرجى الدخول بكلمة المرور الرئيسية وتفعيلها من الإعدادات.');
          return;
        }

        const res = await window.mySafe.unlockBiometrics();
        if (res && res.success) {
          const data = await window.mySafe.getData();
          onUnlocked(data);
        } else {
          setError(res?.error || 'فشلت المصادقة بالبصمة.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر استدعاء Windows Hello.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#111723]/90 backdrop-blur-xl border border-gray-800/80 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-lg shadow-emerald-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.appName}</h1>
          <p className="text-sm text-gray-400 mt-1">{t.statusLocked}</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          {!useRecovery ? (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t.masterPassword}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.enterPassword}
                  className="w-full bg-[#0B0F17] border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors ${
                    lang === 'ar' ? 'left-3' : 'right-3'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t.recoveryKeyTitle}
              </label>
              <input
                type="text"
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX..."
                className="w-full bg-[#0B0F17] border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-emerald-400 font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                autoFocus
                required
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{useRecovery ? t.unlockWithRecovery : t.unlockVault}</span>
                {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </form>

        {/* Biometrics & Recovery Switch */}
        <div className="mt-6 pt-5 border-t border-gray-800/80 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleBiometricUnlock}
            className="w-full py-2.5 px-3 bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-medium border border-gray-700/60 flex items-center justify-center gap-2 transition-colors"
          >
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>{t.unlockWithBiometrics}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUseRecovery(!useRecovery);
              setError('');
            }}
            className="text-xs text-gray-400 hover:text-emerald-400 text-center transition-colors py-1"
          >
            {useRecovery ? t.masterPassword : t.useRecoveryKey}
          </button>
        </div>

      </div>
    </div>
  );
};
