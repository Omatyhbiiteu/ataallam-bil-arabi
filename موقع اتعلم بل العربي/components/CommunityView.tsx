import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Target, Flame, Crown, Medal, Activity, BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { Card, ReviewLog, AppTheme, User, DailyMissionState } from '../types';
import { UserAPI } from '../services/apiClient';

interface LeaderboardRow {
    rank: number;
    user_id: number;
    name: string;
    avatar: string | null;
    xp: number;
    streak: number;
    stories: number;
    mastered: number;
    reviews: number;
    quiz_total: number;
    quiz_avg_percent: number;
    is_you: boolean;
}

interface CommunityPayload {
    lang: string;
    period: string;
    total_members: number;
    your_rank: number;
    your_xp: number;
    your_streak: number;
    percentiles: { stories: number; mastered: number };
    ahead: { name: string; xp_needed: number } | null;
    leaderboard: LeaderboardRow[];
}

function resolveAvatarUrl(avatar: string | null | undefined, name: string): string {
    if (avatar && (avatar.startsWith('http') || avatar.startsWith('data:'))) {
        return avatar;
    }
    if (avatar && avatar.startsWith('/')) {
        const apiUrl = import.meta.env.VITE_BACKEND_API_URL || (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api');
        const base = apiUrl.startsWith('/') ? '' : apiUrl.replace(/\/api\/?$/, '');
        return `${base}${avatar}`;
    }
    if (avatar) {
        return avatar;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

interface CommunityViewProps {
    t: any;
    userName: string;
    userImage: string | null;
    currentUser: User | null;
    learningLang: 'en' | 'de';
    cards: Card[];
    reviewLog: ReviewLog[];
    completedStoryIds: string[];
    quizStats: { totalQuizzes: number; averageScore: number } | null;
    selectedTheme: AppTheme;
    /** إجمالي XP في التطبيق (يشمل مكافآت مهام اليوم) */
    profileTotalXp: number;
    dailyMission: DailyMissionState;
    onDailyChallengeNavigate: (challengeId: number) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
    t,
    userName,
    userImage,
    currentUser,
    learningLang,
    cards,
    reviewLog,
    completedStoryIds,
    quizStats,
    selectedTheme: _selectedTheme,
    profileTotalXp,
    dailyMission,
    onDailyChallengeNavigate,
}) => {
    void _selectedTheme;
    const [community, setCommunity] = useState<CommunityPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const c = t.community || {};
    const isRtl = t.locale !== 'en' && t.locale !== 'de';
    const targetLanguageLabel = learningLang === 'de' ? (t.dictionary?.german || 'German') : (t.dictionary?.english || 'English');
    const alignClass = isRtl ? 'text-right' : 'text-left';
    const replaceVars = (template: string, vars: Record<string, string | number>) =>
        Object.entries(vars).reduce((text, [key, value]) => text.replace(`{${key}}`, String(value)), template);

    const totalReviews = cards.reduce((acc, card) => acc + card.reviews, 0);
    const masteredCards = cards.filter((c) => c.status === 'mastered').length;
    const todayStartMs = (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    })();

    const userStreakLocal = useMemo(() => {
        if (reviewLog.length === 0) return 0;
        const last = reviewLog[reviewLog.length - 1].date;
        if (last === todayStartMs) return reviewLog.length;
        return reviewLog.length > 0 ? reviewLog.length - 1 : 0;
    }, [reviewLog, todayStartMs]);

    const storiesCount = completedStoryIds.length;
    const userXPLocal =
        totalReviews * 2 + storiesCount * 10 + (quizStats?.totalQuizzes || 0) + masteredCards * 5;

    const loadCommunity = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            await UserAPI.syncCommunityStats(learningLang, {
                stories_completed: storiesCount,
                quiz_total: quizStats?.totalQuizzes ?? 0,
                quiz_avg_percent: Math.round(quizStats?.averageScore ?? 0),
                streak_days: userStreakLocal,
            });
            const data = (await UserAPI.getCommunityLeaderboard(learningLang)) as CommunityPayload;
            setCommunity(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : (c.loadError || 'تعذر تحميل المجتمع');
            setError(msg);
            setCommunity(null);
        } finally {
            setLoading(false);
        }
    }, [
        currentUser,
        learningLang,
        storiesCount,
        quizStats?.totalQuizzes,
        quizStats?.averageScore,
        userStreakLocal,
    ]);

    useEffect(() => {
        if (!currentUser) return;
        void loadCommunity();
    }, [currentUser, loadCommunity]);

    const todayReviews = reviewLog.find((l) => l.date === todayStartMs)?.count || 0;

    const challenges = [
        {
            id: 1,
            title: c.reviewHeroTitle || 'بطل المراجعة',
            desc: c.reviewHeroDesc || 'راجع 20 بطاقة اليوم',
            progress: Math.min(todayReviews, 20),
            target: 20,
            xpReward: 50,
            claimed: dailyMission.claimedReview,
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-100 dark:bg-orange-900/30',
        },
        {
            id: 2,
            title: c.bookwormTitle || 'قارئ نشيط',
            desc: c.bookwormDesc || 'أكمل قصة واحدة اليوم',
            progress: Math.min(dailyMission.storiesToday, 1),
            target: 1,
            xpReward: 30,
            claimed: dailyMission.claimedStory,
            icon: BookOpen,
            color: 'text-blue-500',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            id: 3,
            title: c.masteryPathTitle || 'طريق الإتقان',
            desc: c.masteryPathDesc || 'أتقن 10 بطاقات اليوم',
            progress: Math.min(dailyMission.masteriesToday, 10),
            target: 10,
            xpReward: 100,
            claimed: dailyMission.claimedMastery,
            icon: Crown,
            color: 'text-yellow-500',
            bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        },
    ];

    const displayXP = profileTotalXp;
    const displayStreak = community?.your_streak ?? userStreakLocal;
    const yourRank = community?.your_rank ?? 0;
    const leaderboardRows = community?.leaderboard ?? [];

    if (!currentUser) {
        return (
            <div className="p-4 md:p-8 max-w-2xl mx-auto min-h-screen flex items-center justify-center font-sans">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 text-center space-y-4">
                    <Users className="mx-auto text-indigo-500" size={48} />
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">{c.title || 'المجتمع'}</h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                        {c.loginMessage || 'سجّل الدخول لمشاهدة لوحة الشرف والتصنيف لمجتمع لغة التعلم الذي اخترته.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 lg:p-12 space-y-8 animate-slide-up pb-24 max-w-[1920px] mx-auto min-h-screen font-sans">
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-inner">
                            <Users size={40} className="text-indigo-300" />
                        </div>
                        <div className={`text-center md:${isRtl ? 'text-right' : 'text-left'}`}>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">{c.title || 'المجتمع'}</h1>
                            <p className="text-lg text-indigo-200 font-medium">
                                {replaceVars(c.subtitle || 'تنافس مع متعلمي {language} — لوحة منفصلة لكل لغة', { language: targetLanguageLabel })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                        <div className="text-center px-4 border-l border-white/10">
                            <div className="text-2xl font-black text-amber-400">{displayXP.toLocaleString()}</div>
                            <div className="text-xs font-bold text-indigo-200">{c.xp || 'الخبرة (XP)'}</div>
                        </div>
                        <div className="text-center px-4">
                            <div className="text-2xl font-black text-orange-400 flex items-center justify-center gap-1">
                                {displayStreak} <Flame size={16} />
                            </div>
                            <div className="text-xs font-bold text-indigo-200">{c.streakDays || 'أيام متتالية'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 px-4 py-3 font-bold text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="text-rose-500" /> {c.dailyMissions || 'مهام اليوم'}
                            </h2>
                            <span className="text-sm font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                {c.renewsTomorrow || 'تتجدد غداً'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {challenges.map((challenge) => {
                                const isCompleted = challenge.progress >= challenge.target;
                                const percent = Math.round((challenge.progress / challenge.target) * 100);
                                const Icon = challenge.icon;

                                return (
                                    <button
                                        type="button"
                                        key={challenge.id}
                                        onClick={() => onDailyChallengeNavigate(challenge.id)}
                                        className={`w-full ${alignClass} p-4 rounded-2xl border-2 transition-all cursor-pointer hover:ring-2 hover:ring-primary/30 active:scale-[0.99] ${
                                            isCompleted
                                                ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30'
                                                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`p-2 rounded-xl ${challenge.bg} ${challenge.color}`}>
                                                <Icon size={20} />
                                            </div>
                                            <span className="text-xs font-black text-amber-500 flex flex-col items-end gap-0.5">
                                                <span className="flex items-center gap-1">
                                                    +{challenge.xpReward} XP
                                                </span>
                                                {challenge.claimed && (
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                        {c.rewardClaimed || 'تمت المكافأة'}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{challenge.title}</h3>
                                        <p className="text-xs text-gray-500 font-medium mb-4">{challenge.desc}</p>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span
                                                    className={
                                                        isCompleted ? 'text-emerald-600' : 'text-gray-500'
                                                    }
                                                >
                                                    {isCompleted
                                                        ? (c.completed || 'مكتملة!')
                                                        : `${challenge.progress} / ${challenge.target}`}
                                                </span>
                                                <span className="text-gray-400">{percent}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        isCompleted ? 'bg-emerald-500' : 'bg-primary'
                                                    }`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <Trophy className="text-amber-500" size={28} /> {c.leaderboard || 'لوحة الشرف'}
                                </h2>
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 pr-1">
                                    {c.leaderboardHint || 'يظهر هنا كل من اختار هذه اللغة في حسابه، مع تقدّمه — الترتيب حسب إجمالي XP.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void loadCommunity()}
                                disabled={loading}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 shrink-0"
                                title={c.refreshLeaderboard || 'تحديث القائمة'}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <RefreshCw size={20} />
                                )}
                            </button>
                        </div>

                        {loading && leaderboardRows.length === 0 ? (
                            <div className="flex justify-center py-16 text-gray-500 font-bold gap-2 items-center">
                                <Loader2 className="animate-spin" size={24} /> {c.loading || 'جاري التحميل...'}
                            </div>
                        ) : leaderboardRows.length === 0 ? (
                            <p className="text-center text-gray-500 font-bold py-8">
                                {c.emptyLeaderboard || 'لا يوجد متعلمون مسجّلون لهذه اللغة بعد. اختر لغة التعلم في الإعدادات أو كن أول من يظهر على اللوحة.'}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {leaderboardRows.map((user, index) => {
                                    const rank = user.rank ?? index + 1;
                                    const av = resolveAvatarUrl(
                                        user.is_you ? userImage || user.avatar : user.avatar,
                                        user.is_you ? userName : user.name
                                    );

                                    return (
                                        <motion.div
                                            key={`${user.user_id}-${rank}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl transition-all ${
                                                user.is_you
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 shadow-md transform scale-[1.02]'
                                                    : 'bg-gray-50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                                <div
                                                    className={`w-8 font-black flex justify-center text-lg ${
                                                        rank === 1
                                                            ? 'text-amber-500 text-2xl drop-shadow-md'
                                                            : rank === 2 ? 'text-slate-400 text-xl'
                                                              : rank === 3
                                                                ? 'text-amber-700 text-xl'
                                                                : 'text-gray-400'
                                                    }`}
                                                >
                                                    {rank === 1
                                                        ? '\u{1F947}'
                                                        : rank === 2
                                                          ? '\u{1F948}'
                                                          : rank === 3
                                                            ? '\u{1F949}'
                                                            : `#${rank}`}
                                                </div>

                                                <div
                                                    className={`w-12 h-12 rounded-xl overflow-hidden shadow-sm ${
                                                        user.is_you
                                                            ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                                                            : ''
                                                    }`}
                                                >
                                                    {av.includes('http') || av.includes('data:image') ? (
                                                        <img
                                                            src={av}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover bg-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="font-black text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                        {user.name}
                                                        {user.is_you && (
                                                            <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                                                                {c.you || 'أنت'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Flame
                                                            size={12}
                                                            className={
                                                                user.streak > 0
                                                                    ? 'text-orange-500'
                                                                    : 'text-gray-300'
                                                            }
                                                        />
                                                        {user.streak} {c.streakDays || 'أيام متتالية'}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                                                            {user.stories ?? 0} {c.storiesUnit || 'قصة'}
                                                        </span>
                                                        <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md">
                                                            {user.mastered ?? 0} {c.masteredUnit || 'متقنة'}
                                                        </span>
                                                        <span className="text-[10px] font-black bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md">
                                                            {user.reviews ?? 0} {c.reviewsUnit || 'مراجعة'}
                                                        </span>
                                                        <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                                                            {user.quiz_total ?? 0} {c.quizUnit || 'كويز'}
                                                            {(user.quiz_avg_percent ?? 0) > 0
                                                                ? ` · ${user.quiz_avg_percent}%`
                                                                : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0 sm:ps-4">
                                                <div className="font-black text-lg text-indigo-600 dark:text-indigo-400">
                                                    {user.xp.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                                    XP
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] p-6 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden text-center">
                        <div className="absolute -top-10 -right-10 text-white/10">
                            <Medal size={150} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-amber-100 font-bold mb-1">{c.currentRank || 'تصنيفك الحالي'}</p>
                            <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2">
                                {yourRank > 0 ? yourRank : '—'}{' '}
                                <span className="text-2xl text-amber-200 font-bold">
                                    {c.of || 'من'}{' '}
                                    {community != null && community.total_members > 0
                                        ? community.total_members
                                        : '…'}
                                </span>
                            </div>
                            <p className="text-sm font-bold bg-white/20 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm">
                                {yourRank === 1
                                    ? (c.topRankMessage || 'أنت في الصدارة! استمر يا بطل')
                                    : community?.ahead
                                      ? replaceVars(c.needXpAhead || 'تحتاج {xp} XP للتفوق على {name}', {
                                          xp: community.ahead.xp_needed.toLocaleString(),
                                          name: community.ahead.name.split(/\s+/)[0],
                                        })
                                      : (c.keepLearningRank || 'واصل التعلم لتصعد في الترتيب')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
                        <h3 className="font-black text-gray-900 dark:text-white px-2 mb-4">
                            {c.communityStats || 'إحصاءاتك مقارنة بالمجتمع'}
                        </h3>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-500">{c.completedStories || 'القصص المكتملة'}</div>
                                <div className="font-black text-gray-900 dark:text-white">
                                    {storiesCount}{' '}
                                    <span className="text-xs text-emerald-500">
                                        {replaceVars(c.aboveUsers || 'أعلى من {percent}% من المستخدمين', { percent: community?.percentiles.stories ?? 0 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Crown size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-500">{c.masteredCards || 'البطاقات المتقنة'}</div>
                                <div className="font-black text-gray-900 dark:text-white">
                                    {masteredCards}{' '}
                                    <span className="text-xs text-emerald-500">
                                        {replaceVars(c.aboveUsers || 'أعلى من {percent}% من المستخدمين', { percent: community?.percentiles.mastered ?? 0 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-500">{c.totalQuizzes || 'مجموع الكويزات'}</div>
                                <div className="font-black text-gray-900 dark:text-white">
                                    {quizStats?.totalQuizzes || 0} {c.accuracy || 'دقة'} {quizStats?.averageScore || 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black shadow-sm border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Activity size={20} /> {c.shareProgress || 'شارك تقدمك مع الأصدقاء'}
                    </button>
                </div>
            </div>
        </div>
    );
};
