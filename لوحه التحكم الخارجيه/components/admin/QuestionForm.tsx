
import React, { useState } from 'react';
import { Question, QuestionType } from '../../types';
import {
    CheckCircle, Circle, Type, CheckSquare, ListOrdered, AlignLeft,
    Trash2, Plus, Image as ImageIcon, UploadCloud, X, Video, Music,
    BookOpen, HelpCircle, FileText, Settings, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminAPI } from '../../services/apiClient';

interface QuestionFormProps {
    question: Partial<Question>;
    onChange: (q: Partial<Question>) => void;
    onDelete?: () => void;
}

const QUESTION_TYPES: { id: QuestionType; label: string; icon: any; description: string }[] = [
    { id: 'multiple-choice', label: 'اختيار من متعدد', icon: CheckCircle, description: 'سؤال مع خيارات متعددة وإجابة واحدة صحيحة' },
    { id: 'true-false', label: 'صح أو خطأ', icon: Circle, description: 'سؤال نعم/لا بسيط' },
    { id: 'text-input', label: 'إجابة نصية', icon: Type, description: 'كتابة الإجابة الصحيحة يدوياً' },
    { id: 'order', label: 'ترتيب كلمات', icon: ListOrdered, description: 'ترتيب الكلمات لتكوين جملة' },
    { id: 'note', label: 'شرح / ملاحظة', icon: BookOpen, description: 'شريحة معلوماتية (نص، صورة، فيديو) بدون سؤال' },
];

export const QuestionForm: React.FC<QuestionFormProps> = ({ question, onChange, onDelete }) => {
    const [mediaUploading, setMediaUploading] = useState(false);
    const currentType: QuestionType = question.type || 'multiple-choice';

    const handleTypeChange = (type: QuestionType) => {
        const nextQuestion: Partial<Question> = {
            ...question,
            type,
            options: (type === 'multiple-choice' || type === 'order') ? ['', '', '', ''] : undefined,
            correctAnswer: type === 'true-false' ? 'true' : ''
        };
        onChange(nextQuestion);
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const max =
            type === 'image' ? 5 * 1024 * 1024 : type === 'video' ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
        if (file.size > max) {
            window.alert(type === 'image' ? 'الصورة كبيرة (حد أقصى 5 ميجا)' : type === 'video' ? 'الفيديو كبير (حد أقصى 100 ميجا)' : 'الصوت كبير (حد أقصى 20 ميجا)');
            return;
        }
        setMediaUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('kind', type);
            const { url } = await AdminAPI.uploadMedia(fd);
            onChange({
                ...question,
                mediaType: type,
                mediaUrl: url,
                image: type === 'image' ? url : question.image,
            });
        } catch (err: any) {
            window.alert(err?.message || 'فشل رفع الملف');
        } finally {
            setMediaUploading(false);
        }
    };

    const renderTypeSelector = () => (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
            {QUESTION_TYPES.map(t => (
                <button
                    key={t.id}
                    onClick={() => handleTypeChange(t.id)}
                    className={`flex flex-col items-center justify-center p-3 min-w-[100px] rounded-xl border transition-all text-center gap-2 ${question.type === t.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                >
                    <t.icon size={20} />
                    <span className="text-[10px] font-bold whitespace-nowrap">{t.label}</span>
                </button>
            ))}
        </div>
    );

    const renderMediaSection = () => (
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-indigo-500 dark:text-indigo-400" /> الوسائط المرفقة
            </h4>

            <div className="grid grid-cols-3 gap-2">
                {[
                    { type: 'image', label: 'صورة', icon: ImageIcon },
                    { type: 'video', label: 'فيديو', icon: Video },
                    { type: 'audio', label: 'صوت', icon: Music },
                ].map((m) => (
                    <label key={m.type} className={`flex flex-col items-center justify-center gap-2 p-3 h-20 rounded-xl border-2 border-dashed transition-all ${mediaUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'} ${question.mediaType === m.type ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 text-gray-400'}`}>
                        <m.icon size={20} />
                        <span className="text-[10px] font-bold">{mediaUploading ? '...' : m.label}</span>
                        <input
                            type="file"
                            accept={`${m.type}/*`}
                            className="hidden"
                            disabled={mediaUploading}
                            onChange={(e) => handleMediaUpload(e, m.type as any)}
                        />
                    </label>
                ))}
            </div>

            {question.mediaUrl && (
                <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-900 shadow-sm group">
                    <button
                        onClick={() => onChange({ ...question, mediaUrl: undefined, mediaType: 'none', image: undefined })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                        <X size={14} />
                    </button>

                    {question.mediaType === 'image' && <img src={question.mediaUrl} className="w-full h-48 object-cover" />}
                    {question.mediaType === 'video' && <video src={question.mediaUrl} controls className="w-full h-48 bg-black" />}
                    {question.mediaType === 'audio' && (
                        <div className="p-6 flex flex-col items-center justify-center gap-4 h-32 bg-indigo-50 dark:bg-indigo-900/20">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                                <Music size={24} />
                            </div>
                            <audio src={question.mediaUrl} controls className="w-full h-8" />
                        </div>
                    )}
                </div>
            )}

            {!question.mediaUrl && (
                <div className="relative">
                    <input
                        type="text"
                        placeholder="أو ضع رابط مباشر (URL)"
                        value={question.mediaUrl || ''}
                        onChange={(e) => onChange({ ...question, mediaUrl: e.target.value, mediaType: question.mediaType || 'image' })}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-center focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                    />
                </div>
            )}
        </div>
    );

    const renderOptions = () => {
        if (currentType === 'note') return (
            <div className="text-center py-12 p-6 text-gray-500 dark:text-gray-400 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border-2 border-dashed border-indigo-100 dark:border-indigo-900/30">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-50 dark:border-indigo-900/20">
                    <BookOpen size={32} className="text-indigo-400" />
                </div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">شريحة معلوماتية</h4>
                <p className="text-xs max-w-xs mx-auto">سيتم عرض المحتوى والوسائط فقط للمستخدم كشرح أو ملاحظة بين الأسئلة.</p>
            </div>
        );

        if (currentType === 'true-false') return (
            <div className="flex gap-4">
                <button
                    onClick={() => onChange({ ...question, correctAnswer: 'true' })}
                    className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${String(question.correctAnswer) === 'true' ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    <CheckCircle size={24} />
                    صح (True)
                </button>
                <button
                    onClick={() => onChange({ ...question, correctAnswer: 'false' })}
                    className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${String(question.correctAnswer) === 'false' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    <X size={24} />
                    خطأ (False)
                </button>
            </div>
        );

        if (currentType === 'text-input' || currentType === 'open') return (
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">الإجابة النموذجية المتوقعة</label>
                <input
                    type="text"
                    value={String(question.correctAnswer || '')}
                    onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-bold text-right text-gray-900 dark:text-gray-100"
                    placeholder="اكتب الإجابة هنا..."
                />
                <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <Sparkles size={10} />
                    سيتم استخدام هذه الإجابة للمطابقة والتحقق التلقائي
                </p>
            </div>
        );

        // Multiple Choice & Order
        return (
            <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <ListOrdered size={14} />
                        {currentType === 'order' ? 'كلمات الجملة (بالترتيب)' : 'الخيارات المتاحة'}
                    </label>
                    {currentType === 'order' && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id={`split-${question.id || 'new'}`}
                                className="w-40 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 text-gray-700 dark:text-gray-200"
                                placeholder="لصق جملة كاملة..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.currentTarget as HTMLInputElement).value;
                                        if (val) {
                                            const words = val.split(' ').filter(w => w);
                                            onChange({ ...question, options: words, correctAnswer: words });
                                            (e.currentTarget as HTMLInputElement).value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    {question.options?.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 group">
                            {currentType === 'multiple-choice' && (
                                <button
                                    onClick={() => onChange({ ...question, correctAnswer: opt })}
                                    className={`w-10 flex items-center justify-center rounded-xl border transition-all ${question.correctAnswer === opt && opt !== '' ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-300 dark:text-gray-600 hover:border-gray-300 dark:hover:border-slate-500'}`}
                                    title="تحديد كإجابة صحيحة"
                                >
                                    <CheckCircle size={18} />
                                </button>
                            )}

                            <div className="flex-1 relative">
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 dark:text-gray-600 select-none">
                                    {idx + 1}
                                </span>
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                        const newOpts = [...(question.options || [])];
                                        newOpts[idx] = e.target.value;

                                        // Update Correct Answer sync
                                        let newCorrect = question.correctAnswer;
                                        if (currentType === 'multiple-choice' && question.correctAnswer === opt) newCorrect = e.target.value;
                                        if (currentType === 'order') newCorrect = newOpts;

                                        onChange({ ...question, options: newOpts, correctAnswer: currentType === 'multiple-choice' ? newCorrect : newOpts });
                                    }}
                                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3 pr-8 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-bold text-sm text-gray-900 dark:text-gray-100"
                                    placeholder={`خيار رقم ${idx + 1}`}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    const newOpts = question.options?.filter((_, i) => i !== idx);
                                    onChange({ ...question, options: newOpts });
                                }}
                                className="w-10 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onChange({ ...question, options: [...(question.options || []), ''] })}
                    className="w-full py-3 mt-2 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> إضافة خيار جديد
                </button>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/50 dark:shadow-black/20 relative" dir="rtl">
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="absolute top-4 left-4 p-2 bg-white dark:bg-slate-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm border border-gray-100 dark:border-slate-700 z-10"
                >
                    <Trash2 size={18} />
                </button>
            )}

            {/* Type Selector */}
            {renderTypeSelector()}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                            {currentType === 'note' ? 'عنوان الشرح' : 'نص السؤال'}
                        </label>
                        <textarea
                            value={question.text || ''}
                            onChange={(e) => onChange({ ...question, text: e.target.value })}
                            className="w-full bg-white dark:bg-slate-950/50 border border-gray-200 dark:border-slate-700 p-5 rounded-2xl text-lg font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all min-h-[140px] resize-none shadow-inner text-gray-900 dark:text-gray-100"
                            placeholder={currentType === 'note' ? 'اكتب عنواناً جذاباً...' : 'اكتب سؤالك هنا بوضوح...'}
                        />
                    </div>

                    {renderOptions()}

                    {currentType !== 'note' && (
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                                <HelpCircle size={14} />
                                شرح الإجابة (اختياري)
                            </label>
                            <input
                                type="text"
                                value={question.explanation || ''}
                                onChange={(e) => onChange({ ...question, explanation: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-sm text-gray-600 dark:text-gray-300"
                                placeholder="توضيح يظهر للطالب بعد الإجابة..."
                            />
                        </div>
                    )}
                </div>

                {/* Sidebar: Media */}
                <div className="w-full lg:w-72 space-y-4">
                    {renderMediaSection()}

                    <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-sm">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">تلميح ذكي</h5>
                                <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                    {currentType === 'note'
                                        ? 'استخدم هذه الشريحة لتقديم محتوى تعليمي قبل الاختبار.'
                                        : 'إضافة وسائط للسؤال تزيد من تفاعل الطلاب بنسبة 40%.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
