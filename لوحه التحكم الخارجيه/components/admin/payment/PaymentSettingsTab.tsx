import React, { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
    Wallet, Smartphone, Zap, Banknote, Save, Crown, Plus, Edit2, Trash2,
    LayoutDashboard, Check, Lock, Award, Headphones, Download, Video, List, X
} from 'lucide-react';
import { PaymentService, PaymentSettings, SubscriptionPlan, mergePaymentSettings } from '../../../services/paymentService';
import { AdminAPI } from '../../../services/apiClient';
import { Toast } from '../../Toast';

export const PaymentSettingsTab = () => {
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => PaymentService.getSettings());
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [saveBusy, setSaveBusy] = useState(false);

    const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setSettingsLoading(true);
            try {
                const res = (await AdminAPI.getPaymentSettings()) as {
                    settings?: Partial<PaymentSettings> | null;
                };
                if (cancelled) return;
                const merged = mergePaymentSettings(res?.settings ?? null);
                setPaymentSettings(merged);
                PaymentService.saveSettings(merged);
            } catch {
                if (!cancelled) {
                    setPaymentSettings(PaymentService.getSettings());
                    showToast('تعذر تحميل الإعدادات من الخادم — يُعرض المحفوظ محلياً', 'error');
                }
            } finally {
                if (!cancelled) setSettingsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleSavePaymentSettings = async () => {
        setSaveBusy(true);
        try {
            await AdminAPI.updatePaymentSettings(paymentSettings);
            PaymentService.saveSettings(paymentSettings);
            showToast("تم حفظ إعدادات الدفع على الخادم بنجاح! 💰", "success");
        } catch {
            showToast('فشل الحفظ على الخادم. تحقق من الاتصال أو صلاحيات المسئول.', 'error');
        } finally {
            setSaveBusy(false);
        }
    };

    return (
        <m.div
            key="payment_settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10 animate-fade-in"
        >
            <Toast
                message={toastMessage?.text || ""}
                isVisible={!!toastMessage}
                onClose={() => setToastMessage(null)}
                type={toastMessage?.type}
            />

            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Wallet className="text-emerald-500" />
                        إدارة وسائل الدفع
                    </h2>
                    <p className="text-gray-400 font-bold mt-2">التحكم في أرقام المحافظ والحسابات البنكية الظاهرة للمستخدمين</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-xl ring-1 ring-white/5 group hover:border-emerald-500/30 transition-all">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">السعر الأساسي</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    disabled={settingsLoading}
                                    value={paymentSettings.price || 50}
                                    onChange={(e) => {
                                        const newPrice = Number(e.target.value);
                                        setPaymentSettings({
                                            ...paymentSettings,
                                            price: newPrice,
                                            // Automatically update the first plan's price to keep things in sync for simple setups
                                            plans: paymentSettings.plans.map((p, i) => i === 0 ? { ...p, price: newPrice } : p)
                                        });
                                    }}
                                    className="w-24 bg-transparent text-white font-black text-2xl outline-none focus:text-emerald-500 transition-colors"
                                />
                                <span className="text-sm font-black text-emerald-500">EGP</span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={settingsLoading || saveBusy}
                        onClick={() => void handleSavePaymentSettings()}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-900/40"
                    >
                        <Save size={20} />
                        {saveBusy ? 'جاري الحفظ…' : 'حفظ التغييرات'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Vodafone Cash */}
                <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${paymentSettings.vodafoneCash.isEnabled ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-900/40 border-white/5 opacity-70 grayscale'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-900/50">
                                <Smartphone size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">Vodafone Cash</h3>
                                <p className="text-red-300 font-bold text-sm">المحفظة الإلكترونية</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold uppercase tracking-wider ${paymentSettings.vodafoneCash.isEnabled ? 'text-green-500' : 'text-gray-500'}`}>
                                {paymentSettings.vodafoneCash.isEnabled ? 'مفعل' : 'معطل'}
                            </span>
                            <button
                                onClick={() => setPaymentSettings({
                                    ...paymentSettings,
                                    vodafoneCash: { ...paymentSettings.vodafoneCash, isEnabled: !paymentSettings.vodafoneCash.isEnabled }
                                })}
                                className={`w-14 h-7 rounded-full p-1 transition-colors ${paymentSettings.vodafoneCash.isEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${paymentSettings.vodafoneCash.isEnabled ? 'translate-x-0' : '-translate-x-7'}`}></div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-2">رقم المحفظة</label>
                            <div className="relative group">
                                <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={paymentSettings.vodafoneCash.number || ''}
                                    onChange={(e) => setPaymentSettings({
                                        ...paymentSettings,
                                        vodafoneCash: { ...paymentSettings.vodafoneCash, number: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-white/10 group-hover:border-white/20 focus:border-red-500/50 rounded-xl py-4 px-4 pr-12 text-white font-mono text-xl font-bold outline-none transition-all placeholder:text-gray-700"
                                    placeholder="010xxxxxxxx"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-2">تعليمات الدفع</label>
                            <textarea
                                rows={2}
                                value={paymentSettings.vodafoneCash.instruction || ''}
                                onChange={(e) => setPaymentSettings({
                                    ...paymentSettings,
                                    vodafoneCash: { ...paymentSettings.vodafoneCash, instruction: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white font-medium outline-none focus:border-red-500/50 transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Instapay */}
                <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${paymentSettings.instapay.isEnabled ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900/40 border-white/5 opacity-70 grayscale'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
                                <Zap size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">InstaPay</h3>
                                <p className="text-purple-300 font-bold text-sm">تحويل بنكي لحظي</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPaymentSettings({
                                    ...paymentSettings,
                                    instapay: { ...paymentSettings.instapay, isEnabled: !paymentSettings.instapay.isEnabled }
                                })}
                                className={`w-14 h-7 rounded-full p-1 transition-colors ${paymentSettings.instapay.isEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${paymentSettings.instapay.isEnabled ? 'translate-x-0' : '-translate-x-7'}`}></div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-2">عنوان الدفع (Instapay Username)</label>
                            <div className="relative group">
                                <Zap className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={paymentSettings.instapay.number || ''}
                                    onChange={(e) => setPaymentSettings({
                                        ...paymentSettings,
                                        instapay: { ...paymentSettings.instapay, number: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-white/10 group-hover:border-white/20 focus:border-purple-500/50 rounded-xl py-4 px-4 pr-12 text-white font-mono text-lg font-bold outline-none transition-all placeholder:text-gray-700"
                                    placeholder="username@instapay"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-2">تعليمات الدفع</label>
                            <textarea
                                rows={2}
                                value={paymentSettings.instapay.instruction || ''}
                                onChange={(e) => setPaymentSettings({
                                    ...paymentSettings,
                                    instapay: { ...paymentSettings.instapay, instruction: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white font-medium outline-none focus:border-purple-500/50 transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Fawry */}
                <div className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${paymentSettings.fawry.isEnabled ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-slate-900/40 border-white/5 opacity-70 grayscale'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-yellow-900/50">
                                <Banknote size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">Fawry Pay</h3>
                                <p className="text-yellow-500 font-bold text-sm">كود الخدمة</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPaymentSettings({
                                    ...paymentSettings,
                                    fawry: { ...paymentSettings.fawry, isEnabled: !paymentSettings.fawry.isEnabled }
                                })}
                                className={`w-14 h-7 rounded-full p-1 transition-colors ${paymentSettings.fawry.isEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${paymentSettings.fawry.isEnabled ? 'translate-x-0' : '-translate-x-7'}`}></div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-2">كود الخدمة / الرقم المرجعي</label>
                            <div className="relative group">
                                <Banknote className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={paymentSettings.fawry.number || ''}
                                    onChange={(e) => setPaymentSettings({
                                        ...paymentSettings,
                                        fawry: { ...paymentSettings.fawry, number: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-white/10 group-hover:border-white/20 focus:border-yellow-500/50 rounded-xl py-4 px-4 pr-12 text-white font-mono text-xl font-bold outline-none transition-all placeholder:text-gray-700"
                                    placeholder="788xxxxx"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-2">تعليمات الدفع</label>
                            <textarea
                                rows={2}
                                value={paymentSettings.fawry.instruction || ''}
                                onChange={(e) => setPaymentSettings({
                                    ...paymentSettings,
                                    fawry: { ...paymentSettings.fawry, instruction: e.target.value }
                                })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white font-medium outline-none focus:border-yellow-500/50 transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Packages Management Section */}
            <div className="mt-12 border-t border-white/5 pt-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                            <Crown className="text-amber-500" />
                            باقات الاشتراك
                        </h3>
                        <p className="text-gray-400 font-bold mt-2">قم بإنشاء وتعديل الباقات المتاحة للمستخدمين</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPlan({
                                id: Date.now().toString(),
                                name: '',
                                price: 0,
                                description: '',
                                theme: 'blue',
                                isPopular: false,
                                features: []
                            });
                            setIsPlanModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-amber-900/40"
                    >
                        <Plus size={20} />
                        إضافة باقة جديدة
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {paymentSettings.plans?.map((plan) => (
                        <div key={plan.id} className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 relative group overflow-hidden hover:border-white/10 transition-all">
                            <div className={`absolute inset-0 bg-gradient-to-br from-${plan.theme}-500/5 to-transparent opacity-50`}></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-xl font-black text-white">{plan.name}</h4>
                                            {plan.originalPrice && plan.originalPrice > plan.price && (
                                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-900/20 animate-pulse">
                                                    -{Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-amber-500">{plan.price} <span className="text-xs text-gray-500">EGP</span></div>
                                            {plan.originalPrice && plan.originalPrice > plan.price && (
                                                <div className="text-sm font-bold text-gray-600 line-through decoration-red-500/50">{plan.originalPrice} EGP</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingPlan(plan);
                                                setIsPlanModalOpen(true);
                                            }}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newPlans = paymentSettings.plans.filter(p => p.id !== plan.id);
                                                setPaymentSettings({ ...paymentSettings, plans: newPlans });
                                            }}
                                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm mb-6 line-clamp-2">{plan.description}</p>

                                <div className="space-y-2">
                                    {plan.features.slice(0, 3).map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                            <Check size={14} className="text-green-500" />
                                            <span>{feature.text}</span>
                                        </div>
                                    ))}
                                    {plan.features.length > 3 && (
                                        <div className="text-xs text-gray-500 mr-6">+ {plan.features.length - 3} ميزات إضافية</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Plan Editor Modal */}
            <AnimatePresence>
                {isPlanModalOpen && editingPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <m.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#0f172a] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#1e293b]/50">
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tight">
                                        {editingPlan.id ? 'تعديل الباقة' : 'إنشاء باقة جديدة'}
                                    </h3>
                                    <p className="text-gray-400 text-sm font-bold mt-1">قم بتخصيص تفاصيل الباقة والميزات المتاحة للمشتركين</p>
                                </div>
                                <button onClick={() => setIsPlanModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors border border-white/5"><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Left Column: Basic Info */}
                                    <div className="lg:col-span-5 space-y-6">
                                        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 space-y-5">
                                            <h4 className="text-white font-black flex items-center gap-2 border-b border-white/5 pb-4 mb-2">
                                                <LayoutDashboard size={20} className="text-blue-500" />
                                                البيانات الأساسية
                                            </h4>

                                            <div>
                                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-1">اسم الباقة</label>
                                                <input
                                                    type="text"
                                                    placeholder="مثال: الباقة الذهبية"
                                                    value={editingPlan.name}
                                                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold text-lg outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-1">السعر الحالي</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">جنية</span>
                                                        <input
                                                            type="number"
                                                            value={editingPlan.price}
                                                            onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-blue-500/50 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-1">السعر قبل الخصم</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">جنية</span>
                                                        <input
                                                            type="number"
                                                            value={editingPlan.originalPrice || ''}
                                                            placeholder="اختياري"
                                                            onChange={e => setEditingPlan({ ...editingPlan, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-red-500/30 transition-all placeholder:text-gray-800"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 mr-1">وصف موجز</label>
                                                <textarea
                                                    value={editingPlan.description}
                                                    onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-medium text-sm outline-none focus:border-blue-500/50 h-32 resize-none transition-all placeholder:text-gray-700 leading-relaxed"
                                                    placeholder="اكتب وصفاً قصيراً وجذاباً للباقة يظهر تحت الاسم..."
                                                />
                                            </div>

                                            <div className="pt-2">
                                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-1">لون تمييز الباقة</label>
                                                <div className="flex justify-between bg-slate-950 p-2 rounded-2xl border border-white/5">
                                                    {['amber', 'blue', 'purple', 'red', 'green'].map(color => (
                                                        <button
                                                            key={color}
                                                            onClick={() => setEditingPlan({ ...editingPlan, theme: color as any })}
                                                            className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center relative ${editingPlan.theme === color ? 'scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                                                            style={{ backgroundColor: color === 'amber' ? '#f59e0b' : color === 'blue' ? '#3b82f6' : color === 'purple' ? '#8b5cf6' : color === 'red' ? '#ef4444' : '#10b981' }}
                                                        >
                                                            {editingPlan.theme === color && <Check size={16} className="text-white drop-shadow-md" strokeWidth={4} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Features */}
                                    <div className="lg:col-span-7 flex flex-col gap-6">
                                        {/* Quick Add Features */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {[
                                                { t: "وصول كامل للمحتوى", i: <Lock size={14} /> },
                                                { t: "بدون إعلانات", i: <Zap size={14} /> },
                                                { t: "شهادة معتمدة", i: <Award size={14} /> },
                                                { t: "دعم فني مباشر", i: <Headphones size={14} /> },
                                                { t: "تحميل للمشاهدة", i: <Download size={14} /> },
                                                { t: "جودة 4K", i: <Video size={14} /> },
                                            ].map((feature, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        if (!editingPlan.features.some(f => f.text === feature.t)) {
                                                            setEditingPlan({
                                                                ...editingPlan,
                                                                features: [...editingPlan.features, { text: feature.t, subText: '', isEnabled: true }]
                                                            });
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 hover:border-white/10 p-3 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all group"
                                                >
                                                    <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-blue-500 group-hover:scale-110 transition-all">{feature.i}</span>
                                                    {feature.t}
                                                    <Plus size={12} className="mr-auto opacity-0 group-hover:opacity-100 text-blue-400" />
                                                </button>
                                            ))}
                                        </div>

                                        {/* Features List */}
                                        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex-1 flex flex-col">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-white font-black flex items-center gap-2">
                                                    <List size={20} className="text-purple-500" />
                                                    قائمة الميزات
                                                    <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-md">{editingPlan.features.length}</span>
                                                </h4>
                                                <button
                                                    onClick={() => setEditingPlan({
                                                        ...editingPlan,
                                                        features: [...editingPlan.features, { text: '', subText: '', isEnabled: true }]
                                                    })}
                                                    className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                                                >
                                                    <Plus size={14} strokeWidth={3} />
                                                    إضافة ميزة مخصصة
                                                </button>
                                            </div>

                                            <div className="space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                                                {editingPlan.features.map((feature, idx) => (
                                                    <m.div
                                                        layout
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="group flex gap-3 items-start bg-slate-950 p-3 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all"
                                                    >
                                                        <div className="mt-2 text-purple-500 bg-purple-500/10 p-1.5 rounded-lg">
                                                            <Check size={14} strokeWidth={3} />
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <input
                                                                type="text"
                                                                placeholder="عنوان الميزة (مثال: بدون إعلانات)"
                                                                value={feature.text}
                                                                onChange={e => {
                                                                    const newFeatures = [...editingPlan.features];
                                                                    newFeatures[idx].text = e.target.value;
                                                                    setEditingPlan({ ...editingPlan, features: newFeatures });
                                                                }}
                                                                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-gray-600"
                                                            />
                                                            <div className="h-px bg-white/5 w-full" />
                                                            <input
                                                                type="text"
                                                                placeholder="وصف إضافي للميزة (اختياري)"
                                                                value={feature.subText || ''}
                                                                onChange={e => {
                                                                    const newFeatures = [...editingPlan.features];
                                                                    newFeatures[idx].subText = e.target.value;
                                                                    setEditingPlan({ ...editingPlan, features: newFeatures });
                                                                }}
                                                                className="w-full bg-transparent text-xs font-medium text-gray-500 outline-none focus:text-gray-300 placeholder:text-gray-700"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newFeatures = editingPlan.features.filter((_, i) => i !== idx);
                                                                setEditingPlan({ ...editingPlan, features: newFeatures });
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </m.div>
                                                ))}
                                                {editingPlan.features.length === 0 && (
                                                    <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-2xl">
                                                        <p className="text-gray-500 text-sm font-bold opacity-50">أضف ميزات لزيادة قيمة الباقة</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-[#1e293b]/50 backdrop-blur-md flex justify-end gap-3 z-10">
                                <button
                                    onClick={() => setIsPlanModalOpen(false)}
                                    className="px-6 py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={() => {
                                        let newPlans = [...(paymentSettings.plans || [])];
                                        const existingIndex = newPlans.findIndex(p => p.id === editingPlan.id);
                                        if (existingIndex >= 0) {
                                            newPlans[existingIndex] = editingPlan;
                                        } else {
                                            newPlans.push(editingPlan);
                                        }
                                        setPaymentSettings({ ...paymentSettings, plans: newPlans });
                                        setIsPlanModalOpen(false);
                                    }}
                                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black rounded-xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Save size={20} />
                                    حفظ التغييرات
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </m.div>
    );
};
