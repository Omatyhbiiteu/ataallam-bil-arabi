import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Stats } from '../../types';

interface DailyProgressProps {
    stats: Stats;
    dailyGoal: number;
    t: any;
}

export const DailyProgress: React.FC<DailyProgressProps> = ({ stats, dailyGoal, t }) => {
    const dailyProgress = Math.min((stats.reviewedToday / dailyGoal) * 100, 100);

    return (
        <div className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl shadow-lg border border-stone-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <BarChart3 className="text-amber-500" size={28} />
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{t.home?.dailyProgress || 'التقدم اليومي'}</h3>
                </div>
                <span className="text-2xl font-black text-amber-500">{Math.round(dailyProgress)}%</span>
            </div>
            <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${dailyProgress}%` }}
                ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                {stats.reviewedToday} / {dailyGoal} {t.folders?.cardsCount || 'بطاقة'}
            </p>
        </div>
    );
};
