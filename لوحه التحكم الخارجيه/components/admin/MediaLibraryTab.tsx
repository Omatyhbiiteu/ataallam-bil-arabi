import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image as ImageIcon, UploadCloud, Trash2, Copy, CheckCircle,
    FileVideo, Music, Search, Grid, List as ListIcon, AlertTriangle
} from 'lucide-react';
import { MediaItem } from '../../types';
import { AdminAPI } from '../../services/apiClient';

/* 
========================================================================================
🛑 رسالة هامة للمبرمجين (IMPORTANT NOTE FOR DEVELOPERS) 🛑
========================================================================================
لماذا قمنا بإنشاء مكتبة الوسائط هذه؟ (Why this Media Library?)

1. المشكلة (The Problem):
   حالياً، عند رفع صورة داخل القصة أو الدرس، يتم تحويلها إلى كود نصي طويل جداً (Base64).
   - صورة بحجم 2 ميجابايت تتحول إلى حوالي 2,600,000 حرف نصي!
   - مع تخزين 50 صورة فقط، سيصبح حجم ملف البيانات ضخماً (أكثر من 100 ميجابايت).
   - النتيجة: التطبيق سيصبح بطيئاً جداً، وقد ينهار (Crash) على هواتف الطلاب لأن الذاكرة ستمتلئ.

2. الحل (The Solution):
   - يجب أن نرفع الملفات الحقيقية (الصور/الفيديو) إلى خدمة تخزين سحابي محترفة (Cloud Storage) 
     مثل: Firebase Storage أو AWS S3 أو Cloudinary.
   - ما نخزنه في قاعدة البيانات هو "الرابط" فقط (URL) وهو عبارة عن سطر نصي صغير جداً.
   - مثال: "https://firebasestorage.googleapis.com/.../my-image.jpg"

3. وظيفة هذا القسم (Function):
   - هذه الواجهة هي "المكان المركزي" لإدارة جميع ملفات الميديا.
   - ترفع الصورة هنا -> تحصل على رابط (URL) -> تنسخ الرابط وتضعه في القصة أو الدرس.
   - هذا يضمن بقاء التطبيق خفيفاً وسريعاً كالصاروخ 🚀.

========================================================================================
*/

interface MediaLibraryTabProps {
    mediaItems: MediaItem[];
    setMediaItems: (items: MediaItem[]) => void;
}

type MediaFilter = 'all' | 'image' | 'video' | 'audio';
type UploadKind = MediaItem['type'];

const MEDIA_ACCEPT =
    'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/x-m4a,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.ogg,.mp3,.wav,.m4a,.aac';

const getFileKind = (file: File): UploadKind | null => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';

    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext) return null;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
    return null;
};

const getMaxFileSize = (kind: UploadKind) => {
    if (kind === 'image') return 5 * 1024 * 1024;
    if (kind === 'video') return 100 * 1024 * 1024;
    return 20 * 1024 * 1024;
};

const getMaxFileSizeLabel = (kind: UploadKind) => {
    if (kind === 'image') return '5 ميجابايت';
    if (kind === 'video') return '100 ميجابايت';
    return '20 ميجابايت';
};

export const MediaLibraryTab: React.FC<MediaLibraryTabProps> = ({ mediaItems, setMediaItems }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<MediaFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter Items
    const filteredItems = mediaItems.filter(item => {
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const handleFileUpload = async (files: FileList | null) => {
        if (!files) return;
        const selectedFiles = Array.from(files);
        if (selectedFiles.length === 0) return;

        const validUploads: Array<{ file: File; kind: UploadKind }> = [];
        const rejected: string[] = [];

        selectedFiles.forEach((file) => {
            const kind = getFileKind(file);
            if (!kind) {
                rejected.push(`${file.name}: نوع الملف غير مدعوم`);
                return;
            }

            const maxFileSize = getMaxFileSize(kind);
            if (file.size > maxFileSize) {
                rejected.push(`${file.name}: الحد الأقصى ${getMaxFileSizeLabel(kind)}`);
                return;
            }

            validUploads.push({ file, kind });
        });

        if (validUploads.length === 0) {
            setUploadError(rejected.join(' | ') || 'لم يتم اختيار ملفات صالحة للرفع');
            setUploadMessage(null);
            return;
        }

        setUploadError(null);
        setUploadMessage(`جاري رفع ${validUploads.length} ملف...`);
        setUploading(true);
        try {
            const results = await Promise.allSettled(
                validUploads.map(async ({ file, kind }) => {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('kind', kind);
                    const { url } = await AdminAPI.uploadMedia(fd);

                    return {
                        id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                            ? crypto.randomUUID()
                            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        name: file.name,
                        type: kind,
                        url,
                        size: file.size,
                        uploadedAt: new Date().toISOString()
                    } satisfies MediaItem;
                })
            );

            const newItems = results
                .filter((result): result is PromiseFulfilledResult<MediaItem> => result.status === 'fulfilled')
                .map(result => result.value);

            const failedUploads = results.flatMap((result, index) => {
                if (result.status === 'fulfilled') return [];
                const fileName = validUploads[index]?.file.name || 'ملف';
                const reason = result.reason?.message || 'فشل الرفع';
                return [`${fileName}: ${reason}`];
            });

            if (newItems.length > 0) {
                setMediaItems([...newItems, ...mediaItems]);
                setUploadMessage(`تم رفع ${newItems.length} ملف بنجاح`);
            } else {
                setUploadMessage(null);
            }

            const errors = [...rejected, ...failedUploads];
            setUploadError(errors.length > 0 ? errors.join(' | ') : null);
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        // Toast handled in parent ideally, but simple alert for now
        alert('تم نسخ الرابط! يمكنك الآن استخدامه في القصص أو الدروس.');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.')) {
            setMediaItems(mediaItems.filter(i => i.id !== id));
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    return (
        <motion.div
            key="media-library"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-[calc(100vh-140px)] flex flex-col gap-6"
        >
            {(uploadError || uploadMessage) && (
                <div
                    className={`rounded-2xl border px-5 py-4 text-sm font-bold ${
                        uploadError
                            ? 'bg-red-500/10 border-red-500/30 text-red-200'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    }`}
                    role="status"
                >
                    {uploadError || uploadMessage}
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                        <ImageIcon className="text-pink-500" />
                        مكتبة الوسائط
                    </h2>
                    <p className="text-gray-400 font-medium text-sm max-w-xl">
                        قم برفع الصور والفيديوهات هنا للحصول على رابط (URL) سريع لاستخدامه في التطبيق.
                        هذا يحافظ على سرعة التطبيق ويمنع المشاكل التقنية.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <ListIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Upload Area */}
            <div
                className={`border-3 border-dashed rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? 'border-pink-500 bg-pink-500/10 scale-[1.01]' : 'border-white/10 bg-slate-900 hover:border-white/20 hover:bg-white/5'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept={MEDIA_ACCEPT}
                    disabled={uploading}
                    onChange={(e) => {
                        void handleFileUpload(e.target.files);
                        e.target.value = '';
                    }}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                        <p className="font-bold text-white">{uploadMessage || 'جاري رفع الملفات للخادم...'}</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-pink-900/20">
                            <UploadCloud size={32} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">اضغط أو اسحب الملفات هنا للرفع</h3>
                        <p className="text-gray-500 text-sm">ندعم JPG/PNG/WebP/GIF و MP4/WebM و MP3/WAV/M4A/AAC</p>
                    </>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-900 p-4 rounded-3xl border border-white/5">
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="بحث باسم الملف..."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white outline-none focus:border-pink-500 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 text-sm font-bold">
                    <button onClick={() => setFilterType('all')} className={`px-4 py-3 rounded-xl transition-colors ${filterType === 'all' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>الكل</button>
                    <button onClick={() => setFilterType('image')} className={`px-4 py-3 rounded-xl transition-colors ${filterType === 'image' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>صور</button>
                    <button onClick={() => setFilterType('video')} className={`px-4 py-3 rounded-xl transition-colors ${filterType === 'video' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>فيديو</button>
                    <button onClick={() => setFilterType('audio')} className={`px-4 py-3 rounded-xl transition-colors ${filterType === 'audio' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>صوت</button>
                </div>
            </div>

            {/* Content Gallery */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
                {filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                        <AlertTriangle size={48} className="mb-4" />
                        <p>لا توجد ملفات مطابقة</p>
                    </div>
                ) : (
                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1'}`}>
                        <AnimatePresence>
                            {filteredItems.map(item => (
                                <MediaCard
                                    key={item.id}
                                    item={item}
                                    viewMode={viewMode}
                                    onDelete={() => handleDelete(item.id)}
                                    onCopy={() => copyToClipboard(item.url)}
                                    formatSize={formatSize}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const MediaCard = ({ item, viewMode, onDelete, onCopy, formatSize }: any) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`bg-slate-900 border border-white/5 rounded-2xl overflow-hidden group hover:border-pink-500/50 transition-all ${viewMode === 'list' ? 'flex items-center p-4 gap-4' : 'flex flex-col'
                }`}
        >
            {/* Preview */}
            <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-24 h-24 rounded-xl flex-shrink-0' : 'aspect-square w-full'}`}>
                {item.type === 'image' ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : item.type === 'video' ? (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center text-pink-500">
                        <FileVideo size={32} />
                    </div>
                ) : (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center text-amber-500">
                        <Music size={32} />
                    </div>
                )}

                {/* Overlay actions (Grid mode) */}
                {viewMode === 'grid' && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button onClick={onCopy} className="p-2 bg-white/10 hover:bg-white text-white hover:text-pink-600 rounded-full backdrop-blur-sm transition-all" title="نسخ الرابط">
                            <Copy size={20} />
                        </button>
                        <button onClick={onDelete} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full backdrop-blur-sm transition-all" title="حذف">
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className={`${viewMode === 'list' ? 'flex-1 flex items-center justify-between' : 'p-4'}`}>
                <div className="overflow-hidden">
                    <h4 className="font-bold text-white text-sm truncate mb-1" title={item.name}>{item.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono">{formatSize(item.size)} • {new Date(item.uploadedAt).toLocaleDateString()}</p>
                </div>

                {viewMode === 'list' && (
                    <div className="flex gap-2">
                        <button onClick={onCopy} className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-xs">
                            <Copy size={16} /> نسخ الرابط
                        </button>
                        <button onClick={onDelete} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
