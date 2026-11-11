import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Search,
  Plus,
  Globe,
  CreditCard,
  FileText,
  Paperclip,
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Edit3,
  ExternalLink,
  Clock,
  Languages,
  UploadCloud,
  Download,
  Settings,
  KeyRound,
} from 'lucide-react';
import { Translations } from '../../locales/translations';
import { ItemEditModal } from './ItemEditModal';
import { PasswordGeneratorModal } from '../tools/PasswordGeneratorModal';
import { FileViewerModal } from './FileViewerModal';
import { ExtensionPairModal } from '../tools/ExtensionPairModal';
import { SettingsModal } from '../tools/SettingsModal';
import { generateTOTP } from '../../utils/totp';

interface VaultDashboardProps {
  t: Translations;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  vaultData: any;
  onLock: () => void;
  onRefreshData: () => void;
}

export const VaultDashboard: React.FC<VaultDashboardProps> = ({
  t,
  lang,
  onToggleLang,
  vaultData,
  onLock,
  onRefreshData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // TOTP live state
  const [totpData, setTotpData] = useState<{ code: string; remainingSeconds: number }>({
    code: '------',
    remainingSeconds: 0,
  });

  const items = vaultData?.items || [];

  // Filter items
  const filteredItems = items.filter((item: any) => {
    // Category filter
    if (selectedCategory === 'logins' && item.type !== 'login') return false;
    if (selectedCategory === 'cards' && item.type !== 'card') return false;
    if (selectedCategory === 'notes' && item.type !== 'note') return false;
    if (selectedCategory === 'files' && item.type !== 'file') return false;
    if (selectedCategory === 'favorites' && !item.favorite) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      return matchTitle || matchUser || matchUrl;
    }

    return true;
  });

  // Selected item
  const selectedItem = items.find((it: any) => it.id === selectedItemId) || filteredItems[0] || null;

  // Update selected item id if none chosen
  useEffect(() => {
    if (!selectedItemId && filteredItems.length > 0) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  // Live TOTP timer
  useEffect(() => {
    let interval: any = null;
    if (selectedItem?.type === 'login' && selectedItem?.totpSecret) {
      const updateTOTP = async () => {
        const res = await generateTOTP(selectedItem.totpSecret);
        setTotpData(res);
      };
      updateTOTP();
      interval = setInterval(updateTOTP, 1000);
    } else {
      setTotpData({ code: '------', remainingSeconds: 0 });
    }
    return () => clearInterval(interval);
  }, [selectedItem]);

  const handleCopy = async (text: string, fieldName: string) => {
    if (!text) return;
    if (window.mySafe) {
      await window.mySafe.copyToClipboard(text, 30);
    } else {
      await navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleUploadFile = async () => {
    if (window.mySafe) {
      const fileItem = await window.mySafe.selectAndUploadFile();
      if (fileItem) {
        setSelectedItemId(fileItem.id);
        onRefreshData();
      }
    }
  };

  const handleToggleFavorite = async (item: any) => {
    if (window.mySafe) {
      await window.mySafe.updateItem(item.id, { favorite: !item.favorite });
      onRefreshData();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟')) {
      if (window.mySafe) {
        await window.mySafe.deleteItem(id);
        setSelectedItemId(null);
        onRefreshData();
      }
    }
  };

  const handleSaveItem = async (item: any) => {
    if (window.mySafe) {
      if (editingItem) {
        await window.mySafe.updateItem(item.id, item);
      } else {
        await window.mySafe.addItem(item);
      }
      setSelectedItemId(item.id);
      onRefreshData();
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'file':
        return <Paperclip className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#070A0F] text-slate-100 overflow-hidden font-sans">
      
      {/* 1. Navigation Sidebar */}
      <aside className="w-60 bg-[#0C101A] border-e border-gray-800/80 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-none">{t.appName}</h2>
              <span className="text-[10px] text-emerald-400/90 font-medium">{t.statusUnlocked}</span>
            </div>
          </div>

          {/* Nav Categories */}
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.allItems}</span>
              </div>
              <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 font-mono">
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('logins')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'logins'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4" />
                <span>{t.logins}</span>
              </div>
              <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 font-mono">
                {items.filter((i: any) => i.type === 'login').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('cards')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'cards'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>{t.cards}</span>
              </div>
              <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 font-mono">
                {items.filter((i: any) => i.type === 'card').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('notes')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'notes'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>{t.notes}</span>
              </div>
              <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 font-mono">
                {items.filter((i: any) => i.type === 'note').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('files')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'files'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Paperclip className="w-4 h-4" />
                <span>{t.files}</span>
              </div>
              <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 font-mono">
                {items.filter((i: any) => i.type === 'file').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('favorites')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'favorites'
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400" />
                <span>{t.favorites}</span>
              </div>
              <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 font-mono">
                {items.filter((i: any) => i.favorite).length}
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Utility Actions */}
        <div className="space-y-2 pt-4 border-t border-gray-800/80">
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-600/10 border border-emerald-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.generator}</span>
          </button>

          <button
            onClick={() => setIsPairModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-400 hover:bg-sky-500/10 border border-sky-500/20 transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === 'ar' ? 'ربط إضافات المتصفح' : 'Browser Extensions'}</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>{t.settings}</span>
          </button>

          <button
            onClick={onLock}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>{t.lockVault}</span>
          </button>

          {/* Developer Attribution */}
          <div className="pt-3 border-t border-gray-800/80 text-center">
            <a
              href="https://github.com/hmo175"
              target="_blank"
              rel="noreferrer"
              title="صفحة المطور على GitHub"
              className="group inline-flex items-center justify-center gap-1.5 text-[10px] text-gray-400 hover:text-emerald-400 transition-colors w-full"
            >
              <span>By</span>
              <span className="font-semibold text-gray-300 group-hover:text-emerald-400">hmo</span>
              <ExternalLink className="w-2.5 h-2.5 text-gray-400 group-hover:text-emerald-400" />
            </a>
          </div>
        </div>
      </aside>

      {/* 2. Middle List Column */}
      <section className="w-80 bg-[#090D14] border-e border-gray-800/80 flex flex-col shrink-0">
        
        {/* Search & Add Button Header */}
        <div className="p-4 border-b border-gray-800/80 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className={`w-3.5 h-3.5 text-gray-500 absolute top-1/2 -translate-y-1/2 ${
              lang === 'ar' ? 'right-3' : 'left-3'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full bg-[#111723] border border-gray-700/60 rounded-xl py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 ${
                lang === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          <button
            onClick={handleUploadFile}
            title="رفع وتشفير ملف جديد"
            className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsEditModalOpen(true);
            }}
            title={t.addItem}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <ShieldCheck className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-xs font-semibold text-gray-400">{t.emptyVaultTitle}</p>
              <p className="text-[11px] text-gray-600 mt-1">{t.emptyVaultDesc}</p>
            </div>
          ) : (
            filteredItems.map((item: any) => {
              const isSelected = item.id === selectedItemId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`group p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-600/15 border border-emerald-500/40 shadow-sm'
                      : 'hover:bg-gray-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gray-800/80 border border-gray-700/60 flex items-center justify-center shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-300">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                        {item.username || item.email || item.cardNumber || item.folder || 'عنصر مشفر'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Hover Quick-Copy Buttons */}
                    {item.type === 'login' && (
                      <div className="hidden group-hover:flex items-center gap-0.5 me-1 bg-[#111723] p-0.5 rounded-lg border border-gray-700/80">
                        {(item.username || item.email) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.username || item.email, 'quick-u-' + item.id);
                            }}
                            title="نسخ اسم المستخدم"
                            className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                        {item.password && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.password, 'quick-p-' + item.id);
                            }}
                            title="نسخ كلمة المرور"
                            className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition-colors"
                          >
                            <KeyRound className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {item.favorite && (
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. Right Details View Column */}
      <main className="flex-1 bg-[#070A0F] flex flex-col overflow-y-auto">
        {selectedItem ? (
          <div className="p-8 max-w-2xl mx-auto w-full space-y-6">
            
            {/* Detail Header */}
            <div className="flex items-start justify-between pb-6 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#111723] border border-gray-700/80 flex items-center justify-center shadow-lg">
                  {getItemIcon(selectedItem.type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedItem.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-800/80 px-2.5 py-0.5 rounded-full text-emerald-400 font-medium">
                      {selectedItem.folder || 'Personal'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedItem.updatedAt || selectedItem.createdAt).toLocaleDateString(
                        lang === 'ar' ? 'ar-EG' : 'en-US'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleFavorite(selectedItem)}
                  title={selectedItem.favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  className="p-2 text-gray-400 hover:text-amber-400 hover:bg-gray-800/60 rounded-xl transition-colors"
                >
                  <Star className={`w-4 h-4 ${selectedItem.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setEditingItem(selectedItem);
                    setIsEditModalOpen(true);
                  }}
                  title={t.edit}
                  className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800/60 rounded-xl transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  title={t.delete}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-gray-800/60 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Login Specific Details */}
            {selectedItem.type === 'login' && (
              <div className="space-y-4">
                
                {/* Username / Email */}
                {(selectedItem.username || selectedItem.email) && (
                  <div className="p-4 rounded-xl bg-[#0F1420] border border-gray-800/80 flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-semibold text-gray-400 mb-0.5">
                        {t.username} / {t.email}
                      </span>
                      <span className="text-sm font-semibold text-white font-mono">
                        {selectedItem.username || selectedItem.email}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedItem.username || selectedItem.email, 'username')}
                      className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                    >
                      {copiedField === 'username' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t.copy}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Password */}
                {selectedItem.password && (
                  <div className="p-4 rounded-xl bg-[#0F1420] border border-gray-800/80 flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-semibold text-gray-400 mb-0.5">
                        {t.password}
                      </span>
                      <span className="text-sm font-semibold text-emerald-400 font-mono tracking-wider">
                        {showPassword ? selectedItem.password : '••••••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy(selectedItem.password, 'password')}
                        className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                      >
                        {copiedField === 'password' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">{t.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t.copy}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Live 2FA / TOTP Authenticator */}
                {selectedItem.totpSecret && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-[#0F1420] border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-0.5">
                        <Clock className="w-3 h-3" />
                        <span>رمز التحقق بخطوتين (2FA Code)</span>
                      </div>
                      <span className="text-2xl font-bold font-mono tracking-widest text-emerald-300">
                        {totpData.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Countdown badge */}
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/40 flex items-center justify-center text-[11px] font-mono text-emerald-400 font-bold">
                        {totpData.remainingSeconds}s
                      </div>

                      <button
                        onClick={() => handleCopy(totpData.code.replace(/\s/g, ''), 'totp')}
                        className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      >
                        {copiedField === 'totp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'totp' ? t.copied : t.copy}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* URL */}
                {selectedItem.url && (
                  <div className="p-4 rounded-xl bg-[#0F1420] border border-gray-800/80 flex items-center justify-between">
                    <div className="overflow-hidden">
                      <span className="block text-[11px] font-semibold text-gray-400 mb-0.5">{t.websiteUrl}</span>
                      <a
                        href={selectedItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:underline truncate block"
                      >
                        {selectedItem.url}
                      </a>
                    </div>
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Card Specific Details */}
            {selectedItem.type === 'card' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 border border-gray-700 shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <CreditCard className="w-8 h-8 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-gray-400 tracking-wider">SECURE VAULT CARD</span>
                  </div>
                  <div className="font-mono text-xl text-white tracking-widest mb-4">
                    {selectedItem.cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between items-end text-xs font-mono">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Card Holder</span>
                      <span className="font-semibold text-white uppercase">{selectedItem.cardholderName || 'UNKNOWN'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Expires</span>
                      <span className="font-semibold text-white">
                        {selectedItem.expiryMonth || '00'}/{selectedItem.expiryYear || '00'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">CVV</span>
                      <span className="font-semibold text-emerald-400">{selectedItem.cvv || '•••'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Note Specific Details */}
            {selectedItem.type === 'note' && (
              <div className="p-5 rounded-2xl bg-[#0F1420] border border-gray-800 font-mono text-sm leading-relaxed text-gray-200 whitespace-pre-wrap select-text">
                {selectedItem.content}
              </div>
            )}

            {/* File Specific Details */}
            {selectedItem.type === 'file' && (
              <div className="space-y-5">
                <div className="p-6 rounded-2xl bg-[#0F1420] border border-gray-800 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
                    <Paperclip className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{selectedItem.fileName}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-mono">
                    <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                      {(selectedItem.fileSize / 1024).toFixed(1)} KB
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-sans font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> مشفر بـ AES-256
                    </span>
                  </div>

                  <div className="flex gap-3 w-full max-w-sm">
                    <button
                      onClick={() => setIsFileViewerOpen(true)}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>معاينة آمنة في الذاكرة (RAM)</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.mySafe) {
                          window.mySafe.exportFile(selectedItem.storedFileName, selectedItem.fileName);
                        }
                      }}
                      className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl border border-gray-700 transition-colors"
                      title="تصدير وحفظ الملف على القرص"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section for other items */}
            {selectedItem.notes && selectedItem.type !== 'note' && (
              <div className="p-4 rounded-xl bg-[#0F1420] border border-gray-800/80">
                <span className="block text-[11px] font-semibold text-gray-400 mb-1">ملاحظات</span>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedItem.notes}</p>
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <ShieldCheck className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-sm font-semibold text-gray-400">اختر عنصراً من القائمة لعرض تفاصيله</h3>
            <p className="text-xs text-gray-600 mt-1">أو أضف حساباً جديداً بالضغط على زر (+)</p>
          </div>
        )}
      </main>

      {/* Edit / Add Modal */}
      <ItemEditModal
        t={t}
        lang={lang}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        existingItem={editingItem}
      />

      {/* Standalone Password Generator */}
      <PasswordGeneratorModal
        t={t}
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />

      {/* In-App Encrypted File Viewer */}
      <FileViewerModal
        t={t}
        isOpen={isFileViewerOpen}
        onClose={() => setIsFileViewerOpen(false)}
        fileItem={selectedItem}
      />

      {/* Chrome Extension Pairing Modal */}
      <ExtensionPairModal
        t={t}
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
      />

      {/* Settings & Tools Modal */}
      <SettingsModal
        t={t}
        lang={lang}
        onToggleLang={onToggleLang}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
