import React from 'react';
import { motion } from 'framer-motion';
import { Cloud } from './SharedElements';

// ============================================================
// --- EID FITR THEME COMPONENTS ---
// ============================================================

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

export const EidGrassBlades: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[6]" style={{ height: 100 }}>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full">
            <rect x="0" y="60" width="1000" height="40" fill={isDarkMode ? '#0f1f0f' : '#2e7d32'} />
            {[...Array(40)].map((_, i) => {
                const x = (i / 40) * 1000 + (i % 3) * 8;
                const h = 30 + (i % 5) * 8;
                const col = isDarkMode ? (i % 3 === 0 ? '#1b5e20' : i % 3 === 1 ? '#2e7d32' : '#388e3c') : (i % 3 === 0 ? '#43a047' : i % 3 === 1 ? '#4caf50' : '#66bb6a');
                return (
                    <path key={i} d={`M${x} 60 Q${x - 8} ${60 - h / 2} ${x + (i % 2 === 0 ? -5 : 5)} ${60 - h}`}
                        stroke={col} strokeWidth="3" fill="none" strokeLinecap="round" />
                );
            })}
            {[80, 210, 370, 510, 650, 790, 930].map((x, i) => (
                <g key={i} transform={`translate(${x}, 52)`}>
                    <circle cx="0" cy="-5" r="4" fill={['#ff4081', '#ff9800', '#ffeb3b', '#e040fb', '#40c4ff', '#69f0ae', '#ff4081'][i]} />
                    <circle cx="0" cy="0" r="2" fill="#fff" opacity="0.7" />
                </g>
            ))}
        </svg>
    </div>
);

export const Firework: React.FC<{ delay: number; color: string; x: string; y: string }> = ({ delay, color, x, y }) => (
    <motion.div
        className="absolute"
        style={{ left: x, top: y }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
            scale: [0, 1.5],
            opacity: [1, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: delay, ease: "easeOut", repeatDelay: Math.random() * 3 }}
    >
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-1 h-8 origin-bottom rounded-full"
                style={{
                    backgroundColor: color,
                    rotate: i * 30,
                    bottom: 0
                }}
            />
        ))}
        {/* Core Flash */}
        <div className="absolute -left-2 -top-2 w-4 h-4 bg-white rounded-full blur-[4px]" />
    </motion.div>
);

const EidFitrTheme = ({ isDarkMode }: { isDarkMode: boolean }) => {
    return (
        <motion.div key="eid_fitr_l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0 overflow-hidden">

            {/* ────────────────────────────────────────
                DAY MODE — Radiant Eid Morning
            ──────────────────────────────────────── */}
            {!isDarkMode && (
                <>
                    {/* Day Sky: soft gradient dawn → noon */}
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, #c8e6fe 0%, #e0f0ff 25%, #f5faff 55%, #fef6e4 80%, #fde8c8 100%)'
                    }} />

                    {/* Soft radial glow — sun halo */}
                    <motion.div className="absolute pointer-events-none"
                        style={{ top: '3%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,220,100,0.35) 0%, transparent 70%)', filter: 'blur(20px)' }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Sun */}
                    <div className="absolute z-[2]" style={{ top: '4%', right: '9%' }}>
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: '#fffde7', transform: 'scale(2)' }} />
                            <div className="w-16 h-16 rounded-full shadow-2xl" style={{ background: 'radial-gradient(circle at 35% 30%, #fffde7, #FFD600 50%, #FFB300)' }}>
                                <div className="absolute top-[18%] left-[18%] w-4 h-4 bg-white/50 rounded-full blur-[3px]" />
                            </div>
                            {[...Array(12)].map((_, i) => (
                                <motion.div key={i} className="absolute top-1/2 left-1/2 origin-left"
                                    style={{ width: 16 + (i % 3) * 5, height: 2, rotate: i * 30, marginTop: -1, marginLeft: 32, background: 'linear-gradient(90deg, #FFD600cc, transparent)', borderRadius: 4 }}
                                    animate={{ opacity: [0.4, 0.9, 0.4], scaleX: [0.7, 1, 0.7] }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.1 }} />
                            ))}
                        </div>
                    </div>

                    {/* Scattered cloud wisps */}
                    {[{ d: 0, y: 5, s: 0.9, dur: 55 }, { d: 15, y: 12, s: 0.65, dur: 70 }, { d: 8, y: 8, s: 0.75, dur: 45 }]
                        .map((c, i) => <Cloud key={i} delay={c.d} y={c.y} scale={c.s} duration={c.dur} />)}

                    {/* Gold sparkle shimmer over sky */}
                    {[...Array(18)].map((_, i) => (
                        <motion.div key={`spark-${i}`} className="absolute pointer-events-none select-none text-amber-400"
                            style={{ left: `${(i * 5.7 + 3) % 98}%`, top: `${5 + (i % 5) * 9}%`, fontSize: 10 + (i % 3) * 4, opacity: 0 }}
                            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
                            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.55, ease: 'easeInOut' }}>
                            ✦
                        </motion.div>
                    ))}

                    {/* Eid Greeting Banner — Day */}
                    <motion.div className="absolute z-20 pointer-events-none text-center"
                        style={{ top: '7%', left: '50%', transform: 'translateX(-50%)' }}
                        animate={{ y: [0, -7, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                        <div className="font-black text-3xl md:text-5xl px-7 py-3 rounded-2xl whitespace-nowrap"
                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,248,220,0.92))', border: '1.5px solid rgba(201,162,39,0.45)', boxShadow: '0 8px 40px rgba(201,162,39,0.25), inset 0 1px 0 rgba(255,255,255,0.8)', color: '#1a3c1a', textShadow: '0 1px 6px rgba(0,80,0,0.15)' }}>
                            🌙✨ عيد مبارك سعيد ✨🌙
                        </div>
                        <motion.div className="text-amber-700 text-sm mt-2 font-bold tracking-widest"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2.5, repeat: Infinity }}>
                            ✦ تقبل الله صيامكم وقيامكم ✦
                        </motion.div>
                    </motion.div>

                    {/* Floating Eid Lanterns — day toned */}
                    {[{ x: '3%', color: '#e65100', size: 58 }, { x: '18%', color: '#c9a227', size: 48 }, { x: '76%', color: '#6a1b9a', size: 52 }, { x: '91%', color: '#00695c', size: 58 }].map((l, i) => (
                        <motion.div key={i} className="absolute top-0" style={{ left: l.x }}
                            animate={{ rotate: [-5, 5, -5], y: [0, 12, 0] }}
                            transition={{ duration: 5 + i * 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}>
                            <EidLantern isDarkMode={isDarkMode} color={l.color} size={l.size} />
                        </motion.div>
                    ))}

                    {/* Confetti / flower petals */}
                    {[...Array(22)].map((_, i) => (
                        <motion.div key={`petal-${i}`} className="absolute pointer-events-none"
                            style={{ width: 8 + (i % 3) * 3, height: 8 + (i % 3) * 3, borderRadius: i % 2 === 0 ? '50%' : '50% 0 50% 0', background: ['#ff80ab', '#ffd740', '#40c4ff', '#b9f6ca', '#ea80fc', '#ff6d00'][i % 6], opacity: 0.85 }}
                            initial={{ left: `${(i * 4.8) % 100}%`, top: '-5%', rotate: 0 }}
                            animate={{ top: '108vh', rotate: [0, 360], x: [0, (i % 2 === 0 ? 30 : -30), 0] }}
                            transition={{ duration: 6 + (i % 5), repeat: Infinity, ease: 'linear', delay: (i * 0.45) % 8 }} />
                    ))}
                </>
            )}

            {/* ────────────────────────────────────────
                NIGHT MODE — Majestic Eid Night
            ──────────────────────────────────────── */}
            {isDarkMode && (
                <>
                    {/* Deep night sky */}
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, #010610 0%, #040d22 20%, #071228 45%, #091620 70%, #0a1f14 90%, #061204 100%)'
                    }} />

                    {/* Subtle Milky Way shimmer */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(ellipse 80% 35% at 55% 25%, rgba(100,140,200,0.07) 0%, transparent 100%)'
                    }} />

                    {/* Dense star field */}
                    {[...Array(90)].map((_, i) => (
                        <motion.div key={`es-${i}`} className="absolute rounded-full bg-white pointer-events-none"
                            style={{ width: 1 + (i % 4) * 0.5, height: 1 + (i % 4) * 0.5, left: `${(i * 1.12) % 100}%`, top: `${(i * 1.09) % 58}%` }}
                            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.6, 1] }}
                            transition={{ duration: 1.5 + (i % 6) * 0.5, repeat: Infinity, delay: (i * 0.11) % 8 }} />
                    ))}

                    {/* Crescent moon */}
                    <motion.div className="absolute z-[10] pointer-events-none"
                        style={{ top: '4%', right: '7%' }}
                        animate={{ rotate: [0, 3, 0, -3, 0], filter: ['drop-shadow(0 0 14px rgba(255,220,80,0.7))', 'drop-shadow(0 0 28px rgba(255,220,80,1))', 'drop-shadow(0 0 14px rgba(255,220,80,0.7))'] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
                        <svg width="100" height="100" viewBox="0 0 120 120">
                            <defs>
                                <radialGradient id="eidNightCrescG" cx="30%" cy="28%" r="72%">
                                    <stop offset="0%" stopColor="#fffde7" />
                                    <stop offset="55%" stopColor="#ffd54f" />
                                    <stop offset="100%" stopColor="#f9a825" />
                                </radialGradient>
                            </defs>
                            <ellipse cx="55" cy="55" rx="52" ry="52" fill="rgba(255,215,0,0.06)" style={{ filter: 'blur(8px)' }} />
                            <path d="M60 12 A48 48 0 1 1 60 108 A34 34 0 1 0 60 12 Z" fill="url(#eidNightCrescG)" />
                            <ellipse cx="44" cy="34" rx="8" ry="5" fill="rgba(255,255,255,0.3)" style={{ filter: 'blur(2px)' }} />
                            <polygon points="100,28 102,22 104,28 110,28 105,32 107,38 102,34 97,38 99,32 94,28" fill="#ffd54f" opacity="0.9" />
                            <polygon points="90,55 91,51 92,55 96,55 93,57 94,61 91,59 88,61 89,57 86,55" fill="#ffd54f" opacity="0.7" />
                        </svg>
                    </motion.div>

                    {/* Elegant hanging lanterns */}
                    {[
                        { x: '2%', color: '#c9a227', size: 72 },
                        { x: '14%', color: '#e91e63', size: 58 },
                        { x: '28%', color: '#9c27b0', size: 52 },
                        { x: '68%', color: '#00bcd4', size: 54 },
                        { x: '82%', color: '#c9a227', size: 62 },
                        { x: '94%', color: '#4caf50', size: 68 },
                    ].map((l, i) => (
                        <motion.div key={i} className="absolute top-0" style={{ left: l.x }}
                            animate={{ rotate: [-6, 6, -6], y: [0, 14, 0] }}
                            transition={{ duration: 5 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}>
                            <EidLantern isDarkMode={isDarkMode} color={l.color} size={l.size} />
                        </motion.div>
                    ))}

                    {/* Glowing Arabic greeting banner */}
                    <motion.div className="absolute z-20 pointer-events-none text-center"
                        style={{ top: '7%', left: '50%', transform: 'translateX(-50%)' }}
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 4, repeat: Infinity }}>
                        <div className="font-black text-3xl md:text-5xl whitespace-nowrap"
                            style={{ color: '#ffd54f', textShadow: '0 0 20px rgba(255,200,80,0.9), 0 0 50px rgba(255,200,80,0.5), 0 0 90px rgba(255,200,80,0.2)', fontFamily: 'serif', letterSpacing: '0.04em' }}>
                            🌙 عيد مبارك سعيد 🌙
                        </div>
                        <motion.div className="text-amber-400/80 text-sm font-bold mt-2 tracking-widest"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2.5, repeat: Infinity }}>
                            ✦ تقبل الله صيامكم وقيامكم ✦
                        </motion.div>
                    </motion.div>

                    {/* Gold & teal firefly particles */}
                    {[...Array(28)].map((_, i) => (
                        <motion.div key={`ff-${i}`} className="absolute rounded-full pointer-events-none"
                            style={{ width: 3 + (i % 2), height: 3 + (i % 2), background: i % 4 === 0 ? '#ffd54f' : i % 4 === 1 ? '#b2dfdb' : i % 4 === 2 ? '#f48fb1' : '#fff9c4', filter: 'blur(0.5px)' }}
                            animate={{ x: [0, (i % 2 === 0 ? 18 : -18)], y: [0, -35, 0], opacity: [0, 1, 0] }}
                            transition={{ duration: 4 + i % 5, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
                            initial={{ left: `${(i * 3.7) % 100}%`, bottom: `${15 + (i % 5) * 9}%` }} />
                    ))}

                    {/* Fireworks bursts */}
                    {[
                        { delay: 0, color: '#ffd54f', x: '25%', y: '18%' },
                        { delay: 1.8, color: '#e91e63', x: '60%', y: '12%' },
                        { delay: 3.5, color: '#00bcd4', x: '78%', y: '22%' },
                        { delay: 5, color: '#b39ddb', x: '15%', y: '28%' },
                        { delay: 6.5, color: '#69f0ae', x: '45%', y: '15%' },
                    ].map((fw, i) => (
                        <Firework key={`nfw-${i}`} delay={fw.delay} color={fw.color} x={fw.x} y={fw.y} />
                    ))}
                </>
            )}

            {/* ──────────────────────
                SHARED — both modes
            ────────────────────── */}

            {/* Eid decorative string lights across the top */}
            <div className="absolute top-0 left-0 right-0 pointer-events-none z-[15]">
                <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full" style={{ height: 80 }}>
                    {/* Strings */}
                    {[0, 1, 2, 3].map((seg) => (
                        <path key={seg} d={`M${seg * 300} 0 Q${seg * 300 + 150} 52 ${(seg + 1) * 300} 0`}
                            fill="none" stroke={isDarkMode ? 'rgba(201,162,39,0.4)' : 'rgba(120,80,0,0.2)'} strokeWidth="1" />
                    ))}
                    {/* Bulbs */}
                    {[95, 200, 330, 440, 575, 685, 820, 940, 1080].map((x, i) => {
                        const bulbColors = ['#ff4081', '#ffd740', '#00e5ff', '#69f0ae', '#ea80fc', '#ff6d00', '#40c4ff', '#ffd740', '#ff4081'];
                        return (
                            <g key={i}>
                                <circle cx={x} cy={24 + (i % 2) * 18} r="6" fill={bulbColors[i % bulbColors.length]} opacity={isDarkMode ? 0.9 : 0.7} />
                                <circle cx={x} cy={24 + (i % 2) * 18} r="10" fill={bulbColors[i % bulbColors.length]} opacity={isDarkMode ? 0.2 : 0.1} style={{ filter: 'blur(3px)' }} />
                            </g>
                        );
                    })}
                </svg>
            </div>
        </motion.div>
    );
};

export default EidFitrTheme;
