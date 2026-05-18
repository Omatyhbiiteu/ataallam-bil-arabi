import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    Play, BookOpen, Music, Image as ImageIcon, CheckCircle, ChevronRight, ArrowRight, Star,
    Plane, Coffee, ShoppingBag, Heart, Home, Briefcase, Car, Utensils, Stethoscope, Landmark,
    Camera, Monitor, Smartphone, MessageCircle, Map as MapIcon, Calendar, Clock, Sun, Moon, Cloud,
    Thermometer, Shield, Gift
} from 'lucide-react';
import { LevelSelector } from '../learning-path/LevelSelector';
import { SentenceTopicDetail } from './SentenceTopicDetail.tsx';

import { SentenceTopic } from '../../types';

interface SentencesViewProps {
    topics?: SentenceTopic[];
    learningLang?: 'en' | 'de';
}

export const SentencesView: React.FC<SentencesViewProps> = ({ topics = [], learningLang = 'en' }) => {
    const [selectedLevel, setSelectedLevel] = useState<string>('A1');
    const [selectedSubLevel, setSelectedSubLevel] = useState<string>('A1.1');
    const [activeTopic, setActiveTopic] = useState<SentenceTopic | null>(null);

    const filteredTopics = useMemo(
        () =>
            topics.filter(t =>
                t.level === selectedLevel &&
                t.subLevel === selectedSubLevel &&
                (t.sentenceLang === 'both' || (t.sentenceLang ?? learningLang) === learningLang)
            ),
        [topics, selectedLevel, selectedSubLevel, learningLang]
    );

    const animationKey = `${learningLang}-${selectedLevel}-${selectedSubLevel}`;

    const gridVariants: Variants = {
        hidden: { opacity: 1 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.055,
                delayChildren: 0.08,
            },
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.16, ease: 'easeOut' as const },
        },
    };

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 18, scale: 0.985 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 150,
                damping: 22,
                mass: 0.8,
            },
        },
    };

    const iconsMap: Record<string, React.FC<any>> = {
        BookOpen, Plane, Coffee, ShoppingBag, Heart, Home, Briefcase, Car, Music, Utensils,
        Stethoscope, Landmark, Camera, Monitor, Smartphone, MessageCircle, Map: MapIcon,
        Calendar, Clock, Sun, Moon, Cloud, Thermometer, Shield, Gift
    };

    if (activeTopic) {
        return <SentenceTopicDetail topic={activeTopic} learningLang={learningLang} onBack={() => setActiveTopic(null)} />;
    }

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            المواقف الحياتية
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            تعلم الجمل والتعبيرات الأساسية للتواصل اليومي.
                        </p>
                    </div>
                </div>

                {/* Level Selector */}
                <LevelSelector
                    selectedLevel={selectedLevel}
                    selectedSubLevel={selectedSubLevel}
                    onSelectLevel={setSelectedLevel}
                    onSelectSubLevel={setSelectedSubLevel}
                />

                {/* Topics Grid */}
                <AnimatePresence mode="wait">
                    {filteredTopics.length > 0 ? (
                        <motion.div
                            key={animationKey}
                            variants={gridVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredTopics.map((topic) => (
                                <motion.div
                                    key={topic.id}
                                    variants={cardVariants}
                                    whileHover={{ y: -6, transition: { duration: 0.18, ease: 'easeOut' } }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setActiveTopic(topic)}
                                    className="group cursor-pointer relative h-full min-h-[354px] bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300 will-change-transform"
                                >
                                    {/* Image / Banner */}
                                    <div className={`h-40 w-full bg-gradient-to-r ${topic.image} flex items-center justify-center relative overflow-hidden`}>
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />

                                        {/* Icon */}
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                            {(() => {
                                                const IconComponent = topic.icon ? (iconsMap[topic.icon] || BookOpen) : BookOpen;
                                                return <IconComponent size={32} />;
                                            })()}
                                        </div>

                                        {/* Progress Badge */}
                                        {topic.progress > 0 && (
                                            <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 text-white text-xs font-bold border border-white/20">
                                                {topic.progress === 100 ? (
                                                    <>
                                                        <CheckCircle size={14} className="text-green-400" />
                                                        <span>مكتمل</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                                        <span>{topic.progress}%</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex min-h-[214px] flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {topic.title}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                                            {topic.description}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                {topic.level} • {topic.subLevel}
                                            </span>
                                            <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                <ArrowRight size={20} className="transform group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar Bottom */}
                                    {topic.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 dark:bg-gray-700">
                                            <div
                                                className={`h-full bg-gradient-to-r ${topic.image.replace('from-', 'from-').replace('to-', 'to-')}`}
                                                style={{ width: `${topic.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`empty-${animationKey}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="text-center py-20"
                        >
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto flex items-center justify-center mb-6 text-gray-400">
                                <BookOpen size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">قريباً...</h3>
                            <p className="text-gray-500">لا توجد مواضيع متاحة لهذا المستوى بعد.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
