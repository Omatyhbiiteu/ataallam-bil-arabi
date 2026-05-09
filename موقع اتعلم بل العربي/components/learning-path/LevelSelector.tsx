import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelSelectorProps {
    selectedLevel: string;
    selectedSubLevel: string;
    onSelectLevel: (level: string) => void;
    onSelectSubLevel: (subLevel: string) => void;
    variant?: 'default' | 'stories';
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LevelSelector: React.FC<LevelSelectorProps> = ({
    selectedLevel,
    selectedSubLevel,
    onSelectLevel,
    onSelectSubLevel,
    variant = 'default'
}) => {
    // Generate sub-levels dynamically
    const subLevels = [`${selectedLevel}.1`, `${selectedLevel}.2`];

    // Theme Configuration
    const theme = variant === 'stories'
        ? {
            activeBg: "bg-gradient-to-r from-red-500 to-rose-600",
            shadow: "shadow-red-500/30",
            subLevelActive: "bg-red-600 border-red-600 text-white dark:bg-red-500 dark:border-red-500",
            icon: true
        }
        : {
            activeBg: "bg-gradient-to-r from-amber-500 to-amber-600",
            shadow: "shadow-amber-500/20",
            subLevelActive: "bg-slate-800 border-slate-800 text-white dark:bg-white dark:border-white dark:text-slate-900",
            icon: false
        };

    return (
        <div className="w-full max-w-4xl mx-auto mb-8 space-y-6" dir="ltr">
            {/* Main Levels Row */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-1.5 md:p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar relative">
                {LEVELS.map((level) => (
                    <button
                        key={level}
                        onClick={() => {
                            onSelectLevel(level);
                            // Default to first sub-level when main level changes
                            onSelectSubLevel(`${level}.1`);
                        }}
                        className={`relative px-3 py-2 md:px-8 md:py-4 rounded-xl text-sm md:text-lg font-bold transition-all duration-300 min-w-fit flex-1
                            ${selectedLevel === level
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }
                        `}
                    >
                        {selectedLevel === level && (
                            <motion.div
                                layoutId="activeLevelBackground"
                                className={`absolute inset-0 rounded-xl shadow-lg ${theme.activeBg} ${theme.shadow}`}
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{level}</span>
                    </button>
                ))}
            </div>

            {/* فرعيات المستوى — مسار التعلم فقط؛ القصص تُصفّى بالمستوى الرئيسي حتى تظهر كل القصص المناسبة */}
            {variant !== 'stories' && (
                <div className="flex justify-center gap-4">
                    <AnimatePresence mode="wait">
                        {subLevels.map((sub) => (
                            <motion.button
                                key={sub}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onClick={() => onSelectSubLevel(sub)}
                                className={`px-6 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-300
                                    ${selectedSubLevel === sub
                                        ? `${theme.subLevelActive} shadow-md transform scale-105`
                                        : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300'
                                    }
                                `}
                            >
                                {sub}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
