import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Loader2, Plus, Power, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { AdminAPI } from '../../services/apiClient';
import { CardImageAsset } from '../../types';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { AdminLang } from './AdminSidebar';

interface CardImageLibraryPanelProps {
    adminLang: AdminLang;
    learningLang: 'en' | 'de';
    showToast: (msg: string, type: 'error' | 'success' | 'info') => void;
}

const emptyForm = {
    arLabel: '',
    targetWord: '',
    keywords: '',
};

export const CardImageLibraryPanel: React.FC<CardImageLibraryPanelProps> = ({ adminLang, learningLang, showToast }) => {
    const defaultLang = adminLang === 'de' ? 'de' : adminLang === 'en' ? 'en' : learningLang;
    const [assetLang, setAssetLang] = useState<'en' | 'de'>(defaultLang);
    const [assets, setAssets] = useState<CardImageAsset[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (adminLang === 'en' || adminLang === 'de') {
            setAssetLang(adminLang);
        }
    }, [adminLang]);

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl('');
            return;
        }
        const next = URL.createObjectURL(imageFile);
        setPreviewUrl(next);
        return () => URL.revokeObjectURL(next);
    }, [imageFile]);

    const activeCount = useMemo(() => assets.filter((asset) => asset.isActive !== false).length, [assets]);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const res = (await AdminAPI.getCardImageAssets(assetLang)) as { assets?: CardImageAsset[] };
            setAssets(Array.isArray(res?.assets) ? res.assets : []);
        } catch (error: any) {
            showToast(error?.message || 'تعذر تحميل مكتبة صور البطاقات', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!expanded) return;
        void loadAssets();
    }, [assetLang, expanded]);

    const resetForm = () => {
        setForm(emptyForm);
        setImageFile(null);
    };

    const handleSubmit = async () => {
        if (!form.arLabel.trim() || !form.targetWord.trim()) {
            showToast('اكتب الكلمة العربية وكلمة اللغة المستهدفة للصورة', 'error');
            return;
        }
        if (!imageFile) {
            showToast('اختار صورة من جهازك أولا', 'error');
            return;
        }

        const fd = new FormData();
        fd.append('lang', assetLang);
        fd.append('arLabel', form.arLabel.trim());
        fd.append('targetWord', form.targetWord.trim());
        fd.append('keywords', form.keywords.trim());
        fd.append('isActive', '1');
        fd.append('file', imageFile);

        setSaving(true);
        try {
            await AdminAPI.createCardImageAsset(fd);
            resetForm();
            await loadAssets();
            showToast('تمت إضافة الصورة لمكتبة البطاقات', 'success');
        } catch (error: any) {
            showToast(error?.message || 'فشل حفظ الصورة', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleAsset = async (asset: CardImageAsset) => {
        try {
            await AdminAPI.updateCardImageAsset(asset.id, { isActive: asset.isActive === false });
            await loadAssets();
        } catch (error: any) {
            showToast(error?.message || 'تعذر تغيير حالة الصورة', 'error');
        }
    };

    const deleteAsset = async (asset: CardImageAsset) => {
        if (!window.confirm(`حذف صورة "${asset.arLabel}" من المكتبة؟`)) return;
        try {
            await AdminAPI.deleteCardImageAsset(asset.id);
            await loadAssets();
            showToast('تم حذف الصورة من المكتبة', 'info');
        } catch (error: any) {
            showToast(error?.message || 'تعذر حذف الصورة', 'error');
        }
    };

    return (
        <section className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-right hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-lg">مكتبة صور البطاقات</h3>
                        <p className="text-gray-500 text-xs font-bold mt-1">
                            اربط صورة بكلمة عربية ومعناها في الإنجليزية أو الألمانية لاستخدامها داخل بطاقات المستخدمين.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-gray-400">
                    <span className="px-3 py-1.5 rounded-full bg-white/5">{assetLang.toUpperCase()}</span>
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300">{activeCount} مفعلة</span>
                    <span className="px-3 py-1.5 rounded-full bg-white/5">{expanded ? 'إخفاء' : 'إدارة'}</span>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-white/10 p-5 md:p-6 space-y-6">
                    <div className="flex flex-wrap gap-3">
                        {(['en', 'de'] as const).map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setAssetLang(lang)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition ${assetLang === lang ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                {lang === 'en' ? 'إنجليزي' : 'ألماني'}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => void loadAssets()}
                            disabled={loading}
                            className="mr-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition disabled:opacity-50 text-xs font-black"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            تحديث
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
                        <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-5 space-y-4">
                            <div>
                                <label className="block text-[10px] text-gray-500 font-black mb-2">الكلمة بالعربي</label>
                                <input
                                    value={form.arLabel}
                                    onChange={(e) => setForm((p) => ({ ...p, arLabel: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-400"
                                    placeholder="مثال: تفاحة"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 font-black mb-2">
                                    {assetLang === 'en' ? 'المعنى بالإنجليزي' : 'المعنى بالألماني'}
                                </label>
                                <input
                                    value={form.targetWord}
                                    onChange={(e) => setForm((p) => ({ ...p, targetWord: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-400"
                                    placeholder={assetLang === 'en' ? 'apple' : 'der Apfel'}
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 font-black mb-2">كلمات بحث إضافية</label>
                                <textarea
                                    value={form.keywords}
                                    onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-400 resize-none h-20"
                                    placeholder="تفاحه، apples، fruit"
                                />
                            </div>
                            <label className="block cursor-pointer">
                                <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center overflow-hidden relative hover:border-emerald-400/50 transition">
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" alt="" />
                                            <img src={previewUrl} className="relative z-[1] w-full h-full object-contain p-3" alt="preview" />
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <UploadCloud size={30} className="mx-auto mb-2" />
                                            <p className="text-xs font-black">اختار صورة</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                                    className="hidden"
                                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => void handleSubmit()}
                                disabled={saving}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-black transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                إضافة للمكتبة
                            </button>
                        </div>

                        <div className="min-h-[240px]">
                            {loading ? (
                                <div className="h-full min-h-[240px] flex items-center justify-center text-gray-500">
                                    <Loader2 size={28} className="animate-spin" />
                                </div>
                            ) : assets.length === 0 ? (
                                <div className="h-full min-h-[240px] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600">
                                    <ImageIcon size={34} className="mb-2" />
                                    <p className="text-sm font-black">لا توجد صور لهذه اللغة بعد</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {assets.map((asset) => (
                                        <article key={asset.id} className="bg-slate-950/50 border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="relative aspect-video bg-white/5">
                                                <img src={resolveMediaUrl(asset.imageUrl)} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" alt="" />
                                                <img src={resolveMediaUrl(asset.imageUrl)} className="relative z-[1] w-full h-full object-contain p-2" alt={asset.arLabel} />
                                            </div>
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-white font-black truncate">{asset.arLabel}</p>
                                                        <p className="text-emerald-300 text-sm font-bold truncate" dir="ltr">{asset.targetWord}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${asset.isActive === false ? 'bg-gray-500/10 text-gray-400' : 'bg-emerald-500/10 text-emerald-300'}`}>
                                                        {asset.isActive === false ? 'مخفية' : 'مفعلة'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => void toggleAsset(asset)}
                                                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-black transition"
                                                    >
                                                        <Power size={13} />
                                                        {asset.isActive === false ? 'تفعيل' : 'إخفاء'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void deleteAsset(asset)}
                                                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-300 hover:text-white text-xs font-black transition"
                                                    >
                                                        <Trash2 size={13} />
                                                        حذف
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
