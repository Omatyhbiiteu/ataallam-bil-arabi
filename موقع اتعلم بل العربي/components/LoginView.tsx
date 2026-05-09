import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader, CheckCircle, ArrowLeft, Home, Sun, Moon, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { authService } from '../services/authService';
import { User, LanguageAvailability } from '../types';

interface LoginViewProps {
    onLoginSuccess: (user: User) => void;
    onBackToHome: () => void;
    onNavigateToSignup: () => void;
    onForgotPassword: (emailFromLoginField: string) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    langAvailability: LanguageAvailability;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBackToHome, onNavigateToSignup, onForgotPassword, isDarkMode, toggleTheme, langAvailability }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [tempUser, setTempUser] = useState<User | null>(null);
    const [langSaving, setLangSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await authService.login(email, password);
            if (result.success && result.user) {
                setTempUser(result.user);
                setShowLanguageModal(true);
            } else {
                setError(result.error || 'فشل تسجيل الدخول');
            }
        } catch (err) {
            setError('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageSelection = async (lang: 'en' | 'de') => {
        if (!tempUser || langSaving) return;
        setLangSaving(true);
        try {
            const res = await authService.updateProfile({ targetLanguage: lang });
            const finalUser: User = res.success && res.user ? res.user : { ...tempUser, targetLanguage: lang };
            setShowLanguageModal(false);
            onLoginSuccess(finalUser);
        } finally {
            setLangSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-900" dir="rtl">

            <button
                onClick={toggleTheme}
                className="absolute top-4 left-4 md:top-6 md:left-6 z-50 p-2 md:p-2.5 rounded-full bg-stone-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow-sm"
                title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
                {isDarkMode ? <Sun size={18} className="text-amber-400 md:w-5 md:h-5" /> : <Moon size={18} className="text-blue-600 md:w-5 md:h-5" />}
            </button>

            {/* LEFT SIDE */}
            <div className="hidden lg:flex w-1/2 relative bg-[#0f172a] overflow-hidden flex-col justify-between p-12">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-3xl"></div>
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
                        تعلم اللغات <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">بذكاء واحترافية</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                        استخدم قوة الذاكرة المتباعدة (SRS) والذكاء الاصطناعي لإتقان أي لغة في وقت قياسي.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-12 relative min-h-[100dvh] lg:min-h-0">

                <button onClick={onBackToHome} className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
                    <Home size={22} />
                </button>

                <div className="w-full max-w-md animate-fade-in mt-16 md:mt-0 mb-8 md:mb-0">
                    <div className="text-right mb-6 md:mb-8 text-center lg:text-right">
                        <div className="hidden lg:flex justify-end mb-6">
                            <Logo variant="bilingual" size="md" blueOnDesktop />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 hidden lg:block">تسجيل الدخول</h2>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:hidden text-center mb-10"
                        >
                            <div className="flex justify-center mb-4">
                                <Logo variant="bilingual" size="md" animated centered blueOnDesktop />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">مرحباً بك مجدداً</h2>
                        </motion.div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base text-center lg:text-right">أدخل بياناتك للمتابعة حيث توقفت.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                        <div className="space-y-1.5 md:space-y-2">
                            <label className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 md:py-4 pr-10 md:pr-12 pl-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition dark:text-white font-bold text-sm md:text-base"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">كلمة المرور</label>
                                <button type="button" onClick={() => onForgotPassword(email.trim())} className="text-[10px] md:text-xs font-bold text-primary hover:underline focus:outline-none">نسيت كلمة المرور؟</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 md:py-4 pr-10 md:pr-12 pl-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition dark:text-white font-bold text-sm md:text-base"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {authService.isMockMode && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3 mb-6 animate-pulse">
                                <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-amber-800 dark:text-amber-300 text-sm font-bold">وضع التجربة (Demo Mode)</p>
                                    <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">إعدادات Firebase غير مكتملة. يمكنك الدخول الآن بأي بريد إلكتروني وكلمة مرور للتجربة.</p>
                                </div>
                            </div>
                        )}

                        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2.5 md:p-3 rounded-lg text-xs md:text-sm font-bold text-center animate-shake">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:scale-[1.02] active:scale-95 transition shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin w-5 h-5" /> : <><span>دخول</span> <ArrowRight className="rtl:rotate-180 w-5 h-5" size={20} /></>}
                        </button>
                    </form>

                    <p className="text-center mt-6 md:mt-8 text-gray-500 text-xs md:text-sm pb-8 md:pb-0">
                        ليس لديك حساب؟ <button onClick={onNavigateToSignup} className="text-primary font-bold hover:underline">أنشئ حساباً جديداً</button>
                    </p>
                </div>
            </div>

            {showLanguageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative w-full max-w-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] border border-white/20 dark:border-gray-700 overflow-hidden text-center"
                    >
                        {/* Decorative background elements */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                        <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px]"></div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowLanguageModal(false)}
                            className="absolute top-6 left-6 z-50 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 backdrop-blur-sm group/close"
                        >
                            <X size={24} className="group-hover/close:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="relative z-10">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                                    مرحباً بك يا <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{tempUser?.name?.split(' ')[0]}</span>!
                                </h2>
                                <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 font-medium max-w-lg mx-auto leading-relaxed">
                                    اختر اللغة التي ترغب بتعلمها لتهيئة تجربتك التعليمية
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.button
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    onClick={() => handleLanguageSelection('en')}
                                    disabled={!langAvailability?.en}
                                    className={`group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 text-right shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 ${langAvailability?.en ? 'hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02] cursor-pointer' : 'opacity-60 cursor-not-allowed grayscale'}`}
                                >
                                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 flex flex-col items-center gap-6">
                                        <div className="w-24 h-24 rounded-full shadow-xl overflow-hidden border-4 border-white dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
                                            <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
                                                <path fill="#012169" d="M0 0h640v480H0z" />
                                                <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" />
                                                <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" />
                                                <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
                                                <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
                                            </svg>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">الإنجليزية</h3>
                                            {!langAvailability?.en ? (
                                                <span className="inline-block px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-bold mt-2">
                                                    قيد التطوير
                                                </span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold mt-2">
                                                    الأكثر طلباً عالمياً
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                                </motion.button>

                                <motion.button
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    onClick={() => handleLanguageSelection('de')}
                                    disabled={!langAvailability?.de}
                                    className={`group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 text-right shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 ${langAvailability?.de ? 'hover:shadow-2xl hover:shadow-amber-500/10 hover:scale-[1.02] cursor-pointer' : 'opacity-60 cursor-not-allowed grayscale'}`}
                                >
                                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 flex flex-col items-center gap-6">
                                        <div className="w-24 h-24 rounded-full shadow-xl overflow-hidden border-4 border-white dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
                                            <svg viewBox="0 0 5 3" className="w-full h-full object-cover">
                                                <rect width="5" height="3" y="0" fill="#000" />
                                                <rect width="5" height="2" y="1" fill="#DD0000" />
                                                <rect width="5" height="1" y="2" fill="#FFCE00" />
                                            </svg>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">الألمانية</h3>
                                            {!langAvailability?.de ? (
                                                <span className="inline-block px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-bold mt-2">
                                                    قيد التطوير
                                                </span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 text-xs font-bold mt-2">
                                                    فرص عمل ودراسة
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
