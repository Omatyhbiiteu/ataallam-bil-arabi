import React, { useMemo, useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Edit2, Save, X, BookOpen, Scroll,
    Lightbulb, Feather, Sparkles, Star, Moon, Heart,
    Sun, Flame, GraduationCap, Globe, Compass, Leaf, Zap,
    Eye, ChevronRight, ChevronLeft
} from 'lucide-react';
import { InspirationalSlide, InspirationalIcon } from '../../types';
import { AdminAPI } from '../../services/apiClient';

const generateId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// ── Icon Map ────────────────────────────────────────────────────────────────
export const ICON_MAP: Record<InspirationalIcon, React.FC<{ size?: number; className?: string }>> = {
    BookOpen, Scroll, Lightbulb, Feather, Sparkles,
    Star, Moon, Heart, Sun, Flame,
    GraduationCap, Globe, Compass, Leaf, Zap,
};

const ICON_LABELS: Record<InspirationalIcon, string> = {
    BookOpen: 'كتاب', Scroll: 'طومار', Lightbulb: 'فكرة', Feather: 'ريشة', Sparkles: 'بريق',
    Star: 'نجمة', Moon: 'قمر', Heart: 'قلب', Sun: 'شمس', Flame: 'لهب',
    GraduationCap: 'تخرج', Globe: 'كرة أرضية', Compass: 'بوصلة', Leaf: 'ورقة', Zap: 'برق',
};

// ── Gradient Presets ─────────────────────────────────────────────────────────
const GRADIENT_PRESETS = [
    { label: 'زمرد', value: 'from-emerald-600 via-teal-500 to-emerald-700' },
    { label: 'نيلي', value: 'from-indigo-600 via-blue-600 to-indigo-800' },
    { label: 'ذهبي', value: 'from-amber-500 via-orange-500 to-amber-700' },
    { label: 'بنفسجي', value: 'from-violet-600 via-purple-600 to-violet-800' },
    { label: 'وردي', value: 'from-rose-600 via-red-500 to-rose-800' },
    { label: 'فيروزي', value: 'from-cyan-600 via-sky-500 to-cyan-800' },
    { label: 'رمضاني', value: 'from-[#2E0B49] via-[#541690] to-[#1A052E]' },
    { label: 'أخضر', value: 'from-green-600 via-emerald-500 to-green-800' },
    { label: 'رمادي', value: 'from-slate-600 via-slate-500 to-slate-800' },
    { label: 'أحمر', value: 'from-red-700 via-red-600 to-red-900' },
    { label: 'برتقالي', value: 'from-orange-500 via-amber-400 to-orange-700' },
    { label: 'ليلي', value: 'from-gray-900 via-gray-800 to-black' },
];

// ── Default Slides ───────────────────────────────────────────────────────────
export const DEFAULT_SLIDES: InspirationalSlide[] = [
    { id: '1', text: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ', source: 'رواه مسلم', gradient: 'from-emerald-600 via-teal-500 to-emerald-700', icon: 'BookOpen', createdAt: 1 },
    { id: '2', text: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', source: 'سورة العلق - الآية 1', gradient: 'from-indigo-600 via-blue-600 to-indigo-800', icon: 'Scroll', createdAt: 2 },
    { id: '3', text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', source: 'سورة طه - الآية 114', gradient: 'from-amber-500 via-orange-500 to-amber-700', icon: 'Lightbulb', createdAt: 3 },
    { id: '4', text: 'إِنَّ الْمَلَائِكَةَ لَتَضَعُ أَجْنِحَتَهَا لِطَالِبِ الْعِلْمِ رِضًا بِمَا يَصْنَعُ', source: 'رواه الترمذي', gradient: 'from-violet-600 via-purple-600 to-violet-800', icon: 'Feather', createdAt: 4 },
    { id: '5', text: 'قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ', source: 'سورة الزمر - الآية 9', gradient: 'from-rose-600 via-red-500 to-rose-800', icon: 'Sparkles', createdAt: 5 },
];

interface AdminInspirationalTabProps {
    slides: InspirationalSlide[];
    setSlides: (slides: InspirationalSlide[]) => void;
    onDelete?: (updated: InspirationalSlide[]) => void;
    showToast: (msg: string, type: 'error' | 'success' | 'info') => void;
}

const BLANK: Omit<InspirationalSlide, 'id' | 'createdAt'> = {
    text: '',
    source: '',
    gradient: GRADIENT_PRESETS[0].value,
    icon: 'BookOpen',
};

export const AdminInspirationalTab: React.FC<AdminInspirationalTabProps> = ({
    slides, setSlides, onDelete, showToast
}) => {
    const activeSlides = useMemo(() => (slides.length > 0 ? slides : DEFAULT_SLIDES), [slides]);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<InspirationalSlide, 'id' | 'createdAt'>>(BLANK);
    const [preview, setPreview] = useState(0); // preview slide index

    const openAdd = () => {
        setEditingId(null);
        setForm(BLANK);
        setShowForm(true);
    };

    const openEdit = (slide: InspirationalSlide) => {
        setEditingId(slide.id);
        setForm({ text: slide.text, source: slide.source, gradient: slide.gradient, icon: slide.icon });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.text.trim()) { showToast('يرجى كتابة النص', 'error'); return; }
        if (!form.source.trim()) { showToast('يرجى كتابة المصدر', 'error'); return; }

        const base = slides.length > 0 ? slides : DEFAULT_SLIDES;

        try {
            if (editingId) {
                setSlides(base.map(s => s.id === editingId ? { ...s, ...form } : s));
                await AdminAPI.updateInspirational(editingId, form);
                showToast('تم تعديل الشريحة ✅', 'success');
            } else {
                const optimistic = { id: generateId(), createdAt: Date.now(), ...form } as InspirationalSlide;
                setSlides([...base, optimistic]);
                const res = await AdminAPI.createInspirational(form) as any;
                const saved = res?.slide as InspirationalSlide | undefined;
                if (saved?.id) {
                    setSlides((prev) => prev.map((s) => (s.id === optimistic.id ? saved : s)));
                }
                showToast('تمت إضافة الشريحة 🎉', 'success');
            }
            setShowForm(false);
        } catch {
            showToast('فشل الحفظ على الخادم. تأكد من تسجيل دخول المسئول.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const base = slides.length > 0 ? slides : DEFAULT_SLIDES;
        if (base.length <= 1) { showToast('يجب أن تبقى شريحة واحدة على الأقل', 'error'); return; }
        if (!window.confirm('حذف هذه الشريحة؟')) return;
        const updated = base.filter(s => s.id !== id);
        setSlides(updated);
        try {
            await AdminAPI.deleteInspirational(id);
            // ✦ Multi-lang: sync
            onDelete?.(updated);
            showToast('تم الحذف', 'info');
        } catch {
            showToast('فشل الحذف على الخادم', 'error');
        }
    };

    const handleReset = () => {
        if (!window.confirm('إعادة تعيين جميع الشرائح للافتراضية؟')) return;
        setSlides(DEFAULT_SLIDES);
        showToast('تمت إعادة التعيين', 'info');
    };

    // Mini preview of the banner
    const PreviewBanner = ({ slide }: { slide: InspirationalSlide }) => {
        const Icon = ICON_MAP[slide.icon] ?? Sparkles;
        return (
            <div className={`w-full rounded-xl overflow-hidden bg-gradient-to-l ${slide.gradient} px-4 py-3 flex items-center gap-3`}>
                <div className="shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Icon size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate" style={{ fontFamily: '"Traditional Arabic", serif' }}>
                        "{slide.text}"
                    </p>
                    <span className="text-white/60 text-[9px] font-bold">{slide.source}</span>
                </div>
            </div>
        );
    };

    return (
        <m.div key="inspirational" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white mb-1">الشريط الإلهامي</h2>
                    <p className="text-gray-500 text-sm font-medium">إدارة شرائح الآيات والأحاديث في الصفحة الرئيسية</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleReset} className="text-xs text-gray-500 hover:text-white border border-white/10 px-4 py-2.5 rounded-xl font-bold transition hover:bg-white/5">
                        إعادة تعيين
                    </button>
                    <button onClick={openAdd} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-red-900/20">
                        <Plus size={18} /> شريحة جديدة
                    </button>
                </div>
            </header>

            {/* Live Preview Bar */}
            <section className="bg-white/5 rounded-[2rem] p-6 border border-white/5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Eye size={12} /> معاينة مباشرة
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPreview(p => (p - 1 + activeSlides.length) % activeSlides.length)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition">
                            <ChevronRight size={14} className="text-gray-400" />
                        </button>
                        <span className="text-xs text-gray-500 font-bold">{preview + 1} / {activeSlides.length}</span>
                        <button onClick={() => setPreview(p => (p + 1) % activeSlides.length)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition">
                            <ChevronLeft size={14} className="text-gray-400" />
                        </button>
                    </div>
                </div>
                <PreviewBanner slide={activeSlides[Math.min(preview, activeSlides.length - 1)]} />
            </section>

            {/* Slides List */}
            <section>
                <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-5">
                    الشرائح ({activeSlides.length})
                </h3>
                <div className="space-y-3">
                    {activeSlides.map((slide, idx) => {
                        const Icon = ICON_MAP[slide.icon] ?? Sparkles;
                        return (
                            <m.div
                                key={slide.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4 group hover:bg-white/8 transition-all"
                            >
                                {/* Color Swatch & Icon */}
                                <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-lg`}>
                                    <Icon size={20} className="text-white" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate" style={{ fontFamily: '"Traditional Arabic", serif' }}>
                                        "{slide.text}"
                                    </p>
                                    <p className="text-gray-500 text-xs mt-0.5">{slide.source}</p>
                                </div>

                                {/* Actions */}
                                <div className="shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(slide)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(slide.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </m.div>
                        );
                    })}
                </div>
            </section>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-[#0B0D17]/90 backdrop-blur-2xl z-50 flex items-start justify-center p-4 overflow-y-auto">
                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 w-full max-w-xl rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl my-8"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-xl font-black text-white">{editingId ? 'تعديل الشريحة' : 'شريحة جديدة'}</h3>
                                <button onClick={() => setShowForm(false)} className="p-3 hover:bg-white/10 rounded-2xl transition">
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-8 space-y-7">

                                {/* Live preview inside form */}
                                {form.text && (
                                    <div className={`w-full rounded-xl overflow-hidden bg-gradient-to-l ${form.gradient} px-4 py-3 flex items-center gap-3`}>
                                        <div className="shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            {React.createElement(ICON_MAP[form.icon] ?? Sparkles, { size: 16, className: 'text-white' })}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-bold truncate" style={{ fontFamily: '"Traditional Arabic", serif' }}>"{form.text}"</p>
                                            <span className="text-white/60 text-[9px] font-bold">{form.source || 'المصدر'}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Text */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">النص (آية / حديث / مقولة)</label>
                                    <textarea
                                        autoFocus
                                        rows={3}
                                        value={form.text}
                                        onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition resize-none text-right"
                                        placeholder="اكتب الآية أو الحديث هنا..."
                                        dir="rtl"
                                        style={{ fontFamily: '"Traditional Arabic", serif', fontSize: '1rem' }}
                                    />
                                </div>

                                {/* Source */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">المصدر</label>
                                    <input
                                        type="text"
                                        value={form.source}
                                        onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition"
                                        placeholder="مثال: سورة العلق - الآية 1"
                                        dir="rtl"
                                    />
                                </div>

                                {/* Gradient Picker */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">لون الخلفية</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {GRADIENT_PRESETS.map(g => (
                                            <button
                                                key={g.value}
                                                onClick={() => setForm(p => ({ ...p, gradient: g.value }))}
                                                title={g.label}
                                                className={`h-9 rounded-xl bg-gradient-to-br ${g.value} transition-transform hover:scale-105 ${form.gradient === g.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Icon Picker */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">الأيقونة</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {(Object.keys(ICON_MAP) as InspirationalIcon[]).map(iconKey => {
                                            const Ic = ICON_MAP[iconKey];
                                            return (
                                                <button
                                                    key={iconKey}
                                                    onClick={() => setForm(p => ({ ...p, icon: iconKey }))}
                                                    title={ICON_LABELS[iconKey]}
                                                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${form.icon === iconKey
                                                        ? 'bg-red-600 border-red-500 text-white'
                                                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    <Ic size={18} />
                                                    <span className="text-[9px] font-bold">{ICON_LABELS[iconKey]}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={() => void handleSave()}
                                    className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-[2rem] font-black shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {editingId ? 'حفظ التعديلات' : 'إضافة الشريحة'}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </m.div>
    );
};
