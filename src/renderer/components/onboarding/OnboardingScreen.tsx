import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Copy, Check, Eye, EyeOff, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Translations } from '../../locales/translations';

interface OnboardingScreenProps {
  t: Translations;
  lang: 'ar' | 'en';
  onVaultCreated: (data: any) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ t, lang, onVaultCreated }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [copied, setCopied] = useState(false);

  // Evaluate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: t.weakPassword, color: 'bg-rose-500' };
    if (score <= 4) return { score: 2, label: t.goodPassword, color: 'bg-amber-500' };
    return { score: 3, label: t.strongPassword, color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      if (window.mySafe) {
        const result = await window.mySafe.initializeVault(password);
        setRecoveryKey(result.recoveryKey);
        setStep(2);
      } else {
        // Fallback for browser preview
        setRecoveryKey('SAFE-7K9A-B82X-M4PW-V9L2-3D8F-Q1Z9-04TY');
        setStep(2);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize vault');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecoveryKey = async () => {
    if (window.mySafe) {
      await window.mySafe.copyToClipboard(recoveryKey, 60);
    } else {
      await navigator.clipboard.writeText(recoveryKey);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleFinish = async () => {
    if (window.mySafe) {
      const data = await window.mySafe.getData();
      onVaultCreated(data);
    } else {
      onVaultCreated({ items: [], folders: ['Personal', 'Work'], settings: { theme: 'dark' } });
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-lg bg-[#111723]/90 backdrop-blur-xl border border-gray-800/80 rounded-2xl shadow-2xl p-8 relative z-10 transition-all">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-lg shadow-emerald-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-9 h-9 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.welcomeTitle}</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-sm">{t.welcomeSubtitle}</p>
        </div>

        {step === 1 ? (
          /* Step 1: Create Master Password */
          <form onSubmit={handleCreateVault} className="space-y-5">
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

              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">قوة كلمة المرور:</span>
                    <span className="font-medium text-gray-200">{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'} flex-1`} />
                    <div className={`h-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'} flex-1`} />
                    <div className={`h-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'} flex-1`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t.confirmPassword}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPassword}
                className="w-full bg-[#0B0F17] border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.createVault}</span>
                  {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Emergency Recovery Key */
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <strong className="block text-amber-300 font-bold mb-1">{t.recoveryKeyTitle}</strong>
                {t.recoveryKeyWarning}
              </div>
            </div>

            {/* Display Recovery Key Box */}
            <div className="bg-[#090D14] p-4 rounded-xl border border-gray-800 text-center font-mono text-sm tracking-wider text-emerald-400 select-all select-text font-bold">
              {recoveryKey}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopyRecoveryKey}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium rounded-xl border border-gray-700 flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.recoveryKeyCopied : t.copyRecoveryKey}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>{t.savedRecoveryKeyProceed}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
