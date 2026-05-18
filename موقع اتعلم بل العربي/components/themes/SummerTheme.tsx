import React from 'react';
import { motion } from 'framer-motion';

// ============================================================
// --- EPIC SUMMER ANIME THEME COMPONENTS ---
// ============================================================

// 1. Volumetric Light Rays (God Rays - Gives the Genshin/Anime atmospheric feel)
const GodRays: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen opacity-60">
        {[...Array(5)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute top-[-20%] right-[-10%] w-[150%] h-[50%]"
                style={{
                    background: isDarkMode 
                        ? 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.03), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                    transformOrigin: 'top right',
                    rotate: -35 + i * 15,
                    filter: 'blur(30px)'
                }}
                animate={{ 
                    opacity: [0.3, 0.7, 0.3],
                    scaleY: [1, 1.2, 1],
                    rotate: [-35 + i * 15, -30 + i * 15, -35 + i * 15]
                }}
                transition={{ duration: 10 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
            />
        ))}
    </div>
);

// 2. Floating Dust / Magical Embers (Like RPG loading screens)
const MagicalParticles: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => {
                const size = Math.random() * 4 + 2;
                const duration = Math.random() * 15 + 10;
                const delay = Math.random() * -20;
                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: size,
                            height: size,
                            left: `${Math.random() * 100}%`,
                            bottom: '-10%',
                            background: isDarkMode ? '#00F0FF' : '#FFD700',
                            boxShadow: isDarkMode ? '0 0 10px #00F0FF' : '0 0 10px #FFD700',
                            opacity: 0
                        }}
                        animate={{
                            y: [0, -window.innerHeight * 1.2],
                            x: [0, Math.sin(i) * 100],
                            opacity: [0, 0.8, 0],
                            scale: [0, 1, 0]
                        }}
                        transition={{
                            duration,
                            repeat: Infinity,
                            delay,
                            ease: 'linear'
                        }}
                    />
                );
            })}
        </div>
    );
};

// 3. The Core Anime Glow (Ambient backlight)
const AmbientGlow: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <motion.div
        className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] pointer-events-none"
        style={{
            background: isDarkMode
                ? 'radial-gradient(circle at 70% 30%, rgba(0, 240, 255, 0.12) 0%, transparent 60%)'
                : 'radial-gradient(circle at 70% 30%, rgba(255, 138, 0, 0.25) 0%, transparent 60%)',
            filter: 'blur(60px)'
        }}
        animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
);

export default function SummerTheme({ isDarkMode }: { isDarkMode: boolean, visuals?: any }) {
    return (
        <motion.div
            key="summer_anime"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 overflow-hidden"
            style={{ zIndex: 0 }}
        >
            {/* Base Sky Gradient (Deep Ocean to Sunset / Twilight) */}
            <div
                className="absolute inset-0 transition-colors duration-1000"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #081018 100%)' // Deep Star Rail Night
                        : 'linear-gradient(135deg, #E0F2F7 0%, #FFDAB9 60%, #FFB6A3 100%)' // Genshin Sunset/Beach
                }}
            />

            <AmbientGlow isDarkMode={isDarkMode} />
            <GodRays isDarkMode={isDarkMode} />
            
            {/* Subtle Horizon Line / Ocean Depth */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none opacity-40"
                style={{
                    background: isDarkMode 
                        ? 'linear-gradient(to top, rgba(0, 240, 255, 0.1), transparent)'
                        : 'linear-gradient(to top, rgba(255, 138, 0, 0.15), transparent)',
                    backdropFilter: 'blur(8px)'
                }}
            />

            <MagicalParticles isDarkMode={isDarkMode} />

            {/* Premium Stars (Night Mode Only) */}
            {isDarkMode && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(40)].map((_, i) => (
                        <motion.div
                            key={`star-${i}`}
                            className="absolute rounded-full bg-white"
                            style={{
                                width: Math.random() * 2 + 1,
                                height: Math.random() * 2 + 1,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 60}%`,
                                boxShadow: '0 0 8px rgba(255,255,255,0.8)'
                            }}
                            animate={{ opacity: [0.1, Math.random() * 0.8 + 0.2, 0.1] }}
                            transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}
