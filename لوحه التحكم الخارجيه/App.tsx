import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Toast } from './components/Toast';
import { db } from './services/db';
import { Language, LanguageAvailability, Folder, Card, PromoBanner, Coupon, BroadcastNotification, SupportTicket, MediaItem, SentenceTopic, InspirationalSlide } from './types';
import { translations } from './utils/translations';
import { LazyMotion, domMax } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

import { useAppTheme } from './hooks/useAppTheme';
import { useAppData } from './hooks/useAppData';
import { AuthAPI, AdminAPI } from './services/apiClient';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ThemeVisuals = React.lazy(() => import('./components/ThemeVisuals').then(m => ({ default: m.ThemeVisuals })));
const AdminAuthModal = React.lazy(() => import('./components/AdminAuthModal').then(m => ({ default: m.AdminAuthModal })));
const AdminLoginView = React.lazy(() => import('./components/AdminLoginView').then(m => ({ default: m.AdminLoginView })));

const ADMIN_SECURITY_KEY = 'admin_security_passed';
const ADMIN_LOGIN_KEY = 'admin_logged_in';

export default function App() {
    const [isSecurityPassed, setIsSecurityPassed] = useState(() => sessionStorage.getItem(ADMIN_SECURITY_KEY) === '1');
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => sessionStorage.getItem(ADMIN_LOGIN_KEY) === '1');
    const [toast, setToast] = useState<{ message: string, visible: boolean, type?: 'success' | 'error' | 'info' }>({ message: '', visible: false });
    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, visible: true, type });
    };

    const [language, setLanguage] = useState<Language>(() => db.load('lang', 'ar'));
    const [langAvailability, setLangAvailability] = useState<LanguageAvailability>(() => db.load('langAvailability', { en: true, de: true }));

    // تحميل توافر اللغات من الخادم بعد تسجيل دخول المسئول
    useEffect(() => {
        if (!isAdminAuthenticated) return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await AdminAPI.getLanguageAvailability();
                const a = (res as any)?.availability;
                if (!cancelled && a && typeof a.en === 'boolean' && typeof a.de === 'boolean') {
                    setLangAvailability({ en: a.en, de: a.de });
                    db.save('langAvailability', { en: a.en, de: a.de });
                }
            } catch {
                /* تجاهل */
            }
        })();
        return () => { cancelled = true; };
    }, [isAdminAuthenticated]);

    const setLangAvailabilityPersist = async (next: LanguageAvailability) => {
        setLangAvailability(next);
        db.save('langAvailability', next);
        try {
            const res = await AdminAPI.updateLanguageAvailability(next);
            const a = (res as any)?.availability;
            if (a && typeof a.en === 'boolean' && typeof a.de === 'boolean') {
                setLangAvailability({ en: a.en, de: a.de });
                db.save('langAvailability', { en: a.en, de: a.de });
            }
            showToast('تم حفظ توافر اللغات ✅', 'success');
        } catch (e: any) {
            showToast(e?.message || 'تعذر حفظ توافر اللغات', 'error');
        }
    };

    const {
        darkMode, toggleTheme,
        selectedTheme, setSelectedTheme,
        themeSchedules, setThemeSchedules,
        customThemeConfig, setCustomThemeConfig
    } = useAppTheme();

    const {
        learningLang,
        folders, setFolders,
        cards, setCards,
        stories, setStories,
        curriculum, setCurriculum,
        coupons, setCoupons,
        banners, setBanners,
        broadcasts, setBroadcasts,
        tickets, setTickets,
        mediaItems, setMediaItems,
        sentenceTopics, setSentenceTopics,
        inspirationalSlides, setInspirationalSlides,
        refreshFoldersFromApi,
    } = useAppData(null, setToast);

    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const t = translations[language];

    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = language;
    }, [dir, language]);

    const redirectToUserApp = () => {
        window.location.href = '/';
    };

    const handleSecuritySuccess = () => {
        sessionStorage.setItem(ADMIN_SECURITY_KEY, '1');
        setIsSecurityPassed(true);
        showToast('تم التحقق من رقم الحماية', 'success');
    };

    const handleAdminLoginSuccess = () => {
        sessionStorage.setItem(ADMIN_LOGIN_KEY, '1');
        setIsAdminAuthenticated(true);
        showToast('تم تسجيل الدخول كمسؤول', 'success');
        AdminAPI.getAllTickets()
            .then((res: { tickets?: SupportTicket[] }) => {
                if (res?.tickets) setTickets(res.tickets);
            })
            .catch(() => { });
    };

    const handleAdminLogout = () => {
        AuthAPI.adminLogout().catch(() => { });
        localStorage.removeItem('hcard_admin_token');
        localStorage.removeItem('hcard_admin_profile');
        sessionStorage.removeItem(ADMIN_LOGIN_KEY);
        sessionStorage.removeItem(ADMIN_SECURITY_KEY);
        setIsAdminAuthenticated(false);
        setIsSecurityPassed(false);
        showToast('تم تسجيل الخروج من لوحة المسؤول', 'info');
    };

    return (
        <LazyMotion features={domMax}>
            <div className="min-h-screen w-full overflow-x-hidden bg-background dark:bg-dark-bg transition-colors duration-300 font-sans" dir={dir}>

                <Suspense fallback={null}>
                    <ThemeVisuals theme={selectedTheme} isDarkMode={darkMode} customConfig={customThemeConfig} />
                </Suspense>

                <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} type={toast.type} />

                <Suspense fallback={null}>
                    {!isSecurityPassed && (
                        <AdminAuthModal
                            isOpen={true}
                            onClose={redirectToUserApp}
                            onSuccess={handleSecuritySuccess}
                            onFailure={redirectToUserApp}
                        />
                    )}
                </Suspense>

                <Suspense fallback={<LoadingScreen />}>
                    {isSecurityPassed && isAdminAuthenticated ? (
                        <AdminDashboard
                            onExit={handleAdminLogout}
                            folders={folders} setFolders={setFolders}
                            stories={stories} setStories={setStories}
                            cards={cards} setCards={setCards}
                            curriculum={curriculum} setCurriculum={setCurriculum}
                            t={t}
                            selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme}
                            themeSchedules={themeSchedules} setThemeSchedules={setThemeSchedules}
                            customThemeConfig={customThemeConfig} setCustomThemeConfig={setCustomThemeConfig}
                            coupons={coupons} setCoupons={setCoupons}
                            banners={banners} setBanners={setBanners}
                            broadcasts={broadcasts} setBroadcasts={setBroadcasts}
                            tickets={tickets} setTickets={setTickets}
                            mediaItems={mediaItems} setMediaItems={setMediaItems}
                            sentenceTopics={sentenceTopics} setSentenceTopics={setSentenceTopics}
                            inspirationalSlides={inspirationalSlides} setInspirationalSlides={setInspirationalSlides}
                            refreshFoldersFromApi={refreshFoldersFromApi}
                            isDarkMode={darkMode} toggleTheme={toggleTheme}
                            learningLang={(learningLang === 'de' ? 'de' : 'en')}
                            langAvailability={langAvailability} setLangAvailability={setLangAvailabilityPersist}
                        />
                    ) : isSecurityPassed ? (
                        <AdminLoginView onSuccess={handleAdminLoginSuccess} />
                    ) : (
                        <div className="flex items-center justify-center min-h-screen bg-[#0f172a] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0f172a] to-black" />

                            <div className="text-center relative z-10 p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl max-w-sm mx-4 w-full">
                                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck size={32} className="text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">منطقة محمية (لوحة التحكم المستقلة)</h2>
                                <p className="text-gray-400 text-sm mb-6">جاري تحويلك لبوابة التحقق...</p>
                                <button
                                    onClick={redirectToUserApp}
                                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                                >
                                    العودة لواجهة المستخدم
                                </button>
                            </div>
                        </div>
                    )}
                </Suspense>
            </div>
        </LazyMotion>
    );
}
