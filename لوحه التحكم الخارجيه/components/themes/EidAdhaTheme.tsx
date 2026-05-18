import React from 'react';
import { motion } from 'framer-motion';

const STAR_POINTS = Array.from({ length: 50 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${5 + ((i * 19) % 60)}%`,
    size: 1 + (i % 3) * 0.8,
    delay: (i % 9) * 0.3,
    duration: 3 + (i % 5) * 0.6,
}));

const DUST_POINTS = Array.from({ length: 30 }, (_, i) => ({
    left: `${(i * 41) % 100}%`,
    top: `${15 + ((i * 23) % 65)}%`,
    size: 2 + (i % 4),
    delay: (i % 8) * 0.5,
    duration: 7 + (i % 5) * 1.2,
}));

const LANTERNS = [
    { left: '10%', size: 58, delay: 0 },
    { left: '28%', size: 44, delay: 1.2 },
    { left: '72%', size: 48, delay: 0.6 },
    { left: '88%', size: 62, delay: 1.8 },
];

const MOUNTAIN_LAYERS = [
    'M0 380 L0 246 C120 190 184 226 274 174 C372 118 426 196 526 142 C650 76 708 218 812 150 C922 76 1010 184 1200 118 L1200 380 Z',
    'M0 380 L0 306 C120 266 174 300 270 236 C376 166 470 288 602 204 C724 128 802 284 928 216 C1038 156 1110 228 1200 184 L1200 380 Z',
];

const GoldShimmer = () => (
    <defs>
        <linearGradient id="shimmerGradient" x1="-100%" y1="0%" x2="200%" y2="0%">
            <stop offset="0%" stopColor="#9f6b17" />
            <stop offset="25%" stopColor="#f8df90" />
            <stop offset="50%" stopColor="#fff8cf" />
            <stop offset="75%" stopColor="#f8df90" />
            <stop offset="100%" stopColor="#9f6b17" />
            <animate attributeName="x1" values="-100%; 200%" dur="4s" repeatCount="indefinite" />
            <animate attributeName="x2" values="0%; 300%" dur="4s" repeatCount="indefinite" />
        </linearGradient>
    </defs>
);

const Lantern: React.FC<{ size: number; isDarkMode: boolean; delay: number }> = ({ size, isDarkMode, delay }) => (
    <motion.div
        className="absolute top-0 pointer-events-none origin-top"
        style={{ width: size, height: size * 1.65 }}
        animate={{ 
            rotate: [-3, 3, -3],
            y: [0, 5, 0]
        }}
        transition={{ 
            rotate: { duration: 7 + delay, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 5 + delay, repeat: Infinity, ease: 'easeInOut' }
        }}
    >
        <div className="absolute left-1/2 top-[-150px] h-[156px] w-[2px] bg-gradient-to-b from-transparent to-amber-300/40" />
        <motion.div 
            className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
            style={{ 
                width: size * 2.5, 
                height: size * 2.5, 
                background: isDarkMode ? 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)',
                filter: 'blur(10px)'
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut' }}
        />
        <svg viewBox="0 0 80 130" className="h-full w-full relative z-10 drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)]">
            <defs>
                <linearGradient id={`lanternBody-${delay}`} x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#87530c" />
                    <stop offset="50%" stopColor="#f7d774" />
                    <stop offset="100%" stopColor="#87530c" />
                </linearGradient>
                <radialGradient id={`lanternGlow-${delay}`} cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#fff3b0" stopOpacity={isDarkMode ? 0.9 : 0.6} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
            </defs>
            <path d="M40 6 C50 10 50 20 40 24 C30 20 30 10 40 6 Z" fill="#d6a33a" />
            <path d="M22 25 H58 L66 40 H14 Z" fill={`url(#lanternBody-${delay})`} />
            <path d="M16 40 C10 65 12 90 22 106 H58 C68 90 70 65 64 40 Z" fill={isDarkMode ? 'rgba(8,21,32,0.4)' : 'rgba(255,255,255,0.3)'} stroke="#e7bd58" strokeWidth="1.5" style={{ backdropFilter: 'blur(2px)' }} />
            <ellipse cx="40" cy="72" rx="23" ry="31" fill={`url(#lanternGlow-${delay})`} />
            <circle cx="40" cy="72" r="8" fill="#ffffff" opacity={0.8} filter="blur(2px)" />
            {[24, 32, 40, 48, 56].map((x) => (
                <path key={x} d={`M${x} 41 C${x - 5} 62 ${x - 4} 84 ${x} 105`} stroke="#e7bd58" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
            ))}
            <path d="M22 106 H58 L51 120 H29 Z" fill={`url(#lanternBody-${delay})`} />
        </svg>
    </motion.div>
);

const Crescent: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <motion.div
        className="absolute right-[8%] top-[8%] z-[6] h-[90px] w-[90px] md:h-[120px] md:w-[120px] pointer-events-none"
        animate={{ y: [0, -12, 0], rotate: [-2, 4, -2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
        <motion.div 
            className="absolute inset-0 rounded-full"
            style={{ 
                background: isDarkMode ? 'radial-gradient(circle, rgba(246,214,110,0.3) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
                transform: 'scale(1.8)',
                filter: 'blur(15px)'
            }}
            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1.7, 1.9, 1.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <svg viewBox="0 0 110 110" className="h-full w-full relative z-10">
            <defs>
                <radialGradient id="adhaCrescentGold" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#fff8cf" />
                    <stop offset="70%" stopColor="#f6d66e" />
                    <stop offset="100%" stopColor="#9f6b17" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <path
                d="M58 8 C30 14 10 38 10 66 C10 92 31 106 54 106 C38 95 30 80 30 63 C30 36 47 18 70 10 C66 8 62 7 58 8 Z"
                fill="url(#adhaCrescentGold)"
                filter={isDarkMode ? 'drop-shadow(0 0 12px rgba(246,214,110,0.6))' : 'drop-shadow(0 8px 16px rgba(128,70,12,0.2))'}
            />
            <motion.path 
                d="M87 30 L91 41 L103 41 L93 48 L97 60 L87 53 L77 60 L81 48 L71 41 L83 41 Z" 
                fill="#fff3b0" 
                filter="url(#glow)"
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
        </svg>
    </motion.div>
);

const SacredHorizon: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="absolute inset-x-0 bottom-0 z-[5] h-[48vh] min-h-[300px] pointer-events-none">
        <svg viewBox="0 0 1200 430" preserveAspectRatio="none" className="h-full w-full">
            <defs>
                <linearGradient id="adhaGround" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isDarkMode ? '#0a1f1b' : '#dcb871'} />
                    <stop offset="100%" stopColor={isDarkMode ? '#030a08' : '#735226'} />
                </linearGradient>
                <linearGradient id="adhaArchitecture" x1="0%" x2="100%">
                    <stop offset="0%" stopColor={isDarkMode ? '#081715' : '#f0d69f'} />
                    <stop offset="50%" stopColor={isDarkMode ? '#132f29' : '#fff4d9'} />
                    <stop offset="100%" stopColor={isDarkMode ? '#081715' : '#e6be6e'} />
                </linearGradient>
                <linearGradient id="kaabaGradient" x1="0%" x2="100%">
                    <stop offset="0%" stopColor={isDarkMode ? '#040b0a' : '#1a1a1a'} />
                    <stop offset="50%" stopColor={isDarkMode ? '#0a1a18' : '#2d2d2d'} />
                    <stop offset="100%" stopColor={isDarkMode ? '#020605' : '#0f0f0f'} />
                </linearGradient>
                <GoldShimmer />
            </defs>

            {MOUNTAIN_LAYERS.map((path, i) => (
                <motion.path
                    key={i}
                    d={path}
                    fill={isDarkMode ? (i === 0 ? '#07161b' : '#0b201e') : (i === 0 ? '#cfa660' : '#e0c280')}
                    opacity={i === 0 ? 0.6 : 0.85}
                    animate={{ x: i === 0 ? [0, -25, 0] : [0, 20, 0] }}
                    transition={{ duration: 25 + i * 5, repeat: Infinity, ease: 'linear' }}
                />
            ))}

            <path d="M0 320 C160 286 270 330 430 292 C610 250 710 336 900 286 C1020 255 1115 282 1200 246 L1200 430 L0 430 Z" fill="url(#adhaGround)" />

            <g transform="translate(0 18)">
                <path d="M0 330 H1200 V430 H0 Z" fill={isDarkMode ? '#030a08' : '#6a4a27'} opacity="0.7" />
                
                <path d="M252 250 C296 185 370 185 414 250 Z" fill="url(#adhaArchitecture)" />
                <rect x="242" y="250" width="184" height="94" rx="10" fill="url(#adhaArchitecture)" />
                <path d="M252 250 L414 250" stroke="url(#shimmerGradient)" strokeWidth="3" />
                
                <rect x="540" y="198" width="134" height="150" rx="4" fill="url(#kaabaGradient)" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.5))" />
                <path d="M540 198 L586 158 H720 L674 198 Z" fill={isDarkMode ? '#111d1b' : '#3d3a33'} />
                <path d="M674 198 L720 158 V298 L674 348 Z" fill={isDarkMode ? '#020606' : '#0a0a0a'} />
                <rect x="540" y="215" width="134" height="22" fill="url(#shimmerGradient)" />
                <path d="M674 215 L720 175 V197 L674 237 Z" fill="#b8860b" opacity="0.8" />
                <rect x="595" y="280" width="36" height="68" rx="3" fill="url(#shimmerGradient)" opacity="0.95" />

                <rect x="782" y="242" width="174" height="102" rx="10" fill="url(#adhaArchitecture)" />
                <path d="M772 242 C815 178 923 178 966 242 Z" fill="url(#adhaArchitecture)" />
                <path d="M772 242 L966 242" stroke="url(#shimmerGradient)" strokeWidth="3" />
                
                {[174, 468, 1008].map((x, i) => (
                    <g key={x}>
                        <rect x={x} y={190 + i * 12} width="28" height={154 - i * 10} rx="14" fill="url(#adhaArchitecture)" filter="drop-shadow(4px 0 8px rgba(0,0,0,0.2))" />
                        <path d={`M${x - 6} ${190 + i * 12} C${x + 14} ${154 + i * 10} ${x + 34} ${190 + i * 12} ${x + 28} ${190 + i * 12} Z`} fill="url(#shimmerGradient)" />
                    </g>
                ))}
                
                <path d="M0 348 H1200" stroke="url(#shimmerGradient)" strokeWidth="4" opacity="0.85" />
            </g>
        </svg>
    </div>
);

const ShootingStar: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <motion.div
        className="absolute z-[4] h-[1px] w-[150px] pointer-events-none"
        style={{
            background: isDarkMode 
                ? 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)'
                : 'linear-gradient(90deg, rgba(255,240,180,1) 0%, rgba(255,240,180,0) 100%)',
            filter: 'blur(0.5px)',
            transformOrigin: 'right center',
        }}
        initial={{ top: '5%', right: '-10%', rotate: 30 }}
        animate={{
            x: ['0vw', '-100vw'],
            y: ['0vh', '60vh'],
            opacity: [0, 1, 1, 0]
        }}
        transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 10,
            ease: "linear"
        }}
    />
);

const Greeting: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <motion.div
        className="absolute left-1/2 top-[15%] z-[10] -translate-x-1/2 text-center pointer-events-none"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
    >
        <motion.div
            className="relative whitespace-nowrap rounded-3xl border border-white/20 px-8 py-5 text-3xl font-black md:text-5xl backdrop-blur-xl"
            style={{
                color: isDarkMode ? '#fff8cf' : '#2d1e0d',
                background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(16,42,35,0.7), rgba(4,18,14,0.85))'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(246,233,200,0.7))',
                boxShadow: isDarkMode 
                    ? '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)' 
                    : '0 20px 40px -10px rgba(139,90,24,0.2), inset 0 1px 1px rgba(255,255,255,0.8)',
            }}
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
            <div className="absolute inset-0 rounded-3xl p-[1px] -z-10 bg-gradient-to-r from-amber-200 via-yellow-500 to-amber-200 opacity-50 animate-[spin_4s_linear_infinite]" style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
            
            <span style={{
                background: 'linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% auto',
                animation: 'shine 4s linear infinite',
                filter: isDarkMode ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}>
                عيد أضحى مبارك
            </span>
        </motion.div>
        <motion.div
            className="mt-4 text-sm font-bold tracking-[0.4em] md:text-base"
            style={{ color: isDarkMode ? 'rgba(248,223,144,0.85)' : 'rgba(92,62,24,0.85)' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
            تقبل الله منا ومنكم
        </motion.div>
        
        <style dangerouslySetInnerHTML={{__html: `
            @keyframes shine {
                to { background-position: 200% center; }
            }
        `}} />
    </motion.div>
);

const EidAdhaTheme: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    return (
        <motion.div
            key="eid_adha_2026_premium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 overflow-hidden"
        >
            <div
                className="absolute inset-0"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(180deg, #020c0f 0%, #051c17 40%, #072b22 70%, #03140f 100%)'
                        : 'linear-gradient(180deg, #74a4bc 0%, #b5c7cd 40%, #fef9e7 70%, #d8b078 100%)',
                }}
            />

            <motion.div
                className="absolute inset-x-[-20%] top-[-30%] h-[75vh] rounded-full blur-[100px]"
                style={{
                    background: isDarkMode
                        ? 'radial-gradient(ellipse, rgba(37,120,95,0.25), transparent 70%)'
                        : 'radial-gradient(ellipse, rgba(255,250,220,0.95), transparent 70%)',
                }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            <Crescent isDarkMode={isDarkMode} />
            <ShootingStar isDarkMode={isDarkMode} />

            <div className="absolute inset-0 z-[3] pointer-events-none">
                {STAR_POINTS.map((star, i) => (
                    <motion.div
                        key={`star-${i}`}
                        className="absolute rounded-full"
                        style={{ 
                            left: star.left, top: star.top, width: star.size, height: star.size,
                            background: '#ffffff',
                            boxShadow: isDarkMode ? `0 0 ${star.size * 3}px rgba(255,255,255,0.9)` : `0 0 ${star.size * 3}px rgba(255,255,255,0.7)`
                        }}
                        animate={{ 
                            opacity: [0.1, 0.9, 0.1], 
                            scale: [1, 1.4, 1],
                        }}
                        transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
                    />
                ))}
                
                {DUST_POINTS.map((dust, i) => (
                    <motion.div
                        key={`dust-${i}`}
                        className="absolute rounded-full"
                        style={{
                            left: dust.left,
                            top: dust.top,
                            width: dust.size * 0.8,
                            height: dust.size * 0.8,
                            background: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)',
                            boxShadow: isDarkMode ? `0 0 ${dust.size}px rgba(255,255,255,0.3)` : `0 0 ${dust.size * 2}px rgba(255,255,255,0.4)`,
                            filter: `blur(${dust.size * 0.3}px)`
                        }}
                        animate={{ 
                            y: [0, -30, 0], 
                            x: [0, (i % 2 === 0 ? 10 : -10), 0],
                            opacity: [0, 0.7, 0] 
                        }}
                        transition={{ duration: dust.duration, repeat: Infinity, delay: dust.delay, ease: 'easeInOut' }}
                    />
                ))}
            </div>

            <div className="absolute inset-x-0 top-0 z-[7] flex h-[120px] items-start justify-between px-2 md:px-12">
                {LANTERNS.map((lantern) => (
                    <div key={lantern.left} className="absolute" style={{ left: lantern.left }}>
                        <Lantern size={lantern.size} isDarkMode={isDarkMode} delay={lantern.delay} />
                    </div>
                ))}
            </div>

            <Greeting isDarkMode={isDarkMode} />
            <SacredHorizon isDarkMode={isDarkMode} />

            <motion.div
                className="absolute inset-x-0 bottom-0 z-[9] h-[25%] pointer-events-none"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(0deg, rgba(1,5,4,0.95), rgba(2,12,9,0.5), transparent)'
                        : 'linear-gradient(0deg, rgba(70,45,15,0.4), rgba(120,80,30,0.15), transparent)',
                }}
            />
        </motion.div>
    );
};

export default EidAdhaTheme;
