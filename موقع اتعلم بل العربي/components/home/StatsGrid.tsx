import React from 'react';
import { Target, Star, Flame, CheckCircle2 } from 'lucide-react';
import { Stats } from '../../types';

interface StatsGridProps {
    stats: Stats;
    dueCardsCount: number;
    t: any;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, dueCardsCount, t }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <div className="bg-white dark:bg-dark-card p-2 md:p-6 rounded-2xl shadow-lg border border-stone-200 dark:border-gray-700 hover:shadow-xl transition-shadow flex flex-col md:block items-center md:items-stretch text-center md:text-start justify-center">
                <div className="flex flex-col md:flex-row items-center justify-between mb-1 md:mb-3 gap-1">
                    <Target className="text-amber-500 w-5 h-5 md:w-8 md:h-8" />
                    <span className="text-lg md:text-3xl font-black text-gray-900 dark:text-white">{dueCardsCount}</span>
                </div>
                <p className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 line-clamp-1">بطاقات مستحقة</p>
            </div>

            <div className="bg-white dark:bg-dark-card p-2 md:p-6 rounded-2xl shadow-lg border border-stone-200 dark:border-gray-700 hover:shadow-xl transition-shadow flex flex-col md:block items-center md:items-stretch text-center md:text-start justify-center">
                <div className="flex flex-col md:flex-row items-center justify-between mb-1 md:mb-3 gap-1">
                    <Star className="text-yellow-500 w-5 h-5 md:w-8 md:h-8" />
                    <span className="text-lg md:text-3xl font-black text-gray-900 dark:text-white">{stats.successRate}%</span>
                </div>
                <p className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 line-clamp-1">{t.dashboard?.successRate || 'معدل النجاح'}</p>
            </div>

            <div className="bg-white dark:bg-dark-card p-2 md:p-6 rounded-2xl shadow-lg border border-stone-200 dark:border-gray-700 hover:shadow-xl transition-shadow flex flex-col md:block items-center md:items-stretch text-center md:text-start justify-center">
                <div className="flex flex-col md:flex-row items-center justify-between mb-1 md:mb-3 gap-1">
                    <Flame className="text-orange-500 w-5 h-5 md:w-8 md:h-8" />
                    <span className="text-lg md:text-3xl font-black text-gray-900 dark:text-white">{stats.streak}</span>
                </div>
                <p className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 line-clamp-1">{t.dashboard?.streak || 'السلسلة'}</p>
            </div>

            <div className="bg-white dark:bg-dark-card p-2 md:p-6 rounded-2xl shadow-lg border border-stone-200 dark:border-gray-700 hover:shadow-xl transition-shadow flex flex-col md:block items-center md:items-stretch text-center md:text-start justify-center">
                <div className="flex flex-col md:flex-row items-center justify-between mb-1 md:mb-3 gap-1">
                    <CheckCircle2 className="text-green-500 w-5 h-5 md:w-8 md:h-8" />
                    <span className="text-lg md:text-3xl font-black text-gray-900 dark:text-white">{stats.reviewedToday}</span>
                </div>
                <p className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 line-clamp-1">{t.dashboard?.reviewedToday || 'مراجعات'}</p>
            </div>
        </div>
    );
};
