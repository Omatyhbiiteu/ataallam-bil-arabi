import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion as m } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle2,
    Edit2,
    Gamepad2,
    Headphones,
    Loader2,
    MousePointer2,
    Plus,
    Puzzle,
    RefreshCw,
    Save,
    Search,
    Timer,
    Trash2,
    Trophy,
    X,
    type LucideIcon,
} from 'lucide-react';
import { AdminAPI } from '../../services/apiClient';
import { GameQuestion, GameSet, GameType } from '../../types';
import { AdminLang } from './AdminSidebar';

interface AdminGamesViewProps {
    t?: any;
    adminLang?: AdminLang;
    learningLang: 'en' | 'de';
}

type EditableQuestion = Partial<GameQuestion>;
type EditableGame = Omit<Partial<GameSet>, 'questions'> & { questions?: EditableQuestion[] };

const generateId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const GAME_TYPES: Record<GameType, { label: string; hint: string; Icon: LucideIcon; accent: string }> = {
    word_match: {
        label: 'مطابقة كلمات',
        hint: 'اختيارات سريعة بين الكلمة والمعنى أو الجملة والترجمة.',
        Icon: Puzzle,
        accent: 'from-blue-600 to-cyan-500',
    },
    sentence_builder: {
        label: 'ترتيب جملة',
        hint: 'اللاعب يرتب كلمات مبعثرة للوصول للجملة الصحيحة.',
        Icon: MousePointer2,
        accent: 'from-emerald-500 to-teal-500',
    },
    listening: {
        label: 'تحدي استماع',
        hint: 'يسمع كلمة أو جملة ثم يختار أو يكتب الإجابة الصحيحة.',
        Icon: Headphones,
        accent: 'from-amber-500 to-orange-500',
    },
};

const COLOR_OPTIONS = [
    { value: 'indigo', label: 'نيلي', className: 'from-indigo-600 to-violet-500' },
    { value: 'blue', label: 'أزرق', className: 'from-blue-600 to-cyan-500' },
    { value: 'emerald', label: 'زمردي', className: 'from-emerald-500 to-teal-500' },
    { value: 'amber', label: 'ذهبي', className: 'from-amber-500 to-orange-500' },
    { value: 'rose', label: 'وردي', className: 'from-rose-500 to-red-500' },
    { value: 'violet', label: 'بنفسجي', className: 'from-violet-600 to-fuchsia-500' },
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CONTROL_CLASS = 'w-full rounded-2xl bg-slate-900/80 border border-white/10 text-white placeholder:text-gray-600 px-4 py-3 outline-none focus:border-red-500/60 focus:bg-slate-900 transition disabled:opacity-50';

const splitLines = (value: string) =>
    value
        .replace(/\r\n/g, '\n')
        .split('\n');

const joinLines = (value?: string[] | null) => (Array.isArray(value) ? value.join('\n') : '');

const normalizeSubLevel = (level?: string, subLevel?: string | null) => {
    const safeLevel = level || 'A1';
    const prefix = `${safeLevel}.`;
    return subLevel && subLevel.startsWith(prefix) ? subLevel : `${safeLevel}.1`;
};

const blankQuestion = (type: GameType, index: number): EditableQuestion => ({
    id: generateId(),
    prompt: '',
    answer: '',
    translation: '',
    options: type === 'sentence_builder' ? [] : ['', '', ''],
    tokens: type === 'sentence_builder' ? [] : [],
    audioText: type === 'listening' ? '' : null,
    explanation: '',
    sortOrder: index + 1,
    isActive: true,
});

const blankGame = (lang: 'en' | 'de'): EditableGame => ({
    id: generateId(),
    lang,
    type: 'word_match',
    title: '',
    description: '',
    level: 'A1',
    subLevel: 'A1.1',
    icon: 'Puzzle',
    color: 'indigo',
    xpReward: 120,
    timeLimitSeconds: 90,
    isActive: true,
    questions: [blankQuestion('word_match', 0)],
});

const sanitizeQuestions = (questions: EditableQuestion[], type: GameType): GameQuestion[] =>
    questions
        .map((q, index) => {
            const prompt = String(q.prompt || '').trim();
            const answer = String(q.answer || '').trim();
            const rawOptions = Array.isArray(q.options) ? q.options.map((v) => String(v).trim()).filter(Boolean) : [];
            const rawTokens = Array.isArray(q.tokens) ? q.tokens.map((v) => String(v).trim()).filter(Boolean) : [];
            const options = type === 'sentence_builder'
                ? []
                : Array.from(new Set([answer, ...rawOptions].filter(Boolean)));
            const tokens = type === 'sentence_builder'
                ? (rawTokens.length > 0 ? rawTokens : answer.split(/\s+/).filter(Boolean))
                : rawTokens;

            return {
                id: q.id || generateId(),
                prompt,
                answer,
                translation: q.translation ? String(q.translation).trim() : null,
                options,
                tokens,
                audioText: type === 'listening'
                    ? String(q.audioText || q.prompt || q.answer || '').trim()
                    : (q.audioText ? String(q.audioText).trim() : null),
                explanation: q.explanation ? String(q.explanation).trim() : null,
                sortOrder: index + 1,
                isActive: q.isActive ?? true,
            };
        })
        .filter((q) => q.prompt.length > 0 && q.answer.length > 0);

export const AdminGamesView: React.FC<AdminGamesViewProps> = ({ adminLang = 'both', learningLang }) => {
    const storageLang: 'en' | 'de' = adminLang === 'both' ? learningLang : adminLang;
    const [games, setGames] = useState<GameSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pageError, setPageError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [editingGame, setEditingGame] = useState<EditableGame | null>(null);

    const refreshGames = useCallback(async () => {
        setLoading(true);
        setPageError(null);
        try {
            const res = await AdminAPI.getGames(storageLang);
            setGames(Array.isArray((res as any)?.games) ? (res as any).games : []);
        } catch (e: any) {
            setPageError(e?.message || 'تعذر تحميل الألعاب من الخادم. تأكد من تسجيل دخول المسؤول.');
        } finally {
            setLoading(false);
        }
    }, [storageLang]);

    useEffect(() => {
        void refreshGames();
    }, [refreshGames]);

    const filteredGames = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return games;
        return games.filter((game) =>
            [game.title, game.description, game.level, game.subLevel, GAME_TYPES[game.type]?.label]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(q))
        );
    }, [games, searchQuery]);

    const stats = useMemo(() => ({
        total: games.length,
        active: games.filter((game) => game.isActive).length,
        questions: games.reduce((sum, game) => sum + (game.questionCount || game.questions?.length || 0), 0),
    }), [games]);

    const openCreate = () => {
        setSuccessMessage(null);
        setPageError(null);
        setEditingGame(blankGame(storageLang));
    };

    const openEdit = (game: GameSet) => {
        setSuccessMessage(null);
        setPageError(null);
        setEditingGame({
            ...game,
            subLevel: normalizeSubLevel(game.level, game.subLevel),
            questions: (game.questions || []).map((q, index) => ({
                ...q,
                id: q.id || generateId(),
                sortOrder: q.sortOrder ?? index + 1,
                isActive: q.isActive ?? true,
                options: q.options || [],
                tokens: q.tokens || [],
            })),
        });
    };

    const closeEditor = () => {
        if (saving) return;
        setEditingGame(null);
        setPageError(null);
    };

    const updateQuestion = (index: number, patch: EditableQuestion) => {
        setEditingGame((prev) => {
            if (!prev) return prev;
            const nextQuestions = [...(prev.questions || [])];
            nextQuestions[index] = { ...nextQuestions[index], ...patch };
            return { ...prev, questions: nextQuestions };
        });
    };

    const removeQuestion = (index: number) => {
        setEditingGame((prev) => {
            if (!prev) return prev;
            const nextQuestions = (prev.questions || []).filter((_, i) => i !== index);
            return { ...prev, questions: nextQuestions.length ? nextQuestions : [blankQuestion(prev.type || 'word_match', 0)] };
        });
    };

    const addQuestion = () => {
        setEditingGame((prev) => {
            if (!prev) return prev;
            const type = prev.type || 'word_match';
            const nextQuestions = [...(prev.questions || []), blankQuestion(type, prev.questions?.length || 0)];
            return { ...prev, questions: nextQuestions };
        });
    };

    const handleSave = async () => {
        if (!editingGame) return;
        const type = (editingGame.type || 'word_match') as GameType;
        const title = String(editingGame.title || '').trim();
        const description = String(editingGame.description || '').trim();
        const level = String(editingGame.level || 'A1').trim();
        const questions = sanitizeQuestions(editingGame.questions || [], type);

        if (!title) {
            setPageError('اكتب اسم اللعبة قبل الحفظ.');
            return;
        }
        if (questions.length === 0) {
            setPageError('أضف سؤالاً واحداً على الأقل، واكتب نص السؤال والإجابة الصحيحة.');
            return;
        }

        const payload = {
            id: editingGame.id || generateId(),
            type,
            title,
            description,
            level,
            subLevel: normalizeSubLevel(level, editingGame.subLevel),
            icon: editingGame.icon || (type === 'word_match' ? 'Puzzle' : type === 'sentence_builder' ? 'MousePointer2' : 'Headphones'),
            color: editingGame.color || 'indigo',
            xpReward: Number(editingGame.xpReward || 120),
            timeLimitSeconds: Number(editingGame.timeLimitSeconds || 90),
            isActive: editingGame.isActive ?? true,
            questions,
        };

        const exists = Boolean(editingGame.id && games.some((game) => game.id === editingGame.id));
        setSaving(true);
        setPageError(null);
        setSuccessMessage(null);
        try {
            if (exists) {
                await AdminAPI.updateGame(storageLang, String(editingGame.id), payload);
                setSuccessMessage('تم تحديث اللعبة والأسئلة بنجاح.');
            } else {
                await AdminAPI.createGame(storageLang, payload);
                setSuccessMessage('تم إنشاء اللعبة بنجاح.');
            }
            await refreshGames();
            setEditingGame(null);
        } catch (e: any) {
            setPageError(e?.message || 'فشل حفظ اللعبة على الخادم.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (game: GameSet) => {
        if (!window.confirm(`حذف لعبة "${game.title}" وكل أسئلتها؟`)) return;
        setSaving(true);
        setPageError(null);
        setSuccessMessage(null);
        try {
            await AdminAPI.deleteGame(storageLang, game.id);
            setSuccessMessage('تم حذف اللعبة.');
            await refreshGames();
        } catch (e: any) {
            setPageError(e?.message || 'فشل حذف اللعبة من الخادم.');
        } finally {
            setSaving(false);
        }
    };

    const editorType = (editingGame?.type || 'word_match') as GameType;
    const editorMeta = GAME_TYPES[editorType];
    const EditorIcon = editorMeta.Icon;

    return (
        <m.div
            key="admin-games"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-7"
            dir="rtl"
        >
            <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,.18),transparent_34%)]" />
                <div className="relative p-6 md:p-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="space-y-3 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white text-xs font-black">
                            <Gamepad2 size={16} /> قسم الألعاب التعليمي
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">إدارة الألعاب والأسئلة</h2>
                            <p className="text-gray-400 font-medium leading-relaxed">
                                أنشئ ألعاباً فعلية للمستخدمين واربط كل لعبة بأسئلة، اختيارات، توكنز ترتيب الجمل، ونصوص الاستماع.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] font-black px-3 py-1.5 rounded-full border ${storageLang === 'de' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/30'}`}>
                                لغة المحتوى الحالية: {storageLang === 'de' ? 'DE' : 'EN'}
                            </span>
                            {adminLang === 'both' && (
                                <span className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                                    عند اختيار كلاهما يتم العمل على لغة التعلم الحالية
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 min-w-[280px]">
                        <StatBox label="الألعاب" value={String(stats.total)} icon={Gamepad2} />
                        <StatBox label="المفعلة" value={String(stats.active)} icon={CheckCircle2} />
                        <StatBox label="الأسئلة" value={String(stats.questions)} icon={Trophy} />
                    </div>
                </div>
            </header>

            {(pageError || successMessage) && (
                <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${pageError
                    ? 'border-red-500/30 bg-red-500/10 text-red-200'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    }`}>
                    <span className="flex items-center gap-2">
                        {pageError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {pageError || successMessage}
                    </span>
                    <button
                        type="button"
                        onClick={() => { setPageError(null); setSuccessMessage(null); }}
                        className="rounded-lg p-1 hover:bg-white/10"
                        aria-label="إغلاق"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xl">
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث باسم اللعبة أو المستوى أو النوع..."
                        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-red-500/50 focus:bg-white/10 transition"
                    />
                    <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => void refreshGames()}
                        disabled={loading || saving}
                        className="h-12 px-4 rounded-2xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-50 transition flex items-center gap-2 font-bold"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        تحديث
                    </button>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="h-12 px-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/30 transition flex items-center gap-2 font-black"
                    >
                        <Plus size={19} />
                        لعبة جديدة
                    </button>
                </div>
            </section>

            <AnimatePresence>
                {editingGame && (
                    <m.section
                        initial={{ opacity: 0, y: -16, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -16, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-[2rem] border border-red-500/30 bg-slate-950/80 shadow-2xl">
                            <div className={`p-5 md:p-6 border-b border-white/10 bg-gradient-to-l ${COLOR_OPTIONS.find((c) => c.value === editingGame.color)?.className || editorMeta.accent}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-white">
                                            <EditorIcon size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white">{games.some((g) => g.id === editingGame.id) ? 'تعديل لعبة' : 'إضافة لعبة جديدة'}</h3>
                                            <p className="text-white/75 text-sm font-bold">{editorMeta.hint}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={closeEditor} className="self-start md:self-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
                                        <X size={22} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 md:p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="اسم اللعبة">
                                        <input
                                            value={editingGame.title || ''}
                                            onChange={(e) => setEditingGame((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                                            className={CONTROL_CLASS}
                                            placeholder="مثال: كلمات السفر السريعة"
                                        />
                                    </Field>
                                    <Field label="نوع اللعبة">
                                        <select
                                            value={editorType}
                                            onChange={(e) => {
                                                const nextType = e.target.value as GameType;
                                                setEditingGame((prev) => prev ? {
                                                    ...prev,
                                                    type: nextType,
                                                    icon: nextType === 'word_match' ? 'Puzzle' : nextType === 'sentence_builder' ? 'MousePointer2' : 'Headphones',
                                                    questions: (prev.questions || [blankQuestion(nextType, 0)]).map((q, index) => ({
                                                        ...blankQuestion(nextType, index),
                                                        ...q,
                                                    })),
                                                } : prev);
                                            }}
                                            className={CONTROL_CLASS}
                                        >
                                            {Object.entries(GAME_TYPES).map(([value, meta]) => (
                                                <option key={value} value={value}>{meta.label}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="الوصف">
                                        <input
                                            value={editingGame.description || ''}
                                            onChange={(e) => setEditingGame((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                                            className={CONTROL_CLASS}
                                            placeholder="وصف قصير يظهر للمستخدم"
                                        />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="المستوى">
                                            <select
                                                value={editingGame.level || 'A1'}
                                                onChange={(e) => {
                                                    const nextLevel = e.target.value;
                                                    setEditingGame((prev) => prev ? {
                                                        ...prev,
                                                        level: nextLevel,
                                                        subLevel: normalizeSubLevel(nextLevel, prev.subLevel),
                                                    } : prev);
                                                }}
                                                className={CONTROL_CLASS}
                                            >
                                                {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="الفرعي">
                                            <select
                                                value={editingGame.subLevel || `${editingGame.level || 'A1'}.1`}
                                                onChange={(e) => setEditingGame((prev) => prev ? { ...prev, subLevel: e.target.value } : prev)}
                                                className={CONTROL_CLASS}
                                            >
                                                <option value={`${editingGame.level || 'A1'}.1`}>{editingGame.level || 'A1'}.1</option>
                                                <option value={`${editingGame.level || 'A1'}.2`}>{editingGame.level || 'A1'}.2</option>
                                                <option value={`${editingGame.level || 'A1'}.3`}>{editingGame.level || 'A1'}.3</option>
                                            </select>
                                        </Field>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="XP">
                                            <input
                                                type="number"
                                                min={0}
                                                max={5000}
                                                value={editingGame.xpReward ?? 120}
                                                onChange={(e) => setEditingGame((prev) => prev ? { ...prev, xpReward: Number(e.target.value) } : prev)}
                                                className={CONTROL_CLASS}
                                            />
                                        </Field>
                                        <Field label="الوقت بالثواني">
                                            <input
                                                type="number"
                                                min={15}
                                                max={3600}
                                                value={editingGame.timeLimitSeconds ?? 90}
                                                onChange={(e) => setEditingGame((prev) => prev ? { ...prev, timeLimitSeconds: Number(e.target.value) } : prev)}
                                                className={CONTROL_CLASS}
                                            />
                                        </Field>
                                    </div>
                                    <Field label="اللون">
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                            {COLOR_OPTIONS.map((color) => (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => setEditingGame((prev) => prev ? { ...prev, color: color.value } : prev)}
                                                    title={color.label}
                                                    className={`h-11 rounded-xl bg-gradient-to-l ${color.className} border transition ${editingGame.color === color.value ? 'border-white scale-[1.03] shadow-lg' : 'border-white/10 opacity-75 hover:opacity-100'}`}
                                                />
                                            ))}
                                        </div>
                                    </Field>
                                    <Field label="الحالة">
                                        <button
                                            type="button"
                                            onClick={() => setEditingGame((prev) => prev ? { ...prev, isActive: !(prev.isActive ?? true) } : prev)}
                                            className={`w-full h-12 rounded-2xl border flex items-center justify-center gap-2 font-black transition ${editingGame.isActive ?? true
                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                                : 'bg-white/5 border-white/10 text-gray-400'
                                                }`}
                                        >
                                            <CheckCircle2 size={18} />
                                            {(editingGame.isActive ?? true) ? 'مفعلة للمستخدمين' : 'معطلة'}
                                        </button>
                                    </Field>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div>
                                            <h4 className="text-xl font-black text-white">أسئلة اللعبة</h4>
                                            <p className="text-gray-500 text-sm font-bold">كل سؤال يتحفظ داخل نفس اللعبة لتسهيل إدارة النسخة الأولى.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addQuestion}
                                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center gap-2 transition"
                                        >
                                            <Plus size={18} />
                                            إضافة سؤال
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {(editingGame.questions || []).map((question, index) => (
                                            <QuestionEditor
                                                key={question.id || index}
                                                question={question}
                                                index={index}
                                                type={editorType}
                                                onChange={(patch) => updateQuestion(index, patch)}
                                                onDelete={() => removeQuestion(index)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-white/10">
                                    <p className="text-xs text-gray-500 font-bold">
                                        الحد اليومي يطبق من السيرفر: العادي 5، السيلفر 25، والبرو/Enterprise مفتوح.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={closeEditor}
                                            disabled={saving}
                                            className="px-5 py-3 rounded-2xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-bold disabled:opacity-50 transition"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleSave()}
                                            disabled={saving}
                                            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black shadow-lg shadow-red-950/30 disabled:opacity-50 transition flex items-center gap-2"
                                        >
                                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            حفظ اللعبة
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.section>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="min-h-[280px] flex items-center justify-center rounded-[2rem] border border-white/10 bg-white/5">
                    <Loader2 size={42} className="animate-spin text-red-500" />
                </div>
            ) : filteredGames.length === 0 ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center">
                    <Gamepad2 size={42} className="mx-auto text-gray-500 mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">لا توجد ألعاب بهذه اللغة</h3>
                    <p className="text-gray-500 font-bold mb-5">ابدأ بلعبة واحدة وأسئلة قليلة، وبعدها زود المحتوى من نفس الشاشة.</p>
                    <button type="button" onClick={openCreate} className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black inline-flex items-center gap-2">
                        <Plus size={18} />
                        إنشاء أول لعبة
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {filteredGames.map((game, index) => {
                        const meta = GAME_TYPES[game.type] || GAME_TYPES.word_match;
                        const Icon = meta.Icon;
                        const color = COLOR_OPTIONS.find((c) => c.value === game.color)?.className || meta.accent;
                        return (
                            <m.article
                                key={game.id}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="group rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/[0.07] transition overflow-hidden"
                            >
                                <div className={`h-2 bg-gradient-to-l ${color}`} />
                                <div className="p-5 space-y-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-l ${color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                                <Icon size={25} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-white/10 text-gray-300 border border-white/10">{meta.label}</span>
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${game.isActive ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                        {game.isActive ? 'مفعلة' : 'معطلة'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-white truncate">{game.title}</h3>
                                                <p className="text-sm text-gray-500 font-bold line-clamp-2 mt-1">{game.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <MiniMetric label="مستوى" value={game.subLevel || game.level} icon={Gamepad2} />
                                        <MiniMetric label="وقت" value={`${game.timeLimitSeconds}s`} icon={Timer} />
                                        <MiniMetric label="XP" value={String(game.xpReward)} icon={Trophy} />
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                                        <span className="text-xs text-gray-500 font-black">{game.questionCount || game.questions?.length || 0} سؤال</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(game)}
                                                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition"
                                                title="تعديل"
                                            >
                                                <Edit2 size={17} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDelete(game)}
                                                disabled={saving}
                                                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white transition disabled:opacity-50"
                                                title="حذف"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </m.article>
                        );
                    })}
                </div>
            )}
        </m.div>
    );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="block">
        <span className="block text-xs font-black text-gray-400 mb-2">{label}</span>
        {children}
    </div>
);

const StatBox: React.FC<{ label: string; value: string; icon: LucideIcon }> = ({ label, value, icon: Icon }) => (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-white">
        <Icon size={20} className="text-white/60 mb-3" />
        <div className="text-2xl font-black leading-none">{value}</div>
        <div className="text-[11px] text-white/55 font-bold mt-1">{label}</div>
    </div>
);

const MiniMetric: React.FC<{ label: string; value: string; icon: LucideIcon }> = ({ label, value, icon: Icon }) => (
    <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-3">
        <Icon size={15} className="text-gray-500 mb-2" />
        <div className="text-white font-black text-sm truncate">{value}</div>
        <div className="text-[10px] text-gray-500 font-bold">{label}</div>
    </div>
);

const QuestionEditor: React.FC<{
    question: EditableQuestion;
    index: number;
    type: GameType;
    onChange: (patch: EditableQuestion) => void;
    onDelete: () => void;
}> = ({ question, index, type, onChange, onDelete }) => {
    const typeMeta = GAME_TYPES[type];

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-l ${typeMeta.accent} text-white flex items-center justify-center font-black`}>
                        {index + 1}
                    </div>
                    <div>
                        <h5 className="text-white font-black">سؤال {index + 1}</h5>
                        <p className="text-[11px] text-gray-500 font-bold">{typeMeta.label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onChange({ isActive: !(question.isActive ?? true) })}
                        className={`px-3 py-2 rounded-xl text-xs font-black border transition ${(question.isActive ?? true)
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-white/5 text-gray-400 border-white/10'
                            }`}
                    >
                        {(question.isActive ?? true) ? 'نشط' : 'متوقف'}
                    </button>
                    <button type="button" onClick={onDelete} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white transition">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={type === 'listening' ? 'السؤال الظاهر للمستخدم' : 'نص السؤال / الكلمة'}>
                    <input
                        value={question.prompt || ''}
                        onChange={(e) => onChange({ prompt: e.target.value })}
                        className={CONTROL_CLASS}
                        placeholder={type === 'listening' ? 'اختر ما تسمعه' : 'مثال: airport'}
                    />
                </Field>
                <Field label="الإجابة الصحيحة">
                    <input
                        value={question.answer || ''}
                        onChange={(e) => onChange({ answer: e.target.value })}
                        className={CONTROL_CLASS}
                        placeholder={type === 'sentence_builder' ? 'I would like a coffee' : 'المطار'}
                        dir="ltr"
                    />
                </Field>
                <Field label="الترجمة أو المعنى بالعربي">
                    <input
                        value={question.translation || ''}
                        onChange={(e) => onChange({ translation: e.target.value })}
                        className={CONTROL_CLASS}
                        placeholder="ترجمة تظهر في الشرح أو المراجعة"
                    />
                </Field>
                {type === 'listening' && (
                    <Field label="النص الذي يتم نطقه">
                        <input
                            value={question.audioText || ''}
                            onChange={(e) => onChange({ audioText: e.target.value })}
                            className={CONTROL_CLASS}
                            placeholder="اتركه فارغاً لاستخدام السؤال أو الإجابة"
                            dir="ltr"
                        />
                    </Field>
                )}
                {type !== 'sentence_builder' && (
                    <Field label="الاختيارات، كل اختيار في سطر">
                        <textarea
                            value={joinLines(question.options)}
                            onChange={(e) => onChange({ options: splitLines(e.target.value) })}
                            rows={4}
                            className={`${CONTROL_CLASS} min-h-[112px]`}
                            placeholder="المطار&#10;المحطة&#10;الفندق"
                        />
                    </Field>
                )}
                {type === 'sentence_builder' && (
                    <Field label="كلمات الترتيب، كل كلمة في سطر">
                        <textarea
                            value={joinLines(question.tokens)}
                            onChange={(e) => onChange({ tokens: splitLines(e.target.value) })}
                            rows={4}
                            className={`${CONTROL_CLASS} min-h-[112px]`}
                            placeholder="I&#10;would&#10;like&#10;a&#10;coffee"
                            dir="ltr"
                        />
                    </Field>
                )}
                <Field label="شرح مختصر بعد الإجابة">
                    <textarea
                        value={question.explanation || ''}
                        onChange={(e) => onChange({ explanation: e.target.value })}
                        rows={4}
                        className={`${CONTROL_CLASS} min-h-[112px]`}
                        placeholder="اكتب سبب الإجابة أو ملاحظة تعليمية قصيرة"
                    />
                </Field>
            </div>
        </div>
    );
};
