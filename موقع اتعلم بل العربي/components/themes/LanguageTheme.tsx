import React from 'react';
import { motion } from 'framer-motion';

// ============================================================
// --- CALM & PREMIUM ACADEMY THEME COMPONENTS ---
// ============================================================

// 1. Bright Library Light Rays (Stronger, majestic lighting)
const LibraryRays: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen opacity-70 z-0">
        {[...Array(5)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute top-[-20%] left-[-10%] w-[150%] h-[60%]"
                style={{
                    background: isDarkMode 
                        ? 'linear-gradient(180deg, rgba(144, 202, 249, 0.15), transparent)' // Brighter cool blue light
                        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.6), transparent)', // Brighter sunlight
                    transformOrigin: 'top left',
                    rotate: 30 + i * 12,
                    filter: 'blur(30px)' // Less blur = stronger ray definition
                }}
                animate={{ 
                    opacity: [0.4, 0.8, 0.4],
                    scaleY: [1, 1.2, 1]
                }}
                transition={{ duration: 10 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
            />
        ))}
    </div>
);

// 2. Floating Knowledge (Many letters and symbols drifting smoothly)
const FloatingKnowledge: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const symbols = ["أ", "ب", "ع", "م", "A", "E", "π", "∑", "α", "β", "?", "!", "∞"];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={`symbol-${i}`}
                    className="absolute font-serif font-bold select-none"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${90 + Math.random() * 20}%`, // Start slightly below screen
                        fontSize: `${1 + Math.random() * 3}rem`,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.4)', // Slate-900 with opacity for light mode
                        textShadow: isDarkMode ? '0 0 10px rgba(144, 202, 249, 0.5)' : '0 0 10px rgba(15, 23, 42, 0.1)',
                    }}
                    animate={{
                        y: [0, -400 - Math.random() * 300], // Drift upwards
                        x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50], // Sway left/right
                        rotate: [0, Math.random() * 360],
                        opacity: [0, Math.random() * 0.4 + 0.2, 0], // Smooth fade in and out (increased opacity)
                        scale: [0.8, 1.1, 0.8]
                    }}
                    transition={{
                        duration: 15 + Math.random() * 20,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 10
                    }}
                >
                    {symbols[i % symbols.length]}
                </motion.div>
            ))}
        </div>
    );
};

// 3. Soft Floating Geometry (Books, pages, and abstract shapes)
const FloatingGeometry: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[4]">
            {[...Array(12)].map((_, i) => {
                const isCircle = i % 3 === 0;
                const isLine = i % 3 === 1;
                return (
                    <motion.div
                        key={`geo-${i}`}
                        className="absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${80 + Math.random() * 40}%`,
                            width: isLine ? `${40 + Math.random() * 60}px` : `${20 + Math.random() * 40}px`,
                            height: isLine ? '2px' : `${20 + Math.random() * 40}px`,
                            borderRadius: isCircle ? '50%' : (isLine ? '2px' : '4px'),
                            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15, 23, 42, 0.15)', // Darker border for light mode
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(15, 23, 42, 0.05)', // Darker fill for light mode
                            backdropFilter: 'blur(2px)' // Slight glass effect
                        }}
                        animate={{
                            y: [0, -300 - Math.random() * 200],
                            x: [0, Math.random() * 80 - 40],
                            rotate: [0, 180 + Math.random() * 180],
                            opacity: [0, 0.6, 0] // Increased opacity slightly
                        }}
                        transition={{
                            duration: 20 + Math.random() * 15,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 15
                        }}
                    />
                );
            })}
        </div>
    );
};

// 4. Library Dust (Soft glowing particles)
const LibraryDust: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[6]">
            {[...Array(25)].map((_, i) => (
                <motion.div
                    key={`dust-${i}`}
                    className="absolute rounded-full"
                    style={{
                        width: `${Math.random() * 4 + 2}px`,
                        height: `${Math.random() * 4 + 2}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        // In dark mode: blue/white dust. In light mode: Slate/gold dust
                        backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.8)' : 'rgba(71, 85, 105, 0.5)', 
                        boxShadow: isDarkMode ? '0 0 10px rgba(144, 202, 249, 0.6)' : '0 0 8px rgba(71, 85, 105, 0.3)',
                    }}
                    animate={{
                        y: [0, -100 - Math.random() * 100],
                        x: [0, Math.random() * 50 - 25],
                        opacity: [0, Math.random() * 0.6 + 0.4, 0], // Increased base opacity
                        scale: [0.5, 1.5, 0.5]
                    }}
                    transition={{
                        duration: 10 + Math.random() * 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 5
                    }}
                />
            ))}
        </div>
    );
};

// 5. Clean, Smooth Background Gradient
const CalmBackground: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            <motion.div 
                className="absolute inset-0 transition-colors duration-1000"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' // Deep calm slate/navy
                        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' // Clean crisp paper/white
                }}
            />
            {/* Ambient Background Glow to make rays stand out */}
            <motion.div
                className="absolute inset-0 mix-blend-overlay opacity-50"
                style={{
                    background: isDarkMode
                        ? 'radial-gradient(circle at 50% 50%, rgba(100, 181, 246, 0.15) 0%, transparent 80%)'
                        : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 80%)'
                }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <div 
                className="absolute inset-0 opacity-[0.02]"
                style={{ 
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '32px 32px' 
                }}
            />
        </div>
    );
};

const LanguageTheme: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    return (
        <motion.div
            key="school_l"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className={`absolute inset-0 overflow-hidden transition-colors duration-1000 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}
        >
            <CalmBackground isDarkMode={isDarkMode} />
            <LibraryRays isDarkMode={isDarkMode} />
            <FloatingGeometry isDarkMode={isDarkMode} />
            <FloatingKnowledge isDarkMode={isDarkMode} />
            <LibraryDust isDarkMode={isDarkMode} />
        </motion.div>
    );
};

export default LanguageTheme;

