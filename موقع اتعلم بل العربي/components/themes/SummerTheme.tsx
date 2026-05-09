import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, PalmTree } from './SharedElements';

// ============================================================
// --- SUMMER THEME COMPONENTS ---
// ============================================================

export const SummerSun: React.FC = () => (
    <div className="absolute top-[3%] right-[8%] z-[2]">
        {/* Glow rings */}
        <motion.div
            className="absolute inset-0 rounded-full"
            style={{ width: 120, height: 120, background: 'rgba(255,200,0,0.15)', margin: '-20px' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
            className="absolute inset-0 rounded-full"
            style={{ width: 80, height: 80, background: 'rgba(255,200,0,0.25)', margin: '-0px' }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Sun body */}
        <div className="relative w-20 h-20 rounded-full shadow-[0_0_60px_rgba(255,180,0,0.8)]"
            style={{ background: 'radial-gradient(circle at 35% 35%, #fff8a0, #FFD600 40%, #FF8F00)' }}>
            {/* Shine */}
            <div className="absolute top-[15%] left-[15%] w-1/4 h-1/4 bg-white/60 rounded-full blur-[3px]" />
        </div>
        {/* Sun rays */}
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                    width: 22 + (i % 3) * 6,
                    height: 3,
                    marginTop: -1.5,
                    rotate: i * 30,
                    background: 'linear-gradient(90deg, #FFD600, transparent)',
                    borderRadius: 4,
                    marginLeft: 40,
                }}
                animate={{ opacity: [0.6, 1, 0.6], scaleX: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.08 }}
            />
        ))}
    </div>
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

export const SummerParticle: React.FC<{ type: 'bubble' | 'sparkle'; x: string; delay: number }> = ({ type, x, delay }) => {
    if (type === 'bubble') return (
        <motion.div
            className="absolute rounded-full border-2 border-blue-300/50 pointer-events-none"
            style={{ left: x, bottom: '15%', width: 8 + Math.random() * 16, height: 8 + Math.random() * 16 }}
            animate={{ y: [0, -200, -400], opacity: [0, 0.7, 0], scale: [1, 1.2, 0.8] }}
            transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay, ease: 'easeOut' }}
        />
    );
    return (
        <motion.div
            className="absolute text-yellow-400 pointer-events-none text-lg select-none"
            style={{ left: x, top: '15%' }}
            animate={{ opacity: [0, 1, 0], y: [0, -30, -60], scale: [0.5, 1, 0.3], rotate: [0, 180, 360] }}
            transition={{ duration: 3, repeat: Infinity, delay, ease: 'easeOut' }}
        >
            ✦
        </motion.div>
    );
};

export default function SummerTheme({ isDarkMode, visuals }: { isDarkMode: boolean, visuals?: any }) {
    return (
        <motion.div
            key="summer_l"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 overflow-hidden"
        >
            {/* Sky gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(180deg, #0d2137 0%, #0a3a5c 50%, #1a6a6a 85%, #0d4a4a 100%)'
                        : 'linear-gradient(180deg, #74c9ff 0%, #b3e5fc 40%, #e0f7fa 65%, #ffe082 75%, #f5d26b 85%, #e8b84b 100%)'
                }}
            />

            {/* Sun */}
            <SummerSun />

            {/* Light shimmer overlay (only day) */}
            {!isDarkMode && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
            )}

            {/* Clouds (day only) */}
            {!isDarkMode && [
                { delay: 0, y: 8, scale: 0.7, dur: 40 },
                { delay: 10, y: 15, scale: 0.5, dur: 55 },
                { delay: 20, y: 6, scale: 0.9, dur: 35 },
            ].map((c, i) => (
                <Cloud key={`sc-${i}`} delay={c.delay} y={c.y} scale={c.scale} duration={c.dur} />
            ))}

            {/* Stars (night only) */}
            {isDarkMode && visuals?.stars && visuals.stars.map((s: any, i: number) => (
                <motion.div
                    key={`star-${i}`}
                    className="absolute rounded-full bg-white"
                    style={{
                        width: 1 + Math.random() * 3,
                        height: 1 + Math.random() * 3,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 55}%`,
                    }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
                />
            ))}

            {/* Seagulls */}
            {[
                { delay: 0, y: 12, size: 1.2 },
                { delay: 6, y: 22, size: 0.8 },
                { delay: 12, y: 8, size: 1.0 },
            ].map((s, i) => (
                <Seagull key={i} delay={s.delay} y={s.y} size={s.size} />
            ))}

            {/* Palm tree */}
            <PalmTree isDarkMode={isDarkMode} x="5%" scale={1.2} />

            {/* Second palm tree (mirrored, right side) */}
            <div className="absolute bottom-0 right-[5%] z-10 pointer-events-none select-none">
                <PalmTree isDarkMode={isDarkMode} x="0%" scale={1.1} flipped /> {/* x is 0 relative to right-[5%] */}
            </div>

            {/* Ocean waves */}
            {[0, 1, 2].map(i => (
                <Wave key={i} index={i} isDarkMode={isDarkMode} />
            ))}

            {/* Beach sand strip */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[14%]"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(to top, #3e2a18, #5a3e28)'
                        : 'linear-gradient(to top, #f5d26b, #ffe082, #fff8d6)',
                    borderRadius: '60% 60% 0 0 / 30% 30% 0 0'
                }}
            />

            {/* Bubble particles */}
            {['15%', '30%', '50%', '70%', '85%'].map((x, i) => (
                <SummerParticle key={`b-${i}`} type="bubble" x={x} delay={i * 1.5} />
            ))}

            {/* Sparkle particles */}
            {['20%', '45%', '65%', '80%'].map((x, i) => (
                <SummerParticle key={`s-${i}`} type="sparkle" x={x} delay={i * 2} />
            ))}

            {/* Floating greeting */}
            <motion.div
                className="absolute top-[30%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-20"
                animate={{ y: [0, -12, 0], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <div
                    className="px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/30 font-black text-xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,180,0,0.5), rgba(255,120,0,0.4))',
                        color: isDarkMode ? '#ffe082' : '#7c3a00',
                        textShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                >
                    ☀️ صيفاً رائعاً!
                </div>
            </motion.div>
        </motion.div>
    );
}
