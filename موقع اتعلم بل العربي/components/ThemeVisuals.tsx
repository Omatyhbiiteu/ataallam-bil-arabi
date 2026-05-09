import React, { useState, useEffect, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

// Common Icons (used in THEMES_DATA)
import { Moon, Star, Flag, Sparkles, Heart, BookOpen } from 'lucide-react';
import { AppTheme } from '../types';

// Import our new extracted theme files
import StandardTheme from './themes/StandardTheme';
import RamadanTheme from './themes/RamadanTheme';
import EidFitrTheme from './themes/EidFitrTheme';
import EidAdhaTheme from './themes/EidAdhaTheme';
import WinterTheme from './themes/WinterTheme';
import SummerTheme from './themes/SummerTheme';
import VictoryOctoberTheme from './themes/VictoryOctoberTheme';
import LanguageTheme from './themes/LanguageTheme';
import CustomTheme from './themes/CustomTheme';

interface ThemeVisualsProps {
    theme: AppTheme;
    isDarkMode: boolean;
    customConfig?: any;
}

export const THEMES_DATA: Record<AppTheme, {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    name: string;
    greeting?: string;
    icon?: any;
    soundUrl?: string; // Optional built-in sound URL
    description?: string;
}> = {
    standard: {
        primary: '#c0392b',
        secondary: '#f39c12',
        accent: '#e74c3c',
        glow: 'rgba(192, 57, 43, 0.1)',
        name: 'الافتراضي',
        description: 'المظهر الكلاسيكي المتوازن للأداء اليومي.',
        soundUrl: '' // No sound for standard
    },
    ramadan: {
        primary: '#4a148c',
        secondary: '#ffab00',
        accent: '#7b1fa2',
        glow: 'rgba(74, 20, 140, 0.4)',
        name: 'رمضان كريم',
        greeting: 'رمضان كريم',
        description: 'أجواء رمضانية هادئة مع ألوان بنفسجية وذهبية.',
        icon: Moon,
        soundUrl: 'https://cdn.pixabay.com/audio/2022/10/18/audio_6a053c7a0d.mp3' // Eastern/Mystical ambient
    },
    eid_fitr: {
        primary: '#00bfa5',
        secondary: '#ff4081',
        accent: '#1de9b6',
        glow: 'rgba(0, 191, 165, 0.3)',
        name: 'عيد الفطر',
        greeting: 'عيد مبارك',
        description: 'ألوان مبهجة واحتفالية تعكس فرحة العيد.',
        icon: Sparkles,
        soundUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3' // Celebration generic
    },
    eid_adha: {
        primary: '#2d5a27',
        secondary: '#f1c40f',
        accent: '#8d6e63',
        glow: 'rgba(45, 90, 39, 0.25)',
        name: 'عيد الأضحى',
        greeting: 'عيد أضحى مبارك',
        description: 'تصميم مستوحى من الطبيعة والألوان الترابية.',
        icon: Heart,
        soundUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3' // Celebration generic
    },
    victory_october: {
        primary: '#d32f2f',
        secondary: '#1976d2',
        accent: '#fbc02d',
        glow: 'rgba(211, 47, 47, 0.3)',
        name: '6 أكتوبر',
        greeting: 'نصر أكتوبر',
        description: 'ألوان وطنية تعبر عن الفخر والانتصار.',
        icon: Flag,
        soundUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_783df50275.mp3' // Epic cinematic
    },
    winter: {
        primary: '#90CAF9',
        secondary: '#1565C0',
        accent: '#E3F2FD',
        glow: 'rgba(144, 202, 249, 0.3)',
        name: 'شتاء',
        description: 'هدوء الشتاء وسحر الثلج — أجواء باردة وجميلة.',
        soundUrl: ''
    },
    summer: {
        primary: '#FF8F00',
        secondary: '#0288D1',
        accent: '#FFCC02',
        glow: 'rgba(255, 143, 0, 0.3)',
        name: 'صيف',
        greeting: 'صيفاً رائعاً!',
        description: 'حرارة الشمس وزرقة البحر — طاقة وانطلاق.',
        soundUrl: ''
    },
    school: {
        primary: '#2A5C82', // Navy/Academic Blue
        secondary: '#E2C044', // Pencil Yellow
        accent: '#58A4B0', // Chalkboard Green/Aqua
        glow: 'rgba(42, 92, 130, 0.3)',
        name: 'المدرسة',
        greeting: 'وقت الدراسة!',
        description: 'أجواء دراسية هادئة تساعد على التركيز والإنجاز.',
        icon: BookOpen,
        soundUrl: '' // Can be a subtle page turn or ambient library sound
    },
    custom: {
        primary: '#333',
        secondary: '#555',
        accent: '#777',
        glow: 'rgba(0,0,0,0.1)',
        name: 'مخصص',
        description: 'قم بتخصيص ألوانك الخاصة وتصميمك المفضل.'
    }
};

// --- GENTLE SPRING CONFIG ---
const GENTLE_SPRING = { type: 'spring', damping: 25, stiffness: 80 };

// --- CUSTOM HOOKS ---
const useDensity = () => {
    const [density, setDensity] = useState<'high' | 'medium' | 'low'>('high');

    useEffect(() => {
        const updateDensity = () => {
            if (window.innerWidth < 768) setDensity('low');
            else if (window.innerWidth < 1200) setDensity('medium');
            else setDensity('high');
        };
        updateDensity();
        window.addEventListener('resize', updateDensity);
        return () => window.removeEventListener('resize', updateDensity);
    }, []);

    return density;
};

// ============================================================
// --- MAIN THEME VISUALS COMPONENT ---
// ============================================================
export const ThemeVisuals: React.FC<ThemeVisualsProps> = ({ theme, isDarkMode, customConfig }) => {
    const density = useDensity();
    
    // Fallback visuals configuration for themes that need it
    const visuals = useMemo(() => {
        switch (density) {
            case 'low':
                return { fanoos: [{ x: 50, size: 60 }], stars: 15, clouds: 2 };
            case 'medium':
                return { fanoos: [{ x: 20, size: 50 }, { x: 80, size: 50 }], stars: 30, clouds: 4 };
            default:
                return { fanoos: [{ x: 10, size: 60 }, { x: 50, size: 80 }, { x: 90, size: 60 }], stars: 50, clouds: 6 };
        }
    }, [density]);

    // Handle audio for themes
    const currentThemeData = THEMES_DATA[theme];
    const [audio] = useState(() => {
        if (typeof window !== 'undefined' && currentThemeData?.soundUrl) {
            const a = new Audio(currentThemeData.soundUrl);
            a.loop = true;
            a.volume = 0; // Start at 0 for fade in
            return a;
        }
        return null;
    });

    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        if (!audio) return;
        
        let fadeInterval: NodeJS.Timeout;
        if (!isMuted) {
            audio.play().catch(e => console.log('Audio autoplay blocked:', e));
            // Fade in
            let vol = 0;
            fadeInterval = setInterval(() => {
                vol += 0.05;
                if (vol >= 0.3) {
                    audio.volume = 0.3;
                    clearInterval(fadeInterval);
                } else {
                    audio.volume = vol;
                }
            }, 50);
        } else {
            // Fade out
            let vol = audio.volume;
            fadeInterval = setInterval(() => {
                vol -= 0.05;
                if (vol <= 0) {
                    audio.pause();
                    audio.volume = 0;
                    clearInterval(fadeInterval);
                } else {
                    audio.volume = vol;
                }
            }, 50);
        }
        
        return () => {
            clearInterval(fadeInterval);
        };
    }, [isMuted, audio]);

    // Cleanup audio on theme change or unmount
    useEffect(() => {
        return () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        };
    }, [audio]);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true" style={{ perspective: 1000 }}>
            {/* Ambient Mute/Unmute UI for themes with sound */}
            {currentThemeData?.soundUrl && (
                <div className="absolute top-4 left-4 z-50 pointer-events-auto">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-2 rounded-full backdrop-blur-md border transition-colors ${isDarkMode ? 'bg-black/30 border-white/10 text-white/70 hover:bg-black/50' : 'bg-white/30 border-black/10 text-black/70 hover:bg-white/50'}`}
                        title={isMuted ? "تشغيل الموسيقى الخلفية" : "إيقاف الموسيقى"}
                    >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {theme === 'standard' && <StandardTheme key="standard" isDarkMode={isDarkMode} />}
                {theme === 'ramadan' && <RamadanTheme key="ramadan" isDarkMode={isDarkMode} density={density} visuals={visuals} />}
                {theme === 'eid_fitr' && <EidFitrTheme key="eid_fitr" isDarkMode={isDarkMode} />}
                {theme === 'eid_adha' && <EidAdhaTheme key="eid_adha" isDarkMode={isDarkMode} />}
                {theme === 'winter' && <WinterTheme key="winter" isDarkMode={isDarkMode} density={density} />}
                {theme === 'summer' && <SummerTheme key="summer" isDarkMode={isDarkMode} />}
                {theme === 'school' && <LanguageTheme key="school" isDarkMode={isDarkMode} />}
                {theme === 'victory_october' && <VictoryOctoberTheme key="victory_october" isDarkMode={isDarkMode} />}
                {theme === 'custom' && (
                    <CustomTheme
                        key="custom"
                        isDarkMode={isDarkMode}
                        config={customConfig ?? { id: 'fallback', name: 'مخصص', primary: '#7c3aed', secondary: '#db2777', accent: '#f59e0b', effect: 'none' }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
