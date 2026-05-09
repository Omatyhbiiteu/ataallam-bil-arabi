import React from 'react';
import { Award, Map, Timer } from 'lucide-react';

interface LearningPathHeaderProps {
    t: any;
    totalTime: number;
    completedCount: number;
    totalLessonsCount: number;
    formatTimeSpent: (seconds: number) => string;
}

export const LearningPathHeader: React.FC<LearningPathHeaderProps> = ({
    t,
    totalTime,
    completedCount,
    totalLessonsCount,
    formatTimeSpent
}) => {
    const progressPercent = totalLessonsCount > 0
        ? Math.round((completedCount / totalLessonsCount) * 100)
        : 0;

    return (
        <header className="relative p-8 md:p-10 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 text-white shadow-xl">
            {/* Subtle Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {/* Accent lines */}
            <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-r from-amber-500 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-32 h-1 bg-gradient-to-l from-amber-500 to-transparent"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                <div className="text-center md:text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold mb-4 tracking-wider uppercase">
                        <Map size={14} /> {t.learningPath.title}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white">
                        {t.learningPath.headerTitle || 'المسار التعليمي'}
                    </h2>
                    <p className="text-slate-400 text-base max-w-xl leading-relaxed">
                        {t.learningPath.subtitle || 'تابع تقدمك وحقق أهدافك اللغوية خطوة بخطوة.'}
                    </p>
                </div>

                <div className="w-full md:w-auto space-y-4">
                    {/* Compact Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 px-4">
                            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Timer size={20} /></div>
                            <div>
                                <div className="text-xl font-bold font-mono">{formatTimeSpent(totalTime)}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest">{t.learningPath.statsTime || 'وقت التعلم'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4">
                            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Award size={20} /></div>
                            <div>
                                <div className="text-xl font-bold font-mono">{progressPercent}%</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest">{t.learningPath.statsProgress || 'التقدم الحالي'}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                    {completedCount} / {totalLessonsCount} {t.learningPath.lessonsLabel || 'دروس'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-1">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-400">
                            <span>{t.learningPath.statsProgress || 'التقدم الحالي'}</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-700"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
