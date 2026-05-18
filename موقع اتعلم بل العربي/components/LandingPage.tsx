import React, { useState, useEffect, useRef } from 'react';
import { motion, MotionConfig, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion } from 'framer-motion';
import { Brain, Zap, BookOpen, Globe, ArrowLeft, ShieldCheck, CheckCircle, Map, PlayCircle, Twitter, Facebook, Instagram, Linkedin, Mail, ChevronRight, Moon, Sun, Sparkles, X, ChevronDown, HelpCircle, Trophy, Rocket, Star, Minus, Plus, Menu, Quote } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';

const PromoPresentation = React.lazy(() => import('./PromoPresentation').then(m => ({ default: m.PromoPresentation })));

interface LandingPageProps {
    onLoginClick: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    animationsEnabled?: boolean;
}

const HERO_VIDEO_SRC = '/صفحه الهبوط/Hero.mp4';
const landingVideoSlides = [
    {
        src: '/صفحه الهبوط/10.mp4',
        title: 'جولة سريعة داخل تجربة التعلم',
        label: 'عرض حي للمنصة',
    },
    {
        src: '/صفحه الهبوط/11.mp4',
        title: 'واجهة مصممة لتعلم أسهل وأسرع',
        label: 'من داخل KeyLang',
    },
];

const showcaseSlides = [
    {
        src: '/صفحه الهبوط/1.jpeg',
        title: 'لوحة تعلم مركزة',
        label: 'مسار واضح من أول دقيقة',
    },
    {
        src: '/صفحه الهبوط/2.jpeg',
        title: 'كروت ذكية',
        label: 'مراجعة بصرية سهلة وسريعة',
    },
    {
        src: '/صفحه الهبوط/3.jpeg',
        title: 'تجربة عربية أنيقة',
        label: 'واجهة مصممة للمتعلم العربي',
    },
    {
        src: '/صفحه الهبوط/5.jpeg',
        title: 'إدارة محتوى مرنة',
        label: 'مجلدات وكلمات وقصص في مكان واحد',
    },
    {
        src: '/صفحه الهبوط/6.jpeg',
        title: 'متابعة تقدمك',
        label: 'رحلة تعلم منظمة وقابلة للقياس',
    },
    {
        src: '/صفحه الهبوط/AI_language_learning_platform_in…_202605140259.jpeg',
        title: 'معلم ذكاء اصطناعي',
        label: 'مساعدة فورية في التدريب والفهم',
    },
];

const customerTestimonials = [
    {
        name: 'منة الله أحمد',
        city: 'القاهرة',
        role: 'طالبة تجارة',
        initials: 'م أ',
        text: 'كنت أبدأ مذاكرة الإنجليزية ثم أتوقف سريعًا. أكثر ما ساعدني هو أن البطاقات تعود في الوقت المناسب، والشرح بالعربية جعل تصحيح الأخطاء أسهل بكثير.',
        result: 'تحولت المذاكرة اليومية إلى عادة ثابتة',
        accent: 'from-amber-400 to-orange-500',
    },
    {
        name: 'محمود خالد',
        city: 'الإسكندرية',
        role: 'مسؤول دعم عملاء',
        initials: 'م خ',
        text: 'طبيعة عملي تحتاج ردودًا سريعة بالإنجليزية. أنشأت مجلدات لمصطلحات العمل، وبعد فترة قصيرة أصبحت الجمل الأساسية حاضرة أثناء المحادثات.',
        result: 'مفردات العمل أصبحت أسهل في الاستخدام',
        accent: 'from-sky-400 to-cyan-500',
    },
    {
        name: 'سارة ياسر',
        city: 'المنصورة',
        role: 'تستعد للسفر',
        initials: 'س ي',
        text: 'كنت أجد الألمانية صعبة في البداية. القصص القصيرة والنطق ساعداني على سماع الكلمات داخل سياق واضح بدل حفظها بشكل منفصل.',
        result: 'بداية محادثات بسيطة بثقة أكبر',
        accent: 'from-emerald-400 to-teal-500',
    },
    {
        name: 'أحمد عبد الرحمن',
        city: 'الجيزة',
        role: 'مهندس برمجيات',
        initials: 'أ ع',
        text: 'أكثر ما أعجبني أن التجربة مباشرة وغير مشتتة. أراجع المطلوب، أضيف بطاقاتي الخاصة، وأنهي جلسة قصيرة بنتيجة واضحة.',
        result: 'جلسات مراجعة مركزة تناسب اليوم المزدحم',
        accent: 'from-violet-400 to-fuchsia-500',
    },
    {
        name: 'ريم مصطفى',
        city: 'طنطا',
        role: 'مدرسة لغة',
        initials: 'ر م',
        text: 'استخدمت المنصة مع طلابي في مراجعة الكلمات المتكررة. وضوح التقدم ونظام المراجعة حسب المستوى شجعهم على الاستمرار.',
        result: 'مناسب للتعلم الفردي والمتابعة التعليمية',
        accent: 'from-rose-400 to-red-500',
    },
    {
        name: 'يوسف سامي',
        city: 'أسيوط',
        role: 'طالب ثانوي',
        initials: 'ي س',
        text: 'كنت أحفظ كلمات كثيرة ثم أنساها بعد أيام. الآن لكل كلمة موعد مراجعة، وإذا نسيتها تعود مرة أخرى ضمن خطة منظمة.',
        result: 'نسيان أقل ومراجعة أكثر وضوحًا',
        accent: 'from-lime-400 to-green-500',
    },
];

const heroDemoSlides = [
    {
        icon: Map,
        eyebrow: 'مسار واضح',
        title: 'ابدأ من مستواك وامش خطوة بخطوة',
        description: 'اختار إنجليزي أو ألماني، وحدد مستواك، وخلي كل درس يقودك للكلمة التالية بدون تشتت.',
        metric: 'A1 -> C1',
        metricLabel: 'مستويات منظمة',
        type: 'path',
        message: 'اللغة لا تحتاج قفزة كبيرة، تحتاج عادة صغيرة كل يوم.',
        accent: '#f59e0b',
    },
    {
        icon: Zap,
        eyebrow: 'SRS',
        title: 'راجع قبل ما تنسى',
        description: 'كل كارت له موعد مراجعة ذكي حسب أدائك، فتثبت الكلمات في الذاكرة بدل الحفظ المؤقت.',
        metric: 'SRS',
        metricLabel: 'مراجعة محسوبة',
        type: 'cards',
        message: 'الكلمات التي تراجعها في وقتها تتحول من معرفة مؤقتة لذاكرة حقيقية.',
        accent: '#22c55e',
    },
    {
        icon: Brain,
        eyebrow: 'AI Tutor',
        title: 'معلم ذكي يصحح ويشرح',
        description: 'اكتب، اسأل، وتدرب على المحادثة. الذكاء الاصطناعي يشرح لك الخطأ بالعربي ويقترح صياغة أقوى.',
        metric: 'AI',
        metricLabel: 'تصحيح ومحادثة',
        type: 'ai',
        message: 'الغلط هنا مش مشكلة، الغلط هنا بداية الشرح الصح.',
        accent: '#38bdf8',
    },
    {
        icon: BookOpen,
        eyebrow: 'Stories',
        title: 'كلمات داخل سياق حي',
        description: 'اقرأ قصصاً قصيرة، اسمع النطق، واحفظ الكلمات من داخل موقف مفهوم بدل قائمة جامدة.',
        metric: 'EN/DE',
        metricLabel: 'قصص ونطق',
        type: 'story',
        message: 'لما الكلمة تدخل قصة، تفتكر معناها وصوتها ومكانها.',
        accent: '#fb7185',
    },
];

const HeroSilentDemo: React.FC<{ isDarkMode: boolean; prefersReducedMotion: boolean | null }> = ({ isDarkMode, prefersReducedMotion }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const active = heroDemoSlides[activeIndex];
    const Icon = active.icon;

    useEffect(() => {
        if (prefersReducedMotion) return;
        const timer = window.setInterval(() => {
            setActiveIndex((index) => (index + 1) % heroDemoSlides.length);
        }, 3600);
        return () => window.clearInterval(timer);
    }, [prefersReducedMotion]);

    return (
        <div className={`absolute inset-0 overflow-hidden ${isDarkMode ? 'bg-[#07070a]' : 'bg-[#111827]'}`} aria-label="عرض صامت لمميزات KeyLang">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(15,23,42,0.04)_38%,rgba(56,189,248,0.18))]" />
            <div className="absolute inset-0 video-grain opacity-50" />
            <div className="absolute inset-0 video-scanlines opacity-40" />

            <div className="relative z-10 flex h-full flex-col p-2.5 sm:p-3 md:p-4 xl:p-5 text-white">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1.5 backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                        <span className="text-[10px] sm:text-xs font-black">عرض صامت للمميزات</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2.5 py-1.5 text-[10px] font-black text-white/70">
                        بدون صوت
                    </div>
                </div>

                <div className="mt-2 sm:mt-3 grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[1.05fr_0.72fr] gap-2 md:gap-3">
                    <div className="min-h-0 rounded-[1.15rem] md:rounded-[1.35rem] border border-white/10 bg-black/24 p-2.5 sm:p-3 md:p-4 backdrop-blur-md flex flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active.title}
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
                                transition={{ duration: 0.45 }}
                                className="flex flex-col h-full min-h-0"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-2.5">
                                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 xl:h-12 xl:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl border border-white/10 bg-white/10" style={{ color: active.accent }}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.14em]" style={{ color: active.accent }}>{active.eyebrow}</p>
                                            <h3
                                                className="mt-0.5 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black leading-tight"
                                                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                            >
                                                {active.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="hidden lg:block shrink-0 text-left">
                                        <p className="text-xl font-black leading-none" style={{ color: active.accent }}>{active.metric}</p>
                                        <p className="mt-1 text-[10px] font-bold text-white/55">{active.metricLabel}</p>
                                    </div>
                                </div>

                                <p
                                    className="mt-2 text-[11px] sm:text-xs md:text-sm xl:text-[15px] leading-5 md:leading-6 xl:leading-7 text-white/72 font-semibold"
                                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                >
                                    {active.description}
                                </p>

                                <div className="mt-2 sm:mt-3 flex-1 min-h-0 rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.06] p-2 sm:p-3 overflow-hidden">
                                    {active.type === 'path' && (
                                        <div className="h-full flex flex-col justify-center gap-2">
                                            {['A1', 'A2', 'B1', 'B2', 'C1'].map((level, index) => (
                                                <div key={level} className="flex items-center gap-2">
                                                    <span className="w-8 text-[10px] sm:text-xs font-black text-white/80">{level}</span>
                                                    <div className="h-1.5 sm:h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: active.accent }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${22 + index * 15}%` }}
                                                            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: index * 0.08 }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {active.type === 'cards' && (
                                        <div className="grid h-full grid-cols-3 gap-2 items-center">
                                            {['اليوم', 'قريباً', 'متقن'].map((label, index) => (
                                                <motion.div
                                                    key={label}
                                                    initial={prefersReducedMotion ? false : { y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="rounded-xl md:rounded-2xl border border-white/10 bg-white/10 p-2 text-center"
                                                >
                                                    <div className="mx-auto mb-2 h-8 w-8 rounded-lg md:rounded-xl bg-black/20 flex items-center justify-center">
                                                        <Zap size={16} style={{ color: active.accent }} />
                                                    </div>
                                                    <p className="text-[10px] sm:text-xs font-black">{label}</p>
                                                    <p className="mt-1 text-[9px] text-white/55">موعد مراجعة</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {active.type === 'ai' && (
                                        <div className="h-full flex flex-col justify-center gap-1.5 text-[10px] sm:text-xs md:text-sm">
                                            <div className="self-start max-w-[82%] rounded-xl md:rounded-2xl rounded-tr-md bg-white/10 px-2.5 py-1.5 text-white/75">
                                                I go to work yesterday
                                            </div>
                                            <div className="self-end max-w-[86%] rounded-xl md:rounded-2xl rounded-tl-md px-2.5 py-1.5 font-bold text-slate-950" style={{ backgroundColor: active.accent }}>
                                                I went to work yesterday
                                            </div>
                                            <div className="rounded-xl md:rounded-2xl border border-white/10 bg-black/20 px-2.5 py-1.5 text-white/70">
                                                السبب: مع yesterday نستخدم الماضي البسيط.
                                            </div>
                                        </div>
                                    )}

                                    {active.type === 'story' && (
                                        <div className="h-full flex flex-col justify-between gap-2">
                                            <div className="space-y-2">
                                                <div className="h-2 w-4/5 rounded-full bg-white/25" />
                                                <div className="h-2 w-full rounded-full bg-white/15" />
                                                <div className="h-2 w-2/3 rounded-full bg-white/15" />
                                            </div>
                                            <div className="flex items-end gap-1 h-9 sm:h-11">
                                                {[30, 54, 38, 68, 44, 78, 52, 62, 36, 58].map((height, index) => (
                                                    <motion.span
                                                        key={index}
                                                        className="flex-1 rounded-full"
                                                        style={{ backgroundColor: active.accent }}
                                                        animate={prefersReducedMotion ? undefined : { height: [`${height * 0.55}%`, `${height}%`, `${height * 0.7}%`] }}
                                                        transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.06 }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-white/75">
                                                <BookOpen size={14} style={{ color: active.accent }} />
                                                اقرأ، اسمع، ثم احفظ من السياق
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="hidden lg:flex min-h-0 rounded-[1.35rem] border border-white/10 bg-white/[0.07] p-3 xl:p-4 backdrop-blur-md flex-col justify-between overflow-hidden">
                        <div>
                            <p className="text-[10px] font-black text-white/45 uppercase tracking-[0.18em]">Daily Flow</p>
                            <div className="mt-3 xl:mt-4 space-y-2 xl:space-y-3">
                                {['تعلم درس قصير', 'احفظ كلماتك', 'راجع في وقتها', 'تدرب مع AI'].map((step, index) => (
                                    <div key={step} className="flex items-center gap-2 rounded-xl bg-black/16 px-2.5 py-1.5 xl:px-3 xl:py-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black" style={{ backgroundColor: index === activeIndex ? active.accent : 'rgba(255,255,255,0.1)', color: index === activeIndex ? '#0f172a' : 'rgba(255,255,255,0.75)' }}>
                                            {index + 1}
                                        </span>
                                        <span className="text-xs font-bold text-white/75">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[11px] font-bold text-white/45">رسالة اليوم</p>
                            <p
                                className="mt-1.5 text-xs md:text-sm font-black leading-6"
                                style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                            >
                                {active.message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                        {heroDemoSlides.map((slide, index) => (
                            <button
                                key={slide.title}
                                type="button"
                                aria-label={`عرض ميزة ${index + 1}`}
                                onClick={() => setActiveIndex(index)}
                                className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                            />
                        ))}
                    </div>
                    <p className="hidden sm:block min-w-0 truncate text-[10px] md:text-xs font-black text-white/55">تعلم قليل يومياً، لكن بذكاء.</p>
                </div>
            </div>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, isDarkMode, toggleTheme, animationsEnabled = false }) => {
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLandingVideoIndex, setActiveLandingVideoIndex] = useState(0);
    const activeLandingVideo = landingVideoSlides[activeLandingVideoIndex];
    const subscriptionPlans: Array<any> = [];
    const goToPreviousLandingVideo = () => setActiveLandingVideoIndex((prev) => (prev - 1 + landingVideoSlides.length) % landingVideoSlides.length);
    const goToNextLandingVideo = () => setActiveLandingVideoIndex((prev) => (prev + 1) % landingVideoSlides.length);
    const heroRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const reduceMotion = !animationsEnabled || prefersReducedMotion;

    // Optimized Mouse Tracking using Motion Values (No Re-renders)
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring physics for mouse movement
    const springConfig = { stiffness: 100, damping: 30 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    useEffect(() => {
        if (reduceMotion) return;
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const x = (clientX - window.innerWidth / 2) / 20;
            const y = (clientY - window.innerHeight / 2) / 20;
            mouseX.set(x);
            mouseY.set(y);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY, reduceMotion]);

    const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
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
        <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
        <div className="site-responsive-root min-h-screen bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white font-sans transition-colors duration-300 overflow-x-hidden" dir="rtl">
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

                    <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm lg:text-base font-bold text-gray-600 dark:text-gray-300">
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

                        <button onClick={onLoginClick} className="btn-secondary h-9 md:h-[46px] px-3 md:px-5 text-xs md:text-sm lg:text-base flex items-center gap-1.5 md:gap-2">
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
                            <div className="flex justify-between items-center mb-8">
                                <Logo variant="bilingual" size="md" />
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-red-500 transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 text-lg font-bold text-center mt-4">
                                {[
                                    { id: 'features', label: 'المميزات' },
                                    { id: 'method', label: 'كيف نعمل' },
                                    { id: 'pricing', label: 'الفيديوهات' },
                                    { id: 'testimonials', label: 'آراء العملاء' },
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
                                <p className="text-sm text-gray-400">© 2026 KeyLang Pro</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* --- HERO SECTION --- */}
            <section
                ref={heroRef}
                className={`relative min-h-[calc(100svh-76px)] pt-16 md:pt-28 pb-20 md:pb-32 overflow-hidden px-4 md:px-0 transition-colors duration-700 ${isDarkMode ? 'bg-[#0c0c0e]' : 'bg-[#fffdf7]'
                    }`}
            >
                {!reduceMotion && (
                    <video
                        className="absolute inset-0 h-full w-full object-cover opacity-70 dark:opacity-55 pointer-events-none"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-hidden="true"
                    >
                        <source src={HERO_VIDEO_SRC} type="video/mp4" />
                    </video>
                )}
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#050507]/68' : 'bg-white/62'}`}></div>
                <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-[#050507]/80 via-[#050507]/55 to-[#0c0c0e]' : 'from-white/85 via-[#fffdf7]/55 to-[#fffdf7]'}`}></div>

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
                        className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 ${reduceMotion ? '' : 'animate-blob'} ${isDarkMode ? 'bg-primary/30' : 'bg-red-200/50'
                            }`}
                        style={{ x: blobX1, y: blobY1 }}
                    />
                    <motion.div
                        className={`absolute top-1/2 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-30 ${reduceMotion ? '' : 'animate-blob animation-delay-2000'} ${isDarkMode ? 'bg-orange-500/20' : 'bg-amber-100/50'
                            }`}
                        style={{ x: blobX2, y: blobY2 }}
                    />

                    {/* Particles Texture Overlay */}
                    <div className={`absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${isDarkMode ? 'invert-0' : 'invert'}`}></div>
                </div>

                <div className="max-w-7xl xl:max-w-[1500px] mx-auto px-2 md:px-6 xl:px-8 relative z-10 text-center">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 xl:gap-16 mt-10">
                        {/* Text Content */}
                        <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl mx-auto lg:mx-0 lg:w-[46%] xl:w-[42%] text-center lg:text-right">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                                className={`inline-flex items-center gap-2 border px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-sm font-bold backdrop-blur-md shadow-xl mb-4 md:mb-6 mx-auto lg:mx-0 ${isDarkMode
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
                                className={`text-[2.15rem] sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 leading-[1.22] md:leading-[1.3] tracking-tight ${isDarkMode ? 'text-white text-glow' : 'text-gray-900'
                                    }`}
                            >
                                تعلم الإنجليزي والألماني <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">بنظام يناسبك فعلاً</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className={`max-w-xl mx-auto lg:mx-0 text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}
                            >
                                KeyLang يجمع المسار التعليمي، الكروت الذكية، المراجعة المتباعدة، القصص، والمحادثة مع الذكاء الاصطناعي في تجربة عربية واحدة مصممة لمن يتعلم الإنجليزية أو الألمانية بجدية.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-4 mb-4"
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
                                    aria-label="شاهد العرض الصامت للمنصة"
                                >
                                    <span className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-amber-500/70 via-orange-500/50 to-amber-500/70 opacity-40 blur-sm transition group-hover:opacity-70"></span>
                                    <span className={`relative flex items-center justify-center gap-4 px-4 md:px-5 h-12 md:h-[52px] rounded-2xl border backdrop-blur-xl transition group-hover:-translate-y-0.5 ${isDarkMode ? 'bg-[#0f172a]/70 border-white/10 text-white' : 'bg-white/80 border-amber-200/70 text-gray-900'}`}>
                                        <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-black shadow-lg">
                                            <span className="play-ring"></span>
                                            <span className="play-ring play-ring-delay"></span>
                                            <PlayCircle size={18} className="relative md:w-5 md:h-5" />
                                        </span>
                                        <span className="text-right leading-tight">
                                            <span className="block text-sm md:text-base font-black">شاهد العرض الصامت</span>
                                            <span className={`block text-[11px] md:text-xs font-bold ${isDarkMode ? 'text-amber-200/80' : 'text-amber-700/80'}`}>مميزات ورسائل تحفيزية</span>
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
                            className="w-full max-w-full lg:w-[54%] xl:w-[58%] relative flex justify-center perspective mt-12 md:mt-8 lg:mt-0"
                        >
                            <div className="relative w-full flex items-center justify-center z-30 px-4 xl:px-0">
                                <div className="relative w-full max-w-[calc(100vw-2rem)] md:max-w-[640px] lg:max-w-[740px] xl:max-w-[860px] 2xl:max-w-[920px]">
                                    <div className={`absolute -inset-6 md:-inset-10 xl:-inset-14 rounded-[3rem] blur-3xl ${isDarkMode ? 'bg-amber-500/20 xl:bg-amber-500/24' : 'bg-amber-200/60'}`}></div>
                                    <div className={`hidden xl:block absolute -inset-[2px] rounded-[2.85rem] ${isDarkMode ? 'bg-white/[0.05]' : 'bg-white/70'} shadow-[0_45px_120px_-55px_rgba(15,23,42,0.9)]`}></div>

                                    <div className="relative rounded-[2.5rem] xl:rounded-[2.85rem] p-[1px] bg-gradient-to-br from-amber-500/60 via-orange-500/30 to-blue-500/40 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)] xl:shadow-[0_38px_110px_-46px_rgba(15,23,42,0.92)]">
                                        <div className={`relative aspect-[4/3] sm:aspect-video xl:aspect-[16/10] rounded-[2.5rem] xl:rounded-[2.85rem] overflow-hidden border ${isDarkMode ? 'bg-[#0b0b0f] border-white/10' : 'bg-white border-amber-200/60'}`}>
                                            <div dir="ltr" className={`hidden xl:flex absolute inset-x-0 top-0 z-20 h-11 items-center justify-between border-b px-5 backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-[#07070a]/82 text-white' : 'border-amber-200/60 bg-white/82 text-slate-900'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-3 w-3 rounded-full bg-red-400/90" />
                                                    <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                                                    <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
                                                </div>
                                                <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black ${isDarkMode ? 'border-white/10 bg-white/10 text-white/72' : 'border-slate-900/10 bg-slate-900/10 text-slate-700'}`}>
                                                    KeyLang Demo
                                                </div>
                                                <div className={`text-[11px] font-black ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>Silent Product Preview</div>
                                            </div>
                                            <div className="absolute inset-0 xl:top-11">
                                                <HeroSilentDemo isDarkMode={isDarkMode} prefersReducedMotion={reduceMotion} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm font-bold">
                                        {['عرض صامت', 'مميزات حقيقية', 'رسائل تحفيزية'].map((item, i) => (
                                            <div key={i} className={`px-4 py-2 rounded-full border ${isDarkMode ? 'bg-white/5 border-white/10 text-white/80' : 'bg-white/80 border-amber-200/60 text-gray-700'} backdrop-blur`}>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    </div>


                    {/* Product Signals Section with Scroll Animation */}
                    <div className="mt-20 pt-12 border-t border-gray-200/10 dark:border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-5xl mx-auto">
                        {[
                            { num: 'EN/DE', label: 'إنجليزي وألماني بتركيز كامل' },
                            { num: 'A1-C1', label: 'مستويات منظمة من البداية للتقدم' },
                            { num: 'SRS', label: 'مراجعة محسوبة قبل ما تنسى' },
                            { num: 'AI', label: 'تصحيح ونطق ومحادثة تفاعلية' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className={`relative group rounded-2xl md:rounded-3xl px-4 py-5 md:px-5 md:py-6 border text-center backdrop-blur ${isDarkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white/75 border-amber-100/80 shadow-sm'
                                    }`}
                            >
                                <div className={`text-3xl md:text-5xl font-black mb-2 tracking-normal group-hover:text-amber-500 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>{stat.num}</div>
                                <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-bold leading-6">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Decorative Bottom Fade */}
                <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent z-10 ${isDarkMode ? 'from-[#0f172a]' : 'from-[#fffdf7]'
                    }`}></div>
            </section>

            {/* --- INTERACTIVE 3D LEARNING SECTION --- */}
            <section className={`relative overflow-hidden py-16 md:py-24 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#fffdf7]'}`}>
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.16),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.12),transparent_28%)]' : 'bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.16),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.10),transparent_28%)]'}`} />
                <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 36 }}
                        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] items-center gap-8 md:gap-12 rounded-[2rem] md:rounded-[2.75rem] border p-5 md:p-8 lg:p-10 overflow-hidden shadow-[0_30px_90px_-50px_rgba(15,23,42,0.75)] ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-white/75 border-amber-100/80'}`}
                    >
                        <div className="relative z-10 text-center lg:text-right">
                            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs md:text-sm font-black mb-5 ${isDarkMode ? 'bg-white/5 border-white/10 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                <Sparkles size={16} />
                                تجربة تفاعلية من أول دقيقة
                            </div>
                            <h2 className={`text-3xl md:text-5xl font-black leading-tight mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                شوف التعلم وهو بيتحرك قدامك
                            </h2>
                            <p className={`text-base md:text-lg leading-8 font-medium mb-7 max-w-xl mx-auto lg:mx-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                مشهد ثلاثي الأبعاد يلمّح لفكرة المنصة: كروت، تركيز، تقدم، وتجربة حديثة تخلي رحلة اللغة أخف وأوضح.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                                <button onClick={onLoginClick} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                                    ابدأ التعلم الآن <Rocket size={18} />
                                </button>
                                <a
                                    href="#features"
                                    onClick={(e) => handleScrollTo(e, 'features')}
                                    className={`w-full sm:w-auto h-12 px-5 rounded-2xl flex items-center justify-center gap-2 font-black border transition ${isDarkMode ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-amber-200 bg-white/80 text-gray-900 hover:bg-amber-50'}`}
                                >
                                    اكتشف المميزات <ArrowLeft size={18} />
                                </a>
                            </div>
                        </div>

                        <div className="relative min-h-[340px] md:min-h-[460px] lg:min-h-[520px] rounded-[1.75rem] md:rounded-[2.25rem] overflow-hidden border border-white/10 bg-black/[0.94]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(245,158,11,0.26),transparent_30%),radial-gradient(circle_at_78%_22%,rgba(59,130,246,0.20),transparent_34%)]" />
                            <div className="absolute inset-x-0 top-0 z-20 h-11 flex items-center justify-between px-4 border-b border-white/10 bg-black/35 backdrop-blur-md" dir="ltr">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-red-400" />
                                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                                </div>
                                <span className="text-[11px] font-black text-white/55">Interactive 3D Preview</span>
                            </div>
                            <div className="absolute inset-0 pt-10">
                                <div className="flex h-full w-full items-center justify-center">
                                    <div className="relative h-52 w-52 rounded-[2rem] border border-amber-300/30 bg-amber-400/10 shadow-[0_0_90px_rgba(245,158,11,0.25)]">
                                        <div className="absolute -right-8 top-10 h-24 w-32 rotate-12 rounded-2xl border border-white/15 bg-white/10" />
                                        <div className="absolute -left-8 bottom-10 h-24 w-32 -rotate-12 rounded-2xl border border-white/15 bg-white/10" />
                                        <div className="absolute inset-8 rounded-3xl bg-gradient-to-br from-amber-300/30 to-blue-400/20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- FEATURES GRID (Bento Style) --- */}
            <section id="features" className="py-16 md:py-24 bg-stone-50 dark:bg-black/20 content-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-5xl font-black mb-3 md:mb-4 text-gray-900 dark:text-white">منصة واحدة بدل رحلة مشتتة</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">بدل ما تتنقل بين تطبيق للحفظ، وآخر للمحادثة، وثالث للمراجعة، خلي كل خطوة في مكان واحد.</p>
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
                        صممنا "KeyLang" لتكون الأجمل والأسهل استخداماً، حيث تجتمع البساطة مع القوة لتستمتع بكل لحظة في رحلة تعلمك.
                    </p>
                </div>

                <div className="relative flex overflow-hidden py-10 md:py-12 pause-on-hover" dir="ltr">
                    <div
                        className="flex gap-5 sm:gap-7 md:gap-10 w-fit animate-marquee"
                    >
                        {[...showcaseSlides, ...showcaseSlides].map((slide, index) => (
                            <motion.div
                                key={`${slide.src}-${index}`}
                                whileHover={{
                                    scale: 1.05,
                                    y: -12,
                                    transition: { duration: 0.3 }
                                }}
                                className="relative flex-shrink-0 w-[86vw] sm:w-[560px] lg:w-[680px] aspect-[16/9] rounded-[1.75rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10 group bg-gray-100 dark:bg-gray-800 transform-gpu"
                            >
                                <img
                                    src={slide.src}
                                    alt={`${slide.title} داخل منصة KeyLang`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                    decoding="async"
                                    sizes="(min-width: 1024px) 680px, (min-width: 640px) 560px, 86vw"
                                />
                                {/* Premium Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-10 text-right">
                                    <h4 className="text-white text-xl md:text-2xl font-black">{slide.title}</h4>
                                    <p className="text-amber-300 font-bold text-sm md:text-base">{slide.label}</p>
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
                        <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">ما الفرق في <span className="text-amber-500">KeyLang Pro؟</span></h2>
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
                                    "تطبيق يحفظ كلمات فقط بدون مسار واضح.",
                                    "محادثة منفصلة لا تعرف الكلمات التي تراجعها.",
                                    "مراجعة عشوائية لا تراعي موعد النسيان.",
                                    "محتوى جاهز لا يسمح لك ببناء كروتك الخاصة.",
                                    "تجربة غير مهيأة كفاية للمتعلم العربي."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
                                        <X size={20} className="mt-1 flex-shrink-0 text-red-500/50" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* KeyLang Pro — طريقة التعلم */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="surface-card relative p-8 md:p-12 rounded-[28px] border border-stone-200/70 dark:border-white/5"
                        >

                            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-amber-500">
                                <Plus className="text-amber-500" /> نظام KeyLang Pro
                            </h3>
                            <ul className="space-y-6 relative z-10">
                                {[
                                    "مسار منظم للإنجليزية والألمانية مع مستويات واضحة من A1 إلى C1.",
                                    "كروت ومجلدات خاصة بك بجانب محتوى جاهز من لوحة التحكم.",
                                    "نظام SRS يحدد موعد مراجعة كل كارت حسب أدائك الحقيقي.",
                                    "معلم ذكاء اصطناعي للتصحيح، الأمثلة، الشرح، والمحادثة.",
                                    "قصص وجمل ونطق صوتي تربط الكلمات بسياق مفهوم بدل الحفظ الجاف."
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

            {/* --- VIDEO SHOWCASE SECTION --- */}
            <section id="pricing" className="py-20 md:py-28 bg-white dark:bg-[#0f172a] relative overflow-hidden content-auto">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-400/20 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
                    <div className="absolute top-1/3 left-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-10 md:mb-14">
                        <motion.span
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-600 dark:text-amber-300 mb-5"
                        >
                            <PlayCircle size={18} />
                            من داخل التجربة
                        </motion.span>
                        <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white mb-5">
                            شاهد <span className="text-amber-500">KeyLang</span> وهي تعمل
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg md:text-xl leading-8">
                            لقطات قصيرة تعرض شكل المنصة الحقيقي وطريقة التفاعل مع تجربة التعلم.
                        </p>
                    </div>

                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute -inset-4 md:-inset-8 bg-gradient-to-r from-amber-500/25 via-orange-500/10 to-sky-500/20 blur-3xl rounded-[3rem]" />
                        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-slate-950 border border-amber-500/20 shadow-[0_35px_100px_-45px_rgba(245,158,11,0.75)]">
                            <div className="relative aspect-video min-h-[220px] sm:min-h-[320px] md:min-h-[460px]">
                                {reduceMotion ? (
                                    <img
                                        src={showcaseSlides[0].src}
                                        alt=""
                                        className="absolute inset-0 h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <AnimatePresence mode="wait">
                                        <motion.video
                                            key={activeLandingVideo.src}
                                            initial={{ opacity: 0, scale: 1.03 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.45, ease: "easeOut" }}
                                            className="absolute inset-0 h-full w-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="metadata"
                                            controls={false}
                                            onContextMenu={(event) => event.preventDefault()}
                                        >
                                            <source src={activeLandingVideo.src} type="video/mp4" />
                                        </motion.video>
                                    </AnimatePresence>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 md:p-9">
                                    <div className="max-w-xl text-right">
                                        <p className="text-amber-300 text-sm md:text-base font-black mb-2">
                                            {activeLandingVideo.label}
                                        </p>
                                        <h3 className="text-white text-2xl md:text-4xl font-black leading-tight">
                                            {activeLandingVideo.title}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-7 flex items-center justify-center gap-3 md:gap-5">
                            <button
                                type="button"
                                onClick={goToPreviousLandingVideo}
                                aria-label="الفيديو السابق"
                                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-xl shadow-amber-500/10 flex items-center justify-center hover:scale-105 active:scale-95 transition"
                            >
                                <ChevronRight size={24} />
                            </button>

                            <div className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 px-4 py-3">
                                {landingVideoSlides.map((slide, index) => (
                                    <button
                                        key={slide.src}
                                        type="button"
                                        onClick={() => setActiveLandingVideoIndex(index)}
                                        aria-label={`اعرض الفيديو ${index + 1}`}
                                        className={`h-2.5 rounded-full transition-all ${activeLandingVideoIndex === index
                                            ? 'w-10 bg-amber-500'
                                            : 'w-2.5 bg-gray-400/60 dark:bg-white/35 hover:bg-amber-400'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={goToNextLandingVideo}
                                aria-label="الفيديو التالي"
                                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-amber-500 text-black shadow-xl shadow-amber-500/25 flex items-center justify-center hover:scale-105 active:scale-95 transition"
                            >
                                <ChevronRight size={24} className="rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing-legacy" className="hidden">
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

            {/* --- TESTIMONIALS SECTION --- */}
            <section id="testimonials" className="py-20 md:py-32 bg-stone-50 dark:bg-black/30 relative overflow-hidden content-auto">
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(245,158,11,0.10),transparent_34%,rgba(14,165,233,0.08)_66%,transparent)]" />
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr] gap-10 lg:gap-14 items-start">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.55 }}
                            className="lg:sticky lg:top-28"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-600 dark:text-amber-300 mb-5">
                                <Quote size={17} />
                                آراء العملاء
                            </span>
                            <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-5">
                                عملاء بدأوا يتعلمون <span className="text-amber-500">بشكل أوضح وأكثر التزامًا</span>
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl leading-9 mb-8">
                                تجارب متنوعة لطلاب وموظفين ومدرسين استخدموا KeyLang لبناء عادة تعلم منظمة بدل الحفظ العشوائي والتشتت.
                            </p>

                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                {[
                                    { value: '4.9/5', label: 'تقييم التجربة' },
                                    { value: '6', label: 'تجارب متنوعة' },
                                    { value: '20د', label: 'متوسط مذاكرة' },
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 18 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.08 }}
                                        className="rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/85 dark:bg-white/[0.06] px-3 py-4 text-center shadow-sm"
                                    >
                                        <div className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                                        <div className="mt-1 text-[11px] md:text-xs font-bold text-gray-500 dark:text-gray-400">{stat.label}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                            {customerTestimonials.map((item, index) => (
                                <motion.article
                                    key={`${item.name}-${item.city}`}
                                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{ duration: 0.5, delay: index * 0.06 }}
                                    whileHover={{ y: -6 }}
                                    className={`relative min-h-[270px] rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-[#111827] p-5 md:p-6 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.45)] overflow-hidden ${index % 2 === 1 ? 'md:translate-y-8' : ''}`}
                                >
                                    <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l ${item.accent}`} />
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br ${item.accent} p-[2px] shadow-lg`}>
                                                <div className="h-full w-full rounded-2xl bg-white/90 dark:bg-slate-950 flex items-center justify-center text-sm font-black text-gray-900 dark:text-white">
                                                    {item.initials}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg truncate">{item.name}</h3>
                                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{item.role} - {item.city}</p>
                                            </div>
                                        </div>
                                        <Quote size={28} className="text-amber-500/30 shrink-0" />
                                    </div>

                                    <div className="flex items-center gap-1 mt-5 text-amber-500">
                                        {[0, 1, 2, 3, 4].map((star) => (
                                            <Star key={star} size={17} fill="currentColor" />
                                        ))}
                                    </div>

                                    <p className="mt-4 text-gray-700 dark:text-gray-200 leading-8 font-medium">
                                        “{item.text}”
                                    </p>

                                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-100 dark:bg-white/[0.08] border border-stone-200/70 dark:border-white/10 px-3 py-2 text-xs md:text-sm font-black text-gray-700 dark:text-gray-200">
                                        <CheckCircle size={15} className="text-emerald-500" />
                                        {item.result}
                                    </div>
                                </motion.article>
                            ))}
                        </div>
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
                            { q: "هل KeyLang مناسب للإنجليزي والألماني فقط؟", a: "نعم. التجربة الحالية مركزة على الإنجليزية والألمانية حتى يكون المحتوى، الكروت، القصص، والنطق أوضح وأعمق بدل دعم لغات كثيرة بشكل سطحي." },
                            { q: "ما الفرق بين KeyLang والطريقة التقليدية في تعلم اللغة؟", a: "KeyLang لا يكتفي بقائمة كلمات أو محادثة منفصلة. أنت تتعلم في مسار، تحفظ الكلمات داخل كروت، تراجعها بنظام SRS، تسمعها في قصص، ثم تستخدم الذكاء الاصطناعي للتصحيح والشرح والمحادثة." },
                            { q: "هل أقدر أضيف كروتي الخاصة بجانب المحتوى الجاهز؟", a: "نعم. المنصة توفر محتوى جاهز من النظام، وفي نفس الوقت تمنحك حرية إنشاء مجلداتك وبطاقاتك الخاصة بالكلمات والمصطلحات التي تهمك في عملك أو دراستك." },
                            { q: "كيف يساعدني الذكاء الاصطناعي داخل الموقع؟", a: "يساعدك في تصحيح الجمل، شرح القواعد بالعربي، توليد أمثلة مفهومة، ودخول محادثات تدريبية تناسب مستواك حتى تتدرب على الاستخدام الحقيقي للغة." }
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
                    <p className="text-base md:text-xl text-white/80 mb-8 md:mb-10 max-w-2xl mx-auto">ابدأ بخطة واضحة للإنجليزي أو الألماني: تعلم، احفظ، راجع، وتحدث مع معلم AI يفهم هدفك ومستواك.</p>
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
                                    <span className="text-3xl font-black tracking-tight text-white leading-none">KeyLang Pro</span>
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
                                    { id: "pricing", label: "الفيديوهات" },
                                    { id: "testimonials", label: "آراء العملاء" },
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
                                        <p className="text-gray-200 font-medium">support@keylang.com</p>
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
                        <p className="text-gray-500 text-sm">© 2026 KeyLang Pro. جميع الحقوق محفوظة.</p>
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
                    <React.Suspense fallback={null}>
                        <PromoPresentation
                            onClose={() => setIsVideoOpen(false)}
                            onSignUp={() => { setIsVideoOpen(false); onLoginClick(); }}
                        />
                    </React.Suspense>
                )}
            </AnimatePresence>
        </div>
        </MotionConfig>
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
