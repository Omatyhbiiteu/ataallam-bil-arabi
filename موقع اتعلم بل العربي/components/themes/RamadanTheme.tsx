import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Star, Fanoos } from './SharedElements';
import { RamadanCannon, StreetZina } from './ThemeVisualsExtras';

// ============================================================
// --- RAMADAN THEME COMPONENTS ---
// ============================================================

export const RamadanSun: React.FC = () => (
    <div className="absolute top-[5%] left-[6%] z-[2] w-[clamp(52px,7vw,96px)] h-[clamp(52px,7vw,96px)]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 shadow-[0_0_60px_rgba(251,191,36,0.55)]" />
        <div className="absolute -inset-2 rounded-full border border-amber-200/40" />
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

export const RamadanMosque: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    // Palette — night vs day
    const p = isDarkMode ? {
        sky: 'transparent',
        base: '#1a1035',          // Deep indigo base
        wall: '#2d2060',          // Main wall
        wallHi: '#3d2e80',          // Wall highlight face
        wallSha: '#160d40',          // Wall shadow face
        dome: '#3b2a70',          // Main dome
        domeFac: '#4e3d90',          // Dome lit face
        domeSha: '#1f1550',          // Dome shadow
        accent: '#7c5cbf',          // Dome ribs / windows ring
        accentHi: '#a07de0',          // Highlight accent
        gold: '#c9a227',          // Gold crescent
        goldGlow: 'rgba(201,162,39,0.6)',
        win: 'rgba(255,200,80,0.55)',   // Lit window
        winGlow: 'rgba(255,200,80,0.2)',
        door: '#120d38',
        doorArc: '#8060c0',
        minBase: '#251860',
        minWall: '#3B2B7A',
        minTop: '#4e3d90',
        ground: '#110c30',
        groundHi: '#1e1550',
        shadow: 'rgba(0,0,0,0.5)',
        glow: 'rgba(120,80,200,0.4)',
    } : {
        sky: 'transparent',
        base: '#e8dcc8',
        wall: '#f5edd8',          // Sandstone
        wallHi: '#fffbef',          // Lit face
        wallSha: '#c9b89a',          // Shadow face
        dome: '#d4c4a0',
        domeFac: '#ede0c0',
        domeSha: '#b5a07e',
        accent: '#9c7c3c',
        accentHi: '#cba84a',
        gold: '#c9a227',
        goldGlow: 'rgba(201,162,39,0)',
        win: 'rgba(180,120,30,0.3)',
        winGlow: 'rgba(180,120,30,0.1)',
        door: '#8b6914',
        doorArc: '#9c7c3c',
        minBase: '#ddd0b0',
        minWall: '#f0e6cc',
        minTop: '#c8b080',
        ground: '#b8a882',
        groundHi: '#d4c498',
        shadow: 'rgba(0,0,0,0.18)',
        glow: 'rgba(200,162,39,0.15)',
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[3]" style={{ height: '55vh', minHeight: 240, maxHeight: 540 }}>
            <svg
                viewBox="0 0 1000 500"
                preserveAspectRatio="xMidYMax meet"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="domeG" cx="35%" cy="25%" r="70%">
                        <stop offset="0%" stopColor={p.domeFac} />
                        <stop offset="60%" stopColor={p.dome} />
                        <stop offset="100%" stopColor={p.domeSha} />
                    </radialGradient>
                    <radialGradient id="sdomeG" cx="35%" cy="25%" r="70%">
                        <stop offset="0%" stopColor={p.accentHi} />
                        <stop offset="100%" stopColor={p.accent} />
                    </radialGradient>
                    <linearGradient id="wallG" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={p.wallSha} />
                        <stop offset="35%" stopColor={p.wallHi} />
                        <stop offset="100%" stopColor={p.wallSha} />
                    </linearGradient>
                    <linearGradient id="groundG" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={p.groundHi} />
                        <stop offset="100%" stopColor={p.ground} />
                    </linearGradient>
                    <radialGradient id="winG" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={p.win} />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor={p.shadow} />
                    </filter>
                    <filter id="crescGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                <rect x="0" y="440" width="1000" height="60" fill="url(#groundG)" />
                <rect x="100" y="438" width="800" height="4" fill={p.groundHi} opacity="0.4" />

                <rect x="80" y="400" width="840" height="42" fill="url(#wallG)" />
                {[100, 140, 180, 220, 260, 700, 740, 780, 820, 860].map((x, i) => (
                    <rect key={i} x={x} y="390" width="28" height="14" fill={p.wallHi} />
                ))}
                <path d="M462 400 L462 380 Q500 358 538 380 L538 400 Z" fill={p.door} />
                <path d="M462 380 Q500 355 538 380" fill="none" stroke={p.doorArc} strokeWidth="3" />

                <path d="M220 290 L780 290 L820 260 L180 260 Z" fill={p.wallSha} />
                <path d="M780 290 L780 400 L820 380 L820 260 Z" fill={p.wallSha} />
                <rect x="220" y="290" width="560" height="110" fill="url(#wallG)" />
                <path d="M220 290 L220 400 L180 380 L180 260 Z" fill={p.wallSha} />

                {[270, 340, 410, 480, 550, 620, 690].map((x, i) => (
                    <g key={i}>
                        <rect x={x} y="320" width="12" height="80" fill={p.accentHi} opacity="0.6" />
                        {i < 6 && (
                            <path
                                d={`M${x + 12} 360 L${x + 12} 345 Q${x + 47} 328 ${x + 82} 345 L${x + 82} 360 Z`}
                                fill={p.win}
                                opacity="0.7"
                            />
                        )}
                    </g>
                ))}

                <ellipse cx="500" cy="290" rx="95" ry="16" fill={p.dome} />
                <rect x="405" y="262" width="190" height="28" fill={p.dome} />
                <rect x="400" y="258" width="200" height="8" rx="2" fill={p.accent} />
                {[-70, -50, -30, -10, 10, 30, 50, 70].map((dx, i) => (
                    <g key={i}>
                        <ellipse cx={500 + dx} cy="275" rx="7" ry="10" fill={p.win} />
                        {isDarkMode && <ellipse cx={500 + dx} cy="275" rx="10" ry="14" fill={p.winGlow} />}
                    </g>
                ))}
                <ellipse cx="500" cy="262" rx="110" ry="130" fill="url(#domeG)" clipPath="url(#domeClip)" filter="url(#dropShadow)" />
                <clipPath id="domeClip">
                    <rect x="380" y="0" width="240" height="262" />
                </clipPath>
                {[-60, -30, 0, 30, 60].map((dx, i) => (
                    <line key={i} x1={500 + dx * 0.8} y1={262 - Math.sqrt(110 * 110 - (dx * 0.9) * (dx * 0.9)) + 10}
                        x2={500 + dx} y2="262" stroke={p.accentHi} strokeWidth="1" opacity="0.4" />
                ))}
                <circle cx="500" cy="135" r="14" fill={p.accent} />
                <circle cx="500" cy="135" r="10" fill={p.accentHi} />
                <g filter="url(#crescGlow)" transform="translate(500, 115)">
                    <path d="M-8 -14 A14 14 0 1 1 8 -14 A10 10 0 1 0 -8 -14 Z" fill={p.gold} />
                    <line x1="0" y1="-28" x2="0" y2="-38" stroke={p.gold} strokeWidth="2.5" />
                    <polygon points="-4,-38 0,-50 4,-38" fill={p.gold} />
                    {isDarkMode && <circle cx="0" cy="-44" r="8" fill={p.goldGlow} />}
                </g>

                {[-155, 155].map((dx, i) => (
                    <g key={i}>
                        <rect x={500 + dx - 55} y="300" width="110" height="20" fill={p.dome} />
                        <rect x={500 + dx - 58} y="296" width="116" height="7" rx="2" fill={p.accent} />
                        {[-30, 0, 30].map((ddx, j) => (
                            <ellipse key={j} cx={500 + dx + ddx} cy="308" rx="6" ry="8" fill={p.win} />
                        ))}
                        <ellipse cx={500 + dx} cy="300" rx="62" ry="76" fill="url(#sdomeG)" clipPath={`url(#sdClip${i})`} />
                        <clipPath id={`sdClip${i}`}>
                            <rect x={500 + dx - 70} y="0" width="140" height="300" />
                        </clipPath>
                        <ellipse cx={500 + dx} cy="300" rx="62" ry="8" fill={p.accentHi} opacity="0.3" />
                        <g transform={`translate(${500 + dx}, ${225})`} filter="url(#crescGlow)">
                            <path d="M-5 -10 A10 10 0 1 1 5 -10 A7 7 0 1 0 -5 -10 Z" fill={p.gold} />
                            <line x1="0" y1="-19" x2="0" y2="-27" stroke={p.gold} strokeWidth="2" />
                            <polygon points="-3,-27 0,-35 3,-27" fill={p.gold} />
                        </g>
                    </g>
                ))}

                {[[155, 390], [845, 390]].map(([x, by], ti) => (
                    <g key={ti}>
                        <rect x={x - 22} y={by - 20} width="44" height="20" fill={p.minBase} />
                        <rect x={x - 15} y={by - 160} width="30" height="140" fill={`url(#wallG)`} />
                        <rect x={x + 15} y={by - 160} width="6" height="140" fill={p.wallSha} />
                        {[0.3, 0.6].map((f, bi) => (
                            <rect key={bi} x={x - 16} y={by - 160 + 140 * f} width="32" height="5" rx="1" fill={p.accent} />
                        ))}
                        <rect x={x - 22} y={by - 172} width="44" height="12" rx="3" fill={p.accent} />
                        <rect x={x - 10} y={by - 230} width="20" height="58" fill={p.minWall} />
                        <rect x={x + 10} y={by - 230} width="4" height="58" fill={p.wallSha} />
                        <polygon points={`${x - 16},${by - 230} ${x + 20},${by - 230} ${x + 2},${by - 270}`} fill={p.minTop} />
                        <polygon points={`${x + 16},${by - 230} ${x + 22},${by - 230} ${x + 22},${by - 240} ${x + 2},${by - 270}`} fill={p.wallSha} />
                        <g transform={`translate(${x + 2}, ${by - 278})`} filter="url(#crescGlow)">
                            <path d="M-4 -8 A8 8 0 1 1 4 -8 A5.5 5.5 0 1 0 -4 -8 Z" fill={p.gold} />
                            <line x1="0" y1="-15" x2="0" y2="-22" stroke={p.gold} strokeWidth="1.5" />
                            <polygon points="-2,-22 0,-28 2,-22" fill={p.gold} />
                        </g>
                        {[by - 120, by - 75].map((wy, wi) => (
                            <ellipse key={wi} cx={x} cy={wy} rx="5" ry="8" fill={p.win} />
                        ))}
                    </g>
                ))}

                {[[230, 290], [770, 290], [300, 295], [700, 295]].map(([cx, cy], i) => (
                    <g key={i}>
                        <rect x={cx - 22} y={cy - 5} width="44" height="10" fill={p.accent} />
                        <ellipse cx={cx} cy={cy} rx="26" ry="32" fill="url(#sdomeG)" clipPath={`url(#cdClip${i})`} />
                        <clipPath id={`cdClip${i}`}>
                            <rect x={cx - 30} y={0} width={60} height={cy} />
                        </clipPath>
                        <g transform={`translate(${cx}, ${cy - 37})`}>
                            <path d="M-3 -6 A6 6 0 1 1 3 -6 A4 4 0 1 0 -3 -6 Z" fill={p.gold} />
                            <line x1="0" y1="-11" x2="0" y2="-16" stroke={p.gold} strokeWidth="1.5" />
                        </g>
                    </g>
                ))}

                <rect x="452" y="340" width="96" height="60" fill={p.door} />
                <path d="M452 340 L452 310 Q500 285 548 310 L548 340 Z" fill={p.door} />
                <path d="M452 310 Q500 282 548 310" fill="none" stroke={p.doorArc} strokeWidth="3" />
                <rect x="456" y="345" width="40" height="50" rx="1" fill={p.doorArc} opacity="0.3" />
                <rect x="504" y="345" width="40" height="50" rx="1" fill={p.doorArc} opacity="0.3" />
                <circle cx="480" cy="370" r="4" fill={p.gold} />
                <circle cx="520" cy="370" r="4" fill={p.gold} />
                <path d="M456 308 Q500 282 544 308" fill="none" stroke={p.gold} strokeWidth="2" opacity="0.7" />

                {[-160, -100, 100, 160].map((dx, i) => (
                    <g key={i}>
                        <rect x={500 + dx - 18} y="340" width="36" height="40" fill={p.win} />
                        <ellipse cx={500 + dx} cy="340" rx="18" ry="14" fill={p.win} />
                        {isDarkMode && <ellipse cx={500 + dx} cy="355" rx="25" ry="22" fill={p.winGlow} />}
                        <rect x={500 + dx - 19} y="338" width="38" height="2" fill={p.accent} opacity="0.6" />
                        <rect x={500 + dx - 19} y="380" width="38" height="2" fill={p.accent} opacity="0.6" />
                    </g>
                ))}

                {isDarkMode && (
                    <>
                        <ellipse cx="500" cy="260" rx="160" ry="40" fill={p.glow} style={{ filter: 'blur(20px)' }} />
                        <ellipse cx="500" cy="440" rx="300" ry="25" fill={p.shadow} style={{ filter: 'blur(12px)' }} />
                    </>
                )}

                {!isDarkMode && (
                    <ellipse cx="500" cy="445" rx="340" ry="20" fill={p.shadow} style={{ filter: 'blur(10px)' }} />
                )}
            </svg>
        </div>
    );
};

const RamadanTheme = ({ isDarkMode, density, visuals }: { isDarkMode: boolean; density: string; visuals: any }) => {
    return (
        <motion.div key="ramadan_l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
            {/* Day Mode: Authentic Egyptian Street Vibe */}
            {!isDarkMode && (
                <>
                    {/* Warm Sunlight/Sky */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#FFF8E1] to-[#D7CCC8]" />
                    <RamadanSun />

                    {/* Ramadan Mosque */}
                    <RamadanMosque isDarkMode={isDarkMode} />

                    {/* Street Decorations (Zina) hanging across */}
                    <StreetZina />

                    {/* Floating Clouds */}
                    {[...Array(3)].map((_, i) => <Cloud key={`c-${i}`} delay={i * 5} y={5 + i * 15} scale={0.6 + Math.random() * 0.4} duration={35 + i * 10} />)}

                    {/* Ramadan Cannon (Foreground) */}
                    <motion.div
                        className="absolute bottom-[5%] right-[10%] z-10"
                        initial={{ x: '100vw' }}
                        animate={{ x: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                    >
                        <RamadanCannon isDarkMode={isDarkMode} />
                    </motion.div>

                    {/* Day Fanoos — subtly visible */}
                    {visuals.fanoos.map((f: any, i: number) => (
                        <motion.div key={i} className="absolute top-0" style={{ left: `${f.x}%` }} animate={{ rotate: [-2, 2, -2], y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                            <Fanoos size={f.size * 0.8} isDarkMode={isDarkMode} color="#e65100" />
                        </motion.div>
                    ))}
                </>
            )}

            {/* Night Mode: Deep Sky + Mosque + Stars + Lanterns */}
            {isDarkMode && (
                <>
                    {/* Deep night sky */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #020410 0%, #070d20 30%, #0b1230 60%, #110d25 100%)' }} />

                    {/* Milky Way band */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(ellipse 80% 30% at 50% 40%, rgba(120,80,200,0.08) 0%, transparent 100%)'
                    }} />

                    {/* Rich star field — 3 layers */}
                    {[...Array(80)].map((_, i) => (
                        <motion.div
                            key={`s1-${i}`}
                            className="absolute rounded-full bg-white pointer-events-none"
                            style={{
                                width: 1 + (i % 4) * 0.6,
                                height: 1 + (i % 4) * 0.6,
                                left: `${(i * 1.27) % 100}%`,
                                top: `${(i * 1.31) % 55}%`,
                            }}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
                            transition={{ duration: 2 + (i % 5) * 0.8, repeat: Infinity, delay: (i * 0.15) % 8 }}
                        />
                    ))}

                    {/* Bright star clusters */}
                    {[
                        { x: 15, y: 8, size: 4 }, { x: 38, y: 5, size: 5 }, { x: 62, y: 12, size: 4 },
                        { x: 80, y: 6, size: 5 }, { x: 52, y: 18, size: 3 }, { x: 27, y: 15, size: 3 },
                    ].map((s, i) => (
                        <motion.div
                            key={`bs-${i}`}
                            className="absolute pointer-events-none"
                            style={{ left: `${s.x}%`, top: `${s.y}%` }}
                            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.5, 1] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                        >
                            <Star size={s.size} fill="#fffde7" className="drop-shadow-[0_0_4px_rgba(255,253,231,0.8)]" />
                        </motion.div>
                    ))}

                    <RamadanMoon />
                    <RamadanMosque isDarkMode={isDarkMode} />
                    <StreetZina />

                    {/* Larger, more dramatic Fanoos */}
                    {(density === 'high' ? [
                        { x: 8, size: 90, color: '#ffab00' },
                        { x: 22, size: 75, color: '#ce93d8' },
                        { x: 40, size: 100, color: '#ffcc80' },
                        { x: 60, size: 80, color: '#80cbc4' },
                        { x: 78, size: 88, color: '#ffab00' },
                    ] : [
                        { x: 15, size: 80, color: '#ffab00' },
                        { x: 55, size: 90, color: '#ffcc80' },
                        { x: 85, size: 75, color: '#ce93d8' },
                    ]).map((f, i) => (
                        <motion.div
                            key={`fn-${i}`}
                            className="absolute top-0"
                            style={{ left: `${f.x}%` }}
                            animate={{ rotate: [-4, 4, -4], y: [0, 15, 0] }}
                            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                        >
                            <Fanoos size={f.size} isDarkMode={isDarkMode} color={f.color} />
                        </motion.div>
                    ))}

                    {/* Golden dust particles — richer */}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={`gd-${i}`}
                            className="absolute rounded-full pointer-events-none"
                            style={{ width: 2 + (i % 3), height: 2 + (i % 3), background: i % 3 === 0 ? '#ffab00' : i % 3 === 1 ? '#ffe082' : '#fff8e1', filter: 'blur(0.5px)' }}
                            initial={{ opacity: 0, y: '100%', x: `${(i * 5.1) % 100}%` }}
                            animate={{ opacity: [0, 0.9, 0], y: '-20%', x: [`${(i * 5.1) % 100}%`, `${((i * 5.1) + 8) % 100}%`] }}
                            transition={{ duration: 8 + (i % 5), repeat: Infinity, ease: "linear", delay: (i * 0.5) % 8 }}
                        />
                    ))}

                    {/* Glowing Ramadan greeting */}
                    <motion.div
                        className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-20"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        <div className="font-black text-3xl md:text-5xl"
                            style={{ color: '#ffab00', textShadow: '0 0 30px rgba(255,171,0,0.8), 0 0 60px rgba(255,171,0,0.4)', fontFamily: 'serif' }}>
                            رمضان كريم
                        </div>
                        <motion.div className="text-amber-300/70 text-sm font-bold mt-2 tracking-widest"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}>
                            ✦ ✦ ✦
                        </motion.div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
};

export default RamadanTheme;
