/**
 * Backend API Client - الإصدار الشامل
 * 
 * يغطي هذا الملف جميع المسارات الـ 15 المحددة في API_BLUEPRINT.md.
 * يمكن استخدامه لربط الموقع بلوحة التحكم والخوادم الخارجية.
 */

// في التطوير: الافتراضي `/api` يمر عبر proxy في vite.config (نفس المنشأ، بدون CORS). للإنتاج: عيّن VITE_BACKEND_API_URL كاملاً.
const BASE_URL = (
    import.meta.env.VITE_BACKEND_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://127.0.0.1:5000/api")
).replace(/\/$/, "");

/** مسارات لوحة المسئول تحتاج توكن المسئول فقط — وإلا يُرفض الحفظ (403) إذا وُجد auth_token للمستخدم. */
function getAuthTokenForEndpoint(endpoint: string): string | null {
    if (endpoint.startsWith("/admin")) {
        return localStorage.getItem("hcard_admin_token");
    }
    return localStorage.getItem("auth_token") || localStorage.getItem("hcard_admin_token");
}

// دالة الاتصال الأساسية مع إدارة الـ Token
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const token = getAuthTokenForEndpoint(endpoint);

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    } as Record<string, string>;

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorData: any;
            try {
                errorData = await response.json();
            } catch {
                errorData = { message: `API Error: ${response.status} ${response.statusText}` };
            }

            const baseMsg =
                (typeof errorData?.message === 'string' && errorData.message.trim())
                    ? errorData.message.trim()
                    : `API Error: ${response.status} ${response.statusText}`;

            // Laravel validation: { message, errors: { field: [msg] } }
            const firstValidation =
                errorData?.errors && typeof errorData.errors === 'object'
                    ? Object.values(errorData.errors)?.flat?.()?.[0]
                    : null;

            const msg =
                typeof firstValidation === 'string' && firstValidation.trim()
                    ? `${baseMsg} — ${firstValidation.trim()}`
                    : `${baseMsg} (HTTP ${response.status})`;

            throw new Error(msg);
        }

        // بعض الطلبات قد لا تعيد JSON (مثل حذف بدون محتوى 204)
        if (response.status === 204) return null;

        return await response.json();
    } catch (error: any) {
        console.error(`API Error on ${endpoint}:`, error);
        const msg = typeof error?.message === "string" ? error.message : "";
        if (
            msg === "Failed to fetch" ||
            error?.name === "TypeError" ||
            /network|fetch/i.test(msg)
        ) {
            throw new Error(
                "تعذر الاتصال بالخادم. شغّل Laravel (مثلاً: php artisan serve --host=127.0.0.1 --port=5000)، وأعد تشغيل npm run dev بعد تعديل .env. في التطوير يُفضّل VITE_BACKEND_API_URL=/api مع الـ proxy؛ إن استخدمت رابطاً كاملاً فتأكد أنه يطابق المنفذ وأن CORS يسمح بنطاق لوحة التحكم."
            );
        }
        throw error;
    }
}

// ----------------------------------------------------
// 1. Authentication (المصادقة)
// ----------------------------------------------------
export const AuthAPI = {
    login: (body: any) => fetchApi("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    register: (body: any) => fetchApi("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    loginWithGoogle: (googleToken: string) => fetchApi("/auth/google", { method: "POST", body: JSON.stringify({ googleToken }) }),
    logout: () => fetchApi("/auth/logout", { method: "POST" }).catch(() => { }),
    adminLogin: (body: any) => fetchApi("/admin/auth/login", { method: "POST", body: JSON.stringify(body) }),
    adminLogout: () => fetchApi("/admin/auth/logout", { method: "POST" }).catch(() => { })
};

// ----------------------------------------------------
// 2. User & Progress (المستخدم والتقدم)
// ----------------------------------------------------
export const UserAPI = {
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
    createSession: (data: any) => fetchApi("/payments/create-session", { method: "POST", body: JSON.stringify(data) }),
    verifyCoupon: (code: string) => fetchApi("/payments/verify-coupon", { method: "POST", body: JSON.stringify({ code }) }),
};

// ====================================================
// ADMIN SPECIFIC ROUTES (للوحة التحكم فقط)
// ====================================================
export const AdminAPI = {
    // Admin Accounts Management
    getAdminUsers: () => fetchApi("/admin/admin-users"),
    createAdminUser: (data: any) => fetchApi("/admin/admin-users", { method: "POST", body: JSON.stringify(data) }),
    updateMyPassword: (data: { current_password: string; new_password: string }) =>
        fetchApi("/admin/admin-users/me/password", { method: "PUT", body: JSON.stringify(data) }),
    resetAdminPassword: (id: string, data: { new_password: string }) =>
        fetchApi(`/admin/admin-users/${id}/password`, { method: "PUT", body: JSON.stringify(data) }),
    deleteAdminUser: (id: string) => fetchApi(`/admin/admin-users/${id}`, { method: "DELETE" }),

    /** تحليلات لوحة المسئول — يمرّر lang=en|de|both ليتوافق مع فلتر المحتوى في الأدمن */
    getAnalyticsDashboard: (lang?: "en" | "de" | "both") =>
        fetchApi(
            `/admin/analytics/dashboard${lang != null && lang !== "" ? `?lang=${encodeURIComponent(lang)}` : ""}`
        ),
    /** طلبات «نسيت كلمة المرور» المرسلة من التطبيق */
    getPasswordRecoveryRequests: () => fetchApi("/admin/password-recovery-requests"),

    getUsersList: () => fetchApi("/admin/users"),
    updateUserPlan: (id: string, plan: 'free' | 'silver' | 'pro' | 'enterprise') =>
        fetchApi(`/admin/users/${id}/plan`, { method: "PUT", body: JSON.stringify({ plan }) }),
    toggleUserFreeze: (id: string) =>
        fetchApi(`/admin/users/${id}/toggle-freeze`, { method: "PUT" }),
    updateUserPassword: (id: string, newPassword: string) =>
        fetchApi(`/admin/users/${id}/password`, { method: "PUT", body: JSON.stringify({ new_password: newPassword }) }),

    // System Content Management — المجلدات والبطاقات
    getFolders: (lang: string) => fetchApi(`/admin/content/${lang}/folders`),
    getCards: (lang: string, folderId?: string) =>
        fetchApi(`/admin/content/${lang}/cards${folderId ? `?folderId=${encodeURIComponent(folderId)}` : ""}`),
    createSystemFolder: (lang: string, data: any) => fetchApi(`/admin/content/${lang}/folders`, { method: "POST", body: JSON.stringify(data) }),
    updateSystemFolder: (lang: string, id: string, data: any) =>
        fetchApi(`/admin/content/${lang}/folders/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteSystemFolder: (lang: string, id: string) =>
        fetchApi(`/admin/content/${lang}/folders/${encodeURIComponent(id)}`, { method: "DELETE" }),

    createSystemCard: (lang: string, data: any) => fetchApi(`/admin/content/${lang}/cards`, { method: "POST", body: JSON.stringify(data) }),
    updateSystemCard: (lang: string, id: string, data: any) =>
        fetchApi(`/admin/content/${lang}/cards/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteSystemCard: (lang: string, id: string) =>
        fetchApi(`/admin/content/${lang}/cards/${encodeURIComponent(id)}`, { method: "DELETE" }),

    createStory: (lang: string, data: any) => fetchApi(`/admin/content/${lang}/stories`, { method: "POST", body: JSON.stringify(data) }),
    getStories: (lang: string) => fetchApi(`/admin/content/${lang}/stories`),
    updateStory: (lang: string, id: string, data: any) => fetchApi(`/admin/content/${lang}/stories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteStory: (lang: string, id: string) => fetchApi(`/admin/content/${lang}/stories/${id}`, { method: "DELETE" }),

    getCurriculum: (lang: string) => fetchApi(`/admin/content/${lang}/curriculum`),
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

    // Broadcasts (إشعارات للمستخدمين)
    getAllBroadcasts: () => fetchApi("/admin/broadcasts"),
    
    createBroadcast: (data: any) => fetchApi("/admin/broadcasts", { method: "POST", body: JSON.stringify(data) }),
    updateBroadcast: (id: string, data: any) => fetchApi(`/admin/broadcasts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteBroadcast: (id: string, opts?: { scope?: 'all' | 'admin_only' }) => {
        const scope = opts?.scope ?? 'all';
        const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
        return fetchApi(`/admin/broadcasts/${id}${qs}`, { method: "DELETE" });
    },

    createInspirational: (data: any) => fetchApi("/admin/inspirational", { method: "POST", body: JSON.stringify(data) }),
    getInspirational: () => fetchApi("/admin/inspirational"),
    updateInspirational: (id: string, data: any) => fetchApi(`/admin/inspirational/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteInspirational: (id: string) => fetchApi(`/admin/inspirational/${id}`, { method: "DELETE" }),

    // In-app notifications (support: new ticket / user message)
    getNotifications: () => fetchApi("/admin/notifications"),
    markNotificationsRead: (ids: string[]) =>
        fetchApi("/admin/notifications/read", { method: "PUT", body: JSON.stringify({ ids }) }),
    markAllNotificationsRead: () => fetchApi("/admin/notifications/read-all", { method: "PUT" }),

    // Support Mgmt
    getAllTickets: () => fetchApi("/admin/support/tickets"),
    updateTicketStatus: (id: string, data: { status: 'open' | 'in_progress' | 'resolved' }) =>
        fetchApi(`/admin/support/tickets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    addTicketMessage: (id: string, text: string) =>
        fetchApi(`/admin/support/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ text }) }),

    // Media Library
    getMedia: () => fetchApi("/admin/media"),
    deleteMedia: (id: string) => fetchApi(`/admin/media/${id}`, { method: "DELETE" }),
    /** رفع ملف وسائط (multipart) — يُخزَّن على الخادم ويُعاد الرابط فقط */
    uploadMedia: async (formData: FormData): Promise<{ url: string; path?: string }> => {
        const token = localStorage.getItem("hcard_admin_token");
        const response = await fetch(`${BASE_URL}/admin/media/upload`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        let data: any = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }
        if (!response.ok) {
            const msg =
                (typeof data?.message === "string" && data.message.trim()) ||
                (data?.errors && JSON.stringify(data.errors)) ||
                `HTTP ${response.status}`;
            throw new Error(msg);
        }
        if (typeof data?.url !== "string" || !data.url) {
            throw new Error("استجابة غير متوقعة من الخادم (لا يوجد رابط)");
        }
        return data;
    },

    // Themes Setting
    getThemeSchedules: () => fetchApi("/admin/themes/schedules"),
    updateThemeSchedule: (id: string, data: any) => fetchApi(`/admin/themes/schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    getCustomTheme: () => fetchApi("/admin/themes/custom"),
    updateCustomTheme: (data: any) => fetchApi("/admin/themes/custom", { method: "PUT", body: JSON.stringify(data) }),

    // Settings
    getLanguageAvailability: () => fetchApi("/admin/settings/language-availability"),
    updateLanguageAvailability: (data: any) => fetchApi("/admin/settings/language-availability", { method: "PUT", body: JSON.stringify(data) }),

    getPaymentSettings: () => fetchApi("/admin/payment-settings"),
    updatePaymentSettings: (settings: unknown) =>
        fetchApi("/admin/payment-settings", { method: "PUT", body: JSON.stringify({ settings }) }),
};

// Settings (Public) — قد نحتاجها داخل لوحة التحكم للعرض السريع/التأكد
export const SettingsAPI = {
    getLanguageAvailability: () => fetchApi("/settings/language-availability"),
};
