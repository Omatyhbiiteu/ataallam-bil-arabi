import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, ArrowLeft, Timer, Bookmark, BookmarkPlus, StickyNote, Headphones, CheckCircle, Brain, FileText, ExternalLink, Link as LinkIcon, Star, StarOff, Trophy, Flame, Zap } from 'lucide-react';
import { CustomAudioPlayer } from './CustomAudioPlayer';
import { QuizView } from './QuizView';
import { NotesPanel } from './NotesPanel';
import confetti from 'canvas-confetti';
import { useLessonContext } from './context/LessonContext';

const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
        return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}`;
    }
    return null;
};

export const LessonView: React.FC = () => {
    const {
        activeLesson,
        onClose,
        onComplete,
        onPrevLesson,
        onToggleBookmark,
        isBookmarked,
        activeLessonIndex,
        timeSpent,
        onAddNote,
        onDeleteNote,
        lessonNotes,
        lessonRating,
        onRateLesson,
        t: parentT,
        dir = 'rtl',
        formatTimeSpent,
        isLastLessonInLevel,
        speakText
    } = useLessonContext();

    const t = parentT || ((key: string) => key as any);

    const [isQuizMode, setIsQuizMode] = useState(false);
    const [showNotesPanel, setShowNotesPanel] = useState(false);
    const [showCompleteScreen, setShowCompleteScreen] = useState(false);

    // Scroll Progress
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        container: scrollContainerRef
    });

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const handleWordClick = (word: string) => {
        const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
        speakText(cleanWord);
    };

    const handleManualComplete = () => {
        if (activeLesson.questions && activeLesson.questions.length > 0) setIsQuizMode(true);
        else {
            onComplete(activeLesson.id);
            if (isLastLessonInLevel) {
                onClose();
            } else {
                setShowCompleteScreen(true);
                // confetti احتفالي
                setTimeout(() => {
                    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#f59e0b','#10b981','#6366f1','#ec4899'] });
                    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { x: 0.1, y: 0.6 } }), 300);
                    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { x: 0.9, y: 0.6 } }), 500);
                }, 200);
            }
        }
    };

    // شاشة إتمام الدرس الاحترافية
    if (showCompleteScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
                {/* جسيمات خلفية */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 animate-pulse"
                        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 animate-pulse"
                        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', animationDelay: '1s' }} />
                </div>

                <motion.div
                    initial={{ scale: 0.7, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative w-full max-w-md text-center"
                >
                    {/* بطاقة الإتمام */}
                    <div className="relative overflow-hidden rounded-[2.5rem] p-8"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 0 80px rgba(99,102,241,0.3), 0 30px 60px rgba(0,0,0,0.5)'
                        }}>

                        {/* أيقونة النجاح */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                            className="mx-auto mb-6 w-28 h-28 rounded-full flex items-center justify-center relative"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 60px rgba(16,185,129,0.6)' }}
                        >
                            <CheckCircle size={56} className="text-white" />
                            {/* هالة */}
                            <motion.div
                                initial={{ scale: 1, opacity: 0.6 }}
                                animate={{ scale: 1.8, opacity: 0 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                                className="absolute inset-0 rounded-full"
                                style={{ background: 'rgba(16,185,129,0.4)' }}
                            />
                        </motion.div>

                        {/* شارة */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                            style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}
                        >
                            <Flame size={12} className="fill-current" />
                            درس مكتمل
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="text-4xl font-black text-white mb-2"
                        >
                            عاش يا بطل! 🔥
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg font-bold mb-1"
                            style={{ color: 'rgba(167,243,208,0.9)' }}
                        >
                            خلّصت درس
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.42 }}
                            className="text-xl font-black text-white mb-6 line-clamp-2"
                        >
                            "{activeLesson.title}"
                        </motion.p>

                        {/* إحصائيات */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.45 }}
                            className="flex justify-center gap-6 p-4 rounded-2xl mb-6"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <div className="text-center">
                                <div className="text-2xl font-black text-emerald-400">{formatTimeSpent(timeSpent)}</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(167,243,208,0.6)' }}>وقت الدراسة</div>
                            </div>
                            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                            <div className="text-center">
                                <div className="text-2xl font-black text-yellow-400">+10 🪙</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(167,243,208,0.6)' }}>عملة كسبتها</div>
                            </div>
                            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                            <div className="text-center">
                                <div className="text-2xl">⭐</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(167,243,208,0.6)' }}>خبرة جديدة</div>
                            </div>
                        </motion.div>

                        {/* زر المتابعة */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3"
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                boxShadow: '0 8px 40px rgba(16,185,129,0.5)',
                                color: 'white'
                            }}
                        >
                            <Zap size={22} className="fill-white" />
                            كمّل يا نجم! 🚀
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="lesson-detail-page site-responsive-root fixed inset-y-0 bg-white dark:bg-gray-950 flex flex-col overflow-hidden animate-slide-up w-full xl:w-[calc(100%-20rem)] z-40 transition-all duration-300 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            style={dir === 'rtl' ? { left: 0 } : { right: 0 }}>

            {/* Reading Progress / Magical Timeline */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-1 md:h-1.5 bg-gradient-to-r from-blue-500 via-primary to-orange-500 z-50 shadow-[0_0_20px_rgba(249,115,22,0.8)]"
                style={{ scaleX, transformOrigin: dir === 'rtl' ? 'right' : 'left' }}
            />

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-stone-200 dark:border-gray-700 px-3 py-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 shadow-sm z-30 shrink-0">
                <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
                    <button onClick={onClose} className="shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition rtl:rotate-0 ltr:rotate-180">
                        <ArrowRight className="text-gray-600 dark:text-gray-300" />
                    </button>
                    {activeLessonIndex > 0 && (
                        <button onClick={onPrevLesson} className="shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition rtl:rotate-0 ltr:rotate-180" title={t.learningPath.prevLesson}>
                            <ArrowLeft className="text-gray-400 dark:text-gray-500 hover:text-primary" size={20} />
                        </button>
                    )}
                    <div className="min-w-0">
                        {activeLesson.questions && activeLesson.questions.length > 0 && (
                            <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-widest block mb-0.5">{t.learningPath.interactiveLesson}</span>
                        )}
                        <h2 className="font-bold text-base md:text-lg text-gray-800 dark:text-white line-clamp-1">{activeLesson.title}</h2>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    {timeSpent > 0 && (
                        <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                            <Timer size={14} />
                            {formatTimeSpent(timeSpent)}
                        </div>
                    )}
                    <button
                        onClick={onToggleBookmark}
                        className={`p-2 rounded-full transition ${isBookmarked ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                        {isBookmarked ? <Bookmark size={20} className="fill-current" /> : <BookmarkPlus size={20} />}
                    </button>
                    <button
                        onClick={() => setShowNotesPanel(!showNotesPanel)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition relative"
                    >
                        <StickyNote size={20} />
                        {lessonNotes.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                {lessonNotes.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative scroll-smooth no-scrollbar">
                {/* Magical Background Orbs */}
                <div className="absolute top-40 left-10 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-40 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse animation-delay-2000"></div>

                <NotesPanel
                    isVisible={showNotesPanel}
                    notes={lessonNotes}
                    onClose={() => setShowNotesPanel(false)}
                    onAddNote={onAddNote}
                    onDeleteNote={onDeleteNote}
                    t={t}
                />

                <div className={`mx-auto w-full ${isQuizMode ? 'h-full flex flex-col' : 'max-w-[1180px] px-3 sm:px-5 lg:px-8 py-5 md:py-8 pb-28 md:pb-32'}`}>
                    {isQuizMode ? (
                        <QuizView
                            onComplete={(score) => {
                                onComplete(activeLesson.id);
                                if (isLastLessonInLevel) {
                                    onClose();
                                } else {
                                    setShowCompleteScreen(true);
                                    setTimeout(() => {
                                        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#f59e0b','#10b981','#6366f1','#ec4899'] });
                                        setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { x: 0.1, y: 0.6 } }), 300);
                                        setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { x: 0.9, y: 0.6 } }), 500);
                                    }, 200);
                                }
                            }}
                        />
                    ) : (
                        <div className="prose dark:prose-invert max-w-none">
                            {/* Media Section */}
                            {activeLesson.videoUrl && (
                                <div className="mb-6 md:mb-8 rounded-2xl md:rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl ring-1 ring-gray-900/10">
                                    {getEmbedUrl(activeLesson.videoUrl) ? (
                                        <iframe src={getEmbedUrl(activeLesson.videoUrl)!} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                    ) : <video
                                            src={activeLesson.videoUrl}
                                            controls
                                            controlsList="nodownload noplaybackrate"
                                            disablePictureInPicture
                                            preload="metadata"
                                            onContextMenu={(e) => e.preventDefault()}
                                            className="w-full h-full protected-media"
                                        />}
                                </div>
                            )}

                            {activeLesson.audioUrl && (
                                <div className="mb-6 md:mb-8 max-w-2xl mx-auto">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Headphones size={14} /> {t.learningPath.listenToExplanation}</h3>
                                    <CustomAudioPlayer src={activeLesson.audioUrl} />
                                </div>
                            )}

                            {activeLesson.image && !activeLesson.videoUrl && (
                                <div className="mb-8 md:mb-12 group relative max-w-4xl mx-auto">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                    <div className="relative rounded-[2.5rem] overflow-hidden bg-stone-100 dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200 dark:ring-white/10 aspect-video">
                                        <img
                                            src={activeLesson.image}
                                            className="block w-full h-full object-cover scale-[1.06] transition-transform duration-1000 ease-out group-hover:scale-[1.085]"
                                            style={{ objectPosition: 'center 42%' }}
                                            alt={activeLesson.title}
                                        />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
                                    </div>
                                </div>
                            )}

                            {/* Content Section */}
                            <div className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 lg:p-8 rounded-2xl md:rounded-[2rem] border border-stone-100 dark:border-gray-700 shadow-sm mb-8 md:mb-10 max-w-4xl mx-auto overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-6 md:mb-8 text-gray-800 dark:text-white flex items-center gap-3 md:gap-4">
                                    <div className="w-1.5 h-7 md:h-8 bg-primary rounded-full shrink-0"></div>
                                    {t.learningPath.lessonContent}
                                </h3>
                                <div className="lesson-content-text text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-serif">
                                    {activeLesson.content ? (
                                        activeLesson.content.split('\n').map((line, lineIdx) => (
                                            <p key={lineIdx} className="mb-6">
                                                {line.split(' ').map((word, wordIdx) => {
                                                    // Simple detection of markdown tags within a word-block
                                                    // This is a basic implementation to handle bold (**), italic (*), and underline (__)
                                                    let className = "relative inline-block px-1 rounded transition-all duration-300 cursor-pointer hover:bg-gradient-to-r hover:from-primary/10 hover:to-orange-500/10 hover:text-primary hover:shadow-[0_0_20px_rgba(251,146,60,0.3)] group-hover:dark:shadow-[0_0_20px_rgba(251,146,60,0.5)]";
                                                    let processedWord = word;
                                                    let isBold = word.startsWith('**') && word.endsWith('**');
                                                    let isItalic = (word.startsWith('*') && word.endsWith('*')) && !isBold;
                                                    let isUnderline = word.startsWith('__') && word.endsWith('__');

                                                    if (isBold) {
                                                        processedWord = word.slice(2, -2);
                                                        className += " font-black";
                                                    } else if (isItalic) {
                                                        processedWord = word.slice(1, -1);
                                                        className += " italic";
                                                    } else if (isUnderline) {
                                                        processedWord = word.slice(2, -2);
                                                        className += " underline underline-offset-4 decoration-primary/30";
                                                    }

                                                    return (
                                                        <span
                                                            key={wordIdx}
                                                            onClick={() => handleWordClick(processedWord)}
                                                            className={className}
                                                        >
                                                            {processedWord}&nbsp;
                                                        </span>
                                                    );
                                                })}
                                            </p>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-400 font-bold italic">
                                            {t.learningPath.noContent}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resources Section */}
                            {activeLesson.resources && activeLesson.resources.length > 0 && (
                                <div className="mb-10 max-w-4xl mx-auto">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600"><FileText size={18} /></div>
                                        {t.learningPath.resources}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {activeLesson.resources.map(res => (
                                            <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition group">
                                                <div className="flex items-center gap-4 overflow-hidden">{res.type === 'pdf' ? <FileText size={24} className="text-red-500" /> : <LinkIcon size={24} className="text-blue-500" />}<span className="font-bold text-gray-800 dark:text-gray-100 truncate">{res.title}</span></div>
                                                <ExternalLink size={18} className="text-gray-400 group-hover:text-primary transition" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rating Section */}
                            <div className="mb-10 max-w-4xl mx-auto relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/30 via-purple-500/25 to-pink-500/25 rounded-[2rem] blur opacity-30 group-hover:opacity-50 transition duration-700"></div>
                                <div className="relative bg-white dark:bg-gray-900 p-5 sm:p-6 md:p-8 rounded-[2rem] border border-amber-200/60 dark:border-amber-400/15 shadow-sm backdrop-blur-sm flex flex-col items-center text-center overflow-hidden">
                                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-100/70 to-transparent dark:from-amber-500/10 pointer-events-none" />
                                    <div className="relative">
                                        <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-2 text-gray-900 dark:text-white">{t.learningPath.rateLesson}</h3>
                                        <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 mb-5 md:mb-6">
                                            اختار تقييمك عشان نطور تجربة التعلم
                                        </p>
                                    </div>
                                    <div className="relative flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-4 w-full">
                                        {[1, 2, 3, 4, 5].map(rating => {
                                            const isSelected = Boolean(lessonRating && lessonRating.rating >= rating);
                                            return (
                                                <button
                                                    key={rating}
                                                    type="button"
                                                    onClick={() => onRateLesson(rating)}
                                                    aria-label={`تقييم ${rating} من 5`}
                                                    className={`flex items-center justify-center transition-all duration-300 ease-out ${
                                                        isSelected
                                                            ? 'text-amber-400 drop-shadow-[0_8px_18px_rgba(251,191,36,0.35)]'
                                                            : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'
                                                    } hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-4 focus:ring-offset-white dark:focus:ring-offset-gray-900 rounded-full`}
                                                >
                                                    <Star
                                                        className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-transform duration-500 ease-out hover:rotate-[16deg] hover:scale-110 ${
                                                            isSelected ? 'fill-current scale-105' : 'fill-transparent'
                                                        }`}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {lessonRating && (
                                        <p className="relative text-xs sm:text-sm font-black mt-1 text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/20 px-4 py-2 rounded-full inline-block animate-fade-in">
                                            {t.learningPath.yourRating}: {lessonRating.rating} {t.learningPath.stars}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!isQuizMode && (
                <div className="px-3 py-3 sm:px-4 md:px-6 md:py-5 border-t border-stone-100 dark:border-gray-800 bg-white/95 dark:bg-black/80 backdrop-blur-md z-50">
                    <div className="max-w-2xl mx-auto">
                        {activeLesson.questions && activeLesson.questions.length > 0 ? (
                            <button onClick={handleManualComplete} className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg shadow-primary/30 transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                                <Brain size={24} className="animate-pulse" />
                                <span className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] md:text-xs opacity-80 font-medium mb-1">{t.learningPath.nextStep}</span>
                                    <span>{t.learningPath.startQuiz}</span>
                                </span>
                                <ArrowRight className="mr-auto opacity-50 rtl:rotate-180" />
                            </button>
                        ) : (
                            <button onClick={handleManualComplete} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg shadow-green-500/30 transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                                <CheckCircle size={24} /> {t.learningPath.completeLesson}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
