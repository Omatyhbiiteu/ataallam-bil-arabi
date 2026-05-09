import React, { useMemo } from 'react';
import { CustomThemeConfig } from '../../types';
import { motion } from 'framer-motion';

// ============================================================
// --- PARTICLE EFFECTS ---
// ============================================================

const FallingSnow: React.FC = () => {
    const flakes = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 6 + 2,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 6,
        drift: Math.random() * 80 - 40,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {flakes.map(f => (
                <motion.div
                    key={f.id}
                    className="absolute rounded-full bg-white"
                    style={{ width: f.size, height: f.size, left: `${f.x}%`, top: -20, opacity: 0.7 }}
                    animate={{ y: ['0vh', '105vh'], x: [0, f.drift] }}
                    transition={{ duration: f.duration, repeat: Infinity, ease: 'linear', delay: f.delay }}
                />
            ))}
        </div>
    );
};

const FloatingStars: React.FC<{ color: string }> = ({ color }) => {
    const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 10 + 6,
        delay: Math.random() * 4,
        duration: Math.random() * 3 + 2,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map(s => (
                <motion.svg
                    key={s.id}
                    width={s.size} height={s.size}
                    viewBox="0 0 24 24"
                    fill={color}
                    className="absolute"
                    style={{ left: `${s.x}%`, top: `${s.y}%`, opacity: 0 }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.2, 0.6] }}
                    transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
                >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </motion.svg>
            ))}
        </div>
    );
};

const ConfettiEffect: React.FC<{ colors: string[] }> = ({ colors }) => {
    const pieces = useMemo(() => Array.from({ length: 100 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * 100,
        w: Math.random() * 10 + 4,
        h: Math.random() * 18 + 8,
        delay: Math.random() * 6,
        duration: Math.random() * 4 + 3,
        drift: Math.random() * 120 - 60,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {pieces.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute"
                    style={{ width: p.w, height: p.h, backgroundColor: p.color, left: `${p.x}%`, top: -20 }}
                    animate={{ y: ['0vh', '105vh'], x: [0, p.drift], rotateZ: [0, 360 * (Math.random() > 0.5 ? 1 : -1)] }}
                    transition={{ duration: p.duration, repeat: Infinity, ease: 'linear', delay: p.delay }}
                />
            ))}
        </div>
    );
};

const FireworksEffect: React.FC<{ colors: string[] }> = ({ colors }) => {
    const bursts = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
        id: i,
        cx: Math.random() * 80 + 10,
        cy: Math.random() * 60 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 5,
        particles: Array.from({ length: 12 }, (_, j) => ({
            angle: (j / 12) * 360,
            dist: Math.random() * 80 + 40,
        })),
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {bursts.map(b => b.particles.map((p, pi) => {
                const rad = (p.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * p.dist;
                const ty = Math.sin(rad) * p.dist;
                return (
                    <motion.div
                        key={`${b.id}-${pi}`}
                        className="absolute w-2 h-2 rounded-full"
                        style={{ backgroundColor: b.color, left: `${b.cx}%`, top: `${b.cy}%` }}
                        animate={{ x: [0, tx], y: [0, ty], opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: b.delay + (pi * 0.02) }}
                    />
                );
            }))}
        </div>
    );
};

const BubbleEffect: React.FC<{ color: string }> = ({ color }) => {
    const bubbles = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 30 + 10,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 6,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {bubbles.map(b => (
                <motion.div
                    key={b.id}
                    className="absolute rounded-full border-2 opacity-30"
                    style={{
                        width: b.size, height: b.size,
                        borderColor: color,
                        left: `${b.x}%`,
                        bottom: -b.size,
                    }}
                    animate={{ y: [0, -(window.innerHeight + b.size)], opacity: [0, 0.4, 0] }}
                    transition={{ duration: b.duration, repeat: Infinity, ease: 'easeOut', delay: b.delay }}
                />
            ))}
        </div>
    );
};

const PetalsEffect: React.FC<{ color: string }> = ({ color }) => {
    const petals = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 20 + 10,
        delay: Math.random() * 8,
        duration: Math.random() * 7 + 6,
        drift: Math.random() * 150 - 75,
        rotate: Math.random() * 720 - 360,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {petals.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute opacity-60"
                    style={{
                        width: p.size,
                        height: p.size * 0.5,
                        backgroundColor: color,
                        left: `${p.x}%`,
                        top: -30,
                        borderRadius: '80% 0 80% 0',
                    }}
                    animate={{
                        y: ['0vh', '105vh'],
                        x: [0, p.drift],
                        rotate: [0, p.rotate],
                        opacity: [0, 0.6, 0.6, 0],
                    }}
                    transition={{ duration: p.duration, repeat: Infinity, ease: 'easeIn', delay: p.delay }}
                />
            ))}
        </div>
    );
};

const LightningEffect: React.FC<{ color: string }> = ({ color }) => {
    const bolts = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10,
        delay: Math.random() * 4,
        repeatDelay: Math.random() * 5 + 3,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {bolts.map(b => (
                <motion.div
                    key={b.id}
                    className="absolute top-0 w-0.5"
                    style={{
                        left: `${b.x}%`,
                        background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
                        height: '100vh',
                        opacity: 0,
                    }}
                    animate={{ opacity: [0, 0.8, 0, 0.9, 0], scaleX: [1, 1.5, 1] }}
                    transition={{ duration: 0.3, repeat: Infinity, repeatDelay: b.repeatDelay, delay: b.delay }}
                />
            ))}
        </div>
    );
};

const LeafEffect: React.FC<{ color: string }> = ({ color }) => {
    const leaves = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 20 + 10,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 8,
        drift: Math.random() * 200 - 100,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {leaves.map(l => (
                <motion.div
                    key={l.id}
                    className="absolute"
                    style={{
                        width: l.size,
                        height: l.size * 0.65,
                        backgroundColor: color,
                        left: `${l.x}%`,
                        top: -30,
                        borderRadius: '80% 0 80% 0',
                        opacity: 0.7,
                    }}
                    animate={{
                        y: ['0vh', '105vh'],
                        x: [0, l.drift],
                        rotate: [0, 360],
                        opacity: [0, 0.7, 0.7, 0],
                    }}
                    transition={{ duration: l.duration, repeat: Infinity, ease: 'easeIn', delay: l.delay }}
                />
            ))}
        </div>
    );
};

// ============================================================
// --- MAIN CUSTOM THEME COMPONENT ---
// ============================================================

interface CustomThemeProps {
    isDarkMode: boolean;
    config: CustomThemeConfig;
}

const hexToRgbTriple = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex && hex.startsWith('#')) {
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length >= 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
    }
    return `${r}, ${g}, ${b}`;
};

const CustomTheme: React.FC<CustomThemeProps> = ({ isDarkMode, config }) => {
    if (!config) return null;

    const { primary, secondary, accent, effect } = config;

    const bgOpacity = isDarkMode ? 0.06 : 0.18;
    const orbOpacity = isDarkMode ? 0.12 : 0.28;

    const primaryRgb = hexToRgbTriple(primary);
    const secondaryRgb = hexToRgbTriple(secondary);

    const palette = [primary, secondary, accent || '#f59e0b'].filter(Boolean);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute inset-0 transition-colors duration-1000"
                style={{
                    background: `linear-gradient(135deg, rgba(${primaryRgb}, ${bgOpacity}), rgba(${secondaryRgb}, ${bgOpacity}))`
                }}
            />
            <motion.div
                className="absolute top-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full blur-[120px] transition-all duration-1000"
                style={{ backgroundColor: primary, opacity: orbOpacity }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute bottom-[-15%] left-[-15%] w-[70%] h-[70%] rounded-full blur-[140px] transition-all duration-1000"
                style={{ backgroundColor: secondary, opacity: orbOpacity }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            />

            {effect === 'snow' && <FallingSnow />}
            {effect === 'stars' && <FloatingStars color={secondary} />}
            {effect === 'confetti' && <ConfettiEffect colors={palette} />}
            {effect === 'fireworks' && <FireworksEffect colors={palette} />}
            {effect === 'bubbles' && <BubbleEffect color={secondary} />}
            {effect === 'petals' && <PetalsEffect color={primary} />}
            {effect === 'lightning' && <LightningEffect color={primary} />}
            {effect === 'leaves' && <LeafEffect color={primary} />}
        </div>
    );
};

export default CustomTheme;
