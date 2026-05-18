import { Crown } from 'lucide-react';

type ProRequiredPanelProps = {
  onUpgrade: () => void;
};

export function ProRequiredPanel({ onUpgrade }: ProRequiredPanelProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-10 text-center" dir="rtl">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 flex items-center justify-center mb-6 border border-amber-400/30">
        <Crown className="w-10 h-10 text-amber-400" />
      </div>
      <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">المواقف الحياتية</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-lg text-base md:text-lg font-bold leading-relaxed mb-8">
        هذا القسم يتطلب <span className="text-amber-600 dark:text-amber-400">اشتراك Pro</span> — جمل وتعبيرات عملية لكل موقف (سفر، عمل، تسوق، وغيرها) مع تدريب كامل على مستويات A1–C2.
      </p>
      <button
        type="button"
        onClick={onUpgrade}
        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-lg shadow-xl shadow-amber-500/25 hover:opacity-95 transition"
      >
        عرض خطط الاشتراك
      </button>
    </div>
  );
}
