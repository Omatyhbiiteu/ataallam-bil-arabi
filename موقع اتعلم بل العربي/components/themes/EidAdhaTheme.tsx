import React from 'react';

type ThemeLanguage = 'ar' | 'en' | 'de';

const eidAdhaGreetings: Record<ThemeLanguage, { title: string; dir: 'rtl' | 'ltr'; lang: string }> = {
    ar: { title: 'عيد أضحى مبارك', dir: 'rtl', lang: 'ar' },
    en: { title: 'Eid al-Adha Mubarak', dir: 'ltr', lang: 'en' },
    de: { title: 'Frohes Opferfest', dir: 'ltr', lang: 'de' },
};

const Crescent: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <svg
        viewBox="0 0 120 120"
        className="absolute right-[10%] top-[10%] h-20 w-20 opacity-80 md:h-28 md:w-28"
        aria-hidden="true"
    >
        <path
            d="M71 13 C42 18 20 43 20 73 C20 98 40 112 64 112 C48 101 40 85 40 67 C40 41 56 22 82 15 C78 13 74 12 71 13 Z"
            fill={isDarkMode ? '#f7dfa3' : '#d6a84c'}
        />
    </svg>
);

const SimpleHorizon: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <svg
        viewBox="0 0 1200 360"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[45vh] min-h-[260px] w-full"
        aria-hidden="true"
    >
        <path
            d="M0 204 C160 148 306 188 452 132 C612 70 728 178 882 124 C1010 80 1116 122 1200 86 L1200 360 L0 360 Z"
            fill={isDarkMode ? '#142b29' : '#e8d2a4'}
            opacity="0.9"
        />
        <path
            d="M0 250 C148 204 310 230 452 198 C638 156 764 238 930 198 C1046 170 1136 190 1200 158 L1200 360 L0 360 Z"
            fill={isDarkMode ? '#0d201d' : '#d9b878'}
        />
        <path
            d="M0 300 C170 270 310 304 474 276 C646 246 780 304 944 274 C1060 254 1150 268 1200 246 L1200 360 L0 360 Z"
            fill={isDarkMode ? '#081411' : '#b98a4c'}
        />
        <g transform="translate(520 196)">
            <rect
                x="0"
                y="16"
                width="132"
                height="118"
                rx="4"
                fill={isDarkMode ? '#050706' : '#1e1b18'}
                opacity="0.95"
            />
            <rect x="0" y="34" width="132" height="12" fill={isDarkMode ? '#c8a450' : '#d6b25d'} />
            <rect x="52" y="88" width="28" height="46" rx="2" fill={isDarkMode ? '#b99648' : '#c9a14f'} />
        </g>
    </svg>
);

const EidAdhaTheme: React.FC<{ isDarkMode: boolean; targetLanguage?: ThemeLanguage }> = ({
    isDarkMode,
    targetLanguage = 'ar',
}) => {
    const greeting = eidAdhaGreetings[targetLanguage] ?? eidAdhaGreetings.ar;

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{
                background: isDarkMode
                    ? 'linear-gradient(180deg, #10201f 0%, #172b27 45%, #2d2418 100%)'
                    : 'linear-gradient(180deg, #d9efe8 0%, #f6ead0 55%, #d7ac6a 100%)',
            }}
        >
            <div
                className="absolute inset-x-0 top-0 h-1/2"
                style={{
                    background: isDarkMode
                        ? 'radial-gradient(circle at 50% 22%, rgba(247,223,163,0.16), transparent 52%)'
                        : 'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.72), transparent 55%)',
                }}
            />

            <Crescent isDarkMode={isDarkMode} />
            <SimpleHorizon isDarkMode={isDarkMode} />

            <div
                className="absolute left-1/2 top-[26%] z-10 -translate-x-1/2 text-center"
                dir={greeting.dir}
                lang={greeting.lang}
            >
                <div
                    className="whitespace-nowrap rounded-2xl border px-8 py-5 text-4xl font-black shadow-lg backdrop-blur-md md:px-12 md:py-6 md:text-6xl"
                    style={{
                        color: isDarkMode ? '#f8e6b7' : '#5b3518',
                        borderColor: isDarkMode ? 'rgba(248,230,183,0.18)' : 'rgba(255,255,255,0.62)',
                        background: isDarkMode ? 'rgba(8,20,18,0.42)' : 'rgba(255,255,255,0.52)',
                        textShadow: isDarkMode ? '0 2px 14px rgba(0,0,0,0.45)' : '0 1px 0 rgba(255,255,255,0.75)',
                    }}
                >
                    {greeting.title}
                </div>
            </div>
        </div>
    );
};

export default EidAdhaTheme;
