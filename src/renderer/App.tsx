import React, { useState, useEffect } from 'react';
import { translations } from './locales/translations';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { UnlockScreen } from './components/unlock/UnlockScreen';
import { VaultDashboard } from './components/vault/VaultDashboard';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);

  const t = translations[lang];

  // Update HTML dir and lang attributes on change
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Initial status check
  const checkVaultStatus = async () => {
    try {
      if (window.mySafe) {
        const status = await window.mySafe.checkStatus();
        setIsInitialized(status.initialized);
        setIsUnlocked(status.unlocked);

        if (status.unlocked) {
          const data = await window.mySafe.getData();
          setVaultData(data);
          if (data?.settings?.language) {
            setLang(data.settings.language);
          }
        }
      } else {
        // Dev fallback in standard browser
        setIsInitialized(false);
      }
    } catch (err) {
      console.error('Failed to query vault status:', err);
      setIsInitialized(false);
    }
  };

  useEffect(() => {
    checkVaultStatus();
  }, []);

  const handleToggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    setLang(next);
  };

  const handleLock = async () => {
    if (window.mySafe) {
      await window.mySafe.lock();
    }
    setIsUnlocked(false);
    setVaultData(null);
  };

  const handleRefreshData = async () => {
    if (window.mySafe) {
      const data = await window.mySafe.getData();
      setVaultData(data);
    }
  };

  // Loading splash
  if (isInitialized === null) {
    return (
      <div className="h-screen w-screen bg-[#070A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Loading My Safe...</span>
        </div>
      </div>
    );
  }

  // Not initialized -> Onboarding
  if (!isInitialized) {
    return (
      <OnboardingScreen
        t={t}
        lang={lang}
        onVaultCreated={(data) => {
          setIsInitialized(true);
          setIsUnlocked(true);
          setVaultData(data);
        }}
      />
    );
  }

  // Locked -> Unlock Screen
  if (!isUnlocked) {
    return (
      <UnlockScreen
        t={t}
        lang={lang}
        onUnlocked={(data) => {
          setIsUnlocked(true);
          setVaultData(data);
        }}
      />
    );
  }

  // Unlocked -> Dashboard
  return (
    <VaultDashboard
      t={t}
      lang={lang}
      onToggleLang={handleToggleLang}
      vaultData={vaultData}
      onLock={handleLock}
      onRefreshData={handleRefreshData}
    />
  );
}
