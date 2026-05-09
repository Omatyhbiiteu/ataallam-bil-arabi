import React, { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoadingScreen } from './components/LoadingScreen';
import { AlertTriangle, Book, Bookmark, Brain, ChevronDown, ChevronRight, Clock, Coffee, Copy, CreditCard, Crosshair, Crown, Feather, FileText, Filter, Flame, Gift, GraduationCap, Headphones, Heart, History, Home, Image, LayoutDashboard, LayoutGrid, LayoutTemplate, LifeBuoy, Lightbulb, Lock, LogOut, Maximize2, Menu, MessageSquare, Minimize2, MonitorSmartphone, Moon, MoreHorizontal, MoreVertical, MousePointerClick, Music, Palette, Pause, PenTool, Play, Plus, RefreshCw, Repeat, RotateCcw, Save, Search, Settings, Share2, Shield, ShieldCheck, Shuffle, SkipBack, SkipForward, Star, StopCircle, Sun, Target, Thermometer, ThumbsDown, ThumbsUp, Timer, Trash, Trash2, TrendingUp, Trophy, Type, Unlock, Upload, Users, Video, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { Logo } from './components/Logo';
import { Toast } from './components/Toast';
import { LoginView } from './components/LoginView';
import { LandingPage } from './components/LandingPage';
import { SignupView } from './components/SignupView';
import { ForgotPasswordView } from './components/ForgotPasswordView';
import { authService } from './services/authService';
import { AuthAPI, MarketingAPI, StoriesAPI, CurriculumAPI, SentencesAPI, UserContentAPI, SettingsAPI } from './services/apiClient';
import { canUserManageFolder } from './utils/folderPermissions';
import { normalizeCurriculumModules } from './utils/curriculumUtils';
import { speakText, detectLang, stopSpeaking } from './services/ttsService';
import { db } from './services/db';
import { AddCardResult, Card, Stats, Folder, Story, Language, LanguageAvailability, Module, User, AppTheme, ThemeSchedule, CustomThemeConfig, Coupon, PromoBanner, BroadcastNotification, SupportTicket, MediaItem, SRSGrade, ReviewLog } from './types';
import { translations } from './utils/translations';
import { AppNotification } from './types';
import { AnimatePresence, motion, LazyMotion, domMax } from 'framer-motion';
// ThemeVisuals, OnboardingWizard, and InteractiveTour are lazy-loaded for performance.
import {
  INITIAL_FOLDERS_EN,
  INITIAL_FOLDERS_DE,
  INITIAL_CARDS_EN,
  INITIAL_CARDS_DE,
  INITIAL_STORIES_EN,
  INITIAL_STORIES_DE,
  INITIAL_CURRICULUM_EN,
  INITIAL_CURRICULUM_DE
} from './data/initialData';
import { useAppTheme } from './hooks/useAppTheme';
import { useAppData } from './hooks/useAppData';
import { useAppAuth } from './hooks/useAppAuth';

// --- LAZY LOAD COMPONENTS ---
// const DashboardView = React.lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));

const StoriesView = React.lazy(() => import('./components/StoriesView').then(m => ({ default: m.StoriesView })));
const FoldersView = React.lazy(() => import('./components/FoldersView').then(m => ({ default: m.FoldersView })));
const GroupsView = React.lazy(() => import('./components/GroupsView').then(m => ({ default: m.GroupsView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const ReviewSession = React.lazy(() => import('./components/ReviewSession').then(m => ({ default: m.ReviewSession })));

const LearningPathView = React.lazy(() => import('./components/LearningPathView').then(m => ({ default: m.LearningPathView })));
const DictionaryView = React.lazy(() => import('./components/DictionaryView').then(m => ({ default: m.DictionaryView })));
const AIAssistantView = React.lazy(() => import('./components/AIAssistantView').then(m => ({ default: m.AIAssistantView })));
const HomeView = React.lazy(() => import('./components/HomeView').then(m => ({ default: m.HomeView })));
const SentencesView = React.lazy(() => import('./components/sentences/SentencesView').then(m => ({ default: m.SentencesView })));
const CommunityView = React.lazy(() => import('./components/CommunityView').then(m => ({ default: m.CommunityView })));
const NotificationDrawer = React.lazy(() => import('./components/NotificationDrawer').then(m => ({ default: m.NotificationDrawer })));
// const SubscriptionView = React.lazy(() => import('./components/SubscriptionView').then(m => ({ default: m.SubscriptionView })));




const PromoPopupLazy = React.lazy(() => import('./components/PromoPopup').then(m => ({ default: m.PromoPopup })));
const ThemeVisuals = React.lazy(() => import('./components/ThemeVisuals').then(m => ({ default: m.ThemeVisuals })));
const OnboardingWizard = React.lazy(() => import('./components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
const InteractiveTour = React.lazy(() => import('./components/InteractiveTour').then(m => ({ default: m.InteractiveTour })));

const getDayStart = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/** أيام متتالية بمراجعات فعلية (من سجل المراجعة اليومي) */
function computeReviewStreak(reviewLog: ReviewLog[]): number {
  const dayMs = 86400000;
  const today = getDayStart(Date.now());
  const byDay = new Map(reviewLog.filter((e) => e.count > 0).map((e) => [e.date, e.count]));
  const hasToday = (byDay.get(today) || 0) > 0;
  const hasYesterday = (byDay.get(today - dayMs) || 0) > 0;
  if (!hasToday && !hasYesterday) return 0;
  const start = hasToday ? today : today - dayMs;
  let streak = 0;
  let d = start;
  while ((byDay.get(d) || 0) > 0) {
    streak += 1;
    d -= dayMs;
  }
  return streak;
}

/** نسبة نجاح حقيقية: من متوسط الاختبارات إن وُجد، وإلا من آخر تقييم SRS للبطاقات */
function computeSuccessRate(
  cards: Card[],
  quizStats?: { totalQuizzes: number; averageScore: number }
): number {
  if (quizStats && quizStats.totalQuizzes > 0) {
    return Math.round(Math.min(100, Math.max(0, quizStats.averageScore)));
  }
  const graded = cards.filter((c) => (c.reviews || 0) > 0 && c.lastGrade != null);
  if (graded.length === 0) return 0;
  const good = graded.filter(
    (c) => c.lastGrade === SRSGrade.GOOD || c.lastGrade === SRSGrade.EASY
  ).length;
  return Math.round((good / graded.length) * 100);
}

function formatServerNotificationTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'الآن';
  if (diff < 3_600_000) return `منذ ${Math.floor(diff / 60_000)} د`;
  if (diff < 86_400_000) return `منذ ${Math.floor(diff / 3_600_000)} س`;
  return d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
}

const FREE_MAX_FOLDERS = 3;
const FREE_MAX_CARDS_PER_FOLDER = 10;

export default function App() {
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState('home');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [settingsTargetSection, setSettingsTargetSection] = useState<'account' | 'notifications' | 'appearance' | 'support' | 'subscription'>('appearance');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<Card[] | null>(null);
  const [toast, setToast] = useState<{ message: string, visible: boolean, type?: 'success' | 'error' | 'info', variant?: 'default' | 'modal' }>({ message: '', visible: false });
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });
  const [showInteractiveTour, setShowInteractiveTour] = useState(false);

  // Wrapper for toast to match hook signature
  const showToast = (message: string, type: 'success' | 'error' | 'info', variant: 'default' | 'modal' = 'default') => {
    setToast({ message, visible: true, type, variant });
  };

  // Notification helper defined early for hook usage (will use temporary function or we refactor addNotification)
  // Actually addNotification depends on state. We need to define addNotification *inside* App or hook.
  // BUT useAppAuth needs addNotification.
  // Let's defer addNotification logic or keep it in App.

  // We can't define addNotification before useAppData because useAppData provides setNotifications.
  // But useAppAuth needs it.
  // Solution: pass a wrapper that calls the "real" addNotification later? 
  // OR: useAppData doesn't provide addNotification, it provides setNotifications.
  // We can define the addNotification function here using setNotifications from useAppData.
  // But useAppData is called AFTER we might want to call useAppAuth?
  // React Hooks order matters.
  // We can call useAppData first (if it doesn't depend on currentUser... oh it DOES).
  // useAppData(currentUser).
  // useAppAuth produces currentUser.
  // So useAppAuth MUST be first.
  // But useAppAuth needs addNotification.
  // addNotification needs setNotifications (from useAppData).
  // Cycle detected!
  // Breaking the cycle:
  // useAppAuth should NOT take addNotification as dependency? 
  // It handles LoginSuccess (toast only usually) and OnboardingComplete (notification).
  // Maybe we just return the "triggerOnboardingComplete" from useAppAuth and let App.tsx handle the notification side effect?
  // Let's adjust useAppAuth usage strategy.
  // We will pass a "ref" or use effect? No.
  // We can define `addNotification` inside App.tsx using the setters from useAppData (which depends on currentUser).
  // But useAppData depends on currentUser.
  // So: 
  // 1. Call useAppAuth (provides currentUser).
  // 2. Call useAppData (uses currentUser).
  // 3. Define addNotification (uses useAppData.setNotifications).
  // 4. Pass addNotification to useAppAuth? NO, hooks can't update props later.
  // Solution: Pass a stable function ref or Use a useEffect to wire them up?
  // OR: Don't put heavy logic in useAppAuth handlers. Return `shouldShowOnboardingNotification` state?
  // OR: Simply pass a stub to useAppAuth for now, or move the logic of "Onboarding Notification" out of the hook back to App.tsx?
  // Let's move `handleOnboardingComplete` logic partially back to App.tsx or keep it simple.

  // Better approach: useAppAuth provides `handleOnboardingComplete(cb)` where cb is the notification action.
  // Or just keep `handleOnboardingComplete` in App.tsx and only use the hook for STATE setters.

  // Let's modify the plan slightly within this replacement.
  // I will call useAppAuth with minimal deps.
  // The handleOnboardingComplete in useAppAuth will accept the notification function as an ARGUMENT when called?
  // No, the signature in Step 50 fixed it to props.
  // Since I effectively hardcoded the prop in Step 50... I have to pass it.
  // But I can't pass a function that doesn't exist yet.

  // WAIT. setNotifications is from useAppData.
  // useAppData needs ... currentUser.
  // useAppAuth needs ... addNotification (which needs setNotifications).

  // I'll define a mutable ref for addNotification and pass that?
  // const addNotificationRef = useRef<...>(null);
  // useAppAuth({ addNotification: (n) => addNotificationRef.current?.(n) })
  // ...
  // addNotificationRef.current = realAddNotification;

  // This is a standard pattern for cyclic deps in hooks.
  const addNotificationRef = useRef<((n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void) | null>(null);

  const {
    currentUser, setCurrentUser,
    authView, setAuthView,
    showOnboarding, setShowOnboarding,
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

  const syncUserFromServer = useCallback(async () => {
    try {
      const token = localStorage.getItem('hcard_user_token') || localStorage.getItem('auth_token');
      if (!token) return;
      const res = (await AuthAPI.me()) as { user?: User };
      if (res?.user) {
        setCurrentUser(res.user);
        authService.saveUser(res.user);
        if (res.user.name) setUserName(res.user.name);
        setUserImage(res.user.avatar ?? null);
        if (res.user.avatar) db.save('userimage', res.user.avatar);
      }
    } catch {
      /* تجاهل أخطاء الشبكة */
    }
  }, [setCurrentUser]);

  // --- CUSTOM HOOKS ---
  const {
    darkMode, setDarkMode, toggleTheme,
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
    dailyGoal, setDailyGoal,
    studyPlan, setStudyPlan,
    coupons, setCoupons,
    banners, setBanners,
    broadcasts, setBroadcasts,
    tickets, setTickets,
    mediaItems, setMediaItems,
    sentenceTopics, setSentenceTopics,
    inspirationalSlides, setInspirationalSlides,
    refreshFoldersAndCardsFromApi,
    dailyMissionState,
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

  const addNotification = (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID(),
      time: 'الآن',
      read: false
    };
    const updated = [newNotif, ...notifications].slice(0, 50); // Keep last 50
    setNotifications(updated);
    // Also trigger toast for instant feedback
    setToast({ message: `${notif.title}: ${notif.message} `, visible: true, type: 'success' });
  };

  // Update the ref so useAppAuth can use it
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [notifications, setNotifications]); // Dependencies for the closure

  // Helpers to bridge the hook and the UI
  const handleLogout = hookHandleLogout;
  const handleOnboardingComplete = (data: any) => {
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

  // --- CONTENT LOADING LOGIC - Handled in useAppData ---

  // --- HANDLERS ---
  // toggleTheme is now from hook





  const cardUpdatesToApi = (updates: Partial<Card>): Record<string, unknown> => {
    const body: Record<string, unknown> = {};
    if (updates.folderId !== undefined) body.folderId = updates.folderId;
    if (updates.frontText !== undefined) body.frontText = updates.frontText;
    if (updates.backText !== undefined) body.backText = updates.backText;
    if (updates.frontImage !== undefined) body.frontImage = updates.frontImage;
    if (updates.nextReview !== undefined) body.nextReview = updates.nextReview;
    if (updates.interval !== undefined) body.interval = updates.interval;
    if (updates.reviews !== undefined) body.reviews = updates.reviews;
    if (updates.easeFactor !== undefined) body.easeFactor = updates.easeFactor;
    if (updates.status !== undefined) body.status = updates.status;
    return body;
  };

  const handleAddFolder = useCallback(async (name: string, color: string, parentId?: string) => {
    if (!hasActiveSubscription && parentId) {
      openUpgradeModal(
        'المجلدات الفرعية (مجلد داخل مجلد) متاحة لمشتركي Pro فقط. في الخطة المجانية يمكنك إنشاء مجلدات رئيسية فقط.'
      );
      return;
    }
    if (currentUser?.id) {
      if (!hasActiveSubscription) {
        const myFoldersCount = folders.filter(
          (f) =>
            !f.isSystem &&
            String(f.userId || '') === String(currentUser.id) &&
            !f.parentId
        ).length;
        if (myFoldersCount >= FREE_MAX_FOLDERS) {
          openUpgradeModal(
            `الخطة المجانية تسمح بحد أقصى ${FREE_MAX_FOLDERS} مجلدات رئيسية لكل لغة (بدون مجلدات فرعية). اشترك في Pro لمجلدات فرعية وحدود أوسع.`
          );
          return;
        }
      }
      const tempId = `tmp_folder_${crypto.randomUUID()}`;
      const optimisticFolder: Folder = {
        id: tempId,
        name,
        color,
        createdAt: Date.now(),
        parentId,
        userId: currentUser.id,
        isSystem: false,
      };
      setFolders((prev) => [...prev, optimisticFolder]);
      try {
        await UserContentAPI.createFolder(learningLang, { name, color, parentId: parentId || undefined });
        await refreshFoldersAndCardsFromApi();
        showToast('تم إنشاء المجلد بنجاح', 'success');
      } catch (e: any) {
        setFolders((prev) => prev.filter((f) => f.id !== tempId));
        showToast(e?.message || 'تعذر إنشاء المجلد على الخادم', 'error');
      }
      return;
    }
    const newFolder: Folder = { id: crypto.randomUUID(), name, color, createdAt: Date.now(), parentId };
    setFolders(prev => [...prev, newFolder]);
    showToast('تم إنشاء المجلد محلياً', 'success');
  }, [currentUser?.id, currentUser, hasActiveSubscription, folders, learningLang, refreshFoldersAndCardsFromApi, setFolders, openUpgradeModal]);

  const handleDeleteFolder = useCallback(async (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (folder?.isSystem) {
      showToast('لا يمكن حذف مجلدات النظام', 'error');
      return;
    }
    const getFolderFamily = (parentId: string): string[] => {
      const children = folders.filter(f => f.parentId === parentId);
      let ids = children.map(c => c.id);
      children.forEach(c => {
        ids = [...ids, ...getFolderFamily(c.id)];
      });
      return ids;
    };
    const folderIdsToDelete = [id, ...getFolderFamily(id)];
    if (currentUser?.id) {
      const isOptimisticMine = String(folder?.id || '').startsWith('tmp_folder_');
      const isOwnedByMe = folder && String(folder.userId || '') === String(currentUser.id);
      if (!isOptimisticMine && !isOwnedByMe) {
        showToast('لا يمكنك حذف هذا المجلد', 'error');
        return;
      }
      if (isOptimisticMine) {
        // لم يُحفَظ بعد على الخادم، لذا نحذفه محليًا فقط بدون استدعاء API.
        setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
        setCards(prev => prev.filter(c => !folderIdsToDelete.includes(c.folderId)));
        showToast('تم حذف المجلد', 'success');
        return;
      }
      if (!canUserManageFolder(folder ?? null, currentUser)) {
        showToast('لا يمكنك حذف هذا المجلد', 'error');
        return;
      }
      const prevFolders = folders;
      const prevCards = cards;
      setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
      setCards(prev => prev.filter(c => !folderIdsToDelete.includes(c.folderId)));
      try {
        await UserContentAPI.deleteFolder(learningLang, id);
        await refreshFoldersAndCardsFromApi();
        showToast('تم حذف المجلد بنجاح', 'success');
      } catch (e: any) {
        setFolders(prevFolders);
        setCards(prevCards);
        showToast(e?.message || 'تعذر حذف المجلد', 'error');
      }
      return;
    }
    setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
    setCards(prev => prev.filter(c => !folderIdsToDelete.includes(c.folderId)));
    showToast('تم حذف المجلد بنجاح', 'success');
  }, [folders, currentUser?.id, learningLang, refreshFoldersAndCardsFromApi, setFolders, setCards]);

  const handleEditFolder = useCallback(async (id: string, updates: Partial<Folder>) => {
    if (!hasActiveSubscription && updates.parentId != null && String(updates.parentId).trim() !== '') {
      openUpgradeModal(
        'تعيين مجلد أب (مجلد فرعي) متاح لمشتركي Pro فقط. يمكنك الإبقاء على المجلد في الجذر أو ترقية خطتك.'
      );
      return;
    }
    if (currentUser?.id) {
      const folder = folders.find(f => f.id === id);
      if (folder && !canUserManageFolder(folder, currentUser)) {
        showToast('لا يمكنك تعديل هذا المجلد', 'error');
        return;
      }
      try {
        await UserContentAPI.updateFolder(learningLang, id, {
          name: updates.name,
          color: updates.color,
          parentId: updates.parentId,
        });
        await refreshFoldersAndCardsFromApi();
        showToast('تم تعديل المجلد بنجاح ✨', 'success');
      } catch (e: any) {
        showToast(e?.message || 'تعذر حفظ التعديل', 'error');
      }
      return;
    }
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    showToast('تم تعديل المجلد بنجاح ✨', 'success');
  }, [currentUser?.id, folders, learningLang, refreshFoldersAndCardsFromApi, setFolders, hasActiveSubscription, openUpgradeModal, showToast]);

  const handleAddCard = useCallback(async (card: Partial<Card>): Promise<import('./types').AddCardResult> => {
    const frontText = String(card.frontText ?? '').trim();
    const backText = String(card.backText ?? '').trim();
    if (!card.folderId || !frontText || !backText) {
      showToast('أكمل الوجه الأمامي والخلفي للبطاقة ثم اختر مجلداً صالحاً.', 'error', 'modal');
      return false;
    }

    if (currentUser?.id && !hasActiveSubscription) {
      const requestedFolderId = String(card.folderId);
      const myCardsInFolder = cards.filter((c) => {
        if (String(c.folderId) !== requestedFolderId) return false;
        if (String(c.userId || '') === String(currentUser.id)) return true;
        const folder = folders.find((f) => f.id === requestedFolderId);
        return !c.isSystem && !c.userId && !!folder && String(folder.userId || '') === String(currentUser.id);
      }).length;
      if (myCardsInFolder >= FREE_MAX_CARDS_PER_FOLDER) {
        openUpgradeModal(
          `الخطة المجانية تسمح بحد أقصى ${FREE_MAX_CARDS_PER_FOLDER} بطاقة داخل كل مجلد. اشترك في Pro لزيادة الحد.`
        );
        return 'pro_limit';
      }
    }

    const cardFromUserApi = (raw: unknown): Card | null => {
      const o = raw as Record<string, unknown> | null;
      if (!o || typeof o !== 'object' || o.id == null) return null;
      const st = String(o.status ?? 'new');
      const status: Card['status'] =
        st === 'learning' || st === 'review' || st === 'mastered' || st === 'new' ? st : 'new';
      return {
        id: String(o.id),
        folderId: String(o.folderId ?? ''),
        frontText: String(o.frontText ?? ''),
        backText: String(o.backText ?? ''),
        frontImage: o.frontImage ? String(o.frontImage) : undefined,
        createdAt: Number(o.createdAt) || Date.now(),
        nextReview: Number(o.nextReview) || Date.now(),
        interval: Number(o.interval) || 0,
        reviews: Number(o.reviews) || 0,
        easeFactor: Number(o.easeFactor) || 2.5,
        status,
        isSystem: Boolean(o.isSystem),
        userId: o.userId != null && o.userId !== '' ? String(o.userId) : null,
      };
    };

    if (currentUser?.id) {
      let folderId = String(card.folderId);
      if (folderId.startsWith('tmp_folder_')) {
        const meta = folders.find((f) => f.id === folderId);
        const fname = meta?.name;
        const synced = await refreshFoldersAndCardsFromApi();
        const list = synced?.folders;
        if (!list?.length) {
          showToast('تعذر مزامنة المجلدات. تحقق من الاتصال بالخادم ثم أعد المحاولة.', 'error', 'modal');
          return false;
        }
        const resolved =
          (fname &&
            list.find(
              (f) =>
                f.name === fname &&
                !f.isSystem &&
                String(f.userId || '') === String(currentUser.id)
            )) ||
          list.find((f) => !f.isSystem && String(f.userId || '') === String(currentUser.id));
        if (!resolved) {
          showToast(
            'المجلد لم يُحفظ بعد على الخادم أو تغيّر. افتح تبويب البطاقات ثم جرّب الإضافة مرة أخرى.',
            'error',
            'modal'
          );
          return false;
        }
        folderId = resolved.id;
      }

      try {
        const res = (await UserContentAPI.createCard(learningLang, {
          folderId,
          frontText,
          backText,
          frontImage: card.frontImage ?? null,
        })) as { card?: unknown };
        const created = cardFromUserApi(res?.card);
        if (created) {
          setCards((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
        }
        /* لا ننتظر إعادة جلب كل البطاقات — قد يعلّق الطلب ويترك زر «جاري الحفظ» للأبد */
        void refreshFoldersAndCardsFromApi();
        addNotification({
          type: 'system',
          title: 'بطاقة جديدة 📚',
          message: `تم إضافة "${frontText}" بنجاح إلى مجلدك.`,
          icon: 'book'
        });
        showToast('تمت الإضافة بنجاح', 'success');
        return true;
      } catch (e: any) {
        showToast(e?.message || 'تعذر حفظ البطاقة على الخادم', 'error', 'modal');
        return false;
      }
    }
    const targetFolder = folders.find(f => f.id === card.folderId);
    if (targetFolder?.isSystem) {
      showToast('عذراً، لا يمكن إضافة كروت لمجلدات النظام إلا بعد تسجيل الدخول للمزامنة مع الخادم.', 'error');
      return false;
    }
    const newCard: Card = {
      ...card,
      folderId: String(card.folderId),
      frontText,
      backText,
      id: crypto.randomUUID(), createdAt: Date.now(), nextReview: Date.now(), interval: 0, reviews: 0, easeFactor: 2.5, status: 'new',
    } as Card;
    setCards(prev => [...prev, newCard]);
    addNotification({
      type: 'system',
      title: 'بطاقة جديدة 📚',
      message: `تم إضافة "${frontText}" بنجاح إلى مجلدك.`,
      icon: 'book'
    });
    showToast('تمت الإضافة بنجاح', 'success');
    return true;
  }, [folders, cards, currentUser?.id, currentUser, hasActiveSubscription, learningLang, refreshFoldersAndCardsFromApi, addNotification, setCards, showToast, openUpgradeModal]);

  const handleEditCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    const oldCard = cards.find((c) => c.id === cardId);
    const becomesMastered = updates.status === 'mastered' && oldCard?.status !== 'mastered';
    if (currentUser?.id) {
      const body = cardUpdatesToApi(updates);
      if (Object.keys(body).length === 0) {
        setCards(prevCards => prevCards.map(c => c.id === cardId ? { ...c, ...updates } : c));
        if (becomesMastered) registerDailyMastered();
        return;
      }
      try {
        await UserContentAPI.updateCard(learningLang, cardId, body);
        await refreshFoldersAndCardsFromApi();
        if (becomesMastered) registerDailyMastered();
        showToast('تم تعديل البطاقة بنجاح', 'success');
      } catch (e: any) {
        showToast(e?.message || 'تعذر حفظ التعديل', 'error');
      }
      return;
    }
    setCards(prevCards => prevCards.map(c => c.id === cardId ? { ...c, ...updates } : c));
    if (becomesMastered) registerDailyMastered();
    showToast('تم تعديل البطاقة بنجاح', 'success');
  }, [cards, currentUser?.id, learningLang, refreshFoldersAndCardsFromApi, setCards, registerDailyMastered]);

  const handleEditCards = useCallback(async (cardIds: string[], updates: Partial<Card>) => {
    if (cardIds.length === 0) return;
    const masteryCount = updates.status === 'mastered'
      ? cardIds.filter((id) => {
          const c = cards.find((x) => x.id === id);
          return c && c.status !== 'mastered';
        }).length
      : 0;
    if (currentUser?.id) {
      const body = cardUpdatesToApi(updates);
      if (Object.keys(body).length === 0) {
        setCards(prevCards => prevCards.map(c => cardIds.includes(c.id) ? { ...c, ...updates } : c));
        for (let i = 0; i < masteryCount; i++) registerDailyMastered();
        showToast('تم تحديث البطاقات المحددة', 'success');
        return;
      }
      try {
        await Promise.all(cardIds.map(id => UserContentAPI.updateCard(learningLang, id, body)));
        await refreshFoldersAndCardsFromApi();
        for (let i = 0; i < masteryCount; i++) registerDailyMastered();
        showToast('تم تحديث البطاقات المحددة', 'success');
      } catch (e: any) {
        showToast(e?.message || 'تعذر تحديث البطاقات', 'error');
      }
      return;
    }
    setCards(prevCards => prevCards.map(c => cardIds.includes(c.id) ? { ...c, ...updates } : c));
    for (let i = 0; i < masteryCount; i++) registerDailyMastered();
    showToast('تم تحديث البطاقات المحددة', 'success');
  }, [cards, currentUser?.id, learningLang, refreshFoldersAndCardsFromApi, setCards, registerDailyMastered]);

  const handleDeleteCard = useCallback(async (id: string) => {
    if (currentUser?.id) {
      try {
        await UserContentAPI.deleteCard(learningLang, id);
        await refreshFoldersAndCardsFromApi();
      } catch (e: any) {
        showToast(e?.message || 'تعذر حذف البطاقة', 'error');
      }
      return;
    }
    setCards(prevCards => prevCards.filter(c => c.id !== id));
  }, [currentUser?.id, learningLang, refreshFoldersAndCardsFromApi, setCards]);

  const handleDeleteCards = useCallback(async (cardIds: string[]) => {
    if (cardIds.length === 0) return;
    if (currentUser?.id) {
      try {
        await Promise.all(cardIds.map(id => UserContentAPI.deleteCard(learningLang, id)));
        await refreshFoldersAndCardsFromApi();
        showToast('تم حذف البطاقات المحددة', 'success');
      } catch (e: any) {
        showToast(e?.message || 'تعذر حذف بعض البطاقات', 'error');
      }
      return;
    }
    setCards(prevCards => prevCards.filter(c => !cardIds.includes(c.id)));
    showToast('تم حذف البطاقات المحددة', 'success');
  }, [currentUser?.id, learningLang, refreshFoldersAndCardsFromApi, setCards]);

  const handleDeleteAll = useCallback(async () => {
    if (!currentUser?.id) {
      showToast('سجّل الدخول لحذف مجلداتك وبطاقاتك الخاصة.', 'error');
      return;
    }
    const myFolderIds = folders
      .filter((f) => canUserManageFolder(f, currentUser))
      .map((f) => f.id);
    const serverFolderIds = myFolderIds.filter((id) => !String(id).startsWith('tmp_folder_'));
    const prevFolders = folders;
    const prevCards = cards;

    // Optimistic UI: remove current user's content immediately.
    setFolders((prev) => prev.filter((f) => !myFolderIds.includes(f.id)));
    setCards((prev) => prev.filter((c) => !myFolderIds.includes(c.folderId)));

    try {
      await UserContentAPI.deleteAllMyFolders(learningLang);
      await refreshFoldersAndCardsFromApi();
      showToast('تم حذف جميع مجلداتك وبطاقاتك التي أنشأتها (بما فيها الفرعية).', 'success');
    } catch (e: any) {
      try {
        // Fallback if bulk endpoint is unavailable.
        await Promise.all(serverFolderIds.map((id) => UserContentAPI.deleteFolder(learningLang, id)));
        await refreshFoldersAndCardsFromApi();
        showToast('تم حذف مجلداتك وبطاقاتك الخاصة.', 'success');
      } catch (fallbackError: any) {
        setFolders(prevFolders);
        setCards(prevCards);
        showToast(fallbackError?.message || e?.message || 'تعذر إكمال الحذف', 'error');
      }
    }
  }, [currentUser?.id, currentUser, folders, cards, learningLang, refreshFoldersAndCardsFromApi, setFolders, setCards]);

  const startSession = (folderId: string | null, mode: 'due' | 'all', specificCardIds?: string[]) => {
    let candidates: Card[] = [];

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

    setSessionQueue(queue);

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
    },
    [registerDailyMastered, setCards]
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
  // --- GAMIFICATION LOGIC (XP & Levels) — من نشاط فعلي فقط (لا قيم وهمية) ---
  const levelData = useMemo(() => {
    const totalReviews = cards.reduce((s, c) => s + (c.reviews || 0), 0);
    const mastered = cards.filter((c) => c.status === 'mastered').length;
    const storyXP = completedStoryIds.length * 15;
    const lessonXP = completedLessonIds.length * 10;
    const quizXP =
      quizStats && quizStats.totalQuizzes > 0
        ? Math.round(quizStats.averageScore * Math.min(quizStats.totalQuizzes, 50) * 0.2)
        : 0;
    const reviewXP = totalReviews * 8;
    const masteredXP = mastered * 25;
    const totalXP = Math.max(0, reviewXP + masteredXP + storyXP + lessonXP + quizXP + dailyMissionState.bonusXp);

    const level = Math.max(1, Math.floor(Math.sqrt(totalXP / 100)) + 1);
    const currentLevelXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const span = nextLevelXP - currentLevelXP;
    const progressToNext = span > 0 ? Math.min(100, Math.max(0, ((totalXP - currentLevelXP) / span) * 100)) : 0;

    return { level, totalXP, progressToNext };
  }, [cards, completedStoryIds, completedLessonIds, quizStats, dailyMissionState.bonusXp]);

  const statsWithXP = useMemo(() => ({
    ...stats,
    level: levelData.level,
    xp: levelData.totalXP,
    xpProgress: levelData.progressToNext
  }), [stats, levelData]);

  const dueCardsCount = cards.filter(c => c.nextReview <= Date.now()).length;

  // --- ROUTING LOGIC ---
  if (!currentUser) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onLoginClick={() => setAuthView('login')}
          isDarkMode={darkMode}
          toggleTheme={toggleTheme}
        />
      );
    }
    if (authView === 'signup') {
      return (
        <div className="font-sans" dir={dir}>
          <SignupView
            onSignupSuccess={handleLoginSuccess}
            onNavigateToLogin={() => setAuthView('login')}
            onBackToHome={() => setAuthView('landing')}
            isDarkMode={darkMode}
            toggleTheme={toggleTheme}
            langAvailability={langAvailability}
          />
        </div>
      );
    }
    if (authView === 'forgot-password') {
      return (
        <div className="font-sans" dir={dir}>
          <ForgotPasswordView
            onBackToLogin={() => setAuthView('login')}
            onBackToHome={() => setAuthView('landing')}
            isDarkMode={darkMode}
            toggleTheme={toggleTheme}
            initialEmail={forgotPasswordPrefillEmail}
          />
        </div>
      );
    }
    return (
      <div className="font-sans" dir={dir}>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => setAuthView('landing')}
          onNavigateToSignup={() => setAuthView('signup')}
          onForgotPassword={(emailFromField) => {
            setForgotPasswordPrefillEmail(emailFromField);
            setAuthView('forgot-password');
          }}
          isDarkMode={darkMode}
          toggleTheme={toggleTheme}
          langAvailability={langAvailability}
        />
      </div>
    );
  }

  return (
    <LazyMotion features={domMax}>
      <div className="min-h-screen w-full overflow-x-hidden bg-background dark:bg-dark-bg transition-colors duration-300 font-sans" dir={dir}>
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
          <ThemeVisuals theme={selectedTheme} isDarkMode={darkMode} customConfig={customThemeConfig} />
        </Suspense>
        <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} type={toast.type} variant={toast.variant ?? 'default'} />
        <AnimatePresence>
          {upgradeModal.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setUpgradeModal({ open: false, title: '', message: '' })}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Crown size={24} className="text-yellow-400" />
                  <h3 className="text-xl font-black">{upgradeModal.title}</h3>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{upgradeModal.message}</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUpgradeModal({ open: false, title: '', message: '' });
                      setSettingsTargetSection('subscription');
                      setActiveTab('settings');
                    }}
                    className="flex-1 bg-gradient-to-r from-primary to-red-600 hover:from-red-600 hover:to-primary text-white px-5 py-3 rounded-xl font-black transition"
                  >
                    اشترك في Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpgradeModal({ open: false, title: '', message: '' })}
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 rounded-xl font-black transition"
                  >
                    لاحقاً
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>



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
              queue={sessionQueue}
              onExit={() => setSessionQueue(null)}
              onUpdateCard={handleReviewSessionUpdateCard}
              onLogReview={logReviewCount}
              t={t} dir={dir}
              targetLanguage={learningLang as 'en' | 'de'}
            />
          ) : !showOnboarding ? (
            <div className={`${dir === 'rtl' ? 'md:mr-72' : 'md:ml-72'}`}>
              <header className="md:hidden bg-white dark:bg-dark-card shadow-sm p-4 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Logo variant="full" size="sm" className="!justify-end" />
                </div>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 shrink-0"><Menu size={24} /></button>
              </header>

              <main id="main-content" tabIndex={-1} className="min-h-screen relative">
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
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 1.02 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    className="w-full h-full"
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
                    {activeTab === 'sentences' && (
                      hasActiveSubscription ? (
                        <SentencesView topics={sentenceTopics} learningLang={learningLang as 'en' | 'de'} />
                      ) : (
                        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-10 text-center" dir="rtl">
                          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 flex items-center justify-center mb-6 border border-amber-400/30">
                            <Crown className="w-10 h-10 text-amber-400" />
                          </div>
                          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">المواقف الحياتية</h1>
                          <p className="text-gray-600 dark:text-gray-400 max-w-lg text-base md:text-lg font-bold leading-relaxed mb-8">
                            هذا القسم يتطلب <span className="text-amber-600 dark:text-amber-400">اشتراك Pro</span> — جمل وتعبيرات عملية لكل موقف (سفر، عمل، تسوق، وغيرها) مع تدريب كامل على مستويات A1–C2.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              openUpgradeModal(
                                'ترقّ حسابك لفتح قسم المواقف الحياتية وجميع المحتوى التدريبي.',
                                'المواقف الحياتية مع Pro'
                              )
                            }
                            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-lg shadow-xl shadow-amber-500/25 hover:opacity-95 transition"
                          >
                            عرض خطط الاشتراك
                          </button>
                        </div>
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
    </LazyMotion >
  );
}
