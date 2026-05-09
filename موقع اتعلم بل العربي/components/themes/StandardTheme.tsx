import React from 'react';
import { motion } from 'framer-motion';

// ============================================================
// --- STANDARD THEME COMPONENTS ---
// ============================================================

const StandardTheme = ({ isDarkMode }: { isDarkMode: boolean }) => {
    return (
        <motion.div key="standard_l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden">

            {/* Deep background */}
            <div className="absolute inset-0" style={{
                background: isDarkMode
                    ? 'radial-gradient(ellipse at 20% 30%, #1e1b4b 0%, #0f172a 40%, #030712 100%)'
                    : 'radial-gradient(ellipse at 20% 30%, #ede9fe 0%, #f0f4ff 40%, #ffffff 100%)'
            }} />

            {/* Glowing orb centre */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{ width: 500, height: 500, background: isDarkMode ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Orbiting rings */}
            {[180, 280, 370].map((r, ri) => (
                <motion.div
                    key={`ring-${ri}`}
                    className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                    style={{
                        width: r * 2, height: r * 2,
                        marginLeft: -r, marginTop: -r,
                        border: `1px solid ${isDarkMode ? 'rgba(139,92,246,0.15)' : 'rgba(99,102,241,0.12)'}`,
                    }}
                    animate={{ rotate: ri % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 30 + ri * 20, repeat: Infinity, ease: 'linear' }}
                >
                    {/* Dot on ring */}
                    <motion.div
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{ background: ['#818cf8', '#a78bfa', '#c084fc'][ri] }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>
            ))}

            {/* Floating Multilingual Characters — neon glow */}
            {([
                { ch: 'A', x: 8, y: 12, sz: 72 }, { ch: 'ض', x: 22, y: 65, sz: 90 },
                { ch: '文', x: 40, y: 20, sz: 80 }, { ch: 'ß', x: 55, y: 75, sz: 65 },
                { ch: 'F', x: 70, y: 10, sz: 85 }, { ch: 'Ö', x: 82, y: 55, sz: 60 },
                { ch: '语', x: 15, y: 80, sz: 78 }, { ch: 'ع', x: 62, y: 42, sz: 95 },
                { ch: 'Ω', x: 33, y: 48, sz: 70 }, { ch: 'Z', x: 88, y: 78, sz: 68 },
                { ch: '字', x: 48, y: 88, sz: 82 }, { ch: 'R', x: 5, y: 45, sz: 75 },
            ] as { ch: string; x: number; y: number; sz: number }[]).map(({ ch, x, y, sz }, i) => {
                const palette = isDarkMode
                    ? ['#818cf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#38bdf8']
                    : ['#4f46e5', '#db2777', '#d97706', '#059669', '#7c3aed', '#0284c7'];
                const col = palette[i % palette.length];
                return (
                    <motion.div
                        key={i}
                        className="absolute font-black select-none pointer-events-none"
                        style={{
                            fontSize: sz, left: `${x}%`, top: `${y}%`, color: col,
                            textShadow: isDarkMode ? `0 0 30px ${col}, 0 0 60px ${col}50` : `0 2px 12px ${col}40`,
                            filter: isDarkMode ? `drop-shadow(0 0 8px ${col}80)` : 'none'
                        }}
                        animate={{ y: [0, -35, 0], rotate: [i % 2 === 0 ? -8 : 8, i % 2 === 0 ? 8 : -8, i % 2 === 0 ? -8 : 8], scale: [0.9, 1.05, 0.9], opacity: [0.35, 0.75, 0.35] }}
                        transition={{ duration: 9 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    >
                        {ch}
                    </motion.div>
                );
            })}

            {/* Rising light particles */}
            {[...Array(18)].map((_, i) => {
                const cols = ['#818cf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
                return (
                    <motion.div
                        key={`lp-${i}`}
                        className="absolute w-1 rounded-full pointer-events-none"
                        style={{ left: `${(i * 5.7) % 100}%`, bottom: '-2%', height: 6 + (i % 4) * 4, background: cols[i % cols.length], filter: 'blur(1px)', opacity: 0 }}
                        animate={{ y: [0, -(200 + i * 20)], opacity: [0, 0.8, 0] }}
                        transition={{ duration: 4 + i % 3, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
                    />
                );
            })}

            {/* Subtle dot grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
                opacity: isDarkMode ? 0.04 : 0.06,
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '36px 36px', color: isDarkMode ? '#a78bfa' : '#6366f1'
            }} />
        </motion.div>
    );
};

export default StandardTheme;

