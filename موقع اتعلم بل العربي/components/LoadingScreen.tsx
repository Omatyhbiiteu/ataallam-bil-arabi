import React from 'react';
import { Logo } from './Logo';

export const LoadingScreen = () => {
  return (
    <div
      className="fixed inset-0 bg-[#fffdf7] dark:bg-[#0f172a] z-[100] flex flex-col items-center justify-center transition-colors duration-300 overflow-hidden"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8" dir="rtl">
        {/* Logo with animation */}
        <div className="scale-125">
          <Logo variant="icon" size="xl" animated centered />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-500 via-orange-500 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400 tracking-tight" style={{ fontFamily: 'var(--font-arabic)' }}>
              مفتاح اللغة
            </h1>
            <span className="text-amber-500 font-bold tracking-[0.25em] text-sm mt-2 opacity-90 uppercase" style={{ fontFamily: 'var(--font-latin)' }}>
              KeyLang
            </span>
          </div>

          <div className="mt-8 h-1 w-48 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 w-1/3 rounded-full animate-progress-flow box-shadow-glow"></div>
          </div>

          <span className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 animate-pulse">
            جارِ تجهيز تجربة التعلم...
          </span>
        </div>
      </div>

      <style>{`
        @keyframes progress-flow {
          0% { transform: translateX(300%); }
          100% { transform: translateX(-300%); }
        }
        .animate-progress-flow {
          animation: progress-flow 1.5s ease-in-out infinite;
        }
        .box-shadow-glow {
            box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
      `}</style>
    </div>
  );
};
