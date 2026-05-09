import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bell, Map, Layers, BookOpen, Book, MessageCircle, Users, Settings, ChevronRight, ChevronLeft, X, Check, Sparkles } from 'lucide-react';

interface InteractiveTourProps {
    onComplete: () => void;
    targetLanguage: 'en' | 'de';
}

interface TourStep {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    relationship: string;
    targetElement?: string; // CSS selector for spotlight
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ onComplete, targetLanguage }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const tourSteps: TourStep[] = [
        {
            id: 'home',
            icon: Home,
            title: 'الرئيسية - نقطة الانطلاق',
            description: `لوحة التحكم الشاملة التي تعرض لك كل ما تحتاجه في مكان واحد. ستجد هنا إحصائياتك، البطاقات المستحقة للمراجعة، واقتراحات ذكية لبدء يومك.`,
            relationship: 'تعرض ملخصاً من جميع الأقسام الأخرى في مكان واحد',
            targetElement: '[data-tour="home"]'
        },
        {
            id: 'notifications',
            icon: Bell,
            title: 'الإشعارات - متابعة تقدمك',
            description: `لن تفوتك أي فرصة للتعلم! تتلقى هنا تنبيهات المراجعة المستحقة، إنجازاتك الجديدة، والتحديات اليومية.`,
            relationship: 'يرسل إشعارات من المسار التعليمي والبطاقات التعليمية',
            targetElement: '[data-tour="notifications"]'
        },
        {
            id: 'learning_path',
            icon: Map,
            title: 'المسار التعليمي - منهج منظم',
            description: `رحلة منظمة من الصفر حتى الاحتراف! منهج مُنسّق بعناية يأخذك خطوة بخطوة مع اختبارات دورية لقياس تقدمك.`,
            relationship: 'يضيف الكلمات الجديدة تلقائياً إلى البطاقات التعليمية بعد كل درس',
            targetElement: '[data-tour="learning_path"]'
        },
        {
            id: 'flashcards',
            icon: Layers,
            title: targetLanguage === 'de' ? 'Karteikarten - SRS System' : 'Flashcards - SRS System',
            description: `نظام التكرار المتباعد (SRS) الذكي الذي يحدد الوقت المثالي لمراجعة كل كلمة. نظّم بطاقاتك في مجلدات وتابع تطور ذاكرتك.`,
            relationship: 'يستقبل كلمات من: المسار التعليمي + القصص + القاموس',
            targetElement: '[data-tour="cards"]'
        },
        {
            id: 'stories',
            icon: BookOpen,
            title: 'القصص التفاعلية - التعلم بالسياق',
            description: `تعلم اللغة بطريقة طبيعية من خلال قصص ممتعة! ترجمة فورية، نطق ذكي، واختبارات تفاعلية لكل قصة.`,
            relationship: 'يمكنك حفظ الكلمات الجديدة من القصص كبطاقات تعليمية بضغطة زر',
            targetElement: '[data-tour="stories"]'
        },
        {
            id: 'dictionary',
            icon: Book,
            title: 'القاموس - بحث سريع وذكي',
            description: `ابحث عن أي كلمة واحصل على ترجمتها، أمثلة استخدام، ونطق صوتي احترافي. كل هذا في ثوانٍ!`,
            relationship: 'احفظ أي كلمة من القاموس مباشرة كبطاقة تعليمية',
            targetElement: '[data-tour="dictionary"]'
        },
        {
            id: 'ai_assistant',
            icon: MessageCircle,
            title: 'المساعد الذكي - معلمك الشخصي',
            description: `محادثات تفاعلية مع ذكاء اصطناعي يصحح نطقك، يقترح كلمات جديدة، ويساعدك على الممارسة الفعلية للغة.`,
            relationship: 'يقترح كلمات ودروساً بناءً على مستواك في المسار التعليمي',
            targetElement: '[data-tour="ai_assistant"]'
        },
        {
            id: 'community',
            icon: Users,
            title: 'المجتمع - تعلم مع الآخرين',
            description: `انضم لمجتمع من المتعلمين الطموحين! شارك إنجازاتك، شارك في تحديات جماعية، وتبادل الخبرات.`,
            relationship: 'مكمّل لتجربة التعلم الفردية - التحفيز والتنافس الإيجابي',
            targetElement: '[data-tour="community"]'
        },
        {
            id: 'settings',
            icon: Settings,
            title: 'الإعدادات - تخصيص تجربتك',
            description: `تحكم كامل في تجربتك! غيّر الثيم، اللغة، الإشعارات، وراجع تفاصيل اشتراكك.`,
            relationship: 'يؤثر على جميع الأقسام - هو مركز التحكم العام',
            targetElement: '[data-tour="settings"]'
        }
    ];

    const currentStepData = tourSteps[currentStep];
    const Icon = currentStepData.icon;
    const isLastStep = currentStep === tourSteps.length - 1;
    const isFirstStep = currentStep === 0;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstStep) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md font-sans"
            dir="rtl"
        >
            {/* Content Container */}
            <div className="relative z-10 w-full max-w-2xl px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.05, y: -20 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400 rounded-full blur-3xl"></div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onComplete}
                                className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Progress */}
                            <div className="flex items-center justify-center gap-2 mb-6">
                                {tourSteps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep
                                            ? 'w-8 bg-white'
                                            : idx < currentStep
                                                ? 'w-6 bg-white/60'
                                                : 'w-4 bg-white/20'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                                    <Icon size={40} className="drop-shadow-lg" />
                                </div>
                            </div>

                            {/* Step Counter */}
                            <div className="text-center">
                                <span className="text-sm font-bold opacity-80">
                                    خطوة {currentStep + 1} من {tourSteps.length}
                                </span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white text-center">
                                {currentStepData.title}
                            </h2>

                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed text-center">
                                {currentStepData.description}
                            </p>

                            {/* Relationship Card */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-800">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center mt-0.5">
                                        <Sparkles size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-1">العلاقة مع الأقسام الأخرى:</h4>
                                        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                            {currentStepData.relationship}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-4">
                            <button
                                onClick={handlePrevious}
                                disabled={isFirstStep}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${isFirstStep
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <ChevronRight className="rtl:rotate-180" size={20} />
                                السابق
                            </button>

                            <div className="flex-1 text-center">
                                <span className="text-sm font-bold text-slate-400">
                                    {currentStep + 1} / {tourSteps.length}
                                </span>
                            </div>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                            >
                                {isLastStep ? (
                                    <>
                                        ابدأ التعلم
                                        <Check size={20} />
                                    </>
                                ) : (
                                    <>
                                        التالي
                                        <ChevronLeft className="rtl:rotate-180" size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Skip Button */}
            <button
                onClick={onComplete}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white text-sm font-bold transition-colors"
            >
                تخطي الجولة
            </button>
        </motion.div>
    );
};
