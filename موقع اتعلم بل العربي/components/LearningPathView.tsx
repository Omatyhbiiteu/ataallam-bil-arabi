import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Module, Lesson } from '../types';
import { LearningPathHeader } from './learning-path/LearningPathHeader';
import { ModuleList } from './learning-path/ModuleList';
import { LessonView } from './learning-path/LessonView';
import { LessonProvider } from './learning-path/context/LessonContext';
import { LevelSelector } from './learning-path/LevelSelector';
import { translations } from '../utils/translations';
import { speakText } from '../services/ttsService';
import { LessonRatingsAPI } from '../services/apiClient';
import { Heart, Flame, Coins, Trophy, ArrowRight, Star, Zap, CheckCircle } from 'lucide-react';

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
                    subLevel: module.subLevel || 'A1.1',
                    moduleId: module.id
                }))
            ),
        [curriculum]
    );
    const activeLessonIndex = useMemo(() => allLessons.findIndex(l => l.id === activeLessonId), [allLessons, activeLessonId]);
    const activeLesson = activeLessonId ? allLessons.find(l => l.id === activeLessonId) : null;
    const activeLessonModule = useMemo(
        () => activeLessonId ? curriculum.find(module => (module.lessons || []).some(lesson => lesson.id === activeLessonId)) : null,
        [activeLessonId, curriculum]
    );
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

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('hcard_user_token');
            if (!token) return;

            try {
                const res = await LessonRatingsAPI.getMine(learningLang) as { ratings?: Array<{ lessonId: string; rating: number }> };
                if (cancelled || !Array.isArray(res?.ratings)) return;

                setLessonRatings(prev => {
                    const next = { ...prev };
                    for (const item of res.ratings || []) {
                        if (!item?.lessonId || typeof item.rating !== 'number') continue;
                        next[item.lessonId] = { rating: item.rating };
                    }
                    return next;
                });
            } catch (error) {
                console.warn('Lesson ratings sync skipped:', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [learningLang]);

    useEffect(() => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('hcard_user_token');
        if (!token || !curriculum.length) return;

        const syncKey = `lesson_ratings_synced_${learningLang}`;
        if (sessionStorage.getItem(syncKey) === 'true') return;
        sessionStorage.setItem(syncKey, 'true');

        const lessonLookup = new Map<string, { lesson: Lesson; module: Module }>();
        for (const module of curriculum) {
            for (const lesson of module.lessons || []) {
                lessonLookup.set(lesson.id, { lesson, module });
            }
        }

        Object.entries(lessonRatings).forEach(([lessonId, value]) => {
            const rating = Number(value?.rating);
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;

            const found = lessonLookup.get(lessonId);
            void LessonRatingsAPI.save({
                lang: learningLang,
                lessonId,
                rating,
                lessonTitle: found?.lesson.title,
                moduleId: found?.module.id,
                moduleTitle: found?.module.title,
            }).catch((error) => {
                console.warn('Lesson rating backfill skipped:', error);
            });
        });
    }, [curriculum, learningLang, lessonRatings]);

    // Gamification Effects
    useEffect(() => {
        localStorage.setItem('gamification_streak', streak.toString());
        localStorage.setItem('gamification_hearts', hearts.toString());
        localStorage.setItem('gamification_coins', coins.toString());
    }, [streak, hearts, coins]);

    // تتم معالجة الانتقال للمستوى التالي من خلال onComplete في LessonProvider

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
        const lessonId = activeLessonId;
        setLessonRatings(prev => ({
            ...prev,
            [lessonId]: { rating }
        }));

        const token = localStorage.getItem('auth_token') || localStorage.getItem('hcard_user_token');
        if (!token) return;

        void LessonRatingsAPI.save({
            lang: learningLang,
            lessonId,
            rating,
            lessonTitle: activeLesson?.title,
            moduleId: activeLessonModule?.id,
            moduleTitle: activeLessonModule?.title,
        }).catch((error) => {
            console.warn('Lesson rating saved locally only:', error);
        });
    };

    const dismissLevelCongratsAndAdvance = useCallback(() => {
        setLevelCongratsModal(null);
    }, []);

    // Helpers
    const isLessonLocked = (index: number) => index > sequentialCompletedCount;

    const getLessonTime = (lessonId: string) => {
        if (lessonId === activeLessonId) return elapsedTime;
        return 0;
    };

    const getTotalTimeSpent = () => {
        return 12500; // Mock total time
    };

    const formatTimeSpent = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const modals = (
        <>
            {/* ═══ مودال إتمام المستوى — أسلوب تسويقي مصري احترافي ═══ */}
            <AnimatePresence>
            {levelCongratsModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)' }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="w-full max-w-md text-center relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(160deg, #0c0a1e 0%, #1a1040 50%, #0c0a1e 100%)',
                            borderRadius: '2.5rem',
                            border: '1px solid rgba(250,204,21,0.25)',
                            boxShadow: '0 0 100px rgba(250,204,21,0.2), 0 0 40px rgba(139,92,246,0.3), 0 30px 80px rgba(0,0,0,0.6)'
                        }}
                    >
                        <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '2.5rem', overflow: 'hidden' }}>
                            <div className="absolute -top-16 right-0 left-0 h-40 opacity-30"
                                style={{ background: 'linear-gradient(180deg, rgba(250,204,21,0.3) 0%, transparent 100%)' }} />
                            <div className="absolute top-1/3 -left-20 w-60 h-60 rounded-full opacity-15"
                                style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
                            <div className="absolute bottom-0 -right-10 w-60 h-60 rounded-full opacity-10"
                                style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
                        </div>

                        <div className="relative p-8">
                            <motion.div
                                initial={{ scale: 0, y: -20 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
                                className="mx-auto mb-5 w-24 h-24 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
                                    boxShadow: '0 0 50px rgba(250,204,21,0.5), 0 0 100px rgba(250,204,21,0.2)'
                                }}
                            >
                                <Trophy size={44} className="text-white drop-shadow-xl" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="flex justify-center gap-1.5 mb-4"
                            >
                                {[0,1,2,3,4].map(i => (
                                    <motion.div key={i}
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.25 + i * 0.07, type: 'spring' }}
                                    >
                                        <Star size={22} className="fill-yellow-400 text-yellow-400" />
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-4"
                                style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.35)', color: '#fbbf24' }}
                            >
                                <Flame size={11} className="fill-current" />
                                مستوى مكتمل
                            </motion.div>

                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="text-3xl font-black text-white mb-2"
                            >
                                عاش يا نجم! 🎯
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-base font-bold mb-1"
                                style={{ color: 'rgba(253,230,138,0.9)' }}
                            >
                                راجعت كويس وخلّصت مستوى{' '}
                                <span className="text-white text-xl font-black">{levelCongratsModal.completedLevel}</span>
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.45 }}
                                className="text-sm font-bold mb-6"
                                style={{ color: 'rgba(196,181,253,0.8)' }}
                            >
                                جهّز نفسك للمستوى التالي:{' '}
                                <span className="font-black text-yellow-300 text-base">{levelCongratsModal.nextLevel} 🚀</span>
                                <span className="block mt-2 text-xs leading-relaxed" style={{ color: 'rgba(250,204,21,0.9)' }}>
                                    💡 <strong className="text-yellow-400">ملحوظة هامة:</strong> لازم تراجع كلمات وقواعد المستوى ده كويس جداً قبل ما تدخل وتكمّل في المستوى اللي بعده عشان تبني أساس قوي!
                                </span>
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.48 }}
                                className="flex justify-center gap-5 p-4 rounded-2xl mb-6"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                            >
                                <div className="text-center">
                                    <div className="text-xl font-black text-yellow-400">{coins} 🪙</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(196,181,253,0.65)' }}>عملتك</div>
                                </div>
                                <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
                                <div className="text-center">
                                    <div className="text-xl font-black text-orange-400">{streak} 🔥</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(196,181,253,0.65)' }}>يوم متتالي</div>
                                </div>
                                <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
                                <div className="text-center">
                                    <div className="text-xl font-black text-emerald-400">{sequentialCompletedCount} ✅</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(196,181,253,0.65)' }}>درس أكملته</div>
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={dismissLevelCongratsAndAdvance}
                                className="w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 text-gray-900"
                                style={{
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    boxShadow: '0 8px 40px rgba(251,191,36,0.45)'
                                }}
                            >
                                <Zap size={22} className="fill-gray-900" />
                                إغلاق ومتابعة 🚀
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* ═══ مودال إتمام المسار كامل — Ultimate ═══ */}
            <AnimatePresence>
            {finalPathCongratsModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[125] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                        className="w-full max-w-lg text-center relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
                            borderRadius: '2.5rem',
                            border: '1px solid rgba(52,211,153,0.3)',
                            boxShadow: '0 0 100px rgba(16,185,129,0.4), 0 30px 80px rgba(0,0,0,0.6)'
                        }}
                    >
                        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: '2.5rem' }}>
                            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)' }} />
                            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)' }} />
                        </div>

                        <div className="relative p-8 md:p-10">
                            <motion.div
                                initial={{ scale: 0, y: -30 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 180 }}
                                className="mx-auto mb-4 w-28 h-28 rounded-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b)', boxShadow: '0 0 60px rgba(251,191,36,0.6), 0 0 120px rgba(251,191,36,0.2)' }}
                            >
                                <Trophy size={56} className="text-white drop-shadow-xl" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex justify-center gap-2 mb-5"
                            >
                                {[0,1,2,3,4].map(i => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0, rotate: -30 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.3 + i * 0.08, type: 'spring' }}
                                    >
                                        <Star size={28} className="fill-yellow-400 text-yellow-400 drop-shadow-lg" />
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                                style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24' }}
                            >
                                <Trophy size={12} />
                                إنجاز استثنائي
                            </motion.div>

                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight"
                            >
                                أنهيت المسار كامل! 🏆
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-base font-bold leading-relaxed mb-6"
                                style={{ color: 'rgba(167,243,208,0.9)' }}
                            >
                                لأنك ما استسلمتش وكملت كل الدروس،<br />
                                دلوقتي أنت جاهز تستخدم اللغة بثقة تامة 🌟
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.55 }}
                                className="grid grid-cols-3 gap-3 mb-6"
                            >
                                {[
                                    { value: sequentialCompletedCount, label: 'درس أُتم', color: '#34d399' },
                                    { value: coins, label: 'عملة مكتسبة', color: '#fbbf24' },
                                    { value: streak, label: 'يوم متواصل', color: '#f87171' },
                                ].map((stat, i) => (
                                    <div key={i} className="p-3 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                                        <div className="text-[10px] font-bold mt-0.5 uppercase tracking-wide" style={{ color: 'rgba(167,243,208,0.6)' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => setFinalPathCongratsModal(false)}
                                className="w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                    boxShadow: '0 8px 40px rgba(251,191,36,0.5)',
                                    color: '#1a1a1a'
                                }}
                            >
                                <CheckCircle size={24} />
                                كمّل يا بطل 🚀
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </>
    );

    if (activeLessonId && activeLesson) {
        const activeLessonWithLevel = orderedLessonsWithLevel.find(l => l.id === activeLesson.id);
        const levelLessons = orderedLessonsWithLevel.filter(l => l.moduleId === activeLessonWithLevel?.moduleId);
        const isLastLessonInLevel = levelLessons[levelLessons.length - 1]?.id === activeLesson.id;

        return (
            <>
                {modals}
                <LessonProvider
                    activeLesson={activeLesson}
                    activeLessonIndex={activeLessonIndex}
                    timeSpent={elapsedTime}
                    isBookmarked={bookmarkedLessons.includes(activeLessonId)}
                    isLastLessonInLevel={isLastLessonInLevel}
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
                        
                        if (isLastLessonInLevel) {
                            const currentMainLevel = normalizeLevel(activeLessonWithLevel?.level);
                            const currentSubLevel = activeLessonWithLevel?.subLevel || currentMainLevel;
                            
                            const remainingInMainLevel = orderedLessonsWithLevel.filter((l, idx) => idx > lessonIdx && normalizeLevel(l.level) === currentMainLevel);
                            
                            let completedLevelStr = currentSubLevel;
                            let nextLevelStr = 'المستوى القادم قريباً!';

                            if (remainingInMainLevel.length === 0) {
                                completedLevelStr = `${currentMainLevel} بالكامل`;
                                const nextMainLevel = LEVEL_ORDER.slice(LEVEL_ORDER.indexOf(currentMainLevel as any) + 1).find(
                                    (candidate) => orderedLessonsWithLevel.some((x) => normalizeLevel(x.level) === candidate)
                                );
                                
                                if (nextMainLevel) {
                                    nextLevelStr = nextMainLevel;
                                    if (!isProSubscriber) {
                                        onRequirePro?.('إكمال المستويات والانتقال للمسار الكامل متاح لمشتركي برو. ترقّى للمتابعة من A2 فما فوق.');
                                        return;
                                    }
                                }
                            } else {
                                const nextModuleLesson = orderedLessonsWithLevel.find((l, idx) => idx > lessonIdx && l.moduleId !== activeLessonWithLevel?.moduleId);
                                if (nextModuleLesson) {
                                    nextLevelStr = nextModuleLesson.subLevel || nextModuleLesson.level;
                                }
                            }

                            setLevelCongratsModal({ 
                                completedLevel: completedLevelStr, 
                                nextLevel: nextLevelStr 
                            });
                        }

                        if (lessonIdx < 0 || lessonIdx > sequentialCompletedCount) {
                            return;
                        }
                        const baseCoins = 10;
                        const bonusCoins = score ? Math.floor(score / 10) : 0;
                        setCoins(prev => prev + baseCoins + bonusCoins);
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
            </>
        );
    }

    return (
        <>
            {modals}
            <div className="p-4 md:p-8 animate-slide-up pb-24 max-w-[1700px] mx-auto min-h-screen space-y-10">
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
        </>
    );
};
