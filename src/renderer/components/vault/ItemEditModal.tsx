import React, { useState } from 'react';
import { X, Globe, CreditCard, FileText, Paperclip, Eye, EyeOff, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { Translations } from '../../locales/translations';
import { PasswordGeneratorModal } from '../tools/PasswordGeneratorModal';

interface ItemEditModalProps {
  t: Translations;
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  existingItem?: any;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  t,
  lang,
  isOpen,
  onClose,
  onSave,
  existingItem,
}) => {
  const [type, setType] = useState<'login' | 'card' | 'note' | 'file'>(existingItem?.type || 'login');
  const [title, setTitle] = useState(existingItem?.title || '');
  const [folder, setFolder] = useState(existingItem?.folder || 'Personal');
  
  // Login fields
  const [username, setUsername] = useState(existingItem?.username || '');
  const [email, setEmail] = useState(existingItem?.email || '');
  const [password, setPassword] = useState(existingItem?.password || '');
  const [url, setUrl] = useState(existingItem?.url || '');
  const [totpSecret, setTotpSecret] = useState(existingItem?.totpSecret || '');
  
  // Card fields
  const [cardholderName, setCardholderName] = useState(existingItem?.cardholderName || '');
  const [cardNumber, setCardNumber] = useState(existingItem?.cardNumber || '');
  const [expiryMonth, setExpiryMonth] = useState(existingItem?.expiryMonth || '');
  const [expiryYear, setExpiryYear] = useState(existingItem?.expiryYear || '');
  const [cvv, setCvv] = useState(existingItem?.cvv || '');
  const [pin, setPin] = useState(existingItem?.pin || '');

  // Note fields
  const [content, setContent] = useState(existingItem?.content || '');
  const [notes, setNotes] = useState(existingItem?.notes || '');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى إدخال عنوان للعنصر.');
      return;
    }

    const base = {
      id: existingItem?.id || crypto.randomUUID(),
      type,
      title: title.trim(),
      folder,
      createdAt: existingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorite: existingItem?.favorite || false,
    };

    let fullItem: any = { ...base };

    if (type === 'login') {
      fullItem = { ...fullItem, username, email, password, url, totpSecret, notes };
    } else if (type === 'card') {
      fullItem = { ...fullItem, cardholderName, cardNumber, expiryMonth, expiryYear, cvv, pin, notes };
    } else if (type === 'note') {
      fullItem = { ...fullItem, content };
    }

    onSave(fullItem);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#111723] border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <h3 className="font-bold text-white text-base">
              {existingItem ? t.edit : t.addItem}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Type selector tabs */}
            {!existingItem && (
              <div className="grid grid-cols-4 gap-2 bg-[#0A0E17] p-1.5 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setType('login')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    type === 'login' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t.logins}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('card')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    type === 'card' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t.cards}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('note')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    type === 'note' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.notes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('file')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    type === 'file' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{t.files}</span>
                </button>
              </div>
            )}

            {/* Title & Folder */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1">{t.title} *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: حساب Google الشخصي"
                  className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">المجلد</label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Personal">شخصي (Personal)</option>
                  <option value="Work">عمل (Work)</option>
                  <option value="Finance">مالي (Finance)</option>
                </select>
              </div>
            </div>

            {/* Fields for Logins */}
            {type === 'login' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">{t.username}</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="اسم المستخدم"
                      className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">{t.email}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-300">{t.password}</label>
                    <button
                      type="button"
                      onClick={() => setIsGeneratorOpen(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.generator}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="كلمة المرور"
                      className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-white ${
                        lang === 'ar' ? 'left-3' : 'right-3'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">{t.websiteUrl}</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://accounts.google.com"
                    className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">{t.totpSecret}</label>
                  <input
                    type="text"
                    value={totpSecret}
                    onChange={(e) => setTotpSecret(e.target.value)}
                    placeholder="مفتاح Base32 (مثال: JBSWY3DPEHPK3PXP)"
                    className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono text-xs uppercase"
                  />
                </div>
              </div>
            )}

            {/* Fields for Cards */}
            {type === 'card' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">اسم حامل البطاقة</label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="NAME ON CARD"
                    className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">رقم البطاقة</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">الشهر (MM)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      placeholder="12"
                      className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">السنة (YY)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      placeholder="28"
                      className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">رمز الأمان (CVV)</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Fields for Notes */}
            {type === 'note' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1">الملاحظة السرية المشفرة</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب هنا ملاحظاتك الخاصة، كلمات المرور المؤقتة، أو الرموز الهامة..."
                  className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none font-mono"
                />
              </div>
            )}

            {/* Additional Notes */}
            {type !== 'note' && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات سرية تخص هذا العنصر..."
                  className="w-full bg-[#090D14] border border-gray-700/80 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Footer buttons */}
            <div className="pt-4 border-t border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PasswordGeneratorModal
        t={t}
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSelectPassword={(newPass) => setPassword(newPass)}
      />
    </>
  );
};
