import React from 'react';
import { motion } from 'framer-motion';

export const Sun: React.FC = () => (
    <motion.div
        className="absolute top-10 right-10 z-[1]"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
    >
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full blur-[2px] shadow-[0_0_60px_rgba(251,191,36,0.6)]" />
        <motion.div
            className="absolute -inset-4 rounded-full border border-yellow-200/30"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute -inset-8 rounded-full border border-orange-300/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
    </motion.div>
);

export const RamadanCannon: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <motion.div
        className="relative group w-64 h-48"
        initial={{ y: 0 }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
        <svg viewBox="0 0 300 200" className="w-full h-full drop-shadow-2xl">
            <defs>
                <linearGradient id="cannonMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={isDarkMode ? "#2c3e50" : "#4a4a4a"} />
                    <stop offset="50%" stopColor={isDarkMode ? "#4ca1af" : "#808080"} />
                    <stop offset="100%" stopColor={isDarkMode ? "#2c3e50" : "#4a4a4a"} />
                </linearGradient>
                <linearGradient id="cannonWood" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5d4037" />
                    <stop offset="50%" stopColor="#8d6e63" />
                    <stop offset="100%" stopColor="#3e2723" />
                </linearGradient>
            </defs>

            {/* Detailed Wheels */}
            <g transform="translate(140, 140)">
                {/* Wheel Rim */}
                <circle cx="0" cy="0" r="35" fill="none" stroke="#3e2723" strokeWidth="8" />
                <circle cx="0" cy="0" r="35" fill="none" stroke="#5d4037" strokeWidth="2" strokeDasharray="5,5" />
                {/* Spokes */}
                {[0, 30, 60, 90, 120, 150].map(r => (
                    <rect key={r} x="-32" y="-3" width="64" height="6" fill="#3e2723" transform={`rotate(${r})`} rx="2" />
                ))}
                {/* Hub */}
                <circle cx="0" cy="0" r="10" fill="url(#cannonMetal)" stroke="#222" strokeWidth="2" />
            </g>

            {/* Carriage Body */}
            <path d="M80 130 L180 130 L160 150 L60 150 Z" fill="url(#cannonWood)" stroke="#271c19" strokeWidth="2" />
            <path d="M100 130 L110 110 L150 110 L160 130" fill="#3e2723" />

            {/* Barrel - The Main Event */}
            <motion.g
                className="origin-[130px_110px]"
                animate={{ rotate: [0, -2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Barrel Body */}
                <path
                    d="M60 90 L180 80 L180 110 L60 115 C 50 115, 40 102, 60 90 Z"
                    fill="url(#cannonMetal)"
                    stroke={isDarkMode ? "#1f2937" : "#222"}
                    strokeWidth="1"
                />
                {/* Barrel Bands */}
                <rect x="160" y="81" width="10" height="29" fill="#111" opacity="0.3" />
                <rect x="120" y="85" width="10" height="28" fill="#111" opacity="0.3" />
                <rect x="80" y="90" width="12" height="23" fill="#111" opacity="0.3" />

                {/* Highlight/Shine */}
                <path d="M70 95 L170 85" stroke="white" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
            </motion.g>
        </svg>
    </motion.div>
);

export const StreetZina: React.FC = () => (
    <div className="absolute top-0 left-0 w-full h-32 pointer-events-none z-20">
        <svg className="w-full h-full" preserveAspectRatio="none">
            {/* String */}
            <motion.path
                d="M0,0 Q500,100 1000,0 T2000,0"
                fill="none"
                stroke="#d4a017"
                strokeWidth="2"
                style={{ pathLength: 1 }}
                animate={{ d: ["M0,0 Q500,120 1000,0 T2000,0", "M0,0 Q500,90 1000,20 T2000,0", "M0,0 Q500,120 1000,0 T2000,0"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
        </svg>
        {/* Triangles */}
        <div className="absolute inset-0 flex justify-between px-10 items-start pt-2">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] origin-top"
                    style={{
                        borderTopColor: ['#ce1126', '#146c43', '#ffc107', '#0d6efd'][i % 4],
                        marginTop: Math.sin(i) * 20 + 20 + 'px' // Approximate curve position
                    }}
                    animate={{ rotate: [-10, 10, -10] }}
                    transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
                />
            ))}
        </div>
    </div>
);

export const SalahElDinCitadel: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="absolute bottom-0 w-full h-[55vh] pointer-events-none z-0">
        <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
            <defs>
                <mask id="citadelMask">
                    <rect width="1000" height="500" fill="white" />
                </mask>
            </defs>

            {/* 
               ENVIRONMENT & HILLS 
               Adaptive colors blending with background
            */}
            <path
                d="M-100,500 L-100,350 Q200,320 500,350 T1100,300 L1100,500 Z"
                fill={isDarkMode ? "#1a120e" : "#d7ccc8"}
            />
            <path
                d="M-50,500 L-50,400 Q250,380 550,410 T1050,380 L1050,500 Z"
                fill={isDarkMode ? "#2d1b15" : "#efebe9"}
                opacity="0.8"
            />

            {/* 
               2D FLAT ILLUSTRATION OF CITADEL
               Style: Clean lines, minimal gradients, clear silhouette
            */}
            <g transform="translate(300, 180) scale(1.2)">

                {/* --- WALLS BASE --- */}
                {/* Main Fortification Wall */}
                <path
                    d="M-50,220 L350,220 L350,140 L300,140 L300,150 L280,150 L280,140 L240,140 L240,150 L220,150 L220,140 L160,140 L160,150 L140,150 L140,140 L100,140 L80,140 L-50,140 Z"
                    fill={isDarkMode ? "#3e2723" : "#bcaaa4"}
                />
                {/* Wall Shadow/Depth */}
                <path
                    d="M-50,220 L350,220 L350,210 L-50,210 Z"
                    fill={isDarkMode ? "#1a0f0a" : "#8d6e63"}
                    opacity="0.3"
                />

                {/* --- MOSQUE OF MUHAMMAD ALI --- */}
                {/* Main Structure Body */}
                <rect x="80" y="80" width="140" height="60" fill={isDarkMode ? "#4e342e" : "#d7ccc8"} />

                {/* Central Large Dome */}
                <path
                    d="M90,80 Q150,10 210,80"
                    fill={isDarkMode ? "#5d4037" : "#a1887f"}
                />
                {/* Dome Highlight (Shiny metal look for day, subtle for night) */}
                <path
                    d="M110,70 Q130,50 140,70"
                    fill="none"
                    stroke={isDarkMode ? "#8d6e63" : "#f5f5f5"}
                    strokeWidth="3"
                    opacity="0.4"
                    strokeLinecap="round"
                />

                {/* The Two Iconic Pencil Minarets */}
                {/* Left Minaret */}
                <g transform="translate(70, 0)">
                    <rect x="0" y="20" width="10" height="120" fill={isDarkMode ? "#5d4037" : "#a1887f"} />
                    <polygon points="-2,20 12,20 5,-10" fill={isDarkMode ? "#3e2723" : "#8d6e63"} /> {/* Spire */}
                    <rect x="-2" y="40" width="14" height="4" fill={isDarkMode ? "#3e2723" : "#8d6e63"} rx="1" /> {/* Balcony 1 */}
                    <rect x="-2" y="70" width="14" height="4" fill={isDarkMode ? "#3e2723" : "#8d6e63"} rx="1" /> {/* Balcony 2 */}
                </g>

                {/* Right Minaret */}
                <g transform="translate(220, 0)">
                    <rect x="0" y="20" width="10" height="120" fill={isDarkMode ? "#5d4037" : "#a1887f"} />
                    <polygon points="-2,20 12,20 5,-10" fill={isDarkMode ? "#3e2723" : "#8d6e63"} /> {/* Spire */}
                    <rect x="-2" y="40" width="14" height="4" fill={isDarkMode ? "#3e2723" : "#8d6e63"} rx="1" /> {/* Balcony 1 */}
                    <rect x="-2" y="70" width="14" height="4" fill={isDarkMode ? "#3e2723" : "#8d6e63"} rx="1" /> {/* Balcony 2 */}
                </g>

                {/* --- FOREGROUND TOWERS --- */}
                {/* Left Round Tower */}
                <rect x="10" y="120" width="40" height="100" fill={isDarkMode ? "#4e342e" : "#a1887f"} />
                <path d="M10,120 L50,120 L50,110 L40,110 L40,120 L30,120 L30,110 L20,110 L20,120 L10,120 Z" fill={isDarkMode ? "#3e2723" : "#8d6e63"} />

                {/* Right Round Tower */}
                <rect x="250" y="120" width="40" height="100" fill={isDarkMode ? "#4e342e" : "#a1887f"} />
                <path d="M250,120 L290,120 L290,110 L280,110 L280,120 L270,120 L270,110 L260,110 L260,120 L250,120 Z" fill={isDarkMode ? "#3e2723" : "#8d6e63"} />


            </g>
        </svg>
    </div>
);
