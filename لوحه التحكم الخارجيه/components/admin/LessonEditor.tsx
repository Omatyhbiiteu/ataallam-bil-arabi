import React, { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Lesson, Question } from '../../types';
import { Toast } from '../Toast';
import {
    ArrowLeft, Save, UploadCloud,
    List, Video, Mic, FileAudio, Link as LinkIcon,
    Trash2, HelpCircle, Plus, CheckCircle, ListOrdered,
    Type, CheckSquare, Layers, Eye, Music, Image as ImageIcon,
    Youtube, Globe, Settings, ClipboardList, Clock, Sparkles
} from 'lucide-react';
import { X } from 'lucide-react';
import { QuestionForm } from './QuestionForm';
import { AdminAPI } from '../../services/apiClient';
import { UploadProgressBar } from './UploadProgressBar';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

interface LessonEditorProps {
    lesson: Partial<Lesson>;
    setLesson: (lesson: Partial<Lesson>) => void;
    onSave: () => void;
    onCancel: () => void;
    /** معاينة حية كما يراها الطالب */
    onPreview?: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

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

/** صعوبة الدرس داخل الوحدة (مستوى CEFR للوحدة يُعرَّف عند إنشاء الوحدة، وليس هنا) */
const LESSON_DIFFICULTY_LEVELS = ['مبتدئ', 'متوسط', 'متقدم'] as const;
const LESSON_DIFFICULTY_LABELS: Record<(typeof LESSON_DIFFICULTY_LEVELS)[number], string> = {
    مبتدئ: 'مبتدئ',
    متوسط: 'متوسط',
    متقدم: 'متقدم / صعب',
};

function parseDurationMinutes(d: string | undefined): number | '' {
    if (!d || !String(d).trim()) return '';
    const m = String(d).match(/(\d+)/);
    if (!m) return '';
    const n = parseInt(m[1], 10);
    if (Number.isNaN(n) || n < 1) return '';
    return Math.min(999, n);
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, setLesson, onSave, onCancel, onPreview }) => {
    const [editorTab, setEditorTab] = useState<'content' | 'quiz' | 'media'>('content');
    const [contentDirection, setContentDirection] = useState<'auto' | 'rtl' | 'ltr'>('auto');
    const [mediaSubTab, setMediaSubTab] = useState<'image' | 'video' | 'audio'>('image');
    const [toastMessage, setToastMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
    const [mediaUploading, setMediaUploading] = useState(false);
    const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
    const [mediaUploadFileName, setMediaUploadFileName] = useState<string | undefined>();
    const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: ''
    });

    const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast("حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت على الخادم)", "error");
            return;
        }
        setMediaUploading(true);
        showToast("جاري رفع الصورة...", "info");
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("kind", "image");
            const { url } = await AdminAPI.uploadMedia(fd);
            setLesson({ ...lesson, image: url });
            showToast("تم رفع الصورة وربط الرابط", "success");
        } catch (err: any) {
            showToast(err?.message || "فشل رفع الصورة", "error");
        } finally {
            setMediaUploading(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) {
            showToast("حجم الفيديو كبير جداً (الحد الأقصى 100 ميجابايت)", "error");
            return;
        }
        setMediaUploading(true);
        showToast("جاري رفع الفيديو (قد يستغرق وقتاً)...", "info");
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("kind", "video");
            const { url } = await AdminAPI.uploadMedia(fd);
            setLesson({ ...lesson, videoUrl: url });
            showToast("تم رفع الفيديو وربط الرابط", "success");
        } catch (err: any) {
            showToast(err?.message || "فشل رفع الفيديو", "error");
        } finally {
            setMediaUploading(false);
        }
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) {
            showToast("حجم الملف الصوتي كبير جداً (الحد الأقصى 20 ميجابايت)", "error");
            return;
        }
        setMediaUploading(true);
        showToast("جاري رفع الصوت...", "info");
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("kind", "audio");
            const { url } = await AdminAPI.uploadMedia(fd);
            setLesson({ ...lesson, audioUrl: url });
            showToast("تم رفع الصوت وربط الرابط", "success");
        } catch (err: any) {
            showToast(err?.message || "فشل رفع الصوت", "error");
        } finally {
            setMediaUploading(false);
        }
    };

    const handleAddQuestionToLesson = () => {
        if (!newQuestion.text) {
            showToast("يرجى كتابة نص السؤال", "error");
            return;
        }
        const q: Question = {
            id: generateId(),
            text: newQuestion.text,
            type: newQuestion.type || 'multiple-choice',
            options: newQuestion.options?.filter(o => o.trim() !== '') || [],
            correctAnswer: newQuestion.correctAnswer,
            image: newQuestion.image,
            // New fields
            mediaType: newQuestion.mediaType,
            mediaUrl: newQuestion.mediaUrl,
            explanation: newQuestion.explanation
        };
        setLesson({ ...lesson, questions: [...(lesson.questions || []), q] });
        setNewQuestion({ type: 'multiple-choice', options: ['', '', '', ''], text: '', correctAnswer: '', mediaType: 'none' });
        showToast("تم إضافة السؤال للدرس", "success");
    };

    const handleRemoveQuestionFromLesson = (qId: string) => {
        setLesson({ ...lesson, questions: lesson.questions?.filter(q => q.id !== qId) });
    };



    const contentText = lesson.content || '';
    const contentWordCount = contentText.trim() ? contentText.trim().split(/\s+/).length : 0;
    const contentCharCount = contentText.length;
    const contentReadMinutes = contentWordCount === 0 ? 0 : Math.max(1, Math.ceil(contentWordCount / 180));
    const contentDir = contentDirection === 'auto' ? 'auto' : contentDirection;
    const contentAlignClass = contentDirection === 'rtl'
        ? 'text-right'
        : contentDirection === 'ltr'
            ? 'text-left'
            : 'text-start';

    const renderInlinePreview = (text: string, lineIdx: number) => {
        return text.split(' ').map((word, wordIdx) => {
            let className = 'px-0.5 rounded';
            let processedWord = word;
            const isBold = word.startsWith('**') && word.endsWith('**');
            const isItalic = word.startsWith('*') && word.endsWith('*') && !isBold;
            const isUnderline = word.startsWith('__') && word.endsWith('__');

            if (isBold) {
                processedWord = word.slice(2, -2);
                className += ' font-black text-gray-900 dark:text-white';
            } else if (isItalic) {
                processedWord = word.slice(1, -1);
                className += ' italic text-gray-700 dark:text-gray-200';
            } else if (isUnderline) {
                processedWord = word.slice(2, -2);
                className += ' underline underline-offset-4 decoration-red-400/40';
            }

            return (
                <span key={`${lineIdx}-${wordIdx}`} className={className}>
                    {processedWord}&nbsp;
                </span>
            );
        });
    };

    const renderContentPreview = () => {
        if (!contentText.trim()) {
            return (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500 font-bold">
                    لا يوجد محتوى بعد. ابدأ بالكتابة لرؤية المعاينة.
                </div>
            );
        }

        return contentText.split('\n').map((line, lineIdx) => {
            const trimmed = line.trim();
            const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

            if (trimmed.startsWith('- ')) {
                const itemText = trimmed.slice(2);
                return (
                    <div key={`b-${lineIdx}`} className="flex items-start gap-3 mb-3">
                        <span className="text-red-500 dark:text-red-400 font-black">•</span>
                        <span className="flex-1 leading-relaxed text-gray-800 dark:text-gray-100">{renderInlinePreview(itemText, lineIdx)}</span>
                    </div>
                );
            }

            if (orderedMatch) {
                const [, num, itemText] = orderedMatch;
                return (
                    <div key={`o-${lineIdx}`} className="flex items-start gap-3 mb-3">
                        <span className="text-red-500 dark:text-red-400 font-black">{num}.</span>
                        <span className="flex-1 leading-relaxed text-gray-800 dark:text-gray-100">{renderInlinePreview(itemText, lineIdx)}</span>
                    </div>
                );
            }

            if (!trimmed) {
                return <div key={`e-${lineIdx}`} className="h-4" />;
            }

            return (
                <p key={`p-${lineIdx}`} className="mb-5 leading-relaxed text-gray-800 dark:text-gray-100">
                    {renderInlinePreview(line, lineIdx)}
                </p>
            );
        });
    };

    return (
        <m.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen bg-gray-50 dark:bg-[#0B0D17] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors duration-300" dir="rtl"
        >
            <Toast
                message={toastMessage?.text || ""}
                isVisible={!!toastMessage}
                onClose={() => setToastMessage(null)}
                type={toastMessage?.type}
            />

            <header className="h-24 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl border-b border-gray-200 dark:border-white/5 sticky top-0 z-[60] flex items-center justify-between px-4 lg:px-10 transition-colors duration-300">
                <div className="flex items-center gap-8">
                    <button
                        onClick={onCancel}
                        className="p-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-[1.25rem] transition-all border border-gray-200 dark:border-white/5 group active:scale-95 text-gray-600 dark:text-gray-300"
                    >
                        <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform ltr:rotate-180" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {lesson.id ? 'تحرير المحتوى التعليمي' : 'إنشاء درس تفاعلي'}
                            </h2>
                            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ring-1 ring-indigo-500/20 dark:ring-indigo-500/50">
                                PRO Editor
                            </span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                            {lesson.title || 'عنوان الدرس الجديد'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => onPreview?.()}
                        disabled={!onPreview}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white font-bold transition-all px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Eye size={20} />
                        <span>معاينة</span>
                    </button>
                    <button
                        onClick={onSave}
                        className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 transition-all active:scale-95 hover:translate-y-[-2px]"
                    >
                        <Save size={20} />
                        <span>حفظ البيانات</span>
                    </button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-xl dark:shadow-2xl space-y-6 transition-colors duration-300">
                        <nav className="flex flex-col gap-2">
                            {[
                                { id: 'content', label: 'المحتوى النصي', icon: FileAudio },
                                { id: 'media', label: 'الوسائط المتعددة', icon: Youtube },
                                { id: 'quiz', label: 'الاختبارات والتقييم', icon: ClipboardList }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setEditorTab(tab.id as any)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${editorTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 translate-x-[-8px]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    <tab.icon size={22} className={editorTab === tab.id ? 'text-white' : 'text-gray-400 dark:text-gray-500'} />
                                    <span>{tab.label}</span>
                                    {editorTab === tab.id && <m.div layoutId="activeTab" className="mr-auto w-2 h-2 bg-white rounded-full" />}
                                </button>
                            ))}
                        </nav>

                        <div className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase px-2 mb-2">
                                    <Type size={14} className="text-indigo-500" /> عنوان الدرس
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 p-4 rounded-2xl text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500/50 transition-all placeholder:text-gray-400"
                                    value={lesson.title || ''}
                                    onChange={e => setLesson({ ...lesson, title: e.target.value })}
                                    placeholder="اكتب عنوان الدرس..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase px-2 mb-2">
                                    <Layers size={14} className="text-indigo-500" /> وصف مختصر
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 p-4 rounded-2xl text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500/50 transition-all resize-none placeholder:text-gray-400"
                                    value={lesson.description || ''}
                                    onChange={e => setLesson({ ...lesson, description: e.target.value })}
                                    placeholder="وصف قصير للدرس..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase px-2 mb-2">
                                        <Clock size={14} className="text-indigo-500" /> الوقت (بالدقائق)
                                    </label>
                                    <div className="flex items-stretch gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={999}
                                            inputMode="numeric"
                                            className="min-w-0 flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 p-4 rounded-2xl text-gray-900 dark:text-white font-bold text-center outline-none focus:border-indigo-500/50 transition-all placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={parseDurationMinutes(lesson.duration) === '' ? '' : parseDurationMinutes(lesson.duration)}
                                            onChange={e => {
                                                const v = e.target.value;
                                                if (v === '') {
                                                    setLesson({ ...lesson, duration: '' });
                                                    return;
                                                }
                                                const n = parseInt(v, 10);
                                                if (Number.isNaN(n)) return;
                                                const clamped = Math.min(999, Math.max(1, n));
                                                setLesson({ ...lesson, duration: `${clamped} min` });
                                            }}
                                            placeholder="5"
                                        />
                                        <span className="shrink-0 flex items-center px-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] font-black text-gray-500 dark:text-gray-400">
                                            دقيقة
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase px-2 mb-2">
                                        <Sparkles size={14} className="text-indigo-500" /> صعوبة الدرس
                                    </label>
                                    <select
                                        className="w-full cursor-pointer rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white to-gray-50/90 px-4 py-3.5 text-right text-sm font-bold tracking-tight text-gray-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 hover:border-indigo-300/70 hover:shadow-[0_4px_14px_-4px_rgba(99,102,241,0.25)] focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)] dark:border-white/10 dark:from-slate-900 dark:to-slate-950 dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:hover:border-indigo-500/35 dark:hover:shadow-[0_4px_20px_-6px_rgba(99,102,241,0.35)] dark:focus:border-indigo-400 dark:focus:shadow-[0_0_0_3px_rgba(99,102,241,0.22)] [appearance:none] [-webkit-appearance:none] [-moz-appearance:none]"
                                        value={lesson.level ?? ''}
                                        onChange={e => setLesson({ ...lesson, level: e.target.value })}
                                    >
                                        <option value="" className="bg-white py-2 text-gray-600 dark:bg-slate-900 dark:text-gray-300">
                                            — اختر الصعوبة —
                                        </option>
                                        {lesson.level &&
                                            !LESSON_DIFFICULTY_LEVELS.includes(
                                                lesson.level as (typeof LESSON_DIFFICULTY_LEVELS)[number]
                                            ) && (
                                                <option value={lesson.level} className="bg-white dark:bg-slate-900">
                                                    {lesson.level} (قيمة سابقة)
                                                </option>
                                            )}
                                        {LESSON_DIFFICULTY_LEVELS.map((lvl) => (
                                            <option key={lvl} value={lvl} className="bg-white py-2 font-bold dark:bg-slate-900">
                                                {LESSON_DIFFICULTY_LABELS[lvl]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-3 rounded-[2.5rem] border border-gray-100 dark:border-white/10 aspect-video relative group overflow-hidden shadow-xl dark:shadow-2xl transition-colors duration-300">
                        {lesson.image ? (
                            <div className="relative w-full h-full rounded-[1.8rem] overflow-hidden bg-gray-50 dark:bg-slate-900">
                                <img src={resolveMediaUrl(lesson.image)} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35" alt="" aria-hidden="true" />
                                <img src={resolveMediaUrl(lesson.image)} className="relative z-[1] w-full h-full object-contain p-3" alt="Lesson Thumbnail" />
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gray-50 dark:bg-slate-900 rounded-[1.8rem] flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-3 border border-dashed border-gray-200 dark:border-white/5">
                                <ImageIcon size={48} strokeWidth={1} />
                                <span className="text-[10px] font-black uppercase text-gray-300 dark:text-gray-600">No Thumbnail</span>
                            </div>
                        )}
                        <label className={`absolute inset-0 bg-indigo-600/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center ${mediaUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                            <UploadCloud size={40} className="text-white mb-2 animate-bounce" />
                            <span className="text-sm font-black text-white">{mediaUploading ? 'جاري الرفع...' : 'تغيير صورة الغلاف'}</span>
                            <input type="file" className="hidden" accept="image/*" disabled={mediaUploading} onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>

                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        {editorTab === 'content' && (
                            <m.div
                                key="editor-content"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-gray-100 dark:border-white/10 min-h-[750px] flex flex-col overflow-hidden shadow-xl dark:shadow-3xl transition-colors duration-300"
                            >
                                <div className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 p-6 flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">اتجاه الكتابة</span>
                                        <div className="flex bg-white dark:bg-black/40 p-1.5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-inner">
                                            {[
                                                { id: 'auto', label: 'تلقائي' },
                                                { id: 'rtl', label: 'يمين' },
                                                { id: 'ltr', label: 'يسار' }
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => setContentDirection(option.id as 'auto' | 'rtl' | 'ltr')}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${contentDirection === option.id ? 'bg-indigo-50 dark:bg-white text-indigo-600 dark:text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mr-auto text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-100 dark:border-transparent">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        <span>حفظ تلقائي</span>
                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                        <span>{contentReadMinutes > 0 ? `${contentReadMinutes} دقيقة قراءة` : 'جاهز للكتابة'}</span>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 space-y-6">
                                    <div className="relative">
                                        <textarea
                                            dir={contentDir}
                                            className={`w-full min-h-[420px] bg-white dark:bg-slate-950/70 border border-gray-200 dark:border-white/5 p-8 rounded-[2rem] text-lg text-gray-800 dark:text-white/90 outline-none leading-[2] font-medium resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-indigo-500/50 focus:bg-gray-50 dark:focus:bg-slate-950/90 transition-all ${contentAlignClass}`}
                                            placeholder="ابدأ بكتابة محتوى الدرس هنا...\n- فكرة رئيسية\n- شرح\n- أمثلة\n- تمرين"
                                            value={lesson.content || ''}
                                            onChange={e => setLesson({ ...lesson, content: e.target.value })}
                                        />
                                        <div className="absolute bottom-4 left-6 flex flex-wrap items-center gap-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">
                                            <span>كلمات: {contentWordCount}</span>
                                            <span>•</span>
                                            <span>حروف: {contentCharCount}</span>
                                            {contentReadMinutes > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>{contentReadMinutes} دقيقة قراءة</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-100 dark:bg-slate-950/60 border border-gray-200 dark:border-white/5 rounded-[2rem] p-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">المعاينة</h4>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-600 font-bold">تطابق العرض النهائي</span>
                                        </div>
                                        <div dir={contentDir} className={`prose prose-indigo dark:prose-invert max-w-none ${contentAlignClass}`}>
                                            {renderContentPreview()}
                                        </div>
                                    </div>
                                </div>
                            </m.div>
                        )}


                        {editorTab === 'media' && (
                            <m.div
                                key="editor-media"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-4 space-y-4">
                                        {[
                                            { id: 'image', label: 'صورة الدرس', icon: ImageIcon, desc: 'تظهر كواجهة للدرس في القائمة' },
                                            { id: 'video', label: 'فيديو تعليمي', icon: Youtube, desc: 'يدعم روابط YouTube و Vimeo' },
                                            { id: 'audio', label: 'مقطع صوتي', icon: Music, desc: 'لإضافة شروحات صوتية أو نطق' }
                                        ].map(mSub => (
                                            <button
                                                key={mSub.id}
                                                onClick={() => setMediaSubTab(mSub.id as any)}
                                                className={`w-full p-6 rounded-[2.5rem] border-2 text-right transition-all group flex items-start gap-5 ${mediaSubTab === mSub.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40' : 'bg-white dark:bg-white/5 border-transparent dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                                            >
                                                <div className={`p-4 rounded-2xl transition-all ${mediaSubTab === mSub.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-500 group-hover:text-indigo-500'}`}>
                                                    <mSub.icon size={28} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-black text-lg mb-1">{mSub.label}</h4>
                                                    <p className={`text-xs font-bold leading-relaxed ${mediaSubTab === mSub.id ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}`}>{mSub.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="md:col-span-8 bg-white dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-gray-100 dark:border-white/10 p-10 flex flex-col items-center justify-center min-h-[500px] shadow-xl dark:shadow-3xl text-center">
                                        <AnimatePresence mode="wait">
                                            {mediaSubTab === 'image' && (
                                                <m.div key="sub-image" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
                                                    <div className="max-w-md mx-auto aspect-video bg-gray-50 dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative group">
                                                        {lesson.image ? (
                                                            <>
                                                                <img src={resolveMediaUrl(lesson.image)} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35" alt="" aria-hidden="true" />
                                                                <img src={resolveMediaUrl(lesson.image)} className="relative z-[1] w-full h-full object-contain p-3" alt="Preview" />
                                                            </>
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                                                                <ImageIcon size={64} strokeWidth={1} className="mb-4" />
                                                                <p className="font-bold">لم يتم اختيار صورة بعد</p>
                                                            </div>
                                                        )}
                                                        <label className={`absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center ${mediaUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                                                            <UploadCloud size={40} className="text-white mb-4" />
                                                            <span className="bg-white text-black px-6 py-3 rounded-full font-black text-sm">{mediaUploading ? 'جاري الرفع...' : 'رفع صورة جديدة'}</span>
                                                            <input type="file" className="hidden" accept="image/*" disabled={mediaUploading} onChange={handleImageUpload} />
                                                        </label>
                                                    </div>
                                                    <p className="text-gray-400 dark:text-gray-500 text-xs font-bold leading-loose max-w-sm mx-auto">
                                                        يُفضل استخدام صور ذات جودة عالية وبأبعاد 16:9 (مثلاً 1920x1080) لضمان أفضل عرض على كافة الأجهزة.
                                                    </p>
                                                </m.div>
                                            )}

                                            {mediaSubTab === 'video' && (
                                                <m.div key="sub-video" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
                                                    <div className="space-y-4 max-w-xl mx-auto">
                                                        <label className="block text-right text-xs font-black text-gray-400 dark:text-gray-500 uppercase px-4 mb-2">رابط الفيديو أو رفع ملف</label>
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex gap-3 bg-gray-50 dark:bg-slate-950 p-3 rounded-[2rem] border border-gray-200 dark:border-white/10 focus-within:border-red-500/50 transition-all">
                                                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl">
                                                                    <Youtube size={24} />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="أدخل رابط YouTube أو Vimeo هنا..."
                                                                    className="flex-1 bg-transparent border-none text-gray-800 dark:text-white font-bold outline-none placeholder:text-gray-400"
                                                                    value={lesson.videoUrl && !lesson.videoUrl.startsWith('data:') ? lesson.videoUrl : ''}
                                                                    onChange={e => setLesson({ ...lesson, videoUrl: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <label className={`flex items-center justify-center gap-3 w-full py-4 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-gray-400 hover:text-red-500 dark:hover:text-white hover:border-red-500/40 hover:bg-red-500/5 transition-all font-black text-sm ${mediaUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                                                                    <UploadCloud size={20} />
                                                                    {mediaUploading ? 'جاري رفع الفيديو...' : 'أو اختر ملف فيديو من جهازك'}
                                                                    <input type="file" className="hidden" accept="video/*" disabled={mediaUploading} onChange={handleVideoUpload} />
                                                                </label>
                                                                {lesson.videoUrl && !getEmbedUrl(lesson.videoUrl) && (
                                                                    <div className="mt-2 text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full inline-flex items-center gap-2">
                                                                        <CheckCircle size={10} /> ملف فيديو أو رابط مباشر
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {lesson.videoUrl && (
                                                        <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 max-w-2xl mx-auto">
                                                            {getEmbedUrl(lesson.videoUrl) ? (
                                                                <iframe
                                                                    src={getEmbedUrl(lesson.videoUrl)!}
                                                                    className="w-full h-full"
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                ></iframe>
                                                            ) : (
                                                                <video
                                                                    src={resolveMediaUrl(lesson.videoUrl)}
                                                                    controls
                                                                    controlsList="nodownload noplaybackrate"
                                                                    disablePictureInPicture
                                                                    onContextMenu={(event) => event.preventDefault()}
                                                                    className="w-full h-full"
                                                                    onError={(e) => {
                                                                        if (lesson.videoUrl && !getEmbedUrl(lesson.videoUrl)) {
                                                                            console.error("Video load error", e);
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </m.div>
                                            )}

                                            {mediaSubTab === 'audio' && (
                                                <m.div key="sub-audio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
                                                    <div className="space-y-4 max-w-xl mx-auto">
                                                        <label className="block text-right text-xs font-black text-gray-400 dark:text-gray-500 uppercase px-4 mb-2">رابط ملف الصوت أو الرفع من الجهاز</label>
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex gap-3 bg-gray-50 dark:bg-slate-950 p-3 rounded-[2rem] border border-gray-200 dark:border-white/10 focus-within:border-blue-500/50 transition-all">
                                                                <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
                                                                    <Music size={24} />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="أدخل رابط MP3 هنا..."
                                                                    className="flex-1 bg-transparent border-none text-gray-800 dark:text-white font-bold outline-none placeholder:text-gray-400"
                                                                    value={lesson.audioUrl && !lesson.audioUrl.startsWith('data:') ? lesson.audioUrl : ''}
                                                                    onChange={e => setLesson({ ...lesson, audioUrl: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <label className={`flex items-center justify-center gap-3 w-full py-4 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-gray-400 hover:text-blue-500 dark:hover:text-white hover:border-blue-500/40 hover:bg-blue-500/5 transition-all font-black text-sm ${mediaUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                                                                    <UploadCloud size={20} />
                                                                    {mediaUploading ? 'جاري رفع الصوت...' : 'أو اختر ملف صوتي من جهازك'}
                                                                    <input type="file" className="hidden" accept="audio/*" disabled={mediaUploading} onChange={handleAudioUpload} />
                                                                </label>
                                                                {lesson.audioUrl && !lesson.audioUrl.startsWith('data:') && (
                                                                    <div className="mt-2 text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full inline-flex items-center gap-2">
                                                                        <CheckCircle size={10} /> ملف صوتي مربوط بالرابط
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {lesson.audioUrl && (
                                                        <div className="max-w-md mx-auto p-8 bg-blue-50 dark:bg-blue-600/5 rounded-[2.5rem] border border-blue-200 dark:border-blue-500/20 shadow-xl overflow-hidden">
                                                            <audio controls className="w-full accent-blue-600" src={resolveMediaUrl(lesson.audioUrl)}></audio>
                                                            <p className="text-[10px] font-black text-blue-500 uppercase mt-4">معاينة الصوت المباشرة</p>
                                                        </div>
                                                    )}
                                                </m.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </m.div>
                        )}


                        {editorTab === 'quiz' && (
                            <m.div
                                key="editor-quiz"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
                            >
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <ClipboardList size={16} className="text-indigo-500" /> أسئلة الدرس ({(lesson.questions?.length || 0)})
                                        </h4>
                                    </div>

                                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 no-scrollbar">
                                        {lesson.questions?.map((q, idx) => (
                                            <m.div
                                                layout
                                                key={q.id}
                                                className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 flex gap-6 group items-start hover:border-indigo-500/30 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-lg dark:shadow-xl"
                                            >
                                                <div className="w-12 h-12 bg-gray-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-indigo-500 border border-gray-200 dark:border-white/5 shadow-inner shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20 uppercase">
                                                                {q.type}
                                                            </span>
                                                            {q.mediaType && q.mediaType !== 'none' && (
                                                                <span className="text-[9px] font-black bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400 px-3 py-1 rounded-full border border-pink-200 dark:border-pink-500/20 uppercase flex items-center gap-1">
                                                                    {q.mediaType === 'image' && <ImageIcon size={10} />}
                                                                    {q.mediaType === 'video' && <Video size={10} />}
                                                                    {q.mediaType === 'audio' && <Music size={10} />}
                                                                    <span>مرفق</span>
                                                                </span>
                                                            )}
                                                            {q.explanation && (
                                                                <span className="text-[9px] font-black bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400 px-3 py-1 rounded-full border border-green-200 dark:border-green-500/20 uppercase">
                                                                    شرح
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveQuestionFromLesson(q.id)}
                                                            className="p-2 bg-gray-100 dark:bg-slate-900 rounded-lg text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="font-bold text-gray-700 dark:text-gray-100 leading-relaxed text-lg line-clamp-2">{q.text}</p>
                                                </div>
                                            </m.div>
                                        ))}
                                        {(!lesson.questions || lesson.questions.length === 0) && (
                                            <div className="text-center py-32 bg-gray-50/50 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/5 flex flex-col items-center justify-center gap-6">
                                                <div className="w-20 h-20 bg-white dark:bg-white/5 rounded-full flex items-center justify-center shadow-sm">
                                                    <HelpCircle className="text-gray-300 dark:text-gray-600" size={40} strokeWidth={1} />
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 dark:text-gray-400 font-black text-xl mb-2">لا توجد أسئلة تفاعلية</p>
                                                    <p className="text-gray-500 dark:text-gray-600 text-sm font-bold">ابدأ بإضافة أول سؤال من القائمة الجانبية</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <div className="lg:col-span-7 bg-white dark:bg-gray-50/5 p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 space-y-8 shadow-xl dark:shadow-none">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/50">
                                            <Plus size={28} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-2xl text-gray-900 dark:text-white">إضافة عنصر تفاعلي جديد</h4>
                                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">أسئلة، شروحات، أو وسائط</p>
                                        </div>
                                    </div>

                                    <QuestionForm
                                        question={newQuestion}
                                        onChange={setNewQuestion}
                                        onDelete={() => setNewQuestion({ type: 'multiple-choice', options: ['', '', '', ''], text: '', correctAnswer: '' })}
                                    />

                                    <button
                                        onClick={handleAddQuestionToLesson}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 hover:shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                                    >
                                        <CheckCircle size={22} className="text-indigo-200" />
                                        <span>إضافة العنصر للدرس</span>
                                    </button>
                                </div>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </m.div>
    );
};
