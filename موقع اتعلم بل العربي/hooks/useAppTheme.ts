import { useEffect, useRef, useState } from 'react';
import { AppTheme, CustomThemeConfig, ThemeSchedule } from '../types';
import { THEMES_DATA } from '../components/themeData';
import { SettingsAPI } from '../services/apiClient';
import { getAutoTheme } from '../utils/themeScheduler';

const DEFAULT_CUSTOM_THEME: CustomThemeConfig = {
    id: 'custom_default',
    name: 'Custom',
    primary: '#7c3aed',
    secondary: '#db2777',
    accent: '#f59e0b',
    effect: 'none'
};

const THEME_SETTINGS_SYNC_INTERVAL = 15 * 1000;
const ADMIN_DARK_MODE_STORAGE_KEY = 'theme_admin_default';
const ANIMATION_STORAGE_KEY = 'animationsEnabled';
const ANIMATION_DEFAULT_MIGRATION_KEY = 'animationsDefaultReducedV2';

const readAnimationsEnabledDefault = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        if (localStorage.getItem(ANIMATION_DEFAULT_MIGRATION_KEY) !== '1') {
            localStorage.setItem(ANIMATION_STORAGE_KEY, 'false');
            localStorage.setItem(ANIMATION_DEFAULT_MIGRATION_KEY, '1');
            return false;
        }
        const stored = localStorage.getItem(ANIMATION_STORAGE_KEY);
        return stored === 'true';
    } catch {
        return false;
    }
};

const isAppTheme = (value: unknown): value is AppTheme =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEMES_DATA, value);

const isCustomThemeConfig = (value: unknown): value is CustomThemeConfig => {
    if (!value || typeof value !== 'object') return false;
    const config = value as Partial<CustomThemeConfig>;
    return (
        typeof config.id === 'string' &&
        typeof config.name === 'string' &&
        typeof config.primary === 'string' &&
        typeof config.secondary === 'string' &&
        typeof config.accent === 'string'
    );
};

const readJson = <T,>(key: string, fallback: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) as T : fallback;
    } catch {
        return fallback;
    }
};

const readAdminDarkModeDefault = (): boolean | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(ADMIN_DARK_MODE_STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return null;
};

const normalizeThemeSettings = (raw: any) => {
    const settings = raw?.settings ?? raw;
    return {
        selectedTheme: isAppTheme(settings?.selectedTheme) ? settings.selectedTheme : null,
        isAutoTheme: Boolean(settings?.isAutoTheme),
        isDarkMode: typeof settings?.isDarkMode === 'boolean' ? settings.isDarkMode as boolean : null,
        themeSchedules: Array.isArray(settings?.themeSchedules) ? settings.themeSchedules as ThemeSchedule[] : null,
        customThemeConfig: isCustomThemeConfig(settings?.customThemeConfig) ? settings.customThemeConfig : null,
    };
};

export function useAppTheme() {
    const userDarkModeOverrideRef = useRef(false);
    const [darkMode, setDarkModeState] = useState(() => {
        if (typeof window !== 'undefined') {
            const adminDefault = readAdminDarkModeDefault();
            return adminDefault ?? window.matchMedia('(prefers-color-scheme: dark)').matches;
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
        return readAnimationsEnabledDefault();
    });

    const [selectedTheme, setSelectedTheme] = useState<AppTheme>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('app_theme');
            return isAppTheme(stored) ? stored : 'standard';
        }
        return 'standard';
    });

    const [themeSchedules, setThemeSchedules] = useState<ThemeSchedule[]>(() => {
        if (typeof window !== 'undefined') {
            return readJson<ThemeSchedule[]>('theme_schedules', []);
        }
        return [];
    });

    const [customThemeConfig, setCustomThemeConfig] = useState<CustomThemeConfig>(() => {
        if (typeof window !== 'undefined') {
            return readJson<CustomThemeConfig>('custom_theme_config', DEFAULT_CUSTOM_THEME);
        }
        return DEFAULT_CUSTOM_THEME;
    });

    const setDarkMode = (next: boolean | ((current: boolean) => boolean)) => {
        userDarkModeOverrideRef.current = true;
        setDarkModeState(next);
    };

    const applyAdminDarkModeDefault = (next: boolean) => {
        localStorage.setItem(ADMIN_DARK_MODE_STORAGE_KEY, next ? 'dark' : 'light');
        if (!userDarkModeOverrideRef.current) {
            setDarkModeState(next);
        }
    };

    const toggleTheme = () => setDarkMode(current => !current);

    useEffect(() => {
        let cancelled = false;
        let isLoading = false;

        const loadThemeSettings = async () => {
            if (isLoading) return;
            isLoading = true;

            try {
                const response = await SettingsAPI.getThemeSettings();
                if (cancelled) return;

                const settings = normalizeThemeSettings(response);
                if (settings.customThemeConfig) {
                    setCustomThemeConfig(settings.customThemeConfig);
                }
                if (settings.themeSchedules) {
                    setThemeSchedules(settings.themeSchedules);
                }
                if (settings.selectedTheme) {
                    setSelectedTheme(settings.isAutoTheme ? getAutoTheme() : settings.selectedTheme);
                }
                if (settings.isDarkMode !== null) {
                    applyAdminDarkModeDefault(settings.isDarkMode);
                }
            } catch {
                // Keep local theme data if the backend is temporarily unavailable.
            } finally {
                isLoading = false;
            }
        };

        const loadVisibleThemeSettings = () => {
            if (document.visibilityState === 'visible') {
                void loadThemeSettings();
            }
        };

        void loadThemeSettings();
        const interval = window.setInterval(loadVisibleThemeSettings, THEME_SETTINGS_SYNC_INTERVAL);
        window.addEventListener('focus', loadVisibleThemeSettings);
        document.addEventListener('visibilitychange', loadVisibleThemeSettings);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
            window.removeEventListener('focus', loadVisibleThemeSettings);
            document.removeEventListener('visibilitychange', loadVisibleThemeSettings);
        };
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        const themeKey = isAppTheme(selectedTheme) ? selectedTheme : 'standard';
        const themeData = THEMES_DATA[themeKey];

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

        if (themeKey !== selectedTheme) {
            setSelectedTheme(themeKey);
        }

        localStorage.setItem('app_theme', themeKey);
        if (primaryColor !== 'default') localStorage.setItem('primaryColor', primaryColor);

        Object.keys(THEMES_DATA).forEach(t => document.body.classList.remove(`theme-${t}`));
        document.body.classList.add(`theme-${themeKey}`);
    }, [selectedTheme, primaryColor]);

    useEffect(() => {
        localStorage.setItem('theme_schedules', JSON.stringify(themeSchedules));
    }, [themeSchedules]);

    useEffect(() => {
        localStorage.setItem('custom_theme_config', JSON.stringify(customThemeConfig));
    }, [customThemeConfig]);

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

    useEffect(() => {
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        document.documentElement.style.setProperty('--app-font-size', sizes[fontSize]);
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    useEffect(() => {
        if (animationsEnabled) {
            document.documentElement.classList.remove('animations-disabled');
        } else {
            document.documentElement.classList.add('animations-disabled');
        }
        localStorage.setItem(ANIMATION_STORAGE_KEY, animationsEnabled.toString());
    }, [animationsEnabled]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'app_theme' && e.newValue && isAppTheme(e.newValue)) {
                setSelectedTheme(e.newValue);
            }
            if (e.key === 'theme' && e.newValue) {
                userDarkModeOverrideRef.current = true;
                setDarkMode(e.newValue === 'dark');
            }
            if (e.key === ADMIN_DARK_MODE_STORAGE_KEY && e.newValue && !userDarkModeOverrideRef.current) {
                setDarkModeState(e.newValue === 'dark');
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
            if (e.key === 'custom_theme_config' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (isCustomThemeConfig(parsed)) setCustomThemeConfig(parsed);
                } catch { }
            }
            if (e.key === 'theme_schedules' && e.newValue) {
                try { setThemeSchedules(JSON.parse(e.newValue)); } catch { }
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
