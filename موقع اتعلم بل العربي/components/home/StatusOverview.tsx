import React from 'react';
import { Clock, Lightbulb, Layers, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Card } from '../../types';
import { motion } from 'framer-motion';

interface StatusOverviewProps {
    t: any;
    recentCards: Card[];
    suggestedCards: Card[];
    onStartSession?: () => void;
}

export const StatusOverview: React.FC<StatusOverviewProps> = ({ t, recentCards, suggestedCards, onStartSession }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl shadow-lg border border-stone-200 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Clock className="text-blue-500" size={20} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                        {t.home?.recentActivity || 'النشاط الأخير'}
                    </h3>
                </div>
                <div className="space-y-3">
                    {recentCards.length > 0 ? (
                        recentCards.map((card, idx) => (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                            >
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                                    <Layers className="text-amber-600 dark:text-amber-400" size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white truncate">{card.frontText}</p>
                                    <p className="text-xs text-gray-400 truncate">{card.backText}</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Sparkles size={22} className="text-blue-400" />
                            </div>
                            <p className="font-bold text-gray-500 dark:text-gray-400">لا توجد بطاقات تمت مراجعتها بعد</p>
                            <p className="text-xs text-gray-400">ابدأ أول جلسة مراجعة لتظهر سجلاتك هنا</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Suggestions */}
            <div className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl shadow-lg border border-stone-200 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <Lightbulb className="text-yellow-500" size={20} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                        {t.home?.reviewSuggestions || 'اقتراحات للمراجعة'}
                    </h3>
                </div>
                <div className="space-y-3">
                    {suggestedCards.length > 0 ? (
                        suggestedCards.map((card, idx) => (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200/60 dark:border-amber-800/20"
                            >
                                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                                    <ArrowRight className="text-white" size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white truncate">{card.frontText}</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">جاهز للمراجعة</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                <CheckCircle size={22} className="text-green-500" />
                            </div>
                            <p className="font-bold text-gray-500 dark:text-gray-400">أنجزت كل مراجعاتك! 🎉</p>
                            {onStartSession && (
                                <button
                                    onClick={onStartSession}
                                    className="text-xs font-bold text-primary hover:underline mt-1"
                                >
                                    مرحبا! جاهز للمراجعة ←
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
