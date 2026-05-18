import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Cloud } from './SharedElements';

type ThemeLanguage = 'ar' | 'en' | 'de';

const victoryGreetings: Record<ThemeLanguage, { title: string; subtitle: string; dir: 'rtl' | 'ltr'; lang: string }> = {
    ar: { title: 'ذكرى نصر أكتوبر المجيد', subtitle: 'فخر وعزة وإرادة لا تنكسر', dir: 'rtl', lang: 'ar' },
    en: { title: 'Glorious October Victory', subtitle: 'Pride, honor, and resilience', dir: 'ltr', lang: 'en' },
    de: { title: 'Glorreicher Oktober-Sieg', subtitle: 'Stolz, Ehre und Stärke', dir: 'ltr', lang: 'de' },
};

// ============================================================
// --- VICTORY OCTOBER THEME COMPONENTS ---
// ============================================================

export const Jet: React.FC<{ isDarkMode: boolean; colors: string[] }> = ({ isDarkMode, colors }) => (
    <div className="relative pointer-events-none select-none">
        {/* Jet Trails - Extended */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-[30vh] md:w-[60vw] h-12 flex space-x-1 opacity-70">
            {colors.map((c, i) => (
                <motion.div
                    key={i}
                    className="h-full flex-1"
                    style={{ background: `linear-gradient(to right, transparent, ${c})`, filter: 'blur(3px)' }}
                    animate={{ opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                />
            ))}
        </div>
        {/* Fighter Jet SVG */}
        <motion.svg width="80" height="40" viewBox="0 0 100 50" className="drop-shadow-lg"
            animate={{ y: [-3, 3, -3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <path d="M10 25 L30 15 L50 22 L80 22 L95 25 L80 28 L50 28 L30 35 Z" fill={isDarkMode ? '#555' : '#444'} />
            <path d="M50 22 L65 5 L75 5 L65 22 Z" fill={isDarkMode ? '#333' : '#222'} />
            <path d="M50 28 L65 45 L75 45 L65 28 Z" fill={isDarkMode ? '#333' : '#222'} />
            <path d="M15 25 L5 18 L0 18 L10 25 L0 32 L5 32 L15 25 Z" fill={isDarkMode ? '#333' : '#222'} />
            <ellipse cx="75" cy="25" rx="8" ry="3" fill="#a0c4ff" />
        </motion.svg>
    </div>
);

export const EgyptianFlag: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
    <motion.div
        className="relative transform origin-bottom-left"
        style={{ scale }}
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
        <div className="w-1.5 h-48 bg-stone-600 rounded-full shadow-md" /> {/* Pole */}
        <motion.div
            className="absolute top-1 left-1.5 w-32 h-20 shadow-lg origin-left flex flex-col"
            animate={{ scaleX: [1, 0.98, 1], skewY: [0, 1.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
            <div className="h-1/3 bg-[#ce1126]" /> {/* Red */}
            <div className="h-1/3 bg-white flex items-center justify-center relative"> {/* White + Eagle */}
                <div className="w-4 h-4 bg-[#b8860b] rounded-full opacity-80 blur-[0.5px] scale-y-75" /> {/* Abstract Eagle */}
            </div>
            <div className="h-1/3 bg-black" /> {/* Black */}
        </motion.div>
    </motion.div>
);

export const Tank: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="relative group">
        {/* Tracks */}
        <div className={`w-36 h-8 ${isDarkMode ? 'bg-[#3e2723]' : 'bg-[#5d4037]'} rounded-lg relative overflow-hidden`}>
            <div className="absolute inset-0 flex gap-1 animate-[slide_2s_linear_infinite]">
                {[...Array(10)].map((_, i) => <div key={i} className="w-2 h-full bg-black/20 skew-x-12" />)}
            </div>
        </div>
        {/* Body */}
        <div className={`absolute bottom-6 left-2 w-32 h-8 ${isDarkMode ? 'bg-[#4e342e]' : 'bg-[#6d4c41]'} rounded-t-xl`} />
        {/* Turret */}
        <div className={`absolute bottom-14 left-8 w-16 h-8 ${isDarkMode ? 'bg-[#3e2723]' : 'bg-[#5d4037]'} rounded-t-2xl rounded-bl-xl`} />
        {/* Gun */}
        <motion.div
            className={`absolute bottom-16 left-[-10px] w-24 h-2 ${isDarkMode ? 'bg-[#271c19]' : 'bg-[#3e2723]'} rounded-l-full origin-right`}
            animate={{ rotate: [0, -2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Flag on Tank */}
        <div className="absolute top-[-90px] left-[50px] scale-50 origin-bottom-left">
            <EgyptianFlag scale={0.6} />
        </div>
    </div>
);

export const Soldier: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className={`relative w-20 h-32 ${isDarkMode ? 'fill-[#1a1a1a]' : 'fill-[#2d241e]'}`}>
        <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-2xl">
            <path d="
                M 45 10 
                C 45 5, 55 5, 55 10 
                Q 60 12, 60 20 
                L 58 25 
                Q 58 35, 65 35 
                L 80 40 
                L 75 30 
                L 85 25 
                L 90 40 
                Q 85 50, 65 55 
                L 65 80 
                L 70 120 
                L 60 150 
                L 40 150 
                L 35 120 
                L 35 80 
                L 20 60 
                L 30 40 
                L 40 45 
                L 42 25 
                Q 40 20, 45 10
                Z
            " />
            <rect x="25" y="40" width="4" height="60" rx="1" transform="rotate(-15 25 40)" />
            <path d="M 45 20 Q 50 25, 55 20" fill="none" stroke={isDarkMode ? "#333" : "#4a3b32"} strokeWidth="1" />
        </svg>
    </div>
);

export const Dune: React.FC<{ delay: number; color: string; height: string }> = ({ delay, color, height }) => (
    <motion.div
        className="absolute bottom-[-10px] w-[120%] -left-[10%]"
        style={{ height, backgroundColor: color, borderRadius: '60% 80% 0 0', opacity: 0.9 }}
        initial={{ y: 20 }}
        animate={{ y: 0, scaleY: [1, 1.05, 1] }}
        transition={{ duration: 8, delay, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    />
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
        <div className="absolute -left-2 -top-2 w-4 h-4 bg-white rounded-full blur-[4px]" />
    </motion.div>
);

const VictoryOctoberTheme: React.FC<{ isDarkMode: boolean; targetLanguage?: ThemeLanguage }> = ({ isDarkMode, targetLanguage = 'ar' }) => {
    const greeting = victoryGreetings[targetLanguage] ?? victoryGreetings.ar;

    return (
        <motion.div key="victory_l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">

            {/* Day Mode: Dramatic War Sky */}
            {!isDarkMode && (
                <>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1565c0 0%, #42a5f5 30%, #90caf9 60%, #e3f2fd 80%, #f5f5f5 100%)' }} />
                    <Sun />
                    {/* Day smoke trail effect */}
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={`smoke-${i}`}
                            className="absolute top-[15%] pointer-events-none"
                            style={{ left: `${20 + i * 20}%`, width: 3, height: 60, background: 'linear-gradient(to bottom, rgba(200,200,200,0.6), transparent)', filter: 'blur(4px)' }}
                            animate={{ opacity: [0.3, 0.7, 0.3], scaleY: [1, 1.5, 1], x: [0, i % 2 === 0 ? 8 : -8, 0] }}
                            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    ))}
                    {/* Clouds */}
                    {[{ delay: 0, y: 6 }, { delay: 15, y: 14 }].map((c, i) => (
                        <Cloud key={i} delay={c.delay} y={c.y} scale={0.7 + i * 0.2} duration={45 + i * 10} />
                    ))}
                </>
            )}

            {/* Night Mode: Deep Dramatic Sky */}
            {isDarkMode && (
                <>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #01060f 0%, #050a1a 30%, #0a1020 60%, #0d1520 100%)' }} />

                    {/* Dense stars */}
                    {[...Array(90)].map((_, i) => (
                        <motion.div
                            key={`vs-${i}`}
                            className="absolute rounded-full bg-white pointer-events-none"
                            style={{ width: 1 + (i % 3) * 0.5, height: 1 + (i % 3) * 0.5, left: `${(i * 1.11) % 100}%`, top: `${(i * 1.17) % 65}%` }}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.5 + (i % 5) * 0.6, repeat: Infinity, delay: (i * 0.1) % 7 }}
                        />
                    ))}

                    <div className="absolute top-10 right-10 opacity-90">
                        <Moon size={65} fill="#e3f2fd" className="drop-shadow-[0_0_30px_rgba(100,181,246,0.6)]" />
                    </div>
                </>
            )}

            {/* Background Dunes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Dune height="40vh" color={isDarkMode ? '#2a1a10' : '#c8b090'} delay={0} />
                <Dune height="28vh" color={isDarkMode ? '#3a2515' : '#dcc8a0'} delay={3} />
                <Dune height="18vh" color={isDarkMode ? '#4a3020' : '#eedcb8'} delay={1.5} />
            </div>

            {/* Tank — enters from left */}
            <motion.div
                className="absolute bottom-[10%] left-[5%] z-10 scale-75 md:scale-100 origin-bottom-left"
                initial={{ x: '-100vw' }}
                animate={{ x: '3%' }}
                transition={{ duration: 12, ease: "easeOut" }}
            >
                <Tank isDarkMode={isDarkMode} />
            </motion.div>

            {/* Second tank — enters from left delayed */}
            <motion.div
                className="absolute bottom-[10%] z-10 scale-50 md:scale-75 origin-bottom-left"
                style={{ left: '-5%' }}
                initial={{ x: '-100vw' }}
                animate={{ x: '35%' }}
                transition={{ duration: 18, ease: "easeOut", delay: 3 }}
            >
                <Tank isDarkMode={isDarkMode} />
            </motion.div>

            {/* Soldier */}
            <motion.div
                className="absolute bottom-[10%] left-[35%] md:left-[25%] z-10 scale-75 md:scale-100 origin-bottom"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 2 }}
            >
                <Soldier isDarkMode={isDarkMode} />
            </motion.div>

            {/* Waving Giant Flag */}
            <div className="absolute bottom-[-40px] right-[10%] opacity-100 scale-90 md:scale-125 z-20 origin-bottom-right">
                <EgyptianFlag scale={1.5} />
            </div>

            {/* Air Show Squadron */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`jet-${i}`}
                    className="absolute z-20"
                    initial={{ x: '120vw', y: `${10 + i * 8}%` }}
                    animate={{ x: '-30vw', y: `${15 + i * 8}%` }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
                >
                    <Jet isDarkMode={isDarkMode} colors={['#ce1126', '#fff', '#000']} />
                </motion.div>
            ))}

            {/* Victory Fireworks — Night Mode */}
            {isDarkMode && [
                { x: '15%', y: '25%', color: '#ce1126', delay: 0 },
                { x: '45%', y: '15%', color: '#ffffff', delay: 1.5 },
                { x: '75%', y: '20%', color: '#b8860b', delay: 0.8 },
                { x: '30%', y: '30%', color: '#ce1126', delay: 2.5 },
                { x: '60%', y: '35%', color: '#ffffff', delay: 3.5 },
            ].map((fw, i) => (
                <Firework key={`fw-${i}`} delay={fw.delay} color={fw.color} x={fw.x} y={fw.y} />
            ))}

            {/* Celebration sparks */}
            {[...Array(35)].map((_, i) => (
                <motion.div
                    key={`vspark-${i}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{ width: 2 + (i % 3), height: 2 + (i % 3), backgroundColor: ['#ce1126', '#b8860b', '#fff', '#ffd700'][i % 4] }}
                    initial={{ opacity: 0, y: '100vh', x: `${(i * 2.9) % 100}%` }}
                    animate={{ opacity: [0, 1, 0], y: '-15vh', rotate: 360, scale: [0, 1.5, 0] }}
                    transition={{ duration: 3 + (i % 5), repeat: Infinity, ease: "easeOut", delay: (i * 0.18) % 6 }}
                />
            ))}

            {/* Searchlights — dramatic */}
            {isDarkMode && [...Array(4)].map((_, i) => (
                <motion.div
                    key={`light-${i}`}
                    className="absolute bottom-[-100px] origin-bottom mix-blend-screen"
                    style={{
                        left: `${15 + i * 22}%`,
                        width: 12,
                        height: '200vh',
                        background: `linear-gradient(to top, ${i % 2 === 0 ? 'rgba(206,17,38,0.25)' : 'rgba(255,215,0,0.20)'}, transparent)`,
                        filter: 'blur(8px)',
                    }}
                    animate={{
                        rotate: [i % 2 === 0 ? 20 : -20, i % 2 === 0 ? -12 : 12, i % 2 === 0 ? 20 : -20],
                        opacity: [0.2, 0.6, 0.2]
                    }}
                    transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                />
            ))}

            {/* Victory text */}
            <motion.div
                className="absolute top-[12%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-30 whitespace-nowrap"
                dir={greeting.dir}
                lang={greeting.lang}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <div className="font-black text-2xl md:text-4xl"
                    style={{
                        color: '#ffd700',
                        textShadow: '0 0 20px rgba(206,17,38,0.8), 0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(206,17,38,0.4)',
                        letterSpacing: '0.05em'
                    }}>
                    🎖️ {greeting.title}
                </div>
                <motion.div
                    className="text-yellow-400/70 text-xs font-bold mt-1 tracking-widest"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                    ✦ {greeting.subtitle} ✦
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default VictoryOctoberTheme;
