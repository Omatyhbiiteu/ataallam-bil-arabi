import React, { useState, useRef } from 'react';
import {
    Globe, Bell, Moon, Sun, User, Mail, Lock, Volume2, Target,
    BookOpen, Shield, Eye, Download, Upload, Trash2, HelpCircle,
    MessageSquare, Star, Palette, Type, Zap, Clock, Key, Smartphone, Heart,
    Settings as SettingsIcon, ChevronRight, Edit3, Camera, Check, Activity, Award, LogOut, AlertCircle, Crown, X, Copy, Wallet, Banknote,
    Lightbulb, Sparkles, Feather, Scroll, ArrowRight, ArrowLeft, Trophy, Gift, CheckCircle, RefreshCw, Loader2
} from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Language, LanguageAvailability, AppNotification, PromoBanner } from '../types';
import { PaymentService, PaymentSettings } from '../services/paymentService';
import { PaymentsAPI } from '../services/apiClient';
import { SubscriptionPlan } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/constants';
import { SupportModal } from './SupportModal';
import { AdminAPI } from '../services/apiClient';
import { OffersSlider } from './home/OffersSlider';

interface SettingsViewProps {
    darkMode: boolean;
    toggleTheme: () => void;
    onAdminClick: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: any;
    primaryColor: 'default' | 'amber' | 'blue' | 'purple' | 'green';
    setPrimaryColor: (color: 'default' | 'amber' | 'blue' | 'purple' | 'green') => void;
    targetLanguage: 'en' | 'de';
    onTargetLanguageChange: (lang: 'en' | 'de') => void;
    fontSize: 'small' | 'medium' | 'large';
    setFontSize: (size: 'small' | 'medium' | 'large') => void;
    animationsEnabled: boolean;
    setAnimationsEnabled: (enabled: boolean) => void;
    userName: string;
    userImage: string | null;
    /** شارة برو ذهبية بجانب الاسم */
    isProSubscriber?: boolean;
    subscriptionPlan?: 'free' | 'pro' | 'enterprise';
    planSubscribedAt?: string | null;
    planExpiresAt?: string | null;
    /** إعلان/عرض نشط يتم عرضه داخل قسم الاشتراك */
    activeOfferBanner?: PromoBanner | null;
    /** كل عروض الإدارة (لاستخدامها كسليدر داخل صفحة الاشتراكات) */
    offersBanners?: PromoBanner[];
    userEmail: string;
    userGender?: 'male' | 'female' | null;
    userAge?: number | null;
    userStartLevel?: string | null;
    onProfileUpdate: (payload: {
        name: string;
        image: string | null;
        age: number | null;
        gender: 'male' | 'female' | null;
    }) => Promise<{ success: boolean; error?: string }>;
    onNavigate: (tab: string) => void;
    targetSection?: 'account' | 'notifications' | 'appearance' | 'support' | 'subscription';
    userStats?: {
        level: number;
        totalXP: number;
        xpProgress: number;
        completedStories: number;
        totalStories: number;
        completedLessons: number;
        totalLessons: number;
        completedTopics: number;
        totalTopics: number;
        masteredCards: number;
        totalCards: number;
        streakDays: number;
    };
    onLogout?: () => void;
    onDeleteAccount?: () => Promise<{ success: boolean; error?: string }>;
    /** نفس قائمة درج الإشعارات (محلي + خادم srv_) */
    notifications?: AppNotification[];
    setNotifications?: (next: AppNotification[]) => void;
    /** جلب إشعارات الخادم عند فتح قسم الإشعارات */
    onRefreshNotifications?: () => void | Promise<void>;
}

const DEFAULT_AVATAR_URL = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

function compressImageFileToJpegDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('read'));
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const img = new Image();
            img.onerror = () => reject(new Error('image'));
            img.onload = () => {
                const MAX_WIDTH = 300;
                const scaleSize = MAX_WIDTH / img.width;
                const width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
                const height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(dataUrl);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.72));
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    });
}

// Knowledge Slider Data


export const SettingsView: React.FC<SettingsViewProps> = ({
    darkMode, toggleTheme, onAdminClick, language, setLanguage, t, primaryColor, setPrimaryColor,
    targetLanguage, onTargetLanguageChange, fontSize, setFontSize, animationsEnabled, setAnimationsEnabled,
    userName: initialUserName, userImage: initialUserImage, isProSubscriber = false, subscriptionPlan = 'free', planSubscribedAt = null, planExpiresAt = null, activeOfferBanner = null, offersBanners = [], userEmail: initialUserEmail, userGender: initialUserGender, userAge: initialUserAge, userStartLevel, onProfileUpdate, onNavigate, targetSection,
    userStats,
    onLogout,
    onDeleteAccount,
    notifications = [],
    setNotifications,
    onRefreshNotifications
}) => {
    const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'appearance' | 'support' | 'subscription'>('appearance');

  const [deleteNotifTarget, setDeleteNotifTarget] = useState<AppNotification | null>(null);
  const [deleteNotifBusy, setDeleteNotifBusy] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);

    // Sync activeSection with targetSection prop
    React.useEffect(() => {
        if (targetSection) {
            setActiveSection(targetSection);
        }
    }, [targetSection]);

    // Mock states
    const [userName, setUserName] = useState(initialUserName);
    const [userEmail, setUserEmail] = useState(initialUserEmail);
    const [userGender, setUserGender] = useState<'male' | 'female' | null>(initialUserGender || null);
    const [userAge, setUserAge] = useState<string>(initialUserAge ? String(initialUserAge) : '');
    const [showEditModal, setShowEditModal] = useState(false);
    const [ageError, setAgeError] = useState('');
    const [dailyGoal, setDailyGoal] = useState(20);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [reviewReminders, setReviewReminders] = useState(true);
    const [achievementNotifications, setAchievementNotifications] = useState(true);
    const [dangerModal, setDangerModal] = useState<'logout' | 'delete' | null>(null);
    const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
    const [userAvatar, setUserAvatar] = useState(initialUserImage || DEFAULT_AVATAR_URL);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);



    // Payment Logic
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1);
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(PaymentService.getSettings());
    const [selectedMethod, setSelectedMethod] = useState<'vodafone_cash' | 'instapay' | 'fawry' | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [notifListRefreshing, setNotifListRefreshing] = useState(false);

    // Coupon (خصم قبل الاشتراك)
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [couponDiscountPercentage, setCouponDiscountPercentage] = useState<number | null>(null);
    const [couponApplyError, setCouponApplyError] = useState<string | null>(null);
    const [couponApplying, setCouponApplying] = useState(false);

    const planBasePrice = selectedPlan?.price ?? paymentSettings.price ?? 50;
    const discountedPlanPrice =
        couponDiscountPercentage != null
            ? Math.round(planBasePrice - (planBasePrice * couponDiscountPercentage) / 100)
            : planBasePrice;

    const handleApplyCoupon = async () => {
        const raw = couponCodeInput.trim();
        if (!raw) return;

        setCouponApplying(true);
        setCouponApplyError(null);
        setCouponDiscountPercentage(null);
        setAppliedCouponCode(null);

        try {
            const res = await PaymentsAPI.verifyCoupon(raw) as {
                valid: boolean;
                discountPercentage?: number;
                message?: string;
            };

            if (!res?.valid || typeof res.discountPercentage !== 'number') {
                setCouponApplyError(res?.message || 'الكود ده غير متاح حاليا');
                return;
            }

            const upper = raw.toUpperCase();
            setAppliedCouponCode(upper);
            setCouponDiscountPercentage(res.discountPercentage);
        } catch {
            setCouponApplyError('الكود ده غير متاح حاليا');
        } finally {
            setCouponApplying(false);
        }
    };

    React.useEffect(() => {
        if (activeSection !== 'notifications' || !onRefreshNotifications) return;
        let cancelled = false;
        (async () => {
            setNotifListRefreshing(true);
            try {
                await Promise.resolve(onRefreshNotifications());
            } finally {
                if (!cancelled) setNotifListRefreshing(false);
            }
        })();
        return () => { cancelled = true; };
    }, [activeSection, onRefreshNotifications]);

    const notifIconEl = (icon: AppNotification['icon']) => {
        switch (icon) {
            case 'trophy': return <Trophy size={20} />;
            case 'star': return <Star size={20} />;
            case 'target': return <Target size={20} />;
            case 'book': return <BookOpen size={20} />;
            case 'gift': return <Gift size={20} />;
            case 'clock': return <Clock size={20} />;
            case 'check-circle': return <CheckCircle size={20} />;
            case 'alert-circle': return <AlertCircle size={20} />;
            default: return <Bell size={20} />;
        }
    };

    const notifTypeGradient = (type: AppNotification['type']) => {
        switch (type) {
            case 'achievement': return 'from-amber-500 to-orange-600';
            case 'reminder': return 'from-blue-500 to-indigo-600';
            case 'milestone': return 'from-purple-500 to-violet-600';
            case 'system': return 'from-emerald-500 to-teal-600';
            case 'success': return 'from-green-500 to-emerald-600';
            case 'warning': return 'from-amber-600 to-red-500';
            case 'info': return 'from-sky-500 to-blue-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    // عند فتح نافذة الدفع: إعادة تعيين الخطوات وتحديث الإعدادات من الخادم
    React.useEffect(() => {
        if (!showPaymentModal) return;
        setPaymentStep(1);
        setSelectedMethod(null);
        setCouponCodeInput('');
        setAppliedCouponCode(null);
        setCouponDiscountPercentage(null);
        setCouponApplyError(null);
        setCouponApplying(false);
    }, [showPaymentModal]);

    React.useEffect(() => {
        if (activeSection !== 'subscription' && !showPaymentModal) return;
        let cancelled = false;
        void (async () => {
            try {
                const merged = await PaymentService.fetchFromServer();
                if (!cancelled) setPaymentSettings(merged);
            } catch {
                if (!cancelled) setPaymentSettings(PaymentService.getSettings());
            }
        })();
        return () => { cancelled = true; };
    }, [activeSection, showPaymentModal]);

    const activeMethods = PaymentService.getActiveMethods(paymentSettings);

    // Sync state with props if they change after mount
    React.useEffect(() => {
        setUserName(initialUserName);
    }, [initialUserName]);

    React.useEffect(() => {
        setUserEmail(initialUserEmail);
    }, [initialUserEmail]);

    React.useEffect(() => {
        setUserAvatar(initialUserImage || DEFAULT_AVATAR_URL);
    }, [initialUserImage]);
    React.useEffect(() => {
        setUserGender(initialUserGender || null);
    }, [initialUserGender]);
    React.useEffect(() => {
        setUserAge(initialUserAge ? String(initialUserAge) : '');
    }, [initialUserAge]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const input = e.target;
        if (!file) return;

        const previous = userAvatar;
        const nameForApi =
            userName.trim().length >= 2
                ? userName.trim()
                : initialUserName.trim().length >= 2
                    ? initialUserName.trim()
                    : 'مستخدم';

        try {
            const compressedBase64 = await compressImageFileToJpegDataUrl(file);
            setUserAvatar(compressedBase64);
            setIsSaving(true);
            const res = await onProfileUpdate({
                name: nameForApi,
                image: compressedBase64,
                age: userAge ? Number(userAge) : null,
                gender: userGender,
            });
            if (!res.success) {
                setUserAvatar(previous);
            }
        } catch {
            setUserAvatar(previous);
        } finally {
            setIsSaving(false);
            input.value = '';
        }
    };

    const [emailError, setEmailError] = useState('');
    const [nameError, setNameError] = useState('');

    const handleSave = async () => {
        // Name validation
        if (!userName.trim() || userName.trim().length < 2) {
            setNameError('الاسم يجب أن يكون حرفين على الأقل');
            return;
        }
        setNameError('');
        const ageNum = userAge ? Number(userAge) : null;
        if (ageNum !== null && (Number.isNaN(ageNum) || ageNum < 5 || ageNum > 100)) {
            setAgeError('يجب أن يكون العمر بين 5 و 100');
            return;
        }
        const imagePayload =
            userAvatar && userAvatar !== DEFAULT_AVATAR_URL ? userAvatar : null;

        setIsSaving(true);
        const res = await onProfileUpdate({
            name: userName.trim(),
            image: imagePayload,
            age: ageNum,
            gender: userGender,
        });
        setIsSaving(false);
        if (res.success) {
            setShowEditModal(false);
        }
    };

    // Validation Logic
    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const NAME_LIMIT = 25;
    const EMAIL_LIMIT = 40;

    const sections = [
        { id: 'account', label: 'الحساب', icon: User },
        { id: 'notifications', label: 'الإشعارات', icon: Bell },
        { id: 'appearance', label: 'المظهر', icon: Palette },
        { id: 'subscription', label: 'الاشتراك', icon: Crown },
        { id: 'support', label: 'الدعم', icon: HelpCircle },
    ];

    const colorOptions = [
        { id: 'default', name: 'افتراضي', gradient: 'from-amber-500 to-orange-600', color: '#c0392b' },
        { id: 'amber', name: 'ذهبي', gradient: 'from-amber-400 to-yellow-600', color: '#f59e0b' },
        { id: 'blue', name: 'أزرق نيون', gradient: 'from-blue-500 to-indigo-600', color: '#3b82f6' },
        { id: 'purple', name: 'بنفسجي', gradient: 'from-purple-500 to-violet-600', color: '#8b5cf6' },
        { id: 'green', name: 'زمردي', gradient: 'from-green-500 to-emerald-600', color: '#10b981' },
    ];

    const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${enabled ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-gray-300 dark:bg-gray-700'
                }`}
        >
            <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${enabled ? 'right-1 scale-110' : 'left-1 scale-90'
                    }`}
            >
                {enabled && <Zap size={10} className="text-primary" />}
            </div>
        </button>
    );

    return (
        <div className="p-4 md:p-8 lg:p-12 space-y-6 md:space-y-8 animate-slide-up pb-24 max-w-[1920px] mx-auto min-h-screen font-sans">


            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)]"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                            <Palette size={32} className="text-primary animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">الإعدادات</h1>
                            <p className="text-lg text-indigo-200/70 font-medium">تحكم في أدق تفاصيل تجربتك التعليمية</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Sidebar Navigation */}
                <div className="lg:col-span-3">
                    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] p-4 shadow-xl border border-white/20 dark:border-white/5 sticky top-8">
                        <nav className="space-y-2">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id as any)}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`transition-transform duration-500 ${isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>
                                            <Icon size={22} />
                                        </div>
                                        <span className="font-bold tracking-wide">{section.label}</span>
                                        <ChevronRight size={18} className={`mr-auto transition-transform duration-500 ${isActive ? 'translate-x-1' : 'opacity-0'}`} />
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9 space-y-8">



                    {/* Account Section */}
                    {/* Account Section - Redesigned */}
                    {activeSection === 'account' && (
                        <m.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Section Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                                            <User size={24} />
                                        </div>
                                        إدارة الحساب
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">تحكم في بياناتك الشخصية وتفضيلات الأمان</p>
                                </div>
                                <div className="flex gap-3 flex-wrap justify-end">
                                    {isProSubscriber && (
                                        <div className="px-4 py-2 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm">
                                            <Crown size={14} /> عضو مميز
                                        </div>
                                    )}
                                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-blue-100 dark:border-blue-800">
                                        <Shield size={14} /> حساب موثق
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                {/* Left Column: Profile Card & Quick Stats */}
                                <div className="xl:col-span-8 space-y-6">
                                    {/* Hero Profile Card */}
                                    <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-gray-800 group">
                                        {/* Dynamic Background */}
                                        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500">
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/50 to-transparent"></div>
                                        </div>

                                        <div className="relative pt-24 px-8 pb-8">
                                            <div className="flex flex-col md:flex-row items-end gap-6">
                                                {/* Avatar */}
                                                <div className="relative" onClick={() => fileInputRef.current?.click()}>
                                                    <div className="w-40 h-40 rounded-[2rem] p-1.5 bg-white dark:bg-slate-900 shadow-2xl cursor-pointer group-hover:rotate-3 transition-transform duration-500 ease-out">
                                                        <img
                                                            src={userAvatar}
                                                            alt="Profile"
                                                            className="w-full h-full rounded-[1.8rem] object-cover bg-gray-100"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all z-20"
                                                    >
                                                        <Camera size={20} />
                                                    </button>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleAvatarChange}
                                                        className="hidden"
                                                        accept="image/*"
                                                    />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 pb-2">
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                        <h3 className="text-4xl font-black text-gray-900 dark:text-white">{userName}</h3>
                                                        {isProSubscriber && (
                                                            <span
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 shadow-lg border border-amber-200/70 ring-1 ring-amber-400/30"
                                                                title="مشترك برو"
                                                            >
                                                                <Crown size={15} className="shrink-0" strokeWidth={2.5} />
                                                                برو
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                                                            <Mail size={16} className="text-primary" /> {userEmail}
                                                        </span>
                                                        <span className="flex items-center gap-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                                                            <Globe size={16} className="text-blue-500" /> اللغة العربية
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Big Stat - Real Level */}
                                                <div className="hidden md:block text-center p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-gray-700">
                                                    <div className="text-3xl font-black text-primary mb-1">LVL {userStats?.level ?? 1}</div>
                                                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">المستوى الحالي</div>
                                                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.round(userStats?.xpProgress ?? 0)}%` }} />
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-1 font-bold">{userStats?.totalXP ?? 0} XP</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Read-only account info */}
                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                                <Edit3 size={24} />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white">بيانات الحساب (قراءة فقط)</h3>
                                            <button
                                                onClick={() => setShowEditModal(true)}
                                                className="mr-auto px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm"
                                            >
                                                تعديل
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4">
                                                <p className="text-xs text-gray-400 mb-1">الاسم</p>
                                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                    {userName || '-'}
                                                    {isProSubscriber && (
                                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 border border-amber-200/60">
                                                            <Crown size={11} strokeWidth={2.5} />
                                                            برو
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4"><p className="text-xs text-gray-400 mb-1">الإيميل</p><p className="font-bold text-gray-900 dark:text-white">{userEmail || '-'}</p></div>
                                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4"><p className="text-xs text-gray-400 mb-1">الجنس</p><p className="font-bold text-gray-900 dark:text-white">{userGender === 'male' ? 'ذكر' : userGender === 'female' ? 'أنثى' : '-'}</p></div>
                                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4"><p className="text-xs text-gray-400 mb-1">العمر</p><p className="font-bold text-gray-900 dark:text-white">{userAge || '-'}</p></div>
                                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 md:col-span-2"><p className="text-xs text-gray-400 mb-1">المستوى عند التسجيل</p><p className="font-bold text-gray-900 dark:text-white">{userStartLevel || '-'}</p></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Stats & Security */}
                                <div className="xl:col-span-4 space-y-6">
                                    {/* Stats Grid - Real Data */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* XP Progress */}
                                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-5 text-white shadow-xl shadow-indigo-500/20">
                                            <div className="mb-3 bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md">
                                                <Award size={20} className="text-white" />
                                            </div>
                                            <div className="text-3xl font-black mb-0.5">LVL {userStats?.level ?? 1}</div>
                                            <div className="text-indigo-100 text-xs font-bold mb-2">{userStats?.totalXP ?? 0} XP</div>
                                            <div className="w-full bg-white/20 rounded-full h-1.5">
                                                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.round(userStats?.xpProgress ?? 0)}%` }} />
                                            </div>
                                            <div className="text-white/60 text-[10px] font-bold mt-1">{Math.round(userStats?.xpProgress ?? 0)}% للمستوى التالي</div>
                                        </div>
                                        {/* Stories */}
                                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-xl border border-gray-100 dark:border-gray-700">
                                            <div className="mb-3 bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-xl flex items-center justify-center">
                                                <BookOpen size={20} className="text-blue-500" />
                                            </div>
                                            <div className="text-3xl font-black text-gray-900 dark:text-white mb-0.5">{userStats?.completedStories ?? 0}<span className="text-lg text-gray-400">/{userStats?.totalStories ?? 0}</span></div>
                                            <div className="text-gray-500 dark:text-gray-400 text-xs font-bold">قصة مكتملة</div>
                                        </div>
                                        {/* Lessons */}
                                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-xl border border-gray-100 dark:border-gray-700">
                                            <div className="mb-3 bg-emerald-100 dark:bg-emerald-900/30 w-10 h-10 rounded-xl flex items-center justify-center">
                                                <Target size={20} className="text-emerald-500" />
                                            </div>
                                            <div className="text-3xl font-black text-gray-900 dark:text-white mb-0.5">{userStats?.completedLessons ?? 0}<span className="text-lg text-gray-400">/{userStats?.totalLessons ?? 0}</span></div>
                                            <div className="text-gray-500 dark:text-gray-400 text-xs font-bold">درس مكتمل</div>
                                        </div>
                                        {/* Life Situations */}
                                        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] p-5 text-white shadow-xl shadow-amber-500/20">
                                            <div className="mb-3 bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md">
                                                <Activity size={20} className="text-white" />
                                            </div>
                                            <div className="text-3xl font-black mb-0.5">{userStats?.completedTopics ?? 0}<span className="text-lg text-white/60">/{userStats?.totalTopics ?? 0}</span></div>
                                            <div className="text-orange-100 text-xs font-bold">موقف حياتي</div>
                                        </div>
                                    </div>

                                    {/* Security Card */}
                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white px-2">الأمان والحماية</h3>

                                        {/* Password - Enhanced */}
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                                        <Lock size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-gray-900 dark:text-white text-sm">كلمة المرور</span>
                                                        <span className="text-[10px] font-bold text-gray-400">آخر تحديث: ٣٠ يوم</span>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                                    تغيير
                                                </button>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-green-500 w-3/4 h-full rounded-full"></div>
                                            </div>
                                            <div className="flex justify-between mt-1.5">
                                                <span className="text-[10px] text-gray-400 font-bold">قوة كلمة المرور</span>
                                                <span className="text-[10px] text-green-500 font-bold">قوية جداً</span>
                                            </div>
                                        </div>

                                        {/* 2FA */}
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-500 shadow-sm">
                                                    <Smartphone size={18} />
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-900 dark:text-white text-sm">المصادقة الثنائية</span>
                                                    <span className="text-[10px] font-bold text-gray-400">حماية إضافية</span>
                                                </div>
                                            </div>
                                            <ToggleSwitch enabled={twoFactorEnabled} onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} />
                                        </div>

                                        {/* Active Sessions */}
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">الجلسات النشطة</h4>
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <Globe size={16} />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold text-gray-900 dark:text-white">Windows PC - Chrome</div>
                                                    <div className="text-[10px] font-bold text-blue-500">الجهاز الحالي • القاهرة، مصر</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] p-6 border border-red-100 dark:border-red-900/20 space-y-4">
                                        <h3 className="text-lg font-black text-red-600 dark:text-red-400 px-2 flex items-center gap-2">
                                            <AlertCircle size={20} /> منطقة الخطر
                                        </h3>
                                        <p className="text-xs font-bold text-red-600/70 dark:text-red-400/70 px-2 leading-relaxed">
                                            احذر، الإجراءات هنا لا يمكن التراجع عنها وتؤثر على بياناتك بشكل دائم.
                                        </p>
                                        <div className="flex gap-2">
                                            {onLogout && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDangerModal('logout')}
                                                    className="flex-1 py-3 bg-white dark:bg-red-900/20 text-red-500 rounded-2xl font-bold text-sm shadow-sm border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                >
                                                    تسجيل خروج
                                                </button>
                                            )}
                                            {onDeleteAccount && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDangerModal('delete')}
                                                    className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
                                                >
                                                    حذف الحساب
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    )}


                    {activeSection === 'notifications' && (
                        <div className="space-y-6 animate-fade-in">
                            {deleteAllModalOpen && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" dir="rtl">
                                    <div className="w-full max-w-[520px] bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5 p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                                    حذف كل الإشعارات
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                    انت فعلا عايز تمسحو كل الإشعارات؟
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteAllModalOpen(false)}
                                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10"
                                                aria-label="إلغاء"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {(() => {
                                            const uniqueBroadcastIds = Array.from(
                                                new Set((notifications || []).map((n) => n.broadcastId).filter(Boolean) as string[])
                                            );
                                            const canDeleteForAll = !!localStorage.getItem('hcard_admin_token') && uniqueBroadcastIds.length > 0;
                                            return (
                                                <>
                                                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                                                        <button
                                                            type="button"
                                                            disabled={deleteAllBusy}
                                                            onClick={() => {
                                                                if (!setNotifications) return;
                                                                setNotifications([]);
                                                                setDeleteAllModalOpen(false);
                                                            }}
                                                            className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors disabled:opacity-50"
                                                        >
                                                            مسح عندي فقط
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={!canDeleteForAll || deleteAllBusy}
                                                            onClick={() => {
                                                                if (!setNotifications) return;
                                                                if (!canDeleteForAll) return;

                                                                void (async () => {
                                                                    setDeleteAllBusy(true);
                                                                    try {
                                                                        const ids = uniqueBroadcastIds;
                                                                        for (const bid of ids) {
                                                                            await AdminAPI.deleteBroadcast(bid);
                                                                        }
                                                                        setNotifications([]);
                                                                        setDeleteAllModalOpen(false);
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                    } finally {
                                                                        setDeleteAllBusy(false);
                                                                    }
                                                                })();
                                                            }}
                                                            className="flex-1 py-3 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                                        >
                                                            مسح من عند كل الطلاب
                                                        </button>
                                                    </div>

                                                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                        {canDeleteForAll ? 'سيتم حذف إشعارات البث (Broadcast) لدى جميع الطلاب.' : 'خيار مسح كل الطلاب يتطلب صلاحية مسؤول وجود إشعارات بث.'}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {deleteNotifTarget && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" dir="rtl">
                                    <div className="w-full max-w-[520px] bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5 p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                                    حذف الإشعار
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                    هل تريد حذف هذا الاشعار بالفعل ؟
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteNotifTarget(null)}
                                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10"
                                                aria-label="إلغاء"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                                            <button
                                                type="button"
                                                disabled={deleteNotifBusy}
                                                onClick={() => {
                                                    if (!setNotifications) return;
                                                    setNotifications(notifications.filter((x) => x.id !== deleteNotifTarget.id));
                                                    setDeleteNotifTarget(null);
                                                }}
                                                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors disabled:opacity-50"
                                            >
                                                مسح عندي فقط
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    deleteNotifBusy ||
                                                    !deleteNotifTarget.broadcastId ||
                                                    !localStorage.getItem('hcard_admin_token')
                                                }
                                                onClick={() => {
                                                    if (!deleteNotifTarget.broadcastId) return;
                                                    if (!setNotifications) return;
                                                    const adminToken = localStorage.getItem('hcard_admin_token');
                                                    if (!adminToken) return;

                                                    void (async () => {
                                                        setDeleteNotifBusy(true);
                                                        try {
                                                            await AdminAPI.deleteBroadcast(deleteNotifTarget.broadcastId as string);
                                                            setNotifications(notifications.filter((x) => x.broadcastId !== deleteNotifTarget.broadcastId));
                                                            setDeleteNotifTarget(null);
                                                        } catch (e) {
                                                            // لا يوجد نظام Toast هنا، نكتفي بتسجيل الخطأ في الكونسول
                                                            console.error(e);
                                                        } finally {
                                                            setDeleteNotifBusy(false);
                                                        }
                                                    })();
                                                }}
                                                className="flex-1 py-3 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                            >
                                                مسح من عند كل الطلاب
                                            </button>
                                        </div>

                                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                            خيار مسح كل الطلاب يتطلب صلاحية مسؤول.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                        <Bell className="text-primary" />
                                        الإشعارات
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                                        نفس الإشعارات الظاهرة في أيقونة الجرس — بما فيها ردود فريق الدعم على تذاكرك.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {onRefreshNotifications && setNotifications && (
                                        <button
                                            type="button"
                                            disabled={notifListRefreshing}
                                            onClick={() => {
                                                void (async () => {
                                                    setNotifListRefreshing(true);
                                                    try {
                                                        await Promise.resolve(onRefreshNotifications());
                                                    } finally {
                                                        setNotifListRefreshing(false);
                                                    }
                                                })();
                                            }}
                                            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white/80 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {notifListRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                            تحديث
                                        </button>
                                    )}
                                    {setNotifications && notifications.length > 0 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
                                                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                                            >
                                                <Check size={14} className="inline ml-1" /> تحديد الكل كمقروء
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteAllModalOpen(true)}
                                                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                                            >
                                                <Trash2 size={14} className="inline ml-1" /> مسح الكل
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5 p-6 md:p-8 min-h-[280px]">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-gray-400">
                                        <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                            <Bell size={36} className="opacity-40" />
                                        </div>
                                        <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد إشعارات حالياً</p>
                                        <p className="text-sm mt-2 max-w-sm">عند وصول رد من الدعم أو تنبيهات أخرى ستظهر هنا وفي أيقونة الجرس أعلى الشاشة.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3 max-h-[min(60vh,520px)] overflow-y-auto pr-1 custom-scrollbar">
                                        {notifications.map((n) => (
                                            <li
                                                key={n.id}
                                                className={`relative rounded-2xl border p-4 transition-all ${n.read
                                                    ? 'bg-transparent border-gray-100 dark:border-white/5 opacity-70'
                                                    : 'bg-white dark:bg-slate-800/80 border-indigo-100 dark:border-indigo-900/40 shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${notifTypeGradient(n.type)}`}>
                                                        {notifIconEl(n.icon)}
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-right">
                                                        <div className="flex justify-between items-start gap-2 mb-1">
                                                            <span className="text-[10px] text-gray-400 shrink-0">{n.time}</span>
                                                            <h4 className={`text-sm font-black ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                                {n.title}
                                                            </h4>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">{n.message}</p>
                                                        <div className="flex flex-wrap gap-2 justify-end">
                                                            {!n.read && setNotifications && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                                                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600"
                                                                >
                                                                    تم القراءة
                                                                </button>
                                                            )}
                                                            {n.ticketId && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setActiveSection('support');
                                                                        setIsSupportModalOpen(true);
                                                                    }}
                                                                    className="text-[10px] font-bold text-primary hover:underline"
                                                                >
                                                                    فتح محادثة الدعم
                                                                </button>
                                                            )}
                                                            {setNotifications && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeleteNotifTarget(n)}
                                                                    className="text-[10px] font-bold text-red-400 hover:text-red-500"
                                                                >
                                                                    حذف
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Appearance Section */}
                    {activeSection === 'appearance' && (
                        <div className="space-y-8 animate-fade-in">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <Palette className="text-primary" />
                                تخصيص المظهر
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Color Theme */}
                                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white/20 dark:border-white/5 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <Palette size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">لون التطبيق</h3>
                                            <p className="text-xs text-gray-500 font-medium">اختر اللون الذي يعبر عن شخصيتك</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-3">
                                        {colorOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => setPrimaryColor(option.id as any)}
                                                className={`group relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 ${primaryColor === option.id ? 'ring-4 ring-offset-2 ring-primary dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
                                            >
                                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${option.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                                                {primaryColor === option.id && (
                                                    <Check size={20} className="text-white relative z-10 animate-scale-in" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Size */}
                                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white/20 dark:border-white/5 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <Type size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">حجم الخط</h3>
                                            <p className="text-xs text-gray-500 font-medium">تحكم في حجم النصوص للقراءة المريحة</p>
                                        </div>
                                    </div>

                                    <div className="flex bg-gray-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                                        {[
                                            { id: 'small', label: 'صغير', iconStr: 'A' },
                                            { id: 'medium', label: 'متوسط', iconStr: 'AA' },
                                            { id: 'large', label: 'كبير', iconStr: 'AAA' },
                                        ].map((size) => (
                                            <button
                                                key={size.id}
                                                onClick={() => setFontSize(size.id as any)}
                                                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${fontSize === size.id
                                                    ? 'bg-white dark:bg-slate-700 shadow-md text-primary font-black'
                                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                                    }`}
                                            >
                                                <span className={`leading-none mb-1 ${size.id === 'small' ? 'text-xs' : size.id === 'medium' ? 'text-sm' : 'text-lg'}`}>{size.iconStr}</span>
                                                <span className="text-[10px] font-bold">{size.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>



                            {/* Other Settings Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Dark Mode */}
                                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white/20 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300">
                                            {darkMode ? <Moon size={24} /> : <Sun size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">الوضع الليلي</h3>
                                            <p className="text-xs text-gray-500">مريح للعين في المساء</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch enabled={darkMode} onChange={toggleTheme} />
                                </div>


                            </div>
                        </div>
                    )}

                    {/* Support Section */}
                    {activeSection === 'support' && (
                        <div className="space-y-8 animate-fade-in">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <HelpCircle className="text-primary" />
                                الدعم والمساعدة
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { icon: HelpCircle, label: 'مركز المساعدة', desc: 'أدلة وشروحات شاملة', color: 'blue' },
                                    { icon: MessageSquare, label: 'التواصل المباشر', desc: 'تحدث مع فريقنا الفني', color: 'green' },
                                    { icon: Star, label: 'تقييم تجربتك', desc: 'شاركنا رأيك الموقر', color: 'amber' },
                                    { icon: Globe, label: 'المجتمع الرسمي', desc: 'انضم لطلابنا حول العالم', color: 'purple' },
                                ].map((item, idx) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (item.label === 'التواصل المباشر') setIsSupportModalOpen(true);
                                            }}
                                            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5 text-right group hover:scale-[1.02] transition-all duration-500"
                                        >
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                                <Icon size={28} />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{item.label}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Version Info */}
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5 text-center">
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <SettingsIcon className="text-primary animate-[spin_5s_linear_infinite]" size={40} />
                                </div>
                                <h4 className="text-gray-500 dark:text-gray-400 font-black tracking-widest uppercase text-xs mb-2">Et3alem Bel Araby · v2.2</h4>
                                <p className="text-2xl font-black text-gray-900 dark:text-white mb-6">Pro Education Suite</p>
                            </div>
                        </div>
                    )}

                    {/* Subscription Section */}
                    {activeSection === 'subscription' && (
                        <div className="space-y-8">
                            {isProSubscriber ? (
                                <m.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="max-w-2xl mx-auto rounded-[2.5rem] border border-amber-400/40 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/50 dark:via-slate-900 dark:to-slate-900 p-10 md:p-12 text-center shadow-xl shadow-amber-500/10"
                                >
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 shadow-lg mb-6 mx-auto">
                                        <Crown size={40} strokeWidth={2} className="drop-shadow-sm" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3 leading-snug">
                                        {subscriptionPlan === 'enterprise'
                                            ? 'أنت مشترك بالفعل في باقة الأعمال (Enterprise).'
                                            : 'أنت مشترك بالفعل في باقة البرو.'}
                                    </h2>
                                    <p className="text-gray-600 dark:text-amber-100/80 font-medium mb-6">
                                        تستمتع بجميع مزايا الاشتراك المميز. شكراً لثقتك بنا.
                                    </p>
                                    {planSubscribedAt && planExpiresAt && (
                                        <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-amber-200/60 dark:border-amber-500/20 px-5 py-4 mb-8 text-sm font-bold text-gray-800 dark:text-gray-200">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider mb-2">فترة الاشتراك الحالية</p>
                                            <p className="leading-relaxed">
                                                من{' '}
                                                <span className="text-primary dark:text-amber-400 tabular-nums">
                                                    {new Date(planSubscribedAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </span>
                                                {' '}إلى{' '}
                                                <span className="text-primary dark:text-amber-400 tabular-nums">
                                                    {new Date(planExpiresAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onNavigate('home')}
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:scale-[1.02] transition-transform"
                                    >
                                        <Check size={20} strokeWidth={3} />
                                        الانتقال للرئيسية
                                    </button>
                                </m.div>
                            ) : (
                                <>
                                <div className="max-w-2xl mx-auto mb-8">
                                    <OffersSlider
                                        offers={offersBanners}
                                        onNavigateToSettings={() => { /* already in subscription */ }}
                                    />
                                </div>
                            <div className="text-center space-y-4 mb-10">
                                <m.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 rounded-full font-black text-sm uppercase tracking-widest border border-amber-200 dark:border-amber-800 shadow-sm"
                                >
                                    <Crown size={18} className="animate-pulse" /> العرض الأقوى
                                </m.div>
                                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
                                    انطلق نحو <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-500 to-purple-600">الاحتراف الحقيقي</span>
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
                                    اختر الخطة التي تناسب طموحك. ابدأ مجاناً أو استثمر في مستقبلك مع باقة القمة.
                                </p>
                                {activeMethods.length > 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-bold">
                                        وسائل الدفع المتاحة بعد الاشتراك:{' '}
                                        {activeMethods.map((m) =>
                                            m === 'vodafone_cash' ? 'فودافون كاش' :
                                            m === 'instapay' ? 'إنستاباي' :
                                            m === 'fawry' ? 'فوري' : m
                                        ).join(' · ')}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                {/* Free Plan Card */}
                                <m.div
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-8 md:p-10 border border-gray-200 dark:border-gray-800 relative overflow-hidden group hover:bg-white dark:hover:bg-slate-900 transition-colors duration-500"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>

                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-black text-gray-500 dark:text-gray-400 mb-2">الباقة المجانية</h3>
                                        <div className="text-4xl font-black text-gray-800 dark:text-white mb-6">
                                            0 <span className="text-lg text-gray-400">جم</span>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 font-bold mb-8 h-12">
                                            خطوتك الأولى لاكتشاف شغف اللغة.
                                        </p>

                                        <div className="space-y-4 mb-10">
                                            {[
                                                { text: "نظام الكروت الذكية (SRS)", enabled: true },
                                                { text: "2 قصة تفاعلية يومياً", enabled: true },
                                                { text: "2 درس فيديو يومياً", enabled: true },
                                                { text: "يحتوي على إعلانات", enabled: true, isNegative: true },
                                                { text: "المعلم الصوتي (AI)", enabled: false },
                                                { text: "مخطط المذاكرة الشخصي", enabled: false },
                                            ].map((feature, idx) => (
                                                <div key={idx} className={`flex items-center gap-3 ${feature.enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-700'}`}>
                                                    {feature.enabled ? (
                                                        feature.isNegative ? (
                                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                                                                <AlertCircle size={14} />
                                                            </div>
                                                        ) : (
                                                            <Check size={20} className="text-green-500 shrink-0" />
                                                        )
                                                    ) : (
                                                        <X size={20} className="shrink-0" />
                                                    )}
                                                    <span className={`font-bold text-sm ${feature.isNegative ? 'text-gray-400 text-xs' : ''}`}>{feature.text}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => onNavigate('home')}
                                            className="w-full py-4 rounded-2xl font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            باقتك الحالية
                                        </button>
                                    </div>
                                </m.div>

                                {paymentSettings.plans?.map((plan) => (
                                    <m.div
                                        key={plan.id}
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className={`bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden transform hover:-translate-y-2 transition-all duration-500 border border-${plan.theme}-500/20`}
                                        style={{ boxShadow: `0 25px 50px -12px ${plan.theme === 'amber' ? 'rgba(245, 158, 11, 0.25)' : plan.theme === 'blue' ? 'rgba(59, 130, 246, 0.25)' : plan.theme === 'purple' ? 'rgba(139, 92, 246, 0.25)' : plan.theme === 'red' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}` }}
                                    >
                                        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br from-${plan.theme}-500/20 to-transparent opacity-50`}></div>
                                        <div className={`absolute -right-20 -top-20 w-64 h-64 bg-${plan.theme}-500/40 rounded-full blur-[80px]`}></div>

                                        {plan.isPopular && (
                                            <div className="absolute top-6 left-6 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg animate-pulse">
                                                الأكثر طلباً
                                            </div>
                                        )}

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Crown size={28} className={`text-${plan.theme}-400 fill-${plan.theme}-400`} />
                                                <h3 className="text-2xl font-black text-white dark:text-gray-900">{plan.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="text-5xl font-black text-white dark:text-gray-900 leading-tight">
                                                    {plan.price} <span className="text-xl text-gray-400 dark:text-gray-500">جنيه</span>
                                                </div>
                                                {plan.originalPrice && plan.originalPrice > plan.price && (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-xl font-bold text-gray-500 dark:text-gray-400 line-through decoration-red-500/50 opacity-60">
                                                            {plan.originalPrice} جم
                                                        </div>
                                                        <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full text-center shadow-lg shadow-red-500/20 animate-pulse">
                                                            خصم {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-indigo-200 dark:text-indigo-800 font-bold mb-8 h-12 text-sm leading-relaxed">
                                                {plan.description}
                                            </p>

                                            <div className="space-y-5 mb-10">
                                                {plan.features.map((feature, idx) => (
                                                    <div key={idx} className={`flex items-start gap-3 ${!feature.isEnabled ? 'opacity-50' : ''}`}>
                                                        <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-lg ${feature.isEnabled ? `bg-${plan.theme}-500 text-white` : 'bg-gray-700 text-gray-400'}`}>
                                                            {feature.isEnabled ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                                                        </div>
                                                        <div>
                                                            <span className="block font-black text-md">{feature.text}</span>
                                                            {feature.subText && <span className="text-xs text-gray-400 dark:text-gray-600 font-bold">{feature.subText}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setSelectedPlan(plan);
                                                    setPaymentStep(1);
                                                    setShowPaymentModal(true);
                                                }}
                                                className={`w-full py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-${plan.theme}-500 to-${plan.theme}-600 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group`}
                                            >
                                                اشترك الآن
                                                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                                            </button>
                                            <p className="text-center mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-70">
                                                ضمان استرداد الأموال لمدة 7 أيام
                                            </p>
                                        </div>
                                    </m.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
                                {[
                                    {
                                        icon: Shield,
                                        label: 'دفع آمن 100%',
                                        color: 'group-hover:text-emerald-500',
                                        bg: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10',
                                        border: 'group-hover:border-emerald-200 dark:group-hover:border-emerald-800',
                                        iconAnim: { scale: 1.05 }
                                    },
                                    {
                                        icon: Zap,
                                        label: 'تفعيل فوري',
                                        color: 'group-hover:text-amber-500',
                                        bg: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-900/10',
                                        border: 'group-hover:border-amber-200 dark:group-hover:border-amber-800',
                                        iconAnim: { rotate: [0, -15, 15, -15, 0], scale: 1.2, transition: { duration: 0.5 } }
                                    },
                                    {
                                        icon: Star,
                                        label: 'جودة عالمية',
                                        color: 'group-hover:text-purple-500',
                                        bg: 'group-hover:bg-purple-50 dark:group-hover:bg-purple-900/10',
                                        border: 'group-hover:border-purple-200 dark:group-hover:border-purple-800',
                                        iconAnim: { rotate: 360, scale: 1.2, transition: { duration: 0.6, ease: "backOut" } }
                                    },
                                    {
                                        icon: Crown,
                                        label: 'دعم VIP',
                                        color: 'group-hover:text-red-500',
                                        bg: 'group-hover:bg-red-50 dark:group-hover:bg-red-900/10',
                                        border: 'group-hover:border-red-200 dark:group-hover:border-red-800',
                                        iconAnim: { y: -5, scale: 1.2, transition: { yoyo: Infinity, duration: 0.3 } }
                                    }
                                ].map((item, idx) => (
                                    <m.div
                                        key={idx}
                                        whileHover="hover"
                                        initial="initial"
                                        variants={{
                                            hover: { scale: 1.05, y: -5 },
                                            initial: { scale: 1, y: 0 }
                                        }}
                                        className={`group flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent transition-all duration-300 cursor-default ${item.bg} ${item.border}`}
                                    >
                                        <m.div variants={{ hover: (item.iconAnim || { scale: 1.2 }) as any }}>
                                            <item.icon size={20} className={`text-gray-400 transition-colors duration-300 ${item.color}`} />
                                        </m.div>
                                        <span className={`font-bold text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300 ${item.color}`}>{item.label}</span>
                                    </m.div>
                                ))}
                            </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" dir="rtl">
                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                        <m.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }} className="relative w-full max-w-2xl rounded-[2rem] bg-white dark:bg-slate-900 border border-white/10 shadow-2xl p-6 md:p-8">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">تعديل البيانات</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500">الاسم</label>
                                    <input value={userName} maxLength={NAME_LIMIT} onChange={(e) => setUserName(e.target.value.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, ''))} className="w-full rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-900 dark:text-white outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500">الإيميل (غير قابل للتعديل)</label>
                                    <input value={userEmail} disabled className="w-full rounded-xl bg-gray-100 dark:bg-slate-800/70 border border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500">الجنس</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setUserGender('male')} className={`flex-1 py-3 rounded-xl font-bold ${userGender === 'male' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>ذكر</button>
                                        <button type="button" onClick={() => setUserGender('female')} className={`flex-1 py-3 rounded-xl font-bold ${userGender === 'female' ? 'bg-rose-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>أنثى</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500">العمر</label>
                                    <input type="number" min={5} max={100} value={userAge} onChange={(e) => setUserAge(e.target.value)} className="w-full rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 px-4 py-3 text-gray-900 dark:text-white outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold">إلغاء</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 rounded-xl bg-primary text-white font-bold disabled:opacity-60">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        ></m.div>

                        <m.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-2xl border border-white/20 overflow-hidden"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-red-600 to-red-800 opacity-10"></div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl"></div>

                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors z-20"
                            >
                                <X size={20} />
                            </button>

                            <div className="relative z-10">
                                {paymentStep === 1 ? (
                                    <m.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-8"
                                    >
                                        <div className="text-center">
                                            <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center text-red-600 mb-6 shadow-xl shadow-red-500/10">
                                                <Wallet size={40} />
                                            </div>
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">اختر وسيلة الدفع</h3>
                                            <p className="text-gray-500 dark:text-gray-400 font-bold">كل الطرق آمنة 100%</p>
                                        </div>

                                        <div className="space-y-4">
                                            {activeMethods.length === 0 && (
                                                <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                                    <p className="text-gray-500 font-bold">عذراً، لا توجد طرق دفع متاحة حالياً.</p>
                                                </div>
                                            )}

                                            {activeMethods.map((methodId) => {
                                                if (methodId === 'vodafone_cash') {
                                                    return (
                                                        <button
                                                            key="vf"
                                                            onClick={() => { setSelectedMethod('vodafone_cash'); setPaymentStep(2); }}
                                                            className="w-full group relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-1 rounded-[2rem] transition-all duration-300 shadow-xl hover:shadow-red-600/30 transform hover:-translate-y-1"
                                                        >
                                                            <div className="relative bg-transparent p-5 rounded-[1.8rem] flex items-center gap-5">
                                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-lg">
                                                                    <Smartphone size={24} />
                                                                </div>
                                                                <div className="text-right flex-1">
                                                                    <span className="block text-xl font-black mb-1">فودافون كاش</span>
                                                                    <span className="text-xs font-bold text-red-100 bg-red-800/30 px-2 py-1 rounded-lg inline-block">الأسرع والأسهل ⚡</span>
                                                                </div>
                                                                <ChevronRight size={24} className="rtl:rotate-180" />
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                                if (methodId === 'instapay') {
                                                    return (
                                                        <button
                                                            key="insta"
                                                            onClick={() => { setSelectedMethod('instapay'); setPaymentStep(2); }}
                                                            className="w-full group relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white p-1 rounded-[2rem] transition-all duration-300 shadow-xl hover:shadow-purple-600/30 transform hover:-translate-y-1"
                                                        >
                                                            <div className="relative bg-transparent p-5 rounded-[1.8rem] flex items-center gap-5">
                                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-lg">
                                                                    <Zap size={24} />
                                                                </div>
                                                                <div className="text-right flex-1">
                                                                    <span className="block text-xl font-black mb-1">انستا باي (InstaPay)</span>
                                                                    <span className="text-xs font-bold text-purple-100 bg-purple-800/30 px-2 py-1 rounded-lg inline-block">تحويل بنكي فوري 🏦</span>
                                                                </div>
                                                                <ChevronRight size={24} className="rtl:rotate-180" />
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                                if (methodId === 'fawry') {
                                                    return (
                                                        <button
                                                            key="fawry"
                                                            onClick={() => { setSelectedMethod('fawry'); setPaymentStep(2); }}
                                                            className="w-full group relative overflow-hidden bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white p-1 rounded-[2rem] transition-all duration-300 shadow-xl hover:shadow-orange-600/30 transform hover:-translate-y-1"
                                                        >
                                                            <div className="relative bg-transparent p-5 rounded-[1.8rem] flex items-center gap-5">
                                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-lg">
                                                                    <Banknote size={24} />
                                                                </div>
                                                                <div className="text-right flex-1">
                                                                    <span className="block text-xl font-black mb-1">فوري (Fawry)</span>
                                                                    <span className="text-xs font-bold text-orange-100 bg-orange-800/30 px-2 py-1 rounded-lg inline-block">متوفر في كل مكان 🏪</span>
                                                                </div>
                                                                <ChevronRight size={24} className="rtl:rotate-180" />
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </m.div>
                                ) : (
                                    <m.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="text-center">
                                            <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-6 shadow-xl animate-bounce ${selectedMethod === 'vodafone_cash' ? 'bg-red-100 text-red-600 shadow-red-500/10' : selectedMethod === 'instapay' ? 'bg-purple-100 text-purple-600 shadow-purple-500/10' : 'bg-orange-100 text-orange-600 shadow-orange-500/10'}`}>
                                                <Check size={40} />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                                {selectedMethod === 'vodafone_cash' ? 'تحويل فودافون كاش' : selectedMethod === 'instapay' ? 'تحويل انستا باي' : 'كود فوري'}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm max-w-xs mx-auto">
                                                {selectedMethod === 'fawry' ? 'استخدم الكود التالي للدفع' : 'حول المبلغ المطلوب وسنقوم بتفعيل حسابك فوراً'}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-white/5 rounded-[2rem] p-6 space-y-6 border border-gray-100 dark:border-white/5 relative overflow-hidden">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                                                        كود خصم (اختياري)
                                                    </label>
                                                    {couponDiscountPercentage != null && (
                                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                            خصم {couponDiscountPercentage}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={couponCodeInput}
                                                        onChange={(e) => {
                                                            setCouponCodeInput(e.target.value.toUpperCase());
                                                            setCouponApplyError(null);
                                                            setCouponDiscountPercentage(null);
                                                            setAppliedCouponCode(null);
                                                        }}
                                                        placeholder="مثال: EGYPT20"
                                                        className="flex-1 rounded-2xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 px-4 py-3 text-gray-900 dark:text-gray-200 font-mono font-bold outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleApplyCoupon()}
                                                        disabled={couponApplying || !couponCodeInput.trim()}
                                                        className="px-4 py-3 rounded-2xl font-black bg-primary text-white hover:scale-[1.02] transition-transform disabled:opacity-60"
                                                    >
                                                        {couponApplying ? 'جاري التحقق...' : 'تطبيق'}
                                                    </button>
                                                </div>

                                                {couponApplyError && (
                                                    <p className="text-xs font-bold text-red-500">{couponApplyError}</p>
                                                )}
                                                {activeOfferBanner?.relatedCouponCode && !couponCodeInput.trim() && (
                                                    <p className="text-[10px] font-bold text-gray-400">
                                                        كوبون مرتبط متاح: <span className="font-mono">{activeOfferBanner.relatedCouponCode}</span>
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                                                <span className="text-gray-500 dark:text-gray-400 font-bold">المبلغ المطلوب ({selectedPlan?.name || 'الباقة'})</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-2xl font-black text-primary">{discountedPlanPrice} جنيه</span>
                                                    {couponDiscountPercentage != null && (
                                                        <span className="text-xs font-bold text-gray-400 line-through decoration-red-500/50">
                                                            {planBasePrice} جنيه
                                                        </span>
                                                    )}
                                                    {selectedPlan?.originalPrice && selectedPlan.originalPrice > selectedPlan.price && (
                                                        <span className="text-xs font-bold text-gray-400 line-through decoration-red-500/50">{selectedPlan.originalPrice} جنيه</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2 block">
                                                    {selectedMethod === 'vodafone_cash' ? 'رقم المحفظة' : selectedMethod === 'instapay' ? 'عنوان الدفع (VPA) / الرقم' : 'رقم المرجعي (Fawry Ref)'}
                                                </label>
                                                <div className="flex items-center gap-3 bg-white dark:bg-black/20 p-4 rounded-2xl border border-gray-200 dark:border-white/10 group hover:border-primary/50 transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        const val = selectedMethod === 'vodafone_cash' ? paymentSettings.vodafoneCash.number :
                                                            selectedMethod === 'instapay' ? paymentSettings.instapay.number :
                                                                paymentSettings.fawry.number;
                                                        navigator.clipboard.writeText(val);
                                                        // Could add a toast here
                                                    }}>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${selectedMethod === 'vodafone_cash' ? 'bg-red-500' : selectedMethod === 'instapay' ? 'bg-purple-600' : 'bg-orange-500'}`}>
                                                        {selectedMethod === 'vodafone_cash' ? <Smartphone size={20} /> : selectedMethod === 'instapay' ? <Zap size={20} /> : <Banknote size={20} />}
                                                    </div>
                                                    <span className="flex-1 text-xl font-black text-gray-800 dark:text-gray-200 font-mono tracking-wider">
                                                        {selectedMethod === 'vodafone_cash' ? paymentSettings.vodafoneCash.number :
                                                            selectedMethod === 'instapay' ? paymentSettings.instapay.number :
                                                                paymentSettings.fawry.number}
                                                    </span>
                                                    <button className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl text-gray-500 hover:text-primary transition-colors">
                                                        <Copy size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Custom Instructions */}
                                            {(selectedMethod === 'vodafone_cash' && paymentSettings.vodafoneCash.instruction) ||
                                                (selectedMethod === 'instapay' && paymentSettings.instapay.instruction) ||
                                                (selectedMethod === 'fawry' && paymentSettings.fawry.instruction) ? (
                                                <div className="text-xs bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 leading-relaxed font-semibold">
                                                    {selectedMethod === 'vodafone_cash' ? paymentSettings.vodafoneCash.instruction :
                                                        selectedMethod === 'instapay' ? paymentSettings.instapay.instruction :
                                                            paymentSettings.fawry.instruction}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-4 rounded-2xl flex gap-3">
                                            <AlertCircle size={20} className="text-amber-500 shrink-0" />
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                                {selectedMethod === 'fawry' ? 'يرجى الدفع في أقرب ماكينة فوري خلال 24 ساعة.' : 'بعد التحويل، يرجى إرسال "صورة الإيصال" أو "رقم العملية" عبر واتساب لنفس الرقم لتفعيل حسابك.'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setPaymentStep(1)}
                                                className="py-4 rounded-2xl font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200"
                                            >
                                                رجوع
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    // We use the Vodafone Cash number as the primary support contact for receiving payment proofs
                                                    const supportNumber = paymentSettings.vodafoneCash?.number || "01000000000";

                                                    const method = selectedMethod === 'instapay' ? 'Instapay' :
                                                        selectedMethod === 'fawry' ? 'Fawry' : 'Vodafone Cash';

                                                    const planName = selectedPlan?.name || 'الباقة';
                                                    const typedCoupon = couponCodeInput.trim();
                                                    if (typedCoupon && couponDiscountPercentage == null) {
                                                        setCouponApplyError('من فضلك اضغط تطبيق على الكود قبل تأكيد الدفع');
                                                        return;
                                                    }

                                                    const couponCodeToUse = couponDiscountPercentage != null
                                                        ? (appliedCouponCode || typedCoupon || null)
                                                        : null;

                                                    const planPrice = discountedPlanPrice;

                                                    try {
                                                        await PaymentsAPI.createSession({
                                                            planId: selectedPlan?.id || 'default_pro',
                                                            planPrice: planBasePrice,
                                                            couponCode: couponCodeToUse,
                                                            paymentMethod: selectedMethod,
                                                        });
                                                    } catch {
                                                        // استمرار حتى لو فشل تسجيل الجلسة (الدفع عبر واتساب)
                                                    }

                                                    const couponText = couponDiscountPercentage != null && couponCodeToUse
                                                        ? `\nخصم كود (${couponCodeToUse}): ${couponDiscountPercentage}%`
                                                        : '';

                                                    const message = `مرحباً، لقد اخترت الدفع عن طريق ${method} وعايز أفعل اشتراك ${planName} (سعر الباقة بعد الخصم: ${planPrice} جنيه).${couponText}\nمرفق صورة الإيصال.`;

                                                    const encodedMessage = encodeURIComponent(message);

                                                    // Ensure the number is formatted for wa.me (assuming stored as 01xxxxxxxx)
                                                    const whatsappUrl = `https://wa.me/2${supportNumber}?text=${encodedMessage}`;

                                                    window.open(whatsappUrl, '_blank');
                                                }}
                                                className="py-4 rounded-2xl font-black bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare size={18} />
                                                تأكيد عبر واتساب
                                            </button>
                                        </div>
                                    </m.div>
                                )}
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {dangerModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => !deleteAccountBusy && setDangerModal(null)}
                        aria-hidden
                    />
                    <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in border border-white/10">
                        <div className="absolute top-0 left-0 w-full h-40 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-800">
                            <div className="absolute inset-0 opacity-30">
                                <div className="absolute bottom-0 left-0 w-[200%] h-24 bg-white/10 animate-wave opacity-50" />
                                <div className="absolute bottom-0 left-[-100%] w-[200%] h-24 bg-white/10 animate-wave-delay opacity-30" />
                            </div>
                        </div>
                        <div className="relative p-8 pt-28">
                            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-[6px] bg-white dark:bg-gray-800 border-white dark:border-gray-700">
                                    {dangerModal === 'logout' ? (
                                        <LogOut size={36} className="text-red-500" />
                                    ) : (
                                        <Trash2 size={36} className="text-red-500" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center mb-8 mt-6">
                                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 mb-3">
                                    <span className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase">{userName}</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">
                                    {dangerModal === 'logout' ? 'تسجيل الخروج؟' : 'حذف الحساب نهائياً؟'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed px-4">
                                    {dangerModal === 'logout'
                                        ? 'سيتم إنهاء جلستك الحالية. هل أنت متأكد من رغبتك في المغادرة؟'
                                        : 'سيتم حذف حسابك وجميع البيانات المرتبطة به من الخادم. لا يمكن التراجع عن هذا الإجراء.'}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    disabled={deleteAccountBusy && dangerModal === 'delete'}
                                    onClick={() => setDangerModal(null)}
                                    className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    إلغاء
                                </button>
                                {dangerModal === 'logout' ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDangerModal(null);
                                            onLogout?.();
                                        }}
                                        className="flex-1 px-6 py-4 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/30"
                                    >
                                        <LogOut size={20} />
                                        <span>تأكيد الخروج</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={deleteAccountBusy}
                                        onClick={async () => {
                                            if (!onDeleteAccount) return;
                                            setDeleteAccountBusy(true);
                                            const res = await onDeleteAccount();
                                            setDeleteAccountBusy(false);
                                            if (res.success) setDangerModal(null);
                                        }}
                                        className="flex-1 px-6 py-4 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-800 shadow-red-600/30 disabled:opacity-60"
                                    >
                                        <Trash2 size={20} />
                                        <span>{deleteAccountBusy ? 'جاري الحذف…' : 'تأكيد الحذف'}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SupportModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
                userName={userName}
            />
        </div >
    );
};