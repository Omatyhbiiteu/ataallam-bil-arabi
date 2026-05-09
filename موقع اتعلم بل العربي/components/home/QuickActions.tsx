import React from 'react';
import { Zap, Play, Layers, BookOpen, Map, Book, MessageCircle } from 'lucide-react';
import { AppTheme } from '../../types';
import { motion } from 'framer-motion';

interface QuickActionsProps {
    t: any;
    selectedTheme: AppTheme;
    themeData: any;
    onStartSession: () => void;
    setActiveTab: (tab: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    t,
    onStartSession,
    setActiveTab
}) => {
    const quickActions = [
        {
            icon: Play,
            label: t.home?.startReview || 'ابدأ المراجعة',
            gradient: 'from-amber-500 to-orange-600',
            glow: 'rgba(245,158,11,0.35)',
            iconColor: '#fde68a',
            action: onStartSession
        },
        {
            icon: Layers,
            label: t.home?.browseCards || 'تصفح البطاقات',
            gradient: 'from-blue-500 to-blue-700',
            glow: 'rgba(59,130,246,0.35)',
            iconColor: '#bfdbfe',
            action: () => setActiveTab('cards')
        },
        {
            icon: BookOpen,
            label: t.home?.readStory || 'قراءة قصة',
            gradient: 'from-purple-500 to-purple-700',
            glow: 'rgba(168,85,247,0.35)',
            iconColor: '#e9d5ff',
            action: () => setActiveTab('stories')
        },
        {
            icon: Map,
            label: t.home?.learningPath || 'مسار التعلم',
            gradient: 'from-emerald-500 to-green-700',
            glow: 'rgba(16,185,129,0.35)',
            iconColor: '#a7f3d0',
            action: () => setActiveTab('learning_path')
        },
        {
            icon: Book,
            label: t.sidebar?.dictionary || 'القاموس',
            gradient: 'from-pink-500 to-rose-600',
            glow: 'rgba(236,72,153,0.35)',
            iconColor: '#fbcfe8',
            action: () => setActiveTab('dictionary')
        },
        {
            icon: MessageCircle,
            label: t.sidebar?.aiAssistant || 'المساعد الذكي',
            gradient: 'from-indigo-500 to-violet-700',
            glow: 'rgba(99,102,241,0.35)',
            iconColor: '#c7d2fe',
            action: () => setActiveTab('ai_assistant')
        },
    ];

    return (
        <div className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl shadow-lg border border-stone-200 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Zap className="text-amber-500" size={20} />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                    {t.home?.quickActions || 'اختصارات سريعة'}
                </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {quickActions.map((action, idx) => {
                    const Icon = action.icon;
                    return (
                        <motion.button
                            key={idx}
                            whileHover={{ scale: 1.04, y: -3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={action.action}
                            className={`relative p-5 rounded-2xl bg-gradient-to-br ${action.gradient} text-white flex flex-col items-center gap-3 overflow-hidden group`}
                            style={{ boxShadow: `0 8px 24px -6px ${action.glow}` }}
                        >
                            {/* Shine overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10" />

                            <div className="relative z-10 w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <Icon size={22} style={{ color: action.iconColor }} />
                            </div>
                            <span className="relative z-10 font-bold text-sm text-center leading-tight">
                                {action.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
