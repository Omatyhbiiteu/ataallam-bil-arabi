import React from 'react';
import { Target, CheckCircle, Trophy, Coins } from 'lucide-react';
import { DailyGoal } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyGoalsPanelProps {
    goals: DailyGoal[];
    onClaimReward?: (goalId: string) => void;
}

export const DailyGoalsPanel: React.FC<DailyGoalsPanelProps> = ({ goals, onClaimReward }) => {
    const completedCount = goals.filter(g => g.completed).length;
    const totalGoals = goals.length;
    const overallProgress = (completedCount / totalGoals) * 100;

    return (
        <div className="bg-white dark:bg-dark-card rounded-3xl border border-stone-200 dark:border-gray-700 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                            <Target size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">أهدافك اليومية</h3>
                            <p className="text-sm opacity-90">أكمل الأهداف واحصل على مكافآت</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black">{completedCount}/{totalGoals}</div>
                        <div className="text-xs opacity-80">مكتمل</div>
                    </div>
                </div>

                {/* Overall Progress */}
                <div className="relative h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    />
                </div>
            </div>

            {/* Goals List */}
            <div className="p-6 space-y-4">
                <AnimatePresence>
                    {goals.map((goal, index) => {
                        const progress = Math.min((goal.progress / goal.target) * 100, 100);
                        const isCompleted = goal.completed;

                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative p-5 rounded-2xl border-2 transition-all ${isCompleted
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                {/* Goal Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className={`text-lg font-black mb-1 ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                            {goal.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                                    </div>
                                    {isCompleted && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white"
                                        >
                                            <CheckCircle size={20} />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="font-bold text-gray-600 dark:text-gray-400">التقدم</span>
                                        <span className="font-black text-gray-900 dark:text-white">
                                            {goal.progress} / {goal.target}
                                        </span>
                                    </div>
                                    <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className={`absolute top-0 left-0 h-full rounded-full ${isCompleted
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Rewards */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                        <Trophy size={16} />
                                        <span className="text-sm font-bold">+{goal.reward.xp} XP</span>
                                    </div>
                                    {goal.reward.coins && (
                                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                            <Coins size={16} />
                                            <span className="text-sm font-bold">+{goal.reward.coins} 💰</span>
                                        </div>
                                    )}
                                    {isCompleted && onClaimReward && (
                                        <button
                                            onClick={() => onClaimReward(goal.id)}
                                            className="mr-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                                        >
                                            استلم المكافأة
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* All Completed Message */}
                {completedCount === totalGoals && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 text-center"
                    >
                        <div className="text-4xl mb-3">🎉</div>
                        <h4 className="text-xl font-black text-amber-700 dark:text-amber-400 mb-2">
                            أحسنت! أكملت كل الأهداف اليومية!
                        </h4>
                        <p className="text-sm text-amber-600 dark:text-amber-500">عد غداً لأهداف جديدة ومكافآت أكبر</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
