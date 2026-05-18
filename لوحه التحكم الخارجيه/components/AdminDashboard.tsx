
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import { db } from '../services/db';
import { Folder, Story, Card, Question, Module, AppTheme, CustomThemeConfig } from '../types';
import { INITIAL_STORIES_EN, INITIAL_STORIES_DE, INITIAL_FOLDERS_EN, INITIAL_FOLDERS_DE, INITIAL_CARDS_EN, INITIAL_CARDS_DE, INITIAL_CURRICULUM_EN, INITIAL_CURRICULUM_DE, INITIAL_SENTENCE_TOPICS } from '../data/initialData';
import { LayoutDashboard, BookOpen, Layers, Plus, Trash2, X, Save, Image as ImageIcon, ArrowLeft, ShieldCheck, Lock, Languages, Menu, HelpCircle, CheckSquare, ListOrdered, Type, CheckCircle, Edit2, Map, Clock, Video, Mic, Link as LinkIcon, FileText, Bold, Italic, Underline, AlignLeft, List, MousePointer2, ChevronRight, UploadCloud, FileAudio, PlayCircle, Book, Activity, Users, Star, TrendingUp, Palette, Moon, Flag, Sparkles, Sliders, Calendar, Wallet, CreditCard, Banknote, Zap, Smartphone, RefreshCw, Crown, Check, Award, Headphones, Download } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { AdminUsersView } from './AdminUsersView';
import { AdminManagersView } from './AdminManagersView';
import { AdminSidebar, AdminLang } from './admin/AdminSidebar';
import { OverviewTab } from './admin/OverviewTab';
import { StoriesTab } from './admin/StoriesTab';
import { StoryFormModal } from './admin/StoryFormModal';
import { MarketingTab } from './admin/MarketingTab';
import { AnalyticsTab } from './admin/AnalyticsTab';
import { NotificationsTab } from './admin/NotificationsTab';
import { SupportTab } from './admin/SupportTab';
import { MediaLibraryTab } from './admin/MediaLibraryTab';
import { PaymentSettingsTab } from './admin/payment/PaymentSettingsTab';
import { ThemesTab } from './admin/ThemesTab';
import { CurriculumTab } from './admin/CurriculumTab';
import { QuestionForm } from './admin/QuestionForm';
import { FoldersTab } from './admin/FoldersTab';
import { AdminSentencesView } from './admin/AdminSentencesView';
import { AdminGamesView } from './admin/AdminGamesView';
import { AdminInspirationalTab } from './admin/AdminInspirationalTab';
import { AdminUserProblemsTab } from './admin/AdminUserProblemsTab';
import { useAdminSupportNotifications } from '../hooks/useAdminSupportNotifications';
import { AdminSupportNotificationBell } from './admin/AdminSupportNotificationBell';
import { AdminAPI } from '../services/apiClient';
import { AdminDashboardProps } from './admin/AdminDashboard.types';
import { generateId, resolveOfficialDictRootId } from './admin/adminDashboardUtils';
import { THEMES_DATA } from './themeData';
import { getAutoTheme } from '../utils/themeScheduler';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    onExit, folders, setFolders, stories, setStories, cards, setCards, curriculum = [], setCurriculum = (_: Module[]) => { },
    selectedTheme, setSelectedTheme, themeSchedules, setThemeSchedules, customThemeConfig, setCustomThemeConfig,
    coupons, setCoupons, banners, setBanners, broadcasts, setBroadcasts, tickets, setTickets, mediaItems, setMediaItems, sentenceTopics, setSentenceTopics,
    inspirationalSlides, setInspirationalSlides,
    refreshFoldersFromApi,
    isDarkMode, toggleTheme, t, learningLang,
    langAvailability, setLangAvailability
}) => {
    // Navigation State
    const [activeTab, setActiveTab] = useState<'overview' | 'stories' | 'folders' | 'curriculum' | 'dictionary_manager' | 'themes' | 'payment_settings' | 'user_problems' | 'users' | 'admins' | 'marketing' | 'analytics' | 'notifications' | 'support' | 'media_library' | 'sentences' | 'games' | 'inspirational'>('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const adminInbox = useAdminSupportNotifications(45000);
    const [supportFocusTicketId, setSupportFocusTicketId] = useState<string | null>(null);
    const clearSupportFocus = useCallback(() => setSupportFocusTicketId(null), []);
    const handleOpenSupportFromInbox = useCallback((ticketId: string) => {
        setSupportFocusTicketId(ticketId);
        setActiveTab('support');
    }, []);

    const [usersFocusAppUserId, setUsersFocusAppUserId] = useState<string | null>(null);
    const clearUsersFocus = useCallback(() => setUsersFocusAppUserId(null), []);
    const handleOpenUserFromSupport = useCallback((userId: string) => {
        setUsersFocusAppUserId(userId);
        setActiveTab('users');
        setIsMobileMenuOpen(false);
    }, []);

    // ═══ Language Target State ═══
    // 'en' | 'de' | 'both' — controls which language(s) data is saved to
    const [adminLang, setAdminLang] = useState<AdminLang>('both');

    // Helper: returns the OTHER languages to write to (current lang handled by setXxx + useAppData)
    const getOtherLangs = (): ('en' | 'de')[] => {
        const targets = adminLang === 'both' ? ['en', 'de'] : [adminLang];
        return (targets as ('en' | 'de')[]).filter(l => l !== learningLang);
    };

    // Map of key → default data per language
    const getDefaults = (key: string, lang: 'en' | 'de'): any[] => {
        const map: Record<string, Record<string, any[]>> = {
            stories: { en: INITIAL_STORIES_EN, de: INITIAL_STORIES_DE },
            folders: { en: INITIAL_FOLDERS_EN, de: INITIAL_FOLDERS_DE },
            cards: { en: INITIAL_CARDS_EN, de: INITIAL_CARDS_DE },
            curriculum: { en: INITIAL_CURRICULUM_EN, de: INITIAL_CURRICULUM_DE },
            sentence_topics: { en: INITIAL_SENTENCE_TOPICS, de: INITIAL_SENTENCE_TOPICS },
        };
        return map[key]?.[lang] ?? [];
    };

    // Helper: save to OTHER language(s) only (never overwrites current lang — useAppData handles that)
    const saveToLangs = (key: string, updater: (prev: any[]) => any[]) => {
        getOtherLangs().forEach(lang => {
            const defaults = getDefaults(key, lang);
            const current = db.load<any[]>(key, defaults, lang);
            const updated = updater(current);
            db.save(key, updated, lang);
        });
    };

    // عند اختيار «وجهة الحفظ» EN أو DE: عرض مواضيع الجمل من نفس مسار الـ API (لا يعتمد على learningLang الذي يبقى en في لوحة المسئول)
    useEffect(() => {
        if (adminLang === 'both') return;
        const token = localStorage.getItem('hcard_admin_token');
        if (!token) return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await AdminAPI.getSentenceTopics(adminLang);
                if (cancelled) return;
                const list = Array.isArray((res as any)?.topics) ? (res as any).topics : [];
                setSentenceTopics(list);
                await db.save('sentence_topics', list, adminLang);
            } catch {
                /* تجاهل */
            }
        })();
        return () => { cancelled = true; };
    }, [adminLang, setSentenceTopics]);

    // ═══ MERGED BILINGUAL DATA FOR ADMIN DISPLAY ═══
    // Load both EN and DE data and merge them with a _lang marker so
    // the admin always sees ALL content regardless of their learningLang.
    const otherLang: 'en' | 'de' = learningLang === 'en' ? 'de' : 'en';
    const otherLangFlag = otherLang === 'de' ? '🇩🇪' : '🇺🇸';
    const currentLangFlag = learningLang === 'de' ? '🇩🇪' : '🇺🇸';

    // ─── Admin Stories State (reactive — updates immediately after save/delete) ───
    const [enStoriesForAdmin, setEnStoriesForAdmin] = useState<Story[]>(
        () => db.load<Story[]>('stories', getDefaults('stories', 'en'), 'en')
    );
    const [deStoriesForAdmin, setDeStoriesForAdmin] = useState<Story[]>(
        () => db.load<Story[]>('stories', getDefaults('stories', 'de'), 'de')
    );

    // Helper: reload both languages from API → update admin state + db + notify main site
    const refreshAdminStories = async () => {
        const [enRes, deRes] = await Promise.all([AdminAPI.getStories('en'), AdminAPI.getStories('de')]);
        const enList = Array.isArray((enRes as any)?.stories) ? (enRes as any).stories : [];
        const deList = Array.isArray((deRes as any)?.stories) ? (deRes as any).stories : [];
        await db.save('stories', enList, 'en');
        await db.save('stories', deList, 'de');
        setEnStoriesForAdmin(enList);
        setDeStoriesForAdmin(deList);
        setStories(learningLang === 'de' ? deList : enList);
        // Notify the main site (same browser, different tab) via storage event
        localStorage.setItem('keylang_stories_updated', Date.now().toString());
    };

    const mergedStories = useMemo(() => {
        const en = (enStoriesForAdmin || []).map((s: Story) => ({ ...s, _lang: 'en', _langFlag: '🇺🇸' }));
        const de = (deStoriesForAdmin || []).map((s: Story) => ({ ...s, _lang: 'de', _langFlag: '🇩🇪' }));
        const enIds = new Set(en.map((s: any) => s.id));
        const deOnly = de.filter((s: any) => !enIds.has(s.id));
        return [...en, ...deOnly];
    }, [enStoriesForAdmin, deStoriesForAdmin]);

    const storiesForAdminTab = useMemo(() => {
        if (adminLang === 'en') return (enStoriesForAdmin || []).map((s) => ({ ...s, _lang: 'en', _langFlag: '🇺🇸' })) as any;
        if (adminLang === 'de') return (deStoriesForAdmin || []).map((s) => ({ ...s, _lang: 'de', _langFlag: '🇩🇪' })) as any;
        return mergedStories as any;
    }, [adminLang, enStoriesForAdmin, deStoriesForAdmin, mergedStories]);

    const mergedCurriculum = useMemo(() => {
        const current = curriculum.map((m: Module) => ({ ...m, _lang: learningLang, _langFlag: currentLangFlag }));
        const otherRaw: Module[] = db.load('curriculum', getDefaults('curriculum', otherLang), otherLang);
        const currentIds = new Set(curriculum.map((m: Module) => m.id));
        const other = otherRaw
            .filter((m: Module) => !currentIds.has(m.id))
            .map((m: Module) => ({ ...m, _lang: otherLang, _langFlag: otherLangFlag }));
        return [...current, ...other];
    }, [curriculum, learningLang]);

    const mergedFolders = useMemo(() => {
        const current = folders.map((f: Folder) => ({ ...f, _lang: learningLang, _langFlag: currentLangFlag }));
        const otherRaw: Folder[] = db.load('folders', getDefaults('folders', otherLang), otherLang);
        const currentIds = new Set(folders.map((f: Folder) => f.id));
        const other = otherRaw
            .filter((f: Folder) => !currentIds.has(f.id))
            .map((f: Folder) => ({ ...f, _lang: otherLang, _langFlag: otherLangFlag }));
        return [...current, ...other];
    }, [folders, learningLang]);

    /** مجلدات المسئول (نظام فقط، بدون مجلدات مستخدمين) ومطابقة لوجهة الحفظ EN / DE / كلاهما */
    const dictOfficialFolders = useMemo(() => {
        return mergedFolders.filter((f: Folder & { _lang?: 'en' | 'de'; userId?: string | null }) => {
            if (!f.isSystem) return false;
            const pid = f.parentId;
            if (pid != null && String(pid).trim() !== '') return false;
            const uid = f.userId;
            if (uid != null && String(uid).trim() !== '') return false;
            if (adminLang === 'both') return true;
            return f._lang === adminLang;
        });
    }, [mergedFolders, adminLang]);

    /** جذر + فرع مباشر فقط (نفس لغة الحفظ، بدون مجلدات مستخدمين) — صالح لحفظ بطاقة القاموس */
    const dictOfficialAllowedFolderIds = useMemo(() => {
        const set = new Set<string>();
        type F = Folder & { _lang?: 'en' | 'de'; userId?: string | null };
        for (const r of dictOfficialFolders) {
            set.add(r.id);
            for (const f of mergedFolders as F[]) {
                if (f.parentId !== r.id) continue;
                if (adminLang !== 'both' && f._lang !== adminLang) continue;
                const uid = f.userId;
                if (uid != null && String(uid).trim() !== '') continue;
                set.add(f.id);
            }
        }
        return set;
    }, [dictOfficialFolders, mergedFolders, adminLang]);

    const mergedCards = useMemo(() => {
        const current = cards.map((c: Card) => ({ ...c, _lang: learningLang, _langFlag: currentLangFlag }));
        const otherRaw: Card[] = db.load('cards', getDefaults('cards', otherLang), otherLang);
        const currentIds = new Set(cards.map((c: Card) => c.id));
        const other = otherRaw
            .filter((c: Card) => !currentIds.has(c.id))
            .map((c: Card) => ({ ...c, _lang: otherLang, _langFlag: otherLangFlag }));
        return [...current, ...other];
    }, [cards, learningLang]);

    const enFoldersForAdmin = useMemo(() => db.load<Folder[]>('folders', getDefaults('folders', 'en'), 'en'), [folders]);
    const deFoldersForAdmin = useMemo(() => db.load<Folder[]>('folders', getDefaults('folders', 'de'), 'de'), [folders]);

    const foldersForAdminTab = useMemo(() => {
        const hasRealUserOwner = (uid: unknown) => {
            if (uid == null) return false;
            const v = String(uid).trim();
            if (v === '' || v === '0') return false;
            return true;
        };
        const isOfficialSystemFolder = (f: Folder & { userId?: string | null }) => {
            const uid = (f as any).userId;
            // Any folder without a real user owner is considered an official/admin folder
            return !hasRealUserOwner(uid);
        };
        if (adminLang === 'en') {
            return (enFoldersForAdmin || [])
                .filter((f) => isOfficialSystemFolder(f as Folder & { userId?: string | null }))
                .map(f => ({ ...f, _lang: 'en' as const, _langFlag: '🇺🇸' }));
        }
        if (adminLang === 'de') {
            return (deFoldersForAdmin || [])
                .filter((f) => isOfficialSystemFolder(f as Folder & { userId?: string | null }))
                .map(f => ({ ...f, _lang: 'de' as const, _langFlag: '🇩🇪' }));
        }
        const en = (enFoldersForAdmin || [])
            .filter((f) => isOfficialSystemFolder(f as Folder & { userId?: string | null }))
            .map(f => ({ ...f, _lang: 'en' as const, _langFlag: '🇺🇸' }));
        const de = (deFoldersForAdmin || [])
            .filter((f) => isOfficialSystemFolder(f as Folder & { userId?: string | null }))
            .map(f => ({ ...f, _lang: 'de' as const, _langFlag: '🇩🇪' }));
        const enIds = new Set(en.map(f => f.id));
        const deOnly = de.filter(f => !enIds.has(f.id));
        return [...en, ...deOnly];
    }, [adminLang, enFoldersForAdmin, deFoldersForAdmin]);

    const enCardsForAdmin = useMemo(() => db.load<Card[]>('cards', getDefaults('cards', 'en'), 'en'), [cards]);
    const deCardsForAdmin = useMemo(() => db.load<Card[]>('cards', getDefaults('cards', 'de'), 'de'), [cards]);

    const cardsForAdminTab = useMemo(() => {
        const hasRealUserOwner = (uid: unknown) => {
            if (uid == null) return false;
            const v = String(uid).trim();
            if (v === '' || v === '0') return false;
            return true;
        };
        const isOfficialSystemCard = (c: Card & { userId?: string | null }) => {
            const uid = (c as any).userId;
            return !hasRealUserOwner(uid);
        };
        if (adminLang === 'en') {
            return (enCardsForAdmin || [])
                .filter((c) => isOfficialSystemCard(c as Card & { userId?: string | null }))
                .map(c => ({ ...c, _lang: 'en' as const, _langFlag: '🇺🇸' }));
        }
        if (adminLang === 'de') {
            return (deCardsForAdmin || [])
                .filter((c) => isOfficialSystemCard(c as Card & { userId?: string | null }))
                .map(c => ({ ...c, _lang: 'de' as const, _langFlag: '🇩🇪' }));
        }
        const en = (enCardsForAdmin || [])
            .filter((c) => isOfficialSystemCard(c as Card & { userId?: string | null }))
            .map(c => ({ ...c, _lang: 'en' as const, _langFlag: '🇺🇸' }));
        const de = (deCardsForAdmin || [])
            .filter((c) => isOfficialSystemCard(c as Card & { userId?: string | null }))
            .map(c => ({ ...c, _lang: 'de' as const, _langFlag: '🇩🇪' }));
        const enIds = new Set(en.map(c => c.id));
        const deOnly = de.filter(c => !enIds.has(c.id));
        return [...en, ...deOnly];
    }, [adminLang, enCardsForAdmin, deCardsForAdmin]);

    // Payment Settings State
    // ...

    // Story Form State
    const [showStoryForm, setShowStoryForm] = useState(false);
    const [newStory, setNewStory] = useState<Partial<Story>>({ level: 'Beginner', image: '', tags: [] });
    const [newStoryLang, setNewStoryLang] = useState<'en' | 'de'>(() => (learningLang === 'de' ? 'de' : 'en'));
    const [isUploadingStoryImage, setIsUploadingStoryImage] = useState(false);
    const [storyImageUploadProgress, setStoryImageUploadProgress] = useState(0);
    const [storyImageUploadFileName, setStoryImageUploadFileName] = useState<string | undefined>();

    const findMatchingStoryIdByTitle = (lang: 'en' | 'de', title: string): string | null => {
        const list = lang === 'de' ? deStoriesForAdmin : enStoriesForAdmin;
        const match = (list || []).find((s) => (s.title || '').trim().toLowerCase() === (title || '').trim().toLowerCase());
        return match?.id || null;
    };



    // --- ADVANCED THEME STATE ---
    // Auto Theme Logic
    const [isAutoTheme, setIsAutoTheme] = useState(false);
    const themeSettingsLoadedRef = useRef(false);
    const themeSettingsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const themeSettingsErrorShownRef = useRef(false);

    useEffect(() => {
        if (isAutoTheme) {
            const autoTheme = getAutoTheme();
            if (selectedTheme !== autoTheme) {
                setSelectedTheme(autoTheme);
            }
        }
    }, [isAutoTheme, selectedTheme, setSelectedTheme]);

    // Question Management State (Global Modal)
    const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
    const [editingTargetType, setEditingTargetType] = useState<'story' | 'lesson'>('story');
    const [showQuestionManager, setShowQuestionManager] = useState(false);
    const [newQuestion, setNewQuestion] = useState<Partial<Question>>({ type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' });
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);


    // --- DICTIONARY MANAGER STATE ---
    const [showDictCardForm, setShowDictCardForm] = useState(false);
    const [dictCard, setDictCard] = useState<{ id?: string, front: string, back: string, folderId: string, image: string }>({ front: '', back: '', folderId: '', image: '' });
    const [dictOfficialRootId, setDictOfficialRootId] = useState('');
    const [dictSearch, setDictSearch] = useState('');

    const dictOfficialSubfolders = useMemo(() => {
        if (!dictOfficialRootId) return [] as Folder[];
        return mergedFolders.filter((f: Folder & { _lang?: 'en' | 'de'; userId?: string | null }) => {
            if (f.parentId !== dictOfficialRootId) return false;
            if (adminLang !== 'both' && f._lang !== adminLang) return false;
            const uid = f.userId;
            if (uid != null && String(uid).trim() !== '') return false;
            return true;
        });
    }, [mergedFolders, adminLang, dictOfficialRootId]);

    const dictOfficialSubfolderIdsSig = useMemo(
        () => dictOfficialSubfolders.map(s => s.id).sort().join(','),
        [dictOfficialSubfolders]
    );

    useEffect(() => {
        if (!showDictCardForm || dictOfficialFolders.length === 0) return;
        setDictOfficialRootId(r => (r && dictOfficialFolders.some(x => x.id === r) ? r : dictOfficialFolders[0].id));
    }, [showDictCardForm, adminLang, dictOfficialFolders]);

    useEffect(() => {
        if (!showDictCardForm || !dictOfficialRootId) return;
        setDictCard(prev => {
            const allowed = new Set([dictOfficialRootId, ...dictOfficialSubfolders.map(s => s.id)]);
            if (allowed.has(prev.folderId)) return prev;
            return { ...prev, folderId: dictOfficialRootId };
        });
    }, [showDictCardForm, dictOfficialRootId, dictOfficialSubfolderIdsSig]);

    // Curriculum Management State moved to CurriculumTab.tsx

    // Toast State
    const [toastMessage, setToastMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
    const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
        setToastMessage({ text, type });
    };

    useEffect(() => {
        let cancelled = false;

        const isTheme = (value: unknown): value is AppTheme =>
            typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEMES_DATA, value);

        const isCustomConfig = (value: unknown): value is CustomThemeConfig => {
            if (!value || typeof value !== 'object') return false;
            const config = value as Partial<CustomThemeConfig>;
            return (
                typeof config.id === 'string' &&
                typeof config.name === 'string' &&
                typeof config.primary === 'string' &&
                typeof config.secondary === 'string' &&
                typeof config.accent === 'string'
            );
        };

        void (async () => {
            try {
                const response: any = await AdminAPI.getThemeSettings();
                const settings = response?.settings;
                if (cancelled || !settings) return;

                if (isTheme(settings.selectedTheme)) {
                    setSelectedTheme(settings.selectedTheme);
                }
                if (Array.isArray(settings.themeSchedules)) {
                    setThemeSchedules(settings.themeSchedules);
                }
                if (isCustomConfig(settings.customThemeConfig)) {
                    setCustomThemeConfig(settings.customThemeConfig);
                }
                setIsAutoTheme(Boolean(settings.isAutoTheme));
                if (typeof settings.isDarkMode === 'boolean' && settings.isDarkMode !== isDarkMode) {
                    toggleTheme();
                }
            } catch (error) {
                console.error('Failed to load theme settings:', error);
            } finally {
                if (!cancelled) {
                    themeSettingsLoadedRef.current = true;
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [setCustomThemeConfig, setSelectedTheme, setThemeSchedules]);

    useEffect(() => {
        if (!themeSettingsLoadedRef.current) return;
        if (themeSettingsSaveTimerRef.current) {
            clearTimeout(themeSettingsSaveTimerRef.current);
        }

        themeSettingsSaveTimerRef.current = setTimeout(() => {
            const settings = {
                selectedTheme,
                isAutoTheme,
                isDarkMode,
                themeSchedules,
                customThemeConfig,
            };

            void AdminAPI.updateThemeSettings(settings)
                .then(() => {
                    themeSettingsErrorShownRef.current = false;
                })
                .catch((error) => {
                    console.error('Failed to save theme settings:', error);
                    if (!themeSettingsErrorShownRef.current) {
                        showToast('تعذر حفظ إعدادات المظهر على الخادم.', 'error');
                        themeSettingsErrorShownRef.current = true;
                    }
                });
        }, 500);

        return () => {
            if (themeSettingsSaveTimerRef.current) {
                clearTimeout(themeSettingsSaveTimerRef.current);
            }
        };
    }, [customThemeConfig, isAutoTheme, isDarkMode, selectedTheme, themeSchedules]);

    // --- Handlers ---

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'storyImage' | 'questionImage' | 'cardImage' | 'lessonImage' | 'dictImage') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ─── Story Image: upload via API, get back a real URL ───────────────────
        if (field === 'storyImage') {
            if (file.size > 10 * 1024 * 1024) {
                showToast(t.admin.common.imageTooLarge, 'error');
                return;
            }
            setIsUploadingStoryImage(true);
            setStoryImageUploadProgress(0);
            setStoryImageUploadFileName(file.name);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('kind', 'image');
            formData.append('context', 'curriculum');
            AdminAPI.uploadMediaWithProgress(formData, setStoryImageUploadProgress)
                .then(({ url }) => {
                    setStoryImageUploadProgress(100);
                    setNewStory(prev => ({ ...prev, image: url }));
                    showToast('تم رفع الصورة بنجاح ✓', 'success');
                    setTimeout(() => { setIsUploadingStoryImage(false); setStoryImageUploadProgress(0); }, 800);
                })
                .catch((err: any) => {
                    const errMsg = typeof err?.message === 'string' ? err.message : '';
                    console.warn('[Image Upload] API failed, falling back to Base64:', errMsg);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setNewStory(prev => ({ ...prev, image: reader.result as string }));
                        showToast(`تحذير: الخادم لم يستجب (${errMsg.slice(0, 60)}). تم حفظ الصورة مؤقتاً.`, 'error');
                    };
                    reader.readAsDataURL(file);
                    setIsUploadingStoryImage(false);
                    setStoryImageUploadProgress(0);
                });
            return;
        }

        // ─── Other fields: keep Base64 for local preview ────────────────────────
        if (file.size > 2 * 1024 * 1024) {
            showToast(t.admin.common.imageTooLarge, 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            if (field === 'questionImage') setNewQuestion({ ...newQuestion, image: reader.result as string });
            else if (field === 'dictImage') setDictCard(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    // Audio/Video handlers moved to specific components

    // --- Story Handlers ---
    const handleSaveStory = () => {
        if (!newStory.title || !newStory.content || !newStory.description) {
            showToast(t.admin.stories.validationMissing, 'error');
            return;
        }
        const cleanedTags = newStory.tags?.map(tag => tag.trim()).filter(Boolean);
        const story: Story = {
            id: newStory.id || generateId(),
            title: newStory.title!,
            description: DOMPurify.sanitize(newStory.description!),
            content: DOMPurify.sanitize(newStory.content!),
            translation: newStory.translation,
            image: newStory.image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800',
            level: newStory.level || 'Beginner',
            subLevel: newStory.subLevel,
            isSystem: true,
            questions: newStory.questions || [],
            wordCount: newStory.wordCount,
            estimatedReadingTime: newStory.estimatedReadingTime,
            difficulty: newStory.difficulty,
            tags: cleanedTags && cleanedTags.length > 0 ? cleanedTags : undefined,
            viewCount: newStory.viewCount,
            contentDirection: newStory.contentDirection || 'auto',
            translationDirection: newStory.translationDirection || 'auto'
        };

        const targetLangs: Array<'en' | 'de'> = adminLang === 'both' ? ['en', 'de'] : [adminLang];
        const payload = {
            title: story.title,
            description: story.description,
            content: story.content,
            translation: story.translation,
            image: story.image,
            level: story.level,
            subLevel: story.subLevel,
            questions: story.questions || [],
            wordCount: story.wordCount,
            estimatedReadingTime: story.estimatedReadingTime,
            difficulty: story.difficulty,
            tags: story.tags,
            viewCount: story.viewCount,
            contentDirection: story.contentDirection,
            translationDirection: story.translationDirection,
            isActive: true,
        };

        void (async () => {
            try {
                // Create / update for each target language
                for (const l of targetLangs) {
                    if (newStory.id) {
                        // update current story if it belongs to this language, otherwise update/create a matching title
                        const currentEditedLang = (newStory as any)?._lang as ('en' | 'de' | undefined);
                        if (currentEditedLang === l) {
                            await AdminAPI.updateStory(l, newStory.id, payload);
                        } else {
                            const otherId = findMatchingStoryIdByTitle(l, payload.title);
                            if (otherId) await AdminAPI.updateStory(l, otherId, payload);
                            else await AdminAPI.createStory(l, payload);
                        }
                    } else {
                        await AdminAPI.createStory(l, payload);
                    }
                }

                const langLabel = adminLang === 'both' ? 'EN + DE' : adminLang.toUpperCase();
                showToast(newStory.id ? `${t.admin.stories.saveSuccessEdit} (${langLabel})` : `${t.admin.stories.saveSuccessNew} (${langLabel})`, 'success');

                // Refresh admin list + notify main site
                await refreshAdminStories();
            } catch (e: any) {
                showToast(e?.message || 'فشل حفظ القصة على الخادم. تأكد من تسجيل دخول المسئول.', 'error');
            }
        })();

        setShowStoryForm(false);
        setNewStory({ level: 'Beginner', image: '', tags: [] });
    };

    const handleEditStory = (story: Story) => {
        setNewStory({ ...story });
        // story could come from mergedStories with _lang
        const anyStory = story as any;
        if (anyStory?._lang === 'de' || anyStory?._lang === 'en') {
            setNewStoryLang(anyStory._lang);
        } else {
            setNewStoryLang(learningLang === 'de' ? 'de' : 'en');
        }
        setShowStoryForm(true);
    };

    const handleDeleteStory = (story: Story) => {
        if (window.confirm(t.admin.stories.deleteConfirm)) {
            const id = story.id;
            const picked = story as any;
            const targetLang = picked?._lang as ('en' | 'de' | undefined);
            const lang = targetLang === 'de' || targetLang === 'en'
                ? targetLang
                : adminLang === 'de'
                    ? 'de'
                    : 'en';

            void (async () => {
                try {
                    if (adminLang === 'both' && picked?.title) {
                        const otherLang: 'en' | 'de' = lang === 'de' ? 'en' : 'de';
                        const otherId = findMatchingStoryIdByTitle(otherLang, picked.title);
                        await Promise.all([
                            AdminAPI.deleteStory(lang, id),
                            otherId ? AdminAPI.deleteStory(otherLang, otherId) : Promise.resolve(null),
                        ]);
                    } else {
                        await AdminAPI.deleteStory(lang, id);
                    }
                    showToast(t.admin.stories.deleteSuccess, 'info');
                    await refreshAdminStories();
                } catch (err: any) {
                    const detail = typeof err?.message === 'string' ? ` (${err.message.slice(0, 80)})` : '';
                    console.error('[deleteStory] Failed:', err);
                    showToast(`فشل حذف القصة من الخادم${detail}`, 'error');
                }
            })();
        }
    };

    // Curriculum Handlers moved to CurriculumTab.tsx

    // --- Editor Question Handlers ---
    // Moved to LessonEditor component

    // --- Questions Logic (Unified for Modal) ---

    const openQuestionManager = (targetId: string, type: 'story' | 'lesson') => {
        setEditingTargetId(targetId);
        setEditingTargetType(type);
        setShowQuestionManager(true);
        setEditingQuestionId(null);
        setNewQuestion({ type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' });
    };

    const getCurrentQuestions = (): Question[] => {
        if (editingTargetType === 'story') {
            return stories.find(s => s.id === editingTargetId)?.questions || [];
        } else {
            for (const m of curriculum) {
                const l = m.lessons.find(l => l.id === editingTargetId);
                if (l) return l.questions || [];
            }
            return [];
        }
    };

    const getCurrentTargetTitle = (): string => {
        if (editingTargetType === 'story') return stories.find(s => s.id === editingTargetId)?.title || '';
        else {
            for (const m of curriculum) {
                const l = m.lessons.find(l => l.id === editingTargetId);
                if (l) return l.title;
            }
            return '';
        }
    };

    const handleAddOrUpdateQuestion = () => {
        if (!editingTargetId || !newQuestion.text) {
            showToast(t.admin.questions.missingQuestionText, "error");
            return;
        }

        const questionType = newQuestion.type || 'multiple-choice';
        const normalizedOptions = newQuestion.options?.map(opt => opt.trim()).filter(Boolean);
        let correctAnswer = newQuestion.correctAnswer;

        if ((questionType === 'multiple-choice' || questionType === 'checkbox' || questionType === 'order') && (!normalizedOptions || normalizedOptions.length < 2)) {
            showToast(t.admin.questions.optionsRequired, "error");
            return;
        }

        if (questionType === 'true-false') {
            correctAnswer = String(correctAnswer) === 'false' ? 'false' : 'true';
        } else if (questionType === 'multiple-choice') {
            if (typeof correctAnswer !== 'string' || !normalizedOptions?.includes(correctAnswer)) {
                correctAnswer = normalizedOptions?.[0] || '';
            }
        } else if (questionType === 'checkbox' || questionType === 'order') {
            const arr = Array.isArray(correctAnswer) ? correctAnswer : [];
            correctAnswer = normalizedOptions ? arr.filter(item => normalizedOptions.includes(item)) : [];
            if ((correctAnswer as string[]).length === 0) {
                showToast(t.admin.questions.correctAnswerRequired, "error");
                return;
            }
        } else if (questionType === 'text-input') {
            correctAnswer = typeof correctAnswer === 'string' ? correctAnswer.trim() : '';
            if (!correctAnswer) {
                showToast(t.admin.questions.correctAnswerRequired, "error");
                return;
            }
        } else {
            correctAnswer = typeof correctAnswer === 'string' ? correctAnswer.trim() : '';
        }

        const questionToAdd: Question = {
            id: editingQuestionId || generateId(),
            text: newQuestion.text!,
            type: questionType,
            options: normalizedOptions,
            correctAnswer,
            image: newQuestion.image,
            explanation: newQuestion.explanation?.trim() || undefined
        };

        if (editingTargetType === 'story') {
            setStories(stories.map(s => {
                if (s.id === editingTargetId) {
                    const qs = s.questions || [];
                    const newQs = editingQuestionId ? qs.map(q => q.id === editingQuestionId ? questionToAdd : q) : [...qs, questionToAdd];
                    return { ...s, questions: newQs };
                }
                return s;
            }));
        } else {
            setCurriculum(curriculum.map(m => ({
                ...m,
                lessons: m.lessons.map(l => {
                    if (l.id === editingTargetId) {
                        const qs = l.questions || [];
                        const newQs = editingQuestionId ? qs.map(q => q.id === editingQuestionId ? questionToAdd : q) : [...qs, questionToAdd];
                        return { ...l, questions: newQs };
                    }
                    return l;
                })
            })));
        }

        setEditingQuestionId(null);
        setNewQuestion({ type: newQuestion.type, text: '', options: ['', '', '', ''], correctAnswer: '', image: undefined, explanation: '' });
        showToast(t.admin.questions.saveQuestionSuccess, "success");
    };

    const handleEditQuestion = (question: Question) => {
        setEditingQuestionId(question.id);
        setNewQuestion({ ...question });
    };

    const handleDeleteQuestion = (qId: string) => {
        if (editingTargetType === 'story') {
            const updated = stories.map(s => s.id === editingTargetId ? { ...s, questions: s.questions?.filter(q => q.id !== qId) } : s);
            setStories(updated);
            // ✦ Multi-lang: sync for Stories
            saveToLangs('stories', prev => prev.map((s: Story) => s.id === editingTargetId ? { ...s, questions: s.questions?.filter(q => q.id !== qId) } : s));
        } else {
            const updated = curriculum.map(m => ({
                ...m,
                lessons: m.lessons.map(l => l.id === editingTargetId ? { ...l, questions: l.questions?.filter(q => q.id !== qId) } : l)
            }));
            setCurriculum(updated);
            // ✦ Multi-lang: sync for Curriculum
            saveToLangs('curriculum', prev => prev.map((m: Module) => ({
                ...m,
                lessons: m.lessons.map(l => l.id === editingTargetId ? { ...l, questions: l.questions?.filter(q => q.id !== qId) } : l)
            })));
        }
        showToast(t.admin.questions.deleteQuestionSuccess, "info");
    };

    // --- Folder & Card Logic ---
    const handleDeleteSystemCard = (cardId: string) => {
        setCards(cards.filter(c => c.id !== cardId));
        // ✦ Multi-lang: sync
        saveToLangs('cards', prev => prev.filter((c: Card) => c.id !== cardId));
    };

    const handleDeleteFolder = (idsToRemove: string[]) => {
        setFolders(folders.filter(f => !idsToRemove.includes(f.id)));
        setCards(cards.filter(c => !idsToRemove.includes(c.folderId)));
        // ✦ Multi-lang: sync
        saveToLangs('folders', prev => prev.filter((f: Folder) => !idsToRemove.includes(f.id)));
        saveToLangs('cards', prev => prev.filter((c: Card) => !idsToRemove.includes(c.folderId)));
    };

    const handleDeleteCard = (id: string) => {
        setCards(cards.filter(c => c.id !== id));
        // ✦ Multi-lang: sync
        saveToLangs('cards', prev => prev.filter((c: Card) => c.id !== id));
    };

    // --- DICTIONARY MANAGER LOGIC ---
    const handleSaveDictCard = () => {
        if (!dictCard.front || !dictCard.back || !dictCard.folderId) {
            showToast('الرجاء ملء جميع الحقول واختيار مجلد', 'error');
            return;
        }
        if (!dictOfficialAllowedFolderIds.has(dictCard.folderId)) {
            showToast('المجلد المختار غير صالح أو لا يطابق لغة الحفظ — اختر مجلداً رسمياً (رئيسي أو فرعي) من القائمة.', 'error');
            return;
        }

        const cardToSave: Card = {
            id: dictCard.id || generateId(),
            folderId: dictCard.folderId,
            frontText: dictCard.front,
            backText: dictCard.back,
            frontImage: dictCard.image,
            createdAt: Date.now(),
            nextReview: Date.now(),
            interval: 0,
            reviews: 0,
            easeFactor: 2.5,
            status: 'new',
            isSystem: true // Force System flag
        };

        if (dictCard.id) {
            // Edit existing
            setCards(cards.map(c => c.id === dictCard.id ? { ...cardToSave, id: dictCard.id } as Card : c));
            // ✦ Multi-lang: persist to all target languages
            saveToLangs('cards', prev => prev.map((c: Card) => c.id === dictCard.id ? { ...cardToSave, id: dictCard.id } : c));
            const langLabel = adminLang === 'both' ? 'EN + DE' : adminLang.toUpperCase();
            showToast(`تم تعديل كلمة القاموس (${langLabel})`, 'success');
        } else {
            // New
            setCards([...cards, cardToSave]);
            // ✦ Multi-lang: persist to all target languages
            saveToLangs('cards', prev => [...prev, cardToSave]);
            const langLabel = adminLang === 'both' ? 'EN + DE' : adminLang.toUpperCase();
            showToast(`تم إضافة كلمة جديدة للقاموس (${langLabel})`, 'success');
        }
        setShowDictCardForm(false);
        setDictOfficialRootId('');
        setDictCard({ front: '', back: '', folderId: '', image: '' });
    };

    const handleEditDictCard = (card: Card) => {
        const root = resolveOfficialDictRootId(card.folderId, dictOfficialFolders, mergedFolders);
        setDictOfficialRootId(root || dictOfficialFolders[0]?.id || '');
        setDictCard({ id: card.id, front: card.frontText, back: card.backText, folderId: card.folderId, image: card.frontImage || '' });
        setShowDictCardForm(true);
    };

    const systemCards = mergedCards.filter((c: any) => c.isSystem && (dictSearch ? (c.frontText.includes(dictSearch) || c.backText.includes(dictSearch)) : true));

    // --- Render Helpers ---
    // renderQuestionInputs moved to specific components (LessonEditor, StoryFormModal if needed)



    // --- NORMAL DASHBOARD VIEW ---

    return (
        <div className="site-responsive-root admin-responsive-root min-h-screen bg-[#0B0D17]/30 text-gray-100 font-sans selection:bg-red-500/30 selection:text-red-200" dir="rtl">
            <Toast
                message={toastMessage?.text || ""}
                isVisible={!!toastMessage}
                onClose={() => setToastMessage(null)}
                type={toastMessage?.type}
            />

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
                <div className="flex items-center gap-2"><ShieldCheck size={20} className="text-red-500" /><span className="font-bold">لوحة التحكم</span></div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-700 rounded-lg"><Menu size={20} /></button>
            </div>

            {/* Overlay */}
            {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>)}

            {/* Sidebar */}
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                onExit={onExit}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                adminLang={adminLang}
                setAdminLang={setAdminLang}
                notificationsBell={<AdminSupportNotificationBell inbox={adminInbox} onOpenTicket={handleOpenSupportFromInbox} />}
            />

            {/* Main Content */}
            <main className="md:mr-72 p-4 sm:p-5 md:p-6 xl:p-8 2xl:p-10 relative z-10 min-h-screen">
                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <OverviewTab
                            stories={stories}
                            curriculum={curriculum}
                            cards={cards} // Fixed props
                            selectedTheme={selectedTheme}
                            setActiveTab={setActiveTab}
                            setShowStoryForm={setShowStoryForm}
                            langAvailability={langAvailability}
                            setLangAvailability={setLangAvailability}
                        />
                    )}

                    {/* Analytics Dashboard */}
                    {activeTab === 'analytics' && (
                        <AnalyticsTab adminLang={adminLang} />
                    )}

                    {/* Stories Management */}
                    {activeTab === 'stories' && (
                        <StoriesTab
                            stories={storiesForAdminTab as any}
                            onAddNew={() => {
                                setNewStory({ level: 'Beginner', image: '', tags: [] });
                                // Default story language follows adminLang selection
                                setNewStoryLang(adminLang === 'de' ? 'de' : 'en');
                                setShowStoryForm(true);
                            }}
                            onEdit={handleEditStory}
                            onDelete={handleDeleteStory}
                            onManageQuestions={(id) => openQuestionManager(id, 'story')}
                            t={t}
                        />
                    )}

                    {/* Folders Management */}
                    {activeTab === 'folders' && (
                        <FoldersTab
                            folders={foldersForAdminTab as any}
                            cards={cardsForAdminTab as any}
                            showToast={showToast}
                            adminLang={adminLang}
                            learningLang={learningLang}
                            refreshFoldersFromApi={refreshFoldersFromApi}
                        />
                    )}

                    {/* Media Library */}
                    {activeTab === 'media_library' && (
                        <MediaLibraryTab mediaItems={mediaItems} setMediaItems={setMediaItems} />
                    )}

                    {/* Sentences Management */}
                    {activeTab === 'sentences' && (
                        <AdminSentencesView
                            topics={sentenceTopics}
                            setTopics={setSentenceTopics}
                            t={t}
                            adminLang={adminLang}
                            learningLang={learningLang}
                        />
                    )}

                    {/* Games Management */}
                    {activeTab === 'games' && (
                        <AdminGamesView
                            t={t}
                            adminLang={adminLang}
                            learningLang={learningLang}
                        />
                    )}

                    {/* Inspirational Slider Management */}
                    {activeTab === 'inspirational' && (
                        <AdminInspirationalTab
                            slides={inspirationalSlides}
                            setSlides={setInspirationalSlides}
                            showToast={showToast}
                        />
                    )}


                    {/* Dictionary Manager */}
                    {activeTab === 'dictionary_manager' && (
                        <m.div
                            key="dictionary"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-white mb-2">إدارة القاموس والكروت</h2>
                                    <p className="text-gray-400 font-medium">إضافة وتعديل البطاقات الرسمية التي تظهر في المجلدات العامة.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => { const first = dictOfficialFolders[0]?.id || ''; setDictOfficialRootId(first); setDictCard({ front: '', back: '', folderId: first, image: '' }); setShowDictCardForm(true); }} className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-red-900/30 transition-all"><Plus size={22} /> بطاقة جديدة</button>
                                </div>
                            </header>

                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 max-w-2xl">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="بحث بين آلاف البطاقات..."
                                        className="w-full bg-slate-900/50 border border-white/5 p-5 pr-14 rounded-2xl text-white outline-none focus:border-red-500/50 transition-all font-medium"
                                        value={dictSearch}
                                        onChange={e => setDictSearch(e.target.value)}
                                    />
                                    <ImageIcon size={22} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {systemCards.map((card: any) => {
                                    const folderName = [...mergedFolders].find((f: any) => f.id === card.folderId)?.name || 'Unknown';
                                    const langFlag = (card as any)._langFlag;
                                    const langCode = ((card as any)._lang || learningLang).toUpperCase();
                                    return (
                                        <m.div
                                            key={card.id + (card._lang || '')}
                                            layout
                                            className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:border-red-500/20 transition-all group relative"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-white/5 text-gray-400 px-3 py-1.5 rounded-lg border border-white/5 tracking-wider uppercase">{folderName}</span>
                                                    {langFlag && (
                                                        <span title={langCode} className={`text-[10px] font-black px-2 py-1 rounded-lg border ${langCode === 'DE' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' : 'bg-blue-500/15 text-blue-300 border-blue-500/30'}`}>
                                                            {langFlag} {langCode}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleEditDictCard(card)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white border border-white/5"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteSystemCard(card.id)} className="p-2 bg-red-600/10 hover:bg-red-600 text-white rounded-xl transition-colors border border-red-500/20"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                {card.frontImage ? (
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-white/10 shrink-0 relative bg-white/5">
                                                        <img src={card.frontImage} className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-35" alt="" aria-hidden="true" />
                                                        <img src={card.frontImage} className="relative z-[1] w-full h-full object-contain p-1" alt="" />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-white/5">
                                                        <BookOpen size={24} className="text-gray-600" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-xl text-white mb-1 truncate">{card.frontText}</h4>
                                                    <p className="text-gray-500 text-sm font-medium line-clamp-1">{card.backText}</p>
                                                </div>
                                            </div>
                                        </m.div>
                                    );
                                })}
                            </div>
                        </m.div>
                    )}

                    {/* Curriculum Management */}
                    {activeTab === 'curriculum' && (
                        <CurriculumTab
                            curriculum={mergedCurriculum as any}
                            setCurriculum={setCurriculum}
                            learningLang={(learningLang === 'de' ? 'de' : 'en')}
                            adminLang={adminLang}
                        />
                    )}

                    {/* Themes Management */}
                    {activeTab === 'themes' && (
                        <ThemesTab
                            selectedTheme={selectedTheme}
                            setSelectedTheme={setSelectedTheme}
                            themeSchedules={themeSchedules}
                            setThemeSchedules={setThemeSchedules}
                            customThemeConfig={customThemeConfig}
                            setCustomThemeConfig={setCustomThemeConfig}
                            isDarkMode={isDarkMode}
                            toggleTheme={toggleTheme}
                            isAutoTheme={isAutoTheme}
                            setIsAutoTheme={setIsAutoTheme}
                        />
                    )}

                    {/* Payment Settings */}
                    {activeTab === 'payment_settings' && (
                        <PaymentSettingsTab />
                    )}


                    {/* Notifications Center */}
                    {
                        activeTab === 'notifications' && (
                            <NotificationsTab
                                broadcasts={broadcasts}
                                setBroadcasts={setBroadcasts}
                                adminInbox={adminInbox}
                                onOpenSupportTicket={handleOpenSupportFromInbox}
                            />
                        )
                    }

                    {/* Support Tickets */}
                    {
                        activeTab === 'support' && (
                            <SupportTab
                                tickets={tickets}
                                setTickets={setTickets}
                                initialSelectedTicketId={supportFocusTicketId}
                                onConsumedInitialTicket={clearSupportFocus}
                                onOpenUserInUsersTab={handleOpenUserFromSupport}
                            />
                        )
                    }

                    {/* Marketing Management */}
                    {
                        activeTab === 'marketing' && (
                            <MarketingTab
                                coupons={coupons}
                                setCoupons={setCoupons}
                                banners={banners}
                                setBanners={setBanners}
                            />
                        )
                    }

                    {activeTab === 'user_problems' && <AdminUserProblemsTab />}

                    {/* Users Management */}
                    {activeTab === 'users' && (
                        <AdminUsersView
                            focusAppUserId={usersFocusAppUserId}
                            onConsumedFocusAppUser={clearUsersFocus}
                        />
                    )}

                    {/* Admin Accounts Management */}
                    {activeTab === 'admins' && <AdminManagersView />}
                </AnimatePresence >
            </main >

            {/* --- MODALS --- */}
            <AnimatePresence>

                {/* Dictionary Card Form Modal */}
                {
                    showDictCardForm && (
                        <div className="fixed inset-0 bg-[#0B0D17]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
                            <m.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-slate-900 w-full max-w-lg rounded-[3rem] p-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
                            >
                                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5 font-sans">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight">{dictCard.id ? 'تعديل بطاقة رسمية' : 'إضافة بطاقة رسمية'}</h3>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => { setShowDictCardForm(false); setDictOfficialRootId(''); }} className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 group">
                                        <X className="text-gray-400 group-hover:rotate-90 transition-transform" size={22} />
                                    </button>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">المجلد الرسمي (الرئيسي)</label>
                                        <select
                                            className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer"
                                            value={dictOfficialRootId || dictOfficialFolders[0]?.id || ''}
                                            onChange={e => {
                                                const rootId = e.target.value;
                                                setDictOfficialRootId(rootId);
                                                setDictCard(prev => ({ ...prev, folderId: rootId }));
                                            }}
                                        >
                                            <option value="" disabled className="bg-slate-900 text-gray-500">اختر مجلد...</option>
                                            {dictOfficialFolders.map(f => {
                                                const lang = (f as Folder & { _lang?: 'en' | 'de' })._lang;
                                                const langSuffix = adminLang === 'both' && lang ? ` (${lang === 'de' ? 'DE' : 'EN'})` : '';
                                                return (
                                                    <option key={`${f.id}-${lang || ''}`} value={f.id} className="bg-slate-900 text-white font-bold">
                                                        {f.name}{langSuffix}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {dictOfficialSubfolders.length > 0 && (
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">مكان الحفظ داخل المجلد</label>
                                            <select
                                                className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer"
                                                value={dictCard.folderId}
                                                onChange={e => setDictCard(prev => ({ ...prev, folderId: e.target.value }))}
                                            >
                                                <option value={dictOfficialRootId} className="bg-slate-900 text-white font-bold">
                                                    داخل المجلد الرئيسي — {dictOfficialFolders.find(r => r.id === dictOfficialRootId)?.name ?? ''}
                                                </option>
                                                {dictOfficialSubfolders.map(f => {
                                                    const lang = (f as Folder & { _lang?: 'en' | 'de' })._lang;
                                                    const langSuffix = adminLang === 'both' && lang ? ` (${lang === 'de' ? 'DE' : 'EN'})` : '';
                                                    return (
                                                        <option key={`${f.id}-${lang || ''}`} value={f.id} className="bg-slate-900 text-white font-bold">
                                                            {f.name}{langSuffix}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">الوجه الأمامي (الكلمة/السؤال)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                                                value={dictCard.front}
                                                onChange={e => setDictCard({ ...dictCard, front: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">الوجه الخلفي (المعنى/الإجابة)</label>
                                            <textarea
                                                className="w-full bg-slate-900 border border-white/5 p-5 rounded-3xl text-white font-bold outline-none focus:border-red-500/50 transition-all h-32"
                                                value={dictCard.back}
                                                onChange={e => setDictCard({ ...dictCard, back: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <m.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white/5 rounded-3xl border border-white/5 aspect-video relative group overflow-hidden cursor-pointer"
                                        onClick={() => (document.getElementById('dictImageInput') as HTMLInputElement)?.click()}
                                    >
                                        {dictCard.image ? (
                                            <>
                                                <img src={dictCard.image} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35" alt="" aria-hidden="true" />
                                                <img src={dictCard.image} className="relative z-[1] w-full h-full object-contain p-3" alt="" />
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                                                <ImageIcon size={32} className="mb-2" />
                                                <span className="text-xs font-bold">إرفاق صورة اختيارية</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                            <UploadCloud size={24} className="text-white mb-1" />
                                            <span className="text-xs font-black text-white">تغيير الصورة</span>
                                        </div>
                                        <input id="dictImageInput" type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'dictImage')} />
                                    </m.div>

                                    <button onClick={handleSaveDictCard} className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-red-900/30 active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
                                        <Save size={24} />
                                        <span>حفظ البطاقة</span>
                                    </button>
                                </div>
                            </m.div>
                        </div>
                    )
                }

                {/* Question Manager Modal (Reused) */}
                {
                    showQuestionManager && editingTargetId && (
                        <div className="fixed inset-0 bg-[#0B0D17]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
                            <m.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-slate-900 w-full max-w-6xl rounded-[3rem] p-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 h-[85vh] flex flex-col overflow-hidden"
                            >
                                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                                            <HelpCircle size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white tracking-tight">{t.admin.questions.managerTitle}</h3>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{getCurrentTargetTitle()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowQuestionManager(false)} className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 group">
                                        <X className="text-gray-400 group-hover:rotate-90 transition-transform" size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                                    {/* Questions Sidebar */}
                                    <div className="w-full md:w-80 border-l border-white/5 overflow-y-auto p-6 bg-slate-900/50">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 mr-2">{t.admin.questions.listTitle}</h4>
                                        <div className="space-y-3">
                                            {getCurrentQuestions().map((q, i) => (
                                                <m.div
                                                    key={q.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-4 transition-all hover:bg-white/10 group cursor-pointer"
                                                    onClick={() => handleEditQuestion(q)}
                                                >
                                                    <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-gray-400 group-hover:text-red-500 transition-colors">{i + 1}</div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[8px] font-black bg-white/5 text-blue-400 px-2 py-0.5 rounded-md border border-blue-900/20 uppercase tracking-tighter">{q.type}</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-300 truncate">{q.text}</p>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }} className="p-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                                </m.div>
                                            ))}
                                            {getCurrentQuestions().length === 0 && (
                                                <div className="text-center py-10 opacity-30">
                                                    <HelpCircle size={32} className="mx-auto mb-2" />
                                                    <p className="text-xs font-bold uppercase tracking-widest">{t.admin.questions.emptyState}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Main Question Editor Pane */}
                                    <div className="flex-1 p-10 overflow-y-auto bg-slate-900">
                                        <div className="max-w-3xl mx-auto space-y-10">
                                            <QuestionForm
                                                question={newQuestion}
                                                onChange={setNewQuestion}
                                            />

                                            <div className="flex gap-4 pt-6">
                                                <button
                                                    onClick={handleAddOrUpdateQuestion}
                                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-red-900/30 active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
                                                >
                                                    {editingQuestionId ? <Save size={24} /> : <Plus size={24} />}
                                                    <span>{editingQuestionId ? t.admin.questions.updateQuestion : t.admin.questions.addQuestion}</span>
                                                </button>
                                                {editingQuestionId && (
                                                    <button
                                                        onClick={() => { setEditingQuestionId(null); setNewQuestion({ type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' }); }}
                                                        className="px-8 bg-white/5 hover:bg-white/10 text-gray-400 rounded-[2rem] font-bold border border-white/5 transition-all"
                                                    >
                                                        {t.admin.common.cancel}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </m.div>
                        </div>
                    )
                }

                <StoryFormModal
                    isOpen={showStoryForm}
                    onClose={() => setShowStoryForm(false)}
                    story={newStory}
                    setStory={setNewStory}
                    onSave={handleSaveStory}
                    onImageUpload={(e) => handleImageUpload(e, 'storyImage')}
                    isUploadingImage={isUploadingStoryImage}
                    uploadProgress={storyImageUploadProgress}
                    uploadFileName={storyImageUploadFileName}
                    storyLang={newStoryLang}
                    setStoryLang={setNewStoryLang}
                    t={t}
                />
            </AnimatePresence >

        </div >
    );
};
