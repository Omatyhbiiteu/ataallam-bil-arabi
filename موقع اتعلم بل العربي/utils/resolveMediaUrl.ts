/** يحوّل روابط التخزين النسبية إلى رابط الخادم الكامل (صوت/صورة/فيديو من Laravel storage) */
export function resolveMediaUrl(url: string | undefined | null): string {
    if (!url || typeof url !== 'string') return '';
    const t = url.trim();
    if (/^https?:\/\//i.test(t)) return t;
    const raw = (import.meta.env.VITE_BACKEND_API_URL as string | undefined) || 'http://127.0.0.1:5000/api';
    const origin = raw.replace(/\/api\/?$/i, '') || 'http://127.0.0.1:5000';
    if (t.startsWith('/')) return `${origin}${t}`;
    return `${origin}/${t}`;
}
