import React, { useState, useMemo } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Layers, ChevronRight, X, Home,
    FolderPlus, Image as ImageIcon, Edit2, Save,
    ArrowRight, Folder as FolderIcon, ShieldCheck
} from 'lucide-react';
import { Folder, Card } from '../../types';
import { AdminAPI } from '../../services/apiClient';
import { AdminLang } from './AdminSidebar';
import { ConfirmModal } from '../ConfirmModal';
import { CardImageLibraryPanel } from './CardImageLibraryPanel';

const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

const FOLDER_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-red-500', 'bg-cyan-500', 'bg-yellow-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500'
];

const MAX_DEPTH = 2; // root → sub → sub-sub
const MAX_CARD_IMAGE_SIZE = 5 * 1024 * 1024;
const CARD_IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp';
type CardImageFit = 'wide' | 'portrait';

const CARD_IMAGE_FIT_OPTIONS: Array<{ value: CardImageFit; label: string; description: string }> = [
    { value: 'wide', label: 'عريض', description: 'لصور 16:9 أو الصور الأفقية' },
    { value: 'portrait', label: 'طولي', description: 'لصور 9:16 أو الصور الرأسية' },
];

const inferImageFit = (width: number, height: number): CardImageFit => {
    if (!width || !height) return 'wide';
    return width / height < 0.85 ? 'portrait' : 'wide';
};

const detectImageFitFromFile = (file: File): Promise<CardImageFit> => (
    new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(inferImageFit(img.naturalWidth, img.naturalHeight));
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve('wide');
        };
        img.src = objectUrl;
    })
);

const getFolderDepth = (folderId: string | null, allFolders: Folder[]): number => {
    if (!folderId) return -1;
    let depth = 0;
    let cur = allFolders.find(f => f.id === folderId);
    while (cur?.parentId) {
        depth++;
        cur = allFolders.find(f => f.id === cur!.parentId);
    }
    return depth;
};

interface FoldersTabProps {
    folders: Folder[];
    cards: Card[];
    showToast: (msg: string, type: 'error' | 'success' | 'info') => void;
    adminLang: AdminLang;
    learningLang: 'en' | 'de';
    refreshFoldersFromApi: () => Promise<void>;
}

const folderSaveLabel = (f: Folder & { _lang?: string }): string => {
    const cl = f.contentLang;
    if (cl === 'both') {
        return 'EN + DE';
    }
    if (cl === 'de') {
        return 'DE';
    }
    if (cl === 'en') {
        return 'EN';
    }
    if (f._lang === 'de') {
        return 'DE';
    }
    return 'EN';
};

export const FoldersTab: React.FC<FoldersTabProps> = ({
    folders,
    cards,
    showToast,
    adminLang,
    learningLang,
    refreshFoldersFromApi,
}) => {
    const storageLang: 'en' | 'de' = adminLang === 'both' ? learningLang : adminLang;

    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{ kind: 'folder' | 'card'; id: string } | null>(null);

    // Navigation
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Folder Form
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [newFolder, setNewFolder] = useState({ name: '', color: FOLDER_COLORS[0] });

    // Card Form
    const [showCardForm, setShowCardForm] = useState(false);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [cardForm, setCardForm] = useState<{ front: string; back: string; image: string; imageFit: CardImageFit }>({ front: '', back: '', image: '', imageFit: 'wide' });
    const [cardImageUploading, setCardImageUploading] = useState(false);
    const [cardImageFileName, setCardImageFileName] = useState<string | null>(null);

    // ─── Computed ───────────────────────────────────────────────
    const currentFolder = useMemo(
        () => folders.find(f => f.id === currentFolderId) ?? null,
        [folders, currentFolderId]
    );

    const subFolders = useMemo(
        () =>
            folders.filter(f =>
                currentFolderId ? f.parentId === currentFolderId : !f.parentId
            ),
        [folders, currentFolderId]
    );

    const folderCards = useMemo(
        () => (currentFolderId ? cards.filter(c => c.folderId === currentFolderId) : []),
        [cards, currentFolderId]
    );

    const breadcrumbs = useMemo(() => {
        const path: Folder[] = [];
        let f = currentFolder;
        while (f) {
            path.unshift(f);
            f = folders.find(x => x.id === f?.parentId) ?? null;
        }
        return path;
    }, [folders, currentFolder]);

    const canAddSubfolder = currentFolderId
        ? getFolderDepth(currentFolderId, folders) < MAX_DEPTH
        : true;

    // ─── Handlers ───────────────────────────────────────────────
    const handleSaveFolder = async () => {
        if (!newFolder.name.trim()) {
            showToast('يرجى كتابة اسم المجلد', 'error');
            return;
        }
        const contentLang: 'en' | 'de' | 'both' = adminLang === 'both' ? 'both' : adminLang;
        const id = generateId();
        const payload = {
            id,
            name: newFolder.name.trim(),
            color: newFolder.color,
            parentId: currentFolderId ?? undefined,
            isSystem: true,
            contentLang,
        };
        setSaving(true);
        try {
            if (adminLang === 'both') {
                await AdminAPI.createSystemFolder('en', payload);
                await AdminAPI.createSystemFolder('de', payload);
            } else {
                await AdminAPI.createSystemFolder(storageLang, payload);
            }
            await refreshFoldersFromApi();
            setNewFolder({ name: '', color: FOLDER_COLORS[0] });
            setShowFolderForm(false);
            showToast('تم إنشاء المجلد على الخادم ✅', 'success');
        } catch (e: any) {
            showToast(e?.message || 'فشل حفظ المجلد', 'error');
        } finally {
            setSaving(false);
        }
    };

    const runDeleteFolder = async (id: string) => {
        const collectIds = (fid: string): string[] => {
            const children = folders.filter(f => f.parentId === fid);
            return [fid, ...children.flatMap(c => collectIds(c.id))];
        };
        const idsToRemove = collectIds(id);
        setSaving(true);
        try {
            for (const fid of idsToRemove) {
                for (const lang of ['en', 'de'] as const) {
                    try {
                        await AdminAPI.deleteSystemFolder(lang, fid);
                    } catch {
                        /* قد لا يوجد الصف في هذه اللغة */
                    }
                }
            }
            await refreshFoldersFromApi();
            showToast('تم حذف المجلد وما بداخله', 'info');
        } catch (e: any) {
            showToast(e?.message || 'فشل الحذف', 'error');
        } finally {
            setSaving(false);
        }
    };

    const openNewCard = () => {
        setEditingCardId(null);
        setCardForm({ front: '', back: '', image: '', imageFit: 'wide' });
        setCardImageFileName(null);
        setShowCardForm(true);
    };

    const openEditCard = (card: Card) => {
        setEditingCardId(card.id);
        setCardForm({
            front: card.frontText,
            back: card.backText,
            image: card.frontImage || '',
            imageFit: card.frontImageFit === 'portrait' ? 'portrait' : 'wide',
        });
        setCardImageFileName(null);
        setShowCardForm(true);
    };

    const makeCardPayload = (id: string | undefined, now: number) => ({
        ...(id ? { id } : {}),
        folderId: currentFolderId!,
        frontText: cardForm.front.trim(),
        backText: cardForm.back.trim(),
        frontImage: cardForm.image || null,
        frontImageFit: cardForm.image ? cardForm.imageFit : null,
        isSystem: true,
        nextReview: now,
        interval: 0,
        reviews: 0,
        easeFactor: 2.5,
        status: 'new',
    });

    const handleSaveCard = async () => {
        if (!currentFolderId) {
            return;
        }
        if (cardImageUploading) {
            showToast('استنى لحد ما رفع صورة البطاقة يخلص', 'info');
            return;
        }
        if (!cardForm.front.trim() || !cardForm.back.trim()) {
            showToast('يجب ملء الوجه الأمامي والخلفي', 'error');
            return;
        }
        const now = Date.now();
        setSaving(true);
        const wasEditing = !!editingCardId;
        try {
            if (editingCardId) {
                const payload = {
                    folderId: currentFolderId,
                    frontText: cardForm.front.trim(),
                    backText: cardForm.back.trim(),
                    frontImage: cardForm.image || null,
                    frontImageFit: cardForm.image ? cardForm.imageFit : null,
                    isSystem: true,
                };
                if (adminLang === 'both') {
                    await AdminAPI.updateSystemCard('en', editingCardId, payload);
                    await AdminAPI.updateSystemCard('de', editingCardId, payload);
                } else {
                    await AdminAPI.updateSystemCard(storageLang, editingCardId, payload);
                }
            } else {
                if (adminLang === 'both') {
                    const id = generateId();
                    await AdminAPI.createSystemCard('en', makeCardPayload(id, now));
                    await AdminAPI.createSystemCard('de', makeCardPayload(id, now));
                } else {
                    await AdminAPI.createSystemCard(storageLang, makeCardPayload(generateId(), now));
                }
            }
            await refreshFoldersFromApi();
            setCardForm({ front: '', back: '', image: '', imageFit: 'wide' });
            setCardImageFileName(null);
            setEditingCardId(null);
            setShowCardForm(false);
            showToast(wasEditing ? 'تم تعديل البطاقة ✅' : 'تم إضافة البطاقة 🎉', 'success');
        } catch (e: any) {
            showToast(e?.message || 'فشل حفظ البطاقة', 'error');
        } finally {
            setSaving(false);
        }
    };

    const runDeleteCard = async (id: string) => {
        setSaving(true);
        try {
            if (adminLang === 'both') {
                try {
                    await AdminAPI.deleteSystemCard('en', id);
                } catch { /* */ }
                try {
                    await AdminAPI.deleteSystemCard('de', id);
                } catch { /* */ }
            } else {
                await AdminAPI.deleteSystemCard(storageLang, id);
            }
            await refreshFoldersFromApi();
            showToast('تم حذف البطاقة', 'info');
        } catch (e: any) {
            showToast(e?.message || 'فشل الحذف', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('اختار ملف صورة فقط', 'error');
            return;
        }
        if (file.size > MAX_CARD_IMAGE_SIZE) {
            showToast('حجم صورة البطاقة كبير جداً. الحد الأقصى 5 ميجابايت', 'error');
            return;
        }

        setCardImageUploading(true);
        setCardImageFileName(file.name);
        try {
            const imageFit = await detectImageFitFromFile(file);
            const fd = new FormData();
            fd.append('file', file);
            fd.append('kind', 'image');
            const { url } = await AdminAPI.uploadMedia(fd);
            setCardForm(p => ({ ...p, image: url, imageFit }));
            showToast('تم رفع صورة البطاقة وربط الرابط', 'success');
        } catch (err: any) {
            setCardImageFileName(null);
            showToast(err?.message || 'فشل رفع صورة البطاقة', 'error');
        } finally {
            setCardImageUploading(false);
        }
    };

    // ─── Render ─────────────────────────────────────────────────
    return (
        <m.div
            key="folders"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            {/* ── Header ── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white mb-1">
                        {currentFolder ? currentFolder.name : 'المجلدات العامة'}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">
                        {currentFolder ? 'إدارة المجلدات الفرعية والبطاقات' : 'مجلدات النظام الرئيسية'}
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {currentFolderId && canAddSubfolder && (
                        <button
                            onClick={() => setShowFolderForm(true)}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all"
                        >
                            <FolderPlus size={18} className="text-blue-400" />
                            مجلد فرعي
                        </button>
                    )}
                    {currentFolderId && (
                        <button
                            onClick={openNewCard}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-900/20"
                        >
                            <Plus size={18} />
                            بطاقة جديدة
                        </button>
                    )}
                    {!currentFolderId && (
                        <button
                            onClick={() => setShowFolderForm(true)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-red-900/20"
                        >
                            <Plus size={20} />
                            مجلد جديد
                        </button>
                    )}
                </div>
            </header>

            {!currentFolderId && (
                <CardImageLibraryPanel adminLang={adminLang} learningLang={learningLang} showToast={showToast} />
            )}

            {/* ── Breadcrumbs ── */}
            {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setCurrentFolderId(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition text-sm font-bold"
                    >
                        <Home size={14} /> الرئيسية
                    </button>
                    {breadcrumbs.map((f, idx) => (
                        <React.Fragment key={f.id}>
                            <ChevronRight size={14} className="text-gray-700" />
                            <button
                                onClick={() => setCurrentFolderId(f.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${idx === breadcrumbs.length - 1
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                                    }`}
                            >
                                {f.name}
                            </button>
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* ── Subfolders ── */}
            <section>
                <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">
                    {currentFolderId ? 'المجلدات الفرعية' : 'المجلدات'}
                </h3>
                {subFolders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-[2rem] text-gray-600">
                        <FolderIcon size={36} className="mb-3 opacity-30" />
                        <p className="font-bold text-sm">لا توجد مجلدات هنا</p>
                        {currentFolderId && canAddSubfolder && (
                            <button
                                onClick={() => setShowFolderForm(true)}
                                className="mt-4 text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1"
                            >
                                <Plus size={14} /> أضف مجلداً فرعياً
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {subFolders.map(folder => {
                            const folderCardCount = cards.filter(c => c.folderId === folder.id).length;
                            const childCount = folders.filter(f => f.parentId === folder.id).length;
                            return (
                                <m.div
                                    key={folder.id}
                                    whileHover={{ y: -4 }}
                                    className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 flex flex-col group hover:bg-white/8 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-14 h-14 rounded-2xl ${folder.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                            <Layers size={24} />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPendingDelete({ kind: 'folder', id: folder.id })}
                                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h4 className="font-black text-white text-lg mb-1 truncate">{folder.name}</h4>
                                    <p className="text-[10px] font-black text-amber-400/90 mb-1">
                                        وجهة الحفظ: {folderSaveLabel(folder as Folder & { _lang?: string })}
                                    </p>
                                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-bold mb-4">
                                        <span>{folderCardCount} بطاقة</span>
                                        {childCount > 0 && <><span>·</span><span>{childCount} فرعي</span></>}
                                        {folder.isSystem && (
                                            <span className="flex items-center gap-1 text-blue-500">
                                                <ShieldCheck size={10} /> نظام
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setCurrentFolderId(folder.id)}
                                        className="mt-auto w-full bg-white/5 hover:bg-red-600 py-3 rounded-xl text-sm font-bold transition-all border border-white/5 flex items-center justify-center gap-2 group/btn text-gray-300 hover:text-white"
                                    >
                                        <span>فتح المجلد</span>
                                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </m.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Cards (only inside a folder) ── */}
            {currentFolderId && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                            بطاقات هذا المجلد ({folderCards.length})
                        </h3>
                    </div>
                    {folderCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/5 rounded-[2rem] text-gray-600">
                            <Layers size={32} className="mb-3 opacity-30" />
                            <p className="font-bold text-sm">لا توجد بطاقات في هذا المجلد</p>
                            <button
                                onClick={openNewCard}
                                className="mt-4 text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1"
                            >
                                <Plus size={14} /> أضف بطاقة الآن
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {folderCards.map(card => (
                                <div
                                    key={card.id}
                                    className="bg-white/5 rounded-2xl p-5 border border-white/5 group hover:bg-white/10 transition-all flex flex-col"
                                >
                                    {card.frontImage && (
                                        <div className={`relative w-full ${card.frontImageFit === 'portrait' ? 'h-40 max-w-28 mx-auto' : 'h-28'} rounded-xl mb-3 overflow-hidden bg-white/5`}>
                                            <img
                                                src={card.frontImage}
                                                alt=""
                                                aria-hidden="true"
                                                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35"
                                            />
                                            <img
                                                src={card.frontImage}
                                                alt=""
                                                className={card.frontImageFit === 'portrait'
                                                    ? 'relative z-[1] h-full w-auto max-w-full object-contain p-2 mx-auto'
                                                    : 'relative z-[1] w-full h-full object-cover'
                                                }
                                            />
                                        </div>
                                    )}
                                    <p className="text-white font-black text-base mb-1 truncate">{card.frontText}</p>
                                    <p className="text-gray-500 text-xs mb-4 truncate">{card.backText}</p>
                                    <div className="flex gap-2 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditCard(card)}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-bold transition"
                                        >
                                            <Edit2 size={12} /> تعديل
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPendingDelete({ kind: 'card', id: card.id })}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold transition"
                                        >
                                            <Trash2 size={12} /> حذف
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ── Folder Form Modal ── */}
            <AnimatePresence>
                {showFolderForm && (
                    <div className="fixed inset-0 bg-[#0B0D17]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
                        <m.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 w-full max-w-md rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-xl font-black text-white">
                                    {currentFolderId ? 'مجلد فرعي جديد' : 'مجلد جديد'}
                                </h3>
                                <button onClick={() => setShowFolderForm(false)} className="p-3 hover:bg-white/5 rounded-2xl transition">
                                    <X className="text-gray-400" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    سيتم ربط المجلد بلغة <span className="font-black text-amber-400">وجهة الحفظ</span> الحالية في الشريط الجانبي
                                    {adminLang === 'both' ? ' (EN + DE)' : adminLang === 'de' ? ' (DE)' : ' (EN)'}.
                                </p>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">اسم المجلد</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newFolder.name}
                                        onChange={e => setNewFolder({ ...newFolder, name: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveFolder()}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition"
                                        placeholder="مثال: أفعال التصريف"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">اللون</label>
                                    <div className="flex flex-wrap gap-2">
                                        {FOLDER_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setNewFolder({ ...newFolder, color: c })}
                                                className={`w-8 h-8 rounded-xl ${c} transition-transform ${newFolder.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void handleSaveFolder()}
                                    disabled={saving}
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-4 rounded-[2rem] font-black shadow-xl active:scale-95 transition"
                                >
                                    {saving ? 'جاري الحفظ…' : 'إنشاء المجلد'}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Card Form Modal ── */}
            <AnimatePresence>
                {showCardForm && (
                    <div className="fixed inset-0 bg-[#0B0D17]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
                        <m.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-xl font-black text-white">
                                    {editingCardId ? 'تعديل البطاقة' : 'بطاقة جديدة'}
                                </h3>
                                <button onClick={() => setShowCardForm(false)} className="p-3 hover:bg-white/5 rounded-2xl transition">
                                    <X className="text-gray-400" />
                                </button>
                            </div>
                            <div className="p-8 space-y-5 overflow-y-auto">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الوجه الأمامي (السؤال / الكلمة)</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={cardForm.front}
                                        onChange={e => setCardForm(p => ({ ...p, front: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition"
                                        placeholder="مثال: das Haus"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الوجه الخلفي (الإجابة / المعنى)</label>
                                    <input
                                        type="text"
                                        value={cardForm.back}
                                        onChange={e => setCardForm(p => ({ ...p, back: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-red-500/50 transition"
                                        placeholder="مثال: البيت"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">صورة (اختياري)</label>
                                    <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">مقاس صورة الكارت</span>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cardForm.imageFit === 'portrait' ? 'bg-red-500/10 text-red-300' : 'bg-white/10 text-gray-300'}`}>
                                                {cardForm.imageFit === 'portrait' ? 'طولي' : 'عريض'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CARD_IMAGE_FIT_OPTIONS.map((option) => {
                                                const selected = cardForm.imageFit === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        disabled={cardImageUploading}
                                                        onClick={() => setCardForm(p => ({ ...p, imageFit: option.value }))}
                                                        className={`rounded-2xl border p-3 text-right transition disabled:opacity-50 ${
                                                            selected
                                                                ? 'border-red-500/70 bg-red-500/10 text-red-300'
                                                                : 'border-white/10 bg-white/5 text-gray-400 hover:border-red-500/30 hover:text-white'
                                                        }`}
                                                    >
                                                        <span className="block text-sm font-black">{option.label}</span>
                                                        <span className="block text-[10px] font-bold leading-4 opacity-75 mt-1">{option.description}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => !cardImageUploading && (document.getElementById('adminCardImg') as HTMLInputElement)?.click()}
                                        className={`w-full ${cardForm.image && cardForm.imageFit === 'portrait' ? 'max-w-[180px] mx-auto aspect-[9/16]' : 'aspect-video'} bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center hover:border-red-500/30 transition overflow-hidden relative ${cardImageUploading ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
                                    >
                                        {cardForm.image ? (
                                            <>
                                                <img src={cardForm.image} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35" alt="" aria-hidden="true" />
                                                <img
                                                    src={cardForm.image}
                                                    className={cardForm.imageFit === 'portrait'
                                                        ? 'relative z-[1] h-full w-auto max-w-full object-contain p-2'
                                                        : 'relative z-[1] w-full h-full object-cover'
                                                    }
                                                    alt=""
                                                />
                                            </>
                                        ) : (
                                            <div className="text-center text-gray-600">
                                                <ImageIcon size={28} className="mx-auto mb-2" />
                                                <p className="text-xs font-bold">{cardImageUploading ? 'جاري رفع الصورة...' : 'انقر لاختيار صورة'}</p>
                                            </div>
                                        )}
                                        {cardImageUploading && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white">
                                                <div className="w-10 h-10 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
                                                <p className="text-xs font-black">{cardImageFileName || 'جاري رفع الصورة...'}</p>
                                            </div>
                                        )}
                                    </div>
                                    <input id="adminCardImg" type="file" accept={CARD_IMAGE_ACCEPT} className="hidden" disabled={cardImageUploading} onChange={handleImageUpload} />
                                    {cardForm.image && (
                                        <button
                                            type="button"
                                            disabled={cardImageUploading}
                                            onClick={() => {
                                                setCardForm(p => ({ ...p, image: '', imageFit: 'wide' }));
                                                setCardImageFileName(null);
                                            }}
                                            className="mt-2 text-xs text-red-500 hover:text-red-400 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            إزالة الصورة
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void handleSaveCard()}
                                    disabled={saving || cardImageUploading}
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-4 rounded-[2rem] font-black shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {cardImageUploading ? 'جاري رفع الصورة…' : saving ? 'جاري الحفظ…' : editingCardId ? 'حفظ التعديلات' : 'إضافة البطاقة'}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    const { kind, id } = pendingDelete;
                    void (kind === 'folder' ? runDeleteFolder(id) : runDeleteCard(id));
                }}
                title={pendingDelete?.kind === 'folder' ? 'حذف المجلد' : 'حذف البطاقة'}
                message={
                    pendingDelete?.kind === 'folder'
                        ? 'سيتم حذف هذا المجلد وجميع ما بداخله من الخادم. لا يمكن التراجع.'
                        : 'سيتم حذف هذه البطاقة من الخادم. لا يمكن التراجع.'
                }
                confirmText="حذف"
                cancelText="إلغاء"
                type="danger"
            />
        </m.div>
    );
};
