import React, { useState, useMemo } from 'react';
import { Layers, Settings, BookOpen, Moon, Sun, X, LogOut, ShieldCheck, Zap, Map, Book, MessageCircle, ChevronDown, Home, Bell, Crown, LayoutGrid, Gift as GiftIcon, Star, Award, Users, HelpCircle, Drama, ChevronLeft, ChevronRight, Sparkles, Globe, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { THEMES_DATA } from './themeData';
import { AppTheme } from '../types';

// Helper: get initials from name
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Gradient palette based on name hash for consistent avatar colors
const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
];
const getAvatarGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};


interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  t: any; // Translation object
  dir: string; // 'rtl' or 'ltr'
  userName: string;
  userImage: string | null;
  onLogout?: () => void; // Added Logout Handler
  unreadCount?: number;
  levelData?: {
    level: number;
    totalXP: number;
    progressToNext: number;
  };
  isMockMode?: boolean;
  selectedTheme: AppTheme;
  onStartTour?: () => void;
  onToggleNotifications?: () => void;
  onNavigateToAccount?: () => void;
  /** لغة المحتوى المتعلّم (إنجليزي/ألماني) — تبديل فوري بدون إعادة تسجيل الدخول */
  learningLang?: 'en' | 'de';
  onLearningLanguageChange?: (lang: 'en' | 'de') => void | Promise<void>;
  isSwitchingLearningLang?: boolean;
  /** لإظهار شارة Pro على عناصر تتطلب اشتراكاً */
  hasActiveSubscription?: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  isDarkMode,
  toggleTheme,
  t,
  dir,
  userName,
  userImage,
  onLogout,
  unreadCount = 0,
  levelData = { level: 1, totalXP: 0, progressToNext: 0 },
  isMockMode,
  selectedTheme,
  onStartTour,
  onToggleNotifications,
  onNavigateToAccount,
  learningLang,
  onLearningLanguageChange,
  isSwitchingLearningLang = false,
  hasActiveSubscription = true
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = useMemo(() => [
    { id: 'home', label: t.sidebar?.home || 'الرئيسية', icon: Home },
    // Notifications removed from here
    { id: 'learning_path', label: t.sidebar.learningPath, icon: Map },
    { id: 'cards', label: t.sidebar.cards, icon: Layers },
    { id: 'stories', label: t.sidebar.stories, icon: BookOpen },
    { id: 'dictionary', label: t.sidebar.dictionary, icon: Book },
    { id: 'ai_assistant', label: t.sidebar.aiAssistant, icon: MessageCircle },
    { id: 'games', label: t.sidebar.games || 'الألعاب', icon: Gamepad2 },
    { id: 'sentences', label: t.sidebar.sentences || 'المواقف الحياتية', icon: Drama },
    { id: 'community', label: t.sidebar.community || 'المجتمع', icon: Users },
  ], [t]);

  const positionClass = dir === 'rtl' ? 'right-0' : 'left-0';
  const closedTranslateClass = dir === 'rtl' ? 'translate-x-full' : '-translate-x-full';
  const menuItemDirectionClass = dir === 'rtl' ? 'flex-row' : 'flex-row-reverse';
  const menuTextAlignClass = dir === 'rtl' ? 'text-right' : 'text-left';

  const isHoliday = !!THEMES_DATA[selectedTheme]?.greeting;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 h-screen w-72 xl:w-80 bg-white dark:bg-dark-card z-50 flex flex-col transition-transform duration-300 ease-in-out
        border-l border-r border-stone-200 dark:border-gray-800 shadow-2xl xl:shadow-warm-lg dark:shadow-none
        ${positionClass}
        ${isOpen ? 'translate-x-0' : closedTranslateClass} 
        xl:translate-x-0
      `}>
        {/* ── Sidebar Header — logo + bell ── */}
        <div className="px-5 py-5 flex items-center justify-between gap-4 border-b border-stone-100 dark:border-gray-800 transition-colors duration-300 bg-gradient-to-l from-stone-50/60 to-transparent dark:from-gray-900/40 dark:to-transparent">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="group cursor-pointer flex-1 min-w-0 overflow-hidden"
            onClick={() => { setActiveTab('home'); onClose(); }}
          >
            <Logo variant="bilingual" size="sm" className="!justify-start" />
          </motion.div>

          {/* Bell + Close */}
          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
            <button
              onClick={onToggleNotifications}
              className="relative p-2 xl:p-2.5 rounded-xl xl:rounded-2xl hover:bg-red-50 dark:hover:bg-white/5 text-gray-400 hover:text-red-500 transition-all duration-200 group border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
              title={t.sidebar.notificationsTitle || t.settings?.notifications || 'Notifications'}
            >
              <Bell className="w-5 h-5 xl:w-[22px] xl:h-[22px] group-hover:rotate-12 transition-transform duration-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 xl:top-2 xl:right-2 w-2 h-2 xl:w-2.5 xl:h-2.5 bg-red-500 border-2 border-white dark:border-dark-card rounded-full animate-pulse"></span>
              )}
            </button>

            <button
              onClick={onClose}
              className="xl:hidden p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-400 shrink-0 border border-transparent hover:border-stone-200 dark:hover:border-gray-600 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── User Profile Card ─── */}
        <div className="px-4 pb-3">
          <motion.button
            onClick={() => {
              if (onNavigateToAccount) onNavigateToAccount();
              else setActiveTab('settings');
              onClose();
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 24 }}
            whileHover={{ scale: 1.018 }}
            whileTap={{ scale: 0.97 }}
            className="w-full group relative overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {/* Gradient border shell */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-[1.5px] rounded-[14px] bg-white dark:bg-gray-900 group-hover:bg-white/95 dark:group-hover:bg-gray-900/95 transition-colors" />

            {/* Glow blob on hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400/30 via-purple-400/30 to-pink-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

            {/* Card body */}
            <div className="relative flex items-center gap-3 p-3">

              {/* ── Avatar ── */}
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(userName)} p-[2px] transition-transform duration-300 group-hover:rotate-3`}>
                  <div className="w-full h-full rounded-[10px] overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt={userName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className={`text-base font-black text-transparent bg-clip-text bg-gradient-to-br ${getAvatarGradient(userName)}`}>
                        {getInitials(userName)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Level badge */}
                <div className="absolute -bottom-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md border-2 border-white dark:border-gray-900 group-hover:scale-110 transition-transform">
                  <span className="text-[10px] font-black text-white leading-none">{levelData.level}</span>
                </div>
              </div>

              {/* ── Info ── */}
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {userName}
                </p>

                {/* XP row */}
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{levelData.totalXP.toLocaleString()} XP</span>
                  <div className="flex items-center gap-0.5">
                    <Zap size={10} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">Lv.{levelData.level}</span>
                  </div>
                </div>

                {/* XP Progress bar */}
                <div className="mt-1.5 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, levelData.progressToNext)}%` }}
                    transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              </div>

              {/* ── Arrow ── */}
              <div className="shrink-0 w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-500 transition-all">
                {dir === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
          </motion.button>
        </div>

        {/* Level Progress Section */}
        {/* Menu */}
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRamadan = selectedTheme === 'ramadan';
            const themeData = THEMES_DATA[selectedTheme]; // Get current theme colors

            // Dynamic Active Style
            const activeStyle = isActive ? {
              // Background: Special Deep Purple for Ramadan, Dynamic Glassy Theme Color for others
              background: isRamadan
                ? 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%)'
                : `linear-gradient(110deg, ${themeData.primary}, ${themeData.primary}DD)`,
              // Border: Gold for Ramadan, Subtle Secondary for others
              borderColor: isRamadan ? 'rgba(251, 191, 36, 0.3)' : `${themeData.secondary}40`,
              // Glow: Deep Purple shadow for Ramadan, Colored shadow for others
              boxShadow: isRamadan
                ? '0 0 15px rgba(245, 158, 11, 0.2)'
                : `0 4px 20px ${themeData.glow || 'rgba(0,0,0,0.1)'}`,
              color: isRamadan ? '#fbbf24' : 'white' // Gold text for Ramadan, White for others
            } : {};

            // Dynamic Sidebar Strip Color (Secondary Color)
            const stripColor = isRamadan ? '#fbbf24' : themeData.secondary;
            const sentencesNeedsPro = item.id === 'sentences' && !hasActiveSubscription;

            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); onClose(); }}
                style={activeStyle}
                className={`w-full flex ${menuItemDirectionClass} items-center gap-3 xl:gap-4 px-4 py-3 xl:px-5 xl:py-3.5 rounded-xl xl:rounded-2xl transition-all duration-300 group relative overflow-hidden border ${isActive
                  ? 'font-bold border-transparent'
                  : `border-transparent text-gray-600 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white ${sentencesNeedsPro ? 'opacity-95' : ''}`
                  }`}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rtl:right-0 rtl:left-auto rounded-r-full rtl:rounded-l-full rtl:rounded-r-none"
                    style={{ backgroundColor: stripColor }}
                  />
                )}

                <Icon className={`w-5 h-5 xl:w-6 xl:h-6 ${isActive ? 'animate-pulse drop-shadow-md' : 'group-hover:scale-110 transition-transform'}`} />

                <span className={`flex-1 ${menuTextAlignClass} text-base xl:text-lg tracking-wide`}>{item.label}</span>

                {sentencesNeedsPro && (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg border border-amber-200/80 dark:border-amber-600/40">
                    <Crown size={12} className="inline" />
                    Pro
                  </span>
                )}

              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-stone-100 dark:border-gray-700 space-y-4 bg-stone-50/50 dark:bg-black/20">

          {/* لغة التعلم — فوق خيارات إضافية */}
          {onLearningLanguageChange && learningLang && (
            <div className="rounded-2xl border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  {t.sidebar.learningLanguage || 'لغة التعلم'}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                {t.sidebar.learningLanguageHint || 'التبديل يحدّث المنهج والقصص والبطاقات وتقدمك في مسار التعلم لكل لغة على حدة.'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSwitchingLearningLang}
                  onClick={() => onLearningLanguageChange('en')}
                  className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all border-2 ${
                    learningLang === 'en'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/20'
                      : 'bg-stone-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 border-transparent hover:border-blue-400/50'
                  } ${isSwitchingLearningLang ? 'opacity-60 cursor-wait' : ''}`}
                >
                  🇺🇸 EN
                </button>
                <button
                  type="button"
                  disabled={isSwitchingLearningLang}
                  onClick={() => onLearningLanguageChange('de')}
                  className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all border-2 ${
                    learningLang === 'de'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/20'
                      : 'bg-stone-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 border-transparent hover:border-amber-400/50'
                  } ${isSwitchingLearningLang ? 'opacity-60 cursor-wait' : ''}`}
                >
                  🇩🇪 DE
                </button>
              </div>
            </div>
          )}

          {/* Dropdown Toggle Button */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 xl:px-5 xl:py-3.5 rounded-xl xl:rounded-2xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-gray-700 border border-stone-200 dark:border-gray-700 transition-all duration-300 shadow-sm group hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <LayoutGrid className={`w-5 h-5 xl:w-[22px] xl:h-[22px] transition-all duration-500 ${isSettingsOpen ? 'text-amber-500 rotate-[45deg]' : 'group-hover:rotate-[90deg] group-hover:scale-110 text-gray-500 dark:text-gray-400'}`} />
              <span className={`font-bold text-sm xl:text-base transition-colors duration-300 ${isSettingsOpen ? 'text-amber-600 dark:text-amber-400' : ''}`}>{t.sidebar.extraOptions || 'خيارات إضافية'}</span>
            </div>
            <ChevronDown
              size={20}
              className={`transition-all duration-500 ${isSettingsOpen ? 'rotate-180 text-amber-500' : 'rotate-0 group-hover:translate-y-0.5'}`}
            />
          </button>

          {/* Dropdown Menu */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isSettingsOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-2 pt-2">
              {/* Start Tour */}
              {onStartTour && (
                <button
                  onClick={() => { onStartTour(); setIsSettingsOpen(false); onClose(); }}
                  className="w-full flex items-center gap-3 xl:gap-4 px-4 py-3 xl:px-5 xl:py-3.5 rounded-xl xl:rounded-2xl text-purple-700 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all border border-purple-200 dark:border-purple-900 group transform hover:translate-x-1 rtl:hover:-translate-x-1"
                >
                  <HelpCircle className="w-5 h-5 xl:w-[22px] xl:h-[22px] group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm xl:text-base">{t.sidebar.startTour || 'بدء الجولة التعريفية'}</span>
                </button>
              )}



              {/* Settings */}
              <button
                onClick={() => { setActiveTab('settings'); setIsSettingsOpen(false); onClose(); }}
                className="w-full flex items-center gap-3 xl:gap-4 px-4 py-3 xl:px-5 xl:py-3.5 rounded-xl xl:rounded-2xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-gray-700 border border-stone-200 dark:border-gray-700 transition-all shadow-sm group transform hover:translate-x-1 rtl:hover:-translate-x-1"
              >
                <Settings className="w-5 h-5 xl:w-[22px] xl:h-[22px] group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-bold text-sm xl:text-base">{t.sidebar.settings}</span>
              </button>

              {/* Theme Toggle */}
              {/* Theme Toggle - Modern Switch */}
              <div className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-indigo-100/10 text-indigo-400' : 'bg-orange-100 text-orange-600'}`}>
                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                      {isDarkMode ? t.sidebar.darkMode : t.sidebar.lightMode}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {isDarkMode ? (t.sidebar.enabled || 'مفعّل') : (t.sidebar.disabled || 'غير مفعّل')}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => toggleTheme()}
                  className={`relative w-14 h-8 rounded-full cursor-pointer transition-colors duration-300 ease-in-out border-2 ${isDarkMode
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-stone-200 border-stone-200'
                    }`}
                >
                  <motion.div
                    className="absolute top-0.5 bottom-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transform"
                    initial={false}
                    animate={{
                      x: dir === 'rtl'
                        ? (isDarkMode ? -26 : 0) // RTL: Push Left (Negative)
                        : (isDarkMode ? 26 : 0)   // LTR: Push Right (Positive)
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {isDarkMode ? (
                      <Moon size={12} className="text-indigo-600" />
                    ) : (
                      <Sun size={12} className="text-orange-500" />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={() => { setShowLogoutModal(true); }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 border border-transparent hover:border-red-200 transition-all group transform hover:translate-x-1 rtl:hover:-translate-x-1"
                >
                  <LogOut size={22} className="group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
                  <span className="font-bold text-base">{t.sidebar.logout || 'تسجيل الخروج'}</span>
                </button>
              )}
            </div>
          </div>


        </div>
      </aside>

      {/* Theme-Aware Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowLogoutModal(false)}
          ></div>

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in border border-white/10">
            {/* Dynamic Theme Background */}
            <div className={`absolute top-0 left-0 w-full h-40 overflow-hidden transition-colors duration-500 bg-gradient-to-br ${selectedTheme === 'ramadan' ? 'from-indigo-900 via-purple-900 to-black' :
              selectedTheme === 'eid_fitr' ? 'from-pink-600 via-purple-600 to-indigo-600' :
                selectedTheme === 'eid_adha' ? 'from-emerald-600 via-green-600 to-teal-700' :
                  selectedTheme === 'victory_october' ? 'from-amber-700 via-orange-800 to-stone-900' :
                    'from-blue-600 via-indigo-600 to-slate-800' // Default
              }`}>
              {/* Theme Specific Background Animations */}
              <div className="absolute inset-0 opacity-30">
                {/* Clouds/Waves - Shared */}
                <div className="absolute bottom-0 left-0 w-[200%] h-24 bg-white/10 animate-wave opacity-50"></div>
                <div className="absolute bottom-0 left-[-100%] w-[200%] h-24 bg-white/10 animate-wave-delay opacity-30"></div>

                {/* Theme Specific Particles */}
                {selectedTheme === 'ramadan' && (
                  <>
                    <div className="absolute top-4 right-10 text-yellow-400/20 animate-pulse"><Moon size={60} /></div>
                    <div className="absolute top-10 left-10 text-yellow-400/10 animate-bounce-slow"><Star size={30} /></div>
                  </>
                )}
                {(selectedTheme === 'eid_fitr' || selectedTheme === 'eid_adha') && (
                  <>
                    <div className="absolute top-2 right-2 text-white/10 animate-spin-slow"><Zap size={80} /></div>
                    <div className="absolute top-12 left-12 text-white/10 animate-pulse"><Crown size={40} /></div>
                  </>
                )}
                {selectedTheme === 'victory_october' && (
                  <div className="absolute top-5 right-5 text-amber-500/10 animate-pulse"><ShieldCheck size={80} /></div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="relative p-8 pt-28">
              {/* Icon Container */}
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-[6px] transition-all duration-300 animate-bounce-slow ${selectedTheme === 'ramadan' ? 'bg-indigo-950 border-indigo-200/20' :
                  selectedTheme === 'eid_fitr' ? 'bg-purple-900 border-purple-200/20' :
                    selectedTheme === 'eid_adha' ? 'bg-emerald-900 border-emerald-200/20' :
                      selectedTheme === 'victory_october' ? 'bg-stone-800 border-amber-500/20' :
                        'bg-white dark:bg-gray-800 border-white dark:border-gray-700'
                  }`}>
                  {/* Dynamic Main Icon */}
                  {selectedTheme === 'ramadan' ? <Moon size={40} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" /> :
                    selectedTheme === 'eid_fitr' ? <GiftIcon size={40} className="text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]" /> :
                      selectedTheme === 'eid_adha' ? <Award size={40} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> :
                        selectedTheme === 'victory_october' ? <ShieldCheck size={40} className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" /> :
                          <LogOut size={36} className="text-red-500" />}

                  {/* Count Badge */}
                  {unreadCount !== undefined && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-4 ring-white dark:ring-gray-900 animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center mb-8 mt-6">
                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 mb-3">
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase">{userName}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">
                  {t.sidebar.logoutTitle || 'تسجيل الخروج؟'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed px-4">
                  {t.sidebar.logoutMessage || 'سيتم إنهاء جلستك الحالية. هل أنت متأكد من رغبتك في المغادرة؟'}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                  {t.sidebar.cancel || 'إلغاء'}
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    setIsSettingsOpen(false);
                    onLogout?.();
                  }}
                  className={`flex-1 px-6 py-4 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 ${selectedTheme === 'ramadan' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30' :
                    selectedTheme === 'eid_fitr' ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-pink-500/30' :
                      selectedTheme === 'eid_adha' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30' :
                        selectedTheme === 'victory_october' ? 'bg-gradient-to-r from-amber-600 to-orange-700 shadow-amber-500/30' :
                          'bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/30'
                    }`}
                >
                  <LogOut size={20} />
                  <span>{t.sidebar.confirmLogout || 'تأكيد الخروج'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);
