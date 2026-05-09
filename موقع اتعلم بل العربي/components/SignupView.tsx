import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader, ArrowLeft, Home, Sun, Moon, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { authService } from '../services/authService';
import { User as UserType } from '../types';

interface SignupViewProps {
    onSignupSuccess: (user: UserType) => void;
    onNavigateToLogin: () => void;
    onBackToHome: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    langAvailability: any;
}

export const SignupView: React.FC<SignupViewProps> = ({ onSignupSuccess, onNavigateToLogin, onBackToHome, isDarkMode, toggleTheme, langAvailability }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(1);
    const [tempUser, setTempUser] = useState<UserType | null>(null);
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [age, setAge] = useState('');
    const [onboardingLoading, setOnboardingLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password || !confirmPassword) {
            setError('يرجى ملء جميع الحقول');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setLoading(true);

        try {
            const result = await authService.signup(name, email, password);
            if (result.success && result.user) {
                setTempUser(result.user);
                setShowOnboardingModal(true);
            } else {
                setError(result.error || 'فشل إنشاء الحساب');
            }
        } catch (err) {
            setError('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    const handleInfoSubmit = () => {
        if (!gender || !age || isNaN(Number(age)) || Number(age) < 5 || Number(age) > 100) {
            setError('يرجى إدخال جنس وعمر صحيحين');
            return;
        }
        setError('');
        setOnboardingStep(2);
    };

    const handleLevelSelection = async (level: string) => {
        if (!tempUser) return;
        const canEn = (langAvailability?.en ?? true) === true;
        const canDe = (langAvailability?.de ?? true) === true;
        const targetLanguage = canEn ? 'en' : (canDe ? 'de' : null);
        if (!targetLanguage) {
            setError('اللغات غير متاحة حالياً — يرجى المحاولة لاحقاً');
            return;
        }
        setOnboardingLoading(true);
        const finalUser: UserType = {
            ...tempUser,
            // الافتراضي حسب توافر اللغات من المسئول
            targetLanguage,
            gender: gender as 'male' | 'female',
            age: Number(age),
            startLevel: level
        };
        const updateRes = await authService.updateProfile({
            gender: finalUser.gender,
            age: finalUser.age,
            startLevel: finalUser.startLevel,
            targetLanguage: finalUser.targetLanguage,
        });
        if (!updateRes.success || !updateRes.user) {
            setError(updateRes.error || 'تعذر حفظ البيانات');
            setOnboardingLoading(false);
            return;
        }
        onSignupSuccess(updateRes.user);
        setOnboardingLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-900" dir="rtl">

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 left-4 md:top-6 md:left-6 z-50 p-2 md:p-2.5 rounded-full bg-stone-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow-sm"
            >
                {isDarkMode ? <Sun size={18} className="text-amber-400 md:w-5 md:h-5" /> : <Moon size={18} className="text-blue-600 md:w-5 md:h-5" />}
            </button>

            {/* LEFT SIDE: Branding */}
            <div className="hidden lg:flex w-1/2 relative bg-[#0f172a] overflow-hidden flex-col justify-between p-12">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <button onClick={onBackToHome} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition group">
                        <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20"><ArrowRight size={20} /></div>
                        <span className="font-bold">العودة للرئيسية</span>
                    </button>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="group cursor-pointer mb-10"
                    >
                        <Logo variant="bilingual" size="lg" className="[&_span:last-child]:!text-white" />
                    </motion.div>
                    <h1 className="text-5xl font-black text-white leading-tight mb-6">
                        انضم لمجتمع <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">المتعلمين الأذكياء</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                        ابدأ رحلتك اليوم واحصل على تجربة تعليمية مخصصة بالكامل لاحتياجاتك.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-12 relative min-h-[100dvh] lg:min-h-0">

                <button onClick={onBackToHome} className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
                    <Home size={22} />
                </button>

                <div className="w-full max-w-md animate-fade-in mt-16 md:mt-0 mb-8 md:mb-0">
                    <div className="text-right mb-6 md:mb-8 text-center lg:text-right">
                        <div className="hidden lg:flex justify-end mb-6">
                            <Logo variant="bilingual" size="md" blueOnDesktop />
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:hidden flex justify-center mb-8"
                        >
                            <Logo variant="bilingual" size="md" centered blueOnDesktop />
                        </motion.div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2">إنشاء حساب جديد</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">سجل الآن واستمتع بكافة مميزات التطبيق مجاناً.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                        {((langAvailability?.en ?? true) === false || (langAvailability?.de ?? true) === false) && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-xs md:text-sm font-bold text-center">
                                {((langAvailability?.en ?? true) === false && (langAvailability?.de ?? true) === false)
                                    ? 'حالياً: كل اللغات مقفولة من الإدارة'
                                    : ((langAvailability?.en ?? true) === false
                                        ? 'الإنجليزية غير متاحة حالياً'
                                        : 'الألمانية غير متاحة حالياً')}
                            </div>
                        )}
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">الاسم الكامل</label>
                            <div className="relative">
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 md:py-4 pr-10 md:pr-12 pl-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition dark:text-white font-bold text-sm md:text-base" placeholder="أحمد محمد" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                            <label className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="email" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 md:py-4 pr-10 md:pr-12 pl-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition dark:text-white font-bold text-sm md:text-base" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                            <label className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">كلمة المرور</label>
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="password" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 md:py-4 pr-10 md:pr-12 pl-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition dark:text-white font-bold text-sm md:text-base" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                            <label className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">تأكيد كلمة المرور</label>
                            <div className="relative">
                                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="password" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 md:py-4 pr-10 md:pr-12 pl-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition dark:text-white font-bold text-sm md:text-base" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2.5 md:p-3 rounded-lg text-xs md:text-sm font-bold text-center animate-shake">{error}</div>
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-green-600/30 flex items-center justify-center gap-2">
                            {loading ? <Loader className="animate-spin w-5 h-5" /> : <><span>إنشاء حساب</span> <ArrowLeft className="rtl:rotate-0 w-5 h-5" size={20} /></>}
                        </button>
                    </form>

                    <p className="text-center mt-6 md:mt-8 text-gray-500 text-xs md:text-sm pb-8 md:pb-0">
                        لديك حساب بالفعل؟ <button onClick={onNavigateToLogin} className="text-green-600 font-bold hover:underline">تسجيل الدخول</button>
                    </p>
                </div>
            </div>

            {/* ONBOARDING MODAL */}
            {showOnboardingModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-[2rem] p-6 md:p-10 shadow-2xl border border-stone-200 dark:border-gray-700 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 md:h-2 bg-gradient-to-r from-green-500 to-blue-500"></div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2">أهلاً بك يا {tempUser?.name}!</h2>

                        {onboardingStep === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mt-6 text-right">
                                <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-6 font-medium text-center">دعنا نخصص تجربتك. أخبرنا المزيد عن نفسك:</p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">الجنس</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setGender('male')}
                                                className={`p-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 ${gender === 'male' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-transparent text-gray-600 dark:text-gray-400'}`}
                                            >
                                                <span>👨‍🎓</span> فتى
                                            </button>
                                            <button
                                                onClick={() => setGender('female')}
                                                className={`p-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 ${gender === 'female' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600' : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 bg-transparent text-gray-600 dark:text-gray-400'}`}
                                            >
                                                <span>👩‍🎓</span> فتاة
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">العمر</label>
                                        <input
                                            type="number"
                                            min="5" max="100"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 outline-none focus:border-green-500 transition dark:text-white font-bold text-center"
                                            placeholder="أدخل عمرك"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleInfoSubmit}
                                    className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition"
                                >
                                    التالي
                                </button>
                            </motion.div>
                        )}

                        {onboardingStep === 2 && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mt-6">
                                <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-6 font-medium">ما هو مستواك الحالي في اللغة العربية؟</p>

                                <div className="space-y-3">
                                    <button disabled={onboardingLoading} onClick={() => handleLevelSelection('beginner')} className="w-full group p-4 rounded-2xl border-2 border-stone-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 bg-stone-50 dark:bg-gray-800 transition flex items-center gap-4 text-right disabled:opacity-50">
                                        <span className="text-3xl md:text-4xl shrink-0">🌱</span>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white text-lg">مبتدئ (صفر)</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">أحتاج تعلم الحروف والأساسيات</div>
                                        </div>
                                    </button>

                                    <button disabled={onboardingLoading} onClick={() => handleLevelSelection('intermediate')} className="w-full group p-4 rounded-2xl border-2 border-stone-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 bg-stone-50 dark:bg-gray-800 transition flex items-center gap-4 text-right disabled:opacity-50">
                                        <span className="text-3xl md:text-4xl shrink-0">🚀</span>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white text-lg">متوسط</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">أستطيع تكوين جمل بسيطة</div>
                                        </div>
                                    </button>

                                    <button disabled={onboardingLoading} onClick={() => handleLevelSelection('advanced')} className="w-full group p-4 rounded-2xl border-2 border-stone-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 bg-stone-50 dark:bg-gray-800 transition flex items-center gap-4 text-right disabled:opacity-50">
                                        <span className="text-3xl md:text-4xl shrink-0">🦅</span>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white text-lg">متقدم</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">أريد إتقان الفصاحة والأدب</div>
                                        </div>
                                    </button>
                                </div>
                                <button
                                    onClick={() => setOnboardingStep(1)}
                                    disabled={onboardingLoading}
                                    className="mt-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition"
                                >
                                    رجوع
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
