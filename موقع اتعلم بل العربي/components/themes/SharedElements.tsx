import React, { useState, useEffect, useMemo, useId } from 'react';
import { motion } from 'framer-motion';
import { Star, Moon, Send } from 'lucide-react';

// Re-export lucide icons so theme modules can import from a single shared source
export { Star, Moon, Send };

// Fanoos (Islamic Lantern) — used in Ramadan theme
export const Fanoos: React.FC<{ size?: number; isDarkMode: boolean; color?: string }> = ({ size = 60, isDarkMode, color = "#ffab00" }) => (
    <motion.div
        className="relative"
        style={{ width: size, height: size * 1.5 }}
    >
        <div className="absolute top-[-400px] left-1/2 w-[1px] h-[400px] bg-gradient-to-b from-transparent to-amber-500/20" />
        <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-lg">
            <path d="M50 20 L80 45 L20 45 Z" fill={color} />
            <rect x="20" y="45" width="60" height="55" fill={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)"} stroke={color} strokeWidth="1" />
            <motion.circle
                cx="50" cy="72" r="12"
                fill={color}
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{ filter: "blur(12px)" }}
            />
            <rect x="15" y="100" width="70" height="10" rx="3" fill={color} />
            <path d="M20 110 L35 140 L65 140 L80 110 Z" fill={color} />
        </svg>
    </motion.div>
);


// ============================================================
// --- SHARED ENHANCED SVG COMPONENTS ---
// ============================================================

export const useDensity = () => {
    const [density, setDensity] = useState<'high' | 'medium' | 'low'>('high');

    useEffect(() => {
        const updateDensity = () => {
            if (window.innerWidth < 768) setDensity('low');
            else if (window.innerWidth < 1200) setDensity('medium');
            else setDensity('high');
        };
        updateDensity();
        window.addEventListener('resize', updateDensity);
        return () => window.removeEventListener('resize', updateDensity);
    }, []);

    return density;
};

export const GENTLE_SPRING = { type: 'spring', damping: 25, stiffness: 80 };

export const RamadanSun: React.FC = () => (
    <div className="absolute top-[5%] left-[6%] z-[2] w-[clamp(52px,7vw,96px)] h-[clamp(52px,7vw,96px)]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 shadow-[0_0_60px_rgba(251,191,36,0.55)]" />
        <div className="absolute -inset-2 rounded-full border border-amber-200/40" />
    </div>
);

export const Sun: React.FC = () => (
    <div className="absolute top-[5%] left-[5%] z-[10] w-[clamp(50px,8vw,90px)] h-[clamp(50px,8vw,90px)]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-100 via-yellow-400 to-orange-500 shadow-[0_0_70px_rgba(250,204,21,0.6)] animate-pulse" />
        <div className="absolute -inset-2 rounded-full border border-yellow-200/50" />
        <div className="absolute -inset-6 rounded-full border border-orange-300/20 blur-sm" />
    </div>
);

export const RamadanMoon: React.FC = () => {
    const maskId = useId();
    const gradId = useId();

    return (
        <div className="absolute top-[6%] left-[6%] z-[2] w-[clamp(44px,6vw,84px)] h-[clamp(44px,6vw,84px)]">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(226,232,240,0.35)]">
                <defs>
                    <radialGradient id={gradId} cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#d1d5db" />
                    </radialGradient>
                    <mask id={maskId}>
                        <rect width="100" height="100" fill="black" />
                        <circle cx="50" cy="50" r="46" fill="white" />
                        <circle cx="64" cy="42" r="36" fill="black" />
                    </mask>
                </defs>
                <circle cx="50" cy="50" r="46" fill={`url(#${gradId})`} mask={`url(#${maskId})`} />
            </svg>
        </div>
    );
};

export const Cloud: React.FC<{ delay: number; y: number; scale: number; duration: number }> = ({ delay, y, scale, duration }) => (
    <motion.div
        className="absolute opacity-60 pointer-events-none"
        style={{ top: `${y}%`, left: '-20%' }}
        animate={{ x: '120vw' }}
        transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    >
        <svg width={100 * scale} height={60 * scale} viewBox="0 0 100 60" fill="white">
            <path d="M10 40 Q25 10 50 30 T90 40 L90 55 L10 55 Z" fill="white" />
            <circle cx="30" cy="30" r="20" fill="white" />
            <circle cx="50" cy="25" r="25" fill="white" />
            <circle cx="70" cy="30" r="20" fill="white" />
        </svg>
    </motion.div>
);

export const Bird: React.FC<{ delay: number; y: number }> = ({ delay, y }) => (
    <motion.div
        className="absolute z-20 pointer-events-none"
        style={{ top: `${y}%`, left: '-5%' }}
        animate={{ x: '105vw', y: [0, -20, 0, 10, 0] }}
        transition={{ x: { duration: 25, repeat: Infinity, ease: "linear", delay }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
    >
        <motion.div
            style={{ width: 20, height: 10 }}
            animate={{ scaleY: [1, -0.5, 1] }}
            transition={{ duration: 0.3, repeat: Infinity }}
        >
            <svg viewBox="0 0 20 10" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                <path d="M0 5 Q10 12 20 5" />
            </svg>
        </motion.div>
    </motion.div>
);

export const Snowflake: React.FC<{ x: string; duration: number; delay: number; size: number; opacity: number }> = ({ x, duration, delay, size, opacity }) => (
    <motion.div
        className="absolute top-[-5%] pointer-events-none select-none text-white"
        style={{ left: x, fontSize: size, opacity }}
        animate={{ y: '110vh', rotate: [0, 180, 360], x: [0, 15, -15, 10, 0] }}
        transition={{ duration, repeat: Infinity, ease: 'linear', delay, x: { duration: duration * 0.4, repeat: Infinity, ease: 'easeInOut' } }}
    >
        {['❄', '❅', '❆', '✦'][Math.floor(Math.random() * 4)]}
    </motion.div>
);

export const Wave: React.FC<{ index: number; isDarkMode: boolean }> = ({ index, isDarkMode }) => {
    const colors = isDarkMode
        ? ['rgba(2,136,209,0.35)', 'rgba(2,136,209,0.25)', 'rgba(2,136,209,0.15)']
        : ['rgba(2,136,209,0.5)', 'rgba(2,136,209,0.35)', 'rgba(2,136,209,0.2)'];
    return (
        <motion.div
            className="absolute w-[200%] pointer-events-none"
            style={{
                bottom: `${index * 12}%`,
                left: '-50%',
                height: 70 + index * 15,
                background: colors[index],
                borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            }}
            animate={{ x: [0, index % 2 === 0 ? '8%' : '-8%', 0] }}
            transition={{ duration: 6 + index * 2, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
};

export const Seagull: React.FC<{ delay: number; y: number; size?: number }> = ({ delay, y, size = 1 }) => (
    <motion.div
        className="absolute pointer-events-none z-10"
        style={{ top: `${y}%`, left: '-5%' }}
        animate={{ x: '105vw', y: [0, -25, 10, -15, 0] }}
        transition={{
            x: { duration: 18 + delay * 3, repeat: Infinity, ease: 'linear', delay },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }}
    >
        <motion.svg
            width={32 * size} height={20 * size} viewBox="0 0 32 20" fill="none"
            animate={{ scaleY: [1, -0.6, 1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
        >
            {/* Left wing */}
            <path d="M16 10 Q6 2 0 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Right wing */}
            <path d="M16 10 Q26 2 32 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </motion.svg>
    </motion.div>
);

export const Butterfly: React.FC<{ color: string; x: string; y: string }> = ({ color, x, y }) => (
    <motion.div
        className="absolute w-4 h-4 pointer-events-none z-10"
        style={{ left: x, top: y }}
        animate={{
            x: [0, 15, -15, 0],
            y: [0, -25, -10, 0],
        }}
        transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
    >
        <motion.div
            className="w-full h-full"
            style={{ backgroundColor: color, borderRadius: '50%' }}
            animate={{ scaleX: [1, 0.2, 1] }}
            transition={{ duration: 0.2 + Math.random() * 0.2, repeat: Infinity }}
        />
    </motion.div>
);

export const EidCrescent: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="absolute top-[6%] right-[8%] z-[10] pointer-events-none">
        <motion.div
            animate={{ rotate: [0, 3, 0, -3, 0], filter: isDarkMode ? ['drop-shadow(0 0 12px rgba(255,215,0,0.6))', 'drop-shadow(0 0 25px rgba(255,215,0,0.9))', 'drop-shadow(0 0 12px rgba(255,215,0,0.6))'] : ['none'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <svg width="80" height="80" viewBox="0 0 100 100">
                <defs>
                    <radialGradient id="eidCrescG" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor={isDarkMode ? '#fff9c4' : '#fffde7'} />
                        <stop offset="60%" stopColor={isDarkMode ? '#ffd54f' : '#ffc107'} />
                        <stop offset="100%" stopColor={isDarkMode ? '#f9a825' : '#ff8f00'} />
                    </radialGradient>
                </defs>
                <path d="M50 10 A40 40 0 1 1 50 90 A28 28 0 1 0 50 10 Z" fill="url(#eidCrescG)" />
                {/* Star companion */}
                <polygon points="78,28 80,22 82,28 88,28 83,32 85,38 80,34 75,38 77,32 72,28" fill={isDarkMode ? '#ffd54f' : '#ffc107'} />
            </svg>
        </motion.div>
    </div>
);

export const Kaaba: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="absolute pointer-events-none select-none z-[5]" style={{ bottom: '18%', left: '50%', transform: 'translateX(-50%)' }}>
        <svg viewBox="0 0 160 180" width={120} height={135}>
            {/* Ground shadow */}
            <ellipse cx="80" cy="175" rx="70" ry="10" fill="rgba(0,0,0,0.25)" />
            {/* Main cube — 3D isometric */}
            {/* Front face */}
            <rect x="20" y="60" width="100" height="110" fill={isDarkMode ? '#1a1a1a' : '#212121'} />
            {/* Top face */}
            <path d="M20 60 L55 35 L140 35 L120 60 Z" fill={isDarkMode ? '#2a2a2a' : '#333'} />
            {/* Right face */}
            <path d="M120 60 L140 35 L140 145 L120 170 Z" fill={isDarkMode ? '#111' : '#1a1a1a'} />
            {/* Gold kiswa band */}
            <rect x="20" y="65" width="100" height="18" fill={isDarkMode ? '#b8860b' : '#c9a227'} opacity="0.9" />
            {/* Gold Arabic calligraphy on band */}
            <text x="70" y="79" textAnchor="middle" fontSize="7" fill={isDarkMode ? '#fff9c4' : '#fffde7'} fontFamily="serif" opacity="0.8">بسم الله الرحمن الرحيم</text>
            {/* Top band on top face */}
            <path d="M20 60 L55 35 L140 35 L120 60 Z" fill={isDarkMode ? '#b8860b' : '#c9a227'} opacity="0.4" />
            <path d="M55 35 L140 35 L140 43 L55 43 Z" fill={isDarkMode ? '#b8860b' : '#c9a227'} opacity="0.35" />
            {/* Door */}
            <rect x="55" y="110" width="30" height="60" rx="2" fill={isDarkMode ? '#b8860b' : '#c9a227'} />
            <rect x="58" y="113" width="24" height="54" rx="2" fill={isDarkMode ? '#8b6914' : '#a07820'} />
            {/* Door decorative arch */}
            <path d="M55 120 Q70 108 85 120" fill="none" stroke={isDarkMode ? '#ffd700' : '#daa520'} strokeWidth="1.5" />
            {/* Corner reinforcements */}
            {[20, 120].map((x, i) => (
                <rect key={i} x={x - 2} y="58" width="4" height="112" rx="1" fill={isDarkMode ? '#b8860b' : '#c9a227'} />
            ))}
            {/* Hajar Aswad (Black Stone) */}
            <ellipse cx="22" cy="95" rx="5" ry="7" fill="#0a0a0a" />
            <ellipse cx="22" cy="95" rx="3" ry="4" fill={isDarkMode ? '#111' : '#1a1a1a'} stroke={isDarkMode ? '#b8860b' : '#c9a227'} strokeWidth="1" />
            {/* Glow effect around Kaaba at night */}
            {isDarkMode && <ellipse cx="80" cy="110" rx="65" ry="60" fill="rgba(184,134,11,0.08)" style={{ filter: 'blur(15px)' }} />}
        </svg>
    </div>
);

export const PalmTree: React.FC<{ isDarkMode: boolean; x: string; scale?: number; flipped?: boolean }> = ({ isDarkMode, x, scale = 1, flipped = false }) => (
    <div className="absolute bottom-0 pointer-events-none select-none z-[4]"
        style={{ left: x, transform: `scale(${scale}) scaleX(${flipped ? -1 : 1})`, transformOrigin: 'bottom center' }}>
        <svg viewBox="0 0 100 200" width={80} height={160}>
            {/* Trunk — curved */}
            <path d="M48 200 Q44 160 42 130 Q40 100 46 70 Q48 50 50 30" stroke={isDarkMode ? '#5d4037' : '#795548'} strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M52 200 Q56 160 58 130 Q60 100 54 70 Q52 50 50 30" stroke={isDarkMode ? '#4e342e' : '#6d4c41'} strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Trunk texture lines */}
            {[170, 150, 130, 110, 90, 70, 50].map((y, i) => (
                <line key={i} x1={48 - i * 0.3} y1={y} x2={53 - i * 0.3} y2={y + 4} stroke={isDarkMode ? '#3e2723' : '#5d4037'} strokeWidth="1.5" />
            ))}
            {/* Fronds */}
            {[
                { d: 'M50 30 Q20 10 -5 25', w: 5 },
                { d: 'M50 30 Q80 10 105 25', w: 5 },
                { d: 'M50 30 Q30 0 20 -15', w: 4 },
                { d: 'M50 30 Q70 0 80 -15', w: 4 },
                { d: 'M50 30 Q15 25 -10 40', w: 4 },
                { d: 'M50 30 Q85 25 110 40', w: 4 },
                { d: 'M50 30 Q50 5 50 -10', w: 5 },
            ].map((fr, i) => (
                <path key={i} d={fr.d} stroke={isDarkMode ? '#1b5e20' : '#2e7d32'} strokeWidth={fr.w} fill="none" strokeLinecap="round" />
            ))}
            {/* Spine on each frond */}
            {[
                { d: 'M50 30 Q20 10 -5 25' },
                { d: 'M50 30 Q80 10 105 25' },
            ].map((fr, i) => (
                <path key={i} d={fr.d} stroke={isDarkMode ? '#388e3c' : '#43a047'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            ))}
            {/* Coconuts */}
            <circle cx="44" cy="33" r="5" fill={isDarkMode ? '#bf360c' : '#d84315'} />
            <circle cx="56" cy="35" r="4" fill={isDarkMode ? '#bf360c' : '#d84315'} />
        </svg>
    </div>
);

export const EidLantern: React.FC<{ isDarkMode: boolean; color?: string; size?: number }> = ({ isDarkMode, color = '#c9a227', size = 70 }) => (
    <div style={{ width: size, height: size * 1.6 }} className="relative">
        {/* String */}
        <div className="absolute top-[-80px] left-1/2 w-[1px] h-20 bg-gradient-to-b from-transparent to-current opacity-30" />
        <svg viewBox="0 0 70 112" className="w-full h-full drop-shadow-2xl">
            {/* Top hook */}
            <path d="M35 5 Q42 0 42 8 L42 15 L28 15 L28 8 Q28 0 35 5 Z" fill={color} />
            {/* Upper cap */}
            <path d="M20 15 L50 15 L55 25 L15 25 Z" fill={color} />
            {/* Body */}
            <path d="M15 25 Q10 55 15 85 L55 85 Q60 55 55 25 Z" fill={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)'} stroke={color} strokeWidth="1.5" />
            {/* Vertical ribs */}
            {[-15, -7, 0, 7, 15].map((dx, i) => (
                <path key={i} d={`M${35 + dx} 25 Q${35 + dx * 1.3} 55 ${35 + dx} 85`} stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
            ))}
            {/* Inner glow */}
            <ellipse cx="35" cy="55" rx="16" ry="24" fill={color} opacity={isDarkMode ? 0.35 : 0.2} style={{ filter: 'blur(8px)' }} />
            {/* Lower cap */}
            <path d="M15 85 L55 85 L50 95 L20 95 Z" fill={color} />
            {/* Hanging tassels */}
            {[22, 30, 38, 46].map((x, i) => (
                <g key={i}>
                    <line x1={x} y1="95" x2={x - (i % 2 === 0 ? 2 : -2)} y2={108} stroke={color} strokeWidth="1" />
                    <circle cx={x - (i % 2 === 0 ? 2 : -2)} cy={109} r="2" fill={color} />
                </g>
            ))}
        </svg>
    </div>
);

export const Firework: React.FC<{ delay: number; color: string; x: string; y: string }> = ({ delay, color, x, y }) => (
    <motion.div
        className="absolute z-10 pointer-events-none"
        style={{ left: x, top: y }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1.5], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay, ease: "easeOut" }}
    >
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={`ray-${i}`}
                className="absolute w-1 rounded-full"
                style={{
                    height: 15,
                    backgroundColor: color,
                    rotate: i * 30,
                    bottom: 0,
                    left: -2,
                    transformOrigin: 'bottom center',
                }}
                animate={{ height: [0, 20, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay, ease: "easeOut" }}
            />
        ))}
    </motion.div>
);

export const Dune: React.FC<{ color: string; height: string; delay: number }> = ({ color, height, delay }) => (
    <motion.div
        className="absolute bottom-0 w-[150%] left-[-25%]"
        style={{
            height,
            backgroundColor: color,
            borderRadius: '50% 50% 0 0',
        }}
        animate={{ x: ['0%', '-5%', '0%'] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay }}
    />
);

export const EgyptianFlag: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
    <motion.div
        style={{
            width: 120 * scale,
            height: 80 * scale,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            borderRadius: 4,
            overflow: 'hidden'
        }}
        animate={{
            skewY: [-2, 2, -2],
            scaleY: [0.95, 1.05, 0.95]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
        <div className="flex-1 bg-[#ce1126]" /> 
        <div className="flex-1 bg-white flex items-center justify-center relative">
            <div className="w-8 h-8 rounded-full bg-amber-400 absolute opacity-30" />
            <svg viewBox="0 0 100 100" className="w-6 h-6 z-10">
                <path d="M50 10 L65 50 L50 90 L35 50 Z" fill="#b8860b" />
            </svg>
        </div>
        <div className="flex-1 bg-[#000000]" />
    </motion.div>
);
