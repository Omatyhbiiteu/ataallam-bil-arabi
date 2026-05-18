/**
 * تحويل روابط الوسائط من الخادم إلى مسارات نسبية تمر عبر Vite Proxy
 * هذا يحل مشاكل CORS عند تحميل الصور والفيديو والصوت من الـ backend
 */
export function resolveMediaUrl(url: string | undefined | null): string {
    if (!url || typeof url !== 'string') return '';
    const t = url.trim();
    if (!t) return '';

    // تحويل الروابط المطلقة للـ backend (localhost:5000) إلى مسارات نسبية
    // عشان تعدي من Vite Proxy بدل ما تروح للبورت بتاع الـ backend مباشرة
    const backendOriginPatterns = [
        /^https?:\/\/127\.0\.0\.1:\d+/i,
        /^https?:\/\/localhost:\d+/i,
        /^https?:\/\/0\.0\.0\.0:\d+/i,
    ];

    let relative = t;
    for (const pattern of backendOriginPatterns) {
        if (pattern.test(relative)) {
            // نشيل الـ origin (http://127.0.0.1:5000) ونسيب المسار فقط (/storage/...)
            relative = relative.replace(pattern, '');
            break;
        }
    }

    // لو المسار بدأ بـ / يبقى جاهز للـ Proxy
    if (relative.startsWith('/')) return relative;

    // لو رابط خارجي حقيقي (youtube, vimeo, S3...) نرجعه كما هو
    if (/^https?:\/\//i.test(relative)) return relative;

    // لو مسار نسبي بدون / في الأول نضيفها
    return `/${relative}`;
}
