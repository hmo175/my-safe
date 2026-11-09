import React, { useState, useEffect } from 'react';
import { X, Download, ShieldCheck, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Translations } from '../../locales/translations';

interface FileViewerModalProps {
  t: Translations;
  isOpen: boolean;
  onClose: () => void;
  fileItem: any;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onClose,
  fileItem,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !fileItem) {
      setDataUrl(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadPreview = async () => {
      try {
        if (window.mySafe) {
          const res = await window.mySafe.getFilePreview(fileItem.storedFileName, fileItem.mimeType || 'application/octet-stream');
          if (isMounted) {
            setDataUrl(res.dataUrl);
          }
        } else {
          throw new Error('بيئة سطح المكتب غير متصلة.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'تعذر فك تشفير الملف في الذاكرة.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fileItem]);

  const handleExport = async () => {
    if (window.mySafe && fileItem) {
      await window.mySafe.exportFile(fileItem.storedFileName, fileItem.fileName || 'file');
    }
  };

  if (!isOpen || !fileItem) return null;

  const isImage = fileItem.mimeType?.startsWith('image/');
  const isPdf = fileItem.mimeType === 'application/pdf';
  const isText = fileItem.mimeType === 'text/plain';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111723] border border-gray-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0C101A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm truncate max-w-md">
                {fileItem.fileName || fileItem.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  معاينة آمنة في الذاكرة المؤقتة (RAM)
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {(fileItem.fileSize / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              title="تصدير وحفظ الملف على القرص"
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Viewer Content */}
        <div className="flex-1 bg-[#070A0F] p-4 flex items-center justify-center overflow-auto relative">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-emerald-400">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
              <span className="text-xs text-gray-400 font-mono">فك تشفير البيانات في الذاكرة...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && dataUrl && (
            <>
              {isImage && (
                <img
                  src={dataUrl}
                  alt={fileItem.fileName}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg select-none"
                />
              )}

              {isPdf && (
                <iframe
                  src={dataUrl}
                  title={fileItem.fileName}
                  className="w-full h-full rounded-lg border border-gray-800 bg-white"
                />
              )}

              {!isImage && !isPdf && isText && (
                <div className="w-full h-full p-4 bg-[#0A0E17] rounded-xl border border-gray-800 font-mono text-xs text-gray-300 overflow-auto whitespace-pre-wrap">
                  {atob(dataUrl.split(',')[1])}
                </div>
              )}

              {!isImage && !isPdf && !isText && (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <FileText className="w-16 h-16 text-gray-600 mb-3" />
                  <p className="text-sm font-semibold text-white">{fileItem.fileName}</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm">
                    هذا الملف مشفر بأمان. لا يتوفر عارض مدمج لهذا النوع من الملفات، يمكنك تصديره لفتحه بالتطبيق الافتراضي.
                  </p>
                  <button
                    onClick={handleExport}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير الملف الآن</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
