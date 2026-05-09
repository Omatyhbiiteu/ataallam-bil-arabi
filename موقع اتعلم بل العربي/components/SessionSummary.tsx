import React, { useEffect, useState, useRef } from 'react';
import { SessionResults, SRSGrade } from '../types';
import { Trophy, Clock, Zap, Target, ArrowRight, Brain, Star, Share2, Award, RotateCcw, CheckCircle2, Check as CheckIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence, animate } from 'framer-motion';

interface SessionSummaryProps {
  results: SessionResults;
  onClose: () => void;
  t: any;
}

// Helper for counting animation (optimized to prevent React re-renders)
const Counter = ({ value, duration = 1.5 }: { value: number, duration?: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, value, {
        duration,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = Math.floor(v).toString();
        }
      });
      return () => controls.stop();
    }
  }, [value, duration]);

  return <span ref={nodeRef}>0</span>;
};

export const SessionSummary: React.FC<SessionSummaryProps> = ({ results, onClose, t }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Advanced Confetti Effect for great scores
    if (results.score > 10) {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio: number, opts: any) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [results.score]);

  // Determine Rank & Style
  const getRankInfo = (score: number) => {
    if (score > 100) return { title: 'القرش', subtitle: 'أداء أسطوري!', color: 'from-amber-400 to-orange-600', icon: <Trophy size={48} />, shadow: 'shadow-amber-500/50' };
    if (score > 50) return { title: 'الصقر', subtitle: 'تركيز حاد', color: 'from-blue-400 to-indigo-600', icon: <Target size={48} />, shadow: 'shadow-blue-500/50' };
    if (score > 20) return { title: 'الذئب', subtitle: 'تقدم ثابت', color: 'from-emerald-400 to-green-600', icon: <Award size={48} />, shadow: 'shadow-emerald-500/50' };
    return { title: 'المستكشف', subtitle: 'بداية جيدة', color: 'from-gray-400 to-slate-600', icon: <Brain size={48} />, shadow: 'shadow-gray-500/50' };
  };

  const rank = getRankInfo(results.score);
  const accuracy = results.totalReviewed > 0 ? Math.round(((results.totalReviewed - results.breakdown[SRSGrade.AGAIN]) / results.totalReviewed) * 100) : 0;

  const durationSec = Math.floor((results.endTime - results.startTime) / 1000);
  const durationMin = Math.floor(durationSec / 60);
  const remainingSec = durationSec % 60;
  // إصلاح: عرض الوقت بشكل أوضح إذا كان أقل من دقيقة
  const timeDisplay = durationMin === 0
    ? `${durationSec}ث`
    : `${durationMin}:${remainingSec.toString().padStart(2, '0')}`;

  // وظيفة المشاركة الفعلية
  const handleShare = async () => {
    const text = `🏆 أنهيت جلسة مراجعة بـ اتعلم بالعربي!\n✅ كلمات تمت: ${results.totalReviewed}\n🎯 الدقة: ${accuracy}%\n🪅 الرتبة: ${rank.title} — ${rank.subtitle}\n⭐ النقاط: ${results.score}\n⏱️ الوقت: ${timeDisplay}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'نتائج جلسة المراجعة', text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // fallback silent
    }
  };

  // إصلاح TypeScript: تعريف cardVariants بنوع صريح
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const }
    })
  };


  return (
    <div className="min-h-screen bg-stone-50 dark:bg-dark-bg p-4 flex items-center justify-center font-sans overflow-hidden relative">
      {/* Background Ambient Effects */}
      <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${rank.color} opacity-10 blur-3xl rounded-full transform -translate-y-1/2`}></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-white/20 dark:border-gray-700/50"
      >
        {/* Header Banner */}
        <div className={`relative h-40 md:h-64 bg-gradient-to-br ${rank.color} flex flex-col items-center justify-center text-white overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className={`w-16 h-16 md:w-28 md:h-28 rounded-2xl md:rounded-[2rem] bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl ${rank.shadow} border border-white/30 mb-2 md:mb-4`}
          >
            {React.cloneElement(rank.icon as React.ReactElement<any>, { className: "w-8 h-8 md:w-12 md:h-12" })}
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-2xl md:text-5xl font-black tracking-tight drop-shadow-md px-4 text-center"
          >
            {rank.title}
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-xs md:text-lg font-bold opacity-90 tracking-widest uppercase mt-1"
          >
            {rank.subtitle}
          </motion.p>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-8 lg:p-12 -mt-6 md:-mt-10 relative z-20">

          {/* Key Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8 md:mb-12">
            {[
              { label: 'النقاط المكتسبة', val: results.score, icon: <Star size={18} />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'دقة الإجابات', val: accuracy, suffix: '%', icon: <Target size={18} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'وقت الجلسة', val: timeDisplay, icon: <Clock size={18} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'كلمات تمت', val: results.totalReviewed, icon: <CheckCircle2 size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((stat, i) => (
              <motion.div
                key={i} custom={i} initial="hidden" animate="visible" variants={cardVariants}
                className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-md md:shadow-lg shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 ${stat.bg} ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-2 md:mb-3 shadow-inner`}>
                  {React.cloneElement(stat.icon as React.ReactElement<any>, { className: "w-4 h-4 md:w-5 md:h-5" })}
                </div>
                <div className="text-xl md:text-3xl font-black text-gray-800 dark:text-white mb-0.5 md:mb-1">
                  {typeof stat.val === 'number' ? <Counter value={stat.val} /> : stat.val}
                  <span className="text-xs md:text-sm align-super ml-1">{stat.suffix}</span>
                </div>
                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

            {/* Breakdown Chart */}
            <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
              <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" /> تحليل الأداء
              </h3>
              <div className="space-y-3 md:space-y-5">
                {[
                  { label: 'سهل جداً', val: results.breakdown[SRSGrade.EASY], color: 'bg-blue-500', text: 'text-blue-500' },
                  { label: 'جيد', val: results.breakdown[SRSGrade.GOOD], color: 'bg-emerald-500', text: 'text-emerald-500' },
                  { label: 'صعب', val: results.breakdown[SRSGrade.HARD], color: 'bg-orange-500', text: 'text-orange-500' },
                  { label: 'أعد المحاولة', val: results.breakdown[SRSGrade.AGAIN], color: 'bg-red-500', text: 'text-red-500' },
                ].map((bar, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1.5 md:mb-2">
                      <span className="text-gray-500">{bar.label}</span>
                      <span className={`${bar.text}`}>{bar.val} بطاقات</span>
                    </div>
                    <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(bar.val / Math.max(results.totalReviewed, 1)) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                        className={`h-full ${bar.color} relative`}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Hardest Cards */}
            <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
              <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5 md:w-6 md:h-6 text-red-500" /> تركيز إضافي
              </h3>
              {results.hardestCards.length > 0 ? (
                <div className="bg-stone-50 dark:bg-gray-800/50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-stone-200 dark:border-gray-700/50">
                  <p className="text-xs md:text-sm font-bold text-gray-500 mb-3 md:mb-4">واجهت صعوبة في هذه الكلمات، سنركز عليها لاحقاً:</p>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {results.hardestCards.slice(0, 6).map((c, i) => (
                      <motion.span
                        key={c.id}
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + (i * 0.1) }}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm border border-stone-100 dark:border-gray-700 hover:text-red-500 hover:border-red-200 transition-colors cursor-default"
                      >
                        {c.frontText}
                      </motion.span>
                    ))}
                    {results.hardestCards.length > 6 && (
                      <span className="bg-transparent text-gray-400 px-2 py-1.5 md:py-2 text-[10px] md:text-xs font-bold">+ {results.hardestCards.length - 6} المزيد</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-emerald-100 dark:border-emerald-900/30 text-center">
                  <Trophy className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 mb-3 md:mb-4 opacity-50" />
                  <p className="text-sm md:text-base text-emerald-700 dark:text-emerald-400 font-bold">أداء مثالي! لا توجد أخطاء تذكر.</p>
                </div>
              )}
            </motion.div>

          </div>

          {/* Actions */}
          <motion.div
            custom={6} initial="hidden" animate="visible" variants={cardVariants}
            className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-3 md:gap-4"
          >
            <button
              onClick={onClose}
              className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg md:shadow-xl shadow-gray-900/20 flex items-center justify-center gap-2 md:gap-3 group"
            >
              <span>متابعة التعلم</span>
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleShare}
              className="flex-none bg-stone-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-6 py-3.5 md:px-8 md:py-5 rounded-xl md:rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {copied ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" /> : <Share2 className="w-4 h-4 md:w-5 md:h-5" />}
              <span>{copied ? 'تم النسخ!' : 'مشاركة'}</span>
            </button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};
