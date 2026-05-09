import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Star, BookOpen, Brain, Globe, Briefcase, Plane } from 'lucide-react';

interface OnboardingWizardProps {
    userName: string;
    onComplete: (data: any) => void;
    langAvailability: any;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ userName, onComplete, langAvailability }) => {
    const [step, setStep] = useState(1);
    const [level, setLevel] = useState<string | null>(null);
    const [goals, setGoals] = useState<string[]>([]);

    const totalSteps = 3;

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            onComplete({ level, goals });
        }
    };

    const toggleGoal = (goal: string) => {
        if (goals.includes(goal)) {
            setGoals(goals.filter(g => g !== goal));
        } else {
            setGoals([...goals, goal]);
        }
    };

    // Animation Variants
    const containerVariants: any = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } }
    };

    const slideVariants: any = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.4, ease: "easeOut" }
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            transition: { duration: 0.3 }
        })
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4" dir="rtl">
            <motion.div
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col relative"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ minHeight: '600px' }}
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 to-amber-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center relative z-10">
                    <AnimatePresence mode="wait" custom={step}>
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={step}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="w-full"
                            >
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                                    className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl"
                                >
                                    👋
                                </motion.div>
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                                    أهلاً بك يا {userName}!
                                </h1>
                                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                    دعنا نخصص تجربتك. ما هو مستواك الحالي في اللغة العربية؟
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'beginner', icon: '🌱', title: 'مبتدئ (صفر)', desc: 'أحتاج تعلم الحروف والأساسيات' },
                                        { id: 'intermediate', icon: '🚀', title: 'متوسط', desc: 'أستطيع تكوين جمل بسيطة' },
                                        { id: 'advanced', icon: '🦅', title: 'متقدم', desc: 'أريد إتقان الفصاحة والأدب' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setLevel(opt.id)}
                                            className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 hover:scale-105 ${level === opt.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg ring-2 ring-blue-500/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-transparent'
                                                }`}
                                        >
                                            <span className="text-3xl">{opt.icon}</span>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{opt.title}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={step}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="w-full"
                            >
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                                    className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                >
                                    <Globe className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                </motion.div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                    ما هو هدفك الرئيسي؟
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                                    اختر كل ما ينطبق عليك لنرشح لك المحتوى المناسب.
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { id: 'travel', icon: <Plane />, label: 'السفر والسياحة' },
                                        { id: 'work', icon: <Briefcase />, label: 'العمل والبيزنس' },
                                        { id: 'culture', icon: <BookOpen />, label: 'الثقافة والأدب' },
                                        { id: 'brain', icon: <Brain />, label: 'تنشيط العقل' }
                                    ].map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => toggleGoal(g.id)}
                                            className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 ${goals.includes(g.id)
                                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className={goals.includes(g.id) ? 'text-amber-500' : 'text-slate-400'}>
                                                {g.icon}
                                            </div>
                                            <span className="font-semibold text-sm">{g.label}</span>
                                            {goals.includes(g.id) && <Check className="w-4 h-4 text-amber-500 absolute top-2 right-2" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={step}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="w-full"
                            >
                                <motion.div
                                    initial={{ rotate: -10 }} animate={{ rotate: 10 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                                    className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30"
                                >
                                    <Star className="w-12 h-12 text-white fill-white" />
                                </motion.div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                    أنت جاهز للانطلاق! 🚀
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                                    لقد قمنا بإعداد خطة تعليمية ذكية تناسب مستواك وأهدافك.
                                    استعد لتجربة تعليمية لم يسبق لها مثيل.
                                </p>

                                <div className="flex gap-4 justify-center mb-8">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">🧠</div>
                                        <span>ذكاء اصطناعي</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">🎮</div>
                                        <span>تعلُم ممتع</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600">📈</div>
                                        <span>تتبع دقيق</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <button
                        onClick={() => setStep(Math.max(1, step - 1))}
                        disabled={step === 1}
                        className={`text-slate-400 font-medium px-4 py-2 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'opacity-100'}`}
                    >
                        السابق
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={step === 1 && !level} // Must select level
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all 
                            ${(step === 1 && !level)
                                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:to-blue-400 hover:shadow-blue-500/25 active:scale-95'
                            }
                        `}
                    >
                        {step === totalSteps ? 'ابدأ رحلتك الآن' : 'التالي'}
                        {step !== totalSteps && <ChevronRight className="w-5 h-5 rtl:rotate-180" />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
