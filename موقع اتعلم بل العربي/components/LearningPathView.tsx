import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { Module, Lesson } from '../types';
import { LearningPathHeader } from './learning-path/LearningPathHeader';
import { ModuleList } from './learning-path/ModuleList';
import { LessonView } from './learning-path/LessonView';
import { LessonProvider } from './learning-path/context/LessonContext';
import { LevelSelector } from './learning-path/LevelSelector';
import { translations } from '../utils/translations';
import { speakText } from '../services/ttsService';
import { Heart, Flame, Coins } from 'lucide-react';

interface LearningPathViewProps {
    t: any;
    curriculum: Module[];
    completedLessonIds: string[];
    onCompleteLesson: (lessonId: string, score?: number) => void;
    dir?: string;
    learningLang: 'en' | 'de';
    isProSubscriber?: boolean;
    onRequirePro?: (message: string) => void;
}

interface Note {
    id: string;
    lessonId: string;
    content: string;
    timestamp: number;
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const normalizeLevel = (level?: string) => (level || '').trim().toUpperCase();

export const LearningPathView: React.FC<LearningPathViewProps> = ({
    t: parentT,
    curriculum,
    completedLessonIds,
    onCompleteLesson,
    dir = 'rtl',
    learningLang,
    isProSubscriber = true,
    onRequirePro,
}) => {
    // State - Filtering
    const [selectedLevel, setSelectedLevel] = useState<string>('A1');
    const [selectedSubLevel, setSelectedSubLevel] = useState<string>('A1.1');

    // State - Logic
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [lessonStartTime, setLessonStartTime] = useState<number | null>(null);
    const [notes, setNotes] = useState<Note[]>(() => {
        const saved = localStorage.getItem('learning_notes');
        return saved ? JSON.parse(saved) : [];
    });
    const [bookmarkedLessons, setBookmarkedLessons] = useState<string[]>(() => {
        const saved = localStorage.getItem('bookmarked_lessons');
        return saved ? JSON.parse(saved) : [];
    });
    const [lessonRatings, setLessonRatings] = useState<Record<string, { rating: number, comment?: string }>>(() => {
        const saved = localStorage.getItem('lesson_ratings');
        return saved ? JSON.parse(saved) : {};
    });
    const [levelCongratsModal, setLevelCongratsModal] = useState<{ completedLevel: string; nextLevel: string } | null>(null);
    const [finalPathCongratsModal, setFinalPathCongratsModal] = useState(false);
    /** null = لم نُهيأ بعد (تجاهل أول تشغيل لتجنّب مودال عند فتح الصفحة والمسار مكتمل مسبقاً) */
    const prevSequentialCountRef = useRef<number | null>(null);
    const sequentialIdsLatestRef = useRef<string[]>([]);
    const levelAdvanceTimerRef = useRef<number>(0);

    // State - Gamification
    const [streak, setStreak] = useState<number>(() => {
        const saved = localStorage.getItem('gamification_streak');
        return saved ? parseInt(saved) : 12; // Default starting value for demo
    });
    const [hearts, setHearts] = useState<number>(() => {
        const saved = localStorage.getItem('gamification_hearts');
        return saved ? parseInt(saved) : 5; // Default max hearts
    });
    const [coins, setCoins] = useState<number>(() => {
        const saved = localStorage.getItem('gamification_coins');
        return saved ? parseInt(saved) : 450;
    });

    // Derived State
    const allLessons = useMemo(() => curriculum.flatMap(m => m.lessons), [curriculum]);
    const orderedLessonsWithLevel = useMemo(
        () =>
            curriculum.flatMap((module) =>
                (module.lessons || []).map((lesson) => ({
                    id: lesson.id,
                    level: module.level || 'A1',
                }))
            ),
        [curriculum]
    );
    const activeLessonIndex = useMemo(() => allLessons.findIndex(l => l.id === activeLessonId), [allLessons, activeLessonId]);
    const activeLesson = activeLessonId ? allLessons.find(l => l.id === activeLessonId) : null;
    const currentLessonNotes = useMemo(() => activeLessonId ? notes.filter(n => n.lessonId === activeLessonId) : [], [notes, activeLessonId]);
    const sequentialCompletedLessonIds = useMemo(() => {
        const completed = new Set(completedLessonIds);
        const ordered: string[] = [];
        for (const lesson of orderedLessonsWithLevel) {
            if (!completed.has(lesson.id)) break;
            ordered.push(lesson.id);
        }
        return ordered;
    }, [orderedLessonsWithLevel, completedLessonIds]);
    const sequentialCompletedCount = sequentialCompletedLessonIds.length;

    sequentialIdsLatestRef.current = sequentialCompletedLessonIds;

    /** للمجاني: ثبّت اختيار المستوى على الوحدة الوحيدة المعروضة حتى لا يختار مستوى فارغ. */
    useEffect(() => {
        if (isProSubscriber || !curriculum.length) return;
        const m = curriculum[0];
        const lvl = (m.level || 'A1').trim();
        const sub = (m.subLevel && m.subLevel.trim() !== '' ? m.subLevel : `${lvl}.1`).trim();
        setSelectedLevel(lvl);
        setSelectedSubLevel(sub);
    }, [isProSubscriber, curriculum]);

    // Filtered Curriculum
    const filteredCurriculum = useMemo(() => {
        return curriculum.filter(module =>
            (module.level === selectedLevel || (!module.level && selectedLevel === 'A1')) &&
            (module.subLevel === selectedSubLevel || (!module.subLevel && selectedSubLevel === 'A1.1'))
        );
    }, [curriculum, selectedLevel, selectedSubLevel]);

    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(filteredCurriculum[0]?.id || null);

    // Update expanded module when filter changes
    useEffect(() => {
        if (filteredCurriculum.length > 0) {
            setExpandedModuleId(filteredCurriculum[0].id);
        } else {
            setExpandedModuleId(null);
        }
    }, [selectedLevel, selectedSubLevel]); // Removed filteredCurriculum from deps to avoid loop if object ref changes, though useMemo handles it. 
    // Actually better to depend just on selector changes or rely on filteredCurriculum if stable.

    // Effects
    useEffect(() => {
        const timer = setInterval(() => {
            if (activeLessonId && document.visibilityState === 'visible') {
                setElapsedTime(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [activeLessonId]);

    useEffect(() => {
        if (activeLessonId) {
            setLessonStartTime(Date.now());
        }
    }, [activeLessonId]);

    useEffect(() => {
        localStorage.setItem('learning_notes', JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        localStorage.setItem('bookmarked_lessons', JSON.stringify(bookmarkedLessons));
    }, [bookmarkedLessons]);

    useEffect(() => {
        localStorage.setItem('lesson_ratings', JSON.stringify(lessonRatings));
    }, [lessonRatings]);

    // Gamification Effects
    useEffect(() => {
        localStorage.setItem('gamification_streak', streak.toString());
        localStorage.setItem('gamification_hearts', hearts.toString());
        localStorage.setItem('gamification_coins', coins.toString());
    }, [streak, hearts, coins]);

    useEffect(() => {
        if (prevSequentialCountRef.current === null) {
            prevSequentialCountRef.current = sequentialCompletedCount;
            return;
        }
        if (sequentialCompletedCount < prevSequentialCountRef.current) {
            prevSequentialCountRef.current = sequentialCompletedCount;
            return;
        }
        if (sequentialCompletedCount === prevSequentialCountRef.current) {
            return;
        }
        prevSequentialCountRef.current = sequentialCompletedCount;

        const seqIds = sequentialIdsLatestRef.current;
        const completedAfter = new Set(seqIds);
        const completedBefore = new Set(seqIds.slice(0, -1));
        const totalOrderedLessons = orderedLessonsWithLevel.length;

        if (totalOrderedLessons > 0 && sequentialCompletedCount === totalOrderedLessons) {
            const finalCongratsKey = `learning_path_final_congrats_seen_${learningLang}_${totalOrderedLessons}`;
            const alreadyShown = localStorage.getItem(finalCongratsKey) === '1';
            if (!alreadyShown) {
                localStorage.setItem(finalCongratsKey, '1');
                setFinalPathCongratsModal(true);
            }
            return;
        }

        for (let i = 0; i < LEVEL_ORDER.length - 1; i++) {
            const level = LEVEL_ORDER[i];
            const levelLessons = orderedLessonsWithLevel.filter((x) => normalizeLevel(x.level) === level);
            if (levelLessons.length === 0) continue;

            const isLevelCompleted = levelLessons.every((x) => completedAfter.has(x.id));
            const wasLevelCompletedBefore = levelLessons.every((x) => completedBefore.has(x.id));
            if (!isLevelCompleted || wasLevelCompletedBefore) continue;

            const nextLevel = LEVEL_ORDER
                .slice(i + 1)
                .find((candidate) => orderedLessonsWithLevel.some((x) => normalizeLevel(x.level) === candidate));
            if (!nextLevel) continue;

            if (!isProSubscriber) {
                onRequirePro?.('إكمال المستويات والانتقال للمسار الكامل متاح لمشتركي برو. ترقّى للمتابعة من A2 فما فوق.');
                return;
            }

            setLevelCongratsModal({ completedLevel: level, nextLevel });
            const firstNextSubLevel = curriculum.find((m) => normalizeLevel(m.level) === nextLevel)?.subLevel || `${nextLevel}.1`;

            if (levelAdvanceTimerRef.current) {
                window.clearTimeout(levelAdvanceTimerRef.current);
            }
            levelAdvanceTimerRef.current = window.setTimeout(() => {
                setSelectedLevel(nextLevel);
                setSelectedSubLevel(firstNextSubLevel);
                setLevelCongratsModal(null);
                levelAdvanceTimerRef.current = 0;
            }, 2200);
            return;
        }
    }, [curriculum, orderedLessonsWithLevel, sequentialCompletedCount, learningLang, isProSubscriber, onRequirePro]);

    useEffect(() => {
        return () => {
            if (levelAdvanceTimerRef.current) {
                window.clearTimeout(levelAdvanceTimerRef.current);
                levelAdvanceTimerRef.current = 0;
            }
        };
    }, []);

    // Handlers
    const toggleModule = (moduleId: string) => {
        setExpandedModuleId(prev => prev === moduleId ? null : moduleId);
    };

    const handleStartLesson = (lesson: Lesson, index: number) => {
        if (isLessonLocked(index)) return;
        setActiveLessonId(lesson.id);
        setElapsedTime(0);
    };

    const handleAddNote = (content: string) => {
        if (!activeLessonId) return;
        const newNote: Note = {
            id: Date.now().toString(),
            lessonId: activeLessonId,
            content,
            timestamp: Date.now()
        };
        setNotes(prev => [newNote, ...prev]);
    };

    const handleDeleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const handleToggleBookmark = () => {
        if (!activeLessonId) return;
        setBookmarkedLessons(prev =>
            prev.includes(activeLessonId)
                ? prev.filter(id => id !== activeLessonId)
                : [...prev, activeLessonId]
        );
    };

    const handleRateLesson = (rating: number) => {
        if (!activeLessonId) return;
        setLessonRatings(prev => ({
            ...prev,
            [activeLessonId]: { rating }
        }));
    };

    const dismissLevelCongratsAndAdvance = useCallback(() => {
        setLevelCongratsModal((modal) => {
            if (!modal) return null;
            if (levelAdvanceTimerRef.current) {
                window.clearTimeout(levelAdvanceTimerRef.current);
                levelAdvanceTimerRef.current = 0;
            }
            const { nextLevel } = modal;
            const firstNextSubLevel =
                curriculum.find((m) => normalizeLevel(m.level) === nextLevel)?.subLevel || `${nextLevel}.1`;
            setSelectedLevel(nextLevel);
            setSelectedSubLevel(firstNextSubLevel);
            return null;
        });
    }, [curriculum]);

    // Helpers
    const isLessonLocked = (index: number) => index > sequentialCompletedCount;

    const getLessonTime = (lessonId: string) => {
        if (lessonId === activeLessonId) return elapsedTime;
        return 0;
    };

    const getTotalTimeSpent = () => {
        return 12500;
    };

    const formatTimeSpent = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // View
    if (activeLessonId && activeLesson) {
        return (
            <LessonProvider
                activeLesson={activeLesson}
                activeLessonIndex={activeLessonIndex}
                timeSpent={elapsedTime}
                isBookmarked={bookmarkedLessons.includes(activeLessonId)}
                lessonNotes={currentLessonNotes}
                lessonRating={lessonRatings[activeLessonId]}
                onClose={() => setActiveLessonId(null)}
                onPrevLesson={() => {
                    const prevIndex = activeLessonIndex - 1;
                    if (prevIndex >= 0) setActiveLessonId(allLessons[prevIndex].id);
                }}
                onToggleBookmark={handleToggleBookmark}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onComplete={(lessonId, score) => {
                    const lessonIdx = allLessons.findIndex((l) => l.id === lessonId);
                    if (lessonIdx < 0 || lessonIdx > sequentialCompletedCount) {
                        return;
                    }
                    // Gamification Rewards
                    const baseCoins = 10;
                    const bonusCoins = score ? Math.floor(score / 10) : 0;
                    setCoins(prev => prev + baseCoins + bonusCoins);

                    // Call original handler
                    onCompleteLesson(lessonId, score);
                }}
                onRateLesson={handleRateLesson}
                speakText={(text) => speakText(text, learningLang)}
                t={parentT}
                dir={dir}
                formatTimeSpent={formatTimeSpent}
            >
                <LessonView />
            </LessonProvider>
        );
    }

    return (
        <div className="p-4 md:p-8 animate-slide-up pb-24 max-w-[1700px] mx-auto min-h-screen space-y-10">
            {levelCongratsModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-slate-900/95 shadow-2xl p-7 text-center">
                        <div className="text-5xl mb-3">🎉</div>
                        <h3 className="text-2xl font-black text-white mb-2">مبروك! أنهيت مستوى {levelCongratsModal.completedLevel}</h3>
                        <p className="text-amber-300 font-bold mb-5">
                            جاري نقلك تلقائياً إلى المستوى التالي: {levelCongratsModal.nextLevel}
                        </p>
                        <button
                            type="button"
                            onClick={dismissLevelCongratsAndAdvance}
                            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black transition-colors"
                        >
                            متابعة الآن
                        </button>
                    </div>
                </div>
            )}
            {finalPathCongratsModal && (
                <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-3xl border border-emerald-400/30 bg-slate-900/95 shadow-2xl p-8 text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
                            برافو عليك! أنهيت كل مستويات المسار 🎉
                        </h3>
                        <p className="text-emerald-300 font-bold leading-relaxed mb-6">
                            لأنك مستسلمتش وكمّلت للآخر، دلوقتي أنت جاهز تاخد خطوة جديدة في حياتك وتستخدم اللغة بثقة أكبر.
                        </p>
                        <button
                            type="button"
                            onClick={() => setFinalPathCongratsModal(false)}
                            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black transition-colors"
                        >
                            كمّل يا بطل 🚀
                        </button>
                    </div>
                </div>
            )}
            <LearningPathHeader
                t={parentT}
                totalTime={getTotalTimeSpent()}
                completedCount={sequentialCompletedCount}
                totalLessonsCount={allLessons.length}
                formatTimeSpent={formatTimeSpent}
            />

            {/* Gamification Stats Row */}
            <div className="flex justify-center items-center gap-4 md:gap-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-4xl mx-auto -mt-4 relative z-20">
                {/* Streak */}
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800/50">
                    <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={24} />
                    <div className="flex flex-col">
                        <span className="text-orange-700 dark:text-orange-400 font-bold text-lg leading-none">{streak}</span>
                        <span className="text-[10px] text-orange-600/70 dark:text-orange-500/70 font-bold uppercase tracking-wider">أيام حماس</span>
                    </div>
                </div>

                {/* Hearts / Lives */}
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl border border-rose-200 dark:border-rose-800/50">
                    <Heart className="text-rose-500 fill-rose-500" size={24} />
                    <div className="flex flex-col">
                        <span className="text-rose-700 dark:text-rose-400 font-bold text-lg leading-none">{hearts}</span>
                        <span className="text-[10px] text-rose-600/70 dark:text-rose-500/70 font-bold uppercase tracking-wider">قلوب</span>
                    </div>
                </div>

                {/* Coins */}
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
                    <Coins className="text-amber-500 fill-amber-500" size={24} />
                    <div className="flex flex-col">
                        <span className="text-amber-700 dark:text-amber-400 font-bold text-lg leading-none">{coins}</span>
                        <span className="text-[10px] text-amber-600/70 dark:text-amber-500/70 font-bold uppercase tracking-wider">عملة</span>
                    </div>
                </div>
            </div>

            {isProSubscriber ? (
                <LevelSelector
                    selectedLevel={selectedLevel}
                    selectedSubLevel={selectedSubLevel}
                    onSelectLevel={setSelectedLevel}
                    onSelectSubLevel={setSelectedSubLevel}
                />
            ) : (
                <div className="w-full max-w-4xl mx-auto mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-900/20 px-4 py-3 text-center">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                        الخطة المجانية تشمل <span className="underline">الوحدة الأولى</span> من المسار فقط. اشترك في برو لفتح باقي الوحدات والمستويات.
                    </p>
                    {onRequirePro && (
                        <button
                            type="button"
                            onClick={() =>
                                onRequirePro('افتح المسار الكامل وجميع المستويات مع اشتراك برو.')
                            }
                            className="mt-3 text-xs font-black text-amber-700 dark:text-amber-300 underline hover:no-underline"
                        >
                            عرض خطط الاشتراك
                        </button>
                    )}
                </div>
            )}
            {filteredCurriculum.length > 0 ? (
                <ModuleList
                    curriculum={filteredCurriculum}
                    expandedModuleId={expandedModuleId}
                    completedLessonIds={sequentialCompletedLessonIds}
                    allLessons={allLessons}
                    bookmarkedLessons={bookmarkedLessons}
                    toggleModule={toggleModule}
                    isLessonLocked={isLessonLocked}
                    getLessonTime={getLessonTime}
                    handleStartLesson={handleStartLesson}
                    formatTimeSpent={formatTimeSpent}
                    dir={dir}
                    t={parentT}
                />
            ) : (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">لا توجد دروس متاحة لهذا المستوى حالياً.</p>
                </div>
            )}
        </div>
    );
};
