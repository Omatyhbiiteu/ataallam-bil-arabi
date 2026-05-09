import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion } from 'framer-motion';
import { Brain, Zap, BookOpen, Globe, ArrowLeft, ShieldCheck, CheckCircle, Map, PlayCircle, Quote, Twitter, Facebook, Instagram, Linkedin, Mail, ChevronRight, Moon, Sun, Sparkles, X, ChevronDown, HelpCircle, Trophy, Rocket, Star, Minus, Plus, Menu } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { PromoPresentation } from './PromoPresentation';
import { PaymentService, SubscriptionPlan } from '../services/paymentService';

interface LandingPageProps {
    onLoginClick: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, isDarkMode, toggleTheme }) => {
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(() => PaymentService.getSettings().plans || []);

    // Re-read plans if localStorage changes (e.g. admin updates)
    useEffect(() => {
        const plans = PaymentService.getSettings().plans || [];
        setSubscriptionPlans(plans);
    }, []);
    const heroRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Optimized Mouse Tracking using Motion Values (No Re-renders)
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring physics for mouse movement
    const springConfig = { stiffness: 100, damping: 30 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    useEffect(() => {
        if (prefersReducedMotion) return;
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const x = (clientX - window.innerWidth / 2) / 20;
            const y = (clientY - window.innerHeight / 2) / 20;
            mouseX.set(x);
            mouseY.set(y);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY, prefersReducedMotion]);

    const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDummyClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
    };

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Parallax transforms for the background
    const bgX1 = useTransform(smoothX, (v) => v * 2.5);
    const bgY1 = useTransform(smoothY, (v) => v * 2.5);
    const bgX2 = useTransform(smoothX, (v) => v * -2);
    const bgY2 = useTransform(smoothY, (v) => v * -2);
    const blobX1 = useTransform(smoothX, (v) => v * 0.7);
    const blobY1 = useTransform(smoothY, (v) => v * 0.7);
    const blobX2 = useTransform(smoothX, (v) => v * -0.5);
    const blobY2 = useTransform(smoothY, (v) => v * -0.5);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white font-sans transition-colors duration-300 overflow-x-hidden" dir="rtl">
            {/* --- PAGE SCROLL PROGRESS --- */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 z-[100] origin-right"
                style={{ scaleX }}
            />

            {/* --- NAVBAR --- */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="group cursor-pointer"
                    >
                        <Logo variant="bilingual" size="md" />
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600 dark:text-gray-300">
                        <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-amber-500 transition">المميزات</a>
                        <a href="#method" onClick={(e) => handleScrollTo(e, 'method')} className="hover:text-amber-500 transition">كيف نعمل</a>
                        <a href="#testimonials" onClick={(e) => handleScrollTo(e, 'testimonials')} className="hover:text-amber-500 transition">آراء العملاء</a>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow-sm"
                            title={isDarkMode ? 'الوضع المضيء' : 'الوضع المظلم'}
                        >
                            {isDarkMode ? <Sun size={18} className="text-amber-400 md:w-5 md:h-5" /> : <Moon size={18} className="text-blue-600 md:w-5 md:h-5" />}
                        </button>

                        <button onClick={onLoginClick} className="btn-secondary h-9 md:h-[46px] px-3 md:px-5 text-xs md:text-base flex items-center gap-1.5 md:gap-2">
                            دخول <ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>

                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>

                {/* --- MOBILE MENU OVERLAY --- */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-0 z-[100] bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-xl flex flex-col p-6 md:hidden"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <Logo variant="bilingual" size="md" />
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-red-500 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-6 text-2xl font-black text-center">
                                {[
                                    { id: 'features', label: 'المميزات' },
                                    { id: 'method', label: 'كيف نعمل' },
                                    { id: 'pricing', label: 'الأسعار' },
                                    { id: 'faq', label: 'الأسئلة الشائعة' }
                                ].map((item, i) => (
                                    <motion.a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        onClick={(e) => {
                                            handleScrollTo(e, item.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="text-gray-800 dark:text-white hover:text-amber-500 transition-colors py-2"
                                    >
                                        {item.label}
                                    </motion.a>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-auto pb-8 text-center"
                            >
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        onLoginClick();
                                    }}
                                    className="btn-primary w-full mb-4"
                                >
                                    ابدأ رحلتك الآن
                                </button>
                                <p className="text-sm text-gray-400">© 2026 اتعلم بالعربي Pro</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* --- HERO SECTION --- */}
            <section
                ref={heroRef}
                className={`relative pt-16 md:pt-28 pb-20 md:pb-32 overflow-hidden px-4 md:px-0 transition-colors duration-700 ${isDarkMode ? 'bg-[#0c0c0e]' : 'bg-[#fffdf7]'
                    }`}
            >
                {/* Dynamic Interactive Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-40 ${isDarkMode ? 'bg-amber-500/20' : 'bg-orange-200/40'
                            }`}
                        style={{ x: bgX1, y: bgY1 }}
                    />
                    <motion.div
                        className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-40 ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100/40'
                            }`}
                        style={{ x: bgX2, y: bgY2 }}
                    />

                    {/* Animated Floating Blobs */}
                    <motion.div
                        className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 ${prefersReducedMotion ? '' : 'animate-blob'} ${isDarkMode ? 'bg-primary/30' : 'bg-red-200/50'
                            }`}
                        style={{ x: blobX1, y: blobY1 }}
                    />
                    <motion.div
                        className={`absolute top-1/2 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-30 ${prefersReducedMotion ? '' : 'animate-blob animation-delay-2000'} ${isDarkMode ? 'bg-orange-500/20' : 'bg-amber-100/50'
                            }`}
                        style={{ x: blobX2, y: blobY2 }}
                    />

                    {/* Particles Texture Overlay */}
                    <div className={`absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${isDarkMode ? 'invert-0' : 'invert'}`}></div>
                </div>

                <div className="max-w-7xl mx-auto px-2 md:px-6 relative z-10 text-center">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mt-10">
                        {/* Text Content */}
                        <div className="lg:w-1/2 text-right">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                                className={`inline-flex items-center gap-2 border px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-sm font-bold backdrop-blur-md shadow-xl mb-4 md:mb-6 ${isDarkMode
                                    ? 'bg-white/5 border-white/10 text-gray-300'
                                    : 'bg-orange-50/50 border-orange-100 text-orange-800'
                                    }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></span>
                                بأقل من 2 جنيه في اليوم.. استثمر في مستقبلك
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`text-3xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 leading-[1.3] tracking-tight ${isDarkMode ? 'text-white text-glow' : 'text-gray-900'
                                    }`}
                            >
                                صمم مسارك في <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">تعلم اللغات</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className={`text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}
                            >
                                أنت لست مقيداً بمسار واحد! أنشئ مجلداتك، أضف كروتك الخاصة، وتحدث مع معلم الذكاء الاصطناعي ليراجع أخطائك ويشرح قواعدك في الوقت الفعلي.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-4"
                            >
                                <button
                                    onClick={onLoginClick}
                                    className="btn-primary w-full sm:w-auto text-base md:text-lg flex items-center justify-center gap-3"
                                    aria-label="ابدأ رحلتك التعليمية مجاناً"
                                >
                                    ابدأ رحلتك مجاناً <Zap size={18} fill="currentColor" className="text-white md:w-[22px] md:h-[22px]" />
                                </button>
                                <button
                                    onClick={() => setIsVideoOpen(true)}
                                    className="group relative w-full sm:w-auto"
                                    aria-label="شاهد الفيديو التعريفي للمنصة"
                                >
                                    <span className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-amber-500/70 via-orange-500/50 to-amber-500/70 opacity-40 blur-sm transition group-hover:opacity-70"></span>
                                    <span className={`relative flex items-center justify-center gap-4 px-4 md:px-5 h-12 md:h-[52px] rounded-2xl border backdrop-blur-xl transition group-hover:-translate-y-0.5 ${isDarkMode ? 'bg-[#0f172a]/70 border-white/10 text-white' : 'bg-white/80 border-amber-200/70 text-gray-900'}`}>
                                        <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-black shadow-lg">
                                            <span className="play-ring"></span>
                                            <span className="play-ring play-ring-delay"></span>
                                            <PlayCircle size={18} className="relative md:w-5 md:h-5" />
                                        </span>
                                        <span className="text-right leading-tight">
                                            <span className="block text-sm md:text-base font-black">شاهد الفيديو</span>
                                            <span className={`block text-[11px] md:text-xs font-bold ${isDarkMode ? 'text-amber-200/80' : 'text-amber-700/80'}`}>60 ثانية ⬢ كيف يعمل فعلياً</span>
                                        </span>
                                    </span>
                                </button>
                            </motion.div>
                        </div>

                        {/* Video Preview Stage */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="w-full lg:w-1/2 relative flex justify-center perspective mt-12 md:mt-8 lg:mt-0"
                        >
                            <div className="relative w-full flex items-center justify-center z-30 px-4">
                                <div className="relative w-full max-w-[640px]">
                                    <div className={`absolute -inset-6 md:-inset-10 rounded-[3rem] blur-3xl ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-200/60'}`}></div>

                                    <div className="relative rounded-[2.5rem] p-[1px] bg-gradient-to-br from-amber-500/60 via-orange-500/30 to-blue-500/40 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)]">
                                        <div className={`relative aspect-video rounded-[2.5rem] overflow-hidden border ${isDarkMode ? 'bg-[#0b0b0f] border-white/10' : 'bg-white border-amber-200/60'}`}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-blue-500/20"></div>
                                            <div className="absolute inset-0 video-grain"></div>
                                            <div className="absolute inset-0 video-scanlines"></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent"></div>

                                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full border border-white/10 backdrop-blur">
                                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                                عرض تجريبي
                                            </div>

                                            <button
                                                onClick={() => setIsVideoOpen(true)}
                                                className="group absolute inset-0 flex items-center justify-center"
                                                aria-label="تشغيل الفيديو التعريفي"
                                            >
                                                <span className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500 text-black shadow-2xl">
                                                    <span className="play-ring"></span>
                                                    <span className="play-ring play-ring-delay"></span>
                                                    <PlayCircle size={28} className="relative md:w-9 md:h-9" />
                                                </span>
                                            </button>

                                            <div className="absolute bottom-5 right-5 left-5 flex items-end justify-between gap-4">
                                                <div className="text-right">
                                                    <p className="text-white text-sm md:text-base font-black">لقطة من داخل الدروس</p>
                                                    <p className="text-amber-300/90 text-[11px] md:text-xs font-bold">60 ثانية ⬢ مشاهدة حقيقية للمتجربة</p>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">
                                                    <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">HD</span>
                                                    <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">01:00</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm font-bold">
                                        {['معلم ذكاء اصطناعي', 'بناء الكروت بحرية', 'نطق آلي دقيق'].map((item, i) => (
                                            <div key={i} className={`px-4 py-2 rounded-full border ${isDarkMode ? 'bg-white/5 border-white/10 text-white/80' : 'bg-white/80 border-amber-200/60 text-gray-700'} backdrop-blur`}>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    </div>


                    {/* Stats Section with Scroll Animation */}
                    <div className="mt-20 pt-12 border-t border-gray-200/10 dark:border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-5xl mx-auto">
                        {[
                            { num: '+50k', label: 'مستخدم نشط', icon: <Quote className="text-amber-500 opacity-20 absolute -top-4 -right-2" size={40} /> },
                            { num: '+1M', label: 'كلمة محفوظة' },
                            { num: '4.9/5', label: 'تقييم المستخدمين' },
                            { num: '+12', label: 'لغة مدعومة' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="relative group"
                            >
                                <div className={`text-4xl md:text-6xl font-black mb-2 tracking-tighter group-hover:text-amber-500 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>{stat.num}</div>
                                <div className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
                                {stat.icon && stat.icon}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Decorative Bottom Fade */}
                <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent z-10 ${isDarkMode ? 'from-[#0f172a]' : 'from-[#fffdf7]'
                    }`}></div>
            </section>

            {/* --- FEATURES GRID (Bento Style) --- */}
            <section id="features" className="py-16 md:py-24 bg-stone-50 dark:bg-black/20 content-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-5xl font-black mb-3 md:mb-4 text-gray-900 dark:text-white">كل ما تحتاجه في مكان واحد</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">استغني عن تشتت التطبيقات المتعددة.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {/* Feature 1: Large - Slide from Right */}
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="md:col-span-2 bg-white dark:bg-gray-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-700 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent z-0"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 ring-4 ring-indigo-50 dark:ring-indigo-900/20"><Brain size={28} className="md:w-8 md:h-8" /></div>
                                <h3 className="text-xl md:text-3xl font-black mb-2 md:mb-4 text-gray-900 dark:text-white tracking-tight">مُدرسك المدعوم بالذكاء الاصطناعي</h3>
                                <p className="text-gray-500 dark:text-gray-300 leading-relaxed max-w-lg text-sm md:text-lg">
                                    تتحدث معه، يحلل نصوصك، يصحح أخطاءك النحوية، ويولد لك أمثلة حيّة لأي كلمة تصعب عليك. تجربة دردشة تعليمية لا مثيل لها تكسر حاجز الخوف من التحدث.
                                </p>
                            </div>
                            <div className="absolute -bottom-10 -left-10 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 ease-out z-0">
                                <Brain size={250} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </motion.div>

                        {/* Feature 2 - Slide from Left */}
                        <motion.div
                            initial={{ opacity: 0, x: -100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-gradient-to-b from-amber-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-amber-100 dark:border-gray-700 flex flex-col justify-between group overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm"><BookOpen size={28} className="md:w-8 md:h-8" /></div>
                                <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 dark:text-white">مساحتك الحرة للإبداع</h3>
                                <p className="text-gray-500 dark:text-gray-300 text-sm md:text-base leading-relaxed">أنت لست مجبراً على دورات مغلقة. أنشئ مجلداتك، صمم كروتك كما تحب لتعلم المصطلحات التي تهمك أنت في مجالك.</p>
                            </div>
                        </motion.div>

                        {/* Feature 3 - Slide from Right */}
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white dark:bg-gray-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><Zap size={28} className="md:w-8 md:h-8" /></div>
                                <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 dark:text-white">ذاكرة لا تُقهر (SRS)</h3>
                                <p className="text-gray-500 dark:text-gray-300 text-sm md:text-base leading-relaxed">خوارزمية ذكية تتتبع أدائك لكل كلمة على حدة. وتختار التوقيت الذهبي لعرض الكلمة قبل أن تنساها لتبقى في ذاكرتك للأبد.</p>
                            </div>
                        </motion.div>

                        {/* Feature 4: Large - Slide from Left */}
                        <motion.div
                            initial={{ opacity: 0, x: -100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="md:col-span-2 surface-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 border border-stone-200/70 dark:border-white/5 relative overflow-hidden group hover:border-amber-500/50 transition-colors duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div>
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 border border-amber-500/30"><Map size={28} className="md:w-8 md:h-8" /></div>
                                    <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-gray-900 dark:text-white">كلمات تنبض بالحياة</h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-md text-sm md:text-base">
                                        كل كلمة وكارت مرفق بنطق آلي فائق الدقة (TTS) وجمل توضيحية. ولدينا قسم للقصص التفاعلية لتطبيق ما تعلمته في سياق يقترب للواقع.
                                    </p>
                                </div>
                                <div className="surface-muted p-5 rounded-3xl border border-stone-200/70 dark:border-white/5 w-full md:w-auto shadow-2xl backdrop-blur-md">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center text-white"><PlayCircle size={24} /></div>
                                        <div>
                                            <div className="font-black text-gray-900 dark:text-white text-lg">النطق الصوتي</div>
                                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400">American English 🇺🇸</div>
                                        </div>
                                    </div>
                                    <div className="h-2 w-48 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden flex items-center relative">
                                        <div className="absolute inset-x-0 h-0.5 bg-gray-300 dark:bg-gray-600/50"></div>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "100%" }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] relative z-10"
                                        ></motion.div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
            {/* --- INFINITE SHOWCASE SLIDER --- */}
            <section className="py-20 md:py-32 overflow-hidden bg-white dark:bg-[#0f172a] relative">
                <div className="max-w-7xl mx-auto px-4 md:px-6 mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-6 py-2 rounded-full text-sm font-black mb-6 shadow-sm border border-amber-100 dark:border-amber-900/30"
                    >
                        <Sparkles size={16} fill="currentColor" className="animate-pulse" /> استعراض المنصة
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">واجهة عصرية <span className="text-amber-500">لتجربة تعليمية</span> فريدة</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-3xl mx-auto text-lg md:text-xl font-medium">
                        صممنا "اتعلم بالعربي" لتكون الأجمل والأسهل استخداماً، حيث تجتمع البساطة مع القوة لتستمتع بكل لحظة في رحلة تعلمك.
                    </p>
                </div>

                <div className="relative flex overflow-hidden py-10 pause-on-hover" dir="ltr">
                    <div
                        className="flex gap-8 md:gap-12 w-fit animate-marquee"
                    >
                        {/* DOUBLE DUPLICATION: Optimized for performance while maintaining infinite loop */}
                        {[1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6].map((id, index) => (
                            <motion.div
                                key={`${id}-${index}`}
                                whileHover={{
                                    scale: 1.05,
                                    y: -15,
                                    transition: { duration: 0.3 }
                                }}
                                className="relative flex-shrink-0 w-[80vw] md:w-[600px] aspect-[16/10] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10 group bg-gray-100 dark:bg-gray-800 transform-gpu"
                            >
                                <img
                                    src={`/ads/ad${id}.jpg`}
                                    alt={`واجهة تطبيق اتعلم بالعربي Pro - استعراض ميزة رقم ${id}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                {/* Premium Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10 text-right">
                                    <h4 className="text-white text-2xl font-black">Et3alem {id >= 5 ? 'Mobile' : 'Web'}</h4>
                                    <p className="text-amber-500 font-bold">تجربة تعليمية لا تنتهي</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Fades for professional depth */}
                    <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-white dark:from-[#0f172a] to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-white dark:from-[#0f172a] to-transparent z-10 pointer-events-none"></div>
                </div>

                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-amber-500/5 dark:bg-amber-500/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
            </section>

            {/* --- HOW IT WORKS (Method) --- */}
            <section id="method" className="py-16 md:py-24 bg-white dark:bg-[#0f172a] content-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
                            <Zap size={14} fill="currentColor" /> الطريقة العلمية
                        </div>
                        <h2 className="text-2xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">كيف تتعلم لغة جديدة؟</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">3 خطوات بسيطة تقودك إلى الاحتراف.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
                        {/* Optimized Step Cards with Framer Motion */}
                        {[
                            { id: 1, title: 'استكشف', desc: 'تصفح الآلاف من الكلمات والقصص الممتعة المختارة بعناية.' },
                            { id: 2, title: 'تدرب', desc: 'استخدم نظام التكرار المتباعد لتثبيت المعلومة في ذاكرتك طويلة المدى.' },
                            { id: 3, title: 'أتقن', desc: 'تحدث بطلاقة وثقة مع تمارين النطق والذكاء الاصطناعي.' }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                                className="relative p-4 md:p-6 group"
                            >
                                <div className="w-16 h-16 md:w-24 md:h-24 bg-stone-100 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-8 shadow-inner text-3xl md:text-5xl font-black text-gray-200 group-hover:text-amber-500 transition-colors duration-500">
                                    {step.id}
                                </div>
                                <h3 className="text-xl md:text-2xl font-black mb-3 text-gray-900 dark:text-white">{step.title}</h3>
                                <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-[250px] mx-auto">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- COMPARISON SECTION (Why Us) --- */}
            <section className="py-20 md:py-32 bg-stone-50 dark:bg-black/40 content-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-16 md:mb-20">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-amber-500 font-black tracking-widest uppercase text-sm mb-4 block"
                        >
                            المقارنة العادلة
                        </motion.span>
                        <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">ما الفرق في <span className="text-amber-500">اتعلم بالعربي Pro؟</span></h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                            نحن لا نقدم مجرد دروس، نحن نبني لك مسارات عصبية متكاملة لحفظ اللغة.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {/* Traditional Methods */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-gray-800/50 p-8 md:p-12 rounded-[2.5rem] border border-gray-100 dark:border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                        >
                            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-400">
                                <Minus className="text-gray-400" /> الطرق التقليدية
                            </h3>
                            <ul className="space-y-6">
                                {[
                                    "حفظ قوائم كلمات صماء لا تنتهي.",
                                    "النسيان السريع بعد مرور 48 ساعة فقط.",
                                    "غياب السياق القصصي الممتع.",
                                    "لا توجد متابعة لمستوى تقدمك الحقيقي.",
                                    "اعتماد كلي على المجهود العضلي للذاكرة."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
                                        <X size={20} className="mt-1 flex-shrink-0 text-red-500/50" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* اتعلم بالعربي Pro — طريقة التعلم */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="surface-card relative p-8 md:p-12 rounded-[28px] border border-stone-200/70 dark:border-white/5"
                        >

                            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-amber-500">
                                <Plus className="text-amber-500" /> نظام اتعلم بالعربي Pro
                            </h3>
                            <ul className="space-y-6 relative z-10">
                                {[
                                    "حرية إنشاء مجلداتك وكروتك الخاصة باللغة التي تهمك فعلاً.",
                                    "تشغيل الذكاء الاصطناعي لتوليد أمثلة وتصحيح العبارات.",
                                    "نظام SRS يضمن عرض الكروت في التوقيت الذي يمنع النسيان.",
                                    "استخدام القصص التفاعلية لسماع النطق وربط الكروت بالسياق.",
                                    "تطبيق غير مقيد بمنهج إجباري بل يتشكل حسب احتياجاتك."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-200">
                                        <CheckCircle size={22} className="mt-1 flex-shrink-0 text-amber-500" />
                                        <span className="font-medium text-base md:text-lg">{item}</span>
                                    </li>
                                ))}
                            </ul>

                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-20 md:py-32 bg-white dark:bg-[#0f172a] relative overflow-hidden content-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16 md:mb-24">
                        <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">استثمر في <span className="text-amber-500">مستقبلك اللغوي</span></h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg md:text-xl">
                            اختر الباقة التي تناسب تطلعاتك وابدأ رحلة الاحتراف اليوم.
                        </p>
                    </div>

                    <div className={`grid grid-cols-1 gap-8 max-w-5xl mx-auto ${subscriptionPlans.length === 1 ? 'md:grid-cols-1 max-w-lg' :
                        subscriptionPlans.length === 2 ? 'md:grid-cols-2 max-w-4xl' :
                            subscriptionPlans.length === 3 ? 'md:grid-cols-3' :
                                'md:grid-cols-2 lg:grid-cols-4'
                        }`}>
                        {subscriptionPlans.map((plan, i) => {
                            const themeColors: Record<string, string> = {
                                amber: 'border-amber-500/40 text-amber-500',
                                blue: 'border-blue-500/40 text-blue-500',
                                purple: 'border-purple-500/40 text-purple-500',
                                red: 'border-red-500/40 text-red-500',
                                green: 'border-green-500/40 text-green-500',
                            };
                            const themeColor = themeColors[plan.theme || 'amber'] || themeColors.amber;
                            const planNameColor = themeColor.split(' ')[1];
                            const planBorderColor = themeColor.split(' ')[0];
                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`relative p-8 md:p-10 rounded-[2.5rem] border ${plan.isPopular
                                        ? `bg-white dark:bg-dark-card ${planBorderColor}`
                                        : 'bg-white dark:bg-dark-card border-stone-200/70 dark:border-white/5'
                                        } flex flex-col justify-between group overflow-hidden`}
                                >
                                    {plan.isPopular && (
                                        <div className="absolute top-5 left-[-30px] bg-amber-500 text-black font-black text-[10px] uppercase py-1 px-10 -rotate-45 shadow-xl">
                                            الأكثر طلباً
                                        </div>
                                    )}
                                    <div>
                                        <h3 className={`text-xl md:text-2xl font-black mb-2 ${plan.isPopular ? planNameColor : 'text-gray-900 dark:text-white'}`}>
                                            {plan.name}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{plan.description}</p>
                                        <div className="flex items-baseline gap-1 mb-8">
                                            <span className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
                                                {plan.price}
                                            </span>
                                            {plan.originalPrice && plan.originalPrice > plan.price && (
                                                <span className="text-xl font-bold text-gray-400 line-through ml-2">{plan.originalPrice}</span>
                                            )}
                                            <span className="text-sm md:text-base font-bold text-gray-500 dark:text-gray-400">
                                                &nbsp;جنيه&nbsp;/&nbsp;شهرياً
                                            </span>
                                        </div>
                                        <ul className="space-y-4 mb-10">
                                            {plan.features.map((feat, fi) => (
                                                <li key={fi} className="flex items-center gap-3 text-sm md:text-base text-gray-600 dark:text-gray-300">
                                                    <CheckCircle size={18} className={plan.isPopular ? planNameColor : 'text-green-500'} />
                                                    <span>
                                                        {feat.text}
                                                        {feat.subText && <span className="block text-xs text-gray-400">{feat.subText}</span>}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        onClick={onLoginClick}
                                        className={`${plan.isPopular ? 'btn-primary' : 'btn-secondary'} w-full`}
                                    >
                                        اشترك الآن
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section id="faq" className="py-20 md:py-32 bg-stone-50 dark:bg-black/10 content-auto">
                <div className="max-w-4xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-16 md:mb-20">
                        <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">الأسئلة الشائعة</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium italic">تحتاج لإجابات؟ نحن هنا للمساعدة.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: "هل التطبيق يحتوي على محتوى جاهز أم أستطيع إضافة كروتي الخاصة؟", a: "الأمران معاً! منصة اتعلم بالعربي توفر مجلدات وقصص من النظام (System Folders)، وفي الوقت ذاته تمنحك الحرية المطلقة لإنشاء مجلداتك وكروتك الخاصة وإدخال الكلمات والمصطلحات التي تهمك شخصياً في مجال عملك أو دراستك." },
                            { q: "كيف يساعدني الذكاء الاصطناعي داخل الموقع؟", a: "ستندهش! كل حساب مزود بقسم الذكاء الاصطناعي حيث يمكنه تصحيح الجرامر (Rules)، توليد 3 أمثلة حية لأي كلمة تسأله عنها، أو حتى الدردشة معك وكأنه متحدث أصلي لتكسر حاجز الخوف من التحدث." },
                            { q: "هل يتوفر النطق الصوتي للكلمات؟", a: "بالتأكيد. جميع أقسام الموقع تدعم النطق الفوري عالي الدقة (TTS). سواء في القصص، كروتك الخاصة، أو الكروت الجاهزة. لن تحفظ الكلمة فقط بل ستحفظ طريقة نطقها الصحيحة." },
                            { q: "ما هو نظام التكرار المتباعد وكيف يضمن عدم نسيان الكلمات؟", a: "نحن نستخدم خوارزمية ذكية لمراقبة تقييمك للأجوبة في كل مرة تراجع فيها الكروت. إذا كان الكارت سهلاً سيتأخر في الظهور والعكس صحيح. هذه التقنية أثبتت علمياً قدرتها على نقل الكلمات للذاكرة طويلة المدى وضمان عدم نسيانها." }
                        ].map((item, i) => (
                            <FAQItem key={i} question={item.q} answer={item.a} />
                        ))}
                    </div>
                </div>
            </section>


            {/* --- CTA SECTION --- */}
            <section className="py-16 md:py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 text-center text-white">
                    <h2 className="text-3xl md:text-6xl font-black mb-4 md:mb-6">ابدأ رحلتك التعليمية اليوم</h2>
                    <p className="text-base md:text-xl text-white/80 mb-8 md:mb-10 max-w-2xl mx-auto">انضم إلى أكثر من 50,000 متعلم وابدأ في إتقان لغة جديدة بطريقة ذكية وممتعة.</p>
                    <button onClick={onLoginClick} className="btn-primary mx-auto text-lg md:text-xl flex items-center justify-center gap-3">
                        إنشاء حساب مجاني <ChevronRight size={20} className="rtl:rotate-180 md:w-6 md:h-6" />
                    </button>
                    <p className="mt-4 md:mt-6 text-xs md:text-sm text-white/60 font-bold">لا حاجة لبطاقة ائتمان ⬢ تجربة مجانية كاملة</p>
                </div>
            </section>

            {/* --- PREMIUM FOOTER --- */}
            <footer className="relative bg-[#0c0c0e] text-white pt-24 pb-12 overflow-hidden border-t border-white/5">
                {/* Background Aura */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05)_0%,transparent_50%)] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
                        {/* Brand Section */}
                        <div className="lg:col-span-2 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-6 group cursor-pointer"
                            >
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full"></div>
                                    <div className="relative w-full h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur flex items-center justify-center">
                                        <Logo variant="icon" size="md" centered className="scale-90" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black tracking-tight text-white leading-none">اتعلم بالعربي Pro</span>
                                    <span className="text-sm text-amber-500/80 font-bold tracking-[0.2em] mt-2 uppercase">Linguistics Lab</span>
                                </div>
                            </motion.div>

                            <p className="text-gray-400 leading-relaxed max-w-md text-lg">
                                نحن نعيد تعريف مفهوم تعلم اللغات عبر دمج التقنيات العصبية مع الذكاء الاصطناعي لخلق تجربة حفظ تدوم مدى الحياة.
                            </p>

                            <div className="flex items-center gap-4">
                                {[
                                    { icon: <Twitter size={20} />, color: 'hover:bg-sky-500' },
                                    { icon: <Facebook size={20} />, color: 'hover:bg-blue-600' },
                                    { icon: <Instagram size={20} />, color: 'hover:bg-pink-600' },
                                    { icon: <Linkedin size={20} />, color: 'hover:bg-blue-700' }
                                ].map((social, i) => (
                                    <motion.a
                                        key={i}
                                        href="#!"
                                        whileHover={{ y: -5 }}
                                        onClick={handleDummyClick}
                                        className={`w-11 h-11 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 transition-all duration-300 ${social.color} hover:shadow-[0_10px_20px_-10px_rgba(255,255,255,0.2)]`}
                                    >
                                        {social.icon}
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-6">
                            <h4 className="text-xl font-black text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full"></span> روابط مهمة
                            </h4>
                            <ul className="space-y-4">
                                {[
                                    { id: "features", label: "المميزات" },
                                    { id: "method", label: "طريقة التعلم" },
                                    { id: "pricing", label: "الأسعار" },
                                    { id: "testimonials", label: "آراء الطلاب" },
                                    { id: "faq", label: "الأسئلة الشائعة" }
                                ].map((link) => (
                                    <li key={link.id}>
                                        <a
                                            href={`#${link.id}`}
                                            onClick={(e) => handleScrollTo(e, link.id)}
                                            className="text-gray-400 hover:text-amber-500 transition-all duration-300 flex items-center gap-2 group"
                                        >
                                            <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Support & Contact */}
                        <div className="space-y-6">
                            <h4 className="text-xl font-black text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full"></span> الدعم الفني
                            </h4>
                            <ul className="space-y-6">
                                <li className="flex items-start gap-4 group">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:border-amber-500/50 transition-colors">
                                        <Mail size={18} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">بريدنا الإلكتروني</p>
                                        <p className="text-gray-200 font-medium">support@et3alem-bel-araby.com</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4 group">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:border-amber-500/50 transition-colors">
                                        <Globe size={18} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">المقر الرئيسي</p>
                                        <p className="text-gray-200 font-medium text-right">القاهرة، جمهورية مصر العربية</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Attribution */}
                    <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
                        <p className="text-gray-500 text-sm">© 2026 اتعلم بالعربي Pro. جميع الحقوق محفوظة.</p>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                            <a href="#!" onClick={handleDummyClick} className="hover:text-amber-500 transition">سياسة الخصوصية</a>
                            <span className="hidden md:block w-1 h-1 bg-gray-700 rounded-full"></span>
                            <a href="#!" onClick={handleDummyClick} className="hover:text-amber-500 transition">شروط الاستخدام</a>
                        </div>
                    </div>
                </div>
            </footer>
            {/* --- VIDEO MODAL --- */}
            {/* --- PROMO PRESENTATION --- */}
            <AnimatePresence>
                {isVideoOpen && (
                    <PromoPresentation
                        onClose={() => setIsVideoOpen(false)}
                        onSignUp={() => { setIsVideoOpen(false); onLoginClick(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// --- FAQ ITEM COMPONENT ---
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 dark:border-white/5 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-right group"
            >
                <span className={`text-lg md:text-xl font-black transition-colors duration-300 ${isOpen ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                    {question}
                </span>
                <div className={`p-2 rounded-lg transition-all duration-300 ${isOpen ? 'bg-amber-500 text-black rotate-180' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                    <ChevronDown size={20} />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 text-gray-500 dark:text-gray-400 leading-relaxed text-sm md:text-lg">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

















