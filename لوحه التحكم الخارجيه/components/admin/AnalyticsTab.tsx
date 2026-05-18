import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users, TrendingUp, Clock, AlertCircle,
    BookOpen, CheckCircle, ArrowUpRight, ArrowDownRight, Activity, RefreshCw, Star, Gauge, Search, ChevronDown
} from 'lucide-react';
import { AnalyticsDashboardData } from '../../types';
import { AdminAPI } from '../../services/apiClient';
import { AdminLang } from './AdminSidebar';

interface AnalyticsTabProps {
    adminLang: AdminLang;
}

type ApiDashboardResponse = {
    overview: AnalyticsDashboardData['overview'] & {
        trends?: {
            activeNow?: string;
            totalStudents?: string;
            completionRateAvg?: string;
            totalTimeSpent?: string;
        };
    };
    retention: AnalyticsDashboardData['retention'];
    topStories: AnalyticsDashboardData['topStories'];
    difficultQuestions: AnalyticsDashboardData['difficultQuestions'];
    lessonRatings?: AnalyticsDashboardData['lessonRatings'];
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ adminLang }) => {
    const [data, setData] = useState<AnalyticsDashboardData | null>(null);
    const [trends, setTrends] = useState<NonNullable<ApiDashboardResponse['overview']['trends']>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyDashboard = useCallback((res: ApiDashboardResponse) => {
        setTrends(res.overview?.trends ?? {});
        setData({
            overview: {
                totalStudents: res.overview.totalStudents,
                activeNow: res.overview.activeNow,
                completionRateAvg: res.overview.completionRateAvg,
                totalTimeSpent: res.overview.totalTimeSpent,
            },
            retention: res.retention ?? [],
            topStories: res.topStories ?? [],
            difficultQuestions: res.difficultQuestions ?? [],
            lessonRatings: res.lessonRatings,
        });
    }, []);

    const fetchDashboard = useCallback(
        async (mode: 'initial' | 'refresh') => {
            if (mode === 'initial') {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            setError(null);
            try {
                const res = (await AdminAPI.getAnalyticsDashboard(adminLang)) as ApiDashboardResponse;
                applyDashboard(res);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'تعذر تحميل التحليلات';
                setError(msg);
                if (mode === 'initial') {
                    setData(null);
                }
            } finally {
                if (mode === 'initial') {
                    setLoading(false);
                } else {
                    setRefreshing(false);
                }
            }
        },
        [adminLang, applyDashboard]
    );

    useEffect(() => {
        fetchDashboard('initial');
    }, [fetchDashboard]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-gray-400 font-bold">
                <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                جاري تحميل التحليلات من الخادم…
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="rounded-[2rem] border border-red-500/30 bg-red-500/5 p-8 text-center space-y-4">
                <p className="text-red-400 font-bold">تعذر تحميل بيانات التحليلات</p>
                <p className="text-sm text-gray-500">{error}</p>
                <button
                    type="button"
                    onClick={() => fetchDashboard('initial')}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 text-red-300 font-bold text-sm border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const t = trends;

    return (
        <motion.div
            key="analytics"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="space-y-10"
        >
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">التحليلات المتقدمة 📊</h2>
                    <p className="text-gray-400 font-medium">اكتشف أنماط تعلم الطلاب، نقاط الصعوبة، وأكثر المحتويات تفاعلاً.</p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchDashboard('refresh')}
                    disabled={refreshing}
                    title="تحديث البيانات من الخادم دون إعادة تحميل الصفحة"
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'جاري التحديث…' : 'تحديث البيانات'}
                </button>
            </header>

            {error && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm font-medium flex flex-wrap items-center justify-between gap-2">
                    <span>تعذر آخر تحديث: {error}</span>
                    <button
                        type="button"
                        onClick={() => fetchDashboard('refresh')}
                        className="text-amber-100 underline font-bold"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    icon={Users}
                    label="الطلاب النشطين"
                    value={data.overview.activeNow}
                    trend={t.activeNow ?? '—'}
                    color="blue"
                    suffix="الآن"
                />
                <KPICard
                    icon={Activity}
                    label="إجمالي الطلاب"
                    value={data.overview.totalStudents}
                    trend={t.totalStudents ?? '—'}
                    color="purple"
                />
                <KPICard
                    icon={CheckCircle}
                    label="معدل الإكمال"
                    value={data.overview.completionRateAvg}
                    trend={t.completionRateAvg ?? '—'}
                    color="green"
                    suffix="%"
                />
                <KPICard
                    icon={Clock}
                    label="ساعات التعلم"
                    value={data.overview.totalTimeSpent}
                    trend={t.totalTimeSpent ?? '—'}
                    color="amber"
                />
            </div>

            {data.lessonRatings && (
                <LessonRatingsPanel data={data.lessonRatings} />
            )}

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 overflow-hidden">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <AlertCircle className="text-red-500" />
                        نقاط الصعوبة ⚠️
                    </h3>
                    <div className="space-y-4">
                        {data.difficultQuestions.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">
                                لا توجد محاولات مسجّلة بعد. تظهر القائمة عندما يجيب الطلاب المسجّلون على أسئلة القصص من التطبيق.
                            </p>
                        ) : (
                            data.difficultQuestions.map((q, idx) => (
                                <div key={`${q.id}-${idx}`} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] text-gray-400 font-bold bg-white/5 px-2 py-1 rounded-lg">{q.storyTitle}</span>
                                        <span className="text-xs font-black text-red-500">{q.errorRate}% خطأ</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-300 mb-3 line-clamp-2">&quot;{q.questionText}&quot;</p>
                                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${q.errorRate}%` }}
                                            className="h-full bg-red-500"
                                        />
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                                        <span>{q.attempts} محاولة</span>
                                        <span className="text-red-400 font-bold">{q.difficulty}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 rounded-[2.5rem] p-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    <BookOpen className="text-amber-500" />
                    أداء القصص (الأكثر قراءة) 📚
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-right border-collapse">
                        <colgroup>
                            <col className="w-[32%]" />
                            <col className="w-[14%]" />
                            <col className="w-[22%]" />
                            <col className="w-[14%]" />
                            <col className="w-[18%]" />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                <th className="pb-4 pr-4 align-bottom">القصة</th>
                                <th className="pb-4 align-bottom">المشاهدات</th>
                                <th className="pb-4 align-bottom">معدل الإكمال</th>
                                <th className="pb-4 align-bottom">متوسط الوقت</th>
                                <th className="pb-4 align-bottom">التفاعل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.topStories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500 text-sm font-bold">لا توجد قصص ضمن الفلتر الحالي.</td>
                                </tr>
                            ) : (
                                data.topStories.map((story, idx) => (
                                    <tr key={story.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 pr-4 align-middle">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-gray-600 font-mono text-xs shrink-0">#{idx + 1}</span>
                                                <span className="font-bold text-white truncate" title={story.title}>{story.title}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-gray-300 font-mono align-middle whitespace-nowrap" dir="ltr">{story.views.toLocaleString()}</td>
                                        <td className="py-4 align-middle">
                                            <div className="flex items-center justify-end gap-2 whitespace-nowrap min-w-0">
                                                <div className="h-1.5 w-14 shrink-0 bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${Math.min(100, story.completionRate)}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-green-400 tabular-nums shrink-0">{story.completionRate}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-gray-300 align-middle whitespace-nowrap tabular-nums" dir="ltr">
                                            {story.avgTimeSpent} دقيقة
                                        </td>
                                        <td className="py-4 text-amber-500 font-bold align-middle whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 justify-end" dir="ltr">
                                                <TrendingUp size={14} className="shrink-0" />
                                                {story.likes}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

const statusClasses: Record<string, string> = {
    insufficient: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
    excellent: 'bg-green-500/10 text-green-300 border-green-500/25',
    very_good: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    average: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    weak: 'bg-orange-500/10 text-orange-300 border-orange-500/25',
    very_bad: 'bg-red-500/10 text-red-300 border-red-500/25',
};

const barClasses: Record<string, string> = {
    '5': 'bg-green-400',
    '4': 'bg-emerald-400',
    '3': 'bg-amber-400',
    '2': 'bg-orange-400',
    '1': 'bg-red-400',
};

const LessonRatingsPanel = ({ data }: { data: NonNullable<AnalyticsDashboardData['lessonRatings']> }) => {
    const overview = data.overview;
    const lessons = data.lessons ?? [];
    const [isLessonsOpen, setIsLessonsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredLessons = useMemo(() => {
        if (!normalizedSearch) {
            return lessons;
        }

        return lessons.filter((lesson) => {
            const searchable = [
                lesson.lessonTitle,
                lesson.moduleTitle ?? '',
                lesson.lang,
                lesson.averageRating.toFixed(1),
                lesson.satisfaction.label,
            ].join(' ').toLowerCase();

            return searchable.includes(normalizedSearch);
        });
    }, [lessons, normalizedSearch]);
    const showLessonsList = isLessonsOpen || normalizedSearch.length > 0;

    return (
        <section className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 md:p-8 overflow-hidden">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-7">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <Star className="text-amber-400 fill-amber-400" />
                        تقييمات الدروس
                    </h3>
                    <p className="text-sm text-gray-400 font-medium mt-2">
                        مؤشر رضا الطلاب محسوب من متوسط النجوم وعدد التقييمات لكل درس.
                    </p>
                </div>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-black ${statusClasses[overview.satisfaction.status] ?? statusClasses.insufficient}`}>
                    <Gauge size={16} />
                    {overview.satisfaction.label}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
                <RatingMiniStat label="إجمالي التقييمات" value={overview.totalRatings.toLocaleString()} />
                <RatingMiniStat label="دروس تم تقييمها" value={overview.ratedLessons.toLocaleString()} />
                <RatingMiniStat label="المتوسط العام" value={`${overview.averageRating.toFixed(1)} ★`} />
                <RatingMiniStat label="حد الثقة" value={`${overview.minimumReliableRatings}+ تقييم`} />
            </div>

            {lessons.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
                    <p className="text-gray-400 font-bold">لا توجد تقييمات دروس حتى الآن.</p>
                    <p className="text-xs text-gray-500 mt-2">ستظهر البيانات هنا بعد أن يقيم الطلاب الدروس من المسار التعليمي.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <LessonRatingHighlight title="أفضل رد فعل" lesson={overview.bestLesson} tone="good" />
                        <LessonRatingHighlight title="يحتاج مراجعة" lesson={overview.lowestLesson} tone="bad" />
                    </div>

                    <div className="rounded-3xl border border-white/5 bg-white/[0.03] overflow-hidden">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 border-b border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsLessonsOpen((value) => !value)}
                                className="inline-flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-right hover:bg-white/[0.07] hover:border-white/20 transition-colors"
                            >
                                <span>
                                    <span className="block text-sm font-black text-white">قائمة الدروس المقيمة</span>
                                    <span className="block text-xs text-gray-500 mt-1">
                                        {filteredLessons.length} من {lessons.length} درس
                                    </span>
                                </span>
                                <ChevronDown
                                    size={18}
                                    className={`text-gray-400 transition-transform duration-300 ${showLessonsList ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <label className="relative block lg:w-[360px]">
                                <Search size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onFocus={() => setIsLessonsOpen(true)}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="ابحث باسم الدرس أو الوحدة..."
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pr-11 pl-4 text-sm font-bold text-white outline-none placeholder:text-gray-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition"
                                />
                            </label>
                        </div>

                        {showLessonsList && (
                            <div className="max-h-[560px] overflow-y-auto p-4 space-y-3">
                                {filteredLessons.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-center text-sm font-bold text-gray-500">
                                        لا يوجد درس مطابق للبحث الحالي.
                                    </div>
                                ) : (
                                    filteredLessons.map((lesson) => (
                                        <div
                                            key={`${lesson.lang}-${lesson.lessonId}`}
                                            className="grid grid-cols-1 gap-4 rounded-2xl border border-white/5 bg-slate-950/45 p-4 transition-colors hover:border-white/10 hover:bg-slate-950/70 xl:grid-cols-[1.1fr_0.55fr_0.55fr_1fr]"
                                        >
                                            <div className="min-w-0">
                                                <div className="font-black text-white truncate" title={lesson.lessonTitle}>{lesson.lessonTitle}</div>
                                                <div className="text-xs text-gray-500 mt-1 truncate" title={lesson.moduleTitle || ''}>
                                                    {lesson.lang.toUpperCase()} · {lesson.moduleTitle || 'بدون وحدة'}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] text-gray-500 font-bold mb-1">المتوسط</div>
                                                <div className="whitespace-nowrap">
                                                    <span className="font-black text-amber-300">{lesson.averageRating.toFixed(1)} ★</span>
                                                    <span className="text-xs text-gray-500 mr-2">/ {lesson.ratingsCount}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] text-gray-500 font-bold mb-1">الحالة</div>
                                                <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-black ${statusClasses[lesson.satisfaction.status] ?? statusClasses.insufficient}`}>
                                                    {lesson.satisfaction.label}
                                                </span>
                                            </div>

                                            <div>
                                                <div className="text-[10px] text-gray-500 font-bold mb-2">توزيع النجوم</div>
                                                <RatingDistribution distribution={lesson.distribution} total={lesson.ratingsCount} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

const RatingMiniStat = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-xs text-gray-500 font-bold mt-1">{label}</div>
    </div>
);

const LessonRatingHighlight = ({
    title,
    lesson,
    tone,
}: {
    title: string;
    lesson: NonNullable<AnalyticsDashboardData['lessonRatings']>['overview']['bestLesson'];
    tone: 'good' | 'bad';
}) => {
    const toneClass = tone === 'good'
        ? 'from-green-500/10 to-emerald-500/5 border-green-500/20'
        : 'from-red-500/10 to-orange-500/5 border-red-500/20';

    if (!lesson) {
        return (
            <div className={`rounded-3xl bg-gradient-to-br ${toneClass} border p-5`}>
                <div className="text-sm text-gray-400 font-bold">{title}</div>
                <div className="text-white font-black mt-2">لا توجد بيانات</div>
            </div>
        );
    }

    return (
        <div className={`rounded-3xl bg-gradient-to-br ${toneClass} border p-5`}>
            <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-sm text-gray-400 font-bold">{title}</span>
                <span className={`px-3 py-1 rounded-full border text-xs font-black ${statusClasses[lesson.satisfaction.status] ?? statusClasses.insufficient}`}>
                    {lesson.satisfaction.label}
                </span>
            </div>
            <div className="text-white font-black line-clamp-1" title={lesson.lessonTitle}>{lesson.lessonTitle}</div>
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{lesson.moduleTitle || '—'}</div>
            <div className="mt-4 flex items-end justify-between gap-4">
                <div className="text-3xl font-black text-amber-300">{lesson.averageRating.toFixed(1)} ★</div>
                <div className="text-sm text-gray-400 font-bold">{lesson.ratingsCount} تقييم</div>
            </div>
            {lesson.satisfaction.description && (
                <p className="text-xs text-gray-400 leading-6 mt-3">{lesson.satisfaction.description}</p>
            )}
        </div>
    );
};

const RatingDistribution = ({
    distribution,
    total,
}: {
    distribution: Record<'5' | '4' | '3' | '2' | '1', number>;
    total: number;
}) => (
    <div className="space-y-1.5 w-64">
        {(['5', '4', '3', '2', '1'] as const).map((star) => {
            const count = distribution?.[star] ?? 0;
            const width = total > 0 ? Math.max(4, Math.round((count / total) * 100)) : 0;
            return (
                <div key={star} className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="w-9 shrink-0">{star} ★</span>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${barClasses[star]}`} style={{ width: `${width}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-left">{count}</span>
                </div>
            );
        })}
    </div>
);

const KPICard = ({
    icon: Icon,
    label,
    value,
    trend,
    color,
    suffix = '',
}: {
    icon: typeof Users;
    label: string;
    value: number;
    trend: string;
    color: 'blue' | 'purple' | 'green' | 'amber' | 'red';
    suffix?: string;
}) => {
    const isNeutral = trend === '—' || trend === '-' || trend.trim() === '';
    const isPositive = !isNeutral && trend.startsWith('+');
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        green: 'bg-green-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
    };

    const trendWrap = isNeutral
        ? 'bg-gray-500/10 text-gray-400'
        : isPositive
          ? 'bg-green-500/10 text-green-500'
          : 'bg-red-500/10 text-red-500';

    return (
        <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 bg-white/5 blur-2xl group-hover:bg-${color}-500/20 transition-colors`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClasses[color]}/10 text-${color}-500 border border-${color}-500/20`}>
                    <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendWrap}`}>
                    {!isNeutral && (isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                    {trend}
                </div>
            </div>

            <h3 className="text-3xl font-black text-white mb-1 relative z-10">
                {value.toLocaleString()}
                <span className="text-lg text-gray-500 ml-1">{suffix}</span>
            </h3>
            <p className="text-sm text-gray-400 font-medium relative z-10">{label}</p>
        </div>
    );
};
