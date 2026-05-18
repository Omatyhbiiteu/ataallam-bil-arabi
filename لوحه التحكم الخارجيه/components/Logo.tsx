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
}) => {
    const sizes = {
        sm: { icon: 'w-8 h-8', iconSize: 32, text: 'text-sm', subText: 'text-[9px]' },
        md: { icon: 'w-11 h-11', iconSize: 44, text: 'text-base', subText: 'text-[10px]' },
        lg: { icon: 'w-16 h-16', iconSize: 64, text: 'text-2xl', subText: 'text-xs' },
        xl: { icon: 'w-24 h-24', iconSize: 96, text: 'text-4xl', subText: 'text-sm' },
    };

    const s = sizes[size];

    const bounceName = {
        animate: { y: [0, -5, 0, -2, 0] },
        transition: { duration: 1.6, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' as const },
    };

    const pulseGlow = {
        animate: {
            boxShadow: [
                '0 0 10px 0px rgba(245, 158, 11, 0)',
                '0 0 25px 4px rgba(245, 158, 11, 0.3)',
                '0 0 10px 0px rgba(245, 158, 11, 0)',
            ],
        },
        transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const },
    };

    const iconMarkup = (
        <svg viewBox="0 0 100 100" className={`${s.icon} flex-shrink-0`}>
            <defs>
                <linearGradient id="kg1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c0392b" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="kg2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <circle cx="35" cy="38" r="21" fill="none" stroke="url(#kg1)" strokeWidth="9" strokeLinecap="round" filter="url(#glow)" className="dark:hidden" />
            <circle cx="35" cy="38" r="21" fill="none" stroke="url(#kg2)" strokeWidth="9" strokeLinecap="round" filter="url(#glow)" className="hidden dark:block" />

            <circle cx="35" cy="38" r="9" fill="none" stroke="url(#kg1)" strokeWidth="5" className="dark:hidden" />
            <circle cx="35" cy="38" r="9" fill="none" stroke="url(#kg2)" strokeWidth="5" className="hidden dark:block" />

            <rect x="52" y="33" width="40" height="10" rx="5" fill="url(#kg1)" filter="url(#glow)" className="dark:hidden" />
            <rect x="52" y="33" width="40" height="10" rx="5" fill="url(#kg2)" filter="url(#glow)" className="hidden dark:block" />

            <rect x="75" y="43" width="8" height="12" rx="3" fill="url(#kg1)" className="dark:hidden" />
            <rect x="75" y="43" width="8" height="12" rx="3" fill="url(#kg2)" className="hidden dark:block" />
            <rect x="60" y="43" width="8" height="8" rx="3" fill="url(#kg1)" className="dark:hidden" />
            <rect x="60" y="43" width="8" height="8" rx="3" fill="url(#kg2)" className="hidden dark:block" />

            <motion.circle
                cx="35"
                cy="38"
                r="4"
                fill="#fbbf24"
                animate={{ opacity: [0.3, 0.8, 0.3], filter: ['blur(1px)', 'blur(2px)', 'blur(1px)'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const }}
            />

            {animated && (
                <motion.circle
                    cx="35"
                    cy="38"
                    r="28"
                    fill="none"
                    stroke="#fde68a"
                    strokeWidth="1.5"
                    initial={{ opacity: 0.4, r: 28 }}
                    animate={{ opacity: 0, r: 48 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' as const, delay: 1 }}
                />
            )}
        </svg>
    );

    return (
        <div className={`flex items-center gap-2 ${centered ? 'justify-center w-full' : ''} ${className} min-w-0 overflow-hidden`}>
            <motion.div
                className="relative flex-shrink-0 flex items-center justify-center rounded-full"
                animate={pulseGlow.animate}
                transition={pulseGlow.transition}
            >
                {iconMarkup}
            </motion.div>

            {variant !== 'icon' && (
                <div className={`flex flex-col justify-center ${centered ? 'items-center' : 'items-end'} min-w-0 overflow-hidden flex-shrink`}>
                    <motion.span
                        className={`font-black leading-none truncate bg-clip-text text-transparent bg-gradient-to-l from-amber-500 via-orange-500 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400 ${s.text}`}
                        style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}
                        animate={bounceName.animate}
                        transition={bounceName.transition}
                    >
                        مفتاح اللغة
                    </motion.span>
                    <span
                        className={`font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase ${s.subText} truncate`}
                        style={{ fontFamily: 'var(--font-latin)', direction: 'ltr', letterSpacing: '0.15em' }}
                    >
                        KeyLang
                    </span>
                </div>
            )}
        </div>
    );
};
