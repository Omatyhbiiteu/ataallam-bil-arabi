
import React from 'react';
import { LayoutDashboard, BookOpen, Layers, Book, Wallet, Users, Palette, ArrowLeft, Map, Megaphone, ChartBarBig, Bell, Headphones, Image as ImageIcon, Sun, Moon, Sparkles, Globe, Shield, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../Logo';

export type AdminLang = 'en' | 'de' | 'both';

interface AdminSidebarProps {
    activeTab: 'overview' | 'stories' | 'folders' | 'curriculum' | 'dictionary_manager' | 'themes' | 'payment_settings' | 'user_problems' | 'users' | 'admins' | 'marketing' | 'analytics' | 'notifications' | 'support' | 'media_library' | 'sentences' | 'inspirational';
    setActiveTab: (tab: any) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    onExit: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    adminLang: AdminLang;
    setAdminLang: (lang: AdminLang) => void;
    notificationsBell?: React.ReactNode;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    onExit,
    isDarkMode,
    toggleTheme,
    adminLang,
    setAdminLang,
    notificationsBell
}) => {
    const langOptions: { id: AdminLang; label: string; flag: string; color: string }[] = [
        { id: 'en', label: 'EN', flag: '🇺🇸', color: 'text-blue-400' },
        { id: 'de', label: 'DE', flag: '🇩🇪', color: 'text-yellow-400' },
        { id: 'both', label: 'كلاهما', flag: '🌐', color: 'text-emerald-400' },
    ];
    return (
        <aside className={`fixed top-0 right-0 h-full w-72 bg-slate-900/60 backdrop-blur-2xl border-l border-white/5 shadow-2xl z-40 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 flex flex-col`}>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 flex items-center justify-between border-b border-white/5 bg-slate-900/40 group cursor-pointer"
                onClick={() => setActiveTab('overview')}
            >
                <div className="flex-1 flex justify-center dark">
                    <Logo variant="bilingual" size="md" centered={true} className="text-white" />
                </div>

                {notificationsBell && (
                    <div
                        className="flex-none pl-2"
                        // لازم نمنع click على الجرس يغيّر التبويب
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {notificationsBell}
                    </div>
                )}
            </motion.div>

            <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
                {[
                    {
                        title: 'الرئيسية',
                        items: [
                            { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
                            { id: 'analytics', label: 'التحليلات', icon: ChartBarBig },
                        ]
                    },
                    {
                        title: 'المحتوى التعليمي',
                        items: [
                            { id: 'stories', label: 'القصص', icon: BookOpen },
                            { id: 'curriculum', label: 'المنهج', icon: Map },
                            { id: 'sentences', label: 'المواقف الحياتية', icon: Sparkles },
                            { id: 'folders', label: 'المجلدات', icon: Layers },
                            { id: 'dictionary_manager', label: 'القاموس', icon: Book },
                            { id: 'media_library', label: 'الوسائط', icon: ImageIcon },
                            { id: 'inspirational', label: 'الشريط الإلهامي', icon: Sun },
                        ]
                    },
                    {
                        title: 'التفاعل والدعم',
                        items: [
                            { id: 'marketing', label: 'التسويق', icon: Megaphone },
                            { id: 'notifications', label: 'الإشعارات', icon: Bell },
                            { id: 'support', label: 'الدعم', icon: Headphones },
                        ]
                    },
                    {
                        title: 'الإدارة والنظام',
                        items: [
                            { id: 'user_problems', label: 'مشاكل المستخدمين', icon: AlertTriangle },
                            { id: 'users', label: 'المستخدمين', icon: Users },
                            { id: 'admins', label: 'المسؤولين', icon: Shield },
                            { id: 'payment_settings', label: 'الدفع', icon: Wallet },
                            { id: 'themes', label: 'المظهر', icon: Palette },
                        ]
                    }
                ].map((group, idx) => (
                    <div key={idx}>
                        <h3 className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">{group.title}</h3>
                        <div className="space-y-1">
                            {group.items.map(item => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                            }`}
                                    >
                                        <Icon size={18} className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        <span className="font-bold text-sm">{item.label}</span>
                                        {isActive && (
                                            <div className="absolute left-0 w-1 h-4 bg-white/40 rounded-r-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Section - Pinned to Bottom */}
            <div className="p-6 mt-auto border-t border-white/5 bg-slate-900/50">

                {/* ═══ Language Target Selector ═══ */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <Globe size={12} className="text-gray-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">وجهة الحفظ</span>
                        <span className={`mr-auto text-[10px] font-black ${adminLang === 'both' ? 'text-emerald-400' :
                            adminLang === 'de' ? 'text-yellow-400' : 'text-blue-400'
                            }`}>
                            {adminLang === 'both' ? '✦ EN + DE' : adminLang === 'de' ? '✦ DE فقط' : '✦ EN فقط'}
                        </span>
                    </div>
                    <div className="bg-slate-950 p-1 rounded-2xl border border-white/10 flex gap-1">
                        {langOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setAdminLang(opt.id)}
                                className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-1 ${adminLang === opt.id
                                    ? opt.id === 'both'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg'
                                        : opt.id === 'de'
                                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shadow-lg'
                                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                <span>{opt.flag}</span>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Theme Toggle - Segmented Control Design */}
                <div className="bg-slate-950 p-1.5 rounded-2xl border border-white/10 flex relative mb-4">
                    {/* Active Slider */}
                    <div
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-800 rounded-xl shadow-lg border border-white/5 transition-all duration-300 ease-out ${isDarkMode ? 'left-[calc(50%+3px)]' : 'left-1.5'
                            }`}
                    />

                    <button
                        onClick={() => toggleTheme()}
                        className={`relative flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-colors z-10 cursor-pointer ${!isDarkMode ? 'text-amber-500' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        title="Switch to Light Mode"
                    >
                        <Sun size={18} strokeWidth={!isDarkMode ? 3 : 2} />
                        <span className={`text-xs ${!isDarkMode ? 'font-black text-amber-500' : 'font-medium'}`}>Light</span>
                    </button>

                    <button
                        onClick={() => toggleTheme()}
                        className={`relative flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 transition-colors z-10 cursor-pointer ${isDarkMode ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        title="Switch to Dark Mode"
                    >
                        <Moon size={18} strokeWidth={isDarkMode ? 3 : 2} />
                        <span className={`text-xs ${isDarkMode ? 'font-black text-blue-400' : 'font-medium'}`}>Dark</span>
                    </button>
                </div>

                {/* Exit Button */}
                <button
                    onClick={onExit}
                    className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black transition-all shadow-lg hover:shadow-red-900/40 active:scale-95 group"
                >
                    <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    );
};
