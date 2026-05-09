import React from 'react';
import { Module, Lesson } from '../../types';
import { ChevronDown, FileText } from 'lucide-react';
import { LessonItem } from './LessonItem';

interface ModuleListProps {
    curriculum: Module[];
    expandedModuleId: string | null;
    completedLessonIds: string[];
    allLessons: Lesson[];
    bookmarkedLessons: string[];
    toggleModule: (moduleId: string) => void;
    isLessonLocked: (index: number) => boolean;
    getLessonTime: (lessonId: string) => number;
    handleStartLesson: (lesson: Lesson, index: number) => void;
    formatTimeSpent: (seconds: number) => string;
    dir?: string;
    t: any;
}

export const ModuleList: React.FC<ModuleListProps> = ({
    curriculum,
    expandedModuleId,
    completedLessonIds,
    allLessons,
    bookmarkedLessons,
    toggleModule,
    isLessonLocked,
    getLessonTime,
    handleStartLesson,
    formatTimeSpent,
    dir = 'rtl',
    t
}) => {
    return (
        <div className="max-w-4xl mx-auto pb-24">
            {curriculum.map((module, mIdx) => {
                const moduleLessons = module.lessons || [];
                const firstLessonIndex = allLessons.findIndex(l => l.id === moduleLessons[0]?.id);
                const completedCount = moduleLessons.filter(l => completedLessonIds.includes(l.id)).length;
                const totalCount = moduleLessons.length;
                const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                const isExpanded = expandedModuleId === module.id;
                const isModuleStarted = completedCount > 0;

                return (
                    <div key={module.id} className="mb-8 last:mb-0 relative">
                    {/* Module Header Node (Clickable) */}
                    <button
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`module-${module.id}`}
                        className="w-full flex items-start gap-4 md:gap-8 relative z-10 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 rounded-2xl"
                    >
                        {/* Timeline Column (Fixed Width for Alignment) */}
                        <div className="flex flex-col items-center flex-shrink-0 w-12 md:w-20">
                            <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl font-black shadow-xl z-20 relative transition-all duration-300
                                    ${progress === 100
                                        ? 'bg-emerald-500 text-white'
                                        : isExpanded
                                            ? 'bg-slate-900 border border-amber-500 text-amber-500 shadow-amber-500/20'
                                            : 'bg-slate-900 border border-slate-700 text-slate-500 hover:border-amber-500/50 hover:text-amber-500/80'
                                    }`}>
                                {mIdx + 1}
                            </div>
                            {/* Header Tail Line */}
                            <div className={`w-1 flex-grow min-h-[2rem] transition-colors duration-500
                                    ${isExpanded ? (isModuleStarted ? 'bg-emerald-500/50' : 'bg-slate-200 dark:bg-slate-800') : 'bg-transparent'}
                                `}></div>
                        </div>

                        <div className="flex-grow pt-1 md:pt-2 pb-8">
                            <h3 className={`text-lg md:text-2xl font-black mb-1 md:mb-2 transition-colors ${isExpanded ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`}>
                                {module.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <FileText size={14} />
                                    {totalCount} {t.learningPath.lessonsLabel || 'دروس'}
                                </span>
                                {progress > 0 && (
                                    <span className="text-emerald-500 font-bold">
                                        {Math.round(progress)}% {t.learningPath.completed || 'مكتمل'}
                                    </span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full border transition-all inline-flex items-center gap-1
                                        ${isExpanded
                                            ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-500'
                                            : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}>
                                    {isExpanded ? (t.learningPath.hideLessons || 'إخفاء الدروس') : (t.learningPath.showLessons || 'عرض الدروس')}
                                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </span>
                            </div>
                            <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </button>

                    {/* Collapsible Lessons Timeline */}
                    <div
                        id={`module-${module.id}`}
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                            {moduleLessons.map((lesson, localIndex) => {
                                const index = firstLessonIndex + localIndex;
                                const isLocked = isLessonLocked(index);
                                const isCompleted = completedLessonIds.includes(lesson.id);
                                const isBookmarked = bookmarkedLessons.includes(lesson.id);
                                const lessonTime = getLessonTime(lesson.id);
                                const isLastLesson = localIndex === moduleLessons.length - 1;

                                return (
                                    <div key={lesson.id} className="flex gap-4 md:gap-8">
                                        {/* Timeline Column */}
                                        <div className="flex flex-col items-center flex-shrink-0 w-12 md:w-20">
                                            {/* Node */}
                                            <div className={`w-4 h-4 md:w-6 md:h-6 rounded-full border-4 z-10 transition-all duration-300 box-content
                                                ${isCompleted
                                                    ? 'bg-emerald-500 border-emerald-100 dark:border-emerald-900'
                                                    : isLocked
                                                        ? 'bg-slate-300 dark:bg-slate-700 border-slate-100 dark:border-slate-800'
                                                        : 'bg-amber-500 border-amber-100 dark:border-amber-900 animate-pulse'
                                                }
                                            `} />

                                            {/* Connecting Line (to next item) */}
                                            {!isLastLesson && (
                                                <div className={`w-1 flex-grow min-h-[4rem] transition-colors duration-500
                                                    ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}
                                                `} />
                                            )}
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex-grow pb-8">
                                            <LessonItem
                                                lesson={lesson}
                                                index={index}
                                                isLocked={isLocked}
                                                isCompleted={isCompleted}
                                                isBookmarked={isBookmarked}
                                                lessonTime={lessonTime}
                                                dir={dir}
                                                onStart={handleStartLesson}
                                                formatTimeSpent={formatTimeSpent}
                                                t={t}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
