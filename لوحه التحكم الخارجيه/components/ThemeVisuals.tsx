import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

import { AppTheme } from '../types';
import { THEMES_DATA } from './themeData';

const StandardTheme = React.lazy(() => import('./themes/StandardTheme'));
const RamadanTheme = React.lazy(() => import('./themes/RamadanTheme'));
const EidFitrTheme = React.lazy(() => import('./themes/EidFitrTheme'));
const EidAdhaTheme = React.lazy(() => import('./themes/EidAdhaTheme'));
const WinterTheme = React.lazy(() => import('./themes/WinterTheme'));
const SummerTheme = React.lazy(() => import('./themes/SummerTheme'));
const VictoryOctoberTheme = React.lazy(() => import('./themes/VictoryOctoberTheme'));
const LanguageTheme = React.lazy(() => import('./themes/LanguageTheme'));
const CustomTheme = React.lazy(() => import('./themes/CustomTheme'));

interface ThemeVisualsProps {
    theme: AppTheme;
    isDarkMode: boolean;
    animationsEnabled?: boolean;
    customConfig?: any;
}


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
export const ThemeVisuals: React.FC<ThemeVisualsProps> = ({ theme, isDarkMode, animationsEnabled = true, customConfig }) => {
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

            {!animationsEnabled ? (
                <div
                    className="absolute inset-0"
                    style={{
                        background: isDarkMode
                            ? `radial-gradient(circle at 20% 20%, ${currentThemeData.primary}22, transparent 34%), radial-gradient(circle at 82% 18%, ${currentThemeData.secondary}1f, transparent 30%), radial-gradient(circle at 50% 86%, ${currentThemeData.accent}18, transparent 36%)`
                            : `radial-gradient(circle at 18% 18%, ${currentThemeData.primary}14, transparent 32%), radial-gradient(circle at 84% 22%, ${currentThemeData.secondary}16, transparent 30%), radial-gradient(circle at 50% 88%, ${currentThemeData.accent}12, transparent 38%)`,
                    }}
                />
            ) : (
            <React.Suspense fallback={null}>
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
            </React.Suspense>
            )}
        </div>
    );
};
