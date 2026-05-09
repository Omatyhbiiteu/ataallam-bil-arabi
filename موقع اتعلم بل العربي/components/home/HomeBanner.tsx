import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Home, Clock, Flame, Crown } from 'lucide-react';

interface HomeBannerProps {
    isHoliday: boolean;
    themeData: any;
    darkMode: boolean;
    userImage: string | null;
    userName: string;
    greeting: string;
    randomQuote: string;
    hijriDate: string;
    gregorianDate: string;
    dailyWisdomLabel: string;
}

export const HomeBanner: React.FC<HomeBannerProps> = ({
    isHoliday,
    themeData,
    darkMode,
    userImage,
    userName,
    isProSubscriber = false,
    greeting,
    randomQuote,
    hijriDate,
    gregorianDate,
    dailyWisdomLabel
}) => {
    if (isHoliday) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="relative w-full rounded-[3rem] overflow-hidden min-h-[300px] flex items-center shadow-2xl group"
            >
                {/* Background Layer */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1542259681-d2b3b7bb5d78?q=80&w=2600&auto=format&fit=crop"
                        className={`w-full h-full object-cover mix-blend-overlay scale-105 group-hover:scale-100 transition-all duration-[20s] ${darkMode ? 'opacity-20' : 'opacity-30'}`}
                        alt="Atmosphere"
                    />
                    <div
                        className="absolute inset-0 transition-all duration-1000"
                        style={{
                            opacity: 0.9,
                            background: darkMode
                                ? `linear-gradient(to right, ${themeData.primary}, ${themeData.secondary})`
                                : `linear-gradient(to right, ${themeData.secondary}, #f59e0b)`
                        }}
                    />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply"></div>
                </div>

                {/* Content Layer */}
                <div className="relative z-10 w-full p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 text-white">
                    <div className="flex flex-col items-center md:items-start text-center md:text-right space-y-6 max-w-2xl">
                        <div className={`inline-flex items-center gap-3 backdrop-blur-md px-4 py-2 rounded-full border shadow-lg transition-colors ${darkMode ? 'bg-white/10 border-white/20' : 'bg-white/20 border-white/40'}`}>
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50">
                                {userImage ? <img src={userImage} className="w-full h-full object-cover" alt="User" /> : <Home size={16} />}
                            </div>
                            <span className="font-bold text-sm tracking-wide text-white inline-flex items-center gap-2 flex-wrap justify-center">
                                أهلاً بك، {userName}
                                {isProSubscriber && (
                                    <span
                                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 shadow-md border border-amber-100/60"
                                        title="مشترك برو"
                                    >
                                        <Crown size={11} className="shrink-0" strokeWidth={2.5} />
                                        برو
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl md:text-7xl font-black tracking-tight drop-shadow-xl"
                            >
                                {themeData.greeting}
                            </motion.h1>
                            <p className="text-lg md:text-xl text-white/90 font-medium">{randomQuote}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                            <div className={`px-5 py-2.5 rounded-2xl backdrop-blur-md border flex items-center gap-3 transition-colors ${darkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/80 border-white/50 shadow-sm text-orange-900'}`}>
                                {darkMode ? (
                                    <Moon className="text-amber-300" size={20} />
                                ) : (
                                    <Sun className="text-orange-600 animate-[spin_10s_linear_infinite]" size={20} />
                                )}
                                <span className="font-bold text-lg font-serif tracking-wide">{hijriDate}</span>
                            </div>
                            <div className={`px-4 py-2.5 rounded-2xl backdrop-blur-sm border transition-colors ${darkMode ? 'bg-white/10 border-white/10 text-white/95' : 'bg-white/40 border-white/30 text-white'}`}>
                                <span className="font-medium text-sm">{gregorianDate}</span>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 1.5 }}
                        className="hidden md:flex relative group-hover:scale-105 transition-transform duration-700"
                    >
                        <div className="absolute inset-0 bg-white/30 blur-[60px] rounded-full" />
                        <div className="relative w-48 h-48 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/30 shadow-2xl flex items-center justify-center">
                            {themeData.icon && React.createElement(themeData.icon, { size: 90, className: "text-white drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)]" })}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group transition-all duration-1000 ${darkMode
                ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900'
                : 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500'
                }`}
        >
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/15 transition-colors duration-700"></div>
            <div className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t ${darkMode ? 'from-black/50' : 'from-black/20'} to-transparent`} />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/20 shadow-xl overflow-hidden">
                            {userImage ? (
                                <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                                <Home size={40} className="text-white" />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-4 border-white/20 flex items-center justify-center" style={{ backgroundColor: darkMode ? '#4ade80' : '#fbbf24' }}>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>

                    <div className="text-center md:text-right">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2 opacity-95">
                            {darkMode ? (
                                <Moon size={28} className="text-blue-200 fill-blue-200/20" />
                            ) : (
                                <Sun size={28} className="text-yellow-100 fill-yellow-100/40 animate-rotate-slow" />
                            )}
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting}</h2>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 flex-wrap">
                            <p className="text-3xl md:text-4xl font-black tracking-tight">{userName}</p>
                            {isProSubscriber && (
                                <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 shadow-lg border border-amber-200/70 ring-1 ring-amber-400/30"
                                    title="مشترك برو"
                                >
                                    <Crown size={15} className="shrink-0" strokeWidth={2.5} />
                                    برو
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mt-3 text-white/90">
                            <Clock size={16} />
                            <span className="font-medium text-lg font-serif">{hijriDate}</span>
                            <span className="w-1 h-1 bg-white/60 rounded-full" />
                            <span className="text-sm opacity-90">{gregorianDate}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 max-w-md w-full text-center md:text-right shadow-lg transform group-hover:-translate-y-1 transition-transform duration-500">
                    <div className="flex justify-between items-start mb-4">
                        <Flame className="text-amber-300" size={32} />
                            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">{dailyWisdomLabel}</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold leading-relaxed">"{randomQuote}"</p>
                </div>
            </div>
        </motion.div>
    );
};
