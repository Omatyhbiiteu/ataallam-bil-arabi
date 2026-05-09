import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, type = 'success' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Increased duration slightly
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%", scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: -50, x: "-50%", scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-10 left-1/2 z-[9999] flex items-center justify-center w-full max-w-md pointer-events-none"
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
              {type === 'success' ? <CheckCircle size={24} strokeWidth={3} /> : type === 'error' ? <AlertTriangle size={24} strokeWidth={3} /> : <Info size={24} strokeWidth={3} />}
            </div>

            <div className="flex flex-col">
              <span className="font-black text-lg leading-tight">
                {type === 'success' ? 'تمت العملية بنجاح' : type === 'error' ? 'تنبيه هام' : 'معلومة'}
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
