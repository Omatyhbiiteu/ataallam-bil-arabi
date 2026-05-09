import { useState, useEffect, useRef, useCallback } from 'react';
import {
    User, Folder, Card, Story, Module, AppNotification,
    Coupon, PromoBanner, BroadcastNotification, SupportTicket, MediaItem, ReviewLog, SentenceTopic,
    InspirationalSlide
} from '../types';
import { db } from '../services/db';
import { AdminAPI, MarketingAPI } from '../services/apiClient';
import {
    INITIAL_FOLDERS_EN, INITIAL_FOLDERS_DE,
    INITIAL_CARDS_EN, INITIAL_CARDS_DE,
    INITIAL_STORIES_EN, INITIAL_STORIES_DE,
    INITIAL_CURRICULUM_EN, INITIAL_CURRICULUM_DE,
    INITIAL_SENTENCE_TOPICS
} from '../data/initialData';

export function useAppData(currentUser: User | null, setToast: (toast: { message: string, visible: boolean, type?: 'success' | 'error' | 'info' }) => void) {

    const learningLang = currentUser?.targetLanguage || 'en';
    const loadedLangRef = useRef(learningLang);

    // --- SCOPED DATA (Per Language) ---
    const [folders, setFolders] = useState<Folder[]>(() => {
        const defaultFolders = learningLang === 'de' ? INITIAL_FOLDERS_DE : INITIAL_FOLDERS_EN;
        return db.load('folders', defaultFolders, learningLang);
    });

    const [cards, setCards] = useState<Card[]>(() => {
        const defaultCards = learningLang === 'de' ? INITIAL_CARDS_DE : INITIAL_CARDS_EN;
        return db.load('cards', defaultCards, learningLang);
    });

    const [stories, setStories] = useState<Story[]>(() => {
        const defaultStories = learningLang === 'de' ? INITIAL_STORIES_DE : INITIAL_STORIES_EN;
        return db.load('stories', defaultStories, learningLang);
    });

    const [curriculum, setCurriculum] = useState<Module[]>(() => {
        const defaultCurr = learningLang === 'de' ? INITIAL_CURRICULUM_DE : INITIAL_CURRICULUM_EN;
        return db.load('curriculum', defaultCurr, learningLang);
    });

    const [quizStats, setQuizStats] = useState<{ totalQuizzes: number, averageScore: number }>(() =>
        db.load('quiz_stats', { totalQuizzes: 0, averageScore: 0 }, learningLang)
    );
    const [reviewLog, setReviewLog] = useState<ReviewLog[]>(() => db.load('review_log', [], learningLang));

    const [completedStoryIds, setCompletedStoryIds] = useState<string[]>(() => db.load('completed_stories', [], learningLang));
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => db.load('completed_lessons', [], learningLang));

    const [notifications, setNotifications] = useState<AppNotification[]>(() => {
        return db.load('notifications', [], learningLang);
    });

    const [sentenceTopics, setSentenceTopics] = useState<SentenceTopic[]>(() => {
        return db.load('sentence_topics', INITIAL_SENTENCE_TOPICS, learningLang);
    });

    const [dailyGoal, setDailyGoal] = useState<number>(() => {
        return db.load('daily_goal', 20, learningLang);
    });

    const [studyPlan, setStudyPlan] = useState<any | null>(() => {
        return db.load('study_plan', null, learningLang);
    });

    // --- GLOBAL DATA ---
    const [coupons, setCoupons] = useState<Coupon[]>(() => db.load('coupons', []));
    const [banners, setBanners] = useState<PromoBanner[]>(() => db.load('banners', []));
    const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>(() => db.load('broadcasts', []));
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => db.load('mediaItems', []));
    const [inspirationalSlides, setInspirationalSlides] = useState<InspirationalSlide[]>(() => db.load('inspirational_slides', []));

    // --- PERSISTENCE HELPER ---
    const persistScoped = (key: string, data: any) => {
        if (loadedLangRef.current !== learningLang) return;

        void db.save(key, data, learningLang).then((result) => {
            if (!result.success && result.error === 'QUOTA_EXCEEDED') {
                setToast({
                    message: 'تحذير: ذاكرة المتصفح ممتلئة!',
                    visible: true,
                    type: 'error'
                });
            }
        });
    };

    // --- EFFECTS ---

    useEffect(() => {
        let cancelled = false;
        const token = localStorage.getItem('hcard_admin_token');
        if (!token) {
            return;
        }
        AdminAPI.getAllTickets()
            .then((res: { tickets?: SupportTicket[] }) => {
                if (!cancelled && res?.tickets) {
                    setTickets(res.tickets);
                }
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, []);

    // Load stories from backend for both languages (admin only)
    useEffect(() => {
        let cancelled = false;
        const token = localStorage.getItem('hcard_admin_token');
        if (!token) return;

        void (async () => {
            try {
                const [enRes, deRes] = await Promise.all([AdminAPI.getStories('en'), AdminAPI.getStories('de')]);
                if (cancelled) return;

                const enStories = Array.isArray((enRes as any)?.stories) ? (enRes as any).stories : [];
                const deStories = Array.isArray((deRes as any)?.stories) ? (deRes as any).stories : [];

                // persist both for merged admin view
                await db.save('stories', enStories, 'en');
                await db.save('stories', deStories, 'de');

                // update current learningLang state
                if (learningLang === 'de') setStories(deStories);
                else setStories(enStories);
            } catch {
                // تجاهل أخطاء الشبكة
            }
        })();

        return () => { cancelled = true; };
    }, [learningLang]);

    // Load curriculum from backend for both languages (admin only)
    useEffect(() => {
        let cancelled = false;
        const token = localStorage.getItem('hcard_admin_token');
        if (!token) return;

        void (async () => {
            try {
                const [enRes, deRes] = await Promise.all([AdminAPI.getCurriculum('en'), AdminAPI.getCurriculum('de')]);
                if (cancelled) return;

                const enModules = Array.isArray((enRes as any)?.modules) ? (enRes as any).modules : [];
                const deModules = Array.isArray((deRes as any)?.modules) ? (deRes as any).modules : [];

                await db.save('curriculum', enModules, 'en');
                await db.save('curriculum', deModules, 'de');

                if (learningLang === 'de') setCurriculum(deModules);
                else setCurriculum(enModules);
            } catch {
                // تجاهل أخطاء الشبكة
            }
        })();

        return () => { cancelled = true; };
    }, [learningLang]);

    // Load sentence topics from backend for both languages (admin)
    useEffect(() => {
        let cancelled = false;
        const token = localStorage.getItem('hcard_admin_token');
        if (!token) return;

        void (async () => {
            try {
                const [enRes, deRes] = await Promise.all([
                    AdminAPI.getSentenceTopics('en'),
                    AdminAPI.getSentenceTopics('de'),
                ]);
                if (cancelled) return;

                const enTopics = Array.isArray((enRes as any)?.topics) ? (enRes as any).topics : [];
                const deTopics = Array.isArray((deRes as any)?.topics) ? (deRes as any).topics : [];

                await db.save('sentence_topics', enTopics, 'en');
                await db.save('sentence_topics', deTopics, 'de');

                if (learningLang === 'de') setSentenceTopics(deTopics);
                else setSentenceTopics(enTopics);
            } catch {
                // تجاهل أخطاء الشبكة
            }
        })();

        return () => { cancelled = true; };
    }, [learningLang]);

    const refreshFoldersFromApi = useCallback(async () => {
        const token = localStorage.getItem('hcard_admin_token');
        if (!token) {
            return;
        }
        try {
            const [enFR, deFR, enCR, deCR] = await Promise.all([
                AdminAPI.getFolders('en'),
                AdminAPI.getFolders('de'),
                AdminAPI.getCards('en'),
                AdminAPI.getCards('de'),
            ]);
            const enF = Array.isArray((enFR as any)?.folders) ? (enFR as any).folders : [];
            const deF = Array.isArray((deFR as any)?.folders) ? (deFR as any).folders : [];
            const enC = Array.isArray((enCR as any)?.cards) ? (enCR as any).cards : [];
            const deC = Array.isArray((deCR as any)?.cards) ? (deCR as any).cards : [];
            await db.save('folders', enF, 'en');
            await db.save('folders', deF, 'de');
            await db.save('cards', enC, 'en');
            await db.save('cards', deC, 'de');
            if (learningLang === 'de') {
                setFolders(deF);
                setCards(deC);
            } else {
                setFolders(enF);
                setCards(enC);
            }
        } catch {
            /* تجاهل */
        }
    }, [learningLang]);

    useEffect(() => {
        const token = localStorage.getItem('hcard_admin_token');
        if (!token) {
            return;
        }
        void refreshFoldersFromApi();
    }, [learningLang, refreshFoldersFromApi]);

    // Marketing data (coupons/banners) from backend
    // ملاحظة: لوحة التحكم الخارجية بتستدعي useAppData بـ currentUser=null دائماً،
    // لذلك لازم نجلب من الـ backend بمجرد تحميل الـ hook (مش شرط تسجيل دخول المستخدم).
    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const [cRes, bRes] = await Promise.all([
                    MarketingAPI.getCoupons(),
                    MarketingAPI.getBanners(),
                ]);

                if (cancelled) return;

                if (Array.isArray((cRes as any)?.coupons)) setCoupons((cRes as any).coupons);
                if (Array.isArray((bRes as any)?.banners)) setBanners((bRes as any).banners);
            } catch {
                // تجاهل أخطاء الشبكة
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // Inspirational slides from backend (public list is enough for preview + base state)
    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const res = await MarketingAPI.getInspirational();
                if (cancelled) return;
                if (Array.isArray((res as any)?.slides)) setInspirationalSlides((res as any).slides);
            } catch {
                // تجاهل أخطاء الشبكة
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Reload data when language changes
    useEffect(() => {
        if (currentUser && currentUser.targetLanguage) {
            const lang = currentUser.targetLanguage;
            setFolders(db.load('folders', lang === 'de' ? INITIAL_FOLDERS_DE : INITIAL_FOLDERS_EN, lang));
            setCards(db.load('cards', lang === 'de' ? INITIAL_CARDS_DE : INITIAL_CARDS_EN, lang));
            setStories(db.load('stories', lang === 'de' ? INITIAL_STORIES_DE : INITIAL_STORIES_EN, lang));
            setCurriculum(db.load('curriculum', lang === 'de' ? INITIAL_CURRICULUM_DE : INITIAL_CURRICULUM_EN, lang));
            setSentenceTopics(db.load('sentence_topics', INITIAL_SENTENCE_TOPICS, lang));
            setQuizStats(db.load('quiz_stats', { totalQuizzes: 0, averageScore: 0 }, lang));
            setReviewLog(db.load('review_log', [], lang));
            setCompletedStoryIds(db.load('completed_stories', [], lang));
            setCompletedLessonIds(db.load('completed_lessons', [], lang));
            setNotifications(db.load('notifications', [], lang));
            setDailyGoal(db.load('daily_goal', 20, lang));
            setStudyPlan(db.load('study_plan', null, lang));

            loadedLangRef.current = lang;
        }
    }, [currentUser?.targetLanguage]);

    // Persist scoped data
    useEffect(() => { persistScoped('cards', cards); }, [cards, learningLang]);
    useEffect(() => { persistScoped('folders', folders); }, [folders, learningLang]);
    useEffect(() => { persistScoped('stories', stories); }, [stories, learningLang]);
    useEffect(() => { persistScoped('curriculum', curriculum); }, [curriculum, learningLang]);
    useEffect(() => {
        console.log('[useAppData] Saving sentenceTopics:', sentenceTopics);
        persistScoped('sentence_topics', sentenceTopics);
    }, [sentenceTopics, learningLang]);
    useEffect(() => { persistScoped('quiz_stats', quizStats); }, [quizStats, learningLang]);
    useEffect(() => { persistScoped('review_log', reviewLog); }, [reviewLog, learningLang]);
    useEffect(() => { persistScoped('completed_stories', completedStoryIds); }, [completedStoryIds, learningLang]);
    useEffect(() => { persistScoped('completed_lessons', completedLessonIds); }, [completedLessonIds, learningLang]);
    useEffect(() => { persistScoped('notifications', notifications); }, [notifications, learningLang]);
    useEffect(() => { persistScoped('daily_goal', dailyGoal); }, [dailyGoal, learningLang]);
    useEffect(() => { persistScoped('study_plan', studyPlan); }, [studyPlan, learningLang]);

    // Persist global data
    useEffect(() => { db.save('coupons', coupons); }, [coupons]);
    useEffect(() => { db.save('banners', banners); }, [banners]);
    useEffect(() => { db.save('broadcasts', broadcasts); }, [broadcasts]);
    useEffect(() => { db.save('mediaItems', mediaItems); }, [mediaItems]);
    useEffect(() => { db.save('inspirational_slides', inspirationalSlides); }, [inspirationalSlides]);

    return {
        learningLang, loadedLangRef,
        folders, setFolders,
        cards, setCards,
        stories, setStories,
        curriculum, setCurriculum,
        sentenceTopics, setSentenceTopics,
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
        inspirationalSlides, setInspirationalSlides,
        refreshFoldersFromApi,
    };
}
