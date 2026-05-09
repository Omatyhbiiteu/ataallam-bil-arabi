import React from 'react';
import { Lock, CheckCircle, PlayCircle, Clock, ArrowRight, Bookmark, Brain } from 'lucide-react';
import { Lesson } from '../../types';

interface LessonItemProps {
    lesson: Lesson;
    index: number;
    isLocked: boolean;
    isCompleted: boolean;
    isBookmarked: boolean;
    lessonTime: number;
    dir?: string;
    onStart: (lesson: Lesson, index: number) => void;
    formatTimeSpent: (seconds: number) => string;
    t: any;
}

export const LessonItem: React.FC<LessonItemProps> = ({
    lesson,
    index,
    isLocked,
    isCompleted,
    isBookmarked,
    lessonTime,
    dir = 'rtl',
    onStart,
    formatTimeSpent,
    t
}) => {
    const actionLabel = isCompleted
        ? (t.learningPath.completed || 'مكتمل')
        : lessonTime > 0
            ? (t.learningPath.continue || 'متابعة')
            : (t.learningPath.start || 'ابدأ الدرس');

    return (
        <div
            onClick={() => {
                if (isLocked) return;
                onStart(lesson, index);
            }}
            onKeyDown={(event) => {
                if (isLocked) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onStart(lesson, index);
                }
            }}
            className={`group relative p-6 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40
            ${isLocked
                    ? 'border-slate-100 dark:border-slate-800 opacity-70 cursor-not-allowed'
                    : isCompleted
                        ? 'border-emerald-100 dark:border-emerald-900/30 shadow-sm hover:shadow-md cursor-pointer'
                        : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-amber-500/50 hover:-translate-y-1 cursor-pointer'
                }`}
            role="button"
            tabIndex={isLocked ? -1 : 0}
            aria-disabled={isLocked}
        >
            {isBookmarked && (
                <div className={`absolute -top-2 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>
                    <Bookmark size={20} className="text-amber-500 fill-current" />
                </div>
            )}

            <div className="flex items-start gap-4 md:gap-6">
                {/* Icon Box */}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors duration-300
                    ${isLocked
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
                    }`}>
                    {isLocked ? <Lock size={20} /> : isCompleted ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                </div>

                {/* Content */}
                <div className="flex-grow pt-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <h4 className={`font-bold text-lg heading-font ${isLocked ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {lesson.title}
                        </h4>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                                {lesson.duration}
                            </span>
                            {lessonTime > 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-blue-500">
                                    <Clock size={12} /> {formatTimeSpent(lessonTime)}
                                </span>
                            )}
                            {lesson.questions && lesson.questions.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800 uppercase tracking-tighter">
                                    <Brain size={12} /> {t.learningPath.quiz || 'اختبار'}
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                        {lesson.description}
                    </p>

                    {/* Action Footer */}
                    {!isLocked && (
                        <div className="mt-4 flex items-center justify-end">
                            <span className={`text-sm font-bold flex items-center gap-1 transition-colors
                                ${isCompleted ? 'text-emerald-600' : 'text-amber-600 group-hover:text-amber-500'}`}>
                                {actionLabel}
                                <ArrowRight size={16} className={`transition-transform duration-300 ${dir === 'rtl' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
