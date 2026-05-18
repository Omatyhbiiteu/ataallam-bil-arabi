import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Trash2, Edit2, Eye, CheckCircle, X, Save, Image as ImageIcon, BookOpen, HelpCircle,
    Plane, Coffee, ShoppingBag, Heart, Home, Briefcase, Car, Music, Utensils, Stethoscope, Landmark,
    Camera, Monitor, Smartphone, MessageCircle, Map as MapIcon, Calendar, Clock, Sun, Moon, Cloud,
    Thermometer, Shield, Gift
} from 'lucide-react';
import { SentenceTopic, Question, QuestionType } from '../../types';
import { QuestionForm } from './QuestionForm';
import { AdminLang } from './AdminSidebar';
import { AdminAPI } from '../../services/apiClient';
import { db } from '../../services/db';
import { SentenceTopicPreviewModal } from './SentenceTopicPreviewModal';
import { ConfirmModal } from '../ConfirmModal';
import { UploadProgressBar } from './UploadProgressBar';

interface AdminSentencesViewProps {
    topics: SentenceTopic[];
    setTopics: React.Dispatch<React.SetStateAction<SentenceTopic[]>>;
    t: any;
    adminLang?: AdminLang;
    /** يُستخدم عندما تكون وجهة الحفظ «كلاهما» لاختيار مسار الـ API الافتراضي */
    learningLang: 'en' | 'de';
}

export const AdminSentencesView: React.FC<AdminSentencesViewProps> = ({ topics, setTopics, t, adminLang = 'both', learningLang }) => {
    /** لغة الحفظ على الخادم: تتبع «وجهة الحفظ» في الشريط (DE/EN). بدون هذا يبقى learningLang غالباً en لأن لوحة المسئول تعمل بدون مستخدم مسجّل. */
    const storageLang: 'en' | 'de' = adminLang === 'both' ? learningLang : adminLang;
    /** عند EN أو DE فقط: القائمة مقفولة وتتبع وجهة الحفظ */
    const langDropdownLocked = adminLang === 'en' || adminLang === 'de';

    const [isEditing, setIsEditing] = useState(false);
    const [currentTopic, setCurrentTopic] = useState<Partial<SentenceTopic>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [mediaUploading, setMediaUploading] = useState(false);
    const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
    const [mediaUploadFileName, setMediaUploadFileName] = useState<string | undefined>();
    const [sentenceAudioUploadIdx, setSentenceAudioUploadIdx] = useState<number | null>(null);
    const [sentenceAudioProgress, setSentenceAudioProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const [previewTopic, setPreviewTopic] = useState<SentenceTopic | null>(null);
    const [topicIdToDelete, setTopicIdToDelete] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    useEffect(() => {
        if (!isEditing || !langDropdownLocked) return;
        setCurrentTopic(prev => ({ ...prev, sentenceLang: storageLang }));
    }, [isEditing, langDropdownLocked, storageLang, adminLang]);

    const effectiveSentenceLangValue: 'en' | 'de' | 'both' = langDropdownLocked
        ? storageLang
        : (currentTopic.sentenceLang === 'en' || currentTopic.sentenceLang === 'de' || currentTopic.sentenceLang === 'both')
            ? currentTopic.sentenceLang
            : 'both';

    const GRADIENTS = [
        { class: 'from-blue-500 to-indigo-500', name: 'أزرق/نيلي' },
        { class: 'from-amber-400 to-orange-500', name: 'كهرماني/برتقالي' },
        { class: 'from-emerald-400 to-teal-500', name: 'زمردي/فيروزي' },
        { class: 'from-purple-500 to-fuchsia-500', name: 'بنفسجي/فوشيا' },
        { class: 'from-rose-400 to-red-500', name: 'وردي/أحمر' },
        { class: 'from-sky-400 to-blue-500', name: 'سماوي/أزرق' },
        { class: 'from-indigo-900 to-purple-900', name: 'ليلي مظلم' },
        { class: 'from-gray-700 to-gray-900', name: 'رمادي داكن' },
    ];

    const ICONS = [
        { name: 'BookOpen', icon: BookOpen, label: 'كتاب' },
        { name: 'Plane', icon: Plane, label: 'طائرة' },
        { name: 'Coffee', icon: Coffee, label: 'قهوة' },
        { name: 'Utensils', icon: Utensils, label: 'مطعم' },
        { name: 'ShoppingBag', icon: ShoppingBag, label: 'تسوق' },
        { name: 'Home', icon: Home, label: 'منزل' },
        { name: 'Briefcase', icon: Briefcase, label: 'عمل' },
        { name: 'Car', icon: Car, label: 'سيارة' },
        { name: 'Music', icon: Music, label: 'موسيقى' },
        { name: 'Stethoscope', icon: Stethoscope, label: 'طبيب' },
        { name: 'Landmark', icon: Landmark, label: 'مبنى / دائرة' },
        { name: 'MessageCircle', icon: MessageCircle, label: 'محادثة' },
        { name: 'Map', icon: MapIcon, label: 'خريطة' },
        { name: 'Calendar', icon: Calendar, label: 'تقويم' },
        { name: 'Clock', icon: Clock, label: 'وقت' }
    ];

    const normalizeSubLevel = (level?: string, subLevel?: string) => {
        if (!level) return subLevel || 'A1.1';
        const prefix = `${level}.`;
        return subLevel && subLevel.startsWith(prefix) ? subLevel : `${level}.1`;
    };

    /** كل سؤال يحتاج معرفاً ثابتاً للحفظ والحذف؛ بيانات قديمة قد تكون بلا id */
    const normalizeQuizQuestions = (list: Question[] | undefined): Question[] =>
        (list || []).map((q) => ({
            ...q,
            id: q.id && String(q.id).trim() ? q.id : crypto.randomUUID(),
        }));

    const filteredTopics = topics.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const refreshTopicsFromServer = useCallback(async () => {
        const [enRes, deRes] = await Promise.all([
            AdminAPI.getSentenceTopics('en'),
            AdminAPI.getSentenceTopics('de'),
        ]);
        const enTopics = Array.isArray((enRes as any)?.topics) ? (enRes as any).topics as SentenceTopic[] : [];
        const deTopics = Array.isArray((deRes as any)?.topics) ? (deRes as any).topics as SentenceTopic[] : [];
        await db.save('sentence_topics', enTopics, 'en');
        await db.save('sentence_topics', deTopics, 'de');
        setTopics(storageLang === 'de' ? deTopics : enTopics);
    }, [storageLang, setTopics]);

    const placeholderLang: 'en' | 'de' | 'both' = langDropdownLocked
        ? storageLang
        : (currentTopic.sentenceLang === 'en' || currentTopic.sentenceLang === 'de' || currentTopic.sentenceLang === 'both')
            ? currentTopic.sentenceLang
            : 'both';

    const originalSentencePlaceholder =
        placeholderLang === 'both'
            ? 'اكتب الجملة (ألماني أو إنجليزي حسب المحتوى)'
            : placeholderLang === 'en'
                ? 'اكتب الجملة بالإنجليزي'
                : 'اكتب الجملة بالألماني';

    const handleSaveParams = async () => {
        if (!currentTopic.title || !currentTopic.level) return;

        const normalizedSubLevel = normalizeSubLevel(currentTopic.level, currentTopic.subLevel);
        const resolvedSentenceLang: 'en' | 'de' | 'both' = langDropdownLocked
            ? storageLang
            : (currentTopic.sentenceLang === 'en' || currentTopic.sentenceLang === 'de' || currentTopic.sentenceLang === 'both')
                ? currentTopic.sentenceLang
                : 'both';

        const payload = {
            title: currentTopic.title,
            description: currentTopic.description || '',
            level: currentTopic.level,
            subLevel: normalizedSubLevel,
            sentenceLang: resolvedSentenceLang,
            image: currentTopic.image || 'from-blue-500 to-indigo-500',
            icon: currentTopic.icon || 'BookOpen',
            color: currentTopic.color || 'blue',
            mediaType: (currentTopic.mediaType || 'none') as 'none' | 'image' | 'video',
            mediaUrl: currentTopic.mediaUrl || null,
            sentences: currentTopic.sentences || [],
            grammarNotes: currentTopic.grammarNotes || null,
            quizQuestions: currentTopic.quizQuestions || [],
            isActive: true,
        };

        setSaving(true);
        setPageError(null);
        try {
            if (currentTopic.id) {
                await AdminAPI.updateSentenceTopic(storageLang, currentTopic.id, payload);
            } else {
                const id = crypto.randomUUID();
                await AdminAPI.createSentenceTopic(storageLang, { ...payload, id });
            }
            await refreshTopicsFromServer();
            setIsEditing(false);
            setCurrentTopic({});
        } catch (e: any) {
            setPageError(e?.message || 'فشل حفظ الموضوع على الخادم. تأكد من تسجيل دخول المسئول.');
        } finally {
            setSaving(false);
        }
    };

    const runDeleteTopic = async (id: string) => {
        setSaving(true);
        setPageError(null);
        try {
            await AdminAPI.deleteSentenceTopic(storageLang, id);
            await refreshTopicsFromServer();
        } catch (e: any) {
            setPageError(e?.message || 'فشل حذف الموضوع من الخادم');
        } finally {
            setSaving(false);
        }
    };

    const handleTopicMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !currentTopic.mediaType || currentTopic.mediaType === 'none') return;
        const sl = currentTopic.sentenceLang;
        const uploadLang = (sl === 'en' || sl === 'de' || sl === 'both') ? sl : 'en';
        const kind = currentTopic.mediaType === 'video' ? 'video' : 'image';
        setMediaUploading(true);
        setMediaUploadProgress(0);
        setMediaUploadFileName(file.name);
        setPageError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('kind', kind);
            fd.append('context', 'sentences');
            fd.append('sentenceLang', uploadLang);
            const { url, path } = await AdminAPI.uploadMediaWithProgress(fd, setMediaUploadProgress);
            setMediaUploadProgress(100);
            setCurrentTopic(prev => ({ ...prev, mediaUrl: path || url }));
            // Brief pause to show 100% before hiding
            setTimeout(() => { setMediaUploading(false); setMediaUploadProgress(0); }, 800);
        } catch (err: any) {
            setPageError(err?.message || 'فشل رفع الملف');
            setMediaUploading(false);
            setMediaUploadProgress(0);
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            {pageError && (
                <div
                    role="alert"
                    className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200"
                >
                    <span className="font-medium">{pageError}</span>
                    <button
                        type="button"
                        onClick={() => setPageError(null)}
                        className="shrink-0 rounded-lg p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
                        aria-label="إغلاق"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">إدارة المواقف الحياتية</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">إضافة وتعديل وحذف مواضيع المواقف الحياتية</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${adminLang === 'both' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                            adminLang === 'de' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                                'bg-blue-500/10 text-blue-600 border-blue-500/30'
                            }`}>
                            {adminLang === 'both' ? '🌐 EN + DE' : adminLang === 'de' ? '🇩🇪 DE فقط' : '🇺🇸 EN فقط'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setCurrentTopic({
                            level: 'A1',
                            subLevel: 'A1.1',
                            sentenceLang: adminLang === 'both' ? 'both' : storageLang,
                        });
                        setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={20} />
                    <span>موضوع جديد</span>
                </button>
            </div>

            {/* Editing Form */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-indigo-500 shadow-xl overflow-hidden"
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                    {currentTopic.id ? 'تعديل الموضوع' : 'إضافة موضوع جديد'}
                                </h3>
                                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
                                    <input
                                        type="text"
                                        value={currentTopic.title || ''}
                                        onChange={e => setCurrentTopic(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                        placeholder="مثال: في المطعم"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                                    <input
                                        type="text"
                                        value={currentTopic.description || ''}
                                        onChange={e => setCurrentTopic(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                        placeholder="وصف قصير للمحتوى"
                                    />
                                </div>
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المستوى</label>
                                        <select
                                            value={currentTopic.level || 'A1'}
                                            onChange={e => {
                                                const nextLevel = e.target.value;
                                                setCurrentTopic(prev => ({
                                                    ...prev,
                                                    level: nextLevel,
                                                    subLevel: normalizeSubLevel(nextLevel, prev.subLevel)
                                                }));
                                            }}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المستوى الفرعي</label>
                                        <select
                                            value={currentTopic.subLevel || 'A1.1'}
                                            onChange={e => setCurrentTopic(prev => ({ ...prev, subLevel: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value={`${currentTopic.level}.1`}>{currentTopic.level}.1</option>
                                            <option value={`${currentTopic.level}.2`}>{currentTopic.level}.2</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">لغة الجمل والوسائط</label>
                                        <select
                                            value={effectiveSentenceLangValue}
                                            disabled={langDropdownLocked}
                                            onChange={e => setCurrentTopic(prev => ({ ...prev, sentenceLang: e.target.value as 'en' | 'de' | 'both' }))}
                                            className={`w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 ${langDropdownLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="de">ألماني (DE)</option>
                                            <option value="en">إنجليزي (EN)</option>
                                            {!langDropdownLocked && (
                                                <option value="both">كلاهما (EN + DE)</option>
                                            )}
                                        </select>
                                        {langDropdownLocked && (
                                            <p className="text-[10px] text-gray-400 mt-1">مثبت تلقائياً حسب «وجهة الحفظ» في الشريط.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">أيقونة الموضوع واللون المُميز</label>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            {/* Icon Selector */}
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-2 font-bold">الأيقونة</label>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {ICONS.map(iconObj => {
                                                        const IconComponent = iconObj.icon;
                                                        const isSelected = (currentTopic.icon || 'BookOpen') === iconObj.name;
                                                        return (
                                                            <button
                                                                key={iconObj.name}
                                                                type="button"
                                                                title={iconObj.label}
                                                                onClick={() => setCurrentTopic(prev => ({ ...prev, icon: iconObj.name }))}
                                                                className={`p-2 rounded-xl flex items-center justify-center transition-all border-2 ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-indigo-300'}`}
                                                            >
                                                                <IconComponent size={24} />
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Gradient Selector */}
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-2 font-bold">لون الخلفية (Gradient)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {GRADIENTS.map(grad => (
                                                        <button
                                                            key={grad.class}
                                                            type="button"
                                                            title={grad.name}
                                                            onClick={() => setCurrentTopic(prev => ({ ...prev, image: grad.class }))}
                                                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad.class} shadow-sm transition-transform ${currentTopic.image === grad.class ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">توفر هذه الألوان تجربة بصرية ثابتة وجميلة.</p>
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        <div
                                            className={`w-full md:w-48 h-32 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden bg-gradient-to-br transition-all duration-300 ${currentTopic.image || 'from-blue-500 to-indigo-500'}`}
                                        >
                                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                {(() => {
                                                    const IconCmp = ICONS.find(i => i.name === (currentTopic.icon || 'BookOpen'))?.icon || BookOpen;
                                                    return <IconCmp size={32} />;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* Media Section */}
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ImageIcon size={18} className="text-indigo-500" />
                                        <span>الوسائط المتعددة</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الوسائط</label>
                                            <select
                                                value={currentTopic.mediaType || 'none'}
                                                onChange={e => setCurrentTopic(prev => ({ ...prev, mediaType: e.target.value as any }))}
                                                 className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                             >
                                                 <option value="none">لا يوجد</option>
                                                 <option value="video">فيديو</option>
                                                 <option value="image">صورة</option>
                                             </select>
                                         </div>
                                         {currentTopic.mediaType !== 'none' && (
                                             <div>
                                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                     {currentTopic.mediaType === 'video' ? 'رابط الفيديو او رفعه' : 'رابط الصورة او رفعها'}
                                                 </label>
                                                 <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={currentTopic.mediaUrl || ''}
                                                            onChange={e => setCurrentTopic(prev => ({ ...prev, mediaUrl: e.target.value }))}
                                                            className="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                                                            placeholder="https://..."
                                                            dir="ltr"
                                                            disabled={mediaUploading}
                                                        />
                                                        <label className={`w-12 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center ${mediaUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-indigo-200'} transition-colors`}>
                                                            <input
                                                                type="file"
                                                                accept={currentTopic.mediaType === 'video' ? 'video/*' : 'image/*'}
                                                                className="hidden"
                                                                onChange={handleTopicMediaFile}
                                                                disabled={mediaUploading}
                                                            />
                                                            {mediaUploading
                                                                ? <span className="text-base animate-spin inline-block">⏳</span>
                                                                : <Plus size={20} />
                                                            }
                                                        </label>
                                                    </div>
                                                    {mediaUploading && (
                                                        <UploadProgressBar
                                                            progress={mediaUploadProgress}
                                                            fileName={mediaUploadFileName}
                                                            done={mediaUploadProgress >= 100}
                                                        />
                                                     )}
                                                     <p className="text-[10px] text-gray-400">
                                                         رفع الملف يُخزَّن تحت «جمل» ثم{' '}
                                                         {currentTopic.sentenceLang === 'both'
                                                             ? 'english (افتراضي عند «كلاهما»)'
                                                             : currentTopic.sentenceLang === 'en' ? 'english' : 'german'}{' '}
                                                         ثم {currentTopic.mediaType === 'video' ? 'videos' : 'images'}.
                                                     </p>
                                                 </div>
                                             </div>
                                         )}
                                </div>
                                 </div>

                                {/* Grammar Notes */}
                                <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شرح القواعد / ملاحظات (Markdown)</label>
                                    <textarea
                                        value={currentTopic.grammarNotes || ''}
                                        onChange={e => setCurrentTopic(prev => ({ ...prev, grammarNotes: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                        placeholder="### ملاحظات هامة&#10;* استخدم النجمة للقوائم&#10;* يمكنك كتابة شرح تفصيلي هنا"
                                    />
                                </div>

                                {/* Sentences Manager */}
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-900 dark:text-white">المحادثة و الجمل المترجمة</h4>
                                        <button
                                            onClick={() => setCurrentTopic(prev => ({ ...prev, sentences: [...(prev.sentences || []), { id: crypto.randomUUID(), original: '', translation: '' }] }))}
                                            className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                                        >
                                            + إضافة جملة
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {(currentTopic.sentences || []).map((sentence, idx) => (
                                            <div key={sentence.id} className="flex flex-col md:flex-row gap-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 relative group">
                                                <button
                                                    onClick={() => setCurrentTopic(prev => ({ ...prev, sentences: prev.sentences?.filter(s => s.id !== sentence.id) }))}
                                                    className="absolute -top-2 -left-2 bg-red-100 dark:bg-red-900/50 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>

                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={sentence.original}
                                                        onChange={e => {
                                                            const newSentences = [...(currentTopic.sentences || [])];
                                                            newSentences[idx] = { ...sentence, original: e.target.value };
                                                            setCurrentTopic(prev => ({ ...prev, sentences: newSentences }));
                                                        }}
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                        placeholder={originalSentencePlaceholder}
                                                        dir="ltr"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={sentence.translation}
                                                        onChange={e => {
                                                            const newSentences = [...(currentTopic.sentences || [])];
                                                            newSentences[idx] = { ...sentence, translation: e.target.value };
                                                            setCurrentTopic(prev => ({ ...prev, sentences: newSentences }));
                                                        }}
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                        placeholder="الترجمة العربية"
                                                    />
                                                </div>

                                                <div className="flex flex-col justify-center gap-2 md:w-1/3">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={sentence.audioUrl || ''}
                                                            onChange={e => {
                                                                const newSentences = [...(currentTopic.sentences || [])];
                                                                newSentences[idx] = { ...sentence, audioUrl: e.target.value };
                                                                setCurrentTopic(prev => ({ ...prev, sentences: newSentences }));
                                                            }}
                                                            className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border-none focus:ring-1 focus:ring-indigo-500 text-xs"
                                                            placeholder="رابط الصوت"
                                                            dir="ltr"
                                                        />
                                                        <label className={`w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${sentenceAudioUploadIdx === idx ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-300'} transition-colors`}>
                                                            <input
                                                                type="file"
                                                                accept="audio/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    e.target.value = '';
                                                                    if (!file) return;
                                                                    if (file.size > 20 * 1024 * 1024) {
                                                                        setPageError('حجم الملف الصوتي كبير جداً (الحد الأقصى 20 ميجابايت على الخادم)');
                                                                        return;
                                                                    }
                                                                    setSentenceAudioUploadIdx(idx);
                                                                    void (async () => {
                                                                        setSentenceAudioProgress(0);
                                                                        try {
                                                                            const fd = new FormData();
                                                                            fd.append('file', file);
                                                                            fd.append('kind', 'audio');
                                                                            const { url, path } = await AdminAPI.uploadMediaWithProgress(fd, setSentenceAudioProgress);
                                                                            setSentenceAudioProgress(100);
                                                                            const newSentences = [...(currentTopic.sentences || [])];
                                                                            newSentences[idx] = { ...sentence, audioUrl: path || url };
                                                                            setCurrentTopic(prev => ({ ...prev, sentences: newSentences }));
                                                                            setTimeout(() => setSentenceAudioUploadIdx(null), 800);
                                                                        } catch (err: any) {
                                                                            setPageError(err?.message || 'فشل رفع الصوت');
                                                                            setSentenceAudioUploadIdx(null);
                                                                        }
                                                                    })();
                                                                }}
                                                            />
                                                            <Plus size={14} />
                                                        </label>
                                                    </div>
                                                     {sentenceAudioUploadIdx === idx && (
                                                         <UploadProgressBar
                                                             progress={sentenceAudioProgress}
                                                             fileName={undefined}
                                                             done={sentenceAudioProgress >= 100}
                                                         />
                                                     )}
                                                    <input
                                                        type="text"
                                                        value={sentence.notes || ''}
                                                        onChange={e => {
                                                            const newSentences = [...(currentTopic.sentences || [])];
                                                            newSentences[idx] = { ...sentence, notes: e.target.value };
                                                            setCurrentTopic(prev => ({ ...prev, sentences: newSentences }));
                                                        }}
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border-none focus:ring-1 focus:ring-indigo-500 text-xs text-gray-500"
                                                        placeholder="ملاحظات إضافية (اختياري)"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {(currentTopic.sentences || []).length === 0 && (
                                            <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-xl">
                                                لا توجد جمل مضافة بعد. اضغط على "إضافة جملة" للبدء.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quiz Questions Manager */}
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <HelpCircle size={18} className="text-purple-500" />
                                            <span>إدارة الأسئلة والاختبارات</span>
                                        </h4>
                                        <button
                                            onClick={() => {
                                                const newQuestion: Question = {
                                                    id: crypto.randomUUID(),
                                                    type: 'multiple-choice',
                                                    text: '',
                                                    options: ['', '', '', ''],
                                                    correctAnswer: ''
                                                };
                                                setCurrentTopic(prev => ({ ...prev, quizQuestions: [...(prev.quizQuestions || []), newQuestion] }));
                                            }}
                                            className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={14} />
                                            إضافة سؤال
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-6">
                                            {(currentTopic.quizQuestions || []).map((question, qIdx) => (
                                                <div key={question.id || qIdx} className="relative group">
                                                    <div className="absolute -right-3 top-6 z-10 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">
                                                        {qIdx + 1}
                                                    </div>
                                                    <QuestionForm
                                                        question={question}
                                                        onChange={(updatedQuestion) => {
                                                            const newQuestions = [...(currentTopic.quizQuestions || [])];
                                                            newQuestions[qIdx] = { ...question, ...updatedQuestion } as Question;
                                                            setCurrentTopic(prev => ({ ...prev, quizQuestions: newQuestions }));
                                                        }}
                                                        onDelete={() => {
                                                            const newQuestions = currentTopic.quizQuestions?.filter(q => q.id !== question.id);
                                                            setCurrentTopic(prev => ({ ...prev, quizQuestions: newQuestions }));
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            {(currentTopic.quizQuestions || []).length === 0 && (
                                                <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <HelpCircle size={32} />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-gray-900">لا توجد أسئلة مضافة</h4>
                                                    <p className="text-xs text-gray-500 mt-1">اضغط على زر "إضافة سؤال" في الأعلى للبدء</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50 font-bold transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={() => void handleSaveParams()}
                                        disabled={!currentTopic.title || saving || mediaUploading}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        <span>{saving ? 'جاري الحفظ…' : 'حفظ التغييرات'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Topics List Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="بحث..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 text-sm font-semibold">
                            <tr>
                                <th className="px-6 py-4">الموضوع</th>
                                <th className="px-6 py-4">المستوى</th>
                                <th className="px-6 py-4">اللغة</th>
                                <th className="px-6 py-4">اللون</th>
                                <th className="px-6 py-4">المحتوى</th>
                                <th className="px-6 py-4 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTopics.map((topic) => (
                                <tr key={topic.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${topic.image} flex items-center justify-center text-white shadow-sm`}>
                                                {(() => {
                                                    const IconCmp = ICONS.find(i => i.name === (topic.icon || 'BookOpen'))?.icon || BookOpen;
                                                    return <IconCmp size={18} />;
                                                })()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">{topic.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{topic.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold font-mono">
                                            {topic.level} • {topic.subLevel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold">
                                            {topic.sentenceLang === 'both' ? 'EN+DE' : topic.sentenceLang === 'en' ? 'EN' : 'DE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full bg-${topic.color}-500`} />
                                            <span className="text-xs text-gray-500 capitalize">{topic.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 text-xs text-gray-500">
                                            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                                {topic.sentences?.length || 0} جملة
                                            </span>
                                            {topic.mediaType !== 'none' && (
                                                <span className="p-1 text-indigo-500"><ImageIcon size={14} /></span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewTopic(topic)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                                title="معاينة كما يظهر للمستخدم"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentTopic({
                                                        ...topic,
                                                        subLevel: normalizeSubLevel(topic.level, topic.subLevel),
                                                        sentenceLang: topic.sentenceLang ?? (adminLang === 'both' ? 'both' : storageLang),
                                                    });
                                                    setIsEditing(true);
                                                }}
                                                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                title="تعديل"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTopicIdToDelete(topic.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredTopics.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        لا توجد مواضيع مطابقة للبحث.
                    </div>
                )}
            </div>

            <SentenceTopicPreviewModal topic={previewTopic} onClose={() => setPreviewTopic(null)} />

            <ConfirmModal
                isOpen={!!topicIdToDelete}
                onClose={() => setTopicIdToDelete(null)}
                onConfirm={() => {
                    const id = topicIdToDelete;
                    if (id) void runDeleteTopic(id);
                }}
                title="حذف الموضوع"
                message="هل أنت متأكد من حذف هذا الموضوع وجميع جمله وأسئلته من الخادم؟ لا يمكن التراجع."
                confirmText="حذف"
                cancelText="إلغاء"
                type="danger"
            />
        </div>
    );
};
