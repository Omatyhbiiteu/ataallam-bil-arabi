import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// --- LANGUAGE LEARNING THEME COMPONENTS ---
// ============================================================

export const TranslationIcon: React.FC<{ x: string; y: string; scale?: number; delay?: number; isDarkMode: boolean }> = ({ x, y, scale = 1, delay = 0, isDarkMode }) => {
    return (
        <motion.div
            className="absolute z-10 pointer-events-none"
            style={{ left: x, top: y, transform: `scale(${scale})` }}
            animate={{ y: [0, -18, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
        >
            <svg width="80" height="80" viewBox="0 0 100 100" className="drop-shadow-xl">
                {/* Back card */}
                <rect x="30" y="30" width="50" height="50" rx="8" fill={isDarkMode ? "#37474F" : "#CFD8DC"} />
                <text x="55" y="65" fill={isDarkMode ? "#B0BEC5" : "#78909C"} fontSize="28" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">文</text>
                {/* Front card */}
                <rect x="15" y="15" width="50" height="50" rx="8" fill={isDarkMode ? "#0277BD" : "#0288D1"} />
                <text x="40" y="47" fill="#FFFFFF" fontSize="28" fontWeight="bold" textAnchor="middle" fontFamily="serif">A</text>
                {/* Swap arrows */}
                <path d="M 70 15 L 80 25 L 75 25 L 75 30 L 65 30 L 65 25 L 60 25 Z" fill={isDarkMode ? "#FFCA28" : "#FFB300"} />
                <path d="M 25 80 L 15 70 L 20 70 L 20 65 L 30 65 L 30 70 L 35 70 Z" fill={isDarkMode ? "#FFCA28" : "#FFB300"} />
            </svg>
        </motion.div>
    );
};

export const GlobeModel: React.FC<{ x: string; y: string; scale?: number; delay?: number; isDarkMode: boolean }> = ({ x, y, scale = 1, delay = 0, isDarkMode }) => {
    return (
        <motion.div
            className="absolute z-10 pointer-events-none"
            style={{ left: x, top: y, transform: `scale(${scale})` }}
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
        >
            <svg width="80" height="80" viewBox="0 0 100 100" className="drop-shadow-xl">
                {/* Base / Stand */}
                <path d="M 30 90 L 70 90 L 65 75 L 35 75 Z" fill={isDarkMode ? "#5D4037" : "#795548"} />
                <rect x="47" y="60" width="6" height="15" fill={isDarkMode ? "#A1887F" : "#BCAAA4"} />
                {/* Arc */}
                <path d="M 20 50 A 35 35 0 0 0 80 50" fill="none" stroke={isDarkMode ? "#9E9E9E" : "#BDBDBD"} strokeWidth="4" />
                <path d="M 80 50 A 35 35 0 0 0 71 20" fill="none" stroke={isDarkMode ? "#9E9E9E" : "#BDBDBD"} strokeWidth="4" />
                <circle cx="20" cy="50" r="3" fill={isDarkMode ? "#757575" : "#9E9E9E"} />
                <circle cx="71" cy="20" r="3" fill={isDarkMode ? "#757575" : "#9E9E9E"} />
                {/* Earth Body */}
                <circle cx="50" cy="40" r="28" fill={isDarkMode ? "#0277BD" : "#29B6F6"} />
                {/* Continents */}
                <path d="M 30 30 Q 40 20 50 35 Q 60 40 55 55 Q 40 60 35 45 Z" fill={isDarkMode ? "#2E7D32" : "#66BB6A"} />
                <path d="M 60 25 Q 70 15 75 25 Q 70 35 65 30 Z" fill={isDarkMode ? "#2E7D32" : "#66BB6A"} />
                <path d="M 40 65 Q 50 70 65 65 Q 70 55 60 50 Z" fill={isDarkMode ? "#2E7D32" : "#66BB6A"} />
                {/* Latitude/Longitude lines */}
                <ellipse cx="50" cy="40" rx="28" ry="10" fill="none" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.4" />
                <ellipse cx="50" cy="40" rx="10" ry="28" fill="none" stroke="#FFF" strokeWidth="0.5" strokeOpacity="0.4" />
                {/* Gloss / Shine */}
                <path d="M 30 25 A 20 20 0 0 1 60 25 A 28 28 0 0 0 30 25 Z" fill="#FFF" opacity="0.3" />
            </svg>
        </motion.div>
    );
};

export const SpeechBubbles: React.FC<{ x: string; y: string; scale?: number; delay?: number; isDarkMode: boolean }> = ({ x, y, scale = 1, delay = 0, isDarkMode }) => {
    return (
        <motion.div
            className="absolute z-10 pointer-events-none"
            style={{ left: x, top: y, transform: `scale(${scale})` }}
            animate={{ y: [0, -15, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 6, repeat: Infinity, delay, ease: "easeInOut" }}
        >
            <svg width="80" height="80" viewBox="0 0 100 100" className="drop-shadow-lg">
                <path d="M 20 45 Q 20 20 50 20 Q 80 20 80 45 Q 80 70 50 70 L 35 80 L 35 68 Q 20 62 20 45 Z" fill={isDarkMode ? "#0277BD" : "#29B6F6"} />
                <path d="M 40 60 Q 40 40 70 40 Q 95 40 95 60 Q 95 72 85 78 L 85 90 L 75 80 Q 40 85 40 60 Z" fill={isDarkMode ? "#00695C" : "#26A69A"} opacity="0.9" />
                <text x="50" y="48" fill="#FFF" fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">A</text>
                <text x="68" y="65" fill="#FFF" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ع</text>
            </svg>
        </motion.div>
    );
};

export const GraduationCap: React.FC<{ x: string; y: string; scale?: number; delay?: number; isDarkMode: boolean }> = ({ x, y, scale = 1, delay = 0, isDarkMode }) => {
    return (
        <motion.div
            className="absolute z-20 pointer-events-none"
            style={{ left: x, top: y, transform: `scale(${scale})` }}
            animate={{ y: [0, -25, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 9, repeat: Infinity, delay, ease: "easeInOut" }}
        >
            <svg width="80" height="60" viewBox="0 0 100 80" className="drop-shadow-2xl">
                <path d="M 50 20 Q 80 40 85 60" fill="none" stroke={isDarkMode ? "#FFCA28" : "#FFC107"} strokeWidth="2" />
                <circle cx="85" cy="62" r="3" fill={isDarkMode ? "#FFCA28" : "#FFC107"} />
                <path d="M 82 65 L 88 65 L 86 75 L 84 75 Z" fill={isDarkMode ? "#FFCA28" : "#FFC107"} />
                <path d="M 35 40 L 65 40 L 65 55 Q 50 65 35 55 Z" fill={isDarkMode ? "#424242" : "#212121"} />
                <polygon points="10,30 50,10 90,30 50,50" fill={isDarkMode ? "#616161" : "#424242"} />
                <polygon points="10,30 50,50 48,54 8,34" fill={isDarkMode ? "#212121" : "#000000"} />
                <polygon points="90,30 50,50 52,54 92,34" fill={isDarkMode ? "#424242" : "#212121"} />
                <circle cx="50" cy="30" r="4" fill={isDarkMode ? "#FFCA28" : "#FFC107"} />
            </svg>
        </motion.div>
    );
};

export const DetailedFloatingBook: React.FC<{ x: string; y: string; scale?: number; delay?: number; isDarkMode: boolean }> = ({ x, y, scale = 1, delay = 0, isDarkMode }) => {
    return (
        <motion.div
            className="absolute z-10 pointer-events-none"
            style={{ left: x, top: y, transform: `scale(${scale})` }}
            animate={{ y: [0, -18, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 7, repeat: Infinity, delay, ease: "easeInOut" }}
        >
            <svg width="70" height="50" viewBox="0 0 100 80" className="drop-shadow-2xl">
                {/* Book 3 (Bottom) */}
                <path d="M 15 65 L 85 65 L 90 75 L 20 75 Z" fill={isDarkMode ? "#37474F" : "#78909C"} />
                <path d="M 15 55 L 85 55 L 85 65 L 15 65 Z" fill="#ECEFF1" />
                <path d="M 85 55 L 90 65 L 90 75 L 85 65 Z" fill="#CFD8DC" />
                <path d="M 15 55 L 85 55 L 90 65 L 20 65 Z" fill={isDarkMode ? "#263238" : "#546E7A"} />

                {/* Book 2 (Middle) */}
                <g transform="rotate(-5 50 50) translate(0, -10)">
                    <path d="M 15 65 L 85 65 L 90 75 L 20 75 Z" fill={isDarkMode ? "#827717" : "#CDDC39"} />
                    <path d="M 15 55 L 85 55 L 85 65 L 15 65 Z" fill="#FAFAFA" />
                    <path d="M 85 55 L 90 65 L 90 75 L 85 65 Z" fill="#E0E0E0" />
                    <path d="M 15 55 L 85 55 L 90 65 L 20 65 Z" fill={isDarkMode ? "#558B2F" : "#9CCC65"} />
                </g>

                {/* Book 1 (Top Open Book) */}
                <g transform="translate(5, -25)">
                    <path d="M 15 50 Q 30 40 45 45 L 45 60 Q 30 55 15 65 Z" fill="#FAFAFA" />
                    <path d="M 75 50 Q 60 40 45 45 L 45 60 Q 60 55 75 65 Z" fill="#FAFAFA" />
                    <path d="M 17 52 Q 30 43 45 48" fill="none" stroke="#E0E0E0" strokeWidth="1" />
                    <path d="M 19 54 Q 30 45 45 50" fill="none" stroke="#E0E0E0" strokeWidth="1" />
                    <path d="M 73 52 Q 60 43 45 48" fill="none" stroke="#E0E0E0" strokeWidth="1" />
                    <path d="M 71 54 Q 60 45 45 50" fill="none" stroke="#E0E0E0" strokeWidth="1" />
                    <path d="M 12 51 Q 30 38 45 44 L 45 47 Q 30 41 14 54 Z" fill={isDarkMode ? "#B71C1C" : "#E53935"} />
                    <path d="M 78 51 Q 60 38 45 44 L 45 47 Q 60 41 76 54 Z" fill={isDarkMode ? "#B71C1C" : "#E53935"} />
                    <line x1="45" y1="44" x2="45" y2="60" stroke={isDarkMode ? "#880E4F" : "#C62828"} strokeWidth="2" />
                </g>
            </svg>
        </motion.div>
    );
};

export const QuillPen: React.FC<{ x: string; y: string; scale?: number; delay?: number; isDarkMode: boolean }> = ({ x, y, scale = 1, delay = 0, isDarkMode }) => {
    return (
        <motion.div
            className="absolute z-10 pointer-events-none"
            style={{ left: x, top: y, transform: `scale(${scale})` }}
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, delay, ease: "easeInOut" }}
        >
            <svg width="70" height="70" viewBox="0 0 100 100" className="drop-shadow-lg">
                <path d="M 60 70 L 80 70 L 85 90 L 55 90 Z" fill={isDarkMode ? "#37474F" : "#78909C"} />
                <path d="M 65 65 L 75 65 L 75 70 L 65 70 Z" fill={isDarkMode ? "#263238" : "#546E7A"} />
                <rect x="67" y="60" width="6" height="5" fill="#CFD8DC" />
                <path d="M 55 90 Q 70 85 85 90 Z" fill={isDarkMode ? "#1C313A" : "#455A64"} />
                <path d="M 70 65 Q 60 20 20 10 Q 30 30 40 60 Q 55 55 70 65 Z" fill={isDarkMode ? "#ECEFF1" : "#FFFFFF"} />
                <path d="M 20 10 Q 45 40 70 65" fill="none" stroke={isDarkMode ? "#CFD8DC" : "#E0E0E0"} strokeWidth="2" />
                <polygon points="68,62 72,68 65,75" fill={isDarkMode ? "#FFCA28" : "#FFC107"} />
            </svg>
        </motion.div>
    );
};

export const FloatingLetters: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    const letters = [
        "A", "a", "E", "e", "I", "i", "O", "o", "U", "u",
        "أ", "ب", "ت", "ث", "ج", "ח", "ש", "ד", "ذ", "ر",
        "Hello", "مرحباً", "Bonjour", "Hola", "Ciao", "م"
    ];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute whitespace-nowrap font-serif font-bold opacity-[0.06] select-none"
                    style={{ 
                        left: `${Math.random() * 100}%`, 
                        top: `${Math.random() * 100}%`,
                        fontSize: `${2 + Math.random() * 3}rem`,
                        color: isDarkMode ? '#FFF' : '#000',
                        textShadow: isDarkMode ? '0 0 10px rgba(255,255,255,0.3)' : '0 0 10px rgba(0,0,0,0.1)'
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.15, 0], y: [0, -40], scale: [0.8, 1.1] }}
                    transition={{ duration: 12 + Math.random() * 15, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}
                >
                    {letters[i % letters.length]}
                </motion.div>
            ))}
        </div>
    );
};

export const LanguageBackground: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            <div className={`absolute inset-0 transition-colors duration-1000 ${isDarkMode ? 'bg-[#1e2a38]' : 'bg-[#eef2f5]'}`} />
            <div className={`absolute inset-0 opacity-[0.08] pointer-events-none ${isDarkMode ? "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCA0MGgxMDAwME0wIDBINHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')]" : "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCA0MGgxMDAwME0wIDBINHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhNjZiNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')]"}`} style={{ backgroundSize: '100% 40px' }} />
            {!isDarkMode && (
                <div className="absolute left-[8%] top-0 bottom-0 w-px bg-red-400 opacity-40 z-0" />
            )}
            {!isDarkMode && (
                <div className="absolute left-[8.5%] top-0 bottom-0 w-px bg-red-400 opacity-40 z-0" />
            )}
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
            transition={{ duration: 0.8 }}
            className="absolute inset-0 overflow-hidden"
        >
            <LanguageBackground isDarkMode={isDarkMode} />
            <FloatingLetters isDarkMode={isDarkMode} />
            <TranslationIcon x="15%" y="25%" scale={1.5} delay={1} isDarkMode={isDarkMode} />
            <GlobeModel x="80%" y="20%" scale={1.3} delay={0} isDarkMode={isDarkMode} />
            <SpeechBubbles x="20%" y="70%" scale={1.4} delay={2} isDarkMode={isDarkMode} />
            <QuillPen x="85%" y="75%" scale={1.6} delay={3} isDarkMode={isDarkMode} />
            {[
                { x: '50%', y: '60%', scale: 1.8, delay: 0 },
                { x: '10%', y: '50%', scale: 1.2, delay: 2.5 },
                { x: '90%', y: '50%', scale: 1.3, delay: 1.5 },
            ].map((book, i) => (
                <DetailedFloatingBook 
                    key={i} 
                    x={book.x} 
                    y={book.y} 
                    scale={book.scale} 
                    delay={book.delay}
                    isDarkMode={isDarkMode}
                />
            ))}
        </motion.div>
    );
};

export default LanguageTheme;
