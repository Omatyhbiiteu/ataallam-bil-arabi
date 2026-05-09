import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Sparkles, Plus, Trash2, Save, CreditCard, ExternalLink, X, Smartphone, Megaphone, SmartphoneNfc } from 'lucide-react';
import { Coupon, PromoBanner } from '../../types';
import { MarketingAPI, AdminAPI } from '../../services/apiClient';

interface MarketingTabProps {
    coupons: Coupon[];
    setCoupons: (coupons: Coupon[]) => void;
    banners: PromoBanner[];
    setBanners: (banners: PromoBanner[]) => void;
}

export const MarketingTab: React.FC<MarketingTabProps> = ({ coupons, setCoupons, banners, setBanners }) => {
    // State for Forms
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ isActive: true });

    const [showBannerForm, setShowBannerForm] = useState(false);
    const [newBanner, setNewBanner] = useState<Partial<PromoBanner>>({ type: 'popup', isActive: true, emoji: '🎁' });

    const refreshMarketing = async () => {
        try {
            const [cRes, bRes] = await Promise.all([
                MarketingAPI.getCoupons(),
                MarketingAPI.getBanners(),
            ]);
            if (Array.isArray((cRes as any)?.coupons)) setCoupons((cRes as any).coupons);
            if (Array.isArray((bRes as any)?.banners)) setBanners((bRes as any).banners);
        } catch {
            // تجاهل
        }
    };

    // Coupon Handlers
    const handleSaveCoupon = async () => {
        if (!newCoupon.code || !newCoupon.discountPercentage) return;

        const payload = {
            code: String(newCoupon.code).toUpperCase(),
            discountPercentage: Number(newCoupon.discountPercentage),
            isActive: newCoupon.isActive ?? true,
            expiryDate: newCoupon.expiryDate || undefined,
        };

        try {
            if (newCoupon.id) {
                const res = await AdminAPI.updateCoupon(newCoupon.id, payload);
                // refresh to ensure backend truth
                void res;
            } else {
                const res = await AdminAPI.createCoupon(payload);
                void res;
            }

            await refreshMarketing();
        } catch (e) {
            console.error(e);
        } finally {
            setShowCouponForm(false);
            setNewCoupon({ isActive: true });
        }
    };

    // --- Coupon delete modal ---
    const [deleteCouponTarget, setDeleteCouponTarget] = useState<Coupon | null>(null);
    const [deleteCouponBusy, setDeleteCouponBusy] = useState(false);

    const handleRequestDeleteCoupon = (coupon: Coupon) => {
        setDeleteCouponTarget(coupon);
    };

    const handleConfirmDeleteCoupon = async () => {
        if (!deleteCouponTarget?.id) return;
        setDeleteCouponBusy(true);
        try {
            await AdminAPI.deleteCoupon(deleteCouponTarget.id);
            await refreshMarketing();
        } catch (e) {
            console.error(e);
        } finally {
            setDeleteCouponBusy(false);
            setDeleteCouponTarget(null);
        }
    };

    // Banner Handlers
    const handleSaveBanner = async () => {
        if (!newBanner.title || !newBanner.description) return;

        const payload = {
            title: newBanner.title,
            description: newBanner.description,
            emoji: newBanner.emoji || undefined,
            ctaText: newBanner.ctaText || undefined,
            ctaLink: newBanner.ctaLink || undefined,
            isActive: newBanner.isActive ?? true,
            type: newBanner.type || 'popup',
            relatedCouponCode: newBanner.relatedCouponCode || undefined,
            backgroundColor: newBanner.backgroundColor || undefined,
            textColor: newBanner.textColor || undefined,
        };

        try {
            if (newBanner.id) {
                const res = await AdminAPI.updateBanner(newBanner.id, payload);
                void res;
            } else {
                const res = await AdminAPI.createBanner(payload);
                void res;
            }

            await refreshMarketing();
        } catch (e) {
            console.error(e);
        } finally {
            setShowBannerForm(false);
            setNewBanner({ type: 'popup', isActive: true, emoji: '🎁' });
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

        try {
            await AdminAPI.deleteBanner(id);
            await refreshMarketing();
        } catch (e) {
            console.error(e);
        }
    };

    // --- Banner actions modal ---
    const [bannerActionTarget, setBannerActionTarget] = useState<PromoBanner | null>(null);
    const [bannerActionBusy, setBannerActionBusy] = useState(false);
    const [stopAfterValue, setStopAfterValue] = useState<number>(1);
    const [stopAfterUnit, setStopAfterUnit] = useState<'minutes' | 'hours' | 'days'>('days');
    const [showStopAfterInput, setShowStopAfterInput] = useState<boolean>(false);

    const isBannerExpired = (b: PromoBanner) => {
        if (!b.expiryDate) return false;
        const ts = Date.parse(b.expiryDate);
        if (Number.isNaN(ts)) return false;
        return ts <= Date.now();
    };

    const isBannerEffectivelyActive = (b: PromoBanner) => {
        return !!b.isActive && !isBannerExpired(b);
    };

    const handleCloseBannerForm = async () => {
        // لو بنعدل إعلان موجود: غلق عادي
        if (newBanner.id) {
            setShowBannerForm(false);
            return;
        }

        // لو إعلان جديد بس مش مستوفي البيانات: اغلق
        const title = (newBanner.title || '').trim();
        const description = (newBanner.description || '').trim();
        if (!title || !description) {
            setShowBannerForm(false);
            setNewBanner({ type: 'popup', isActive: true, emoji: '🎁' });
            return;
        }

        // طلبك: عند إلغاء التفعيل (أو غلق المودال) الإعلان يتضاف كمسودة (غير مُفعّل) مش يختفي
        const payload = {
            title,
            description,
            emoji: newBanner.emoji || undefined,
            ctaText: newBanner.ctaText || undefined,
            ctaLink: newBanner.ctaLink || undefined,
            isActive: false,
            type: newBanner.type || 'popup',
            relatedCouponCode: newBanner.relatedCouponCode || undefined,
            backgroundColor: newBanner.backgroundColor || undefined,
            textColor: newBanner.textColor || undefined,
            expiryDate: null
        };

        try {
            await AdminAPI.createBanner(payload);
            await refreshMarketing();
        } catch (e) {
            console.error(e);
        } finally {
            setShowBannerForm(false);
            setNewBanner({ type: 'popup', isActive: true, emoji: '🎁' });
        }
    };

    const handleConfirmDeleteBanner = async () => {
        if (!bannerActionTarget?.id) return;
        setBannerActionBusy(true);
        try {
            await AdminAPI.deleteBanner(bannerActionTarget.id);
            await refreshMarketing();
        } catch (e) {
            console.error(e);
        } finally {
            setBannerActionBusy(false);
            setBannerActionTarget(null);
            setShowStopAfterInput(false);
        }
    };

    const handleStopBannerNow = async () => {
        if (!bannerActionTarget?.id) return;
        setBannerActionBusy(true);
        try {
            await AdminAPI.updateBanner(bannerActionTarget.id, {
                isActive: false,
                expiryDate: null
            });
            await refreshMarketing();
        } catch (e) {
            console.error(e);
        } finally {
            setBannerActionBusy(false);
            setBannerActionTarget(null);
            setShowStopAfterInput(false);
        }
    };

    const handleStopBannerAfter = async () => {
        if (!bannerActionTarget?.id) return;
        if (stopAfterValue <= 0) return;

        const msPerUnit = stopAfterUnit === 'minutes'
            ? 60_000
            : stopAfterUnit === 'hours'
                ? 60 * 60_000
                : 24 * 60 * 60_000;

        const expiryDate = new Date(Date.now() + stopAfterValue * msPerUnit).toISOString();

        setBannerActionBusy(true);
        try {
            await AdminAPI.updateBanner(bannerActionTarget.id, {
                isActive: true,
                expiryDate
            });
            await refreshMarketing();
        } catch (e) {
            console.error(e);
        } finally {
            setBannerActionBusy(false);
            setBannerActionTarget(null);
            setShowStopAfterInput(false);
        }
    };

    return (
        <motion.div
            key="marketing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
        >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">التسويق والعروض 🚀</h2>
                    <p className="text-gray-400 font-medium">إدارة كوبونات الخصم والنوافذ الإعلانية لزيادة المبيعات.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* --- COUPONS SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Tag className="text-amber-500" />
                            كوبونات الخصم
                        </h3>
                        <button
                            onClick={() => { setNewCoupon({ isActive: true }); setShowCouponForm(true); }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white border border-white/5 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> جديد
                        </button>
                    </div>

                    <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden min-h-[300px]">
                        {coupons.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center p-10 text-gray-600 opacity-60">
                                <Tag size={48} className="mb-4" />
                                <p className="font-bold">لا توجد كوبونات</p>
                            </div>
                        )}
                        <div className="divide-y divide-white/5">
                            {coupons.map(coupon => (
                                <div key={coupon.id} className="p-5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 font-black text-lg border border-amber-500/20">
                                            %
                                        </div>
                                        <div>
                                            <h4 className="font-mono font-black text-white text-lg tracking-wider">{coupon.code}</h4>
                                            <p className="text-xs text-gray-500 font-bold">خصم {coupon.discountPercentage}% • {coupon.isActive ? 'نشط' : 'غير نشط'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRequestDeleteCoupon(coupon)}
                                            className="p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className={`w-3 h-3 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-red-500'} shadow-lg shadow-black/50`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- BANNERS SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Megaphone className="text-red-500" />
                            الإعلانات والرسائل
                        </h3>
                        <button
                            onClick={() => { setNewBanner({ type: 'popup', isActive: true, emoji: '🎁' }); setShowBannerForm(true); }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white border border-white/5 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> جديد
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {banners.length === 0 && (
                            <div className="bg-slate-900 border border-white/5 rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center p-10 text-gray-600 opacity-60">
                                <Sparkles size={48} className="mb-4" />
                                <p className="font-bold">لا توجد إعلانات نشطة</p>
                            </div>
                        )}
                        {banners.map(banner => (
                            <div key={banner.id} onClick={() => { setNewBanner(banner); setShowBannerForm(true); }} className="cursor-pointer bg-slate-900 border border-white/5 p-6 rounded-[2rem] hover:border-red-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-red-500/10 transition-colors" />

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl border border-white/5 shadow-inner">
                                        {banner.emoji || '🎁'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                                            isBannerEffectivelyActive(banner)
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                : (banner.isActive ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-gray-800 text-gray-500 border-gray-700')
                                        }`}>
                                            {isBannerEffectivelyActive(banner) ? 'Active' : (banner.isActive ? 'Expired' : 'Draft')}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setStopAfterValue(1);
                                                setStopAfterUnit('days');
                                                setShowStopAfterInput(false);
                                                setBannerActionTarget(banner);
                                            }}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-black text-white border border-white/5 transition-colors"
                                            aria-label="إدارة الإعلان"
                                        >
                                            إدارة
                                        </button>
                                    </div>
                                </div>

                                <h4 className="font-black text-white text-lg mb-1 relative z-10">{banner.title}</h4>
                                <p className="text-sm text-gray-500 font-medium line-clamp-2 relative z-10">{banner.description}</p>

                                {banner.relatedCouponCode && (
                                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold border border-amber-500/10">
                                        <Tag size={12} /> المرتبط: {banner.relatedCouponCode}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {/* Coupon Form */}
                {showCouponForm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-lg font-black text-white">إضافة كوبون</h3>
                                <button onClick={() => setShowCouponForm(false)}><X className="text-gray-400" /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">كود الكوبون</label>
                                    <input
                                        type="text"
                                        placeholder="EGYPT20"
                                        className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-white font-mono font-bold uppercase outline-none focus:border-amber-500"
                                        value={newCoupon.code || ''}
                                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2">نسبة الخصم (%)</label>
                                        <input
                                            type="number"
                                            placeholder="20"
                                            className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-amber-500"
                                            value={newCoupon.discountPercentage || ''}
                                            onChange={e => setNewCoupon({ ...newCoupon, discountPercentage: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold text-gray-400">تفعيل الكوبون</label>
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 accent-amber-500"
                                            checked={newCoupon.isActive}
                                            onChange={e => setNewCoupon({ ...newCoupon, isActive: e.target.checked })}
                                        />
                                    </div>
                                </div>
                                <button onClick={() => void handleSaveCoupon()} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition-colors">حفظ الكوبون</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Coupon delete confirmation */}
                {deleteCouponTarget && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-lg font-black text-white">حذف الكود</h3>
                                <button onClick={() => setDeleteCouponTarget(null)} aria-label="إغلاق">
                                    <X className="text-gray-400" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-300 font-bold">
                                        هل تريد بالفعل مسح الكود؟
                                    </p>
                                    <p className="text-xs font-mono text-white/80 bg-white/5 border border-white/10 rounded-xl px-4 py-3 inline-block">
                                        {deleteCouponTarget.code}
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteCouponTarget(null)}
                                        disabled={deleteCouponBusy}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-black rounded-xl transition-colors disabled:opacity-60"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleConfirmDeleteCoupon()}
                                        disabled={deleteCouponBusy}
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-colors shadow-lg shadow-red-900/40 disabled:opacity-60"
                                    >
                                        {deleteCouponBusy ? 'جاري الحذف...' : 'مسح الكود'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Banner Form */}
                {/* This handles adding/editing popups */}
                {showBannerForm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-lg font-black text-white">إعداد النافذة الإعلانية</h3>
                                <button onClick={() => void handleCloseBannerForm()}><X className="text-gray-400" /></button>
                            </div>
                            <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">الأيقونة</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-white text-center text-2xl outline-none"
                                            value={newBanner.emoji}
                                            onChange={e => setNewBanner({ ...newBanner, emoji: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">عنوان الإعلان</label>
                                        <input
                                            type="text"
                                            placeholder="عرض خاص لفترة محدودة!"
                                            className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-red-500"
                                            value={newBanner.title || ''}
                                            onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">نص الرسالة</label>
                                    <textarea
                                        rows={3}
                                        placeholder="احصل على خصم 20% عند الاشتراك اليوم..."
                                        className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-white font-medium outline-none focus:border-red-500"
                                        value={newBanner.description || ''}
                                        onChange={e => setNewBanner({ ...newBanner, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2">نص الزر (CTA)</label>
                                        <input
                                            type="text"
                                            placeholder="اشترك الآن"
                                            className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-white font-bold outline-none"
                                            value={newBanner.ctaText || ''}
                                            onChange={e => setNewBanner({ ...newBanner, ctaText: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2">رابط الزر (اختياري)</label>
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-gray-300 font-mono text-xs outline-none"
                                            value={newBanner.ctaLink || ''}
                                            onChange={e => setNewBanner({ ...newBanner, ctaLink: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">ربط بكوبون (اختياري)</label>
                                    <select
                                        className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-white font-bold outline-none cursor-pointer"
                                        value={newBanner.relatedCouponCode || ''}
                                        onChange={e => setNewBanner({ ...newBanner, relatedCouponCode: e.target.value })}
                                    >
                                        <option value="">بدون كوبون</option>
                                        {coupons.map(c => (
                                            <option key={c.id} value={c.code}>{c.code} ({c.discountPercentage}%)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-sm font-bold text-white">تفعيل هذا الإعلان فوراً؟</span>
                                    <input
                                        type="checkbox"
                                        className="w-6 h-6 accent-red-600"
                                        checked={newBanner.isActive}
                                        onChange={e => setNewBanner({ ...newBanner, isActive: e.target.checked })}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    {newBanner.id && (
                                        <button onClick={() => handleDeleteBanner(newBanner.id!)} className="px-6 py-4 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-colors font-bold">حذف</button>
                                    )}
                                    <button onClick={() => void handleSaveBanner()} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-900/40 transition-colors">حفظ ونشر</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Banner actions modal */}
                {bannerActionTarget && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{bannerActionTarget.emoji || '🎁'}</span>
                                    <h3 className="text-lg font-black text-white">إعدادات الإعلان</h3>
                                </div>
                                <button onClick={() => { setBannerActionTarget(null); setShowStopAfterInput(false); }} aria-label="إغلاق">
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between gap-3">
                                        <h4 className="text-white font-black text-xl">{bannerActionTarget.title}</h4>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                                            isBannerEffectivelyActive(bannerActionTarget)
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                : (bannerActionTarget.isActive ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-gray-800 text-gray-500 border-gray-700')
                                        }`}>
                                            {isBannerEffectivelyActive(bannerActionTarget) ? 'Active' : (bannerActionTarget.isActive ? 'Expired' : 'Draft')}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 font-medium mt-2 whitespace-pre-wrap">{bannerActionTarget.description}</p>
                                    {bannerActionTarget.relatedCouponCode && (
                                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold border border-amber-500/10">
                                            <Tag size={12} /> المرتبط: {bannerActionTarget.relatedCouponCode}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        disabled={bannerActionBusy}
                                        onClick={() => void handleConfirmDeleteBanner()}
                                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-900/40 transition-colors disabled:opacity-60"
                                    >
                                        مسح الإعلان
                                    </button>

                                    <button
                                        type="button"
                                        disabled={bannerActionBusy || !bannerActionTarget.isActive}
                                        onClick={() => void handleStopBannerNow()}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-black rounded-xl border border-white/10 transition-colors disabled:opacity-60"
                                    >
                                        إيقاف هذا الإعلان حاليا
                                    </button>

                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-black text-white">إيقاف الإعلان بعد مدة</p>
                                            <button
                                                type="button"
                                                className="text-xs font-bold text-red-400 hover:text-red-300"
                                                onClick={() => setShowStopAfterInput((v) => !v)}
                                            >
                                                {showStopAfterInput ? 'إخفاء' : 'تحديد'}
                                            </button>
                                        </div>

                                        {showStopAfterInput && (
                                            <div className="grid grid-cols-3 gap-3 items-end">
                                                <div className="col-span-1">
                                                    <label className="block text-xs font-bold text-gray-500 mb-2">المدة</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={stopAfterValue}
                                                        onChange={(e) => setStopAfterValue(Math.max(1, Number(e.target.value)))}
                                                        className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white font-bold outline-none focus:border-red-500"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 mb-2">الوحدة</label>
                                                    <select
                                                        value={stopAfterUnit}
                                                        onChange={(e) => setStopAfterUnit(e.target.value as any)}
                                                        className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white font-bold outline-none cursor-pointer"
                                                    >
                                                        <option value="minutes">دقائق</option>
                                                        <option value="hours">ساعات</option>
                                                        <option value="days">أيام</option>
                                                    </select>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={bannerActionBusy || !bannerActionTarget.isActive}
                                                    onClick={() => void handleStopBannerAfter()}
                                                    className="col-span-3 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-colors disabled:opacity-60"
                                                >
                                                    تأكيد إيقاف بعد مدة
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
