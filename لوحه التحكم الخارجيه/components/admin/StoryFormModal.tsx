
import React from 'react';
import { AlignLeft, AlignRight, BookOpen, Languages, X, Image as ImageIcon, UploadCloud, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Story } from '../../types';
import { UploadProgressBar } from './UploadProgressBar';

type TextDirection = 'auto' | 'rtl' | 'ltr';

interface StoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    story: Partial<Story>;
    setStory: (story: Partial<Story>) => void;
    onSave: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploadingImage?: boolean;
    uploadProgress?: number;
    uploadFileName?: string;
    storyLang: 'en' | 'de';
    setStoryLang: (lang: 'en' | 'de') => void;
    t: any;
}

export const StoryFormModal: React.FC<StoryFormModalProps> = ({
    isOpen,
    onClose,
    story,
    setStory,
    onSave,
    onImageUpload,
    isUploadingImage = false,
    uploadProgress = 0,
    uploadFileName,
    storyLang,
    setStoryLang,
    t
}) => {
    if (!isOpen) return null;
    const labels = t.admin.stories;
    const tagsValue = (story.tags || []).join(', ');

    const parseOptionalNumber = (value: string) => {
        if (!value.trim()) return undefined;
        const num = Number(value);
        return Number.isFinite(num) ? num : undefined;
    };

    const parseOptionalInt = (value: string) => {
        const num = parseOptionalNumber(value);
        if (num === undefined) return undefined;
        return Math.max(0, Math.round(num));
    };

    const parseDifficulty = (value: string) => {
        const num = parseOptionalNumber(value);
        if (num === undefined) return undefined;
        return Math.min(10, Math.max(1, Math.round(num)));
    };

    const contentDirection: TextDirection = story.contentDirection || 'auto';
    const translationDirection: TextDirection = story.translationDirection || 'auto';
    const directionOptions: Array<{ id: TextDirection; label: string; icon: React.ReactNode }> = [
        { id: 'auto', label: 'تلقائي', icon: <Languages size={14} /> },
        { id: 'rtl', label: 'RTL', icon: <AlignRight size={14} /> },
        { id: 'ltr', label: 'LTR', icon: <AlignLeft size={14} /> },
    ];
    const textDirectionValue = (direction: TextDirection) => (direction === 'auto' ? 'auto' : direction);
    const textAlignClass = (direction: TextDirection) => (
        direction === 'rtl' ? 'text-right' : direction === 'ltr' ? 'text-left' : 'text-start'
    );
    const renderDirectionControl = (
        title: string,
        value: TextDirection,
        onChange: (direction: TextDirection) => void
    ) => (
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{title}</div>
            <div className="grid grid-cols-3 gap-2">
                {directionOptions.map(option => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onChange(option.id)}
                        className={`h-10 rounded-xl text-[10px] font-black border transition-all inline-flex items-center justify-center gap-1.5 ${value === option.id
                            ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20'
                            : 'bg-slate-900 border-white/5 text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {option.icon}
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#0B0D17]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-slate-900 w-full max-w-2xl rounded-[3rem] p-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col"
            >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">{story.id ? labels.editTitle : labels.newTitle}</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{labels.formSubtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 group" aria-label={labels.close}>
                        <X className="text-gray-400 group-hover:rotate-90 transition-transform" size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="text-xs font-black text-gray-400">لغة القصة</div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStoryLang('en')}
                                className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${storyLang === 'en'
                                    ? 'bg-red-600 border-red-500 text-white'
                                    : 'bg-slate-900 border-white/5 text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                🇺🇸 English
                            </button>
                            <button
                                type="button"
                                onClick={() => setStoryLang('de')}
                                className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${storyLang === 'de'
                                    ? 'bg-red-600 border-red-500 text-white'
                                    : 'bg-slate-900 border-white/5 text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                🇩🇪 German
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.titleLabel}</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                                    placeholder={labels.titlePlaceholder}
                                    value={story.title || ''}
                                    onChange={e => setStory({ ...story, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.levelLabel}</label>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                                            <button
                                                key={lvl}
                                                onClick={() => {
                                                    setStory({ ...story, level: lvl, subLevel: `${lvl}.1` });
                                                }}
                                                className={`py-3 rounded-xl text-xs font-black border transition-all ${story.level === lvl ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20' : 'bg-slate-900 border-white/5 text-gray-500 hover:text-gray-300'}`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>

                                    {story.level && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(story.level) && (
                                        <div className="flex gap-2 p-2 bg-slate-950/50 rounded-xl border border-white/5 justify-center">
                                            {[`${story.level}.1`, `${story.level}.2`].map(sub => (
                                                <button
                                                    key={sub}
                                                    onClick={() => setStory({ ...story, subLevel: sub })}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border ${story.subLevel === sub ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
                                                >
                                                    {sub}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.imageLabel}</label>
                            <motion.div
                                whileHover={{ scale: isUploadingImage ? 1 : 1.02 }}
                                className="bg-white/5 rounded-3xl border border-white/5 aspect-video relative group overflow-hidden cursor-pointer"
                            >
                                {story.image ? (
                                    <>
                                        <img src={story.image} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40" alt="" aria-hidden="true" />
                                        <img src={story.image} className="relative z-10 w-full h-full object-contain p-3" alt="" />
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                                        <ImageIcon size={40} className="mb-2" />
                                        <span className="text-xs font-bold">{labels.imageEmpty}</span>
                                    </div>
                                )}
                                {!isUploadingImage && (
                                    <label className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                        <UploadCloud size={32} className="text-white mb-2" />
                                        <span className="text-sm font-black text-white">{story.image ? labels.imageChange : labels.imageUpload}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                                    </label>
                                )}
                                {isUploadingImage && (
                                    <label className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer">
                                        <UploadCloud size={28} className="text-white mb-2 animate-pulse" />
                                        <span className="text-xs font-black text-white">جاري الرفع...</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} disabled />
                                    </label>
                                )}
                            </motion.div>
                            {isUploadingImage && (
                                <UploadProgressBar
                                    progress={uploadProgress}
                                    fileName={uploadFileName}
                                    done={uploadProgress >= 100}
                                />
                            )}
                            <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-tight">{labels.imageHint}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.descriptionLabel}</label>
                        <textarea
                            dir="auto"
                            className="w-full bg-slate-900 border border-white/5 p-5 rounded-3xl text-white font-language font-bold outline-none focus:border-red-500/50 transition-all min-h-[80px] placeholder:text-gray-800"
                            placeholder={labels.descriptionPlaceholder}
                            value={story.description || ''}
                            onChange={e => setStory({ ...story, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderDirectionControl('اتجاه محتوى القصة', contentDirection, (direction) => setStory({ ...story, contentDirection: direction }))}
                        {renderDirectionControl('اتجاه الترجمة', translationDirection, (direction) => setStory({ ...story, translationDirection: direction }))}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.contentLabel}</label>
                        <textarea
                            dir={textDirectionValue(contentDirection)}
                            className={`w-full bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-white font-language font-medium outline-none focus:border-red-500/50 transition-all min-h-[250px] placeholder:text-gray-800 leading-relaxed ${textAlignClass(contentDirection)}`}
                            placeholder={labels.contentPlaceholder}
                            value={story.content || ''}
                            onChange={e => setStory({ ...story, content: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-red-500/60 uppercase tracking-widest mb-3 mr-2">{labels.translationLabel}</label>
                        <textarea
                            dir={textDirectionValue(translationDirection)}
                            className={`w-full bg-white/5 border border-white/5 p-6 rounded-[2.5rem] text-white font-language font-medium outline-none focus:border-red-500/50 transition-all min-h-[200px] placeholder:text-gray-800 leading-relaxed ${textAlignClass(translationDirection)}`}
                            placeholder={labels.translationPlaceholder}
                            value={story.translation || ''}
                            onChange={e => setStory({ ...story, translation: e.target.value })}
                        />
                    </div>

                    <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{labels.extraFields}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.tagsLabel}</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                                    placeholder={labels.tagsPlaceholder}
                                    value={tagsValue}
                                    onChange={(e) => {
                                        const nextTags = e.target.value
                                            .split(',')
                                            .map(tag => tag.trim())
                                            .filter(Boolean);
                                        setStory({ ...story, tags: nextTags });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.wordCountLabel}</label>
                                <input
                                    type="number"
                                    min={0}
                                    className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                                    value={story.wordCount ?? ''}
                                    onChange={(e) => setStory({ ...story, wordCount: parseOptionalInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.readingTimeLabel}</label>
                                <input
                                    type="number"
                                    min={0}
                                    className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                                    value={story.estimatedReadingTime ?? ''}
                                    onChange={(e) => setStory({ ...story, estimatedReadingTime: parseOptionalInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.difficultyLabel}</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                                    value={story.difficulty ?? ''}
                                    onChange={(e) => setStory({ ...story, difficulty: parseDifficulty(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">{labels.viewCountLabel}</label>
                                <input
                                    type="number"
                                    min={0}
                                    className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                                    value={story.viewCount ?? ''}
                                    onChange={(e) => setStory({ ...story, viewCount: parseOptionalInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white/5 border-t border-white/5">
                    <button
                        onClick={onSave}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-red-900/40 active:scale-95 transition-all text-xl flex items-center justify-center gap-3"
                    >
                        <Save size={24} />
                        <span>{story.id ? labels.saveEdit : labels.saveNew}</span>
                    </button>
                </div>

                <div className="hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">{story.id ? 'تحرير القصة' : 'إضافة قصة جديدة'}</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Story Information</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 group">
                        <X className="text-gray-400 group-hover:rotate-90 transition-transform" size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">عنوان القصة</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                                    placeholder="أدخل عنواناً جذاباً..."
                                    value={story.title || ''}
                                    onChange={e => setStory({ ...story, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">المستوى</label>
                                <div className="space-y-4">
                                    {/* Main Levels */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                                            <button
                                                key={lvl}
                                                onClick={() => {
                                                    setStory({ ...story, level: lvl, subLevel: `${lvl}.1` }); // Default to .1
                                                }}
                                                className={`py-3 rounded-xl text-xs font-black border transition-all ${story.level === lvl ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20' : 'bg-slate-900 border-white/5 text-gray-500 hover:text-gray-300'}`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Sub Levels (only show if a CEFR level is selected) */}
                                    {story.level && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(story.level) && (
                                        <div className="flex gap-2 p-2 bg-slate-950/50 rounded-xl border border-white/5 justify-center">
                                            {[`${story.level}.1`, `${story.level}.2`].map(sub => (
                                                <button
                                                    key={sub}
                                                    onClick={() => setStory({ ...story, subLevel: sub })}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border ${story.subLevel === sub ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
                                                >
                                                    {sub}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">صورة القصة</label>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-white/5 rounded-3xl border border-white/5 aspect-video relative group overflow-hidden cursor-pointer"
                            >
                                {story.image ? (
                                    <img src={story.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                                        <ImageIcon size={40} className="mb-2" />
                                        <span className="text-xs font-bold">اضغط لرفع صورة</span>
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                    <UploadCloud size={32} className="text-white mb-2" />
                                    <span className="text-sm font-black text-white">{story.image ? 'تغيير الصورة' : 'رفع صورة'}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                                </label>
                            </motion.div>
                            <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-tight">Image will be used as a background banner</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">وصف قصير</label>
                        <textarea
                            className="w-full bg-slate-900 border border-white/5 p-5 rounded-3xl text-white font-bold outline-none focus:border-red-500/50 transition-all min-h-[80px] placeholder:text-gray-800"
                            placeholder="اكتب وصفاً مختصراً للقصة يظهر في القائمة..."
                            value={story.description || ''}
                            onChange={e => setStory({ ...story, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">المحتوى التعليمي (Markdown)</label>
                        <textarea
                            className="w-full bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-white font-medium outline-none focus:border-red-500/50 transition-all min-h-[250px] placeholder:text-gray-800 leading-relaxed"
                            placeholder="ابدأ بكتابة القصة هنا..."
                            value={story.content || ''}
                            onChange={e => setStory({ ...story, content: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-red-500/60 uppercase tracking-widest mb-3 mr-2 font-black">ترجمة القصة (إختياري)</label>
                        <textarea
                            className="w-full bg-white/5 border border-white/5 p-6 rounded-[2.5rem] text-white font-medium outline-none focus:border-red-500/50 transition-all min-h-[200px] placeholder:text-gray-800 leading-relaxed"
                            placeholder="اكتب ترجمة القصة هنا لتظهر للطلاب..."
                            value={story.translation || ''}
                            onChange={e => setStory({ ...story, translation: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-8 bg-white/5 border-t border-white/5">
                    <button
                        onClick={onSave}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-red-900/40 active:scale-95 transition-all text-xl flex items-center justify-center gap-3"
                    >
                        <Save size={24} />
                        <span>{story.id ? 'حفظ التغييرات' : 'نشر القصّة الجديدة'}</span>
                    </button>
                </div>
            </div>
            </motion.div>
        </div>
    );
};
