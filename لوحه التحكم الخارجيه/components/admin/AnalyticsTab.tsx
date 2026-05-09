import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users, TrendingUp, Clock, AlertCircle,
    BookOpen, CheckCircle, ArrowUpRight, ArrowDownRight, Activity, RefreshCw
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
