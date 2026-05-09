import React from 'react';
import { motion } from 'framer-motion';

// ============================================================
// --- WINTER THEME COMPONENTS ---
// ============================================================

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

export const WinterTree: React.FC<{ isDarkMode: boolean; x: string; scale?: number }> = ({ isDarkMode, x, scale = 1 }) => (
    <div className="absolute bottom-0 pointer-events-none select-none" style={{ left: x, transform: `scale(${scale})`, transformOrigin: 'bottom center' }}>
        {/* Snow cap */}
        <div className="relative mx-auto" style={{ width: 0, height: 0 }}>
            {/* Tree layers */}
            {[
                { w: 30, mt: 0 },
                { w: 50, mt: -10 },
                { w: 70, mt: -15 },
                { w: 90, mt: -20 },
            ].map((layer, i) => (
                <div
                    key={i}
                    className="relative mx-auto"
                    style={{
                        width: 0,
                        height: 0,
                        borderLeft: `${layer.w / 2}px solid transparent`,
                        borderRight: `${layer.w / 2}px solid transparent`,
                        borderBottom: `${layer.w * 0.7}px solid ${isDarkMode ? '#1a3a2a' : '#2e7d32'}`,
                        marginTop: layer.mt,
                    }}
                >
                    {/* Snow on branch */}
                    <div
                        className="absolute"
                        style={{
                            top: 6,
                            left: -(layer.w * 0.45),
                            width: layer.w * 0.9,
                            height: 6,
                            background: 'rgba(255,255,255,0.85)',
                            borderRadius: '0 0 8px 8px',
                        }}
                    />
                </div>
            ))}
        </div>
        {/* Trunk */}
        <div className="mx-auto" style={{ width: 10, height: 30, background: isDarkMode ? '#3e2723' : '#5d4037', borderRadius: '0 0 3px 3px' }} />
    </div>
);

export const IcicleRow: React.FC = () => (
    <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none z-10">
        {[...Array(14)].map((_, i) => (
            <motion.div
                key={i}
                className="flex flex-col items-center"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{ transformOrigin: 'top' }}
            >
                {/* Icicle */}
                <motion.div
                    style={{
                        width: 4 + (i % 4) * 2,
                        height: 30 + (i % 5) * 15,
                        background: 'linear-gradient(to bottom, rgba(200,230,255,0.9), rgba(180,220,255,0.3), transparent)',
                        clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                        filter: 'drop-shadow(0 2px 4px rgba(144,202,249,0.4))',
                    }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3 + i * 0.3, repeat: Infinity }}
                />
                {/* Water drip */}
                <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-blue-200/70"
                    animate={{ y: [0, 12, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 2 + i * 0.2, repeat: Infinity, delay: i * 0.15 }}
                />
            </motion.div>
        ))}
    </div>
);

export const FogLayer: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <>
        {[20, 50, 75].map((y, i) => (
            <motion.div
                key={i}
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                    top: `${y}%`,
                    height: 60 + i * 20,
                    background: isDarkMode
                        ? `rgba(30, 60, 100, ${0.12 - i * 0.03})`
                        : `rgba(220, 235, 255, ${0.25 - i * 0.05})`,
                    filter: 'blur(15px)',
                }}
                animate={{ x: [0, i % 2 === 0 ? 30 : -30, 0], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 12 + i * 4, repeat: Infinity, ease: 'easeInOut' }}
            />
        ))}
    </>
);

export const AuroraBorealis: React.FC = () => (
    <div className="absolute top-0 left-0 right-0 h-[45%] overflow-hidden pointer-events-none">
        {[
            { color: 'rgba(100,200,150,0.15)', x: '10%', w: '40%', delay: 0 },
            { color: 'rgba(80,160,220,0.12)', x: '35%', w: '50%', delay: 1.5 },
            { color: 'rgba(180,100,220,0.10)', x: '55%', w: '35%', delay: 3 },
        ].map((aurora, i) => (
            <motion.div
                key={i}
                className="absolute top-0"
                style={{
                    left: aurora.x,
                    width: aurora.w,
                    height: '100%',
                    background: `linear-gradient(to bottom, ${aurora.color}, transparent)`,
                    filter: 'blur(20px)',
                    borderRadius: '50% 50% 0 0',
                }}
                animate={{
                    scaleX: [1, 1.2, 0.9, 1],
                    opacity: [0.4, 0.9, 0.5, 0.4],
                    x: [0, 20, -15, 0],
                }}
                transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: aurora.delay }}
            />
        ))}
    </div>
);

const WinterTheme: React.FC<{ isDarkMode: boolean; density: string }> = ({ isDarkMode, density }) => {
    return (
        <motion.div
            key="winter_l"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 overflow-hidden"
        >
            {/* Sky — dark blue night or pale icy day */}
            <div
                className="absolute inset-0"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(180deg, #050d1a 0%, #0a1a35 40%, #0c2240 70%, #0e2a4a 100%)'
                        : 'linear-gradient(180deg, #cce8ff 0%, #dff0ff 40%, #eaf6ff 70%, #f0f8ff 100%)'
                }}
            />

            {/* Aurora Borealis (night only) */}
            {isDarkMode && <AuroraBorealis />}

            {/* Stars (night only) */}
            {isDarkMode && [...Array(60)].map((_, i) => (
                <motion.div
                    key={`wstar-${i}`}
                    className="absolute rounded-full bg-white"
                    style={{
                        width: 1 + Math.random() * 2.5,
                        height: 1 + Math.random() * 2.5,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 60}%`,
                    }}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 6 }}
                />
            ))}

            {/* Full Moon (night only) */}
            {isDarkMode && (
                <div className="absolute top-[5%] right-[10%]">
                    <div className="relative w-16 h-16 rounded-full shadow-[0_0_40px_rgba(200,220,255,0.5)]"
                        style={{ background: 'radial-gradient(circle at 35% 35%, #ffffff, #c8dcf0 60%, #a0bce0)' }}>
                        <div className="absolute top-[15%] left-[15%] w-1/4 h-1/4 bg-white/50 rounded-full blur-[2px]" />
                        {/* Moon craters */}
                        <div className="absolute top-[40%] right-[20%] w-3 h-3 rounded-full opacity-20" style={{ background: '#8ab0d0' }} />
                        <div className="absolute top-[60%] left-[30%] w-2 h-2 rounded-full opacity-15" style={{ background: '#8ab0d0' }} />
                    </div>
                    <motion.div
                        className="absolute -inset-4 rounded-full"
                        style={{ background: 'rgba(200,220,255,0.08)' }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                </div>
            )}

            {/* Snowflakes — vary density and size */}
            {[...Array(45)].map((_, i) => (
                <Snowflake
                    key={`sf-${i}`}
                    x={`${(i * 2.3) % 100}%`}
                    duration={6 + (i % 8) * 1.5}
                    delay={(i * 0.4) % 12}
                    size={10 + (i % 5) * 5}
                    opacity={0.4 + (i % 5) * 0.12}
                />
            ))}

            {/* Icicles hanging from top */}
            <IcicleRow />

            {/* Fog layers */}
            <FogLayer isDarkMode={isDarkMode} />

            {/* Snow-covered ground */}
            <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                    height: '18%',
                    background: isDarkMode
                        ? 'linear-gradient(to top, #1a2a4a, #1e3254, #243b62)'
                        : 'linear-gradient(to top, #ddeeff, #eaf4ff, #f5faff)',
                    borderRadius: '60% 80% 0 0 / 30% 40% 0 0'
                }}
            >
                {/* Snow sparkle dots */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-white"
                        style={{ left: `${(i * 8.5) % 100}%`, top: '20%' }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                ))}
            </div>

            {/* Winter pine trees */}
            {[
                { x: '3%', scale: 1.2 },
                { x: '12%', scale: 0.9 },
                { x: '78%', scale: 1.0 },
                { x: '88%', scale: 1.3 },
                { x: '95%', scale: 0.8 },
            ].map((tree, i) => (
                <WinterTree key={i} isDarkMode={isDarkMode} x={tree.x} scale={tree.scale} />
            ))}

            {/* Wind particle — blowing snow swipe */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={`wind-${i}`}
                    className="absolute pointer-events-none"
                    style={{
                        top: `${20 + i * 18}%`,
                        left: '-10%',
                        width: '30%',
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(200,230,255,0.4), transparent)',
                        filter: 'blur(1px)',
                    }}
                    animate={{ x: ['0%', '150vw'], opacity: [0, 0.6, 0] }}
                    transition={{ duration: 4 + i, repeat: Infinity, delay: i * 2, ease: 'easeInOut' }}
                />
            ))}

            {/* Floating winter greeting */}
            <motion.div
                className="absolute top-[28%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-20"
                animate={{ y: [0, -10, 0], opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <div
                    className="px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border font-black text-xl"
                    style={{
                        background: isDarkMode
                            ? 'linear-gradient(135deg, rgba(30,60,120,0.7), rgba(10,30,80,0.6))'
                            : 'linear-gradient(135deg, rgba(200,230,255,0.7), rgba(180,215,255,0.5))',
                        border: isDarkMode ? '1px solid rgba(144,202,249,0.2)' : '1px solid rgba(100,180,255,0.3)',
                        color: isDarkMode ? '#90CAF9' : '#1565C0',
                        textShadow: isDarkMode ? '0 0 20px rgba(144,202,249,0.5)' : 'none'
                    }}
                >
                    ❄️ شتاء دافئ في قلبك!
                </div>
            </motion.div>
        </motion.div>
    );
};

export default WinterTheme;
