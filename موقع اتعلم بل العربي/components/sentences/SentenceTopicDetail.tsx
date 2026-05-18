import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Play, Mic, FileText, CheckCircle, Image as ImageIcon, Volume2, HelpCircle } from 'lucide-react';
import { SentenceTopic } from '../../types';
import { speakText, detectLang } from '../../services/ttsService';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

interface SentenceTopicDetailProps {
    topic: SentenceTopic;
    learningLang?: 'en' | 'de';
    onBack: () => void;
}

export const SentenceTopicDetail: React.FC<SentenceTopicDetailProps> = ({ topic, learningLang = 'en', onBack }) => {
    const [activeTab, setActiveTab] = useState<'learn' | 'quiz'>('learn');
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
    const [showResults, setShowResults] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
    const [shuffledOptions, setShuffledOptions] = useState<Record<string, string[]>>({});

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-3 rounded-xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        <ArrowRight size={24} className="rtl:rotate-0 ltr:rotate-180" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            {topic.title}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {topic.level} • {topic.subLevel}
                        </p>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 min-h-[600px] flex flex-col">

                    {/* Toolbar / Tabs */}
                    <div className="border-b border-gray-100 dark:border-gray-700 p-2 flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('learn')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'learn'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <FileText size={18} />
                            <span>الدرس</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('quiz')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'quiz'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <HelpCircle size={18} />
                            <span>اختبار</span>
                        </button>
                    </div>

                    <div className="flex-1 p-6 md:p-10">
                        {activeTab === 'learn' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                {/* Media Placeholder (Video/Image) */}
                                {/* Media Section - Dynamic Rendering */}
                                {topic.mediaType === 'video' && topic.mediaUrl ? (
                                    (() => {
                                        const resolvedMedia = resolveMediaUrl(topic.mediaUrl);
                                        // Robust YouTube Regex
                                        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                                        const match = topic.mediaUrl.match(youtubeRegex);
                                        const youtubeId = match ? match[1] : null;

                                        if (youtubeId) {
                                            return (
                                                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 bg-black">
                                                    <iframe
                                                        className="w-full h-full"
                                                        src={`https://www.youtube.com/embed/${youtubeId}`}
                                                        title={topic.title}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            );
                                        }

                                        // Check if it's a direct file (mp4, webm, ogg)
                                        const isDirectFile = /\.(mp4|webm|ogg)$/i.test(topic.mediaUrl)
                                            || /\.(mp4|webm|ogg)$/i.test(resolvedMedia);

                                        if (isDirectFile) {
                                            return (
                                                <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
                                                    <video
                                                        src={resolvedMedia}
                                                        controls
                                                        controlsList="nodownload noplaybackrate"
                                                        disablePictureInPicture
                                                        preload="metadata"
                                                        onContextMenu={(e) => e.preventDefault()}
                                                        className="w-full h-full object-contain protected-media"
                                                    />
                                                </div>
                                            );
                                        }

                                        // Fallback: If it's a video type but not YouTube or direct file, try primitive Iframe or show link
                                        return (
                                            <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 relative">
                                                <iframe
                                                    src={topic.mediaUrl.includes('embed') ? topic.mediaUrl : topic.mediaUrl}
                                                    className="w-full h-full"
                                                    title={topic.title}
                                                    allowFullScreen
                                                />
                                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs p-1 rounded">
                                                    Generic Embed
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : topic.mediaType === 'image' && topic.mediaUrl ? (
                                    <div className="aspect-video w-full rounded-2xl bg-gray-100 dark:bg-gray-900 overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 relative">
                                        <img
                                            src={resolveMediaUrl(topic.mediaUrl)}
                                            alt=""
                                            aria-hidden="true"
                                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30"
                                        />
                                        <img
                                            src={resolveMediaUrl(topic.mediaUrl)}
                                            alt={topic.title}
                                            className="relative z-[1] w-full h-full object-contain p-3"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-video w-full rounded-2xl bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 group cursor-pointer hover:border-indigo-400 transition-colors relative overflow-hidden">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${topic.image} opacity-10`} />
                                        <Play size={48} className="mb-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold">مساحة للفيديو أو الصورة (جاهز للإضافة من لوحة التحكم)</span>
                                    </div>
                                )}


                                {/* Content Sections */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Mic size={20} className="text-indigo-500" />
                                            شرح ومحادثة
                                        </h3>
                                        <div className="space-y-3">
                                            {topic.sentences && topic.sentences.length > 0 ? (
                                                topic.sentences.map((sent, idx) => (
                                                    <div key={sent.id || idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                                        <div className="flex justify-between items-start mb-2 gap-2">
                                                            <span className="font-bold text-gray-800 dark:text-gray-200" dir="ltr">{sent.original}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => speakText(sent.original, detectLang(sent.original) === 'ar' ? 'ar' : learningLang)}
                                                                className="text-gray-400 hover:text-indigo-500 shrink-0"
                                                                title="نطق (TTS)"
                                                            >
                                                                <Volume2 size={18} />
                                                            </button>
                                                        </div>
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm">{sent.translation}</p>
                                                        {sent.audioUrl ? (
                                                            <audio
                                                                className="w-full mt-3 max-w-md"
                                                                controls
                                                                controlsList="nodownload noplaybackrate"
                                                                preload="metadata"
                                                                onContextMenu={(e) => e.preventDefault()}
                                                                src={resolveMediaUrl(sent.audioUrl)}
                                                            />
                                                        ) : null}
                                                        {sent.notes && (
                                                            <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                                💡 {sent.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                                    لا توجد جمل مضافة لهذا الدرس بعد.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <FileText size={20} className="text-amber-500" />
                                            ملاحظات وقواعد
                                        </h3>
                                        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap dir-auto">
                                            {topic.grammarNotes || 'لا توجد ملاحظات إضافية.'}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // Quiz Tab
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {!topic.quizQuestions || topic.quizQuestions.length === 0 ? (
                                    // No Questions State
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-16">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                                            <HelpCircle size={48} className="text-purple-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">لا توجد أسئلة بعد</h3>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                                لم يتم إضافة أسئلة لهذا الموضوع حتى الآن. يمكن للمسؤول إضافتها من لوحة التحكم.
                                            </p>
                                        </div>
                                    </div>
                                ) : !quizStarted ? (
                                    // Quiz Start Screen
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col items-center justify-center text-center space-y-8 py-16"
                                    >
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
                                                <HelpCircle size={64} className="text-white" />
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-3xl shadow-lg"
                                            >
                                                ✨
                                            </motion.div>
                                        </div>

                                        <div className="space-y-4 max-w-lg">
                                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                                                جاهز للاختبار؟ 🎯
                                            </h3>
                                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                                اختبر معلوماتك في موضوع <span className="font-bold text-purple-600 dark:text-purple-400">{topic.title}</span>
                                            </p>

                                            <div className="flex items-center justify-center gap-8 pt-4">
                                                <div className="text-center">
                                                    <div className="text-3xl font-black text-purple-600">{topic.quizQuestions.length}</div>
                                                    <div className="text-sm text-gray-500">سؤال</div>
                                                </div>
                                                <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
                                                <div className="text-center">
                                                    <div className="text-3xl font-black text-indigo-600">⏱️</div>
                                                    <div className="text-sm text-gray-500">بدون وقت محدد</div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6">
                                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                                    💡 <span className="font-bold">نصيحة:</span> ستحصل على تغذية راجعة فورية بعد كل سؤال
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setQuizStarted(true)}
                                            className="group px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xl rounded-2xl transition-all shadow-2xl shadow-purple-500/50 transform hover:scale-105 flex items-center gap-3"
                                        >
                                            <Play size={24} />
                                            <span>ابدأ الاختبار الآن</span>
                                            <ArrowLeft size={24} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </motion.div>
                                ) : showResults ? (
                                    // Results Screen
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-center space-y-8 py-8"
                                    >
                                        <div className="relative inline-block">
                                            <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/50">
                                                <div className="text-white">
                                                    <div className="text-5xl font-black">
                                                        {Math.round((Object.keys(userAnswers).filter(qId => {
                                                            const question = topic.quizQuestions?.find(q => q.id === qId);
                                                            return question && JSON.stringify(userAnswers[qId]) === JSON.stringify(question.correctAnswer);
                                                        }).length / topic.quizQuestions.length) * 100)}%
                                                    </div>
                                                    <div className="text-sm font-medium opacity-90">النتيجة</div>
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-2xl"
                                            >
                                                ⭐
                                            </motion.div>
                                        </div>

                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                                                {Object.keys(userAnswers).filter(qId => {
                                                    const question = topic.quizQuestions?.find(q => q.id === qId);
                                                    return question && JSON.stringify(userAnswers[qId]) === JSON.stringify(question.correctAnswer);
                                                }).length === topic.quizQuestions.length
                                                    ? '🎉 ممتاز! نتيجة مثالية!'
                                                    : Object.keys(userAnswers).filter(qId => {
                                                        const question = topic.quizQuestions?.find(q => q.id === qId);
                                                        return question && JSON.stringify(userAnswers[qId]) === JSON.stringify(question.correctAnswer);
                                                    }).length >= topic.quizQuestions.length * 0.7
                                                        ? '👏 أحسنت! نتيجة جيدة'
                                                        : '💪 حاول مرة أخرى'}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                أجبت صحيحاً على <span className="font-bold text-green-600">
                                                    {Object.keys(userAnswers).filter(qId => {
                                                        const question = topic.quizQuestions?.find(q => q.id === qId);
                                                        return question && JSON.stringify(userAnswers[qId]) === JSON.stringify(question.correctAnswer);
                                                    }).length}
                                                </span> من {topic.quizQuestions.length} أسئلة
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setShowResults(false);
                                                setQuizStarted(false);
                                                setCurrentQuestionIndex(0);
                                                setUserAnswers({});
                                                setSelectedAnswer(null);
                                            }}
                                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-500/30 transform hover:scale-105"
                                        >
                                            🔄 إعادة الاختبار
                                        </button>
                                    </motion.div>
                                ) : (
                                    // Quiz Questions
                                    <div className="space-y-6">
                                        {(() => {
                                            const question = topic.quizQuestions[currentQuestionIndex];
                                            const isAnswered = question.id in userAnswers;
                                            const userAnswer = userAnswers[question.id];
                                            const isCorrect = isAnswered && JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);

                                            return (
                                                <motion.div
                                                    key={question.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.2
                                                    }}
                                                    className="space-y-6"
                                                >
                                                    {/* Progress Bar */}
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${((currentQuestionIndex + 1) / topic.quizQuestions.length) * 100}%` }}
                                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                                            {currentQuestionIndex + 1} / {topic.quizQuestions.length}
                                                        </span>
                                                    </div>

                                                    {/* Question Card */}
                                                    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                                                        <div className="flex items-start gap-4 mb-6">
                                                            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-lg shrink-0">
                                                                #{currentQuestionIndex + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                                                                    {question.text}
                                                                </h3>
                                                            </div>
                                                        </div>

                                                        {/* Multiple Choice */}
                                                        {question.type === 'multiple-choice' && (
                                                            <div className="space-y-3">
                                                                {question.options?.map((option, idx) => {
                                                                    const isSelected = selectedAnswer === option || userAnswer === option;
                                                                    const showCorrect = isAnswered && option === question.correctAnswer;
                                                                    const showWrong = isAnswered && isSelected && !isCorrect;

                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={() => !isAnswered && setSelectedAnswer(option)}
                                                                            disabled={isAnswered}
                                                                            className={`w-full p-4 rounded-xl text-right font-medium transition-all transform ${isAnswered
                                                                                ? showCorrect
                                                                                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-400'
                                                                                    : showWrong
                                                                                        ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-400'
                                                                                        : 'bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-500'
                                                                                : isSelected
                                                                                    ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 text-purple-700 dark:text-purple-400 scale-105'
                                                                                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                                                                                }`}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <span>{option}</span>
                                                                                {showCorrect && <span className="text-2xl">✓</span>}
                                                                                {showWrong && <span className="text-2xl">✗</span>}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* True/False */}
                                                        {question.type === 'true-false' && (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {[true, false].map((value) => {
                                                                    const isSelected = selectedAnswer === value || userAnswer === value;
                                                                    const showCorrect = isAnswered && value === question.correctAnswer;
                                                                    const showWrong = isAnswered && isSelected && !isCorrect;

                                                                    return (
                                                                        <button
                                                                            key={String(value)}
                                                                            onClick={() => !isAnswered && setSelectedAnswer(value)}
                                                                            disabled={isAnswered}
                                                                            className={`p-6 rounded-2xl font-bold text-xl transition-all transform ${isAnswered
                                                                                ? showCorrect
                                                                                    ? 'bg-green-500 text-white shadow-xl shadow-green-500/50'
                                                                                    : showWrong
                                                                                        ? 'bg-red-500 text-white shadow-xl shadow-red-500/50'
                                                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                                                                : isSelected
                                                                                    ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/50 scale-105'
                                                                                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:scale-105'
                                                                                }`}
                                                                        >
                                                                            {value ? '✓ صح' : '✗ خطأ'}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Text Input */}
                                                        {question.type === 'text-input' && (
                                                            <div>
                                                                <input
                                                                    type="text"
                                                                    value={selectedAnswer || ''}
                                                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                                                    disabled={isAnswered}
                                                                    className={`w-full px-6 py-4 rounded-xl text-lg border-2 font-medium ${isAnswered
                                                                        ? isCorrect
                                                                            ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400'
                                                                            : 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                                                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50'
                                                                        }`}
                                                                    placeholder="اكتب إجابتك هنا..."
                                                                />
                                                                {isAnswered && !isCorrect && (
                                                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                                        الإجابة الصحيحة: <span className="font-bold text-green-600">{question.correctAnswer}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        { /* Order - Simplified for now */}
                                                        {question.type === 'order' && (
                                                            <div className="space-y-3">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">رتب الكلمات التالية:</p>
                                                                {question.options?.map((word, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-center font-medium"
                                                                    >
                                                                        {word}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Explanation */}
                                                        {isAnswered && question.explanation && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-blue-500 text-xl">💡</span>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">توضيح:</p>
                                                                        <p className="text-sm text-blue-700 dark:text-blue-400">{question.explanation}</p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3 justify-between">
                                                        <button
                                                            onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
                                                            disabled={currentQuestionIndex === 0}
                                                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                                                        >
                                                            السابق
                                                        </button>

                                                        {!isAnswered ? (
                                                            <button
                                                                onClick={() => {
                                                                    if (selectedAnswer !== null && selectedAnswer !== '') {
                                                                        setUserAnswers(prev => ({ ...prev, [question.id]: selectedAnswer }));
                                                                    }
                                                                }}
                                                                disabled={selectedAnswer === null || selectedAnswer === ''}
                                                                className="flex-1 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30"
                                                            >
                                                                تحقق من الإجابة
                                                            </button>
                                                        ) : currentQuestionIndex < topic.quizQuestions.length - 1 ? (
                                                            <button
                                                                onClick={() => {
                                                                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                                                                    setSelectedAnswer(null);
                                                                }}
                                                                className="flex-1 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30"
                                                            >
                                                                السؤال التالي →
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setShowResults(true)}
                                                                className="flex-1 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30"
                                                            >
                                                                عرض النتيجة 🎯
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
