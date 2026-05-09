import React, { useMemo, useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Layers, Plus, Trash2, Video, Mic, FileText,
    MoreVertical, Edit2, PlayCircle, Clock, CheckCircle, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { Module, Lesson } from '../../types';
import { LessonEditor } from './LessonEditor';
import { Toast } from '../Toast';
import { AdminAPI } from '../../services/apiClient';
import { db } from '../../services/db';
import { ConfirmModal } from '../ConfirmModal';
import { LessonPreviewModal, lessonToPreviewModel } from './LessonPreviewModal';

interface CurriculumTabProps {
    curriculum: Module[];
    setCurriculum: (curriculum: Module[]) => void;
    learningLang: 'en' | 'de';
    adminLang: 'en' | 'de' | 'both';
}

const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const CurriculumTab: React.FC<CurriculumTabProps> = ({ curriculum, setCurriculum, learningLang, adminLang }) => {
    // --- Local State ---
    const [viewMode, setViewMode] = useState<'list' | 'lesson_editor'>('list');

    // Module Creation State
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newModuleLevel, setNewModuleLevel] = useState('A1');
    const [newModuleSubLevel, setNewModuleSubLevel] = useState('A1.1');
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

    // Lesson Editor State
    const [editorModuleId, setEditorModuleId] = useState<string | null>(null);
    const [editorModuleLang, setEditorModuleLang] = useState<'en' | 'de'>(() => learningLang);
    const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({});

    const [toastMessage, setToastMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
    const [confirmState, setConfirmState] = useState<
        | { type: 'module'; id: string }
        | { type: 'lesson'; moduleId: string; lessonId: string }
        | null
    >(null);

    const [preview, setPreview] = useState<{ lesson: Lesson; moduleTitle: string } | null>(null);

    const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const visibleCurriculum = useMemo(() => {
        if (adminLang === 'en') return (curriculum as any[]).filter((m) => (m as any)?._lang !== 'de') as any;
        if (adminLang === 'de') return (curriculum as any[]).filter((m) => (m as any)?._lang === 'de') as any;
        return curriculum;
    }, [adminLang, curriculum]);

    // --- Module Handlers ---

    const handleAddModule = () => {
        if (!newModuleTitle.trim()) return;

        const selected = adminLang;
        const targetLangs: Array<'en' | 'de'> =
            selected === 'both' ? ['en', 'de'] : [selected];

        const payload = {
            title: newModuleTitle.trim(),
            level: newModuleLevel,
            subLevel: newModuleSubLevel,
            lessons: [],
            isActive: true,
        };

        void (async () => {
            try {
                for (const l of targetLangs) {
                    await AdminAPI.createCurriculumModule(l, payload);
                }

                const [enRes, deRes] = await Promise.all([AdminAPI.getCurriculum('en'), AdminAPI.getCurriculum('de')]);
                const enModules = Array.isArray((enRes as any)?.modules) ? (enRes as any).modules : [];
                const deModules = Array.isArray((deRes as any)?.modules) ? (deRes as any).modules : [];
                await db.save('curriculum', enModules, 'en');
                await db.save('curriculum', deModules, 'de');
                setCurriculum(learningLang === 'de' ? deModules : enModules);

                setNewModuleTitle('');
                showToast('تم إضافة الوحدة بنجاح', 'success');
            } catch (e: any) {
                showToast(e?.message || 'فشل حفظ الوحدة على الخادم. تأكد من تسجيل دخول المسئول.', 'error');
            }
        })();
    };

    const doDeleteModule = (id: string) => {

        const picked: any = (curriculum as any[]).find((m) => m.id === id);
        const pickedLang: 'en' | 'de' = (picked?._lang === 'de' ? 'de' : 'en');
        const title = (picked?.title || '').trim();

        const findByTitle = (lang: 'en' | 'de', t: string): string | null => {
            const list = db.load<any[]>('curriculum', [], lang) || [];
            const match = list.find((m) => (m?.title || '').trim().toLowerCase() === (t || '').trim().toLowerCase());
            return match?.id || null;
        };

        void (async () => {
            try {
                if (adminLang === 'both' && title) {
                    const other: 'en' | 'de' = pickedLang === 'de' ? 'en' : 'de';
                    const otherId = findByTitle(other, title);
                    await Promise.all([
                        AdminAPI.deleteCurriculumModule(pickedLang, id),
                        otherId ? AdminAPI.deleteCurriculumModule(other, otherId) : Promise.resolve(null),
                    ]);
                } else {
                    await AdminAPI.deleteCurriculumModule(pickedLang, id);
                }

                const [enRes, deRes] = await Promise.all([AdminAPI.getCurriculum('en'), AdminAPI.getCurriculum('de')]);
                const enModules = Array.isArray((enRes as any)?.modules) ? (enRes as any).modules : [];
                const deModules = Array.isArray((deRes as any)?.modules) ? (deRes as any).modules : [];
                await db.save('curriculum', enModules, 'en');
                await db.save('curriculum', deModules, 'de');
                setCurriculum(learningLang === 'de' ? deModules : enModules);

                showToast('تم حذف الوحدة.', 'info');
            } catch (e: any) {
                showToast(e?.message || 'فشل حذف الوحدة من الخادم', 'error');
            }
        })();
    };

    const handleDeleteModule = (id: string) => {
        setConfirmState({ type: 'module', id });
    };

    // --- Lesson Handlers ---

    const handleOpenLessonEditor = (moduleId: string, lessonId?: string) => {
        setEditorModuleId(moduleId);
        const picked: any = (curriculum as any[]).find((m) => m.id === moduleId);
        setEditorModuleLang((picked?._lang === 'de' ? 'de' : 'en'));
        if (lessonId) {
            // Edit existing
            const module = curriculum.find(m => m.id === moduleId);
            const lesson = module?.lessons.find(l => l.id === lessonId);
            if (lesson) setCurrentLesson({ ...lesson });
        } else {
            // New Lesson
            setCurrentLesson({
                id: generateId(),
                duration: '10 min',
                level: 'مبتدئ',
                content: '',
                title: '',
                description: '',
                resources: [],
                questions: []
            });
        }
        setViewMode('lesson_editor');
    };

    const handleSaveLesson = () => {
        if (!editorModuleId || !currentLesson.title) {
            showToast("يجب كتابة عنوان الدرس على الأقل", "error");
            return;
        }

        const rawQuestions = currentLesson.questions || [];
        const questionsForApi = rawQuestions.map((q) => ({
            id: q.id,
            type: q.type,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            image: q.image,
            mediaType: q.mediaType,
            mediaUrl: q.mediaUrl,
        }));

        const lessonToSave: Lesson = {
            id: currentLesson.id || generateId(),
            title: currentLesson.title!,
            description: DOMPurify.sanitize(currentLesson.description || ''),
            duration: currentLesson.duration || '10 min',
            level: currentLesson.level,
            content: DOMPurify.sanitize(currentLesson.content || ''),
            image: currentLesson.image,
            videoUrl: currentLesson.videoUrl,
            audioUrl: currentLesson.audioUrl,
            resources: currentLesson.resources || [],
            questions: questionsForApi,
        };

        const updatedModules = curriculum.map(m => {
            if (m.id === editorModuleId) {
                const lessonExists = m.lessons.some(l => l.id === lessonToSave.id);
                if (lessonExists) {
                    return { ...m, lessons: m.lessons.map(l => l.id === lessonToSave.id ? lessonToSave : l) };
                }
                return { ...m, lessons: [...m.lessons, lessonToSave] };
            }
            return m;
        });

        const picked: any = (updatedModules as any[]).find((m) => m.id === editorModuleId);
        const lessonsClean = Array.isArray(picked?.lessons)
            ? JSON.parse(JSON.stringify(picked.lessons)) as Lesson[]
            : [];

        const payload = {
            title: picked?.title,
            level: picked?.level,
            subLevel: picked?.subLevel,
            lessons: lessonsClean,
            isActive: true,
        };

        try {
            const approxBytes = new Blob([JSON.stringify(payload)]).size;
            if (approxBytes > 12 * 1024 * 1024) {
                showToast('حجم بيانات الوحدة كبير جدًا (غالبًا بسبب رفع فيديو/صور كبيرة كـ Base64). استخدم روابط YouTube/Vimeo أو ارفع الملف على استضافة وضع الرابط.', 'error');
                return;
            }
        } catch {
            /* ignore */
        }

        const title = (picked?.title || '').trim();
        const findByTitle = (lang: 'en' | 'de', t: string): string | null => {
            const list = db.load<any[]>('curriculum', [], lang) || [];
            const match = list.find((m) => (m?.title || '').trim().toLowerCase() === (t || '').trim().toLowerCase());
            return match?.id || null;
        };

        void (async () => {
            try {
                if (adminLang === 'both' && title) {
                    const other: 'en' | 'de' = editorModuleLang === 'de' ? 'en' : 'de';
                    const otherId = findByTitle(other, title);
                    await Promise.all([
                        AdminAPI.updateCurriculumModule(editorModuleLang, editorModuleId, payload),
                        otherId ? AdminAPI.updateCurriculumModule(other, otherId, payload) : AdminAPI.createCurriculumModule(other, payload),
                    ]);
                } else {
                    await AdminAPI.updateCurriculumModule(editorModuleLang, editorModuleId, payload);
                }

                const [enRes, deRes] = await Promise.all([AdminAPI.getCurriculum('en'), AdminAPI.getCurriculum('de')]);
                const enModules = Array.isArray((enRes as any)?.modules) ? (enRes as any).modules : [];
                const deModules = Array.isArray((deRes as any)?.modules) ? (deRes as any).modules : [];
                await db.save('curriculum', enModules, 'en');
                await db.save('curriculum', deModules, 'de');
                setCurriculum(learningLang === 'de' ? deModules : enModules);

                setViewMode('list');
                setCurrentLesson({});
                showToast('تم حفظ الدرس بنجاح!', 'success');
            } catch (e: any) {
                showToast(e?.message || 'فشل حفظ الدرس على الخادم', 'error');
            }
        })();
    };

    const doDeleteLesson = (moduleId: string, lessonId: string) => {

        const updatedModules = curriculum.map(m => {
            if (m.id === moduleId) return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
            return m;
        });

        const picked: any = (updatedModules as any[]).find((m) => m.id === moduleId);
        const pickedLang: 'en' | 'de' = (picked?._lang === 'de' ? 'de' : 'en');
        const payload = {
            title: picked?.title,
            level: picked?.level,
            subLevel: picked?.subLevel,
            lessons: Array.isArray(picked?.lessons) ? picked.lessons : [],
            isActive: true,
        };

        const title = (picked?.title || '').trim();
        const findByTitle = (lang: 'en' | 'de', t: string): string | null => {
            const list = db.load<any[]>('curriculum', [], lang) || [];
            const match = list.find((m) => (m?.title || '').trim().toLowerCase() === (t || '').trim().toLowerCase());
            return match?.id || null;
        };

        void (async () => {
            try {
                if (adminLang === 'both' && title) {
                    const other: 'en' | 'de' = pickedLang === 'de' ? 'en' : 'de';
                    const otherId = findByTitle(other, title);
                    await Promise.all([
                        AdminAPI.updateCurriculumModule(pickedLang, moduleId, payload),
                        otherId ? AdminAPI.updateCurriculumModule(other, otherId, payload) : AdminAPI.createCurriculumModule(other, payload),
                    ]);
                } else {
                    await AdminAPI.updateCurriculumModule(pickedLang, moduleId, payload);
                }

                const [enRes, deRes] = await Promise.all([AdminAPI.getCurriculum('en'), AdminAPI.getCurriculum('de')]);
                const enModules = Array.isArray((enRes as any)?.modules) ? (enRes as any).modules : [];
                const deModules = Array.isArray((deRes as any)?.modules) ? (deRes as any).modules : [];
                await db.save('curriculum', enModules, 'en');
                await db.save('curriculum', deModules, 'de');
                setCurriculum(learningLang === 'de' ? deModules : enModules);

                showToast('تم حذف الدرس.', 'info');
            } catch (e: any) {
                showToast(e?.message || 'فشل حذف الدرس من الخادم', 'error');
            }
        })();
    };

    const handleDeleteLesson = (moduleId: string, lessonId: string) => {
        setConfirmState({ type: 'lesson', moduleId, lessonId });
    };

    // --- Render ---

    if (viewMode === 'lesson_editor') {
        return (
            <>
                <Toast
                    message={toastMessage?.text || ""}
                    isVisible={!!toastMessage}
                    onClose={() => setToastMessage(null)}
                    type={toastMessage?.type}
                />
                <ConfirmModal
                    isOpen={!!confirmState}
                    onClose={() => setConfirmState(null)}
                    onConfirm={() => {
                        const s = confirmState;
                        setConfirmState(null);
                        if (!s) return;
                        if (s.type === 'module') doDeleteModule(s.id);
                        else doDeleteLesson(s.moduleId, s.lessonId);
                    }}
                    title={confirmState?.type === 'module' ? 'حذف الوحدة' : 'حذف الدرس'}
                    message={confirmState?.type === 'module' ? 'حذف هذه الوحدة وجميع دروسها؟' : 'حذف هذا الدرس؟'}
                    confirmText="حذف"
                    cancelText="إلغاء"
                    type="danger"
                />
                <LessonEditor
                    lesson={currentLesson}
                    setLesson={setCurrentLesson}
                    onSave={handleSaveLesson}
                    onCancel={() => {
                        setViewMode('list');
                        setCurrentLesson({});
                    }}
                    onPreview={() => {
                        const mod = curriculum.find((m) => m.id === editorModuleId);
                        setPreview({
                            lesson: lessonToPreviewModel(currentLesson),
                            moduleTitle: mod?.title || '',
                        });
                    }}
                />
                {preview && (
                    <LessonPreviewModal
                        open
                        lesson={preview.lesson}
                        moduleTitle={preview.moduleTitle}
                        onClose={() => setPreview(null)}
                    />
                )}
            </>
        );
    }

    return (
        <m.div
            key="curriculum"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 animate-fade-in"
        >
            <Toast
                message={toastMessage?.text || ""}
                isVisible={!!toastMessage}
                onClose={() => setToastMessage(null)}
                type={toastMessage?.type}
            />
            <ConfirmModal
                isOpen={!!confirmState}
                onClose={() => setConfirmState(null)}
                onConfirm={() => {
                    const s = confirmState;
                    setConfirmState(null);
                    if (!s) return;
                    if (s.type === 'module') doDeleteModule(s.id);
                    else doDeleteLesson(s.moduleId, s.lessonId);
                }}
                title={confirmState?.type === 'module' ? 'حذف الوحدة' : 'حذف الدرس'}
                message={confirmState?.type === 'module' ? 'حذف هذه الوحدة وجميع دروسها؟' : 'حذف هذا الدرس؟'}
                confirmText="حذف"
                cancelText="إلغاء"
                type="danger"
            />

            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <BookOpen className="text-blue-500" />
                        إدارة المنهج الدراسي
                    </h2>
                    <p className="text-gray-400 font-bold mt-2">تنظيم الوحدات والدروس والمحتوى التعليمي</p>
                </div>
            </header>

            {/* Add New Module Section */}
            <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 mb-8">
                <h3 className="text-white font-black mb-4 flex items-center gap-2">
                    <Layers size={20} className="text-blue-500" />
                    إضافة وحدة جديدة
                </h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-xs font-bold text-gray-500 mr-2">عنوان الوحدة</label>
                        <input
                            type="text"
                            placeholder="مثال: أساسيات المحادثة"
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-blue-500/50"
                        />
                    </div>
                    {/* Level Selection */}
                    <div className="w-full md:w-32 space-y-2">
                        <label className="text-xs font-bold text-gray-500 mr-2">المستوى</label>
                        <select
                            value={newModuleLevel}
                            onChange={(e) => {
                                setNewModuleLevel(e.target.value);
                                // Reset sublevel when level changes to ensure consistency
                                setNewModuleSubLevel(`${e.target.value}.1`);
                            }}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-blue-500/50 appearance-none"
                        >
                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                                <option key={lvl} value={lvl} className="bg-slate-900">{lvl}</option>
                            ))}
                        </select>
                    </div>
                    {/* Sub-Level Selection */}
                    <div className="w-full md:w-32 space-y-2">
                        <label className="text-xs font-bold text-gray-500 mr-2">المستوى الفرعي</label>
                        <select
                            value={newModuleSubLevel}
                            onChange={(e) => setNewModuleSubLevel(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-blue-500/50 appearance-none"
                        >
                            {/* Dynamically generate sub-levels based on selected level */}
                            {[1, 2, 3].map(sub => (
                                <option key={sub} value={`${newModuleLevel}.${sub}`} className="bg-slate-900">{`${newModuleLevel}.${sub}`}</option>
                            ))}
                        </select>
                    </div>

                    {/* Language Selection */}
                    <div className="w-full md:w-44 space-y-2">
                        <label className="text-xs font-bold text-gray-500 mr-2">اللغة</label>
                        <select
                            value={adminLang}
                            disabled
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-blue-500/50 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <option value="both" className="bg-slate-900">🇺🇸 + 🇩🇪 الاتنين</option>
                            <option value="en" className="bg-slate-900">🇺🇸 English</option>
                            <option value="de" className="bg-slate-900">🇩🇪 German</option>
                        </select>
                    </div>

                    <button
                        onClick={handleAddModule}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        إضافة
                    </button>
                </div>
            </div>

            {/* Modules List */}
            <div className="grid grid-cols-1 gap-6">
                {visibleCurriculum.map((module) => (
                    <m.div
                        layout
                        key={module.id}
                        className="bg-slate-900/50 border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all"
                    >
                        <div
                            className="p-6 flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                            onClick={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-black text-xl">
                                    {module.lessons.length}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">{module.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-gray-500 bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
                                            {module.level}
                                        </span>
                                        {module.subLevel && (
                                            <span className="text-xs font-bold text-gray-500 bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
                                                {module.subLevel}
                                            </span>
                                        )}
                                        <span className="text-sm font-bold text-gray-500">{module.lessons.length} درس</span>
                                        {(module as any)._langFlag && (
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${((module as any)._lang || '') === 'de' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                                                {(module as any)._langFlag} {((module as any)._lang || '').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteModule(module.id);
                                    }}
                                    className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                                {expandedModuleId === module.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedModuleId === module.id && (
                                <m.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-white/5 bg-black/20"
                                >
                                    <div className="p-4 space-y-3">
                                        {module.lessons.map((lesson) => (
                                            <div
                                                key={lesson.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() =>
                                                    setPreview({
                                                        lesson: lessonToPreviewModel(lesson),
                                                        moduleTitle: module.title,
                                                    })
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setPreview({
                                                            lesson: lessonToPreviewModel(lesson),
                                                            moduleTitle: module.title,
                                                        });
                                                    }
                                                }}
                                                className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className="w-10 h-10 shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                        <Video size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">{lesson.title}</h4>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                                            <span className="flex items-center gap-1"><Clock size={10} /> {lesson.duration}</span>
                                                            {lesson.level && (
                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-400">
                                                                    {lesson.level}
                                                                </span>
                                                            )}
                                                            {lesson.questions && lesson.questions.length > 0 && (
                                                                <span className="flex items-center gap-1 text-green-500"><CheckCircle size={10} /> {lesson.questions.length} سؤال</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreview({
                                                                lesson: lessonToPreviewModel(lesson),
                                                                moduleTitle: module.title,
                                                            })
                                                        }
                                                        className="p-2 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-100 rounded-xl transition-all"
                                                        title="معاينة"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenLessonEditor(module.id, lesson.id)}
                                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all"
                                                    >
                                                        تعديل
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                                        className="p-2 hover:bg-red-500/10 text-gray-600 hover:text-red-500 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => handleOpenLessonEditor(module.id)}
                                            className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 font-bold hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} />
                                            إضافة درس جديد
                                        </button>
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>
                    </m.div>
                ))}
            </div>

            {preview && (
                <LessonPreviewModal
                    open
                    lesson={preview.lesson}
                    moduleTitle={preview.moduleTitle}
                    onClose={() => setPreview(null)}
                />
            )}
        </m.div>
    );
};
