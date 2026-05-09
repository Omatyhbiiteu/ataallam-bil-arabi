import React from 'react';
import { Flame, Snowflake, Trophy } from 'lucide-react';
import { StreakData } from '../../types';
import { motion } from 'framer-motion';

interface StreakCounterProps {
    streakData: StreakData;
    onUseFreeze?: () => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ streakData, onUseFreeze }) => {
    const { current, longest, freezes, maxFreezes, history } = streakData;

    // Get last 7 days for mini calendar
    const last7Days = history.slice(-7);

    // Determine streak level (for styling)
    const getStreakLevel = (days: number) => {
        if (days >= 30) return { color: 'from-purple-500 to-pink-500', label: 'أسطوري' };
        if (days >= 14) return { color: 'from-amber-500 to-orange-500', label: 'ماسي' };
        if (days >= 7) return { color: 'from-blue-500 to-cyan-500', label: 'قوي' };
        return { color: 'from-gray-400 to-gray-500', label: 'جديد' };
    };

    const streakLevel = getStreakLevel(current);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            {/* Main Streak Display */}
            <div className={`bg-gradient-to-br ${streakLevel.color} rounded-3xl p-6 text-white shadow-xl overflow-hidden relative`}>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Flame size={24} className="animate-pulse" />
                            <span className="text-sm font-bold opacity-90 uppercase tracking-wider">{streakLevel.label}</span>
                        </div>
                        {longest > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                <Trophy size={14} />
                                <span className="font-bold">{longest} يوم</span>
                            </div>
                        )}
                    </div>

                    {/* Current Streak */}
                    <div className="text-center mb-6">
                        <motion.div
                            key={current}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-6xl font-black mb-2"
                        >
                            {current}
                        </motion.div>
                        <div className="text-lg font-bold opacity-90">يوم متتالي 🔥</div>
                    </div>

                    {/* Weekly Calendar */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {last7Days.map((day, i) => (
                            <div
                                key={i}
                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${day.completed
                                        ? day.frozen
                                            ? 'bg-blue-400 text-white'
                                            : 'bg-white text-gray-900'
                                        : 'bg-white/20 text-white/60'
                                    }`}
                                title={day.date}
                            >
                                {day.completed ? (day.frozen ? '❄️' : '✓') : '·'}
                            </div>
                        ))}
                    </div>

                    {/* Freeze Status */}
                    {freezes > 0 && (
                        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                            <div className="flex items-center gap-2">
                                <Snowflake size={18} />
                                <span className="text-sm font-bold">تجميدات متاحة</span>
                            </div>
                            <div className="flex gap-1">
                                {Array.from({ length: maxFreezes }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${i < freezes ? 'bg-white' : 'bg-white/30'
                                            }`}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Milestones (if close to achievement */}
            {current >= 5 && current < 7 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 text-center"
                >
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        {7 - current} أيام فقط للحصول على شارة "البداية القوية" 🥉
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};
