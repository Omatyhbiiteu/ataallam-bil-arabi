import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface ActivityHeatmapProps {
    days?: number;
    data?: number[];
    t: any;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ days = 100, data, t }) => {
    const normalizedData = Array.isArray(data) ? data : [];
    const activityData = normalizedData.length >= days
        ? normalizedData.slice(normalizedData.length - days)
        : Array.from({ length: days - normalizedData.length }, () => 0).concat(normalizedData);

    const totalActiveDays = activityData.filter(v => v > 0).length;
    const isEmpty = totalActiveDays === 0;

    const getColor = (rawLevel: number) => {
        const level = Math.min(4, Math.max(0, Math.round(rawLevel)));
        switch (level) {
            case 0: return 'bg-stone-100 dark:bg-gray-800';
            case 1: return 'bg-primary/20';
            case 2: return 'bg-primary/40';
            case 3: return 'bg-primary/70';
            case 4: return 'bg-primary';
            default: return 'bg-stone-200 dark:bg-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    {t.dashboard?.activityConsistency || 'التزامك اليومي'}
                </h4>
                <div className="flex items-center gap-2">
                    {totalActiveDays > 0 && (
                        <span className="text-xs text-gray-400 font-bold bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                            {totalActiveDays} يوم نشيط
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
                        <span>أقل</span>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map(l => (
                                <div key={l} className={`w-2.5 h-2.5 rounded-sm ${getColor(l)}`} />
                            ))}
                        </div>
                        <span>أكثر</span>
                    </div>
                </div>
            </div>

            {isEmpty ? (
                /* ── Empty State ── */
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-10 gap-4"
                >
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <Flame size={28} className="text-amber-400" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-gray-600 dark:text-gray-300 text-base">ابدأ رحلتك اليوم! 🚀</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            راجع بطاقة واحدة وستضيء أول خلية في خريطتك
                        </p>
                    </div>
                    {/* Faded preview grid */}
                    <div className="grid grid-flow-col grid-rows-7 gap-1.5 opacity-20 pointer-events-none select-none">
                        {activityData.slice(0, 49).map((_, i) => (
                            <div key={i} className="w-3.5 h-3.5 rounded-[3px] bg-stone-300 dark:bg-gray-700" />
                        ))}
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-4 no-scrollbar">
                    {activityData.map((level, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.004 }}
                            className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[3px] ${getColor(level)} transition-all duration-300 hover:ring-2 hover:ring-primary/50 cursor-pointer`}
                            title={`نشاط المستوى ${level}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
