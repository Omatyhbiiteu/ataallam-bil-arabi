import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoadingScreen } from './components/LoadingScreen';
import { Menu } from 'lucide-react';
import { Logo } from './components/Logo';
import { Toast } from './components/Toast';
import { authService } from './services/authService';
import { AuthAPI, MarketingAPI, StoriesAPI, CurriculumAPI, SentencesAPI, UserContentAPI, SettingsAPI } from './services/apiClient';
import { normalizeCurriculumModules } from './utils/curriculumUtils';
import { speakText, stopSpeaking } from './services/ttsService';
import { db } from './services/db';
import { AppNotification, Card, Stats, Language, LanguageAvailability, PromoBanner, User } from './types';
import { translations } from './utils/translations';
import { AnimatePresence, motion, LazyMotion, domMax, MotionConfig } from 'framer-motion';
import { useAppTheme } from './hooks/useAppTheme';
import { useAppData } from './hooks/useAppData';
import { useAppAuth } from './hooks/useAppAuth';
import { cardUpdatesToApi, useUserContentActions } from './hooks/useUserContentActions';
import { AppAuthScreens } from './components/app/AppAuthScreens';
import { ProRequiredPanel } from './components/app/ProRequiredPanel';
import { UpgradeModal, UpgradeModalState } from './components/app/UpgradeModal';
import {
  AIAssistantView,
  CommunityView,
  DictionaryView,
  FoldersView,
  GamesView,
  HomeView,
  InteractiveTour,
  LearningPathView,
  NotificationDrawer,
  OnboardingWizard,
  PromoPopupLazy,
  ReviewSession,
  SentencesView,
  SettingsView,
  StoriesView,
  ThemeVisuals,
} from './app/lazyComponents';
import {
  ActiveReviewSession,
  computeLevelData,
  computeReviewStreak,
  computeSuccessRate,
  formatServerNotificationTime,
  getDayStart,
} from './app/learningStats';

export default function App() {
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState('home');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [settingsTargetSection, setSettingsTargetSection] = useState<'account' | 'notifications' | 'appearance' | 'support' | 'subscription'>('appearance');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<ActiveReviewSession | null>(null);
  const [toast, setToast] = useState<{ message: string, visible: boolean, type?: 'success' | 'error' | 'info', variant?: 'default' | 'modal' }>({ message: '', visible: false });
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({ open: false, title: '', message: '' });
  const [showInteractiveTour, setShowInteractiveTour] = useState(false);
  const reviewSaveVersionsRef = useRef<Record<string, number>>({});

  // Wrapper for toast to match hook signature
  const showToast = (message: string, type: 'success' | 'error' | 'info', variant: 'default' | 'modal' = 'default') => {
    setToast({ message, visible: true, type, variant });
  };

  // useAppAuth starts before useAppData, so notification creation is wired through a ref.
  const addNotificationRef = useRef<((n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void) | null>(null);

  const {
    currentUser, setCurrentUser,
    authView, setAuthView,
    showOnboarding,
    handleLoginSuccess,
    handleOnboardingComplete: hookHandleOnboardingComplete,
    handleLogout: hookHandleLogout,
    updateCurrentUser
  } = useAppAuth({
    onLoginNavigate: () => setActiveTab('home'),
    onLogoutNavigate: () => {
      setMobileMenuOpen(false);
      setActiveTab('dashboard');
    },
    showToast,
    addNotification: (n) => addNotificationRef.current && addNotificationRef.current(n)
  });

  // --- DATA LOADING ---
  const [userName, setUserName] = useState(() => db.load('username', 'User'));
  const [userImage, setUserImage] = useState<string | null>(() => db.load('userimage', null));
  const [language, setLanguage] = useState<Language>(() => db.load('lang', 'ar'));
  const [langAvailability, setLangAvailability] = useState<LanguageAvailability>(() => db.load('langAvailability', { en: true, de: true }));
  const [forgotPasswordPrefillEmail, setForgotPasswordPrefillEmail] = useState('');

  const clearStaleUserSession = useCallback(() => {
    authService.clearLocalSession();
    setCurrentUser(null);
    setAuthView('landing');
    setUserName('User');
    setUserImage(null);
  }, [setCurrentUser, setAuthView]);

  const syncUserFromServer = useCallback(async () => {
    try {
      const token = localStorage.getItem('hcard_user_token') || localStorage.getItem('auth_token');
      if (!token) {
        clearStaleUserSession();
        return;
      }
      const res = (await AuthAPI.me()) as { user?: User };
      if (res?.user) {
        setCurrentUser(res.user);
        authService.saveUser(res.user);
        if (res.user.name) setUserName(res.user.name);
        setUserImage(res.user.avatar ?? null);
        if (res.user.avatar) db.save('userimage', res.user.avatar);
        return;
      }
      clearStaleUserSession();
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) {
        clearStaleUserSession();
      }
      /* تجاهل أخطاء الشبكة */
    }
  }, [setCurrentUser, clearStaleUserSession]);

  // --- CUSTOM HOOKS ---
  const {
    darkMode, toggleTheme,
    primaryColor, setPrimaryColor,
    fontSize, setFontSize,
    animationsEnabled, setAnimationsEnabled,
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
    quizStats, setQuizStats,
    reviewLog, setReviewLog,
    completedStoryIds, setCompletedStoryIds,
    completedLessonIds, setCompletedLessonIds,
    notifications, setNotifications,
    studyPlan, setStudyPlan,
    coupons, setCoupons,
    banners, setBanners,
    broadcasts, setBroadcasts,
    sentenceTopics, setSentenceTopics,
    inspirationalSlides, setInspirationalSlides,
    refreshFoldersAndCardsFromApi,
    dailyMissionState,
    gameXp, setGameXp,
    registerDailyStoryCompleted,
    registerDailyMastered,
  } = useAppData(currentUser, setToast);

  const hasActiveSubscription = useMemo(() => {
    if (!currentUser) return false;
    const plan = currentUser.plan ?? 'free';
    const isPaid = plan === 'silver' || plan === 'pro' || plan === 'enterprise';
    const expiresMs = currentUser.planExpiresAt ? new Date(currentUser.planExpiresAt).getTime() : null;
    return isPaid && (expiresMs === null || !Number.isFinite(expiresMs) || expiresMs > Date.now());
  }, [currentUser?.plan, currentUser?.planExpiresAt, currentUser?.id]);

  const refreshLanguageAvailabilityFromServer = useCallback(async () => {
    try {
      const res = await SettingsAPI.getLanguageAvailability();
      const a = (res as any)?.availability;
      if (a && typeof a.en === 'boolean' && typeof a.de === 'boolean') {
        setLangAvailability({ en: a.en, de: a.de });
        db.save('langAvailability', { en: a.en, de: a.de });
      }
    } catch {
      /* تجاهل */
    }
  }, []);

  // تحميل توافر اللغات من الخادم (قبل الدخول وبعده)
  useEffect(() => {
    void refreshLanguageAvailabilityFromServer();
  }, [refreshLanguageAvailabilityFromServer]);

  const [isSwitchingLearningLang, setIsSwitchingLearningLang] = useState(false);
  const langAutoSwitchInProgressRef = useRef(false);

  /** تبديل لغة التعلّم (EN/DE) من الشريط الجانبي — يحدّث الحساب على السيرفر ويحمّل منهج/قصص/تقدم كل لغة من التخزين المحلي */
  const handleLearningLanguageChange = useCallback(
    async (lang: 'en' | 'de') => {
      if (!currentUser || lang === learningLang) return;
      if (langAvailability && langAvailability[lang] === false) {
        showToast(lang === 'de' ? 'اللغة الألمانية غير متاحة حالياً' : 'اللغة الإنجليزية غير متاحة حالياً', 'error', 'modal');
        return;
      }
      setIsSwitchingLearningLang(true);
      try {
        const res = await authService.updateProfile({ targetLanguage: lang });
        if (res.success && res.user) {
          setCurrentUser(res.user);
          showToast(
            lang === 'de'
              ? 'تم اختيار الألمانية 🇩🇪 — المنهج والمسار والتقدم حسب الألماني.'
              : 'تم اختيار الإنجليزية 🇬🇧 — المنهج والمسار والتقدم حسب الإنجليزي.',
            'success'
          );
        } else {
          showToast(res.error || 'تعذر حفظ لغة التعلم', 'error');
        }
      } catch (e: any) {
        showToast(e?.message || 'تعذر حفظ لغة التعلم', 'error');
      } finally {
        setIsSwitchingLearningLang(false);
      }
    },
    [currentUser, learningLang, setCurrentUser, langAvailability]
  );

  // لو المسئول قفل لغة والمستخدم حالياً عليها: حدّث الحساب على السيرفر ثم إعادة تحميل كاملة للصفحة للانتقال للغة المتاحة (مثلاً DE)
  useEffect(() => {
    if (!currentUser) {
      langAutoSwitchInProgressRef.current = false;
      return;
    }
    const cur = learningLang as 'en' | 'de';
    if (langAvailability?.[cur] !== false) return;
    const fallback: 'en' | 'de' | null =
      langAvailability?.en ? 'en' : (langAvailability?.de ? 'de' : null);
    if (!fallback || fallback === cur) return;
    if (langAutoSwitchInProgressRef.current) return;
    langAutoSwitchInProgressRef.current = true;

    void (async () => {
      try {
        const res = await authService.updateProfile({ targetLanguage: fallback });
        if (res.success && res.user) {
          setCurrentUser(res.user);
          window.location.reload();
          return;
        }
        langAutoSwitchInProgressRef.current = false;
        showToast(res.error || 'تعذر تحديث لغة التعلّم تلقائياً', 'error', 'modal');
      } catch (e: any) {
        langAutoSwitchInProgressRef.current = false;
        showToast(e?.message || 'تعذر تحديث لغة التعلّم', 'error', 'modal');
      }
    })();
  }, [currentUser?.id, learningLang, langAvailability, setCurrentUser]);

  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  const supportNotifInitialSyncDone = useRef(false);
  const lastUnreadSrvIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) {
      supportNotifInitialSyncDone.current = false;
      lastUnreadSrvIdsRef.current = new Set();
    }
  }, [currentUser?.id]);

  const syncServerNotifications = useCallback(async () => {
    if (!currentUser) return;
    const token = localStorage.getItem('hcard_user_token') || localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = (await AuthAPI.getNotifications()) as {
        notifications?: Array<{
          id: string;
          title: string;
          body: string;
          ticketId: string | null;
          broadcastId?: string | null;
          readAt: string | null;
          createdAt: string;
        }>;
      };
      const rows = res.notifications ?? [];
      const dismissedKey = `dismissed_srv_notifs_${currentUser.id}`;
      const dismissed = new Set(JSON.parse(localStorage.getItem(dismissedKey) || '[]') as string[]);

      const serverMapped: AppNotification[] = rows
        .filter((n) => !dismissed.has(n.id))
        .map((n) => ({
          id: `srv_${n.id}`,
          type: 'system',
          title: n.title,
          message: n.body,
          time: formatServerNotificationTime(n.createdAt),
          read: !!n.readAt,
          icon: 'bell',
          ticketId: n.ticketId,
          broadcastId: n.broadcastId ?? null,
        }));

      const unreadIds = new Set(serverMapped.filter((n) => !n.read).map((n) => n.id));
      if (supportNotifInitialSyncDone.current) {
        const prevUnread = lastUnreadSrvIdsRef.current;
        const newUnread = [...unreadIds].filter((id) => !prevUnread.has(id));
        if (newUnread.length > 0) {
          const newUnreadNotifs = serverMapped.filter((n) => newUnread.includes(n.id));
          const hasSupportReply = newUnreadNotifs.some((n) => !!n.ticketId);
          setToast({
            message: hasSupportReply
              ? 'فريق الدعم رد على تذكرتك. افتح الإشعارات أو الإعدادات ← الدعم.'
              : 'لديك إشعار جديد من المسئول أو النظام. افتح الإشعارات.',
            visible: true,
            type: 'info',
          });
        }
      }
      lastUnreadSrvIdsRef.current = unreadIds;
      supportNotifInitialSyncDone.current = true;

      setNotifications((prev) => {
        const localOnly = prev.filter((p) => !p.id.startsWith('srv_'));
        return [...serverMapped, ...localOnly].slice(0, 100);
      });
    } catch {
      /* تجاهل أخطاء الشبكة */
    }
  }, [currentUser?.id, setNotifications]);

  const handleSetNotificationsForDrawer = useCallback(
    (next: AppNotification[]) => {
      const prev = notificationsRef.current;
      const becameReadSrv: string[] = [];
      for (const n of next) {
        if (!n.id.startsWith('srv_')) continue;
        const o = prev.find((p) => p.id === n.id);
        if (o && !o.read && n.read) becameReadSrv.push(n.id.slice(4));
      }
      if (becameReadSrv.length > 0) {
        void AuthAPI.markNotificationsRead([...new Set(becameReadSrv)]);
      }

      if (currentUser) {
        const dismissedKey = `dismissed_srv_notifs_${currentUser.id}`;
        const arr = JSON.parse(localStorage.getItem(dismissedKey) || '[]') as string[];
        let changed = false;
        for (const d of prev) {
          if (next.some((n) => n.id === d.id)) continue;
          if (!d.id.startsWith('srv_')) continue;
          const raw = d.id.slice(4);
          if (!arr.includes(raw)) {
            arr.push(raw);
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(dismissedKey, JSON.stringify(arr.slice(-200)));
        }
      }

      setNotifications(next);
    },
    [currentUser?.id, setNotifications]
  );

  // --- MARKETING STATE - Active Banner Management ---
  const [activeBanner, setActiveBanner] = useState<PromoBanner | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const isEffectiveBannerActive = (b: PromoBanner) => {
    if (!b.isActive) return false;
    if (!b.expiryDate) return true;
    const ts = Date.parse(b.expiryDate);
    if (Number.isNaN(ts)) return true;
    return ts > nowTs;
  };

  // Banner to show inside "الاشتراك" section
  const activeOfferBanner = useMemo(() => {
    return (banners || []).find((b) => isEffectiveBannerActive(b)) ?? null;
  }, [banners, nowTs]);

  // Load marketing banners/coupons/inspirational from backend (instead of mock local data)
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    void (async () => {
      try {
        const [bRes, cRes, iRes] = await Promise.all([MarketingAPI.getBanners(), MarketingAPI.getCoupons(), MarketingAPI.getInspirational()]);
        if (cancelled) return;

        if (Array.isArray((bRes as any)?.banners)) setBanners((bRes as any).banners);
        if (Array.isArray((cRes as any)?.coupons)) setCoupons((cRes as any).coupons);
        if (Array.isArray((iRes as any)?.slides)) setInspirationalSlides((iRes as any).slides);
      } catch {
        /* تجاهل أخطاء الشبكة */
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser?.id, setBanners, setCoupons, setInspirationalSlides]);

  // Load stories from backend for the selected learning language
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const lang = (learningLang === 'de' ? 'de' : 'en') as 'en' | 'de';

    void (async () => {
      try {
        const res = await StoriesAPI.getAll(lang);
        if (cancelled) return;
        if (Array.isArray((res as any)?.stories)) setStories((res as any).stories);
      } catch {
        /* تجاهل أخطاء الشبكة */
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser?.id, learningLang, setStories]);

  // 🔄 Live sync: poll stories every 45s + refresh when tab regains focus
  // (localStorage storage events don't cross origins, so we use polling instead)
  useEffect(() => {
    if (!currentUser) return;

    const fetchLatestStories = async () => {
      const lang = (learningLang === 'de' ? 'de' : 'en') as 'en' | 'de';
      try {
        const res = await StoriesAPI.getAll(lang);
        if (Array.isArray((res as any)?.stories)) setStories((res as any).stories);
      } catch { /* silent — keep current stories on error */ }
    };

    // Poll every 45 seconds
    const interval = setInterval(fetchLatestStories, 45_000);

    // Also re-fetch immediately when the user switches back to this tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchLatestStories();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser?.id, learningLang, setStories]);

  // Load curriculum from backend for the selected learning language (مصدر الحقيقة لمسار التعلم)
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const lang = learningLang;

    void (async () => {
      try {
        const res = await CurriculumAPI.getAll(lang);
        if (cancelled) return;
        if (Array.isArray((res as any)?.modules)) {
          setCurriculum(normalizeCurriculumModules((res as any).modules));
        }
      } catch {
        /* تجاهل أخطاء الشبكة */
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser?.id, learningLang, setCurriculum]);

  // المواقف الحياتية: مصدر الحقيقة من الـ API (بدون بطاقات تجريبية محلية) — للمشتركين فقط
  useEffect(() => {
    if (!currentUser || !hasActiveSubscription) return;
    let cancelled = false;
    const lang = learningLang;

    void (async () => {
      try {
        const res = await SentencesAPI.getAll(lang);
        if (cancelled) return;
        if (Array.isArray((res as any)?.topics)) {
          setSentenceTopics((res as any).topics);
        }
      } catch {
        /* تجاهل أخطاء الشبكة — يبقى ما في التخزين المحلي */
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser?.id, learningLang, setSentenceTopics, hasActiveSubscription]);

  // إعادة جلب مواضيع الجمل عند فتح تبويب المواقف الحياتية
  useEffect(() => {
    if (!currentUser || !hasActiveSubscription) return;
    if (activeTab !== 'sentences') return;
    let cancelled = false;
    const lang = learningLang;
    void (async () => {
      try {
        const res = await SentencesAPI.getAll(lang);
        if (cancelled) return;
        if (Array.isArray((res as any)?.topics)) {
          setSentenceTopics((res as any).topics);
        }
      } catch {
        /* تجاهل */
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, currentUser?.id, learningLang, setSentenceTopics, hasActiveSubscription]);

  // إعادة جلب المنهج عند فتح الرئيسية أو مسار التعلّم — يظهر ما أضافه المسئول دون ريفرش يدوي للصفحة
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== 'home' && activeTab !== 'learning_path') return;
    let cancelled = false;
    const lang = learningLang;
    void (async () => {
      try {
        const res = await CurriculumAPI.getAll(lang);
        if (cancelled) return;
        if (Array.isArray((res as any)?.modules)) {
          setCurriculum(normalizeCurriculumModules((res as any).modules));
        }
      } catch {
        /* تجاهل أخطاء الشبكة */
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, currentUser?.id, learningLang, setCurriculum]);

  // فتح تبويب البطاقات: جلب المجلدات والبطاقات من الخادم فوراً (محتوى جديد من لوحة التحكم)
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== 'cards') return;
    void refreshFoldersAndCardsFromApi();
  }, [activeTab, currentUser?.id, refreshFoldersAndCardsFromApi]);

  // أثناء فتح تبويب البطاقات: مزامنة تلقائية سريعة لإظهار مجلدات/بطاقات الأدمن بدون ريفريش يدوي
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== 'cards') return;

    const intervalMs = 3000;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void refreshFoldersAndCardsFromApi();
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [activeTab, currentUser?.id, refreshFoldersAndCardsFromApi]);

  // عند العودة للتبويب أو للنافذة: تحديث المنهج + مواضيع الجمل + المجلدات/البطاقات (بعد التعديل من لوحة المسئول)
  useEffect(() => {
    if (!currentUser) return;
    const refetchWhenVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshLanguageAvailabilityFromServer();
      const lang = learningLang;
      void (async () => {
        try {
          const res = await CurriculumAPI.getAll(lang);
          if (Array.isArray((res as any)?.modules)) {
            setCurriculum(normalizeCurriculumModules((res as any).modules));
          }
        } catch {
          /* تجاهل */
        }
        if (hasActiveSubscription) {
          try {
            const sRes = await SentencesAPI.getAll(lang);
            if (Array.isArray((sRes as any)?.topics)) {
              setSentenceTopics((sRes as any).topics);
            }
          } catch {
            /* تجاهل */
          }
        }
        void refreshFoldersAndCardsFromApi();
      })();
    };
    const onWindowFocus = () => {
      void refreshLanguageAvailabilityFromServer();
      const lang = learningLang;
      void (async () => {
        if (hasActiveSubscription) {
          try {
            const sRes = await SentencesAPI.getAll(lang);
            if (Array.isArray((sRes as any)?.topics)) {
              setSentenceTopics((sRes as any).topics);
            }
          } catch {
            /* تجاهل */
          }
        }
        void refreshFoldersAndCardsFromApi();
      })();
    };
    document.addEventListener('visibilitychange', refetchWhenVisible);
    window.addEventListener('focus', onWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', refetchWhenVisible);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [currentUser?.id, learningLang, setCurriculum, setSentenceTopics, refreshFoldersAndCardsFromApi, refreshLanguageAvailabilityFromServer, hasActiveSubscription]);

  // Sync Broadcasts to User Notifications
  useEffect(() => {
    // Find broadcasts that user hasn't seen/received yet
    // In a real app we'd track 'lastReceivedBroadcastId' or similar
    // For now, we check if notification with same ID (or stored ID reference) exists

    if (!currentUser) return;

    const receivedBroadcastIds = JSON.parse(localStorage.getItem(`received_broadcasts_${currentUser.id}`) || '[]');
    const newBroadcasts = broadcasts.filter(b => {
      const alreadyReceived = receivedBroadcastIds.includes(b.id);
      if (alreadyReceived) return false;

      // Filter by Target Audience
      if (b.targetAudience === 'all') return true;

      // Mock "Active" check: randomly assigned for demo or simple logic
      // In real app, we check currentUser.lastActive or currentUser.status
      const isUserActive = true; // Assuming current user is active since they are logged in

      if (b.targetAudience === 'active' && isUserActive) return true;
      if (b.targetAudience === 'inactive' && !isUserActive) return true;

      return false;
    });

    if (newBroadcasts.length > 0) {
      const newNotifs: AppNotification[] = newBroadcasts.map(b => ({
        id: crypto.randomUUID(), // New ID for user instance
        type: b.type,
        title: b.title,
        message: b.message,
        icon: b.icon,
        time: 'الآن',
        read: false
      }));

      setNotifications(prev => [...newNotifs, ...prev]);

      // Mark as received
      localStorage.setItem(`received_broadcasts_${currentUser.id}`, JSON.stringify([...receivedBroadcastIds, ...newBroadcasts.map(b => b.id)]));

      // Toast for the latest one
      const latest = newBroadcasts[0];
      setToast({ message: `إشعار جديد: ${latest.title}`, visible: true, type: 'success' });
    }
  }, [broadcasts, currentUser]);

  // --- STUDY PLAN DAILY REMINDER ---
  useEffect(() => {
    if (!currentUser || !studyPlan) return;

    // Check if we already reminded them today
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const lastReminderDate = localStorage.getItem(`study_plan_reminder_${currentUser.id}`);

    if (lastReminderDate !== todayStr) {
      // Small delay to not overwhelm on load
      const timeout = setTimeout(() => {
        const planNotif: AppNotification = {
          id: crypto.randomUUID(),
          type: 'milestone',
          title: 'تذكير بخطة الدراسة 📚',
          message: 'خطتك الدراسية الذكية بانتظارك! خصص وقتاً اليوم لتحقيق أهدافك.',
          icon: 'star',
          time: 'الآن',
          read: false
        };

        setNotifications(prev => {
          if (prev.some(n => n.title === planNotif.title && n.time === 'الآن')) return prev;
          return [planNotif, ...prev].slice(0, 50);
        });

        localStorage.setItem(`study_plan_reminder_${currentUser.id}`, todayStr);
        setToast({ message: planNotif.title, visible: true, type: 'info' });
      }, 3000); // 3-second delay after load

      return () => clearTimeout(timeout);
    }
  }, [studyPlan, currentUser, setNotifications]);

  // Check for active popup banner on load/auth
  useEffect(() => {
    // Only show if user is logged in (or maybe even if not?) - let's show for logged in for now
    if (currentUser && banners.length > 0) {
      const popup = banners.find(b => isEffectiveBannerActive(b) && (b.type === 'popup' || b.type === 'banner'));
      if (popup) {
        // Check session storage to not annoy user every refresh
        const seen = sessionStorage.getItem(`seen_banner_${popup.id}`);
        if (!seen) {
          // Short delay for better UX
          const timer = setTimeout(() => setActiveBanner(popup), 2000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [banners, currentUser]);

  const closePromoPopup = () => {
    if (activeBanner) {
      sessionStorage.setItem(`seen_banner_${activeBanner.id}`, 'true');
      setActiveBanner(null);
    }
  };

  // لو الإعلان اتوقف/انتهت مدته أثناء وجود المودال
  useEffect(() => {
    if (!activeBanner) return;
    if (!isEffectiveBannerActive(activeBanner)) {
      setActiveBanner(null);
    }
  }, [activeBanner, nowTs]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID(),
      time: 'الآن',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
    setToast({ message: `${notif.title}: ${notif.message} `, visible: true, type: 'success' });
  }, [setNotifications]);

  // Update the ref so useAppAuth can use it
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  // Helpers to bridge the hook and the UI
  const handleLogout = hookHandleLogout;
  const handleOnboardingComplete = () => {
    hookHandleOnboardingComplete(userName);
    // Show Interactive Tour after onboarding
    setShowInteractiveTour(true);
  };

  const handleTourComplete = () => {
    setShowInteractiveTour(false);
    // Mark tour as completed
    if (currentUser) {
      localStorage.setItem(`tour_complete_${currentUser.id}`, 'true');
    }
  };

  const handleTargetLanguageChange = (newLang: 'en' | 'de') => {
    updateCurrentUser({ targetLanguage: newLang });
  };

  // Persist shared data (User preferences that are technically not handled by hooks completely yet)
  useEffect(() => { db.save('lang', language); }, [language]);
  useEffect(() => { db.save('username', userName); }, [userName]);
  useEffect(() => { if (userImage) db.save('userimage', userImage); }, [userImage]);
  useEffect(() => { db.save('langAvailability', langAvailability); }, [langAvailability]);
  useEffect(() => {
    if (currentUser?.name) {
      setUserName(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setUserImage(currentUser.avatar ?? null);
    if (currentUser.avatar) db.save('userimage', currentUser.avatar);
  }, [currentUser?.id, currentUser?.avatar]);

  useEffect(() => {
    if (!currentUser) return;
    void syncUserFromServer();
    void syncServerNotifications();
    const interval = setInterval(() => void syncServerNotifications(), 90_000);
    const handler = () => {
      if (document.visibilityState === 'visible') {
        void syncUserFromServer();
        void syncServerNotifications();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handler);
    };
  }, [currentUser?.id, syncUserFromServer, syncServerNotifications]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const t = translations[language];

  /** مسار التعلم للمجاني: الوحدة الأولى (أول module) فقط؛ برو يرى المسار كاملاً. */
  const learningPathCurriculum = useMemo(() => {
    if (hasActiveSubscription) return curriculum;
    if (!curriculum.length) return curriculum;
    return curriculum.slice(0, 1);
  }, [curriculum, hasActiveSubscription]);

  const openUpgradeModal = useCallback((message: string, title = 'الميزة متاحة في Pro') => {
    setUpgradeModal({ open: true, title, message });
  }, []);

  const navigateMainTab = useCallback(
    (tab: string) => {
      if (tab === 'sentences' && !hasActiveSubscription) {
        openUpgradeModal(
          'قسم المواقف الحياتية (الجمل والتعبيرات اليومية) متاح لمشتركي الخطة المدفوعة فقط. اشترك في Pro للوصول إلى جميع المواقف والمستويات.',
          'المواقف الحياتية مع Pro'
        );
        return;
      }
      setActiveTab(tab);
    },
    [hasActiveSubscription, openUpgradeModal]
  );

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  useEffect(() => {
    stopSpeaking();
    if (activeTab === 'admin_trigger') {
      setActiveTab('home'); // Redirect to home instead of dashboard
    }
  }, [activeTab]);

  const {
    handleAddFolder,
    handleDeleteFolder,
    handleEditFolder,
    handleAddCard,
    handleEditCard,
    handleEditCards,
    handleDeleteCard,
    handleDeleteCards,
    handleDeleteAll,
  } = useUserContentActions({
    currentUser,
    learningLang,
    hasActiveSubscription,
    folders,
    cards,
    setFolders,
    setCards,
    refreshFoldersAndCardsFromApi,
    openUpgradeModal,
    showToast,
    addNotification,
    registerDailyMastered,
  });

  const startSession = (folderId: string | null, mode: 'due' | 'all', specificCardIds?: string[]) => {
    let candidates: Card[] = [];
    const isPracticeSession = mode === 'all' || !!specificCardIds?.length;

    if (specificCardIds && specificCardIds.length > 0) {
      // Custom Practice Mode: Specific cards selected by user
      candidates = cards.filter(c => specificCardIds.includes(c.id));
    } else if (folderId) {
      // Strict Mode: Only cards in THIS folder, ignoring subfolders
      candidates = cards.filter(c => c.folderId === folderId);
    } else {
      // Global session for all cards
      candidates = [...cards];
    }

    // Shuffle/Sort Logic
    let queue: Card[] = [];
    if (mode === 'due') {
      queue = candidates
        .filter(c => c.nextReview <= Date.now() || c.status === 'new')
        .sort((a, b) => {
          // 1. Sort by difficulty (easeFactor) - Harder cards first (lower easeFactor)
          if (a.easeFactor !== b.easeFactor) {
            return a.easeFactor - b.easeFactor;
          }
          // 2. Sort by time - Closest to current time first (latest nextReview)
          return b.nextReview - a.nextReview;
        });
    } else {
      queue = [...candidates];
      // Fisher-Yates Shuffle
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    }

    if (queue.length === 0) {
      setToast({ message: 'لا توجد بطاقات متاحة للمراجعة حالياً! 👏', visible: true, type: 'info' });
      return;
    }

    setSessionQueue({ queue, isPractice: isPracticeSession });

    // Auto-speak first card using the known learning language
    setTimeout(() => {
      if (queue[0]) speakText(queue[0].frontText, learningLang as 'en' | 'de');
    }, 500);
  };



  const handleQuizComplete = (score: number, storyId: string) => {
    setQuizStats(prev => {
      const newTotal = prev.totalQuizzes + 1;
      const oldSum = prev.averageScore * prev.totalQuizzes;
      const newAvg = (oldSum + score) / newTotal;
      return { totalQuizzes: newTotal, averageScore: Math.round(newAvg) };
    });
    if (score >= 70) {
      setCompletedStoryIds(prev => {
        if (prev.includes(storyId)) return prev;
        queueMicrotask(() => registerDailyStoryCompleted());
        addNotification({
          type: 'milestone',
          title: 'بطل القصص! 📖',
          message: `لقد أنهيت قصة بنجاح وحصلت على ${Math.round(score)}% في الاختبار.مذهل!`,
          icon: 'star'
        });
        return [...prev, storyId];
      });
    }
  };

  const handleStoryReadComplete = (storyId: string) => {
    setCompletedStoryIds((prev) => {
      if (prev.includes(storyId)) return prev;
      queueMicrotask(() => registerDailyStoryCompleted());
      addNotification({
        type: 'milestone',
        title: 'قصة مكتملة',
        message: 'سُجّلت قراءة القصة كمكتملة على حسابك فقط.',
        icon: 'star',
      });
      return [...prev, storyId];
    });
  };

  const handleLessonComplete = (lessonId: string) => {
    const orderedLessonIds = learningPathCurriculum.flatMap((m) => m.lessons.map((l) => l.id));
    setCompletedLessonIds(prev => {
      if (prev.includes(lessonId)) return prev;
      const expectedNextLessonId = orderedLessonIds.find((id) => !prev.includes(id));
      if (expectedNextLessonId && expectedNextLessonId !== lessonId) {
        queueMicrotask(() =>
          setToast({
            message: 'يجب إكمال الدروس بالترتيب داخل المسار التعليمي أولاً.',
            visible: true,
            type: 'error',
          })
        );
        return prev;
      }
      addNotification({
        type: 'achievement',
        title: 'درس مكتمل! 🌟',
        message: 'أحسنت! لقد أتممت درساً جديداً في مسارك التعليمي. استمر في التألق!',
        icon: 'trophy'
      });
      return [...prev, lessonId];
    });
  };



  const logReviewCount = useCallback((count: number, timestamp = Date.now()) => {
    const safeCount = Math.max(0, Math.floor(count));
    if (!safeCount) return;
    const dayKey = getDayStart(timestamp);
    setReviewLog((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex((entry) => entry.date === dayKey);
      if (existingIndex >= 0) {
        next[existingIndex] = { ...next[existingIndex], count: next[existingIndex].count + safeCount };
      } else {
        next.push({ date: dayKey, count: safeCount });
      }
      next.sort((a, b) => a.date - b.date);
      const maxEntries = 365;
      return next.slice(-maxEntries);
    });
  }, [setReviewLog]);

  const handleReviewSessionUpdateCard = useCallback(
    (updatedCard: Card) => {
      setCards((prev) => {
        const old = prev.find((c) => c.id === updatedCard.id);
        if (old && old.status !== 'mastered' && updatedCard.status === 'mastered') {
          queueMicrotask(() => registerDailyMastered());
        }
        return prev.map((c) => (c.id === updatedCard.id ? updatedCard : c));
      });

      const shouldPersist =
        !!currentUser?.id &&
        !updatedCard.isSystem &&
        (updatedCard.userId == null || String(updatedCard.userId) === String(currentUser.id));

      if (shouldPersist) {
        const version = (reviewSaveVersionsRef.current[updatedCard.id] || 0) + 1;
        reviewSaveVersionsRef.current[updatedCard.id] = version;
        const body = cardUpdatesToApi(updatedCard);
        void UserContentAPI.updateCard(learningLang, updatedCard.id, body).catch((error: any) => {
          if (reviewSaveVersionsRef.current[updatedCard.id] !== version) return;
          showToast(error?.message || 'تعذر حفظ موعد مراجعة البطاقة على الخادم', 'error');
        });
      }
    },
    [currentUser?.id, learningLang, registerDailyMastered, setCards]
  );

  const stats: Stats = useMemo(() => ({
    totalCards: cards.length,
    reviewedToday: reviewLog.find((entry) => entry.date === getDayStart(Date.now()))?.count || 0,
    streak: computeReviewStreak(reviewLog),
    successRate: computeSuccessRate(cards, quizStats),
    byStatus: {
      new: cards.filter(c => c.status === 'new').length,
      learning: cards.filter(c => c.status === 'learning').length,
      review: cards.filter(c => c.status === 'review').length,
      mastered: cards.filter(c => c.status === 'mastered').length,
      completedStoryIds: completedStoryIds
    },
    quizStats: quizStats
  }), [cards, completedStoryIds, quizStats, reviewLog]);
  const levelData = useMemo(() => computeLevelData({
    cards,
    completedStoryCount: completedStoryIds.length,
    completedLessonCount: completedLessonIds.length,
    quizStats,
    bonusXp: dailyMissionState.bonusXp,
    gameXp,
  }), [cards, completedStoryIds.length, completedLessonIds.length, quizStats, dailyMissionState.bonusXp, gameXp]);

  const dueCardsCount = cards.filter(c => c.nextReview <= Date.now()).length;

  // --- ROUTING LOGIC ---
  if (!currentUser) {
    return (
      <AppAuthScreens
        authView={authView}
        dir={dir}
        darkMode={darkMode}
        animationsEnabled={animationsEnabled}
        langAvailability={langAvailability}
        forgotPasswordPrefillEmail={forgotPasswordPrefillEmail}
        toggleTheme={toggleTheme}
        setAuthView={setAuthView}
        setForgotPasswordPrefillEmail={setForgotPasswordPrefillEmail}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion={animationsEnabled ? 'never' : 'always'}>
      <div className="site-responsive-root min-h-screen w-full overflow-x-hidden bg-background dark:bg-dark-bg transition-colors duration-300 font-sans" dir={dir}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg"
        >
          تخطي إلى المحتوى الرئيسي
        </a>

        {/* Onboarding Wizard Overlay - Loaded above everything */}
        <AnimatePresence>
          {showOnboarding && currentUser && (
            <Suspense fallback={null}>
              <OnboardingWizard
                userName={(currentUser?.name || userName).split(' ')[0]}
                onComplete={handleOnboardingComplete}
                langAvailability={langAvailability}
              />
            </Suspense>
          )}

          {/* Interactive Tour - After Onboarding */}
          {showInteractiveTour && currentUser && (
            <Suspense fallback={null}>
              <InteractiveTour
                targetLanguage={(currentUser.targetLanguage === 'ar' ? 'en' : (currentUser.targetLanguage || 'en')) as 'en' | 'de'}
                onComplete={handleTourComplete}
              />
            </Suspense>
          )}

          {/* Marketing Popup */}
          {activeBanner && (
            <Suspense fallback={null}>
              <PromoPopupLazy
                banner={activeBanner}
                onClose={closePromoPopup}
                coupon={activeBanner.relatedCouponCode ? coupons.find(c => c.code === activeBanner.relatedCouponCode) : undefined}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <Suspense fallback={null}>
          <ThemeVisuals theme={selectedTheme} isDarkMode={darkMode} animationsEnabled={animationsEnabled} customConfig={customThemeConfig} targetLanguage={learningLang as 'en' | 'de'} />
        </Suspense>
        <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} type={toast.type} variant={toast.variant ?? 'default'} />
        <UpgradeModal
          modal={upgradeModal}
          onClose={() => setUpgradeModal({ open: false, title: '', message: '' })}
          onOpenSubscription={() => {
            setUpgradeModal({ open: false, title: '', message: '' });
            setSettingsTargetSection('subscription');
            setActiveTab('settings');
          }}
        />

        {!showOnboarding && (
          <Sidebar
            activeTab={activeTab} setActiveTab={navigateMainTab}
            isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
            isDarkMode={darkMode} toggleTheme={toggleTheme}
            t={t} dir={dir} userName={userName} userImage={userImage}
            onLogout={handleLogout}
            unreadCount={notifications.filter(n => !n.read).length}
            levelData={levelData}
            isMockMode={authService.isMockMode}
            selectedTheme={selectedTheme}
            onStartTour={() => setShowInteractiveTour(true)}
            onToggleNotifications={() => setNotificationDrawerOpen(true)}
            onNavigateToAccount={() => {
              setSettingsTargetSection('account');
              setActiveTab('settings');
            }}
            learningLang={learningLang}
            onLearningLanguageChange={handleLearningLanguageChange}
            isSwitchingLearningLang={isSwitchingLearningLang}
            hasActiveSubscription={hasActiveSubscription}
          />
        )}

        <Suspense fallback={<LoadingScreen />}>
          {sessionQueue ? (
            <ReviewSession
              queue={sessionQueue.queue}
              practiceMode={sessionQueue.isPractice}
              onExit={() => setSessionQueue(null)}
              onUpdateCard={handleReviewSessionUpdateCard}
              onLogReview={logReviewCount}
              t={t} dir={dir}
              targetLanguage={learningLang as 'en' | 'de'}
            />
          ) : !showOnboarding ? (
            <div className={`${dir === 'rtl' ? 'xl:mr-80' : 'xl:ml-80'} ${activeTab === 'ai_assistant' ? 'h-dvh overflow-hidden flex flex-col' : ''}`}>
              <header className={`xl:hidden bg-white dark:bg-dark-card shadow-sm p-4 flex justify-between items-center sticky top-0 z-30`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Logo variant="full" size="sm" className="!justify-end" />
                </div>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 shrink-0"><Menu size={24} /></button>
              </header>

              <main
                id="main-content"
                tabIndex={-1}
                className={`relative ${activeTab === 'ai_assistant' ? 'flex-1 overflow-hidden flex flex-col' : 'min-h-screen'}`}
              >
                {/* Notification Drawer - Always available */}
                <Suspense fallback={null}>
                  <NotificationDrawer
                    isOpen={notificationDrawerOpen}
                    onClose={() => setNotificationDrawerOpen(false)}
                    notifications={notifications}
                    setNotifications={handleSetNotificationsForDrawer}
                    t={t}
                    dir={dir}
                  />
                </Suspense>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    className={`app-route-frame w-full ${activeTab === 'ai_assistant' ? 'flex-1 min-h-0 flex flex-col' : 'h-full'}`}
                  >


                    {activeTab === 'home' && <HomeView
                      stats={stats}
                      dueCardsCount={dueCardsCount}
                      cards={cards}
                      reviewLog={reviewLog}
                      stories={stories}
                      curriculum={curriculum}
                      completedLessonIds={completedLessonIds}
                      userName={userName}
                      userImage={userImage}
                      subscriptionPlan={currentUser?.plan ?? 'free'}
                      planSubscribedAt={currentUser?.planSubscribedAt ?? null}
                      planExpiresAt={currentUser?.planExpiresAt ?? null}
                      isProSubscriber={hasActiveSubscription}
                      offersBanners={banners.filter((b) => isEffectiveBannerActive(b))}
                      inspirationalSlides={inspirationalSlides}
                      onSyncProfileFromServer={syncUserFromServer}
                      t={t}
                      selectedTheme={selectedTheme}
                      darkMode={darkMode}
                      onStartSession={() => startSession(null, 'due')}
                      setActiveTab={navigateMainTab}
                      studyPlan={studyPlan}
                      onNavigateToSettings={(section) => {
                        setSettingsTargetSection(section);
                        setActiveTab('settings');
                      }}
                    />}
                    {/* Notifications removed from routing - Now handled by Drawer */}
                    {/* Dashboard merged into Home */}


                    {activeTab === 'learning_path' && (
                      <LearningPathView
                        t={t}
                        curriculum={learningPathCurriculum}
                        completedLessonIds={completedLessonIds}
                        onCompleteLesson={handleLessonComplete}
                        dir={dir}
                        learningLang={learningLang as 'en' | 'de'}
                        isProSubscriber={hasActiveSubscription}
                        onRequirePro={(msg) => openUpgradeModal(msg, 'مسار التعلم الكامل')}
                      />
                    )}
                    {activeTab === 'cards' && <FoldersView user={currentUser} folders={folders} cards={cards} onAddFolder={handleAddFolder} onDeleteFolder={handleDeleteFolder} onEditFolder={handleEditFolder} onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} onEditCard={handleEditCard} onEditCards={handleEditCards} onDeleteCards={handleDeleteCards} onDeleteAll={handleDeleteAll} onStartSession={startSession} onNavigate={navigateMainTab} onRefreshData={refreshFoldersAndCardsFromApi} t={t} currentFolderId={activeFolderId} onFolderChange={setActiveFolderId} targetLanguage={learningLang as 'en' | 'de'} isProSubscriber={hasActiveSubscription} />}
                    {activeTab === 'stories' && <StoriesView
                      stories={stories}
                      t={t}
                      onQuizComplete={handleQuizComplete}
                      onStoryReadComplete={handleStoryReadComplete}
                      completedStoryIds={completedStoryIds}
                      onAddCard={handleAddCard}
                      folders={folders}
                      lang={(learningLang === 'de' ? 'de' : 'en')}
                      user={currentUser}
                      isProSubscriber={hasActiveSubscription}
                      onRequirePro={(msg) => openUpgradeModal(msg, 'جميع القصص مع Pro')}
                    />}
                    {activeTab === 'dictionary' && <DictionaryView t={t} onAddCard={handleAddCard} folders={folders} targetLanguage={learningLang as 'en' | 'de'} user={currentUser} />}
                    {activeTab === 'ai_assistant' && (
                      <AIAssistantView
                        t={t}
                        targetLanguage={learningLang as 'en' | 'de'}
                        userImage={userImage}
                        userName={userName}
                        userId={currentUser?.id}
                        subscriptionPlan={currentUser?.plan ?? 'free'}
                        studyPlan={studyPlan}
                        setStudyPlan={setStudyPlan}
                        isProSubscriber={hasActiveSubscription}
                        onRequirePro={(msg) => openUpgradeModal(msg)}
                      />
                    )}
                    {activeTab === 'community' && (
                      <CommunityView
                        t={t}
                        userName={userName}
                        userImage={userImage}
                        currentUser={currentUser}
                        learningLang={learningLang as 'en' | 'de'}
                        cards={cards}
                        reviewLog={reviewLog}
                        completedStoryIds={completedStoryIds}
                        quizStats={quizStats}
                        selectedTheme={selectedTheme}
                        profileTotalXp={levelData.totalXP}
                        dailyMission={dailyMissionState}
                        onDailyChallengeNavigate={(challengeId) => {
                          if (challengeId === 1) {
                            setActiveTab('cards');
                            startSession(null, 'due');
                          } else if (challengeId === 2) {
                            setActiveTab('stories');
                          } else if (challengeId === 3) {
                            setActiveTab('cards');
                          }
                        }}
                      />
                    )}
                    {activeTab === 'games' && (
                      <GamesView
                        t={t}
                        dir={dir}
                        learningLang={learningLang as 'en' | 'de'}
                        subscriptionPlan={currentUser?.plan ?? 'free'}
                        onGameXpEarned={(xp) => setGameXp((prev) => Math.max(0, prev + xp))}
                      />
                    )}
                    {activeTab === 'sentences' && (
                      hasActiveSubscription ? (
                        <SentencesView topics={sentenceTopics} learningLang={learningLang as 'en' | 'de'} />
                      ) : (
                        <ProRequiredPanel
                          onUpgrade={() =>
                            openUpgradeModal(
                              'ترقّ حسابك لفتح قسم المواقف الحياتية وجميع المحتوى التدريبي.',
                              'المواقف الحياتية مع Pro'
                            )
                          }
                        />
                      )
                    )}
                    {activeTab === 'settings' && (
                      <Suspense fallback={<LoadingScreen />}>
                        <SettingsView
                          darkMode={darkMode}
                          toggleTheme={toggleTheme}
                          onAdminClick={() => { window.location.href = '/admin/'; }}
                          language={language}
                          setLanguage={setLanguage}
                          t={t}
                          primaryColor={primaryColor}
                          setPrimaryColor={setPrimaryColor}
                          targetLanguage={learningLang as 'en' | 'de'}
                          onTargetLanguageChange={(lang) => handleTargetLanguageChange(lang)}
                          fontSize={fontSize}
                          setFontSize={setFontSize}
                          animationsEnabled={animationsEnabled}
                          setAnimationsEnabled={setAnimationsEnabled}
                          userName={userName}
                          userImage={userImage}
                          isProSubscriber={hasActiveSubscription}
                          offersBanners={banners.filter((b) => isEffectiveBannerActive(b))}
                          activeOfferBanner={activeOfferBanner}
                          subscriptionPlan={currentUser?.plan ?? 'free'}
                          planSubscribedAt={currentUser?.planSubscribedAt ?? null}
                          planExpiresAt={currentUser?.planExpiresAt ?? null}
                          userEmail={currentUser.email}
                          userGender={currentUser.gender || null}
                          userAge={currentUser.age || null}
                          userStartLevel={currentUser.startLevel || null}
                          onProfileUpdate={async (payload) => {
                            const result = await authService.updateProfile({
                              name: payload.name,
                              avatar: payload.image || undefined,
                              age: payload.age || undefined,
                              gender: payload.gender || undefined,
                            });
                            if (!result.success || !result.user) {
                              setToast({ message: result.error || 'فشل حفظ البيانات', visible: true, type: 'error' });
                              return { success: false, error: result.error };
                            }
                            setUserName(result.user.name);
                            setUserImage(result.user.avatar || null);
                            updateCurrentUser(result.user);
                            db.save('username', result.user.name);
                            db.save('userimage', result.user.avatar || null);
                            setToast({ message: 'تم حفظ التعديلات بنجاح! ✨', visible: true, type: 'success' });
                            return { success: true };
                          }}
                          onNavigate={navigateMainTab}
                          targetSection={settingsTargetSection}
                          userStats={{
                            level: levelData.level,
                            totalXP: levelData.totalXP,
                            xpProgress: levelData.progressToNext,
                            completedStories: completedStoryIds.length,
                            totalStories: stories.length,
                            completedLessons: completedLessonIds.length,
                            totalLessons: curriculum.reduce((acc, mod) => acc + (mod.lessons?.length ?? 0), 0),
                            completedTopics: sentenceTopics.filter(t => t.progress === 100).length,
                            totalTopics: sentenceTopics.length,
                            masteredCards: cards.filter(c => c.status === 'mastered').length,
                            totalCards: cards.length,
                            streakDays: stats.streak ?? 0,
                          }}
                          onLogout={handleLogout}
                          onDeleteAccount={async () => {
                            const r = await authService.deleteAccount();
                            if (!r.success) {
                              setToast({ message: r.error || 'تعذر حذف الحساب', visible: true, type: 'error' });
                              return r;
                            }
                            handleLogout();
                            return { success: true };
                          }}
                          notifications={notifications}
                          setNotifications={handleSetNotificationsForDrawer}
                          onRefreshNotifications={syncServerNotifications}
                        />
                      </Suspense>
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          ) : null}
        </Suspense>
      </div >
      </MotionConfig>
    </LazyMotion >
  );
}
