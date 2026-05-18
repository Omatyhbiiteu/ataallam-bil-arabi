import React, { useMemo, useState, useEffect } from 'react';
import { BookOpen, Scroll, Lightbulb, Feather, Sparkles, ArrowRight, ArrowLeft, Share2, Copy, Check, Moon, Heart, Flag, Star, Sun, Flame, GraduationCap, Globe, Compass, Leaf, Zap } from 'lucide-react';
import { AppTheme, InspirationalIcon, InspirationalSlide } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_KNOWLEDGE_SLIDES = [
    {
        id: 1,
        text: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
        source: "رواه مسلم",
        gradient: "from-emerald-600 via-teal-500 to-emerald-700",
        icon: BookOpen,
    },
    {
        id: 2,
        text: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
        source: "سورة العلق - الآية 1",
        gradient: "from-indigo-600 via-blue-600 to-indigo-800",
        icon: Scroll,
    },
    {
        id: 3,
        text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
        source: "سورة طه - الآية 114",
        gradient: "from-amber-500 via-orange-500 to-amber-700",
        icon: Lightbulb,
    },
    {
        id: 4,
        text: "إِنَّ الْمَلَائِكَةَ لَتَضَعُ أَجْنِحَتَهَا لِطَالِبِ الْعِلْمِ رِضًا بِمَا يَصْنَعُ",
        source: "رواه الترمذي",
        gradient: "from-violet-600 via-purple-600 to-violet-800",
        icon: Feather,
    },
    {
        id: 5,
        text: "قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
        source: "سورة الزمر - الآية 9",
        gradient: "from-rose-600 via-red-500 to-rose-800",
        icon: Sparkles,
    }
];

const ICON_MAP: Record<InspirationalIcon, any> = {
    BookOpen,
    Scroll,
    Lightbulb,
    Feather,
    Sparkles,
    Star,
    Moon,
    Heart,
    Sun,
    Flame,
    GraduationCap,
    Globe,
    Compass,
    Leaf,
    Zap,
};

// Theme overrides for special occasions
const THEME_GRADIENTS: Partial<Record<AppTheme, string>> = {
    ramadan: "from-[#2E0B49] via-[#541690] to-[#1A052E]",
    eid_fitr: "from-[#00695C] via-[#009688] to-[#004D40]",
    eid_adha: "from-[#1B5E20] via-[#2E7D32] to-[#1B5E20]",
    victory_october: "from-[#B71C1C] via-[#D32F2F] to-[#7F0000]",
};

interface KnowledgeSliderProps {
    selectedTheme: AppTheme;
    onStartSession?: () => void;
    slides?: InspirationalSlide[];
}

export const KnowledgeSlider: React.FC<KnowledgeSliderProps> = ({ selectedTheme, onStartSession, slides }) => {
    const normalizedSlides = useMemo(() => {
        const src = Array.isArray(slides) && slides.length > 0 ? slides : null;
        if (!src) return null;
        return src
            .filter((s) => !!s?.text && !!s?.source)
            .map((s, idx) => ({
                id: s.id || String(idx),
                text: s.text,
                source: s.source,
                gradient: s.gradient || DEFAULT_KNOWLEDGE_SLIDES[idx % DEFAULT_KNOWLEDGE_SLIDES.length].gradient,
                icon: ICON_MAP[(s.icon as InspirationalIcon) || 'Sparkles'] ?? Sparkles,
            }));
    }, [slides]);

    const KNOWLEDGE_SLIDES = normalizedSlides ?? DEFAULT_KNOWLEDGE_SLIDES;

    const [currentSlide, setCurrentSlide] = useState(0);
    const [paused, setPaused] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % KNOWLEDGE_SLIDES.length);
        }, 20000);
        return () => clearInterval(timer);
    }, [paused]);

    useEffect(() => {
        // إذا تغيّرت قائمة الشرائح من الخادم، تأكد أن المؤشر داخل الحدود
        setCurrentSlide((p) => Math.min(p, Math.max(0, KNOWLEDGE_SLIDES.length - 1)));
    }, [KNOWLEDGE_SLIDES.length]);

    const slide = KNOWLEDGE_SLIDES[currentSlide];
    const Icon = slide.icon;

    const activeGradient = THEME_GRADIENTS[selectedTheme] ?? slide.gradient;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`"${slide.text}"\n- ${slide.source}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    const handleShare = async () => {
        const data = { title: 'حكمة اليوم', text: `"${slide.text}"\n- ${slide.source}`, url: window.location.origin };
        if (navigator.share) {
            try { await navigator.share(data); } catch { /* ignore */ }
        } else {
            await handleCopy();
        }
    };

    return (
        <div
            className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 group"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide + selectedTheme}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.5 }}
                    className={`bg-gradient-to-l ${activeGradient} px-5 py-6 md:px-8 md:py-7 flex flex-col sm:flex-row items-center sm:items-stretch gap-4 md:gap-6 relative overflow-hidden`}
                >
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    <div className="absolute -right-16 -top-16 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Icon */}
                    <div className="relative shrink-0 w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)] backdrop-blur-md self-start sm:self-center">
                        <Icon size={26} className="text-white drop-shadow-lg md:scale-110" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 z-10 flex flex-col justify-center w-full">
                        <p
                            className="text-white font-bold text-base md:text-lg lg:text-xl leading-relaxed md:leading-loose line-clamp-3 md:line-clamp-2 drop-shadow-sm"
                            style={{ fontFamily: '"Amiri", "Tajawal", "Inter", "Segoe UI", sans-serif' }}
                        >
                            "{slide.text}"
                        </p>
                        <span className="text-white/70 text-[11px] md:text-xs font-bold tracking-widest uppercase mt-1 md:mt-1.5 block drop-shadow-sm">
                            {slide.source}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2 md:gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/10">
                        {/* Slide dots */}
                        <div className="flex sm:hidden md:flex items-center gap-1.5 ml-1 md:ml-3">
                            {KNOWLEDGE_SLIDES.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`rounded-full transition-all duration-300 ${currentSlide === idx
                                        ? 'w-4 h-1.5 bg-white'
                                        : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Prev / Next */}
                        <button
                            onClick={() => setCurrentSlide(p => (p - 1 + KNOWLEDGE_SLIDES.length) % KNOWLEDGE_SLIDES.length)}
                            className="p-2 bg-white/10 hover:bg-white/25 rounded-full transition-all border border-white/10 shadow-sm"
                            aria-label="السابق"
                        >
                            <ArrowRight size={14} className="text-white" />
                        </button>
                        <button
                            onClick={() => setCurrentSlide(p => (p + 1) % KNOWLEDGE_SLIDES.length)}
                            className="p-2 bg-white/10 hover:bg-white/25 rounded-full transition-all border border-white/10 shadow-sm"
                            aria-label="التالي"
                        >
                            <ArrowLeft size={14} className="text-white" />
                        </button>

                        {/* Copy */}
                        <button
                            onClick={handleCopy}
                            className="p-2 bg-white/10 hover:bg-white/25 rounded-full transition-all border border-white/10 shadow-sm"
                            aria-label="نسخ"
                        >
                            {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} className="text-white" />}
                        </button>

                        {/* Share */}
                        <button
                            onClick={handleShare}
                            className="flex p-2 bg-white/10 hover:bg-white/25 rounded-full transition-all border border-white/10 shadow-sm items-center gap-1"
                            aria-label="مشاركة"
                        >
                            <Share2 size={14} className="text-white" />
                        </button>

                        {/* CTA */}
                        {onStartSession && (
                            <button
                                onClick={onStartSession}
                                className="hidden md:flex items-center gap-1.5 bg-white/20 hover:bg-white/35 text-white text-xs font-black px-4 py-2 rounded-full transition-all shadow-md border border-white/30 ml-1"
                            >
                                ابدأ المراجعة
                                <ArrowLeft size={12} />
                            </button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
