/** يحوّل روابط التخزين إلى رابط قابل للعرض في المتصفح.
 *
 * - روابط مطلقة (http/https): تُعاد كما هي.
 * - مسارات نسبية (/storage/...): تُعاد كما هي في التطوير (يتولاها Vite proxy)،
 *   أو تُبنى بـ origin الـ API في الإنتاج.
 */
export function resolveMediaUrl(url: string | undefined | null): string {
    if (!url || typeof url !== 'string') return '';
    const t = url.trim();

    // Already absolute — return as-is (YouTube, external CDN, etc.)
    if (/^https?:\/\//i.test(t)) return t;

    const rawApiUrl = (import.meta.env.VITE_BACKEND_API_URL as string | undefined) || '';

    // If VITE_BACKEND_API_URL is a relative path (e.g. "/api"), we're behind a
    // Vite dev-server proxy — relative storage paths work directly.
    if (!rawApiUrl || rawApiUrl.startsWith('/')) {
        return t.startsWith('/') ? t : `/${t}`;
    }

    // Production: VITE_BACKEND_API_URL is an absolute URL → prepend origin
    const origin = rawApiUrl.replace(/\/api\/?$/i, '').replace(/\/$/, '');
    return t.startsWith('/') ? `${origin}${t}` : `${origin}/${t}`;
}
