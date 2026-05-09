import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, EidCrescent, Kaaba, Bird, PalmTree, EidLantern, Firework, Dune, EgyptianFlag } from './SharedElements';

// Elements specific to Eid Adha
const GrazingSheep = ({ size = 100, isDarkMode, delay = 0, flipped = false }: { size?: number, isDarkMode: boolean, delay?: number, flipped?: boolean }) => {
    return (
        <motion.div style={{ width: size, height: size * 0.8, transform: flipped ? 'scaleX(-1)' : 'none' }}
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay }}>
            <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-md">
                {/* Legs */}
                <path d="M50 110 L45 140 A5 5 0 0 0 55 140 L60 110 Z" fill={isDarkMode ? "#222" : "#444"} />
                <path d="M80 115 L75 145 A5 5 0 0 0 85 145 L90 115 Z" fill={isDarkMode ? "#111" : "#333"} />
                <path d="M140 110 L135 140 A5 5 0 0 0 145 140 L150 110 Z" fill={isDarkMode ? "#222" : "#444"} />
                <path d="M165 115 L160 145 A5 5 0 0 0 170 145 L175 115 Z" fill={isDarkMode ? "#111" : "#333"} />
                
                {/* Body Fluff */}
                <path d="M30 60 Q30 20 80 20 Q100 0 140 20 Q190 30 180 80 Q190 120 140 120 Q80 130 40 110 Q10 90 30 60 Z" 
                      fill={isDarkMode ? "#e0e0e0" : "#ffffff"} stroke={isDarkMode ? "#bdbdbd" : "#f5f5f5"} strokeWidth="4" strokeLinejoin="round" />
                
                {/* Inner curls */}
                <path d="M60 40 Q80 30 100 45" fill="none" stroke={isDarkMode ? "#d0d0d0" : "#f0f0f0"} strokeWidth="3" strokeLinecap="round" />
                <path d="M120 40 Q140 35 150 55" fill="none" stroke={isDarkMode ? "#d0d0d0" : "#f0f0f0"} strokeWidth="3" strokeLinecap="round" />
                <path d="M70 80 Q90 90 110 75" fill="none" stroke={isDarkMode ? "#d0d0d0" : "#f0f0f0"} strokeWidth="3" strokeLinecap="round" />
                
                {/* Head */}
                <motion.g 
                    animate={{ rotate: isDarkMode ? [0, 2, 0] : [0, 8, -2, 0] }} // Sleeps at night, grazes in day
                    transition={{ duration: 5, repeat: Infinity, delay }}
                    style={{ transformOrigin: '40px 80px' }}>
                    <path d="M20 60 Q5 60 10 90 Q15 110 35 105 L50 70 Z" fill={isDarkMode ? "#333" : "#4a3528"} />
                    <circle cx="28" cy="75" r="3" fill="#111" />
                    {/* Ear */}
                    <path d="M40 68 Q50 60 55 75 Q45 80 40 68 Z" fill={isDarkMode ? "#222" : "#3e2723"} />
                </motion.g>

                {/* Night Zzz */}
                {isDarkMode && (
                    <motion.text x="5" y="30" fontSize="24" fill="#a0bce0" fontWeight="bold"
                        animate={{ opacity: [0, 1, 0], y: [0, -20], x: [0, -10] }}
                        transition={{ duration: 3, repeat: Infinity, delay: delay + 1 }}>
                        z
                    </motion.text>
                )}
            </svg>
        </motion.div>
    );
};

const EidGrassBlades = ({ isDarkMode }: { isDarkMode: boolean }) => (
    <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none overflow-hidden z-[8]">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-full">
            {[...Array(60)].map((_, i) => (
                <path key={i} 
                      d={`M${i * 20 + (Math.random()*10 - 5)} 60 Q${i * 20 + 5 + Math.random()*15} ${20 + Math.random()*20} ${i * 20 + 10 + (Math.random()*20 - 10)} ${Math.random()*15}`}
                      fill="none" 
                      stroke={isDarkMode ? '#1a3a2a' : '#4caf50'} 
                      strokeWidth={1.5 + Math.random() * 2} 
                      strokeLinecap="round"
                      opacity={0.6 + Math.random() * 0.4} />
            ))}
            {/* Some wildflowers */}
            {!isDarkMode && [...Array(15)].map((_, i) => (
                <circle key={`f-${i}`} cx={Math.random() * 1200} cy={30 + Math.random() * 25} r={2 + Math.random() * 2} 
                        fill={['#ffeb3b', '#ff4081', '#e040fb'][Math.floor(Math.random() * 3)]} />
            ))}
        </svg>
    </div>
);

const MountainRange = ({ isDarkMode }: { isDarkMode: boolean }) => (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[2]" style={{ height: '40vh', minHeight: 180 }}>
        <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="w-full h-full">
            <defs>
                <linearGradient id="mtnBack" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isDarkMode ? "#0d1b2a" : "#b0bec5"} />
                    <stop offset="100%" stopColor={isDarkMode ? "#040d1a" : "#90a4ae"} />
                </linearGradient>
                <linearGradient id="mtnFront" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isDarkMode ? "#1b263b" : "#78909c"} />
                    <stop offset="100%" stopColor={isDarkMode ? "#0d1b2a" : "#546e7a"} />
                </linearGradient>
            </defs>
            {/* Back Mountains */}
            <path d="M0 400 L0 250 L150 100 L350 220 L550 80 L800 280 L1000 120 L1200 250 L1200 400 Z" fill="url(#mtnBack)" opacity="0.8" />
            <path d="M150 100 L200 150 L130 180 Z" fill={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)"} />
            <path d="M550 80 L620 140 L500 180 Z" fill={isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)"} />
            <path d="M1000 120 L1060 170 L950 190 Z" fill={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.3)"} />
            
            {/* Front Mountains */}
            <path d="M0 400 L0 320 L250 180 L450 280 L700 150 L950 300 L1200 200 L1200 400 Z" fill="url(#mtnFront)" />
            <path d="M250 180 L320 230 L200 270 Z" fill={isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.2)"} />
            <path d="M700 150 L780 210 L650 250 Z" fill={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.3)"} />
        </svg>
    </div>
);

export const EidAdhaTheme = ({ isDarkMode }: { isDarkMode: boolean }) => {
    return (
        <motion.div key="eid_adha_l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0 overflow-hidden">
            {/* DAY MODE — Warm Eid Morning */}
            {!isDarkMode && (
                <>
                    {/* Golden dawn sky */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #87ceeb 0%, #b3e5fc 20%, #e1f5fe 40%, #f9fbe7 60%, #dcedc8 80%, #c8e6c9 100%)' }} />

                    {/* Sun with rays */}
                    <motion.div className="absolute z-[2]" style={{ top: '4%', left: '5%' }}
                        animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-50" style={{ background: '#FFF176', transform: 'scale(1.8)' }} />
                            <div className="w-20 h-20 rounded-full shadow-2xl" style={{ background: 'radial-gradient(circle at 35% 30%, #fffde7, #FFD600 50%, #FF8F00)' }}>
                                <div className="absolute top-[18%] left-[18%] w-5 h-5 bg-white/50 rounded-full blur-[4px]" />
                            </div>
                            {[...Array(10)].map((_, i) => (
                                <motion.div key={i} className="absolute top-1/2 left-1/2 origin-left"
                                    style={{ width: 22 + (i % 3) * 6, height: 2.5, rotate: i * 36, marginTop: -1.25, marginLeft: 40, background: 'linear-gradient(90deg, #FFD600aa, transparent)', borderRadius: 4 }}
                                    animate={{ opacity: [0.4, 0.9, 0.4], scaleX: [0.7, 1, 0.7] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }} />
                            ))}
                        </div>
                    </motion.div>

                    {/* Pilgrimage clouds */}
                    {[{ d: 0, y: 6, s: 1.1, dur: 55 }, { d: 18, y: 14, s: 0.75, dur: 70 }, { d: 35, y: 9, s: 0.9, dur: 45 }]
                        .map((c, i) => <Cloud key={i} delay={c.d} y={c.y} scale={c.s} duration={c.dur} />)}

                    <MountainRange isDarkMode={isDarkMode} />

                    <Kaaba isDarkMode={isDarkMode} />
                    <EidCrescent isDarkMode={isDarkMode} />

                    <motion.div animate={{ rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: 'bottom center' }}>
                        <PalmTree isDarkMode={isDarkMode} x="2%" scale={1.3} />
                    </motion.div>
                    <motion.div animate={{ rotate: [1.5, -1.5, 1.5] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: 'bottom center' }}>
                        <PalmTree isDarkMode={isDarkMode} x="82%" scale={1.1} flipped />
                    </motion.div>
                    <PalmTree isDarkMode={isDarkMode} x="88%" scale={0.8} />

                    {[{ d: 0, y: 18 }, { d: 5, y: 12 }, { d: 12, y: 22 }, { d: 20, y: 15 }]
                        .map((b, i) => <Bird key={i} delay={b.d} y={b.y} />)}

                    <EidGrassBlades isDarkMode={isDarkMode} />

                    <div className="absolute bottom-[8%] left-0 right-0 z-[7]">
                        {[
                            { left: '5%', size: 160, delay: 0, flip: false },
                            { left: '20%', size: 130, delay: 0.8, flip: true },
                            { left: '34%', size: 110, delay: 1.4, flip: false },
                            { left: '62%', size: 100, delay: 2, flip: true },
                            { left: '76%', size: 85, delay: 2.5, flip: false },
                        ].map((sh, i) => (
                            <motion.div key={i} className="absolute bottom-0" style={{ left: sh.left }}
                                initial={{ x: -80, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 1.5, delay: sh.delay, ease: 'easeOut' }}>
                                <GrazingSheep size={sh.size} isDarkMode={isDarkMode} delay={i} flipped={sh.flip} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Greeting Banner */}
                    <motion.div className="absolute z-20 pointer-events-none text-center"
                        style={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}
                        animate={{ y: [0, -6, 0], opacity: [0.9, 1, 0.9] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                        <div className="font-black text-2xl md:text-4xl px-6 py-3 rounded-2xl"
                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,253,231,0.9))', border: '1.5px solid rgba(201,162,39,0.4)', boxShadow: '0 8px 32px rgba(201,162,39,0.2)', color: '#1b5e20', textShadow: '0 2px 8px rgba(0,100,0,0.2)' }}>
                            🌙 عيد أضحى مبارك
                        </div>
                        <motion.div className="text-amber-600 text-sm mt-1 font-bold tracking-widest" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                            ✦ تقبل الله منا ومنكم ✦
                        </motion.div>
                    </motion.div>
                </>
            )}

            {/* NIGHT MODE */}
            {isDarkMode && (
                <>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #010810 0%, #051020 25%, #081828 55%, #051510 85%, #040d08 100%)' }} />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 90% 40% at 60% 25%, rgba(80,120,60,0.07) 0%, transparent 100%)' }} />

                    {[...Array(90)].map((_, i) => (
                        <motion.div key={`ns-${i}`} className="absolute rounded-full bg-white pointer-events-none"
                            style={{ width: 1 + (i % 4) * 0.6, height: 1 + (i % 4) * 0.6, left: `${(i * 1.13) % 100}%`, top: `${(i * 1.07) % 58}%` }}
                            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
                            transition={{ duration: 1.5 + (i % 6) * 0.5, repeat: Infinity, delay: (i * 0.1) % 8 }} />
                    ))}

                    <EidCrescent isDarkMode={isDarkMode} />
                    <MountainRange isDarkMode={isDarkMode} />
                    <Kaaba isDarkMode={isDarkMode} />

                    <motion.div animate={{ rotate: [-1, 1, -1] }} transition={{ duration: 5, repeat: Infinity }}>
                        <PalmTree isDarkMode={isDarkMode} x="2%" scale={1.3} />
                    </motion.div>
                    <PalmTree isDarkMode={isDarkMode} x="82%" scale={1.1} flipped />
                    <PalmTree isDarkMode={isDarkMode} x="88%" scale={0.8} />

                    <EidGrassBlades isDarkMode={isDarkMode} />

                    <div className="absolute bottom-[8%] left-0 right-0 z-[7]">
                        {[
                            { left: '5%', size: 160, delay: 0, flip: false },
                            { left: '20%', size: 130, delay: 0.8, flip: true },
                            { left: '34%', size: 110, delay: 1.4, flip: false },
                            { left: '62%', size: 100, delay: 2, flip: true },
                            { left: '76%', size: 85, delay: 2.5, flip: false },
                        ].map((sh, i) => (
                            <motion.div key={i} className="absolute bottom-0" style={{ left: sh.left }}
                                initial={{ x: -80, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 1.5, delay: sh.delay, ease: 'easeOut' }}>
                                <GrazingSheep size={sh.size} isDarkMode={isDarkMode} delay={i} flipped={sh.flip} />
                            </motion.div>
                        ))}
                    </div>

                    {[
                        { x: '6%', color: '#c9a227', size: 65 },
                        { x: '22%', color: '#ce93d8', size: 55 },
                        { x: '72%', color: '#80cbc4', size: 60 },
                        { x: '88%', color: '#c9a227', size: 65 },
                    ].map((l, i) => (
                        <motion.div key={i} className="absolute top-0" style={{ left: l.x }}
                            animate={{ rotate: [-5, 5, -5], y: [0, 10, 0] }}
                            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}>
                            <EidLantern isDarkMode={isDarkMode} color={l.color} size={l.size} />
                        </motion.div>
                    ))}

                    <motion.div className="absolute z-20 pointer-events-none text-center"
                        style={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}
                        animate={{ opacity: [0.75, 1, 0.75] }} transition={{ duration: 4, repeat: Infinity }}>
                        <div className="font-black text-2xl md:text-4xl" style={{ color: '#a5d6a7', textShadow: '0 0 20px rgba(76,175,80,0.7), 0 0 50px rgba(76,175,80,0.3)', fontFamily: 'serif' }}>
                            🌙 عيد أضحى مبارك
                        </div>
                        <motion.div className="text-emerald-400/70 text-xs font-bold mt-1 tracking-widest" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                            ✦ ✦ ✦
                        </motion.div>
                    </motion.div>
                </>
            )}
            
            {/* Shared visual layers like lights string could go here */}
        </motion.div>
    );
};

export default EidAdhaTheme;
