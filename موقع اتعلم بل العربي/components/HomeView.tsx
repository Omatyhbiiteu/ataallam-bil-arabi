import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, Brain, Crown, ArrowRight, X, Calendar, MapPin, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stats, Card, Story, Module, AppTheme, ReviewLog, PromoBanner, InspirationalSlide } from '../types';
import { THEMES_DATA } from './ThemeVisuals';
import { ActivityHeatmap } from './ActivityHeatmap';
import { HomeBanner } from './home/HomeBanner';
import { StatsGrid } from './home/StatsGrid';
import { DailyProgress } from './home/DailyProgress';
import { QuickActions } from './home/QuickActions';
import { StatusOverview } from './home/StatusOverview';
import { KnowledgeSlider } from './KnowledgeSlider';
import { OffersSlider } from './home/OffersSlider';
import { APP_CONSTANTS } from '../data/constants';
import { PaymentService } from '../services/paymentService';

interface HomeViewProps {
    stats: Stats;
    dueCardsCount: number;
    cards: Card[];
    reviewLog: ReviewLog[];
    stories: Story[];
    curriculum: Module[];
    completedLessonIds: string[];
    userName: string;
    userImage: string | null;
    subscriptionPlan?: 'free' | 'silver' | 'pro' | 'enterprise';
    planSubscribedAt?: string | null;
    planExpiresAt?: string | null;
    /** اشتراك برو/Enterprise نشط — يُمرَّر من App ليتوافق مع الشارة والبانر */
    isProSubscriber?: boolean;
    onSyncProfileFromServer?: () => void;
    t: any;
    selectedTheme: AppTheme;
    darkMode: boolean;
    onStartSession: () => void;
    setActiveTab: (tab: string) => void;
    onNavigateToSettings: (section: 'subscription' | 'account' | 'notifications' | 'appearance' | 'support') => void;
    studyPlan?: any;
    offersBanners?: PromoBanner[];
    inspirationalSlides?: InspirationalSlide[];
}

export const HomeView: React.FC<HomeViewProps> = ({
    stats,
    dueCardsCount,
    cards,
    reviewLog,
    stories: _stories,
    curriculum: _curriculum,
    completedLessonIds: _completedLessonIds,
    userName,
    userImage,
    subscriptionPlan = 'free',
    planSubscribedAt = null,
    planExpiresAt = null,
    isProSubscriber = false,
    onSyncProfileFromServer,
    t,
    selectedTheme,
    darkMode,
    onStartSession,
    setActiveTab,
    onNavigateToSettings,
    studyPlan,
    offersBanners = [],
    inspirationalSlides = []
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [subscriptionPrice, setSubscriptionPrice] = useState(PaymentService.getSettings().price);
    const [greeting, setGreeting] = useState('');
    const [promoDismissed, setPromoDismissed] = useState(false);
    const trimmedName = userName?.trim();
    const safeUserName = trimmedName || 'صديقنا';
    const firstName = trimmedName ? trimmedName.split(/\s+/)[0] : safeUserName;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const hour = currentTime.getHours();
        if (hour < 12) setGreeting(t.home?.goodMorning || 'صباح الخير');
        else if (hour < 18) setGreeting(t.home?.goodAfternoon || 'مساء الخير');
        else setGreeting(t.home?.goodEvening || 'مساء الخير');
    }, [currentTime, t]);

    useEffect(() => {
        onSyncProfileFromServer?.();
    }, [onSyncProfileFromServer]);

    const hasActiveSubscription = isProSubscriber;

    const formatSubDate = (iso: string | null | undefined) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const planLabel =
        subscriptionPlan === 'enterprise'
            ? 'باقة أعمال (Enterprise)'
            : subscriptionPlan === 'silver'
              ? 'باقة سيلفر'
              : 'باقة البرو';

    const dailyWisdom = t.home?.dailyWisdom || 'حكمة اليوم';
    const motivationalQuotes = t.motivationalQuotes || [
        'التعلم رحلة، وليس وجهة 🌟',
        'كل يوم فرصة جديدة للتقدم 💪',
        'الاستمرارية هي سر النجاح 🔥',
        'أنت أقوى مما تعتقد 🚀'
    ];
    const dayOfYear = Math.floor((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    const randomQuote = motivationalQuotes[dayOfYear % motivationalQuotes.length];

    // Dates
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(currentTime);
    const gregorianDate = currentTime.toLocaleDateString(t.locale === 'en' ? 'en-US' : (t.locale === 'de' ? 'de-DE' : 'ar-EG'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Theme Data
    const themeData = THEMES_DATA[selectedTheme];
    const isHoliday = !!themeData.greeting;

    const dailyGoal = 20;
    const msPerDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate()).getTime();

    const getLastReviewedAt = (card: Card) => {
        if (!card.nextReview || !card.interval) return null;
        return Math.max(0, card.nextReview - card.interval * 60 * 1000);
    };

    const buildDailyCountsFromLog = (days: number) => {
        const counts = Array.from({ length: days }, () => 0);
        reviewLog.forEach((entry) => {
            if (!entry || entry.count <= 0) return;
            let dayIndex = Math.floor((startOfToday - entry.date) / msPerDay);
            if (dayIndex < 0) dayIndex = 0;
            if (dayIndex < days) {
                const targetIndex = days - 1 - dayIndex;
                counts[targetIndex] += entry.count;
            }
        });
        return counts;
    };

    const recentCards = cards
        .filter((card) => card.reviews > 0)
        .map((card) => ({ card, lastReviewedAt: getLastReviewedAt(card) }))
        .filter((entry) => entry.lastReviewedAt !== null)
        .sort((a, b) => (b.lastReviewedAt || 0) - (a.lastReviewedAt || 0))
        .slice(0, 5)
        .map((entry) => entry.card);

    const suggestedCards = cards
        .filter((card) => card.nextReview && card.nextReview <= Date.now())
        .sort((a, b) => a.nextReview - b.nextReview)
        .slice(0, 3);

    const reviewActivity = buildDailyCountsFromLog(15);
    const maxReviewCount = Math.max(...reviewActivity, 0);
    const reviewHeights = maxReviewCount
        ? reviewActivity.map((count) => Math.max(8, Math.round((count / maxReviewCount) * 100)))
        : [];

    const heatmapCounts = buildDailyCountsFromLog(100);
    const maxHeatmapCount = Math.max(...heatmapCounts, 0);
    const heatmapData = heatmapCounts.map((count) => {
        if (maxHeatmapCount === 0) return 0;
        const ratio = count / maxHeatmapCount;
        if (ratio === 0) return 0;
        if (ratio < 0.25) return 1;
        if (ratio < 0.5) return 2;
        if (ratio < 0.75) return 3;
        return 4;
    });

    return (
        <div className="p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 animate-slide-up pb-32 max-w-[1920px] mx-auto">


            <HomeBanner
                isHoliday={isHoliday}
                themeData={themeData}
                darkMode={darkMode}
                userImage={userImage}
                userName={safeUserName}
                isProSubscriber={isProSubscriber}
                greeting={greeting}
                randomQuote={randomQuote}
                hijriDate={hijriDate}
                gregorianDate={gregorianDate}
                dailyWisdomLabel={dailyWisdom}
            />

            {/* --- PRO STATUS / UPSELL STRIP --- */}
            <AnimatePresence>
                {hasActiveSubscription ? (
                    <motion.div
                        key="pro-active"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="flex items-center gap-3 rounded-2xl border border-emerald-400/35 bg-emerald-50/90 dark:bg-emerald-950/40 px-4 py-2.5 shadow-sm"
                    >
                        <Crown size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <p className="flex-1 text-sm text-emerald-900 dark:text-emerald-100 font-medium leading-snug">
                            <span className="font-bold">أنت مشترك في {planLabel}.</span>
                            {planSubscribedAt && planExpiresAt ? (
                                <>
                                    {' '}
                                    مدة الاشتراك شهر من تفعيل المسؤول: من{' '}
                                    <span className="font-bold tabular-nums">{formatSubDate(planSubscribedAt)}</span>
                                    {' '}إلى{' '}
                                    <span className="font-bold tabular-nums">{formatSubDate(planExpiresAt)}</span>.
                                </>
                            ) : (
                                <> اشتراكك نشط.</>
                            )}
                        </p>
                    </motion.div>
                ) : (
                    !promoDismissed && (
                        <motion.div
                            key="upsell"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-2.5 shadow-sm"
                        >
                            <Crown size={16} className="shrink-0 text-amber-500" />
                            <p className="flex-1 text-sm text-amber-800 dark:text-amber-200 font-medium leading-snug">
                                فعّل إمكانياتك الكاملة بـ{' '}
                                <span className="font-bold">{subscriptionPrice} {APP_CONSTANTS.CURRENCY}</span>
                                {' '}فقط — تجربة احترافية بدون إعلانات.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onNavigateToSettings('subscription')}
                                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors text-white text-xs font-bold px-3 py-1.5"
                            >
                                ترقية
                                <ArrowRight size={13} className="rtl:rotate-180" />
                            </motion.button>
                            <button
                                type="button"
                                onClick={() => setPromoDismissed(true)}
                                className="shrink-0 p-1 rounded-lg text-amber-500/70 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors"
                                aria-label="إغلاق"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    )
                )}
            </AnimatePresence>

            {/* --- عروض المسؤول (تحت مربع الترقية) --- */}
            <div className="grid grid-cols-1 gap-8 md:gap-10">
                <OffersSlider
                    offers={offersBanners}
                    onNavigateToSettings={onNavigateToSettings}
                />
            </div>

            {/* --- ACTIVE STUDY PLAN BANNER --- */}
            <AnimatePresence>
                {studyPlan && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden text-white cursor-pointer group"
                        onClick={() => {
                            localStorage.setItem('ai_assistant_intent', 'plan');
                            setActiveTab('ai_assistant');
                        }}
                    >
                        {/* Background Decorations */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-sm font-bold shadow-sm">
                                    <Target size={16} />
                                    <span>خطة دراستك الذكية المخصصة نشطة الآن 🚀</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black">
                                    استمر في خطتك لتحقيق أفضل النتائج!
                                </h3>
                                <p className="text-white/80 font-medium max-w-xl text-sm md:text-base leading-relaxed">
                                    المساعد الذكي قام بتصميم خطة تناسب وقتك ومستواك. اضغط لفتح الواجهة ومتابعة مهامك اليومية أو تعديل الخطة.
                                </p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="shrink-0 bg-white text-indigo-600 hover:bg-stone-50 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-colors group-hover:shadow-white/20"
                            >
                                <Calendar size={20} />
                                فتح الخطة
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <StatsGrid
                stats={stats}
                dueCardsCount={dueCardsCount}
                t={t}
            />

            <DailyProgress
                stats={stats}
                dailyGoal={dailyGoal}
                t={t}
            />

            {/* --- الشريط الإلهامي (حكمة اليوم) --- */}
            <KnowledgeSlider selectedTheme={selectedTheme} onStartSession={onStartSession} slides={inspirationalSlides} />

            <QuickActions
                t={t}
                selectedTheme={selectedTheme}
                themeData={themeData}
                onStartSession={onStartSession}
                setActiveTab={setActiveTab}
            />

            {/* --- ADVANCED ANALYTICS (Merged from Dashboard) --- */}
            {/* Heatmap Section */}
            <div className="bg-white dark:bg-dark-card rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-stone-100 dark:border-gray-800">
                <ActivityHeatmap t={t} data={heatmapData} />
            </div>

            {/* Story Stats & Status Breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
                {/* Story Stats Card */}
                <div
                    onClick={() => setActiveTab('stories')}
                    className="bg-white dark:bg-dark-card rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-stone-100 dark:border-gray-800 relative group overflow-hidden cursor-pointer"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10 space-y-12">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{t.home?.storyStats || 'إحصائيات القصص'}</h3>
                                <p className="text-stone-400 font-bold">{t.home?.storyTrack || 'تتبع تقدمك في التفاعل مع المحتوى القرائي'}</p>
                            </div>
                            <div className="w-20 h-20 bg-indigo-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                                <Brain size={36} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-stone-50 dark:bg-gray-800 p-8 rounded-[2.5rem] border border-stone-100 dark:border-gray-700 text-center">
                                <div className="text-5xl font-black text-indigo-600 mb-2">{stats.quizStats?.totalQuizzes || 0}</div>
                                <div className="text-xs font-black uppercase text-gray-400 tracking-widest">{t.home?.completedQuizzes || 'اختبارات مكتملة'}</div>
                            </div>
                            <div className="bg-stone-50 dark:bg-gray-800 p-8 rounded-[2.5rem] border border-stone-100 dark:border-gray-700 text-center">
                                <div className="text-5xl font-black text-indigo-600 mb-2">{stats.quizStats?.averageScore || 0}%</div>
                                <div className="text-xs font-black uppercase text-gray-400 tracking-widest">{t.home?.averageScore || 'متوسط الدرجات'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Breakdown Grid */}
                <div className="bg-white dark:bg-dark-card rounded-[3.5rem] p-10 shadow-2xl border border-stone-100 dark:border-gray-800 flex flex-col justify-center">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-10 text-center flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Activity size={24} />
                        </div>
                        {t.home?.statusBreakdown || 'توزيع البطاقات حسب الحالة'}
                    </h3>

                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { label: t.dashboard?.mastered || 'متقنة', value: stats.byStatus.mastered, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: t.dashboard?.new || 'جديدة', value: stats.byStatus.new, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'في المراجعة', value: stats.byStatus.review, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                            { label: 'جاري التعلم', value: stats.byStatus.learning, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        ].map((item, i) => (
                            <div key={i} className="group/perf flex items-center gap-6 p-6 md:p-8 bg-stone-50/50 dark:bg-gray-800/50 rounded-[2.5rem] border border-stone-100 dark:border-gray-700 hover:border-primary/20 transition-all duration-300 transform hover:scale-105">
                                <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-[1.5rem] flex items-center justify-center shadow-lg`}>
                                    <Activity size={28} />
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-gray-900 dark:text-white leading-none mb-1">{item.value}</div>
                                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none outline-none">{item.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Review Activity Information */}
            <div className="bg-gradient-to-br from-slate-900 to-black p-10 md:p-14 rounded-[3.5rem] shadow-2xl text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black leading-none flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl text-white border border-white/20">
                                <TrendingUp size={28} />
                            </div>
                            {t.home?.reviewChart || 'مخطط المراجعة'}
                        </h3>
                        <p className="text-white/60 font-bold">{t.home?.reviewChartSubtitle || 'عدد البطاقات التي تمت مراجعتها خلال آخر 15 يوماً'}</p>
                    </div>
                </div>

                {maxReviewCount === 0 ? (
                    <div className="h-40 flex items-center justify-center text-white/60 font-bold">
                        لا توجد بيانات مراجعة كافية بعد.
                    </div>
                ) : (
                    <div className="flex items-end justify-between gap-2 h-40">
                        {reviewHeights.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-white/10 rounded-full transition-all duration-500 group-hover:bg-primary group-hover:scale-y-110 origin-bottom"
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <StatusOverview
                t={t}
                recentCards={recentCards}
                suggestedCards={suggestedCards}
            />

        </div>
    );
};


