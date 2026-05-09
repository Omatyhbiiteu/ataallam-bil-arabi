import { useState, useEffect } from 'react';
import { AppTheme, ThemeSchedule, CustomThemeConfig } from '../types';
import { THEMES_DATA } from '../components/ThemeVisuals';

export function useAppTheme() {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            return stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    const [primaryColor, setPrimaryColor] = useState<'default' | 'amber' | 'blue' | 'purple' | 'green'>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('primaryColor');
            return (stored as any) || 'default';
        }
        return 'default';
    });

    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('fontSize');
            return (stored as any) || 'small';
        }
        return 'small';
    });

    const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('animationsEnabled');
            return stored !== null ? stored === 'true' : true;
        }
        return true;
    });

    const [selectedTheme, setSelectedTheme] = useState<AppTheme>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('app_theme');
            return (stored as AppTheme) || 'standard';
        }
        return 'standard';
    });

    const [themeSchedules, setThemeSchedules] = useState<ThemeSchedule[]>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme_schedules');
            return stored ? JSON.parse(stored) : [];
        }
        return [];
    });

    const [customThemeConfig, setCustomThemeConfig] = useState<CustomThemeConfig>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('custom_theme_config');
            return stored ? JSON.parse(stored) : {
                id: 'custom_default',
                name: 'مخصص',
                primary: '#7c3aed',
                secondary: '#db2777',
                accent: '#f59e0b',
                effect: 'none'
            };
        }
        return { id: 'default', name: 'Custom', primary: '#7c3aed', secondary: '#db2777', accent: '#f59e0b', effect: 'none' };
    });

    // Toggle Theme Handler
    const toggleTheme = () => setDarkMode(!darkMode);

    // Effect: Dark Mode Class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // Effect: Theme Application (CSS Variables)
    useEffect(() => {
        const themeData = THEMES_DATA[selectedTheme];

        const COLOR_PALETTE = {
            default: themeData.primary,
            amber: '#f59e0b',
            blue: '#3b82f6',
            purple: '#9333ea',
            green: '#10b981'
        };

        const activePrimary = primaryColor === 'default' ? themeData.primary : COLOR_PALETTE[primaryColor];

        document.documentElement.style.setProperty('--primary-color', activePrimary);
        document.documentElement.style.setProperty('--secondary-color', themeData.secondary);
        document.documentElement.style.setProperty('--accent-color', themeData.accent);

        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
        };

        document.documentElement.style.setProperty('--primary-rgb', hexToRgb(activePrimary));

        localStorage.setItem('app_theme', selectedTheme);
        if (primaryColor !== 'default') localStorage.setItem('primaryColor', primaryColor);

        Object.keys(THEMES_DATA).forEach(t => document.body.classList.remove(`theme-${t}`));
        document.body.classList.add(`theme-${selectedTheme}`);

    }, [selectedTheme, primaryColor]);

    // Effect: Save Schedules
    useEffect(() => {
        localStorage.setItem('theme_schedules', JSON.stringify(themeSchedules));
    }, [themeSchedules]);

    // Effect: Save Custom Config
    useEffect(() => {
        localStorage.setItem('custom_theme_config', JSON.stringify(customThemeConfig));
    }, [customThemeConfig]);

    // Effect: Check Schedule
    useEffect(() => {
        const checkSchedule = () => {
            const today = new Date().toISOString().split('T')[0];
            const activeSchedule = themeSchedules.find(s => s.isActive && today >= s.startDate && today <= s.endDate);
            if (activeSchedule && activeSchedule.theme !== selectedTheme) {
                setSelectedTheme(activeSchedule.theme);
            }
        };
        checkSchedule();
        const interval = setInterval(checkSchedule, 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, [themeSchedules, selectedTheme]);

    // Effect: Font Size
    useEffect(() => {
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        document.documentElement.style.setProperty('--app-font-size', sizes[fontSize]);
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    // Effect: Animations
    useEffect(() => {
        if (animationsEnabled) {
            document.documentElement.classList.remove('animations-disabled');
        } else {
            document.documentElement.classList.add('animations-disabled');
        }
        localStorage.setItem('animationsEnabled', animationsEnabled.toString());
    }, [animationsEnabled]);

    // Effect: Sync across tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'app_theme' && e.newValue) {
                setSelectedTheme(e.newValue as AppTheme);
            }
            if (e.key === 'theme' && e.newValue) {
                setDarkMode(e.newValue === 'dark');
            }
            if (e.key === 'primaryColor' && e.newValue) {
                setPrimaryColor(e.newValue as 'default' | 'amber' | 'blue' | 'purple' | 'green');
            }
            if (e.key === 'fontSize' && e.newValue) {
                setFontSize(e.newValue as 'small' | 'medium' | 'large');
            }
            if (e.key === 'animationsEnabled' && e.newValue !== null) {
                setAnimationsEnabled(e.newValue === 'true');
            }
            // 🔄 Sync custom theme config from Admin Panel
            if (e.key === 'custom_theme_config' && e.newValue) {
                try { setCustomThemeConfig(JSON.parse(e.newValue)); } catch {}
            }
            // 🔄 Sync theme schedules from Admin Panel
            if (e.key === 'theme_schedules' && e.newValue) {
                try { setThemeSchedules(JSON.parse(e.newValue)); } catch {}
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return {
        darkMode, setDarkMode, toggleTheme,
        primaryColor, setPrimaryColor,
        fontSize, setFontSize,
        animationsEnabled, setAnimationsEnabled,
        selectedTheme, setSelectedTheme,
        themeSchedules, setThemeSchedules,
        customThemeConfig, setCustomThemeConfig
    };
}
