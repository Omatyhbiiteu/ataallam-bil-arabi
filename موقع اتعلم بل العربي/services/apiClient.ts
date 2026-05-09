/**
 * Backend API Client - الإصدار الشامل
 * 
 * يغطي هذا الملف جميع المسارات الـ 15 المحددة في API_BLUEPRINT.md.
 * يمكن استخدامه لربط الموقع بلوحة التحكم والخوادم الخارجية.
 */

// الرابط الأساسي للـ API (يُفضل وضعه في ملف .env)
const BASE_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

/** مسارات لوحة المسئول تحتاج توكن المسئول فقط — وإلا يُرفض الحفظ (403) إذا وُجد auth_token للمستخدم. */
function getAuthTokenForEndpoint(endpoint: string): string | null {
    if (endpoint.startsWith("/admin")) {
        return localStorage.getItem("hcard_admin_token");
    }
    const userTok =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("hcard_user_token");
    if (endpoint.startsWith("/user/content") || endpoint.startsWith("/user/community")) {
        return userTok;
    }
    return userTok || localStorage.getItem("hcard_admin_token");
}

/** مهلة افتراضية حتى لا يبقى الواجهة معلّقة إلى ما لا نهاية إذا الخادم لا يستجيب */
const DEFAULT_FETCH_TIMEOUT_MS = 60_000;

// دالة الاتصال الأساسية مع إدارة الـ Token
export async function fetchApi(
    endpoint: string,
    options: RequestInit & { timeoutMs?: number } = {}
): Promise<unknown> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
    const { timeoutMs: _omitTimeout, signal: userSignal, ...restInit } = options;

    const token = getAuthTokenForEndpoint(endpoint);

    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(restInit.headers as Record<string, string> | undefined),
    } as Record<string, string>;

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    if (userSignal) {
        if (userSignal.aborted) controller.abort();
        else userSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...restInit,
            headers,
            signal: controller.signal,
        });

        if (!response.ok) {
            let errorData: { message?: string; errors?: Record<string, string[]> } = {};
            try {
                errorData = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
            } catch {
                errorData = { message: `API Error: ${response.status} ${response.statusText}` };
            }
            let msg = errorData.message;
            if (!msg && errorData.errors && typeof errorData.errors === "object") {
                const parts = Object.values(errorData.errors).flat() as string[];
                msg = parts.filter(Boolean).join(" ");
            }
            throw new Error(msg || "حدث خطأ غير معروف");
        }

        // بعض الطلبات قد لا تعيد JSON (مثل حذف بدون محتوى 204)
        if (response.status === 204) return null;

        return await response.json();
    } catch (error: unknown) {
        console.error(`API Error on ${endpoint}:`, error);
        const err = error as { name?: string };
        if (err?.name === "AbortError") {
            throw new Error(
                "انتهت مهلة الاتصال بالخادم. تأكد أن Laravel يعمل وأن VITE_BACKEND_API_URL في ملف .env يشير لعنوان الـ API الصحيح (مثل http://localhost:8000/api)."
            );
        }
        throw error;
    } finally {
        window.clearTimeout(timer);
    }
}

// ----------------------------------------------------
// 1. Authentication (المصادقة)
// ----------------------------------------------------
export const AuthAPI = {
    login: (body: any) => fetchApi("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    register: (body: any) => fetchApi("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    socialRegister: (body: any) => fetchApi("/auth/social-register", { method: "POST", body: JSON.stringify(body) }),
    updateProfile: (body: any) => fetchApi("/auth/profile", { method: "PUT", body: JSON.stringify(body) }),
    loginWithGoogle: (googleToken: string) => fetchApi("/auth/google", { method: "POST", body: JSON.stringify({ googleToken }) }),
    logout: () => fetchApi("/auth/logout", { method: "POST" }).catch(() => { }),
    deleteAccount: () => fetchApi("/auth/account", { method: "DELETE" }),
    getNotifications: () => fetchApi("/auth/notifications"),
    markNotificationsRead: (ids: string[]) =>
        fetchApi("/auth/notifications/read", { method: "PUT", body: JSON.stringify({ ids }) }),
    me: () => fetchApi("/auth/me"),
    adminLogin: (body: any) => fetchApi("/admin/auth/login", { method: "POST", body: JSON.stringify(body) })
};

// ----------------------------------------------------
// Platform Settings (عام)
// ----------------------------------------------------
export const SettingsAPI = {
    /** عام للمستخدمين (بدون توكن) */
    getLanguageAvailability: () => fetchApi("/settings/language-availability"),
};

// ----------------------------------------------------
// 2. User & Progress (المستخدم والتقدم)
// ----------------------------------------------------
export const UserAPI = {
    /** تسجيل محاولة إجابة سؤال قصة (للتحليلات — يتطلب تسجيل دخول) */
    recordStoryQuizAttempt: (body: { storyId: string; questionId: string; correct: boolean; lang: "en" | "de" }) =>
        fetchApi("/user/story-quiz-attempts", { method: "POST", body: JSON.stringify(body) }),
    /** مزامنة إحصاءات المجتمع للغة تعلم محددة (قصص، كويز، سلسلة) — يُحسب XP من البطاقات على السيرفر */
    syncCommunityStats: (
        lang: string,
        body: {
            stories_completed: number;
            quiz_total: number;
            quiz_avg_percent: number;
            streak_days: number;
        }
    ) => fetchApi(`/user/community/${lang}/sync`, { method: "POST", body: JSON.stringify(body) }),
    /** لوحة الشرف — قائمة كاملة لكل متعلمي اللغة (ترتيب بإجمالي XP) */
    getCommunityLeaderboard: (lang: string) => fetchApi(`/user/community/${lang}`),
    getProfile: () => fetchApi("/user/profile"),
    updateProfile: (updates: any) => fetchApi("/user/profile", { method: "PUT", body: JSON.stringify(updates) }),
    getProgress: (lang: string) => fetchApi(`/user/progress?lang=${lang}`),
    submitReview: (body: any) => fetchApi("/user/progress/review", { method: "POST", body: JSON.stringify(body) }),
    getReviewLog: (lang: string) => fetchApi(`/user/review-log?lang=${lang}`),
    getStats: (lang: string) => fetchApi(`/user/stats?lang=${lang}`),
    getStudyPlan: (lang: string) => fetchApi(`/user/study-plan?lang=${lang}`),
    saveStudyPlan: (plan: any) => fetchApi("/user/study-plan", { method: "PUT", body: JSON.stringify(plan) }),
    getNotifications: () => fetchApi("/user/notifications"),
    readAllNotifications: () => fetchApi("/user/notifications/read-all", { method: "PUT" })
};

// ----------------------------------------------------
// 3. Folders & Cards (المجلدات والبطاقات)
// ----------------------------------------------------
export const ContentAPI = {
    // Folders
    getFolders: (lang: string) => fetchApi(`/content/${lang}/folders`),
    createFolder: (lang: string, data: any) => fetchApi(`/content/${lang}/folders`, { method: "POST", body: JSON.stringify(data) }),
    updateFolder: (lang: string, id: string, data: any) => fetchApi(`/content/${lang}/folders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteFolder: (lang: string, id: string) => fetchApi(`/content/${lang}/folders/${id}`, { method: "DELETE" }),

    // Cards
    getCards: (lang: string, folderId?: string) => fetchApi(`/content/${lang}/cards${folderId ? `?folderId=${folderId}` : ''}`),
    createCard: (lang: string, data: any) => fetchApi(`/content/${lang}/cards`, { method: "POST", body: JSON.stringify(data) }),
    updateCard: (lang: string, id: string, data: any) => fetchApi(`/content/${lang}/cards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteCard: (lang: string, id: string) => fetchApi(`/content/${lang}/cards/${id}`, { method: "DELETE" }),
    bulkUpdateCards: (lang: string, data: any) => fetchApi(`/content/${lang}/cards/bulk`, { method: "PUT", body: JSON.stringify(data) }),
    bulkDeleteCards: (lang: string, ids: string[]) => fetchApi(`/content/${lang}/cards/bulk`, { method: "DELETE", body: JSON.stringify({ ids }) }),
};

/** مجلدات وبطاقات المستخدم (يتطلب توكن مستخدم التطبيق) */
export const UserContentAPI = {
    createFolder: (lang: string, body: { name: string; color?: string; parentId?: string | null }) =>
        fetchApi(`/user/content/${lang}/folders`, { method: "POST", body: JSON.stringify(body) }),
    updateFolder: (lang: string, folderId: string, body: { name?: string; color?: string; parentId?: string | null }) =>
        fetchApi(`/user/content/${lang}/folders/${folderId}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteFolder: (lang: string, folderId: string) =>
        fetchApi(`/user/content/${lang}/folders/${folderId}`, { method: "DELETE" }),
    deleteAllMyFolders: (lang: string) =>
        fetchApi(`/user/content/${lang}/folders-all-mine`, { method: "DELETE" }),
    createCard: (
        lang: string,
        body: { folderId: string; frontText: string; backText: string; frontImage?: string | null }
    ) =>
        fetchApi(`/user/content/${lang}/cards`, {
            method: "POST",
            body: JSON.stringify(body),
            timeoutMs: 120_000,
        }),
    updateCard: (lang: string, cardId: string, body: Record<string, unknown>) =>
        fetchApi(`/user/content/${lang}/cards/${cardId}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteCard: (lang: string, cardId: string) =>
        fetchApi(`/user/content/${lang}/cards/${cardId}`, { method: "DELETE" }),
};

// ----------------------------------------------------
// 4. Stories (القصص)
// ----------------------------------------------------
export const StoriesAPI = {
    getAll: (lang: string) => fetchApi(`/content/${lang}/stories`),
    getById: (lang: string, id: string) => fetchApi(`/content/${lang}/stories/${id}`),
};

// ----------------------------------------------------
// 5. Curriculum (المنهج)
// ----------------------------------------------------
export const CurriculumAPI = {
    getAll: (lang: string) => fetchApi(`/content/${lang}/curriculum`),
    getModule: (lang: string, moduleId: string) => fetchApi(`/content/${lang}/curriculum/${moduleId}`),
};

// ----------------------------------------------------
// 6. Sentence Topics (موضوعات الجمل)
// ----------------------------------------------------
export const SentencesAPI = {
    getAll: (lang: string) => fetchApi(`/content/${lang}/sentences`),
};

// ----------------------------------------------------
// 7. AI Services (الذكاء الاصطناعي)
// ----------------------------------------------------
export const AiAPI = {
    chat: (body: any) => fetchApi("/ai/chat", { method: "POST", body: JSON.stringify(body) }),
    analyzeText: (body: any) => fetchApi("/ai/analyze-text", { method: "POST", body: JSON.stringify(body) }),
    getWordDetails: (body: any) => fetchApi("/ai/word-details", { method: "POST", body: JSON.stringify(body) }),
    generateExample: (body: any) => fetchApi("/ai/generate-example", { method: "POST", body: JSON.stringify(body) }),
    generateImage: (body: any) => fetchApi("/ai/generate-image", { method: "POST", body: JSON.stringify(body) }),
};

// ----------------------------------------------------
// 8. Text-to-Speech (TTS - النطق)
// ----------------------------------------------------
export const AudioAPI = {
    generateSpeech: (body: any) => fetchApi("/tts/generate", { method: "POST", body: JSON.stringify(body) }),
};

// ----------------------------------------------------
// 9. Marketing (التسويق)
// ----------------------------------------------------
export const MarketingAPI = {
    getCoupons: () => fetchApi("/marketing/coupons"),
    getBanners: () => fetchApi("/marketing/banners"),
    getBroadcasts: () => fetchApi("/marketing/broadcasts"),
    getInspirational: () => fetchApi("/marketing/inspirational"),
};

// ----------------------------------------------------
// 10. Support Tickets (تذاكر الدعم)
// ----------------------------------------------------
export const SupportAPI = {
    getTickets: () => fetchApi("/support/tickets"),
    createTicket: (data: any) => fetchApi("/support/tickets", { method: "POST", body: JSON.stringify(data) }),
    getTicketDetails: (id: string) => fetchApi(`/support/tickets/${id}`),
    addMessage: (id: string, message: any) => fetchApi(`/support/tickets/${id}/messages`, { method: "POST", body: JSON.stringify(message) }),
};

// ----------------------------------------------------
// 11. Payments (المدفوعات)
// ----------------------------------------------------
export const PaymentsAPI = {
    getSubscription: () => fetchApi("/user/subscription"),
    /** إعدادات الدفع والباقات (عامة، بدون أسرار). */
    getPaymentSettings: () => fetchApi("/payment-settings"),
    createSession: (data: any) => fetchApi("/payments/create-session", { method: "POST", body: JSON.stringify(data) }),
    verifyCoupon: (code: string) => fetchApi("/payments/verify-coupon", { method: "POST", body: JSON.stringify({ code }) }),
};

// ====================================================
// ADMIN SPECIFIC ROUTES (للوحة التحكم فقط)
// ====================================================
export const AdminAPI = {
    // Analytics
    getOverviewStats: () => fetchApi("/admin/analytics/overview"),
    getUsersList: () => fetchApi("/admin/analytics/users"),

    // System Content Management
    createSystemFolder: (lang: string, data: any) => fetchApi(`/admin/content/${lang}/folders`, { method: "POST", body: JSON.stringify(data) }),
    updateSystemFolder: (lang: string, id: string, data: any) => fetchApi(`/admin/content/${lang}/folders/${id}`, { method: "PUT", body: JSON.stringify(data) }),

    createSystemCard: (lang: string, data: any) => fetchApi(`/admin/content/${lang}/cards`, { method: "POST", body: JSON.stringify(data) }),

    createStory: (lang: string, data: any) => fetchApi(`/admin/content/${lang}/stories`, { method: "POST", body: JSON.stringify(data) }),
    updateStory: (lang: string, id: string, data: any) => fetchApi(`/admin/content/${lang}/stories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteStory: (lang: string, id: string) => fetchApi(`/admin/content/${lang}/stories/${id}`, { method: "DELETE" }),

    createCurriculumModule: (lang: string, data: any) => fetchApi(`/admin/content/${lang}/curriculum`, { method: "POST", body: JSON.stringify(data) }),
    updateCurriculumModule: (lang: string, id: string, data: any) => fetchApi(`/admin/content/${lang}/curriculum/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteCurriculumModule: (lang: string, id: string) => fetchApi(`/admin/content/${lang}/curriculum/${id}`, { method: "DELETE" }),

    getSentenceTopics: (lang: string) => fetchApi(`/admin/content/${lang}/sentences`),
    createSentenceTopic: (lang: string, data: any) => fetchApi(`/admin/content/${lang}/sentences`, { method: "POST", body: JSON.stringify(data) }),
    updateSentenceTopic: (lang: string, id: string, data: any) => fetchApi(`/admin/content/${lang}/sentences/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteSentenceTopic: (lang: string, id: string) => fetchApi(`/admin/content/${lang}/sentences/${id}`, { method: "DELETE" }),

    // Marketing Mgmt
    createCoupon: (data: any) => fetchApi("/admin/coupons", { method: "POST", body: JSON.stringify(data) }),
    updateCoupon: (id: string, data: any) => fetchApi(`/admin/coupons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteCoupon: (id: string) => fetchApi(`/admin/coupons/${id}`, { method: "DELETE" }),

    createBanner: (data: any) => fetchApi("/admin/banners", { method: "POST", body: JSON.stringify(data) }),
    updateBanner: (id: string, data: any) => fetchApi(`/admin/banners/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteBanner: (id: string) => fetchApi(`/admin/banners/${id}`, { method: "DELETE" }),

    createBroadcast: (data: any) => fetchApi("/admin/broadcasts", { method: "POST", body: JSON.stringify(data) }),
    updateBroadcast: (id: string, data: any) => fetchApi(`/admin/broadcasts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteBroadcast: (id: string) => fetchApi(`/admin/broadcasts/${id}`, { method: "DELETE" }),

    createInspirational: (data: any) => fetchApi("/admin/inspirational", { method: "POST", body: JSON.stringify(data) }),
    updateInspirational: (id: string, data: any) => fetchApi(`/admin/inspirational/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteInspirational: (id: string) => fetchApi(`/admin/inspirational/${id}`, { method: "DELETE" }),

    // Support Mgmt
    getAllTickets: () => fetchApi("/admin/support/tickets"),
    updateTicketStatus: (id: string, data: { status: 'open' | 'in_progress' | 'resolved' }) =>
        fetchApi(`/admin/support/tickets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    addTicketMessage: (id: string, text: string) =>
        fetchApi(`/admin/support/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ text }) }),

    // Media Library
    getMedia: () => fetchApi("/admin/media"),
    deleteMedia: (id: string) => fetchApi(`/admin/media/${id}`, { method: "DELETE" }),
    uploadMedia: (formData: FormData) => {
        // خاص لأن الـ formData لا تقبل 'application/json' بل تترك المتصفح يضع boundary
        const token = localStorage.getItem("hcard_admin_token");
        return fetch(`${BASE_URL}/admin/media/upload`, {
            method: "POST",
            headers: token ? { "Authorization": `Bearer ${token}` } : {},
            body: formData
        }).then(r => r.json());
    },

    // Themes Setting
    getThemeSchedules: () => fetchApi("/admin/themes/schedules"),
    updateThemeSchedule: (id: string, data: any) => fetchApi(`/admin/themes/schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    getCustomTheme: () => fetchApi("/admin/themes/custom"),
    updateCustomTheme: (data: any) => fetchApi("/admin/themes/custom", { method: "PUT", body: JSON.stringify(data) }),

    // Settings
    getLanguageAvailability: () => fetchApi("/admin/settings/language-availability"),
    updateLanguageAvailability: (data: any) => fetchApi("/admin/settings/language-availability", { method: "PUT", body: JSON.stringify(data) }),
};
