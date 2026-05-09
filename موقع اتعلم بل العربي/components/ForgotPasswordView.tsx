import React, { useState } from 'react';
import { Mail, ArrowRight, Loader, ArrowLeft, Home, Sun, Moon, Key, CheckCircle, ShieldCheck, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';

interface ForgotPasswordViewProps {
    onBackToLogin: () => void;
    onBackToHome: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBackToLogin, onBackToHome, isDarkMode, toggleTheme }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('يرجى إدخال البريد الإلكتروني');
            return;
        }

        setLoading(true);
        setError('');

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setIsSent(true);
        }, 2000);
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-900 overflow-hidden" dir="rtl">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 left-4 md:top-6 md:left-6 z-50 p-2 md:p-2.5 rounded-full bg-stone-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow-sm"
            >
                {isDarkMode ? <Sun size={18} className="text-amber-400 md:w-5 md:h-5" /> : <Moon size={18} className="text-blue-600 md:w-5 md:h-5" />}
            </button>

            {/* LEFT SIDE: Branding & Visuals */}
            <div className="hidden lg:flex w-1/2 relative bg-[#0f172a] overflow-hidden flex-col justify-between p-12">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <button onClick={onBackToHome} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition group">
                        <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20">
                            <ArrowRight size={20} />
                        </div>
                        <span className="font-bold">العودة للرئيسية</span>
                    </button>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="group cursor-pointer mb-10"
                    >
                        <Logo variant="bilingual" size="lg" className="[&_span:last-child]:!text-white" />
                    </motion.div>

                    <div className="space-y-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl font-black text-white leading-tight"
                        >
                            تأمين <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-500">حسابك هو أولويتنا</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-400 text-lg max-w-md leading-relaxed"
                        >
                            لا تقلق، استعادة الوصول لحسابك بسيطة وسريعة جداً. اتبع الخطوات وسنرسل لك رابطاً لإعادة تعيين كلمة السر.
                        </motion.p>
                    </div>
                </div>

                <div className="relative z-10 opacity-30 flex gap-4">
                    <ShieldCheck size={40} className="text-white" />
                    <Key size={40} className="text-white" />
                </div>
            </div>

            {/* RIGHT SIDE: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
                {/* Decorative background for mobile */}
                <div className="lg:hidden absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
                <div className="lg:hidden absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

                <AnimatePresence mode="wait">
                    {!isSent ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="w-full max-w-md z-10"
                        >
                            <div className="text-right mb-8">
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
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                                    className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl items-center justify-center mb-6 hidden lg:flex"
                                >
                                    <Key size={32} className="text-amber-600 dark:text-amber-400" />
                                </motion.div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 text-center lg:text-right">هل نسيت كلمة السر؟</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-center lg:text-right">لا مشكلة! أدخل بريدك الإلكتروني وسنرسل لك رابطاً لاستعادتها.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-1">البريد الإلكتروني</label>
                                    <div className="relative group">
                                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all dark:text-white font-bold"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    {error && <p className="text-red-500 text-xs font-bold mr-1 mt-1">{error}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl dark:shadow-white/5 flex items-center justify-center gap-3 group overflow-hidden relative"
                                >
                                    {loading ? (
                                        <Loader className="animate-spin" size={24} />
                                    ) : (
                                        <>
                                            <span>إرسال رابط الاستعادة</span>
                                            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                    <div className="absolute top-0 left-0 w-full h-full bg-amber-500 scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-500 -z-10 opacity-10"></div>
                                </button>
                            </form>

                            <button
                                onClick={onBackToLogin}
                                className="w-full mt-6 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2 group"
                            >
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                <span>العودة لتسجيل الدخول</span>
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="w-full max-w-md text-center z-10"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 8, stiffness: 100, delay: 0.2 }}
                                className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"
                            >
                                <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                            </motion.div>

                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">تم الإرسال بنجاح!</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                لقد أرسلنا رابط إعادة تعيين كلمة السر إلى <br />
                                <span className="font-bold text-gray-900 dark:text-white">{email}</span>. <br />
                                يرجى التحقق من بريدك (والمجلد العشوائي أيضاً).
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsSent(false)}
                                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                >
                                    إعادة الإرسال
                                </button>
                                <button
                                    onClick={onBackToLogin}
                                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition shadow-lg"
                                >
                                    العودة لتسجيل الدخول
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
