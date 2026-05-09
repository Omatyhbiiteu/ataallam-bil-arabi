import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, RotateCcw, Trophy, Frown, Music, Video as VideoIcon, Image as ImageIcon, Loader, RefreshCw } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { useLessonContext } from './context/LessonContext';
import { useQuizLogic } from './hooks/useQuizLogic';

interface QuizViewProps {
    onComplete: (score: number) => void;
}

const MediaPlayer: React.FC<{ url: string; type: 'image' | 'video' | 'audio' | 'none' }> = ({ url, type }) => {
    const [loading, setLoading] = useState(true);

    if (!url || type === 'none') return null;

    if (type === 'image') return (
        <div className="w-full max-w-2xl mx-auto mb-6 rounded-[var(--radius-xl)] overflow-hidden shadow-lg border border-gray-100 dark:border-white/10 relative bg-gray-50 dark:bg-white/5 min-h-[200px] flex items-center justify-center group">
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'}`}>
                <Loader className="animate-spin text-[var(--brand-500)]" />
            </div>
            <img
                src={url}
                alt="Media"
                onLoad={() => setLoading(false)}
                className={`w-full h-auto max-h-[350px] object-cover transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
            />
        </div>
    );
    if (type === 'video') return (
        <div className="w-full max-w-2xl mx-auto mb-6 rounded-[var(--radius-xl)] overflow-hidden shadow-lg border border-gray-100 dark:border-white/10 aspect-video bg-black relative">
            <video src={url} controls className="w-full h-full" />
        </div>
    );
    if (type === 'audio') return (
        <div className="w-full max-w-md mx-auto mb-6 p-4 bg-[var(--brand-50)] dark:bg-orange-900/10 rounded-[var(--radius-xl)] border border-[var(--brand-100)] dark:border-orange-500/20 flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-orange-600/20 rounded-full flex items-center justify-center text-[var(--brand-600)] dark:text-orange-400 shadow-sm">
                <Music size={24} />
            </div>
            <audio src={url} controls className="w-full accent-[var(--brand-600)]" />
        </div>
    );
    return null;
};

export const QuizView: React.FC<QuizViewProps> = ({ onComplete }) => {
    const { activeLesson, onClose } = useLessonContext();
    const {
        currentQuestionIndex,
        currentDisplayIndex,
        totalQuestionsInQueue,
        quizState,
        currentSelectedAnswer,
        quizResult,
        isRetryRound,
        scrambledWords,
        selectedWords,
        setScrambledWords,
        setSelectedWords,
        handleSelectAnswer,
        checkAnswer,
        continueQuiz,
        retryQuiz
    } = useQuizLogic({ activeLesson, onComplete });

    // ─── Result Screen ──────────────────────────────────────────────────────────
    if (quizResult) {
        const passed = quizResult.passed;

        return (
            <div className="fixed inset-0 z-[60] bg-white dark:bg-[#0B0D17] flex items-center justify-center p-6 animate-fade-in" dir="rtl">
                <m.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    className="max-w-md w-full text-center space-y-6"
                >
                    {/* Icon */}
                    <div className="relative inline-block">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl mx-auto ${
                            passed
                                ? 'bg-gradient-to-tr from-green-400 to-emerald-600 shadow-green-200 dark:shadow-green-900/40'
                                : 'bg-gradient-to-tr from-red-400 to-rose-600 shadow-red-200 dark:shadow-red-900/40'
                        }`}>
                            {passed
                                ? <Trophy size={60} className="text-white" />
                                : <Frown size={60} className="text-white" />
                            }
                        </div>
                        {passed && (
                            <m.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 font-black px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#0B0D17] text-sm"
                            >
                                ممتاز!
                            </m.div>
                        )}
                    </div>

                    {/* Title & Score */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                            {passed ? 'أداء رائع! 🎉' : 'لم تجتز الاختبار'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-base">
                            حققت{' '}
                            <span className={`text-2xl font-black mx-1 ${passed ? 'text-green-500' : 'text-red-500'}`}>
                                {quizResult.score}%
                            </span>
                            {' '}من الإجابات الصحيحة
                        </p>
                        <p className={`text-sm font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                            {passed
                                ? 'ممتاز! لقد اجتزت الاختبار ✅'
                                : 'مطلوب 60% على الأقل للاجتياز — حاول مرة أخرى 💪'}
                        </p>
                    </div>

                    {/* Score Bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                        <m.div
                            initial={{ width: 0 }}
                            animate={{ width: `${quizResult.score}%` }}
                            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${passed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                        />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                        <span>0%</span>
                        <span className="text-yellow-500">60% للاجتياز</span>
                        <span>100%</span>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        {passed ? (
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white rounded-[var(--radius-lg)] font-bold text-lg shadow-lg shadow-orange-200/50 dark:shadow-orange-900/40 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                إكمال ومتابعة 🚀
                            </button>
                        ) : (
                            /* FAIL: Only retry button, no way to skip */
                            <m.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-3"
                            >
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/20 text-sm text-red-700 dark:text-red-300 font-bold">
                                    ⚠️ يجب اجتياز الاختبار بنسبة 60% أو أعلى للمتابعة إلى الدرس التالي.
                                </div>
                                <button
                                    onClick={retryQuiz}
                                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[var(--radius-lg)] font-bold text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <RefreshCw size={22} />
                                    إعادة الاختبار من البداية
                                </button>
                            </m.div>
                        )}
                    </div>
                </m.div>
            </div>
        );
    }

    // ─── Question Screen ────────────────────────────────────────────────────────
    const q = activeLesson.questions![currentQuestionIndex];
    if (!q) return null;

    const isNote = q.type === 'note';
    const canCheck =
        (currentSelectedAnswer !== null && currentSelectedAnswer !== '' &&
            (Array.isArray(currentSelectedAnswer) ? currentSelectedAnswer.length > 0 : true));
    const isAnswered = quizState !== 'answering';

    const handleAction = () => {
        if (isNote) {
            continueQuiz();
        } else if (isAnswered) {
            continueQuiz();
        } else {
            checkAnswer();
        }
    };

    return (
        <div className="fixed inset-0 z-[50] bg-[#fffdf7] dark:bg-[#0B0D17] flex flex-col pt-safe px-4 pb-4 transition-colors duration-300 font-sans">
            {/* Header */}
            <div className="h-16 flex items-center justify-between shrink-0 max-w-4xl mx-auto w-full">
                <button
                    onClick={onClose}
                    className="p-2.5 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all border border-gray-200 dark:border-white/5 shadow-sm text-gray-400 hover:text-red-500"
                >
                    <X size={20} />
                </button>

                <div className="flex-1 mx-4 md:mx-8">
                    {/* Retry round indicator */}
                    {isRetryRound && (
                        <m.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-xs font-black text-orange-500 dark:text-orange-400 mb-1 flex items-center justify-center gap-1"
                        >
                            <RefreshCw size={11} />
                            جولة إعادة الأسئلة الخاطئة
                        </m.div>
                    )}
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                        <m.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentDisplayIndex / totalQuestionsInQueue) * 100}%` }}
                            className={`h-full rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)] ${
                                isRetryRound
                                    ? 'bg-orange-500'
                                    : 'bg-[var(--brand-500)]'
                            }`}
                            transition={{ type: 'spring', stiffness: 50 }}
                        />
                    </div>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs border ${
                    isRetryRound
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 border-orange-100 dark:border-orange-500/20'
                        : 'bg-[var(--brand-50)] dark:bg-orange-900/20 text-[var(--brand-600)] dark:text-orange-300 border-[var(--brand-100)] dark:border-orange-500/20'
                }`}>
                    <span>{currentDisplayIndex}</span>
                    <span className="opacity-40">/</span>
                    <span>{totalQuestionsInQueue}</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2" dir="rtl">
                <m.div
                    key={`${currentQuestionIndex}-${isRetryRound}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                    className="max-w-3xl mx-auto min-h-full flex flex-col justify-start pt-4 pb-28 md:justify-center md:pb-32"
                >
                    {/* Retry badge on question */}
                    {isRetryRound && (
                        <m.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex justify-center mb-4"
                        >
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black border border-orange-200 dark:border-orange-500/30">
                                <RefreshCw size={10} />
                                سؤال إعادة — كنت مخطئاً في هذا السؤال
                            </span>
                        </m.div>
                    )}

                    {/* Media Display */}
                    {(q.mediaUrl && q.mediaType && q.mediaType !== 'none') && (
                        <MediaPlayer url={q.mediaUrl} type={q.mediaType} />
                    )}

                    {/* Question Text */}
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white text-center mb-8 leading-relaxed drop-shadow-sm px-2">
                        {q.text}
                    </h3>

                    {/* Interaction Area */}
                    <div className="w-full">
                        {isNote ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 font-medium text-base md:text-lg max-w-xl mx-auto bg-white dark:bg-white/5 p-6 rounded-[var(--radius-xl)] border border-gray-100 dark:border-white/5 shadow-lg">
                                <p>اقرأ المعلومات أعلاه ثم اضغط متابعة للانتقال للسؤال التالي.</p>
                            </div>
                        ) : (
                            <>
                                {q.type === 'multiple-choice' && (
                                    <div className={`grid ${q.options && q.options.some(o => o.length > 30) ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 max-w-2xl mx-auto`}>
                                        {q.options?.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                disabled={isAnswered}
                                                onClick={() => handleSelectAnswer(opt)}
                                                className={`p-4 rounded-[var(--radius-lg)] border-2 text-right transition-all group relative overflow-hidden
                                                ${currentSelectedAnswer === opt
                                                        ? (isAnswered
                                                            ? (opt === q.correctAnswer ? 'bg-green-500 border-green-500 text-white' : 'bg-red-500 border-red-500 text-white')
                                                            : 'bg-[var(--brand-600)] border-[var(--brand-500)] text-white shadow-lg shadow-orange-200/50 dark:shadow-orange-900/40 scale-[1.02]')
                                                        : (isAnswered && opt === q.correctAnswer
                                                            ? 'bg-green-100 border-green-200 text-green-800'
                                                            : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10')
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between z-10 relative">
                                                    <span className="font-bold text-base md:text-lg">{opt}</span>
                                                    {isAnswered && opt === q.correctAnswer && <CheckCircle className="text-white fill-green-500/20" size={20} />}
                                                    {isAnswered && currentSelectedAnswer === opt && opt !== q.correctAnswer && <AlertCircle className="text-white fill-red-500/20" size={20} />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'true-false' && (
                                    <div className="flex gap-4 max-w-md mx-auto">
                                        <button
                                            disabled={isAnswered}
                                            onClick={() => handleSelectAnswer('true')}
                                            className={`flex-1 p-6 rounded-[var(--radius-xl)] border-2 text-center transition-all flex flex-col items-center gap-3
                                            ${currentSelectedAnswer === 'true'
                                                    ? (isAnswered
                                                        ? (String(q.correctAnswer) === 'true' ? 'bg-green-500 border-green-500 text-white' : 'bg-red-500 border-red-500 text-white')
                                                        : 'bg-green-500 border-green-500 text-white shadow-xl shadow-green-200 dark:shadow-green-900/30 scale-105')
                                                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-500/30 hover:bg-green-50 dark:hover:bg-green-900/10'}`}
                                        >
                                            <CheckCircle size={32} />
                                            <span className="font-black text-xl">صح</span>
                                        </button>
                                        <button
                                            disabled={isAnswered}
                                            onClick={() => handleSelectAnswer('false')}
                                            className={`flex-1 p-6 rounded-[var(--radius-xl)] border-2 text-center transition-all flex flex-col items-center gap-3
                                            ${currentSelectedAnswer === 'false'
                                                    ? (isAnswered
                                                        ? (String(q.correctAnswer) === 'false' ? 'bg-green-500 border-green-500 text-white' : 'bg-red-500 border-red-500 text-white')
                                                        : 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-200 dark:shadow-red-900/30 scale-105')
                                                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                                        >
                                            <X size={32} />
                                            <span className="font-black text-xl">خطأ</span>
                                        </button>
                                    </div>
                                )}

                                {q.type === 'text-input' && (
                                    <div className="max-w-lg mx-auto">
                                        <input
                                            type="text"
                                            disabled={isAnswered}
                                            placeholder="اكتب إجابتك هنا..."
                                            value={currentSelectedAnswer || ''}
                                            onChange={e => handleSelectAnswer(e.target.value)}
                                            className={`w-full bg-white dark:bg-white/5 border-2 p-5 rounded-[var(--radius-lg)] text-xl font-bold text-center outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600
                                            ${isAnswered
                                                    ? (quizState === 'feedback_correct' ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10' : 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10')
                                                    : 'border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-[var(--brand-500)] focus:bg-[var(--brand-50)] dark:focus:bg-orange-900/10'}`}
                                        />
                                        {isAnswered && quizState === 'feedback_wrong' && (
                                            <div className="mt-4 text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-500/20 animate-fade-in">
                                                <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase mb-1">الإجابة الصحيحة</p>
                                                <p className="font-black text-lg text-gray-900 dark:text-white">{q.correctAnswer}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {q.type === 'order' && (
                                    <div className="space-y-6 max-w-2xl mx-auto">
                                        <div className="min-h-[100px] bg-[var(--brand-50)] dark:bg-white/5 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--brand-200)] dark:border-white/10 p-4 flex flex-wrap gap-2 items-center justify-center transition-all">
                                            <AnimatePresence>
                                                {selectedWords.map((word, idx) => (
                                                    <m.button
                                                        key={`sel-${word}-${idx}`}
                                                        layout
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                        onClick={() => {
                                                            if (isAnswered) return;
                                                            setSelectedWords(prev => prev.filter((_, i) => i !== idx));
                                                            setScrambledWords(prev => [...prev, word]);
                                                        }}
                                                        className="px-4 py-2 bg-white shadow-md text-gray-800 font-bold rounded-xl border border-gray-100 hover:scale-105 active:scale-95 transition-transform text-sm md:text-base"
                                                    >
                                                        {word}
                                                    </m.button>
                                                ))}
                                            </AnimatePresence>
                                            {selectedWords.length === 0 && (
                                                <span className="text-gray-400 dark:text-gray-500 font-bold opacity-50 text-sm">اضغط على الكلمات بالترتيب الصحيح</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <AnimatePresence>
                                                {scrambledWords.map((word, idx) => (
                                                    <m.button
                                                        key={`scr-${word}-${idx}`}
                                                        layout
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            if (isAnswered) return;
                                                            setScrambledWords(prev => prev.filter((_, i) => i !== idx));
                                                            setSelectedWords(prev => [...prev, word]);
                                                        }}
                                                        className="px-4 py-3 bg-white dark:bg-white/10 text-gray-600 dark:text-gray-200 font-bold rounded-xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md hover:border-[var(--brand-300)] transition-all text-sm md:text-base"
                                                    >
                                                        {word}
                                                    </m.button>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </m.div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0B0D17]/90 backdrop-blur-md border-t border-gray-200 dark:border-white/5 p-4 z-[55]">
                <div className="max-w-3xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        {isAnswered ? (
                            <m.div
                                key="feedback"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${quizState === 'feedback_correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {quizState === 'feedback_correct' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`font-black text-base ${quizState === 'feedback_correct' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {quizState === 'feedback_correct'
                                                ? 'إجابة صحيحة! ✅'
                                                : (isRetryRound ? 'لا تزال خاطئة ❌' : 'إجابة خاطئة — سيُعاد هذا السؤال لاحقاً 🔁')}
                                        </h4>
                                        {quizState === 'feedback_wrong' && q.explanation && (
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">{q.explanation}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleAction}
                                    className={`px-6 py-3 rounded-[var(--radius-lg)] font-bold text-white shadow-lg transition-transform active:scale-95 whitespace-nowrap text-base ${quizState === 'feedback_correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    متابعة
                                </button>
                            </m.div>
                        ) : (
                            <m.button
                                key="submit"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                onClick={handleAction}
                                disabled={!isNote && !canCheck}
                                className={`w-full py-4 rounded-[var(--radius-lg)] font-black text-lg shadow-xl transition-all
                                ${isNote || canCheck
                                        ? 'bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-orange-200/50 dark:shadow-orange-900/40 hover:scale-[1.01] active:scale-95'
                                        : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
                            >
                                {isNote ? 'متابعة' : 'تحقق من الإجابة'}
                            </m.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
