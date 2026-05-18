import { Crown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type UpgradeModalState = {
  open: boolean;
  title: string;
  message: string;
};

type UpgradeModalProps = {
  modal: UpgradeModalState;
  onClose: () => void;
  onOpenSubscription: () => void;
};

export function UpgradeModal({ modal, onClose, onOpenSubscription }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {modal.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <Crown size={24} className="text-yellow-400" />
              <h3 className="text-xl font-black">{modal.title}</h3>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">{modal.message}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onOpenSubscription}
                className="flex-1 bg-gradient-to-r from-primary to-red-600 hover:from-red-600 hover:to-primary text-white px-5 py-3 rounded-xl font-black transition"
              >
                اشترك في Pro
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 rounded-xl font-black transition"
              >
                لاحقاً
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
