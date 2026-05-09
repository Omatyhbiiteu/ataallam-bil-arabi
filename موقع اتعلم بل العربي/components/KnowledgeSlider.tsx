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
                    className={`bg-gradient-to-l ${activeGradient} px-5 py-4 flex items-center gap-4`}
                >
                    {/* Icon */}
                    <div className="shrink-0 w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
                        <Icon size={20} className="text-white" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p
                            className="text-white font-bold text-sm md:text-base leading-snug truncate"
                            style={{ fontFamily: '"Traditional Arabic", "Amiri", serif' }}
                        >
                            "{slide.text}"
                        </p>
                        <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase mt-0.5 block">
                            {slide.source}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-2">
                        {/* Slide dots */}
                        <div className="hidden sm:flex items-center gap-1 ml-2">
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
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/10"
                            aria-label="السابق"
                        >
                            <ArrowRight size={14} className="text-white" />
                        </button>
                        <button
                            onClick={() => setCurrentSlide(p => (p + 1) % KNOWLEDGE_SLIDES.length)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/10"
                            aria-label="التالي"
                        >
                            <ArrowLeft size={14} className="text-white" />
                        </button>

                        {/* Copy */}
                        <button
                            onClick={handleCopy}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/10"
                            aria-label="نسخ"
                        >
                            {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} className="text-white" />}
                        </button>

                        {/* Share */}
                        <button
                            onClick={handleShare}
                            className="hidden sm:flex p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/10 items-center gap-1"
                            aria-label="مشاركة"
                        >
                            <Share2 size={14} className="text-white" />
                        </button>

                        {/* CTA */}
                        {onStartSession && (
                            <button
                                onClick={onStartSession}
                                className="hidden md:flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black px-3 py-1.5 rounded-xl transition border border-white/20 ml-1"
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
