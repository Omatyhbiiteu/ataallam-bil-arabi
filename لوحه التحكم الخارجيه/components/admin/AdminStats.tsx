
import React from 'react';
import { BookOpen, Map, Layers, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Story, Module, Card } from '../../types';

interface AdminStatsProps {
    stories: Story[];
    curriculum: Module[];
    cards: Card[];
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stories, curriculum, cards }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                { label: 'إجمالي القصص', value: stories.length, icon: BookOpen, color: 'bg-blue-500' },
                { label: 'الوحدات التعليمية', value: curriculum.length, icon: Map, color: 'bg-purple-500' },
                { label: 'البطاقات التعليمية', value: cards.length, icon: Layers, color: 'bg-amber-500' },
                { label: 'الدروس المفعلة', value: curriculum.reduce((acc, m) => acc + m.lessons.length, 0), icon: Activity, color: 'bg-green-500' },
            ].map((stat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`${stat.color}/20 p-3 rounded-2xl text-white`}>
                            <stat.icon size={24} className="text-white opacity-90" />
                        </div>
                        <div className="bg-white/5 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-400 group-hover:bg-white/10 transition-colors">REAL-TIME</div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest">{stat.label}</h3>
                        <p className="text-3xl font-black text-white">{stat.value}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
