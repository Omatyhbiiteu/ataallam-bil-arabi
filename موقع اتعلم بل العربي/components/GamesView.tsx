import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Crown, Gamepad2, Gauge, Gem, Headphones, Hourglass, Loader2, Lock, MousePointer2, Puzzle, Rocket, RotateCcw, Sparkles, Target, Trophy, Volume2, XCircle } from 'lucide-react';
import { GameAttempt, GameQuestion, GameSet, GameUsage } from '../types';
import { GamesAPI } from '../services/apiClient';
import { speakText, stopSpeaking } from '../services/ttsService';

interface GamesViewProps {
    t: any;
    dir: string;
    learningLang: 'en' | 'de';
    subscriptionPlan: string;
    onGameXpEarned: (xp: number) => void;
}

type Phase = 'lobby' | 'playing' | 'result';
type AnswerPayload = { questionId: string; answer: string | string[] };

const gameIconMap = {
    word_match: Puzzle,
    sentence_builder: MousePointer2,
    listening: Headphones,
};

const colorMap: Record<string, string> = {
    blue: 'from-blue-600 to-cyan-500',
    indigo: 'from-indigo-600 to-violet-500',
    violet: 'from-violet-600 to-fuchsia-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-red-500',
};

const normalizeAnswer = (value: string) =>
    value
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[؟?!.،,;:]+$/g, '')
        .toLowerCase();

const shuffled = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const levelMeta = [
    { id: 'A1', desc: 'بداية', gradient: 'from-emerald-400 to-green-500' },
    { id: 'A2', desc: 'أساسيات', gradient: 'from-teal-400 to-emerald-500' },
    { id: 'B1', desc: 'متوسط', gradient: 'from-blue-400 to-indigo-500' },
    { id: 'B2', desc: 'قوي', gradient: 'from-violet-400 to-purple-500' },
    { id: 'C1', desc: 'متقدم', gradient: 'from-orange-400 to-rose-500' },
    { id: 'C2', desc: 'إتقان', gradient: 'from-rose-500 to-red-600' },
];

const normalizeGameLevel = (level?: string | null) => {
    const raw = (level || 'A1').trim().toUpperCase();
    return levelMeta.some((item) => item.id === raw) ? raw : 'A1';
};

const normalizeGameSubLevel = (game: GameSet) => {
    const level = normalizeGameLevel(game.level);
    return game.subLevel && game.subLevel.startsWith(`${level}.`) ? game.subLevel : `${level}.1`;
};

const formatCountdown = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const GamesView: React.FC<GamesViewProps> = ({
    t,
    dir,
    learningLang,
    subscriptionPlan,
    onGameXpEarned,
}) => {
    const g = t.games || {};
    const [games, setGames] = useState<GameSet[]>([]);
    const [usage, setUsage] = useState<GameUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [startingId, setStartingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>('lobby');
    const [activeGame, setActiveGame] = useState<GameSet | null>(null);
    const [attempt, setAttempt] = useState<GameAttempt | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerPayload[]>([]);
    const [correctCount, setCorrectCount] = useState(0);
    const [combo, setCombo] = useState(0);
    const [lockedAnswer, setLockedAnswer] = useState<string | null>(null);
    const [chosenTokens, setChosenTokens] = useState<string[]>([]);
    const [availableTokens, setAvailableTokens] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [finishing, setFinishing] = useState(false);
    const [result, setResult] = useState<GameAttempt | null>(null);
    const [limitMessage, setLimitMessage] = useState<string | null>(null);
    const [clockNow, setClockNow] = useState(Date.now());
    const [selectedLevel, setSelectedLevel] = useState('A1');
    const [selectedSubLevel, setSelectedSubLevel] = useState('all');

    const loadGames = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [gamesRes, usageRes] = await Promise.all([
                GamesAPI.getAll(learningLang),
                GamesAPI.getUsage(),
            ]);
            setGames(Array.isArray((gamesRes as any)?.games) ? (gamesRes as any).games : []);
            setUsage((usageRes as any)?.usage ?? null);
        } catch (e: any) {
            setError(e?.message || g.loadError || 'تعذر تحميل الألعاب');
        } finally {
            setLoading(false);
        }
    }, [learningLang, g.loadError]);

    useEffect(() => {
        void loadGames();
        return () => stopSpeaking();
    }, [loadGames]);

    useEffect(() => {
        const id = window.setInterval(() => setClockNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const currentQuestion = activeGame?.questions?.[currentIndex] || null;
    const totalQuestions = activeGame?.questions?.length || 0;
    const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
    const effectivePlan = usage?.plan || subscriptionPlan || 'free';
    const planLabel = g.plans?.[effectivePlan] || effectivePlan;
    const isUsageBlocked = Boolean(usage && !usage.unlimited && (usage.remaining ?? 0) <= 0);
    const resetAtMs = usage?.resetAt ? new Date(usage.resetAt).getTime() : 0;
    const countdownText = resetAtMs > 0 ? formatCountdown(resetAtMs - clockNow) : '00:00:00';
    const quotaPercent = usage?.unlimited
        ? 100
        : usage?.limit
            ? Math.min(100, Math.max(0, (usage.used / usage.limit) * 100))
            : 0;
    const quotaLabel = usage?.unlimited ? '∞' : `${usage?.remaining ?? 0}/${usage?.limit ?? 0}`;

    const getLimitMessage = useCallback((nextUsage: GameUsage | null = usage) => {
        const plan = nextUsage?.plan || effectivePlan;
        if (plan === 'silver') {
            return g.silverLimitMessage || 'استهلكت محاولات السيلفر. اشترك في البرو وافتح الألعاب بلا حدود، أو انتظر عودة الرصيد.';
        }
        if (plan === 'pro' || plan === 'enterprise') {
            return g.limitReached || 'حدث خطأ في قراءة رصيد الألعاب. حدّث الصفحة وحاول مرة أخرى.';
        }
        return g.freeLimitMessage || 'لازم تشترك علشان تكمل اللعب الآن، أو انتظر رجوع رصيد الباقة العادية.';
    }, [effectivePlan, g.freeLimitMessage, g.limitReached, g.silverLimitMessage, usage]);

    const levelCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const meta of levelMeta) counts[meta.id] = 0;
        games.forEach((game) => {
            const level = normalizeGameLevel(game.level);
            counts[level] = (counts[level] || 0) + 1;
        });
        return counts;
    }, [games]);

    const subLevels = useMemo(() => {
        const list = Array.from(new Set(
            games
                .filter((game) => normalizeGameLevel(game.level) === selectedLevel)
                .map((game) => normalizeGameSubLevel(game))
        )).sort();
        return list;
    }, [games, selectedLevel]);

    const filteredGames = useMemo(() => {
        return games.filter((game) => {
            const level = normalizeGameLevel(game.level);
            const sub = normalizeGameSubLevel(game);
            return level === selectedLevel && (selectedSubLevel === 'all' || selectedSubLevel === sub);
        });
    }, [games, selectedLevel, selectedSubLevel]);

    useEffect(() => {
        if (games.length === 0) return;
        if (levelCounts[selectedLevel] > 0) return;
        const firstAvailable = levelMeta.find((level) => levelCounts[level.id] > 0)?.id;
        if (firstAvailable) {
            setSelectedLevel(firstAvailable);
            setSelectedSubLevel('all');
        }
    }, [games, levelCounts, selectedLevel]);

    useEffect(() => {
        setSelectedSubLevel('all');
    }, [selectedLevel]);

    useEffect(() => {
        if (!currentQuestion || activeGame?.type !== 'sentence_builder') {
            setChosenTokens([]);
            setAvailableTokens([]);
            return;
        }
        const tokens = currentQuestion.tokens?.length ? currentQuestion.tokens : currentQuestion.answer.split(/\s+/);
        setChosenTokens([]);
        setAvailableTokens(shuffled(tokens));
    }, [currentQuestion?.id, activeGame?.type]);

    useEffect(() => {
        if (phase !== 'playing' || finishing) return;
        if (timeLeft <= 0) {
            void finishAttempt(answers);
            return;
        }
        const id = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000);
        return () => window.clearTimeout(id);
    }, [phase, timeLeft, finishing, answers]);

    const startGame = async (game: GameSet) => {
        if (isUsageBlocked) {
            setLimitMessage(getLimitMessage(usage));
            return;
        }
        setStartingId(game.id);
        setError(null);
        setLimitMessage(null);
        try {
            const res = await GamesAPI.start(game.id);
            const startedGame = (res as any)?.game as GameSet;
            const startedAttempt = (res as any)?.attempt as GameAttempt;
            setActiveGame(startedGame);
            setAttempt(startedAttempt);
            setUsage((res as any)?.usage ?? usage);
            setCurrentIndex(0);
            setAnswers([]);
            setCorrectCount(0);
            setCombo(0);
            setLockedAnswer(null);
            setResult(null);
            setTimeLeft(startedGame.timeLimitSeconds || 90);
            setPhase('playing');
        } catch (e: any) {
            const code = e?.data?.code || e?.code;
            if (code === 'game_limit_reached' || e?.status === 429) {
                const nextUsage = (e?.data?.usage ?? usage) as GameUsage | null;
                setUsage(nextUsage);
                setLimitMessage(getLimitMessage(nextUsage));
            } else {
                setError(e?.message || g.startError || 'تعذر بدء اللعبة');
            }
        } finally {
            setStartingId(null);
        }
    };

    const finishAttempt = async (finalAnswers: AnswerPayload[]) => {
        if (!attempt || finishing) return;
        setFinishing(true);
        try {
            const res = await GamesAPI.complete(attempt.id, finalAnswers);
            const completed = (res as any)?.attempt as GameAttempt;
            setResult(completed);
            setUsage((res as any)?.usage ?? usage);
            if (completed?.xpEarned > 0) onGameXpEarned(completed.xpEarned);
            setPhase('result');
        } catch (e: any) {
            setError(e?.message || g.completeError || 'تعذر حفظ نتيجة اللعبة');
        } finally {
            setFinishing(false);
        }
    };

    const submitAnswer = (answer: string | string[]) => {
        if (!currentQuestion || !activeGame || lockedAnswer !== null || finishing) return;
        const answerText = Array.isArray(answer) ? answer.join(' ') : answer;
        const isCorrect = normalizeAnswer(answerText) === normalizeAnswer(currentQuestion.answer);
        const nextAnswers = [
            ...answers.filter((a) => a.questionId !== currentQuestion.id),
            { questionId: currentQuestion.id, answer },
        ];
        setAnswers(nextAnswers);
        setLockedAnswer(answerText);
        if (isCorrect) {
            setCorrectCount((v) => v + 1);
            setCombo((v) => v + 1);
        } else {
            setCombo(0);
        }
        window.setTimeout(() => {
            setLockedAnswer(null);
            if (currentIndex >= (activeGame.questions?.length || 1) - 1) {
                void finishAttempt(nextAnswers);
            } else {
                setCurrentIndex((v) => v + 1);
            }
        }, 720);
    };

    const pickToken = (token: string, index: number) => {
        setChosenTokens((prev) => [...prev, token]);
        setAvailableTokens((prev) => prev.filter((_, i) => i !== index));
    };

    const removeToken = (token: string, index: number) => {
        setAvailableTokens((prev) => [...prev, token]);
        setChosenTokens((prev) => prev.filter((_, i) => i !== index));
    };

    const resetToLobby = () => {
        stopSpeaking();
        setPhase('lobby');
        setActiveGame(null);
        setAttempt(null);
        setResult(null);
        setError(null);
        setLockedAnswer(null);
        void loadGames();
    };

    const lobby = (
        <div className="space-y-8">
            <section className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-slate-950 text-white p-6 md:p-10 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,.25),transparent_34%)]" />
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                    <div className="space-y-4 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-black">
                            <Gamepad2 size={18} /> {g.kicker || 'تدريب سريع ممتع'}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight">{g.title || 'الألعاب التعليمية'}</h1>
                        <p className="text-white/70 text-base md:text-xl font-bold leading-relaxed">
                            {g.subtitle || 'تدريبات قصيرة من محتوى حقيقي تقوي الكلمات والجمل والاستماع.'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-[280px]">
                        <UsageTile label={g.todayUsed || 'اليوم'} value={usage ? String(usage.used) : '0'} />
                        <UsageTile label={g.remaining || 'المتبقي'} value={usage?.unlimited ? '∞' : String(usage?.remaining ?? 0)} />
                        <UsageTile label={g.plan || 'الباقة'} value={planLabel} compact />
                        <UsageTile label={isUsageBlocked ? (g.readyIn || 'يرجع خلال') : (g.window || 'نافذة الرصيد')} value={usage?.unlimited ? '∞' : (isUsageBlocked ? countdownText : `${usage?.resetHours ?? 24}h`)} compact />
                    </div>
                </div>
            </section>

            <GameQuotaBar
                g={g}
                usage={usage}
                planLabel={planLabel}
                quotaPercent={quotaPercent}
                quotaLabel={quotaLabel}
                countdownText={countdownText}
                isBlocked={isUsageBlocked}
                dir={dir}
            />

            <GamesLevelBar
                selectedLevel={selectedLevel}
                selectedSubLevel={selectedSubLevel}
                subLevels={subLevels}
                levelCounts={levelCounts}
                onSelectLevel={setSelectedLevel}
                onSelectSubLevel={setSelectedSubLevel}
                g={g}
            />

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 text-red-700 dark:text-red-200 px-5 py-4 font-bold flex items-center gap-2">
                    <AlertTriangle size={20} /> {error}
                </div>
            )}

            {loading ? (
                <div className="min-h-[260px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={42} />
                </div>
            ) : filteredGames.length === 0 ? (
                <div className="min-h-[260px] rounded-[2rem] bg-white dark:bg-dark-card border border-dashed border-stone-200 dark:border-gray-800 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Target size={30} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{g.noLevelGames || 'لا توجد ألعاب لهذا المستوى حالياً'}</h3>
                    <p className="text-gray-500 dark:text-gray-400 font-bold max-w-md">{g.noLevelGamesHint || 'اختار مستوى آخر من الشريط بالأعلى، أو أضف ألعاب جديدة من لوحة التحكم.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-7">
                    {filteredGames.map((game, index) => {
                        const Icon = gameIconMap[game.type] || Gamepad2;
                        const gradient = colorMap[game.color] || colorMap.indigo;
                        return (
                            <motion.button
                                type="button"
                                key={game.id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                onClick={() => startGame(game)}
                                disabled={startingId !== null}
                                className={`group text-start relative overflow-hidden rounded-[2rem] bg-white dark:bg-dark-card border p-6 md:p-7 shadow-xl hover:-translate-y-1 transition-all disabled:opacity-60 disabled:hover:translate-y-0 ${
                                    isUsageBlocked
                                        ? 'border-amber-300 dark:border-amber-700/70 shadow-amber-500/10'
                                        : 'border-stone-100 dark:border-gray-800'
                                }`}
                            >
                                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${gradient} opacity-90`} />
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between gap-4 mb-10 text-white">
                                        <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                                            {startingId === game.id ? <Loader2 className="animate-spin" /> : <Icon size={30} />}
                                        </div>
                                        <div className="text-end">
                                            <div className="text-xs font-black uppercase tracking-widest text-white/70">{game.level}</div>
                                            <div className="text-2xl font-black">+{game.xpReward} XP</div>
                                        </div>
                                    </div>
                                    {isUsageBlocked && (
                                        <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black">
                                            <Lock size={14} /> {g.creditLocked || 'الرصيد خلص مؤقتاً'}
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{game.title}</h2>
                                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed min-h-[58px]">{game.description}</p>
                                        <div className="flex items-center justify-between pt-3">
                                            <span className="text-xs font-black text-gray-400">{game.questionCount || 0} {g.questions || 'أسئلة'}</span>
                                            <span className={`inline-flex items-center gap-1 font-black ${
                                                isUsageBlocked ? 'text-amber-600 dark:text-amber-300' : 'text-primary'
                                            }`}>
                                                {isUsageBlocked && <Lock size={15} />}
                                                {isUsageBlocked ? (g.lockedStart || 'اعرف ميعاد الرجوع') : (g.start || 'ابدأ')}
                                                <ArrowLeft size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const playing = activeGame && currentQuestion ? (
        <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <button onClick={resetToLobby} className="px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-stone-200 dark:border-gray-800 font-black text-gray-600 dark:text-gray-300">
                    {g.exit || 'خروج'}
                </button>
                <div className="flex items-center gap-3">
                    <StatPill icon={<Clock size={16} />} text={`${timeLeft}s`} danger={timeLeft < 15} />
                    <StatPill icon={<Sparkles size={16} />} text={`${g.combo || 'كومبو'} ${combo}`} />
                    <StatPill icon={<Trophy size={16} />} text={`${correctCount}/${totalQuestions}`} />
                </div>
            </div>

            <div className="h-3 bg-stone-200 dark:bg-gray-800 rounded-full overflow-hidden mb-8">
                <motion.div className="h-full bg-gradient-to-r from-primary to-orange-500" animate={{ width: `${progress}%` }} />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, y: 28, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                    className="rounded-[2.5rem] bg-white dark:bg-dark-card border border-stone-100 dark:border-gray-800 shadow-2xl p-6 md:p-10 overflow-hidden relative"
                >
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-amber-500 to-purple-600" />
                    <div className="text-center space-y-5">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {g.question || 'سؤال'} {currentIndex + 1} / {totalQuestions}
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
                            {activeGame.type === 'listening' ? (g.listenPrompt || 'اسمع واختر المعنى الصحيح') : currentQuestion.prompt}
                        </h2>
                        {activeGame.type === 'listening' && (
                            <button
                                type="button"
                                onClick={() => speakText(currentQuestion.audioText || currentQuestion.translation || currentQuestion.answer, learningLang)}
                                className="mx-auto w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-500/30 hover:scale-105 transition"
                            >
                                <Volume2 size={42} />
                            </button>
                        )}

                        {activeGame.type === 'sentence_builder' ? (
                            <div className="space-y-7 pt-4">
                                <div dir="ltr" className="min-h-[86px] rounded-3xl bg-stone-100 dark:bg-gray-900/70 border-2 border-dashed border-stone-300 dark:border-gray-700 p-4 flex flex-wrap gap-3 justify-center">
                                    {chosenTokens.length === 0 ? (
                                        <span className="text-gray-400 font-bold self-center">{g.tapWords || 'اضغط الكلمات بالترتيب'}</span>
                                    ) : chosenTokens.map((token, i) => (
                                        <motion.button
                                            key={`${token}-${i}`}
                                            layout
                                            onClick={() => removeToken(token, i)}
                                            className="px-4 py-2 rounded-2xl bg-white dark:bg-gray-800 shadow font-black text-gray-800 dark:text-white"
                                            style={{ unicodeBidi: 'plaintext' }}
                                        >
                                            {token}
                                        </motion.button>
                                    ))}
                                </div>
                                <div dir="ltr" className="flex flex-wrap gap-3 justify-center">
                                    {availableTokens.map((token, i) => (
                                        <motion.button
                                            key={`${token}-${i}`}
                                            layout
                                            onClick={() => pickToken(token, i)}
                                            className="px-5 py-3 rounded-2xl bg-primary/10 text-primary font-black hover:bg-primary hover:text-white transition"
                                            style={{ unicodeBidi: 'plaintext' }}
                                        >
                                            {token}
                                        </motion.button>
                                    ))}
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button onClick={() => {
                                        const tokens = currentQuestion.tokens?.length ? currentQuestion.tokens : currentQuestion.answer.split(/\s+/);
                                        setChosenTokens([]);
                                        setAvailableTokens(shuffled(tokens));
                                    }} className="px-5 py-3 rounded-2xl bg-stone-100 dark:bg-gray-800 font-black text-gray-500">
                                        <RotateCcw size={18} className="inline me-2" /> {g.reset || 'إعادة'}
                                    </button>
                                    <button
                                        onClick={() => submitAnswer(chosenTokens)}
                                        disabled={chosenTokens.length === 0}
                                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-primary to-red-600 text-white font-black disabled:opacity-50"
                                    >
                                        {g.check || 'تحقق'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                {(currentQuestion.options?.length ? currentQuestion.options : [currentQuestion.answer]).map((option) => {
                                    const active = lockedAnswer === option;
                                    const correct = normalizeAnswer(option) === normalizeAnswer(currentQuestion.answer);
                                    return (
                                        <motion.button
                                            key={option}
                                            whileHover={{ scale: lockedAnswer ? 1 : 1.02 }}
                                            whileTap={{ scale: lockedAnswer ? 1 : 0.98 }}
                                            onClick={() => submitAnswer(option)}
                                            disabled={lockedAnswer !== null}
                                            className={`min-h-[82px] rounded-3xl border-2 px-5 py-4 font-black text-lg transition-all ${
                                                active
                                                    ? correct
                                                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'
                                                        : 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-600'
                                                    : 'border-stone-200 dark:border-gray-800 bg-stone-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 hover:border-primary/40'
                                            }`}
                                        >
                                            {option}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}

                        {lockedAnswer !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center gap-2 pt-2 font-black"
                            >
                                {normalizeAnswer(lockedAnswer) === normalizeAnswer(currentQuestion.answer) ? (
                                    <span className="text-emerald-500 flex items-center gap-2"><CheckCircle2 /> {g.correct || 'صحيح'}</span>
                                ) : (
                                    <span className="text-red-500 flex items-center gap-2"><XCircle /> {g.wrong || 'خطأ'}: {currentQuestion.answer}</span>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    ) : null;

    const resultView = result ? (
        <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-3xl rounded-[3rem] bg-white dark:bg-dark-card border border-stone-100 dark:border-gray-800 shadow-2xl p-8 md:p-12 text-center overflow-hidden relative"
            >
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-primary" />
                <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-6">
                    <Trophy size={48} />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-3">{g.resultTitle || 'نتيجة التحدي'}</h2>
                <p className="text-gray-500 dark:text-gray-400 font-bold mb-8">{activeGame?.title}</p>
                <div className="grid grid-cols-3 gap-3 md:gap-5 mb-8">
                    <ResultTile label={g.score || 'النتيجة'} value={`${result.score}%`} />
                    <ResultTile label={g.correctAnswers || 'الإجابات'} value={`${result.correctCount}/${result.totalQuestions}`} />
                    <ResultTile label="XP" value={`+${result.xpEarned}`} />
                </div>
                <div className="flex flex-col md:flex-row gap-3 justify-center">
                    <button onClick={resetToLobby} className="px-8 py-4 rounded-2xl bg-primary text-white font-black shadow-lg">
                        {g.backToGames || 'العودة للألعاب'}
                    </button>
                </div>
            </motion.div>
        </div>
    ) : null;

    return (
        <div className="p-4 md:p-8 lg:p-12 pb-28 max-w-[1800px] mx-auto animate-slide-up" dir={dir}>
            <AnimatePresence mode="wait">
                {phase === 'lobby' && <motion.div key="lobby">{lobby}</motion.div>}
                {phase === 'playing' && <motion.div key="playing">{playing}</motion.div>}
                {phase === 'result' && <motion.div key="result">{resultView}</motion.div>}
            </AnimatePresence>

            <AnimatePresence>
                {limitMessage && (
                    <motion.div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }} className="max-w-lg w-full rounded-[2rem] bg-white dark:bg-dark-card p-7 shadow-2xl text-center border border-stone-100 dark:border-gray-800 overflow-hidden relative">
                            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-primary" />
                            <div className={`w-[72px] h-[72px] mx-auto rounded-3xl flex items-center justify-center mb-4 shadow-xl ${
                                effectivePlan === 'silver'
                                    ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sky-500/20'
                                    : 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-orange-500/20'
                            }`}>
                                {effectivePlan === 'silver' ? <Rocket size={34} /> : <Crown size={34} />}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                {effectivePlan === 'silver'
                                    ? (g.silverLimitTitle || 'رصيد السيلفر خلص')
                                    : (g.freeLimitTitle || g.limitTitle || 'رصيد الباقة العادية خلص')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 font-bold leading-relaxed mb-5">{limitMessage}</p>

                            <div className="rounded-[1.5rem] bg-slate-950 text-white p-5 mb-5 overflow-hidden relative">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,.25),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,.20),transparent_34%)]" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-center gap-2 text-white/60 text-xs font-black uppercase tracking-widest mb-2">
                                        <Hourglass size={14} /> {g.readyIn || 'تقدر تلعب بعد'}
                                    </div>
                                    <div className="text-4xl md:text-5xl font-black tabular-nums tracking-widest">{countdownText}</div>
                                    <div className="text-white/55 text-xs font-black mt-2">
                                        {effectivePlan === 'silver'
                                            ? (g.silverResetHint || `رصيد السيلفر يرجع خلال ${usage?.resetHours ?? 12} ساعة`)
                                            : (g.freeResetHint || `رصيد العادي يرجع خلال ${usage?.resetHours ?? 24} ساعة`)}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-stone-100 dark:bg-gray-900 p-4 mb-5">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <ResultTile label={g.todayUsed || 'المستخدم'} value={String(usage?.used ?? 0)} compact />
                                    <ResultTile label={g.remaining || 'المتبقي'} value={usage?.unlimited ? '∞' : String(usage?.remaining ?? 0)} compact />
                                </div>
                                <div className="h-3 rounded-full bg-white dark:bg-gray-800 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-orange-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${quotaPercent}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2 text-[11px] font-black text-gray-400">
                                    <span>{planLabel}</span>
                                    <span>{quotaLabel}</span>
                                </div>
                            </div>

                            <button onClick={() => setLimitMessage(null)} className="w-full py-3 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20">
                                {g.ok || 'حسناً'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const GameQuotaBar = ({
    g,
    usage,
    planLabel,
    quotaPercent,
    quotaLabel,
    countdownText,
    isBlocked,
    dir,
}: {
    g: any;
    usage: GameUsage | null;
    planLabel: string;
    quotaPercent: number;
    quotaLabel: string;
    countdownText: string;
    isBlocked: boolean;
    dir: string;
}) => {
    const isUnlimited = Boolean(usage?.unlimited);
    const remainingPercent = isUnlimited ? 100 : Math.max(0, 100 - quotaPercent);
    const resetHours = usage?.resetHours ?? (usage?.plan === 'silver' ? 12 : 24);
    const barGradient = isUnlimited
        ? 'from-emerald-400 via-teal-400 to-cyan-400'
        : isBlocked
            ? 'from-red-500 via-orange-500 to-amber-400'
            : 'from-emerald-500 via-lime-400 to-amber-400';

    return (
        <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-dark-card border border-stone-100 dark:border-gray-800 p-5 md:p-6 shadow-xl"
            dir={dir}
        >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-primary" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                        isUnlimited
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
                            : isBlocked
                                ? 'bg-gradient-to-br from-red-500 to-orange-600 shadow-red-500/20'
                                : 'bg-gradient-to-br from-primary to-orange-600 shadow-orange-500/20'
                    }`}>
                        {isUnlimited ? <Crown size={26} /> : isBlocked ? <Lock size={25} /> : <Gauge size={26} />}
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-gray-900 text-gray-500 dark:text-gray-300 text-xs font-black mb-2">
                            <Gem size={14} /> {planLabel}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                            {isUnlimited ? (g.unlimitedQuotaTitle || 'ألعاب مفتوحة بلا حدود') : (g.quotaTitle || 'رصيد الألعاب اليومي')}
                        </h2>
                        <p className="text-sm md:text-base font-bold text-gray-500 dark:text-gray-400 mt-1">
                            {isUnlimited
                                ? (g.unlimitedQuotaHint || 'باقتك الحالية تسمح باللعب في أي وقت بدون عداد محاولات.')
                                : isBlocked
                                    ? (g.quotaBlockedHint || 'الرصيد خلص مؤقتاً. العداد تحت بيقولك تقدر تلعب إمتى.')
                                    : (g.quotaHint || `كل محاولة تبدأ بتتحسب من الرصيد، والنافذة الحالية ${resetHours} ساعة.`)}
                        </p>
                    </div>
                </div>

                <div className="w-full lg:max-w-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {isUnlimited ? (g.unlimited || 'مفتوح') : (g.availableCredit || 'الرصيد المتاح')}
                        </span>
                        <span className={`text-sm font-black ${isBlocked ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                            {isUnlimited ? '∞' : quotaLabel}
                        </span>
                    </div>
                    <div className="h-4 rounded-full bg-stone-100 dark:bg-gray-900 overflow-hidden border border-stone-200 dark:border-gray-800">
                        <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${remainingPercent}%` }}
                            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-3 text-xs font-black text-gray-400">
                        <span>{isUnlimited ? (g.proAlwaysOpen || 'البرو مفتوح دائماً') : `${g.used || 'المستخدم'} ${usage?.used ?? 0}/${usage?.limit ?? 0}`}</span>
                        <span className={isBlocked ? 'text-red-500 tabular-nums' : 'tabular-nums'}>
                            {isBlocked ? `${g.readyIn || 'يرجع خلال'} ${countdownText}` : `${g.window || 'النافذة'} ${resetHours}h`}
                        </span>
                    </div>
                </div>
            </div>
        </motion.section>
    );
};

const GamesLevelBar = ({
    selectedLevel,
    selectedSubLevel,
    subLevels,
    levelCounts,
    onSelectLevel,
    onSelectSubLevel,
    g,
}: {
    selectedLevel: string;
    selectedSubLevel: string;
    subLevels: string[];
    levelCounts: Record<string, number>;
    onSelectLevel: (level: string) => void;
    onSelectSubLevel: (subLevel: string) => void;
    g: any;
}) => (
    <section className="rounded-[2rem] bg-white dark:bg-dark-card border border-stone-100 dark:border-gray-800 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
            <div>
                <div className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest mb-2">
                    <Target size={15} /> {g.levelPath || 'مسار المستوى'}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{g.chooseLevel || 'اختار مستوى اللعب'}</h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-stone-100 dark:bg-gray-900 text-gray-500 dark:text-gray-300 text-xs font-black">
                <Sparkles size={15} /> {g.levelHint || 'كل مستوى يعرض ألعابه فقط'}
            </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {levelMeta.map((level) => {
                const count = levelCounts[level.id] || 0;
                const active = selectedLevel === level.id;
                return (
                    <button
                        key={level.id}
                        type="button"
                        onClick={() => count > 0 && onSelectLevel(level.id)}
                        disabled={count === 0}
                        className={`relative overflow-hidden rounded-2xl p-4 text-start border transition-all min-h-[112px] ${
                            active
                                ? 'border-transparent text-white shadow-xl'
                                : 'border-stone-200 dark:border-gray-800 bg-stone-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 hover:border-primary/40'
                        } disabled:opacity-40 disabled:hover:border-stone-200 dark:disabled:hover:border-gray-800`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${level.gradient} transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="relative z-10 flex h-full flex-col justify-between gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black">{level.id}</span>
                                {active && <CheckCircle2 size={20} />}
                            </div>
                            <div>
                                <div className={`text-sm font-black ${active ? 'text-white/85' : 'text-gray-500 dark:text-gray-400'}`}>{level.desc}</div>
                                <div className={`text-[11px] font-black uppercase tracking-widest mt-1 ${active ? 'text-white/65' : 'text-gray-400'}`}>
                                    {count} {g.gamesCount || 'ألعاب'}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>

        <div className="flex flex-wrap gap-2 pt-5">
            <button
                type="button"
                onClick={() => onSelectSubLevel('all')}
                className={`px-4 py-2 rounded-full text-sm font-black border transition ${
                    selectedSubLevel === 'all'
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-300 border-stone-200 dark:border-gray-800 hover:border-primary/40'
                }`}
            >
                {g.allSubLevels || 'كل الفروع'}
            </button>
            {subLevels.map((subLevel) => (
                <button
                    key={subLevel}
                    type="button"
                    onClick={() => onSelectSubLevel(subLevel)}
                    className={`px-4 py-2 rounded-full text-sm font-black border transition tabular-nums ${
                        selectedSubLevel === subLevel
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                            : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-300 border-stone-200 dark:border-gray-800 hover:border-primary/40'
                    }`}
                >
                    {subLevel}
                </button>
            ))}
        </div>
    </section>
);

const UsageTile = ({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) => (
    <div className="rounded-2xl bg-white/10 border border-white/10 px-3 py-4 text-center backdrop-blur-md">
        <div className={`font-black ${compact ? 'text-base' : 'text-2xl'}`}>{value}</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-white/55 mt-1">{label}</div>
    </div>
);

const StatPill = ({ icon, text, danger = false }: { icon: React.ReactNode; text: string; danger?: boolean }) => (
    <div className={`px-4 py-2 rounded-2xl border font-black flex items-center gap-2 ${
        danger
            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900'
            : 'bg-white border-stone-200 text-gray-700 dark:bg-dark-card dark:border-gray-800 dark:text-gray-200'
    }`}>
        {icon} {text}
    </div>
);

const ResultTile = ({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) => (
    <div className="rounded-2xl bg-stone-100 dark:bg-gray-900 px-3 py-5 text-center">
        <div className={`font-black text-gray-900 dark:text-white ${compact ? 'text-xl' : 'text-3xl'}`}>{value}</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{label}</div>
    </div>
);
