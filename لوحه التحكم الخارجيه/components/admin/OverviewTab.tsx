
import React from 'react';
import { BookOpen, Map, Layers, Activity, TrendingUp, ChevronRight, Star, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Story, Module, Card, AppTheme } from '../../types';
import { THEMES_DATA } from '../ThemeVisuals';
import { AdminStats } from './AdminStats';
import { Shield, Zap } from 'lucide-react';

const ToggleSwitch = ({ enabled, onChange, color = 'bg-red-600' }: { enabled: boolean; onChange: () => void; color?: string }) => (
    <button
        type="button"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange();
        }}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${enabled ? `${color} shadow-lg shadow-black/20` : 'bg-gray-700'
            }`}
    >
        <div
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${enabled ? 'right-1 scale-110' : 'left-1 scale-90'
                }`}
        >
            {enabled && <Zap size={10} className="text-gray-900" />}
        </div>
    </button>
);

interface OverviewTabProps {
    stories: Story[];
    curriculum: Module[];
    cards: Card[];
    selectedTheme: AppTheme;
    setActiveTab: (tab: any) => void;
    setShowStoryForm: (show: boolean) => void;
    langAvailability: any;
    setLangAvailability: (val: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    stories,
    curriculum,
    cards,
    selectedTheme,
    setActiveTab,
    setShowStoryForm,
    langAvailability,
    setLangAvailability
}) => {
    return (
        <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
        >

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">مرحباً بك، أيها المسؤول 👋</h2>
                    <p className="text-gray-400 font-medium">إليك ملخص سريع لأداء المنصة والمحتوى التعليمي اليوم.</p>
                </div>
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <button className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-900/40">اليوم</button>
                    <button className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-bold">هذا الأسبوع</button>
                </div>
            </header>

            {/* --- THEME GREETING BANNER (Cinematic) --- */}
            {THEMES_DATA[selectedTheme]?.greeting && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                    className="relative w-full rounded-[2.5rem] overflow-hidden p-10 md:p-14 text-center md:text-right border border-white/10 shadow-2xl group"
                >
                    {/* Dynamic Background */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/40 z-10" />
                        <img
                            src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2672&auto=format&fit=crop"
                            className="w-full h-full object-cover opacity-30 mix-blend-overlay filter blur-sm scale-110 group-hover:scale-100 transition-transform duration-[20s]"
                            alt="Ambient BG"
                        />
                        <div
                            className="absolute inset-0 opacity-40 transition-colors duration-1000"
                            style={{ background: `linear-gradient(135deg, ${THEMES_DATA[selectedTheme].primary}40, transparent)` }}
                        />
                    </div>

                    <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-8">

                        {/* Cinematic Text Reveal */}
                        <div className="flex flex-col items-center md:items-start space-y-4">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEMES_DATA[selectedTheme].accent }} />
                                <span className="text-xs font-bold tracking-wider text-gray-300 uppercase">Current Mood</span>
                            </div>

                            <div className="overflow-hidden">
                                <motion.h1
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                    className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 drop-shadow-2xl"
                                >
                                    {THEMES_DATA[selectedTheme].greeting}
                                </motion.h1>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="h-1 w-24 rounded-full"
                                style={{ backgroundColor: THEMES_DATA[selectedTheme].accent }}
                            />
                        </div>

                        {/* Large Floating Icon */}
                        <motion.div
                            initial={{ rotate: -10, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", duration: 1.5, bounce: 0.5, delay: 0.4 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 blur-3xl opacity-40 animate-pulse" style={{ backgroundColor: THEMES_DATA[selectedTheme].primary }} />
                            <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-[2.5rem] border border-white/20 backdrop-blur-md shadow-2xl flex items-center justify-center">
                                {React.createElement(THEMES_DATA[selectedTheme].icon || BookOpen, {
                                    size: 80,
                                    className: "drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]",
                                    style: { color: THEMES_DATA[selectedTheme].primary }
                                })}
                            </div>
                            {/* Decorative Elements around Icon */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-4 border border-dashed border-white/20 rounded-full z-[-1]"
                            />
                        </motion.div>

                    </div>
                </motion.div>
            )}


            {/* Stats Grid */}
            <AdminStats stories={stories} curriculum={curriculum} cards={cards} />

            {/* Language Access Controls (Admin View) */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-xl text-white">التحكم في اللغات المتاحة</h4>
                        <p className="text-sm text-gray-400">إيقاف أو تمكين اللغات في واجهة الدخول للمستخدمين الجدد</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                        <span className="font-bold text-gray-200">اللغة الإنجليزية</span>
                        <ToggleSwitch
                            color="bg-blue-600"
                            enabled={langAvailability?.en ?? true}
                            onChange={() => {
                                setLangAvailability({ ...(langAvailability || { en: true, de: true }), en: !(langAvailability?.en ?? true) });
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                        <span className="font-bold text-gray-200">اللغة الألمانية</span>
                        <ToggleSwitch
                            color="bg-amber-600"
                            enabled={langAvailability?.de ?? true}
                            onChange={() => {
                                setLangAvailability({ ...(langAvailability || { en: true, de: true }), de: !(langAvailability?.de ?? true) });
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity / Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <TrendingUp className="text-red-500" />
                                نظرة على المحتوى
                            </h3>
                            <button onClick={() => setActiveTab('stories')} className="text-xs font-bold text-gray-500 hover:text-white transition-colors underline decoration-red-500/50 underline-offset-8">عرض الكل</button>
                        </div>
                        <div className="p-4">
                            <div className="space-y-2">
                                {stories.slice(0, 3).map(story => (
                                    <div key={story.id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors group cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800">
                                            <img src={story.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-gray-100">{story.title}</h4>
                                            <p className="text-xs text-gray-500">{story.level} • {story.questions?.length || 0} أسئلة</p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-700 group-hover:text-red-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Info Box */}
                <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                            <Star size={28} className="text-yellow-300 fill-yellow-300" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 leading-tight">جاهز لتعليم العالم؟</h3>
                        <p className="text-red-100 font-medium text-sm leading-relaxed mb-8 opacity-90">استخدم الأدوات المتقدمة في لوحة التحكم لإنشاء تجربة تعليمية لا تُنسى لطلابك.</p>
                    </div>
                    <button
                        onClick={() => setShowStoryForm(true)}
                        className="relative z-10 w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-xl shadow-red-900/40 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        إضافة قصة جديدة الآن
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
