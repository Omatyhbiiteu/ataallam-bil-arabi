import { useState, useEffect, useRef, useCallback } from 'react';
import {
    User, Folder, Card, Story, Module, AppNotification,
    Coupon, PromoBanner, BroadcastNotification, SupportTicket, MediaItem, ReviewLog, SentenceTopic,
    InspirationalSlide, DailyMissionState, INITIAL_DAILY_MISSION,
} from '../types';
import { db, migrateLegacyProgressKeys, progressStorageScope } from '../services/db';
import { ContentAPI } from '../services/apiClient';
import {
    INITIAL_FOLDERS_EN, INITIAL_FOLDERS_DE,
    INITIAL_CARDS_EN, INITIAL_CARDS_DE,
    INITIAL_STORIES_EN, INITIAL_STORIES_DE,
    INITIAL_CURRICULUM_EN, INITIAL_CURRICULUM_DE,
    INITIAL_SENTENCE_TOPICS
} from '../data/initialData';
import { normalizeCurriculumModules } from '../utils/curriculumUtils';

function localDateKey(d: Date = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function localDayStartMs(ts: number = Date.now()): number {
    const x = new Date(ts);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
}

export function useAppData(currentUser: User | null, setToast: (toast: { message: string, visible: boolean, type?: 'success' | 'error' | 'info' }) => void) {

    /** لغة المحتوى (إنجليزي/ألماني) — `ar` وغيرها تُعامل كإنجليزي للمنهج والبطاقات والتخزين */
    const learningLang: 'en' | 'de' = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
    const loadedLangRef = useRef(learningLang);
    const lastPersistScopeRef = useRef<string | null>(null);

    // --- SCOPED DATA (Per user + language) ---
    const [folders, setFolders] = useState<Folder[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        const defaultFolders = lang === 'de' ? INITIAL_FOLDERS_DE : INITIAL_FOLDERS_EN;
        return db.load('folders', defaultFolders, sc);
    });

    const [cards, setCards] = useState<Card[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        const defaultCards = lang === 'de' ? INITIAL_CARDS_DE : INITIAL_CARDS_EN;
        return db.load('cards', defaultCards, sc);
    });

    const [stories, setStories] = useState<Story[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        const defaultStories = lang === 'de' ? INITIAL_STORIES_DE : INITIAL_STORIES_EN;
        return db.load('stories', defaultStories, sc);
    });

    const [curriculum, setCurriculum] = useState<Module[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        const defaultCurr = lang === 'de' ? INITIAL_CURRICULUM_DE : INITIAL_CURRICULUM_EN;
        const raw = db.load('curriculum', defaultCurr, sc);
        const normalized = normalizeCurriculumModules(raw);
        return normalized.length > 0 ? normalized : defaultCurr;
    });

    const [quizStats, setQuizStats] = useState<{ totalQuizzes: number, averageScore: number }>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('quiz_stats', { totalQuizzes: 0, averageScore: 0 }, sc);
    });
    const [reviewLog, setReviewLog] = useState<ReviewLog[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('review_log', [], sc);
    });

    const [completedStoryIds, setCompletedStoryIds] = useState<string[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('completed_stories', [], sc);
    });
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('completed_lessons', [], sc);
    });

    const [notifications, setNotifications] = useState<AppNotification[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('notifications', [], sc);
    });

    const [sentenceTopics, setSentenceTopics] = useState<SentenceTopic[]>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('sentence_topics', INITIAL_SENTENCE_TOPICS, sc);
    });

    const [dailyGoal, setDailyGoal] = useState<number>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('daily_goal', 20, sc);
    });

    const [studyPlan, setStudyPlan] = useState<any | null>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('study_plan', null, sc);
    });

    const [dailyMissionState, setDailyMissionState] = useState<DailyMissionState>(() => {
        const lang = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        return db.load('daily_mission', INITIAL_DAILY_MISSION, sc);
    });

    const registerDailyStoryCompleted = useCallback(() => {
        setDailyMissionState((prev) => {
            const today = localDateKey();
            const base =
                prev.date !== today
                    ? { ...INITIAL_DAILY_MISSION, bonusXp: prev.bonusXp, date: today }
                    : prev;
            return { ...base, storiesToday: base.storiesToday + 1 };
        });
    }, []);

    const registerDailyMastered = useCallback(() => {
        setDailyMissionState((prev) => {
            const today = localDateKey();
            const base =
                prev.date !== today
                    ? { ...INITIAL_DAILY_MISSION, bonusXp: prev.bonusXp, date: today }
                    : prev;
            return { ...base, masteriesToday: base.masteriesToday + 1 };
        });
    }, []);

    // --- GLOBAL DATA ---
    const [coupons, setCoupons] = useState<Coupon[]>(() => db.load('coupons', []));
    const [banners, setBanners] = useState<PromoBanner[]>(() => db.load('banners', []));
    const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>(() => db.load('broadcasts', []));
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => db.load('mediaItems', []));
    const [inspirationalSlides, setInspirationalSlides] = useState<InspirationalSlide[]>(() => db.load('inspirational_slides', []));

    // --- PERSISTENCE HELPER ---
    const persistScoped = (key: string, data: any) => {
        const sc = progressStorageScope(currentUser?.id, learningLang);
        if (lastPersistScopeRef.current !== sc) return;

        void db.save(key, data, sc).then((result) => {
            if (!result.success && result.error === 'QUOTA_EXCEEDED') {
                setToast({
                    message: 'تحذير: ذاكرة المتصفح ممتلئة!',
                    visible: true,
                    type: 'error'
                });
            }
        });
    };

    /** مزامنة المجلدات والبطاقات من الخادم (مصدر الحقيقة) — يُحفظ محلياً بنطاق المستخدم الحالي */
    const refreshFoldersAndCardsFromApi = useCallback(async (): Promise<{ folders: Folder[]; cards: Card[] } | null> => {
        if (!currentUser?.id) {
            return null;
        }
        const lang = learningLang;
        const sc = progressStorageScope(currentUser.id, lang);
        try {
            const [fRes, cRes] = await Promise.all([ContentAPI.getFolders(lang), ContentAPI.getCards(lang)]);
            const uid = String(currentUser.id);
            const flRaw = Array.isArray((fRes as any)?.folders) ? ((fRes as any).folders as Folder[]) : [];
            const fl = flRaw.filter((f) => Boolean(f.isSystem) || String(f.userId ?? '') === uid);
            const allowedFolderIds = new Set(fl.map((f) => String(f.id)));
            const clRaw = Array.isArray((cRes as any)?.cards) ? ((cRes as any).cards as Card[]) : [];
            const cl = clRaw.filter((c) => allowedFolderIds.has(String(c.folderId)));
            await db.save('folders', fl, sc);
            await db.save('cards', cl, sc);
            setFolders(fl);
            setCards(cl);
            return { folders: fl as Folder[], cards: cl as Card[] };
        } catch {
            /* تجاهل — يبقى التخزين المحلي */
            return null;
        }
    }, [currentUser?.id, learningLang]);

    const lastFoldersCardsPullRef = useRef(Date.now());

    // أول تحميل + تغيير المستخدم أو لغة التعلم
    useEffect(() => {
        if (!currentUser) {
            return;
        }
        let cancelled = false;
        void (async () => {
            await refreshFoldersAndCardsFromApi();
            if (!cancelled) {
                lastFoldersCardsPullRef.current = Date.now();
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [currentUser?.id, learningLang, refreshFoldersAndCardsFromApi]);

    // استطلاع خفيف أثناء استخدام التطبيق (محتوى جديد من لوحة التحكم في تبويب آخر)
    useEffect(() => {
        if (!currentUser) {
            return;
        }
        const intervalMs = 45_000;
        const id = window.setInterval(() => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            lastFoldersCardsPullRef.current = Date.now();
            void refreshFoldersAndCardsFromApi();
        }, intervalMs);
        return () => window.clearInterval(id);
    }, [currentUser?.id, learningLang, refreshFoldersAndCardsFromApi]);

    // إعادة تحميل التقدّم المحلي عند تغيير المستخدم أو لغة التعلّم في الحساب
    useEffect(() => {
        const lang: 'en' | 'de' = currentUser?.targetLanguage === 'de' ? 'de' : 'en';
        const sc = progressStorageScope(currentUser?.id, lang);
        lastPersistScopeRef.current = null;

        if (currentUser?.id) {
            migrateLegacyProgressKeys(currentUser.id, lang);
        }

        setFolders(db.load('folders', lang === 'de' ? INITIAL_FOLDERS_DE : INITIAL_FOLDERS_EN, sc));
        setCards(db.load('cards', lang === 'de' ? INITIAL_CARDS_DE : INITIAL_CARDS_EN, sc));
        setStories(db.load('stories', lang === 'de' ? INITIAL_STORIES_DE : INITIAL_STORIES_EN, sc));
        {
            const defaultCurr = lang === 'de' ? INITIAL_CURRICULUM_DE : INITIAL_CURRICULUM_EN;
            const raw = db.load('curriculum', defaultCurr, sc);
            const normalized = normalizeCurriculumModules(raw);
            setCurriculum(normalized.length > 0 ? normalized : defaultCurr);
        }
        setSentenceTopics(db.load('sentence_topics', INITIAL_SENTENCE_TOPICS, sc));
        setQuizStats(db.load('quiz_stats', { totalQuizzes: 0, averageScore: 0 }, sc));
        setReviewLog(db.load('review_log', [], sc));
        setCompletedStoryIds(db.load('completed_stories', [], sc));
        setCompletedLessonIds(db.load('completed_lessons', [], sc));
        setNotifications(db.load('notifications', [], sc));
        setDailyGoal(db.load('daily_goal', 20, sc));
        setStudyPlan(db.load('study_plan', null, sc));
        setDailyMissionState(db.load('daily_mission', INITIAL_DAILY_MISSION, sc));

        loadedLangRef.current = lang;
        lastPersistScopeRef.current = sc;
    }, [currentUser?.id, currentUser?.targetLanguage]);

    // مكافآت XP لمهام اليوم (مرة واحدة لكل مهمة يومياً)
    useEffect(() => {
        const today = localDateKey();
        const todayKey = localDayStartMs();
        const todayReviews = reviewLog.find((l) => l.date === todayKey)?.count ?? 0;
        let awarded = 0;
        setDailyMissionState((prev) => {
            if (prev.date !== today) {
                return { ...INITIAL_DAILY_MISSION, bonusXp: prev.bonusXp, date: today };
            }
            let add = 0;
            let cr = prev.claimedReview;
            let cs = prev.claimedStory;
            let cm = prev.claimedMastery;
            if (todayReviews >= 20 && !cr) {
                add += 50;
                cr = true;
            }
            if (prev.storiesToday >= 1 && !cs) {
                add += 30;
                cs = true;
            }
            if (prev.masteriesToday >= 10 && !cm) {
                add += 100;
                cm = true;
            }
            if (add === 0) return prev;
            awarded = add;
            return {
                ...prev,
                bonusXp: prev.bonusXp + add,
                claimedReview: cr,
                claimedStory: cs,
                claimedMastery: cm,
            };
        });
        if (awarded > 0) {
            queueMicrotask(() =>
                setToast({
                    message: `مهام اليوم: +${awarded} XP`,
                    visible: true,
                    type: 'success',
                })
            );
        }
    }, [reviewLog, dailyMissionState.storiesToday, dailyMissionState.masteriesToday, dailyMissionState.date, setToast]);

    // Persist scoped data
    useEffect(() => { persistScoped('cards', cards); }, [cards, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('folders', folders); }, [folders, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('stories', stories); }, [stories, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('curriculum', curriculum); }, [curriculum, learningLang, currentUser?.id]);
    useEffect(() => {
        persistScoped('sentence_topics', sentenceTopics);
    }, [sentenceTopics, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('quiz_stats', quizStats); }, [quizStats, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('review_log', reviewLog); }, [reviewLog, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('completed_stories', completedStoryIds); }, [completedStoryIds, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('completed_lessons', completedLessonIds); }, [completedLessonIds, learningLang, currentUser?.id]);
    useEffect(() => {
        persistScoped('notifications', notifications.filter((n) => !n.id.startsWith('srv_')));
    }, [notifications, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('daily_goal', dailyGoal); }, [dailyGoal, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('study_plan', studyPlan); }, [studyPlan, learningLang, currentUser?.id]);
    useEffect(() => { persistScoped('daily_mission', dailyMissionState); }, [dailyMissionState, learningLang, currentUser?.id]);

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
        refreshFoldersAndCardsFromApi,
        dailyMissionState,
        registerDailyStoryCompleted,
        registerDailyMastered,
    };
}
