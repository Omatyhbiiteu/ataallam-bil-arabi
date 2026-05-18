import React, { useEffect, useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
    Palette, Moon, Smartphone, Check, LayoutDashboard,
    Trash2, Plus, Calendar, Clock, Crown, ShieldCheck,
    Zap, CheckCircle, Sparkles, Wand2, Snowflake, Star,
    PartyPopper, Layers, Edit3, Save, RotateCcw, Eye,
    Circle, Leaf
} from 'lucide-react';
import { AppTheme, ThemeSchedule, CustomThemeConfig } from '../../types';
import { THEMES_DATA } from '../themeData';
import { getAutoTheme, formatHijriDate } from '../../utils/themeScheduler';

interface ThemesTabProps {
    selectedTheme: AppTheme;
    setSelectedTheme: (theme: AppTheme) => void;
    themeSchedules: ThemeSchedule[];
    setThemeSchedules: (schedules: ThemeSchedule[]) => void;
    customThemeConfig: CustomThemeConfig;
    setCustomThemeConfig: (config: CustomThemeConfig) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    isAutoTheme: boolean;
    setIsAutoTheme: (isAuto: boolean) => void;
}

const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

const EFFECT_OPTIONS: { value: CustomThemeConfig['effect']; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'none', label: 'بدون', icon: <Layers size={18} />, description: 'ألوان فقط بدون مؤثرات' },
    { value: 'stars', label: 'نجوم ✨', icon: <Star size={18} />, description: 'نجوم متلألئة في السماء' },
    { value: 'snow', label: 'ثلج ❄️', icon: <Snowflake size={18} />, description: 'رقاقات ثلج ساقطة' },
    { value: 'confetti', label: 'كونفيتي 🎉', icon: <PartyPopper size={18} />, description: 'قصاصات احتفالية ملونة' },
    { value: 'fireworks', label: 'ألعاب نارية 🎆', icon: <Sparkles size={18} />, description: 'انفجارات ملونة متصاعدة' },
    { value: 'bubbles', label: 'فقاعات 🫧', icon: <Circle size={18} />, description: 'فقاعات تطفو للأعلى' },
    { value: 'petals', label: 'بتلات 🌸', icon: <Circle size={18} />, description: 'بتلات زهور تتساقط' },
    { value: 'lightning', label: 'برق ⚡', icon: <Zap size={18} />, description: 'ومضات برق جانبية' },
    { value: 'leaves', label: 'أوراق 🍂', icon: <Leaf size={18} />, description: 'أوراق خريفية تتساقط' },
];

export const ThemesTab: React.FC<ThemesTabProps> = ({
    selectedTheme, setSelectedTheme, themeSchedules, setThemeSchedules,
    customThemeConfig, setCustomThemeConfig, isDarkMode, toggleTheme,
    isAutoTheme, setIsAutoTheme
}) => {
    const [activeSection, setActiveSection] = useState<'presets' | 'custom' | 'schedule'>('presets');

    // Local state for custom theme builder (before saving)
    const [localConfig, setLocalConfig] = useState<CustomThemeConfig>(() => ({
        id: customThemeConfig?.id || generateId(),
        name: customThemeConfig?.name || 'ثيم مخصص',
        primary: customThemeConfig?.primary || '#7c3aed',
        secondary: customThemeConfig?.secondary || '#db2777',
        accent: customThemeConfig?.accent || '#f59e0b',
        effect: customThemeConfig?.effect || 'none',
    }));

    useEffect(() => {
        setLocalConfig({
            id: customThemeConfig?.id || generateId(),
            name: customThemeConfig?.name || 'ثيم مخصص',
            primary: customThemeConfig?.primary || '#7c3aed',
            secondary: customThemeConfig?.secondary || '#db2777',
            accent: customThemeConfig?.accent || '#f59e0b',
            effect: customThemeConfig?.effect || 'none',
        });
    }, [customThemeConfig]);

    const handleAddSchedule = () => {
        const newSchedule: ThemeSchedule = {
            id: generateId(),
            theme: 'standard',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            isActive: true
        };
        setThemeSchedules([...themeSchedules, newSchedule]);
    };

    const handleUpdateSchedule = (id: string, updates: Partial<ThemeSchedule>) => {
        setThemeSchedules(themeSchedules.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleDeleteSchedule = (id: string) => {
        setThemeSchedules(themeSchedules.filter(s => s.id !== id));
    };

    const handleSaveCustomTheme = () => {
        setCustomThemeConfig(localConfig);
        setSelectedTheme('custom');
    };

    const handleResetCustomTheme = () => {
        setLocalConfig({
            id: generateId(),
            name: 'ثيم مخصص',
            primary: '#7c3aed',
            secondary: '#db2777',
            accent: '#f59e0b',
            effect: 'none',
        });
    };

    const sectionTabs = [
        { id: 'presets', label: 'قوالب جاهزة', icon: <Layers size={16} /> },
        { id: 'custom', label: 'بناء ثيم', icon: <Wand2 size={16} /> },
        { id: 'schedule', label: 'جدولة', icon: <Calendar size={16} /> },
    ] as const;

    return (
        <m.div
            key="themes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Palette className="text-pink-500" />
                        تخصيص المظهر
                    </h2>
                    <p className="text-gray-400 font-bold mt-2">اختر قالبًا أو ابنِ ثيمك الخاص بالكامل</p>
                    {isAutoTheme && (
                        <div className="flex items-center gap-2 mt-3 text-emerald-400 text-sm font-bold bg-emerald-500/10 w-fit px-3 py-1 rounded-lg border border-emerald-500/20">
                            <Sparkles size={14} />
                            الوضع الذكي مفعل: {formatHijriDate()}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setIsAutoTheme(!isAutoTheme)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all border ${isAutoTheme ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-900 border-white/10 text-gray-400 hover:bg-slate-800'}`}
                    >
                        <Zap size={18} className={isAutoTheme ? "text-white" : "text-gray-500"} />
                        {isAutoTheme ? 'الوضع الذكي (Auto)' : 'تفعيل الوضع الذكي'}
                    </button>
                    <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/10">
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${!isDarkMode ? 'bg-amber-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Zap size={18} fill={!isDarkMode ? "black" : "none"} />
                            نهاري
                        </button>
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isDarkMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Moon size={18} fill={isDarkMode ? "white" : "none"} />
                            ليلي
                        </button>
                    </div>
                </div>
            </header>

            {/* Section Tabs */}
            <div className="flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-white/5 w-fit">
                {sectionTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSection === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* PRESETS SECTION */}
                {activeSection === 'presets' && (
                    <m.div
                        key="presets"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 xl:grid-cols-3 gap-8"
                    >
                        {/* Theme Grid */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
                                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                                    <LayoutDashboard className="text-blue-500" />
                                    القوالب الجاهزة
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                    {(Object.keys(THEMES_DATA) as AppTheme[]).filter(t => t !== 'custom').map((themeKey) => (
                                        <button
                                            key={themeKey}
                                            onClick={() => setSelectedTheme(themeKey)}
                                            className={`relative group overflow-hidden rounded-[2rem] border-2 transition-all duration-300 text-right ${selectedTheme === themeKey
                                                ? `bg-white/5 shadow-2xl scale-105`
                                                : 'border-white/5 hover:border-white/20 bg-slate-900'
                                                }`}
                                            style={selectedTheme === themeKey ? {
                                                borderColor: THEMES_DATA[themeKey].primary,
                                                boxShadow: `0 0 0 4px ${THEMES_DATA[themeKey].primary}20`
                                            } : {}}
                                        >
                                            <div
                                                className="h-20 opacity-80 group-hover:opacity-100 transition-opacity"
                                                style={{ background: `linear-gradient(to bottom right, ${THEMES_DATA[themeKey].primary}, ${THEMES_DATA[themeKey].secondary})` }}
                                            />
                                            <div className="p-4 relative">
                                                <h4 className="text-base font-black text-white mb-1">{THEMES_DATA[themeKey].name}</h4>
                                                <p className="text-xs text-gray-400 font-bold mb-3 line-clamp-2">{THEMES_DATA[themeKey].description}</p>
                                                <div className="flex gap-2">
                                                    <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: THEMES_DATA[themeKey].primary }} />
                                                    <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: THEMES_DATA[themeKey].secondary }} />
                                                </div>
                                                {selectedTheme === themeKey && (
                                                    <div
                                                        className="absolute top-3 left-3 text-white p-1.5 rounded-full shadow-lg animate-bounce"
                                                        style={{ backgroundColor: THEMES_DATA[themeKey].primary }}
                                                    >
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden relative aspect-[9/19] max-w-xs mx-auto">
                                <div className="absolute inset-0 bg-slate-950 flex flex-col">
                                    <div className="bg-slate-900 p-4 pt-10 flex items-center justify-between border-b border-white/5">
                                        <div className="w-8 h-8 rounded-full bg-white/10" />
                                        <div className="w-24 h-4 rounded-full bg-white/10" />
                                        <div className="w-8 h-8 rounded-full bg-white/10" />
                                    </div>
                                    <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                                        <div className="h-32 rounded-2xl opacity-80 flex items-end p-4" style={{ background: `linear-gradient(to bottom right, ${THEMES_DATA[selectedTheme]?.primary || '#333'}, ${THEMES_DATA[selectedTheme]?.secondary || '#555'})` }}>
                                            <div className="w-full">
                                                <div className="w-16 h-4 bg-white/30 rounded-full mb-2" />
                                                <div className="w-24 h-3 bg-white/20 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="h-14 rounded-xl bg-slate-900 border border-white/5 flex items-center p-3 gap-3">
                                                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: `${THEMES_DATA[selectedTheme]?.secondary || '#555'}33` }} />
                                                    <div className="flex-1">
                                                        <div className="w-20 h-2.5 bg-white/10 rounded-full mb-1" />
                                                        <div className="w-12 h-2 bg-white/5 rounded-full" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/80 backdrop-blur-md p-4 flex justify-between items-center px-8 pb-8">
                                        <div style={{ color: THEMES_DATA[selectedTheme]?.primary || '#333' }}><LayoutDashboard size={22} /></div>
                                        <div className="text-gray-600"><Smartphone size={22} /></div>
                                        <div className="text-gray-600"><Crown size={22} /></div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-5">
                                    <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                        <Eye size={12} />
                                        معاينة حية
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.div>
                )}

                {/* CUSTOM THEME BUILDER SECTION */}
                {activeSection === 'custom' && (
                    <m.div
                        key="custom"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 xl:grid-cols-3 gap-8"
                    >
                        {/* Builder Controls */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Theme Name */}
                            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
                                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                                    <Edit3 className="text-indigo-400" />
                                    بناء ثيم مخصص
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-gray-400 font-bold text-sm mb-2">اسم الثيم</label>
                                        <input
                                            type="text"
                                            value={localConfig.name}
                                            onChange={e => setLocalConfig({ ...localConfig, name: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-3 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="مثال: ثيم نيلة، ثيم الخريف..."
                                        />
                                    </div>

                                    {/* Color Pickers */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-gray-400 font-bold text-sm mb-2">اللون الأساسي</label>
                                            <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl p-3 focus-within:border-indigo-500 transition-colors">
                                                <input
                                                    type="color"
                                                    value={localConfig.primary}
                                                    onChange={e => setLocalConfig({ ...localConfig, primary: e.target.value })}
                                                    className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent"
                                                />
                                                <div>
                                                    <p className="text-white font-black text-sm">أساسي</p>
                                                    <p className="text-gray-500 text-xs font-mono">{localConfig.primary}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 font-bold text-sm mb-2">اللون الثانوي</label>
                                            <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl p-3 focus-within:border-indigo-500 transition-colors">
                                                <input
                                                    type="color"
                                                    value={localConfig.secondary}
                                                    onChange={e => setLocalConfig({ ...localConfig, secondary: e.target.value })}
                                                    className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent"
                                                />
                                                <div>
                                                    <p className="text-white font-black text-sm">ثانوي</p>
                                                    <p className="text-gray-500 text-xs font-mono">{localConfig.secondary}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 font-bold text-sm mb-2">لون التمييز</label>
                                            <div className="flex items-center gap-3 bg-black/30 border border-white/10 rounded-2xl p-3 focus-within:border-indigo-500 transition-colors">
                                                <input
                                                    type="color"
                                                    value={localConfig.accent}
                                                    onChange={e => setLocalConfig({ ...localConfig, accent: e.target.value })}
                                                    className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent"
                                                />
                                                <div>
                                                    <p className="text-white font-black text-sm">تمييز</p>
                                                    <p className="text-gray-500 text-xs font-mono">{localConfig.accent}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Effect Picker */}
                            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
                                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                                    <Sparkles className="text-pink-400" />
                                    المؤثرات البصرية
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {EFFECT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setLocalConfig({ ...localConfig, effect: opt.value })}
                                            className={`relative p-4 rounded-2xl border-2 transition-all text-right ${localConfig.effect === opt.value ? 'border-indigo-500 bg-indigo-500/10 shadow-lg scale-105' : 'border-white/5 bg-slate-900 hover:border-white/20'}`}
                                        >
                                            {localConfig.effect === opt.value && (
                                                <div className="absolute top-2 left-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                                    <Check size={10} strokeWidth={4} className="text-white" />
                                                </div>
                                            )}
                                            <div className={`mb-2 ${localConfig.effect === opt.value ? 'text-indigo-400' : 'text-gray-500'}`}>
                                                {opt.icon}
                                            </div>
                                            <p className="text-white font-black text-sm mb-1">{opt.label}</p>
                                            <p className="text-gray-400 text-xs">{opt.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSaveCustomTheme}
                                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-900/30"
                                >
                                    <Save size={20} />
                                    حفظ وتطبيق الثيم
                                </button>
                                <button
                                    onClick={handleResetCustomTheme}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-gray-400 px-6 py-4 rounded-2xl font-bold border border-white/10 transition-all"
                                >
                                    <RotateCcw size={18} />
                                    إعادة تعيين
                                </button>
                            </div>
                        </div>

                        {/* Live Preview of Custom Theme */}
                        <div className="space-y-6">
                            <div className="sticky top-6">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden relative aspect-[9/19] max-w-xs mx-auto">
                                    {/* Custom gradient preview */}
                                    <div
                                        className="absolute inset-0 opacity-30 transition-all duration-700"
                                        style={{ background: `linear-gradient(135deg, ${localConfig.primary}, ${localConfig.secondary})` }}
                                    />
                                    <div
                                        className="absolute top-0 right-0 w-3/4 h-3/4 rounded-full blur-[80px] opacity-20 transition-all duration-700"
                                        style={{ backgroundColor: localConfig.primary }}
                                    />
                                    <div
                                        className="absolute bottom-0 left-0 w-3/4 h-3/4 rounded-full blur-[80px] opacity-20 transition-all duration-700"
                                        style={{ backgroundColor: localConfig.secondary }}
                                    />

                                    <div className="absolute inset-0 flex flex-col bg-slate-950/70">
                                        <div className="bg-slate-900/80 p-4 pt-10 flex items-center justify-between border-b border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-white/10" />
                                            <div className="w-24 h-4 rounded-full bg-white/10" />
                                            <div className="w-8 h-8 rounded-full bg-white/10" />
                                        </div>
                                        <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                                            <div className="h-28 rounded-2xl flex items-end p-4 transition-all duration-700"
                                                style={{ background: `linear-gradient(to bottom right, ${localConfig.primary}, ${localConfig.secondary})` }}>
                                                <div className="w-full">
                                                    <div className="w-16 h-4 bg-white/30 rounded-full mb-2" />
                                                    <div className="w-24 h-3 bg-white/20 rounded-full" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="h-12 rounded-xl bg-slate-900/80 border border-white/5 flex items-center p-3 gap-3">
                                                        <div className="w-7 h-7 rounded-lg transition-colors duration-700" style={{ backgroundColor: `${localConfig.secondary}33` }} />
                                                        <div className="flex-1">
                                                            <div className="w-16 h-2 bg-white/10 rounded-full mb-1" />
                                                            <div className="w-10 h-1.5 bg-white/5 rounded-full" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-slate-900/80 p-4 flex justify-between items-center px-8 pb-8">
                                            <div style={{ color: localConfig.primary }} className="transition-colors duration-700"><LayoutDashboard size={22} /></div>
                                            <div className="text-gray-600"><Smartphone size={22} /></div>
                                            <div className="text-gray-600"><Crown size={22} /></div>
                                        </div>
                                    </div>

                                    <div className="absolute top-0 right-0 p-5">
                                        <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                            <Wand2 size={12} />
                                            {localConfig.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2 justify-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-white/20 transition-colors duration-700" style={{ backgroundColor: localConfig.primary }} />
                                    <div className="w-8 h-8 rounded-full border-2 border-white/20 transition-colors duration-700" style={{ backgroundColor: localConfig.secondary }} />
                                    <div className="w-8 h-8 rounded-full border-2 border-white/20 transition-colors duration-700" style={{ backgroundColor: localConfig.accent }} />
                                </div>
                            </div>
                        </div>
                    </m.div>
                )}

                {/* SCHEDULE SECTION */}
                {activeSection === 'schedule' && (
                    <m.div
                        key="schedule"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                                        <Calendar className="text-purple-500" />
                                        جدولة الثيمات
                                    </h3>
                                    <p className="text-gray-400 text-xs font-bold mt-1">
                                        حدد تاريخ بداية ونهاية لكل ثيم — سيُطبَّق تلقائياً على الموقع
                                    </p>
                                </div>
                                <button
                                    onClick={handleAddSchedule}
                                    className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white px-5 py-3 rounded-xl text-sm font-black transition-all"
                                >
                                    <Plus size={18} />
                                    إضافة موعد
                                </button>
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence>
                                    {themeSchedules.map((schedule) => (
                                        <m.div
                                            key={schedule.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={`bg-slate-900 border ${schedule.isActive ? 'border-purple-500/30' : 'border-white/5'} rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all`}
                                        >
                                            <div className="flex items-center gap-3 min-w-[160px]">
                                                <div className={`p-2.5 rounded-xl ${schedule.isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-500'}`}>
                                                    <Clock size={18} />
                                                </div>
                                                <select
                                                    value={schedule.theme}
                                                    onChange={(e) => handleUpdateSchedule(schedule.id, { theme: e.target.value as AppTheme })}
                                                    className="bg-transparent text-white font-black outline-none text-sm w-full"
                                                >
                                                    {Object.keys(THEMES_DATA).map(t => (
                                                        <option key={t} value={t} className="bg-slate-900 font-bold">
                                                            {THEMES_DATA[t as AppTheme].name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-3 flex-1 w-full bg-black/20 p-3 rounded-xl border border-white/5">
                                                <div>
                                                    <p className="text-gray-500 text-xs font-bold mb-1">من</p>
                                                    <input
                                                        type="date"
                                                        value={schedule.startDate}
                                                        onChange={(e) => handleUpdateSchedule(schedule.id, { startDate: e.target.value })}
                                                        className="bg-transparent text-white text-sm font-mono outline-none"
                                                    />
                                                </div>
                                                <span className="text-gray-500 text-lg">→</span>
                                                <div>
                                                    <p className="text-gray-500 text-xs font-bold mb-1">إلى</p>
                                                    <input
                                                        type="date"
                                                        value={schedule.endDate}
                                                        onChange={(e) => handleUpdateSchedule(schedule.id, { endDate: e.target.value })}
                                                        className="bg-transparent text-white text-sm font-mono outline-none text-right"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateSchedule(schedule.id, { isActive: !schedule.isActive })}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors ${schedule.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600'}`}
                                                >
                                                    <CheckCircle size={14} />
                                                    {schedule.isActive ? 'فعال' : 'معطل'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </m.div>
                                    ))}
                                </AnimatePresence>
                                {themeSchedules.length === 0 && (
                                    <div className="text-center py-16 text-gray-500 font-bold text-sm bg-slate-900/20 rounded-2xl border border-dashed border-white/10">
                                        <Calendar className="mx-auto mb-3 opacity-30" size={32} />
                                        لا توجد ثيمات مجدولة حالياً — اضغط "إضافة موعد" للبدء
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tip */}
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 flex items-start gap-4">
                            <ShieldCheck className="text-purple-400 shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-white font-black text-sm mb-1">كيف تعمل الجدولة؟</p>
                                <p className="text-gray-400 text-xs font-medium">
                                    عند تفعيل "الوضع الذكي"، سيتحقق الموقع من التاريخ الحالي ويطبق أول ثيم نشط يوافق الفترة الزمنية المحددة تلقائياً على جميع 
                                    مستخدمي الموقع — مثالي لرمضان والأعياد.
                                </p>
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </m.div>
    );
};
