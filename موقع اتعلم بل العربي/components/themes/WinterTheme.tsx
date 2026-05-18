import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

type WinterDensity = 'low' | 'medium' | 'high';

type SnowflakeSpec = {
    x: string;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
    drift: number;
    symbol: string;
    blur: number;
};

type StarSpec = {
    x: string;
    y: string;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
};

const DENSITY_PROFILES: Record<WinterDensity, { snowflakes: number; stars: number; sparkles: number; wind: number; icicles: number }> = {
    low: { snowflakes: 18, stars: 22, sparkles: 6, wind: 2, icicles: 7 },
    medium: { snowflakes: 28, stars: 34, sparkles: 8, wind: 3, icicles: 9 },
    high: { snowflakes: 38, stars: 46, sparkles: 10, wind: 4, icicles: 11 },
};

const SNOW_SYMBOLS = ['*', '✦', '❄'];

const normalizeDensity = (density: string): WinterDensity =>
    density === 'low' || density === 'high' ? density : 'medium';

const buildSnowflakes = (count: number): SnowflakeSpec[] =>
    Array.from({ length: count }, (_, i) => ({
        x: `${(i * 37 + 9) % 100}%`,
        size: 7 + (i % 5) * 2.4,
        opacity: 0.22 + (i % 6) * 0.07,
        duration: 12 + (i % 7) * 1.35,
        delay: (i * 0.67) % 10,
        drift: (i % 2 === 0 ? 1 : -1) * (12 + (i % 6) * 4),
        symbol: SNOW_SYMBOLS[i % SNOW_SYMBOLS.length],
        blur: i % 7 === 0 ? 0.9 : 0,
    }));

const buildStars = (count: number): StarSpec[] =>
    Array.from({ length: count }, (_, i) => ({
        x: `${(i * 29 + 13) % 100}%`,
        y: `${(i * 17 + 7) % 58}%`,
        size: 1 + (i % 4) * 0.55,
        duration: 3.5 + (i % 5) * 0.8,
        delay: (i * 0.41) % 5,
        opacity: 0.2 + (i % 5) * 0.13,
    }));

export const Snowflake: React.FC<SnowflakeSpec> = ({ x, duration, delay, size, opacity, drift, symbol, blur }) => (
    <motion.div
        className="absolute top-[-8vh] pointer-events-none select-none text-white"
        style={{
            left: x,
            fontSize: size,
            opacity,
            filter: blur ? `blur(${blur}px)` : undefined,
            textShadow: '0 0 10px rgba(255,255,255,0.45)',
            willChange: 'transform',
        }}
        animate={{
            y: ['0vh', '112vh'],
            x: [0, drift, drift * -0.45, drift * 0.3],
            rotate: [0, 90, 180],
        }}
        transition={{
            y: { duration, repeat: Infinity, ease: 'linear', delay },
            x: { duration: duration * 0.85, repeat: Infinity, ease: 'easeInOut', delay },
            rotate: { duration: duration * 1.4, repeat: Infinity, ease: 'linear', delay },
        }}
    >
        {symbol}
    </motion.div>
);

export const WinterTree: React.FC<{ isDarkMode: boolean; x: string; scale?: number; delay?: number }> = ({ isDarkMode, x, scale = 1, delay = 0 }) => {
    const branchGradient = isDarkMode
        ? 'linear-gradient(145deg, #0d2c23 0%, #18503c 68%, #123527 100%)'
        : 'linear-gradient(145deg, #1e6a50 0%, #2f8b68 70%, #1a5d46 100%)';
    const trunkGradient = isDarkMode
        ? 'linear-gradient(180deg, #4a3025, #2d1b16)'
        : 'linear-gradient(180deg, #7b4d37, #5b3326)';

    return (
        <motion.div
            className="absolute bottom-[2%] pointer-events-none select-none"
            style={{ left: x, width: 104, height: 142, transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'bottom center' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay }}
        >
            <div className="absolute left-1/2 bottom-0 h-10 w-4 -translate-x-1/2 rounded-b-md" style={{ background: trunkGradient }} />
            {[
                { bottom: 24, width: 96, height: 72 },
                { bottom: 58, width: 76, height: 60 },
                { bottom: 88, width: 56, height: 48 },
            ].map((layer, i) => (
                <div
                    key={i}
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                        bottom: layer.bottom,
                        width: layer.width,
                        height: layer.height,
                        background: branchGradient,
                        clipPath: 'polygon(50% 0%, 98% 100%, 2% 100%)',
                        filter: isDarkMode ? 'drop-shadow(0 8px 14px rgba(0,0,0,0.26))' : 'drop-shadow(0 8px 12px rgba(68,118,151,0.16))',
                    }}
                >
                    <div
                        className="absolute left-[13%] right-[13%] bottom-[10%] h-2 rounded-full"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.86), transparent)' }}
                    />
                </div>
            ))}
        </motion.div>
    );
};

export const IcicleRow: React.FC<{ count?: number }> = ({ count = 9 }) => (
    <div className="absolute left-0 right-0 top-0 z-10 flex h-20 justify-around overflow-hidden pointer-events-none">
        {Array.from({ length: count }, (_, i) => (
            <motion.div
                key={i}
                className="origin-top"
                style={{
                    width: 5 + (i % 3) * 2,
                    height: 28 + (i % 4) * 10,
                    background: 'linear-gradient(180deg, rgba(236,248,255,0.9), rgba(174,215,245,0.5), rgba(174,215,245,0))',
                    clipPath: 'polygon(12% 0%, 88% 0%, 58% 100%, 42% 100%)',
                    filter: 'drop-shadow(0 8px 10px rgba(125,181,226,0.24))',
                }}
                initial={{ scaleY: 0.45, opacity: 0 }}
                animate={{ scaleY: 1, opacity: [0.55, 0.9, 0.55] }}
                transition={{
                    scaleY: { duration: 0.5, delay: i * 0.04 },
                    opacity: { duration: 4 + i * 0.25, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 },
                }}
            />
        ))}
    </div>
);

export const FogLayer: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <>
        {[
            { top: '28%', height: 82, drift: 24, duration: 18 },
            { top: '58%', height: 108, drift: -30, duration: 24 },
        ].map((layer, i) => (
            <motion.div
                key={i}
                className="absolute left-[-12%] right-[-12%] pointer-events-none"
                style={{
                    top: layer.top,
                    height: layer.height,
                    background: isDarkMode
                        ? 'radial-gradient(ellipse at center, rgba(87,130,178,0.14), transparent 70%)'
                        : 'radial-gradient(ellipse at center, rgba(210,232,250,0.34), transparent 70%)',
                    filter: 'blur(22px)',
                }}
                animate={{ x: [0, layer.drift, 0], opacity: [0.42, 0.7, 0.42] }}
                transition={{ duration: layer.duration, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
            />
        ))}
    </>
);

export const AuroraBorealis: React.FC = () => (
    <div className="absolute left-0 right-0 top-0 h-[48%] overflow-hidden pointer-events-none">
        {[
            { color: 'rgba(101, 225, 190, 0.2)', left: '-6%', top: '6%', width: '72%', delay: 0 },
            { color: 'rgba(116, 164, 255, 0.16)', left: '34%', top: '0%', width: '70%', delay: 1.3 },
        ].map((aurora, i) => (
            <motion.div
                key={i}
                className="absolute h-[58%] rounded-full"
                style={{
                    left: aurora.left,
                    top: aurora.top,
                    width: aurora.width,
                    background: `linear-gradient(105deg, transparent 0%, ${aurora.color} 40%, transparent 78%)`,
                    filter: 'blur(18px)',
                    transform: 'rotate(-8deg)',
                }}
                animate={{
                    opacity: [0.32, 0.74, 0.38],
                    x: [0, i === 0 ? 24 : -18, 0],
                    scaleY: [0.9, 1.08, 0.96],
                }}
                transition={{ duration: 11 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: aurora.delay }}
            />
        ))}
    </div>
);

const WinterTheme: React.FC<{ isDarkMode: boolean; density: string }> = ({ isDarkMode, density }) => {
    const densityKey = normalizeDensity(density);
    const profile = DENSITY_PROFILES[densityKey];
    const snowflakes = useMemo(() => buildSnowflakes(profile.snowflakes), [profile.snowflakes]);
    const stars = useMemo(() => buildStars(profile.stars), [profile.stars]);
    const sparkles = useMemo(() => Array.from({ length: profile.sparkles }, (_, i) => i), [profile.sparkles]);

    return (
        <motion.div
            key="winter_theme"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75 }}
            className="absolute inset-0 overflow-hidden pointer-events-none"
        >
            <div
                className="absolute inset-0"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(180deg, #06101f 0%, #0d223d 45%, #14365a 76%, #1d476c 100%)'
                        : 'linear-gradient(180deg, #d7efff 0%, #ecf8ff 48%, #f7fbff 72%, #eef6fb 100%)',
                }}
            />

            <div
                className="absolute inset-x-[-10%] bottom-[12%] h-[32%]"
                style={{
                    background: isDarkMode
                        ? 'radial-gradient(ellipse at center, rgba(95,151,208,0.22), transparent 66%)'
                        : 'radial-gradient(ellipse at center, rgba(166,210,239,0.42), transparent 68%)',
                    filter: 'blur(10px)',
                }}
            />

            {isDarkMode ? (
                <>
                    <AuroraBorealis />
                    {stars.map((star, i) => (
                        <motion.div
                            key={`winter-star-${i}`}
                            className="absolute rounded-full bg-white"
                            style={{
                                left: star.x,
                                top: star.y,
                                width: star.size,
                                height: star.size,
                                opacity: star.opacity,
                                boxShadow: '0 0 8px rgba(255,255,255,0.6)',
                            }}
                            animate={{ opacity: [star.opacity * 0.55, star.opacity, star.opacity * 0.55] }}
                            transition={{ duration: star.duration, repeat: Infinity, ease: 'easeInOut', delay: star.delay }}
                        />
                    ))}
                    <div className="absolute right-[9%] top-[7%]">
                        <div
                            className="relative h-16 w-16 rounded-full"
                            style={{
                                background: 'radial-gradient(circle at 35% 35%, #ffffff, #d9e9f7 54%, #aabfd6 100%)',
                                boxShadow: '0 0 38px rgba(190,218,250,0.42)',
                            }}
                        >
                            <div className="absolute left-[22%] top-[24%] h-2 w-2 rounded-full bg-slate-400/20" />
                            <div className="absolute bottom-[24%] right-[20%] h-3 w-3 rounded-full bg-slate-400/20" />
                        </div>
                    </div>
                </>
            ) : (
                <div
                    className="absolute right-[10%] top-[8%] h-20 w-20 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0.2) 58%, transparent 72%)',
                        boxShadow: '0 0 46px rgba(180,218,242,0.45)',
                    }}
                />
            )}

            {snowflakes.map((flake, i) => (
                <Snowflake key={`winter-flake-${i}`} {...flake} />
            ))}

            <IcicleRow count={profile.icicles} />
            <FogLayer isDarkMode={isDarkMode} />

            {Array.from({ length: profile.wind }, (_, i) => (
                <motion.div
                    key={`winter-wind-${i}`}
                    className="absolute left-[-18%] h-px"
                    style={{
                        top: `${24 + i * 17}%`,
                        width: `${26 + i * 8}%`,
                        background: 'linear-gradient(90deg, transparent, rgba(230,246,255,0.52), transparent)',
                        filter: 'blur(1px)',
                    }}
                    animate={{ x: ['0vw', '138vw'], opacity: [0, 0.72, 0] }}
                    transition={{ duration: 8 + i * 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 2.2 }}
                />
            ))}

            <div
                className="absolute bottom-0 left-[-8%] right-[-8%] h-[22%]"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(180deg, rgba(65,103,143,0.86), #1c3555 76%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.88), #e5f2fb 78%)',
                    borderRadius: '58% 48% 0 0 / 34% 28% 0 0',
                    boxShadow: isDarkMode ? '0 -18px 46px rgba(89,143,199,0.12)' : '0 -18px 46px rgba(139,188,221,0.18)',
                }}
            >
                <div
                    className="absolute left-[12%] right-[16%] top-[22%] h-px"
                    style={{ background: isDarkMode ? 'rgba(188,220,246,0.22)' : 'rgba(146,190,220,0.28)' }}
                />
                {sparkles.map((i) => (
                    <motion.div
                        key={`winter-spark-${i}`}
                        className="absolute h-1 w-1 rounded-full bg-white"
                        style={{ left: `${10 + ((i * 11) % 78)}%`, top: `${18 + (i % 3) * 16}%` }}
                        animate={{ opacity: [0, 0.9, 0], scale: [0.65, 1.5, 0.65] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.38 }}
                    />
                ))}
            </div>

            {[
                { x: '7%', scale: 1.14 },
                { x: '15%', scale: 0.82 },
                { x: '80%', scale: 0.96 },
                { x: '90%', scale: 1.22 },
            ].map((tree, i) => (
                <WinterTree key={`winter-tree-${i}`} isDarkMode={isDarkMode} x={tree.x} scale={tree.scale} delay={i * 0.12} />
            ))}
        </motion.div>
    );
};

export default WinterTheme;
