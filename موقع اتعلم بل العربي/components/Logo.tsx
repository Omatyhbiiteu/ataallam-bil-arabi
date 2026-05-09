import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    variant?: 'full' | 'icon' | 'bilingual';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    animated?: boolean;
    centered?: boolean;
    blueOnDesktop?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    className = '',
    variant = 'full',
    size = 'md',
    animated = false,
    centered = false,
    blueOnDesktop = false
}) => {
    const sizes = {
        sm: {
            h: 'h-8',
            icon: 'w-6 h-6 md:w-7 md:h-7',
            iconSize: 24,
            text: 'text-base md:text-lg',
            bilingualText: 'text-[8px] md:text-[9px]'
        },
        md: {
            h: 'h-10',
            icon: 'w-9 h-9 md:w-10 md:h-10',
            iconSize: 40,
            text: 'text-xl md:text-2xl',
            bilingualText: 'text-[9px] md:text-[10px]'
        },
        lg: {
            h: 'h-16',
            icon: 'w-14 h-14 md:w-16 md:h-16',
            iconSize: 64,
            text: 'text-3xl md:text-4xl',
            bilingualText: 'text-[11px] md:text-[12px]'
        },
        xl: {
            h: 'h-24',
            icon: 'w-20 h-20 md:w-24 md:h-24',
            iconSize: 96,
            text: 'text-5xl md:text-6xl',
            bilingualText: 'text-[14px] md:text-[16px]'
        },
    };

    const currentSize = sizes[size];

    // Final Design: The Geometric Open Book with Rising Quill
    const iconMarkup = (
        <svg
            viewBox="0 0 100 100"
            className={`${currentSize.icon} drop-shadow-lg transition-transform duration-500`}
        >
            <defs>
                {/* Light Mode Gradient: Dark Slate */}
                <linearGradient id="proLogoGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0F172A" />    {/* Slate 900 */}
                    <stop offset="60%" stopColor="#334155" />    {/* Slate 700 */}
                    <stop offset="100%" stopColor="#1E293B" />   {/* Slate 800 */}
                </linearGradient>

                {/* Dark Mode Gradient: Bright Silver/White */}
                <linearGradient id="proLogoGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F8FAFC" />    {/* Slate 50 */}
                    <stop offset="60%" stopColor="#CBD5E1" />    {/* Slate 300 */}
                    <stop offset="100%" stopColor="#94A3B8" />   {/* Slate 400 */}
                </linearGradient>

                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D97706" /> {/* Amber 600 */}
                    <stop offset="100%" stopColor="#F59E0B" /> {/* Amber 500 */}
                </linearGradient>
            </defs>

            {/* 1. THE BOOK - Smart Stroke Color based on Dark Mode */}
            <motion.g
                initial={animated ? { scaleY: 0 } : {}}
                animate={animated ? { scaleY: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut" }}
            >
                {/* Book Pages with 'stroke-current' logic via class names isn't enough for gradients, 
                    so we use CSS variables or classes to switch path stroke. 
                    Here we use the 'dark:hidden' and 'hidden dark:block' trick for dual paths or simpler: classes.
                */}

                {/* Light Mode Book Path (Dark Stroke) */}
                <path
                    d="M 15 35 Q 35 35, 50 65 V 95 Q 35 65, 15 65 Z"
                    fill="none"
                    stroke="url(#proLogoGradientLight)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="dark:hidden"
                />
                <path
                    d="M 85 35 Q 65 35, 50 65 V 95 Q 65 65, 85 65 Z"
                    fill="none"
                    stroke="url(#proLogoGradientLight)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="dark:hidden"
                />

                {/* Dark Mode Book Path (Light Stroke) */}
                <path
                    d="M 15 35 Q 35 35, 50 65 V 95 Q 35 65, 15 65 Z"
                    fill="none"
                    stroke="url(#proLogoGradientDark)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="hidden dark:block"
                />
                <path
                    d="M 85 35 Q 65 35, 50 65 V 95 Q 65 65, 85 65 Z"
                    fill="none"
                    stroke="url(#proLogoGradientDark)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="hidden dark:block"
                />


                {/* Page Lines (Subtle details) */}
                <path d="M 20 45 Q 35 45, 45 65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-20 text-slate-800 dark:text-slate-200" />
                <path d="M 80 45 Q 65 45, 55 65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-20 text-slate-800 dark:text-slate-200" />
            </motion.g>

            {/* 2. THE QUILL & ALIF - Always Gold (Good contrast on both) */}
            <motion.g
                initial={animated ? { y: 20, opacity: 0 } : {}}
                animate={animated ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.8, duration: 1, type: "spring" }}
            >
                {/* The Central Quill Shaft / Spine */}
                <path
                    d="M 50 10 L 50 65"
                    stroke="url(#goldGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                {/* Abstract Feather Vanes (Geometric) */}
                <path
                    d="M 50 15 Q 70 20, 65 40 L 50 35"
                    fill="url(#goldGradient)"
                    opacity="0.9"
                />

                {/* The Dot (Nuqtah) - Floating Above */}
                <rect
                    x="47" y="2" width="6" height="6"
                    fill="#D97706"
                    transform="rotate(45 50 5)"
                    className="animate-pulse"
                />
            </motion.g>
        </svg>
    );

    return (
        <div className={`flex items-center gap-3 ${centered ? 'justify-center w-full' : 'justify-end'} ${className} relative`} dir="ltr">
            {/* Visual Balance Spacer */}
            {centered && variant !== 'icon' && (
                <div style={{ width: currentSize.iconSize }} className="shrink-0" />
            )}

            {(variant === 'full' || variant === 'bilingual') && (
                <div className={`flex flex-col justify-center ${centered ? 'items-center' : 'items-end'} min-w-0 overflow-hidden`}>
                    <div className={`font-black tracking-tight ${currentSize.text} leading-none flex items-center gap-2 ${centered ? 'justify-center' : 'justify-end'}`}>
                        {/* Title - Professional Slate & Gold */}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 font-extrabold" style={{ fontFamily: 'Noto Kufi Arabic, sans-serif' }}>
                            اتعلم بالعربي
                        </span>
                    </div>
                    {/* Subtitle - Elegant & Subtle */}
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-px bg-amber-500/50 w-3 rounded-full"></div>
                        <span className={`${currentSize.bilingualText} font-bold text-amber-600 dark:text-amber-400 tracking-wider whitespace-nowrap`}>
                            (أمة اقرأ)
                        </span>
                        <div className="h-px bg-amber-500/50 w-3 rounded-full"></div>
                    </div>
                </div>
            )}

            <div className="relative group shrink-0 flex items-center justify-center">
                {/* Subtle Glow Effect */}
                <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                {iconMarkup}
            </div>
        </div>
    );
};
