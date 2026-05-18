import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  /** banner علوي صغير (افتراضي) | مودال في منتصف الشاشة */
  variant?: 'default' | 'modal';
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, type = 'success', variant = 'default' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isVisible || variant === 'modal') return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [isVisible, onClose, variant]);

  useEffect(() => {
    if (!isVisible || variant !== 'modal') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, onClose, variant]);

  if (!mounted) return null;

  const title =
    type === 'success' ? 'تمت العملية بنجاح' : type === 'error' ? 'تنبيه هام' : 'معلومة';

  const iconBox =
    type === 'success' ? (
      <CheckCircle size={variant === 'modal' ? 36 : 24} strokeWidth={3} />
    ) : type === 'error' ? (
      <AlertTriangle size={variant === 'modal' ? 36 : 24} strokeWidth={3} />
    ) : (
      <Info size={variant === 'modal' ? 36 : 24} strokeWidth={3} />
    );

  const panelClass =
    type === 'success'
      ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white shadow-green-500/25 border-green-500/25'
      : type === 'error'
        ? 'bg-gradient-to-br from-red-950 via-red-900 to-red-950 text-white shadow-red-500/30 border-red-500/25'
        : 'bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 text-white shadow-blue-500/30 border-blue-500/25';

  const iconWrapClass =
    type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white';

  if (variant === 'modal') {
    return createPortal(
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120000] flex items-center justify-center p-4 sm:p-6"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="toast-modal-title"
            aria-describedby="toast-modal-desc"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-default border-0 p-0"
              aria-label="إغلاق الخلفية"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className={`relative w-full max-w-lg rounded-[2rem] border shadow-[0_32px_80px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl overflow-hidden ${panelClass}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[radial-gradient(circle_at_30%_20%,white,transparent_55%)]" />
              <div className="relative flex flex-col items-center text-center px-8 sm:px-10 pt-10 pb-8">
                <div className={`p-4 rounded-2xl flex items-center justify-center shadow-inner mb-6 ${iconWrapClass}`}>
                  {iconBox}
                </div>
                <h2 id="toast-modal-title" className="font-black text-2xl sm:text-3xl leading-tight mb-3">
                  {title}
                </h2>
                <p id="toast-modal-desc" className="font-medium text-base sm:text-lg text-gray-200/95 leading-relaxed max-w-md">
                  {message}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 w-full sm:w-auto min-w-[200px] py-3.5 px-8 rounded-2xl font-black text-base bg-white/15 hover:bg-white/25 border border-white/20 transition-colors"
                >
                  حسناً
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="absolute top-4 end-4 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              >
                <X size={22} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%", scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: -50, x: "-50%", scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-10 left-1/2 z-[120000] flex items-center justify-center w-full max-w-md pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className={`pointer-events-auto flex items-center gap-4 px-6 py-5 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/10 ${type === 'success' ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-green-500/30 border-green-500/20' :
              type === 'error' ? 'bg-gradient-to-r from-red-950 to-red-900 text-white shadow-red-500/30 border-red-500/20' :
                'bg-gradient-to-r from-blue-950 to-blue-900 text-white shadow-blue-500/30 border-blue-500/20'
            }`}>
            <div className={`p-3 rounded-xl flex items-center justify-center shadow-inner ${type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                  'bg-blue-500 text-white'
              }`}>
              {iconBox}
            </div>

            <div className="flex flex-col">
              <span className="font-black text-lg leading-tight">
                {title}
              </span>
              <span className="font-medium text-sm text-gray-300 leading-tight mt-1">{message}</span>
            </div>

            <button onClick={onClose} aria-label="إغلاق الإشعار" className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors opacity-70 hover:opacity-100">
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
