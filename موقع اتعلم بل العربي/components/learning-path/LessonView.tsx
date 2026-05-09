import React, { useState, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, ArrowLeft, Timer, Bookmark, BookmarkPlus, StickyNote, Headphones, CheckCircle, Brain, FileText, ExternalLink, Link as LinkIcon, Star, StarOff } from 'lucide-react';
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
        activeLessonIndex,
        timeSpent,
        isBookmarked,
        lessonNotes,
        lessonRating,
        onClose,
        onPrevLesson,
        onToggleBookmark,
        onAddNote,
        onDeleteNote,
        onComplete,
        onRateLesson,
        speakText,
        t,
        dir = 'rtl',
        formatTimeSpent
    } = useLessonContext();

    const [isQuizMode, setIsQuizMode] = useState(false);
    const [showNotesPanel, setShowNotesPanel] = useState(false);

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
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            onComplete(activeLesson.id);
            onClose();
        }
    };

    return (
        <div className="fixed top-0 bottom-0 bg-white dark:bg-gray-950 flex flex-col overflow-hidden animate-slide-up w-full md:w-[calc(100%-18rem)] z-40 transition-all duration-300 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            style={dir === 'rtl' ? { left: 0 } : { right: 0 }}>

            {/* Reading Progress / Magical Timeline */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-1 md:h-1.5 bg-gradient-to-r from-blue-500 via-primary to-orange-500 z-50 shadow-[0_0_20px_rgba(249,115,22,0.8)]"
                style={{ scaleX, transformOrigin: dir === 'rtl' ? 'right' : 'left' }}
            />

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-stone-200 dark:border-gray-700 p-3 md:p-4 flex items-center justify-between shadow-sm z-30 shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition rtl:rotate-0 ltr:rotate-180">
                        <ArrowRight className="text-gray-600 dark:text-gray-300" />
                    </button>
                    {activeLessonIndex > 0 && (
                        <button onClick={onPrevLesson} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition rtl:rotate-0 ltr:rotate-180" title={t.learningPath.prevLesson}>
                            <ArrowLeft className="text-gray-400 dark:text-gray-500 hover:text-primary" size={20} />
                        </button>
                    )}
                    <div>
                        {activeLesson.questions && activeLesson.questions.length > 0 && (
                            <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-widest block mb-0.5">{t.learningPath.interactiveLesson}</span>
                        )}
                        <h2 className="font-bold text-base md:text-lg text-gray-800 dark:text-white line-clamp-1">{activeLesson.title}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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

                <div className={`mx-auto ${isQuizMode ? 'h-full flex flex-col' : 'max-w-5xl p-4 md:p-12 pb-32'}`}>
                    {isQuizMode ? (
                        <QuizView
                            onComplete={(score) => {
                                onComplete(activeLesson.id);
                                onClose();
                            }}
                        />
                    ) : (
                        <div className="prose dark:prose-invert max-w-none">
                            {/* Media Section */}
                            {activeLesson.videoUrl && (
                                <div className="mb-6 md:mb-10 rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl ring-1 ring-gray-900/10">
                                    {getEmbedUrl(activeLesson.videoUrl) ? (
                                        <iframe src={getEmbedUrl(activeLesson.videoUrl)!} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                    ) : <video src={activeLesson.videoUrl} controls className="w-full h-full" />}
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
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                            alt={activeLesson.title}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Content Section */}
                            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-14 rounded-[3rem] border border-stone-100 dark:border-gray-700 shadow-sm mb-10 max-w-4xl mx-auto overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <h3 className="text-2xl md:text-3xl font-black mb-8 text-gray-800 dark:text-white flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                                    {t.learningPath.lessonContent}
                                </h3>
                                <div className="text-gray-700 dark:text-gray-200 leading-[2.2] md:leading-[2.4] whitespace-pre-wrap text-lg md:text-2xl font-serif">
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
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-900 p-6 md:p-8 rounded-[2rem] border border-purple-200/50 dark:border-purple-500/20 backdrop-blur-sm flex flex-col items-center text-center">
                                    <h3 className="text-xl md:text-2xl font-black mb-6 text-gray-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-purple-400 dark:to-pink-400">{t.learningPath.rateLesson}</h3>
                                    <div className="flex gap-4 mb-4">
                                        {[1, 2, 3, 4, 5].map(rating => (
                                            <button
                                                key={rating}
                                                onClick={() => onRateLesson(rating)}
                                                className="transition-all duration-300 transform hover:scale-125 focus:outline-none"
                                            >
                                                {lessonRating && lessonRating.rating >= rating ? (
                                                    <Star size={40} className="fill-amber-400 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                                                ) : (
                                                    <StarOff size={40} className="text-gray-300 dark:text-gray-600 hover:text-amber-200" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {lessonRating && (
                                        <p className="text-sm font-bold mt-2 text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-4 py-1.5 rounded-full inline-block animate-fade-in">
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
                <div className="p-4 md:p-6 border-t border-stone-100 dark:border-gray-800 bg-white/95 dark:bg-black/80 backdrop-blur-md z-50">
                    <div className="max-w-2xl mx-auto">
                        {activeLesson.questions && activeLesson.questions.length > 0 ? (
                            <button onClick={handleManualComplete} className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-lg shadow-primary/30 transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                                <Brain size={24} className="animate-pulse" />
                                <span className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] md:text-xs opacity-80 font-medium mb-1">{t.learningPath.nextStep}</span>
                                    <span>{t.learningPath.startQuiz}</span>
                                </span>
                                <ArrowRight className="mr-auto opacity-50 rtl:rotate-180" />
                            </button>
                        ) : (
                            <button onClick={handleManualComplete} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-lg shadow-green-500/30 transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                                <CheckCircle size={24} /> {t.learningPath.completeLesson}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
