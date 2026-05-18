import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Brain, Headphones, FileText, ExternalLink, Link as LinkIcon, Sparkles } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import type { Lesson } from '../../types';
import { LessonPreviewQuiz } from './LessonPreviewQuiz';

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

function normalizePreviewQuestions(raw: Lesson['questions']): NonNullable<Lesson['questions']> {
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((q, i) => ({
        ...q,
        id: (q && typeof q.id === 'string' && q.id.trim()) ? q.id : `preview-q-${i}`,
        type: q.type || 'multiple-choice',
        text: typeof q.text === 'string' ? q.text : '',
        options: Array.isArray(q.options) ? q.options : [],
    }));
}

export function lessonToPreviewModel(l: Partial<Lesson>): Lesson {
    return {
        id: l.id || 'preview',
        title: l.title || 'بدون عنوان',
        description: l.description || '',
        duration: l.duration || '10 min',
        level: l.level,
        content: l.content || '',
        image: l.image,
        videoUrl: l.videoUrl,
        audioUrl: l.audioUrl,
        resources: l.resources || [],
        questions: normalizePreviewQuestions(l.questions),
    };
}

interface LessonPreviewModalProps {
    open: boolean;
    lesson: Lesson;
    moduleTitle?: string;
    onClose: () => void;
}

export const LessonPreviewModal: React.FC<LessonPreviewModalProps> = ({
    open,
    lesson,
    moduleTitle,
    onClose,
}) => {
    const [quizOpen, setQuizOpen] = useState(false);

    useEffect(() => {
        if (!open) setQuizOpen(false);
    }, [open]);

    if (typeof document === 'undefined') return null;

    const content = (
        <AnimatePresence>
            {open && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-md"
                    dir="rtl"
                >
                    <m.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                        className="relative w-full max-w-4xl h-[min(92vh,920px)] max-h-[92vh] flex flex-col rounded-[2rem] border border-white/10 bg-[#0B0D17] shadow-2xl overflow-hidden"
                    >
                        <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-slate-900/90 backdrop-blur-xl shrink-0">
                            <div className="min-w-0 text-right flex-1">
                                <div className="flex items-center gap-2 justify-end flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        معاينة حية
                                    </span>
                                    {moduleTitle && (
                                        <span className="text-[10px] font-bold text-gray-500 truncate max-w-[40%]">
                                            {moduleTitle}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg md:text-xl font-black text-white truncate mt-1">{lesson.title}</h2>
                                {lesson.description && (
                                    <p className="text-xs text-gray-400 font-medium line-clamp-2 mt-1">{lesson.description}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setQuizOpen(false);
                                    onClose();
                                }}
                                className="shrink-0 p-3 rounded-2xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 transition-all"
                                aria-label="إغلاق"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
                            {quizOpen && lesson.questions && lesson.questions.length > 0 ? (
                                <div className="flex-1 min-h-0 z-20 flex flex-col overflow-hidden">
                                    <LessonPreviewQuiz
                                        lesson={lesson}
                                        onClose={() => setQuizOpen(false)}
                                        onExitPreview={() => {
                                            setQuizOpen(false);
                                            onClose();
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-8 space-y-8">
                                    <div className="pointer-events-none absolute inset-0 opacity-40">
                                        <div className="absolute top-20 right-10 w-56 h-56 bg-indigo-600/20 rounded-full blur-[120px]" />
                                        <div className="absolute bottom-10 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px]" />
                                    </div>

                                    {lesson.videoUrl && (
                                        <div className="relative z-10 rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl ring-1 ring-white/10 max-w-3xl mx-auto">
                                            {getEmbedUrl(lesson.videoUrl) ? (
                                                <iframe
                                                    src={getEmbedUrl(lesson.videoUrl)!}
                                                    className="w-full h-full"
                                                    title="video"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <video src={lesson.videoUrl} controls controlsList="nodownload noplaybackrate" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} className="w-full h-full" />
                                            )}
                                        </div>
                                    )}

                                    {lesson.audioUrl && (
                                        <div className="relative z-10 max-w-xl mx-auto space-y-2">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 justify-end">
                                                <Headphones size={14} className="text-indigo-400" /> الاستماع
                                            </h3>
                                            <audio src={lesson.audioUrl} controls controlsList="nodownload noplaybackrate" onContextMenu={(e) => e.preventDefault()} className="w-full accent-indigo-500 rounded-xl" />
                                        </div>
                                    )}

                                    {lesson.image && !lesson.videoUrl && (
                                        <div className="relative z-10 max-w-3xl mx-auto rounded-[2rem] overflow-hidden ring-1 ring-white/10 aspect-video bg-slate-900">
                                            <img src={lesson.image} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35" />
                                            <img src={lesson.image} alt="" className="relative z-[1] w-full h-full object-contain p-3" />
                                        </div>
                                    )}

                                    <div className="relative z-10 bg-slate-900/80 border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-xl">
                                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 justify-end">
                                            <Sparkles className="text-indigo-400 shrink-0" size={22} />
                                            محتوى الدرس
                                        </h3>
                                        <div className="text-gray-200 leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                                            {lesson.content?.trim() ? (
                                                lesson.content.split('\n').map((line, lineIdx) => (
                                                    <p key={lineIdx} className="mb-4 last:mb-0">
                                                        {line}
                                                    </p>
                                                ))
                                            ) : (
                                                <p className="text-center text-gray-500 font-bold py-8">لا يوجد نص بعد.</p>
                                            )}
                                        </div>
                                    </div>

                                    {lesson.resources && lesson.resources.length > 0 && (
                                        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
                                            <h3 className="text-sm font-black text-white flex items-center gap-2 justify-end">
                                                <FileText size={18} className="text-purple-400" /> موارد إضافية
                                            </h3>
                                            <div className="grid gap-2">
                                                {lesson.resources.map((res) => (
                                                    <a
                                                        key={res.id}
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-colors"
                                                    >
                                                        <ExternalLink size={16} className="text-gray-500" />
                                                        <span className="font-bold text-gray-200 truncate mr-2">{res.title}</span>
                                                        {res.type === 'pdf' ? <FileText size={20} className="text-red-400" /> : <LinkIcon size={20} className="text-blue-400" />}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!quizOpen && (
                                <div className="relative z-10 shrink-0 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl p-4 md:p-5">
                                    <div className="max-w-xl mx-auto w-full">
                                        {lesson.questions && lesson.questions.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setQuizOpen(true)}
                                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-orange-600 hover:from-indigo-500 hover:to-orange-500 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-indigo-900/40 transition transform hover:scale-[1.01] active:scale-[0.99]"
                                            >
                                                <Brain size={24} className="animate-pulse" />
                                                <span className="flex flex-col items-end leading-tight">
                                                    <span className="text-[10px] font-medium opacity-90">تجربة كطالب</span>
                                                    <span>بدء الاختبار ({lesson.questions.length} سؤال)</span>
                                                </span>
                                            </button>
                                        ) : (
                                            <p className="text-center text-sm font-bold text-gray-500">
                                                لا يوجد اختبار في هذا الدرس — أضف أسئلة من تبويب الاختبارات.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
};
