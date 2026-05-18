import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AddCardResult, Folder, Card, User as UserType, CardImageAsset, CardImageQuota } from '../types';
import { Plus, Trash2, ArrowRight, ShieldCheck, User, Folder as FolderIcon, X, Layers, PlayCircle, Zap, Volume2, ArrowLeft, Image as ImageIcon, Clock, Search, Filter, ArrowUpDown, RotateCw, MoreVertical, LayoutGrid, List as ListIcon, CheckCircle, Brain, Flame, Edit2, Home, ChevronRight, ChevronDown, Palette, Sparkles, Loader2 } from 'lucide-react';
import { detectLang, speakText } from '../services/ttsService';
import { CardImageAssetAPI } from '../services/apiClient';
import { ConfirmModal } from './ConfirmModal';
import { Toast } from './Toast';
import { FolderItem } from './FolderItem';
import { FolderFormModal } from './FolderFormModal';
import { EmptyState } from './EmptyState';
import { canUserManageCard, canUserManageFolder } from '../utils/folderPermissions';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';

interface FoldersViewProps {
    user: UserType | null;
    folders: Folder[];
    cards: Card[];
    onAddFolder: (name: string, color: string, parentId?: string) => void;
    onDeleteFolder: (id: string) => void;
    onEditFolder: (id: string, updates: Partial<Folder>) => void;
    onAddCard: (card: Partial<Card>) => void | Promise<AddCardResult | void>;
    onEditCard: (id: string, updates: Partial<Card>) => void;
    onDeleteCard: (id: string) => void;
    onEditCards: (ids: string[], updates: Partial<Card>) => void;
    onDeleteCards: (ids: string[]) => void;
    onDeleteAll: () => void;
    onStartSession: (folderId: string | null, mode: 'due' | 'all', specificCardIds?: string[]) => void;
    onNavigate: (tab: string) => void;
    onRefreshData?: () => Promise<unknown> | void;
    t: any;
    currentFolderId?: string | null;
    onFolderChange?: (id: string | null) => void;
    targetLanguage?: 'en' | 'de';
    /** اشتراك Pro/Enterprise نشط — يفعّل المجلدات الفرعية وحدوداً أوسع */
    isProSubscriber?: boolean;
}

const CountdownTimer = ({ nextReview, now }: { nextReview: number; now: number }) => {
    const timeLeft = nextReview - now;
    if (timeLeft <= 0) return null;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    let label = '';
    if (days > 365) {
        label = `${Math.floor(days / 365)} سنة`;
    } else if (days > 30) {
        label = `${Math.floor(days / 30)} شهر`;
    } else if (days > 0) {
        label = `${days} يوم${hours > 0 ? ` ${hours} س` : ''}`;
    } else if (hours > 0) {
        label = `${hours} س ${minutes.toString().padStart(2, '0')} د`;
    } else {
        label = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-gray-800 rounded-lg text-xs font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors whitespace-nowrap"
            title={`يفتح في ${new Date(nextReview).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}`}
        >
            <Clock size={14} className={days === 0 ? "animate-pulse" : ""} />
            <span className="font-mono pt-0.5">{label}</span>
        </div>
    );
};

const getFolderFamilyIds = (parentId: string, allFolders: Folder[]): string[] => {
    const children = allFolders.filter(f => f.parentId === parentId);
    let ids = children.map(c => c.id);
    children.forEach(child => {
        ids = [...ids, ...getFolderFamilyIds(child.id, allFolders)];
    });
    return ids;
};

// يحسب عمق المجلد: 0 = رئيسي، 1 = فرعي، 2 = فرعي داخل فرعي (الحد الأقصى)
const getFolderDepth = (folderId: string | null, allFolders: Folder[]): number => {
    if (!folderId) return -1;
    let depth = 0;
    let current = allFolders.find(f => f.id === folderId);
    while (current?.parentId) {
        depth++;
        current = allFolders.find(f => f.id === current!.parentId);
    }
    return depth;
};

const MAX_FOLDER_DEPTH = 2; // مجلد رئيسي → فرعي → فرعي داخل فرعي

/** حدود توليد الجمل التوضيحية بالـ AI من نموذج البطاقة (يوميّة، بتوقيت الجهاز) */
function cardSentenceDailyStorageKey(userId: string): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `card_ai_sentence_daily_v1_${userId}_${y}-${m}-${day}`;
}

function readCardSentenceDailyCount(userId: string): number {
    try {
        return Math.max(0, Number(localStorage.getItem(cardSentenceDailyStorageKey(userId)) || 0));
    } catch {
        return 0;
    }
}

function incrementCardSentenceDailyCount(userId: string): void {
    const k = cardSentenceDailyStorageKey(userId);
    localStorage.setItem(k, String(readCardSentenceDailyCount(userId) + 1));
}

function paidCardSentenceDailyLimit(plan: string | undefined): number | null {
    if (plan === 'silver') return 10;
    if (plan === 'pro' || plan === 'enterprise') return 20;
    return null;
}

function hasActiveCardImagePlan(plan: UserType['plan'] | undefined, activeSubscription: boolean): boolean {
    return activeSubscription && (plan === 'silver' || plan === 'pro' || plan === 'enterprise');
}

function isUnlimitedCardImagePlan(plan: UserType['plan'] | undefined): boolean {
    return plan === 'pro' || plan === 'enterprise';
}

function formatImageQuotaCountdown(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatImageQuotaResetText(totalSeconds: number): string {
    if (totalSeconds <= 0) return 'بعد قليل';
    return `غداً بعد ${formatImageQuotaCountdown(totalSeconds)}`;
}

const SORT_OPTIONS: { value: 'newest' | 'oldest' | 'due' | 'hard' | 'alpha'; label: string }[] = [
    { value: 'newest', label: 'الأحدث' },
    { value: 'oldest', label: 'الأقدم' },
    { value: 'due', label: 'الأقرب للاستحقاق' },
    { value: 'hard', label: 'الأصعب' },
    { value: 'alpha', label: 'ترتيب أبجدي' }
];

type CardImageFit = 'wide' | 'portrait';
type DetectedImageFit = CardImageFit | 'unknown';

const CARD_IMAGE_FIT_OPTIONS: Array<{ value: CardImageFit; label: string; description: string }> = [
    { value: 'wide', label: 'عريض', description: 'مناسب للصور 16:9 أو الصور الأفقية' },
    { value: 'portrait', label: 'طولي', description: 'مناسب للصور 9:16 أو الشخصيات' },
];

const inferImageFit = (width: number, height: number): CardImageFit => {
    if (!width || !height) return 'wide';
    return width / height < 0.85 ? 'portrait' : 'wide';
};

export const FoldersView: React.FC<FoldersViewProps> = ({
    user, folders, cards, onAddFolder, onDeleteFolder, onEditFolder, onAddCard, onEditCard, onDeleteCard, onEditCards, onDeleteCards, onDeleteAll, onStartSession, onNavigate, onRefreshData, t,
    currentFolderId: propFolderId, onFolderChange, targetLanguage = 'en', isProSubscriber = false
}) => {
    // Internal state for fallback
    const [internalFolderId, setInternalFolderId] = useState<string | null>(null);
    const currentFolderId = propFolderId !== undefined ? propFolderId : internalFolderId;

    // Stable callback for changing folder
    const setCurrentFolderId = useCallback((id: string | null) => {
        if (onFolderChange) onFolderChange(id);
        else setInternalFolderId(id);
    }, [onFolderChange]);

    // لو المجلد الحالي اتحذف من السيرفر (مثلاً عبر لوحة المسئول)، ارجع تلقائياً لقائمة المجلدات
    useEffect(() => {
        if (!currentFolderId) return;
        const stillExists = folders.some((f) => f.id === currentFolderId);
        if (!stillExists) {
            setCurrentFolderId(null);
        }
    }, [currentFolderId, folders, setCurrentFolderId]);

    const [showFolderModal, setShowFolderModal] = useState(false);
    const [editingFolderData, setEditingFolderData] = useState<Folder | null>(null);

    const [showCardModal, setShowCardModal] = useState(false);
    const [now, setNow] = useState(Date.now());

    // Messages
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [toastMessage, setToastMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);

    // Memoize showToast to prevent it changing (unlikely to be passed down much, but good practice)
    const showToast = useCallback((text: string, type: 'error' | 'success' | 'info' = 'info') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // Card State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'learning' | 'review' | 'mastered'>('all');
    const [includeSubfolders, setIncludeSubfolders] = useState(false);
    const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'due' | 'hard' | 'alpha'>('oldest');
    const [sortMenuOpen, setSortMenuOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(24);
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
    const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);
    const [detectedImageFits, setDetectedImageFits] = useState<Record<string, DetectedImageFit>>({});
    const [moveTargetFolderId, setMoveTargetFolderId] = useState('');

    const speakCardText = useCallback((text: string) => {
        const detected = detectLang(text);
        speakText(text, detected === 'ar' ? 'ar' : targetLanguage);
    }, [targetLanguage]);

    const handleCardImageLoad = useCallback((cardId: string, event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        const detected = inferImageFit(img.naturalWidth, img.naturalHeight);
        setDetectedImageFits((prev) => (prev[cardId] === detected ? prev : { ...prev, [cardId]: detected }));
    }, []);

    const resolveCardImageFit = useCallback((card: Card): CardImageFit => {
        if (card.frontImageFit === 'portrait' || card.frontImageFit === 'wide') {
            return card.frontImageFit;
        }
        return detectedImageFits[card.id] === 'portrait' ? 'portrait' : 'wide';
    }, [detectedImageFits]);
    // Accordion for sub-folders (mobile-only collapse)
    const [subFoldersOpen, setSubFoldersOpen] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const sortMenuRef = useRef<HTMLDivElement | null>(null);

    // Card Form State
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [cardForm, setCardForm] = useState<{ front: string; back: string; image: string; imageFit: CardImageFit }>({ front: '', back: '', image: '', imageFit: 'wide' });
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [isAISentenceGenerating, setIsAISentenceGenerating] = useState(false);
    const [cardSentenceQuotaTick, setCardSentenceQuotaTick] = useState(0);
    const [isSavingCard, setIsSavingCard] = useState(false);
    const [aiUsageCount, setAiUsageCount] = useState(() => Number(localStorage.getItem('ai_usage_count') || 0));
    const [showImagePickerModal, setShowImagePickerModal] = useState(false);
    const [imageSearchText, setImageSearchText] = useState('');
    const [imageAssets, setImageAssets] = useState<CardImageAsset[]>([]);
    const [imageQuota, setImageQuota] = useState<CardImageQuota | null>(null);
    const [imagePickerError, setImagePickerError] = useState('');
    const [imageSearchLoading, setImageSearchLoading] = useState(false);
    const [imageUseLoadingId, setImageUseLoadingId] = useState<string | null>(null);
    const [imageQuotaNow, setImageQuotaNow] = useState(Date.now());
    const hasSoonLockedCard = useMemo(() => {
        const currentTime = Date.now();
        return cards.some((card) => card.nextReview > currentTime && card.nextReview - currentTime <= 60 * 60 * 1000);
    }, [cards]);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), hasSoonLockedCard ? 1000 : 60000);
        return () => clearInterval(interval);
    }, [hasSoonLockedCard]);

    useEffect(() => {
        if ((!showImagePickerModal && !showCardModal) || !imageQuota?.resetsAt) return;
        setImageQuotaNow(Date.now());
        const interval = window.setInterval(() => setImageQuotaNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, [showCardModal, showImagePickerModal, imageQuota?.resetsAt]);

    useEffect(() => {
        setImageQuota(null);
    }, [user?.id, user?.plan]);

    useEffect(() => {
        if (!showCardModal) {
            setShowImagePickerModal(false);
        }
    }, [showCardModal]);

    // Auto-refresh folders/cards while page is open (no manual refresh needed)
    useEffect(() => {
        if (!onRefreshData || !user?.id) return;
        const interval = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            void onRefreshData();
        }, 2500);
        return () => window.clearInterval(interval);
    }, [onRefreshData, user?.id]);

    useEffect(() => {
        const handle = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 250);
        return () => clearTimeout(handle);
    }, [searchQuery]);

    useEffect(() => {
        setSelectedCards(new Set());
        setFlippedCardIds([]);
        setVisibleCount(24);
        setMoveTargetFolderId('');
        setSortMenuOpen(false);
    }, [currentFolderId, filterStatus, debouncedSearchQuery, includeSubfolders, sortOption]);

    useEffect(() => {
        if (!sortMenuOpen) return;
        const handleClick = (event: MouseEvent) => {
            if (!sortMenuRef.current?.contains(event.target as Node)) {
                setSortMenuOpen(false);
            }
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSortMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [sortMenuOpen]);

    // --- Modal Handlers (Memoized) ---
    const handleOpenAddFolder = useCallback(() => {
        setEditingFolderData(null);
        setShowFolderModal(true);
    }, []);

    const handleOpenEditFolder = useCallback((folder: Folder) => {
        setEditingFolderData(folder);
        setShowFolderModal(true);
    }, []);

    const handleSaveFolder = useCallback((name: string, color: string, id?: string) => {
        if (!name.trim()) {
            showToast('⚠️ يرجى كتابة اسم المجلد', 'error');
            return;
        }
        if (id) {
            void onEditFolder(id, { name, color });
        } else if (!isProSubscriber && currentFolderId) {
            showToast('المجلدات الفرعية متاحة في Pro فقط. ارجع للقائمة الرئيسية وأنشئ مجلداً جديداً من هناك (حد أقصى 3 مجلدات رئيسية، 10 بطاقات لكل مجلد).', 'error');
            setShowFolderModal(false);
            return;
        } else {
            void onAddFolder(name, color, currentFolderId || undefined);
        }
        setShowFolderModal(false);
    }, [currentFolderId, isProSubscriber, onAddFolder, onEditFolder, showToast]);

    const handleDeleteClick = useCallback((id: string, name: string) => {
        setDeleteModal({
            isOpen: true,
            title: 'حذف المجلد',
            message: `هل أنت متأكد من حذف مجلد "${name}"؟ سيؤدي ذلك لحذف جميع البطاقات بداخله نهائياً.`,
            onConfirm: () => onDeleteFolder(id)
        });
    }, [onDeleteFolder]);

    // --- Helpers (Memoized Calculation) ---
    // Calculate ALL folder stats in one go
    const folderStatsMap = useMemo(() => {
        const stats: Record<string, { total: number; mastered: number; due: number; percent: number; newCount: number }> = {};

        folders.forEach(folder => {
            const targetFolderIds = [folder.id, ...getFolderFamilyIds(folder.id, folders)];
            const familyCards = cards.filter(c => targetFolderIds.includes(c.folderId));
            const total = familyCards.length;
            const mastered = familyCards.filter(c => c.status === 'mastered').length;
            const due = familyCards.filter(c => c.nextReview <= now || c.status === 'new').length;
            const percent = total > 0 ? (mastered / total) * 100 : 0;
            const newCount = familyCards.filter(c => c.status === 'new').length;
            stats[folder.id] = { total, mastered, due, percent, newCount };
        });
        return stats;
    }, [folders, cards, now]);

    // Specific stats getter for current folder (safe access)
    const getCurrentStats = useCallback((id: string | null | undefined) => {
        if (!id || !folderStatsMap[id]) return { total: 0, mastered: 0, due: 0, percent: 0, newCount: 0 };
        return folderStatsMap[id];
    }, [folderStatsMap]);

    // --- Other Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== 'string') return;

            const img = new Image();
            img.onload = () => {
                const maxSize = 1024;
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const width = Math.max(1, Math.round(img.width * scale));
                const height = Math.max(1, Math.round(img.height * scale));

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                const imageFit = inferImageFit(img.width, img.height);
                if (!ctx) {
                    setCardForm(prev => ({ ...prev, image: result, imageFit }));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const quality = outputType === 'image/jpeg' ? 0.85 : undefined;
                const dataUrl = canvas.toDataURL(outputType, quality);
                setCardForm(prev => ({ ...prev, image: dataUrl, imageFit }));
            };
            img.onerror = () => setCardForm(prev => ({ ...prev, image: result }));
            img.src = result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const cardSentenceQuota = useMemo(() => {
        const uid = user?.id || '_local';
        const lim = paidCardSentenceDailyLimit(user?.plan);
        const used = lim != null ? readCardSentenceDailyCount(uid) : 0;
        return { used, lim };
    }, [user?.id, user?.plan, cardSentenceQuotaTick]);

    const imageQuotaSecondsRemaining = useMemo(() => {
        if (!imageQuota) return 0;
        if (imageQuota.resetsAt) {
            const resetsAtMs = new Date(imageQuota.resetsAt).getTime();
            if (Number.isFinite(resetsAtMs)) {
                return Math.max(0, Math.ceil((resetsAtMs - imageQuotaNow) / 1000));
            }
        }
        return Math.max(0, imageQuota.secondsRemaining || 0);
    }, [imageQuota, imageQuotaNow]);

    const cardImagePlanActive = hasActiveCardImagePlan(user?.plan, isProSubscriber);
    const cardImageQuotaExhausted =
        cardImagePlanActive &&
        imageQuota?.plan === 'silver' &&
        imageQuota.limit != null &&
        imageQuota.remaining === 0 &&
        imageQuotaSecondsRemaining > 0;

    const cardImageButtonState = useMemo(() => {
        if (!cardImagePlanActive) {
            return {
                title: 'مولد الصور بـ AI',
                subtitle: 'متاح لمشتركي سيلفر وبرو',
                detail: 'اضغط لمعرفة طريقة التفعيل',
                exhausted: false,
            };
        }

        if (isUnlimitedCardImagePlan(user?.plan)) {
            return {
                title: 'مولد الصور بـ AI',
                subtitle: user?.plan === 'enterprise' ? 'باقتك Enterprise · متاح' : 'باقة برو · متاح',
                detail: 'استخدم صور المكتبة بدون حد يومي',
                exhausted: false,
            };
        }

        const limit = imageQuota?.plan === 'silver' && imageQuota.limit != null ? imageQuota.limit : 15;
        const used = imageQuota?.plan === 'silver' ? Math.min(imageQuota.used ?? 0, limit) : 0;
        const remaining = imageQuota?.plan === 'silver' && imageQuota.remaining != null
            ? Math.max(0, imageQuota.remaining)
            : limit;

        if (remaining <= 0) {
            return {
                title: 'مولد الصور بـ AI',
                subtitle: `استخدمت ${used || limit}/${limit} صورة اليوم`,
                detail: `يتجدد الحد ${formatImageQuotaResetText(imageQuotaSecondsRemaining)}`,
                exhausted: true,
            };
        }

        return {
            title: 'مولد الصور بـ AI',
            subtitle: remaining === limit ? `لديك ${limit} صورة اليوم` : `متبقي ${remaining} من ${limit} صورة اليوم`,
            detail: used > 0 ? `تم استخدام ${used} صورة حتى الآن` : 'يتم احتساب الصورة عند الضغط على استخدم الصورة',
            exhausted: false,
        };
    }, [cardImagePlanActive, imageQuota, imageQuotaSecondsRemaining, user?.plan]);

    const handleGenerateSentenceClick = async () => {
        const isPaid = user?.plan === 'pro' || user?.plan === 'silver' || user?.plan === 'enterprise';

        if (isPaid) {
            const uid = user?.id || '_local';
            const lim = paidCardSentenceDailyLimit(user?.plan);
            if (lim != null) {
                const used = readCardSentenceDailyCount(uid);
                if (used >= lim) {
                    showToast(
                        `وصلت اليوم لحد ${lim} جمل توضيحية بالذكاء الاصطناعي حسب باقتك. يُعاد العد غداً.`,
                        'error'
                    );
                    return;
                }
            }
        } else if (aiUsageCount >= 4) {
            setShowPremiumModal(true);
            return;
        }

        const textToAnalyze = cardForm.front || cardForm.back;

        if (!textToAnalyze) {
            showToast('⚠️ يرجى كتابة الكلمة في الوجه الأمامي أو الخلفي أولاً', 'error');
            return;
        }

        setIsAISentenceGenerating(true);
        showToast('جاري توليد جملة توضيحية بالذكاء الاصطناعي... 💬', 'info');

        try {
            const { aiService } = await import('../services/aiService');
            const result = await aiService.generateExampleSentence(textToAnalyze, targetLanguage);

            if (result && result.sentence) {
                const combinedText = result.translation ? `${result.sentence}\n\n(${result.translation})` : result.sentence;
                setCardForm(prev => ({
                    ...prev,
                    back: prev.back ? `${prev.back}\n\n💡 مثال:\n${combinedText}` : combinedText
                }));
                showToast('تمت إضافة الجملة بنجاح! ✨', 'success');

                if (isPaid) {
                    incrementCardSentenceDailyCount(user?.id || '_local');
                    setCardSentenceQuotaTick((t) => t + 1);
                } else {
                    const newCount = aiUsageCount + 1;
                    setAiUsageCount(newCount);
                    localStorage.setItem('ai_usage_count', String(newCount));
                }
            } else {
                showToast('تعذر توليد الجملة. حاول مرة أخرى.', 'error');
            }
        } catch (error) {
            showToast('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي', 'error');
        } finally {
            setIsAISentenceGenerating(false);
        }
    };

    const searchCardImageAssets = async (rawQuery: string) => {
        const query = rawQuery.trim();
        if (!query) {
            showToast('اكتب الكلمة في الوجه الأمامي أولاً عشان أبحث لها عن صورة مناسبة.', 'error');
            return;
        }

        if (!hasActiveCardImagePlan(user?.plan, isProSubscriber)) {
            showToast('مولد الصور بـ AI متاح لمشتركي سيلفر وبرو. اشترك وستقدر تضيف صور جاهزة للكروت بسرعة.', 'info');
            return;
        }

        setImageSearchText(query);
        setImageSearchLoading(true);
        setImagePickerError('');

        try {
            const res = (await CardImageAssetAPI.search(targetLanguage, query)) as {
                assets?: CardImageAsset[];
                quota?: CardImageQuota;
            };
            const nextAssets = Array.isArray(res.assets) ? res.assets : [];
            setImageAssets(nextAssets);
            setImageQuota(res.quota ?? null);
            if (nextAssets.length === 0) {
                setImagePickerError('لا توجد صورة مناسبة لهذه الكلمة في المكتبة حالياً.');
            }
        } catch (error: any) {
            const quota = (error?.data as { quota?: CardImageQuota } | undefined)?.quota;
            if (quota) setImageQuota(quota);
            setImageAssets([]);
            const quotaSeconds = Math.max(0, quota?.secondsRemaining || 0);
            const message = quota?.plan === 'silver' && quota.limit != null && quota.remaining === 0
                ? `وصلت إلى ${quota.used}/${quota.limit} صورة اليوم في باقة سيلفر. يتجدد الحد ${formatImageQuotaResetText(quotaSeconds)}.`
                : (error?.message || 'تعذر تحميل صور هذه الكلمة حالياً.');
            setImagePickerError(message);
            showToast(message, error?.status === 403 || error?.status === 429 ? 'info' : 'error');
        } finally {
            setImageSearchLoading(false);
        }
    };

    const handleOpenCardImagePicker = async () => {
        if (isSavingCard) return;

        const query = cardForm.front.trim();
        if (!query) {
            showToast('اكتب الكلمة في الوجه الأمامي أولاً، وبعدها افتح مولد الصور.', 'error');
            return;
        }

        if (!hasActiveCardImagePlan(user?.plan, isProSubscriber)) {
            showToast('مولد الصور بـ AI متاح للمشتركين. سيلفر يمنحك 15 صورة يومياً، وبرو يفتح الاستخدام بدون حد يومي.', 'info');
            return;
        }

        if (cardImageQuotaExhausted) {
            const limit = imageQuota?.limit ?? 15;
            showToast(`استخدمت ${imageQuota?.used ?? limit}/${limit} صورة اليوم في سيلفر. يتجدد الحد ${formatImageQuotaResetText(imageQuotaSecondsRemaining)}.`, 'info');
            return;
        }

        setShowImagePickerModal(true);
        setImageAssets([]);
        setImageQuota(null);
        setImagePickerError('');
        await searchCardImageAssets(query);
    };

    const handleUseCardImageAsset = async (asset: CardImageAsset) => {
        if (imageUseLoadingId) return;

        setImageUseLoadingId(asset.id);
        try {
            const res = (await CardImageAssetAPI.use(targetLanguage, asset.id)) as {
                asset?: CardImageAsset;
                quota?: CardImageQuota;
            };
            const selectedAsset = res.asset ?? asset;
            const nextQuota = res.quota ?? null;
            setImageQuota(nextQuota);
            setCardForm(prev => ({ ...prev, image: resolveMediaUrl(selectedAsset.imageUrl) }));
            setShowImagePickerModal(false);
            if (nextQuota?.plan === 'silver' && nextQuota.limit != null && nextQuota.remaining === 0) {
                showToast(`تم وضع الصورة داخل البطاقة. وصلت إلى ${nextQuota.used}/${nextQuota.limit} صورة اليوم، ويتجدد الحد ${formatImageQuotaResetText(nextQuota.secondsRemaining)}.`, 'info');
            } else {
                showToast('تم وضع الصورة داخل البطاقة. راجعها ثم احفظ البطاقة.', 'success');
            }
        } catch (error: any) {
            const quota = (error?.data as { quota?: CardImageQuota } | undefined)?.quota;
            if (quota) setImageQuota(quota);
            const quotaSeconds = Math.max(0, quota?.secondsRemaining || 0);
            const message = quota?.plan === 'silver' && quota.limit != null && quota.remaining === 0
                ? `وصلت إلى ${quota.used}/${quota.limit} صورة اليوم في باقة سيلفر. يتجدد الحد ${formatImageQuotaResetText(quotaSeconds)}.`
                : (error?.message || 'تعذر استخدام الصورة حالياً.');
            setImagePickerError(message);
            showToast(message, quota?.remaining === 0 ? 'info' : 'error');
        } finally {
            setImageUseLoadingId(null);
        }
    };

    const openNewCardModal = () => {
        setIsSavingCard(false);
        setEditingCardId(null);
        setCardForm({ front: '', back: '', image: '', imageFit: 'wide' });
        setShowCardModal(true);
    };

    const openEditCardModal = (card: Card) => {
        setIsSavingCard(false);
        setEditingCardId(card.id);
        setCardForm({ front: card.frontText, back: card.backText, image: card.frontImage || '', imageFit: resolveCardImageFit(card) });
        setShowCardModal(true);
    };

    const submitCard = async () => {
        if (isSavingCard) return;
        if (!currentFolderId) {
            showToast('⚠️ لا يمكن إضافة بطاقة خارج المجلدات. يرجى فتح مجلد أولاً.', 'error');
            return;
        }
        const front = cardForm.front.trim();
        const back = cardForm.back.trim();
        if (!front) {
            showToast('⚠️ يرجى كتابة السؤال أو الكلمة (الوجه الأمامي)', 'error');
            return;
        }
        if (!back) {
            showToast('⚠️ يرجى كتابة الإجابة أو المعنى (الوجه الخلفي)', 'error');
            return;
        }

        setIsSavingCard(true);
        try {
            if (editingCardId) {
                await Promise.resolve(onEditCard(editingCardId, { frontText: front, backText: back, frontImage: cardForm.image, frontImageFit: cardForm.imageFit }));
                showToast('تم تعديل البطاقة بنجاح! ✅', 'success');
            } else {
                const payload = { folderId: currentFolderId, frontText: front, backText: back, frontImage: cardForm.image, frontImageFit: cardForm.imageFit };
                const addResult = await Promise.resolve(onAddCard(payload));
                if (addResult === 'pro_limit') {
                    setShowCardModal(false);
                    setCardForm({ front: '', back: '', image: '', imageFit: 'wide' });
                    return;
                }
                if (addResult !== true) return;
            }
            setCardForm({ front: '', back: '', image: '', imageFit: 'wide' });
            setShowCardModal(false);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'تعذر حفظ البطاقة';
            showToast(msg, 'error');
        } finally {
            setIsSavingCard(false);
        }
    };

    const toggleCardFlip = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e && (e.target as HTMLElement).closest('button')) return;
        setFlippedCardIds(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
    };

    const currentFolder = useMemo(() => folders.find(f => f.id === currentFolderId), [folders, currentFolderId]);

    const selectedCardsList = useMemo(() => cards.filter(c => selectedCards.has(c.id)), [cards, selectedCards]);
    const selectedEditableCards = useMemo(() => {
        return selectedCardsList.filter(card => {
            const folder = folders.find(f => f.id === card.folderId);
            return canUserManageCard(card, folder, user);
        });
    }, [selectedCardsList, folders, user]);
    const selectedEditableIds = useMemo(() => selectedEditableCards.map(card => card.id), [selectedEditableCards]);
    const lockedSelectionCount = selectedCardsList.length - selectedEditableIds.length;
    const hasEditableSelection = selectedEditableIds.length > 0;

    const clearSelection = useCallback(() => {
        setSelectedCards(new Set());
        setMoveTargetFolderId('');
    }, []);

    const handleBulkDelete = useCallback(() => {
        if (selectedEditableIds.length === 0) {
            showToast('لا توجد بطاقات قابلة للحذف.', 'info');
            return;
        }
        setDeleteModal({
            isOpen: true,
            title: 'حذف البطاقات',
            message: `هل تريد حذف ${selectedEditableIds.length} بطاقة محددة؟`,
            onConfirm: () => {
                onDeleteCards(selectedEditableIds);
                clearSelection();
            }
        });
    }, [selectedEditableIds, onDeleteCards, showToast, clearSelection]);

    const handleBulkStatusUpdate = useCallback((status: Card['status']) => {
        if (selectedEditableIds.length === 0) {
            showToast('لا توجد بطاقات قابلة للتحديث.', 'info');
            return;
        }
        onEditCards(selectedEditableIds, { status });
        clearSelection();
    }, [selectedEditableIds, onEditCards, clearSelection, showToast]);

    const handleBulkMove = useCallback(() => {
        if (!moveTargetFolderId || selectedEditableIds.length === 0) {
            showToast('اختر مجلدًا صالحًا للنقل.', 'info');
            return;
        }
        if (moveTargetFolderId === currentFolderId) {
            showToast('لا يمكن نقل البطاقات لنفس المجلد.', 'info');
            return;
        }
        onEditCards(selectedEditableIds, { folderId: moveTargetFolderId });
        clearSelection();
    }, [moveTargetFolderId, selectedEditableIds, onEditCards, clearSelection, showToast, currentFolderId]);

    const breadcrumbs = useMemo(() => {
        const path: Folder[] = [];
        let folder = currentFolder;
        while (folder) {
            path.unshift(folder);
            folder = folders.find(f => f.id === folder?.parentId);
        }
        return path;
    }, [folders, currentFolder]);

    const subFolders = useMemo(() => {
        return folders.filter(f => currentFolderId ? f.parentId === currentFolderId : !f.parentId);
    }, [folders, currentFolderId]);

    const scopedFolderIds = useMemo(() => {
        if (!currentFolderId) return [];
        return includeSubfolders
            ? [currentFolderId, ...getFolderFamilyIds(currentFolderId, folders)]
            : [currentFolderId];
    }, [currentFolderId, includeSubfolders, folders]);

    const scopedCards = useMemo(() => {
        if (!currentFolderId) return [];
        return cards.filter(c => scopedFolderIds.includes(c.folderId));
    }, [cards, scopedFolderIds, currentFolderId]);

    const searchScopedCards = useMemo(() => {
        if (!debouncedSearchQuery) return scopedCards;
        const lowerQ = debouncedSearchQuery.toLowerCase();
        return scopedCards.filter(c => c.frontText.toLowerCase().includes(lowerQ) || c.backText.toLowerCase().includes(lowerQ));
    }, [scopedCards, debouncedSearchQuery]);

    const statusCounts = useMemo(() => ({
        all: searchScopedCards.length,
        new: searchScopedCards.filter(c => c.status === 'new').length,
        learning: searchScopedCards.filter(c => c.status === 'learning').length,
        review: searchScopedCards.filter(c => c.status === 'review').length,
        mastered: searchScopedCards.filter(c => c.status === 'mastered').length
    }), [searchScopedCards]);

    const filteredCards = useMemo(() => {
        let result = searchScopedCards;
        if (filterStatus !== 'all') {
            result = result.filter(c => c.status === filterStatus);
        }
        const sorted = [...result];
        switch (sortOption) {
            case 'oldest':
                sorted.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'due':
                sorted.sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));
                break;
            case 'hard':
                sorted.sort((a, b) => a.easeFactor - b.easeFactor);
                break;
            case 'alpha':
                sorted.sort((a, b) => a.frontText.localeCompare(b.frontText));
                break;
            default:
                sorted.sort((a, b) => b.createdAt - a.createdAt);
                break;
        }
        return sorted;
    }, [searchScopedCards, filterStatus, sortOption]);

    const currentSortLabel = useMemo(() => {
        const match = SORT_OPTIONS.find(option => option.value === sortOption);
        return match ? match.label : SORT_OPTIONS[0].label;
    }, [sortOption]);

    const isSearchActive = debouncedSearchQuery.length > 0;
    const hasActiveFilters = filterStatus !== 'all' || isSearchActive;

    const visibleCards = useMemo(() => filteredCards.slice(0, visibleCount), [filteredCards, visibleCount]);
    const canLoadMore = visibleCount < filteredCards.length;

    useEffect(() => {
        if (!canLoadMore || !loadMoreRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                setVisibleCount(prev => Math.min(prev + 24, filteredCards.length));
            }
        }, { rootMargin: '200px' });

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [canLoadMore, filteredCards.length]);

    const currentFolderCards = useMemo(() => {
        if (!currentFolderId) return [];
        return cards.filter(c => c.folderId === currentFolderId);
    }, [cards, currentFolderId]);

    const directStats = useMemo(() => {
        const total = currentFolderCards.length;
        const mastered = currentFolderCards.filter(c => c.status === 'mastered').length;
        const due = currentFolderCards.filter(c => c.nextReview <= now || c.status === 'new').length;
        const percent = total > 0 ? (mastered / total) * 100 : 0;
        const newCount = currentFolderCards.filter(c => c.status === 'new').length;
        return { total, mastered, due, percent, newCount };
    }, [currentFolderCards, now]);


    // --- RENDER ---

    // 1. Dashboard Mode (No Folder Selected)
    if (!currentFolderId) {
        const totalCards = cards.length;
        const totalDue = cards.filter(c => c.nextReview <= now || c.status === 'new').length;
        const totalMastered = cards.filter(c => c.status === 'mastered').length;
        const masteryRate = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

        return (
            <div className="p-4 md:p-8 space-y-10 animate-slide-up pb-20 max-w-[1600px] mx-auto min-h-screen">
                <Toast message={toastMessage?.text || ""} isVisible={!!toastMessage} onClose={() => setToastMessage(null)} type={toastMessage?.type} />

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">{t.folders.title}<div className="w-12 h-1 bg-primary rounded-full absolute -bottom-3 left-0" /></h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-6 text-xl font-medium">نظم دراستك وتابع تقدمك في كل لغة.</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={handleOpenAddFolder} className="flex-1 md:flex-none justify-center bg-gradient-to-br from-primary to-red-600 hover:shadow-2xl hover:shadow-primary/40 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95">
                            <Plus size={24} /><span className="text-lg">{t.folders.newFolder}</span>
                        </button>
                        <button
                            type="button"
                            title={user?.id ? 'حذف جميع مجلداتك وبطاقاتك الخاصة (لا يمس مجلدات النظام)' : 'سجّل الدخول لحذف محتواك الخاص'}
                            onClick={() => {
                                if (!user?.id) {
                                    showToast('سجّل الدخول لحذف مجلداتك وبطاقاتك الخاصة.', 'error');
                                    return;
                                }
                                setDeleteModal({
                                    isOpen: true,
                                    title: 'حذف كل محتواك الخاص',
                                    message: 'سيتم حذف جميع المجلدات التي أنشأتها (بما فيها الفرعية) وجميع البطاقات بداخلها. مجلدات وبطاقات النظام من المسئول لن تُمس. هل أنت متأكد؟',
                                    onConfirm: () => void onDeleteAll(),
                                });
                            }}
                            className="group bg-white dark:bg-slate-900/60 text-red-500 p-4 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-stone-200 dark:border-white/5 shadow-sm hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Trash2 size={24} className="group-hover:animate-bounce" />
                        </button>
                    </div>
                </header>

                {!isProSubscriber && (
                    <div className="rounded-2xl md:rounded-3xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/40 px-4 py-4 md:px-8 md:py-5 text-amber-950 dark:text-amber-100 shadow-sm" role="status">
                        <p className="text-sm md:text-base font-bold leading-relaxed">
                            <span className="font-black">الخطة المجانية:</span>{' '}
                            حتى <strong className="font-black">3 مجلدات رئيسية</strong> لكل لغة، و<strong className="font-black">10 بطاقات</strong> كحد أقصى داخل كل مجلد خاص بك، و<strong className="font-black">لا يمكن إنشاء مجلد داخل مجلد</strong> (لا تداخل). المجلدات الفرعية والحدود الأوسع لمشتركي Pro.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6">
                    {[
                        { label: 'إجمالي البطاقات', val: totalCards, icon: <Layers size={20} className="md:w-6 md:h-6" />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                        { label: 'مستحق اليوم', val: totalDue, icon: <Flame size={20} className="md:w-6 md:h-6" />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                        { label: 'مستوى الإتقان', val: `${masteryRate}%`, icon: <Brain size={20} className="md:w-6 md:h-6" />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' }
                    ].map((stat, i) => (
                        <div key={i} className={`p-2 md:p-6 rounded-2xl md:rounded-[2.5rem] ${stat.bg} border border-white dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-6 group hover:shadow-md transition-all text-center md:text-right`}>
                            <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-white dark:bg-gray-800 flex items-center justify-center ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                            <div><h4 className="text-lg md:text-3xl font-black text-gray-900 dark:text-white mt-0 md:mt-1 leading-none mb-1 md:mb-0">{stat.val}</h4><p className="text-stone-500 dark:text-gray-400 font-bold text-[10px] md:text-sm uppercase tracking-widest leading-none">{stat.label}</p></div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-8 pt-4">
                    {subFolders.map(folder => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            stats={getCurrentStats(folder.id)}
                            onClick={() => setCurrentFolderId(folder.id)}
                            onEdit={handleOpenEditFolder}
                            onDelete={() => handleDeleteClick(folder.id, folder.name)}
                            canManage={canUserManageFolder(folder, user)}
                        />
                    ))}
                </div>

                <FolderFormModal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} onSubmit={handleSaveFolder} initialData={editingFolderData} t={t} />
                <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={deleteModal.onConfirm} title={deleteModal.title} message={deleteModal.message} />
            </div>
        );
    }

    // 2. Folder View (Deep Dive)
    const { total, mastered, due, percent, newCount } = directStats;

    return (
        <div className="p-3 md:p-8 space-y-6 md:space-y-8 animate-slide-up pb-24 max-w-full md:max-w-[1600px] mx-auto min-h-screen overflow-x-hidden">
            <Toast message={toastMessage?.text || ""} isVisible={!!toastMessage} onClose={() => setToastMessage(null)} type={toastMessage?.type} />

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none whitespace-nowrap">
                <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-gray-500 hover:text-primary transition font-black border border-stone-100 dark:border-gray-700">
                    <Layers size={18} /> المكتبة
                </button>
                {breadcrumbs.map((f, idx) => (
                    <React.Fragment key={f.id}>
                        <ArrowRight size={16} className="text-gray-300 ltr:rotate-0 rtl:rotate-180" />
                        <button onClick={() => setCurrentFolderId(f.id)} className={`px-4 py-2.5 rounded-2xl shadow-sm transition font-black border ${idx === breadcrumbs.length - 1 ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-primary border-stone-100 dark:border-gray-700'}`}>
                            {f.name}
                        </button>
                    </React.Fragment>
                ))}
            </nav>

            {/* Banner */}
            <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-black dark:from-black dark:to-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className={`absolute -right-20 -top-20 w-64 h-64 ${currentFolder?.color} opacity-20 blur-[100px]`} />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 text-center md:text-right">
                        <div className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] ${currentFolder?.color} bg-opacity-20 flex items-center justify-center border-2 border-white/10 shadow-2xl`}>
                            <FolderIcon size={32} className={`text-${currentFolder?.color.replace('bg-', '')} md:w-[48px] md:h-[48px]`} />
                        </div>
                        <div>
                            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 mb-2 md:mb-4">
                                <h2 className="text-2xl md:text-5xl font-black">{currentFolder?.name}</h2>
                                {currentFolder?.isSystem && <ShieldCheck size={20} className="text-blue-400 md:w-7 md:h-7" />}
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-6 text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5 md:gap-2"><Layers size={14} className="md:w-[18px]" /> {total} بطاقة</span>
                                <span className="flex items-center gap-1.5 md:gap-2 text-emerald-400"><CheckCircle size={14} className="md:w-[18px]" /> {mastered} متقن</span>
                                <span className="flex items-center gap-1.5 md:gap-2 text-orange-400"><Clock size={14} className="md:w-[18px]" /> {due} مستحق</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
                        <button onClick={() => onStartSession(currentFolderId, 'due')} disabled={due === 0} title="تشمل بطاقات هذا المجلد فقط" className="flex-1 md:flex-none justify-center bg-primary hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-3 md:px-10 md:py-5 rounded-2xl md:rounded-3xl font-black text-sm md:text-xl shadow-2xl shadow-primary/40 transition hover:scale-105 active:scale-95 flex items-center gap-2 md:gap-3">
                            <Zap size={18} fill="currentColor" className="md:w-7 md:h-7" /> مراجعة هذا المجلد ({due})
                        </button>

                    </div>
                </div>
            </div>

            <div className="pt-2 md:pt-4 w-full overflow-hidden">

                {/* ── Header row — button on mobile, plain on desktop ── */}
                <div className="flex items-center justify-between gap-2 md:gap-4 mb-3 md:mb-6">

                    {/* Title — clickable only on mobile */}
                    <button
                        type="button"
                        className="flex items-center gap-2 md:gap-4 flex-1 text-right md:cursor-default focus:outline-none group"
                        onClick={() => setSubFoldersOpen(prev => !prev)}
                        aria-expanded={subFoldersOpen}
                    >
                        {/* Colored bar */}
                        <div className="w-1.5 md:w-2 h-6 md:h-8 bg-primary rounded-full shrink-0" />

                        <h3 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white">
                            المجلدات الفرعية
                        </h3>

                        {/* Count badge */}
                        {subFolders.length > 0 && (
                            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {subFolders.length}
                            </span>
                        )}

                        {/* Chevron — only on mobile */}
                        <ChevronDown
                            size={18}
                            className={`md:hidden text-gray-400 transition-transform duration-300 ease-in-out mr-auto ${
                                subFoldersOpen ? 'rotate-180 text-primary' : 'rotate-0'
                            }`}
                        />
                    </button>

                    {/* Right action (add subfolder / pro badge) — always visible */}
                    <div className="shrink-0">
                        {(() => {
                            if (currentFolder?.isSystem || (currentFolder && !canUserManageFolder(currentFolder, user))) {
                                return null;
                            }
                            if (!isProSubscriber) {
                                return (
                                    <div
                                        className="w-auto max-w-md text-right flex flex-col gap-1 text-amber-800 dark:text-amber-200/90 font-bold bg-amber-50 dark:bg-amber-950/50 px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs border border-amber-200/80 dark:border-amber-500/25"
                                        title="الخطة المجانية لا تدعم المجلدات الفرعية"
                                    >
                                        <span className="font-black text-amber-900 dark:text-amber-100">مجلد داخل مجلد — Pro فقط</span>
                                    </div>
                                );
                            }
                            const currentDepth = getFolderDepth(currentFolderId, folders);
                            const canAddSubfolder = currentDepth < MAX_FOLDER_DEPTH && !!currentFolder && canUserManageFolder(currentFolder, user);
                            return canAddSubfolder ? (
                                <button onClick={handleOpenAddFolder} className="flex items-center justify-center gap-1.5 md:gap-2 text-primary font-black bg-primary/5 px-3 py-2 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-primary hover:text-white transition shadow-sm text-xs md:text-sm">
                                    <Plus size={16} className="md:w-5 md:h-5" /> <span className="hidden sm:inline">إضافة مجلد فرعي</span>
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-gray-400 font-black bg-gray-100 dark:bg-gray-800 px-3 py-2 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm cursor-not-allowed border-2 border-dashed border-gray-200 dark:border-gray-700" title="وصلت للحد الأقصى من التداخل">
                                    <FolderIcon size={16} className="opacity-50 md:w-[18px]" />
                                    <span className="hidden sm:inline">الحد الأقصى للتداخل</span>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* ── Content — animated on mobile, always visible on desktop ── */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out md:overflow-visible ${
                        subFoldersOpen
                            ? 'max-h-[800px] opacity-100'
                            : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
                    }`}
                >
                    {subFolders.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                            {subFolders.map(folder => (
                                <FolderItem
                                    key={folder.id}
                                    folder={folder}
                                    stats={getCurrentStats(folder.id)}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    onEdit={handleOpenEditFolder}
                                    onDelete={() => handleDeleteClick(folder.id, folder.name)}
                                    canManage={canUserManageFolder(folder, user)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 md:p-16 rounded-xl md:rounded-[3rem] border border-dashed md:border-4 border-stone-200 dark:border-gray-800/50 flex flex-row md:flex-col items-center justify-center md:gap-0 gap-2 text-gray-400 bg-stone-50/50 dark:bg-gray-800/10">
                            <FolderIcon size={18} className="md:mb-4 opacity-50 md:opacity-20 md:w-12 md:h-12" />
                            <p className="font-bold md:font-black text-[11px] md:text-lg">لا يوجد مجلدات فرعية هنا</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-px bg-stone-100 dark:bg-gray-800 my-2 md:my-4" />

            {/* Cards Grid */}
            <div className="space-y-4 md:space-y-8 w-full overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-8">
                    <h3 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 md:gap-4">
                        <div className="w-1.5 md:w-2 h-6 md:h-8 bg-blue-500 rounded-full" />
                        بطاقات التعلم المباشر
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 sm:w-80 group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition" size={20} />
                            <input type="text" aria-label="بحث في البطاقات" placeholder="ابحث في بطاقات هذا المجلد..." className="w-full bg-white dark:bg-gray-800 border-2 border-stone-100 dark:border-gray-700 rounded-2xl py-3.5 md:py-4 pr-12 pl-4 font-black focus:border-primary outline-none transition shadow-sm text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <button
                            onClick={() => setIncludeSubfolders(prev => !prev)}
                            aria-pressed={includeSubfolders}
                            className={`w-full sm:w-auto px-5 md:px-6 py-3.5 md:py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 transition text-sm ${includeSubfolders ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-gray-800 border-stone-100 dark:border-gray-700 text-gray-500 hover:text-primary hover:border-primary/30'}`}
                            title="تضمين المجلدات الفرعية في البحث"
                        >
                            <Layers size={18} /> {includeSubfolders ? 'يشمل الفرعيات' : 'داخل المجلد فقط'}
                        </button>
                        {currentFolder?.isSystem ? (
                            <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-blue-500 font-black bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 px-6 py-3.5 rounded-2xl text-sm cursor-not-allowed" title="هذا مجلد نظامي للقراءة فقط">
                                <ShieldCheck size={18} />
                                <span>مجلد للقراءة فقط</span>
                            </div>
                        ) : currentFolder && !canUserManageFolder(currentFolder, user) ? (
                            <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-amber-600 font-black bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 px-6 py-3.5 rounded-2xl text-sm text-center" title="المجلدات المشتركة لا تدعم الإضافة هنا">
                                <ShieldCheck size={18} />
                                <span className="text-xs md:text-sm">أنشئ مجلداً خاصاً بك من الرئيسية لإضافة بطاقات</span>
                            </div>
                        ) : (
                            <button type="button" onClick={openNewCardModal} className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-105 transition shadow-xl text-sm md:text-base">
                                <Plus size={20} /> إضافة كارت جديد
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters + Sort */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-4 -mb-2 no-scrollbar scroll-smooth">
                        {[
                            { id: 'all', label: 'الكل', count: statusCounts.all },
                            { id: 'new', label: 'جديد', count: statusCounts.new },
                            { id: 'learning', label: 'قيد التعلم', count: statusCounts.learning },
                            { id: 'review', label: 'مراجعة', count: statusCounts.review },
                            { id: 'mastered', label: 'متقن', count: statusCounts.mastered }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilterStatus(f.id as any)}
                                className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all border-2 whitespace-nowrap flex items-center gap-2 ${filterStatus === f.id
                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105 md:scale-100'
                                    : 'bg-white dark:bg-gray-800 border-stone-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-primary/30 hover:text-primary'
                                    }`}
                            >
                                {f.label} <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] ${filterStatus === f.id ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-gray-900 text-gray-400'}`}>({f.count})</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div
                            ref={sortMenuRef}
                            role="button"
                            tabIndex={0}
                            aria-haspopup="listbox"
                            aria-expanded={sortMenuOpen}
                            aria-controls="sort-menu"
                            onClick={() => setSortMenuOpen(prev => !prev)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSortMenuOpen(prev => !prev);
                                }
                            }}
                            className="relative flex items-center gap-2 bg-white/90 dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl px-4 py-3 w-full lg:w-auto shadow-sm hover:shadow-md transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                            <ArrowUpDown size={16} className="text-gray-400" />
                            <span className="text-[11px] font-black text-gray-400 whitespace-nowrap">ترتيب</span>
                            <span className="text-sm font-black text-gray-800 dark:text-gray-100 whitespace-nowrap">{currentSortLabel}</span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
                            {sortMenuOpen && (
                                <div
                                    id="sort-menu"
                                    role="listbox"
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute z-30 mt-2 top-full right-0 left-0 lg:left-auto lg:right-0 lg:min-w-[220px] rounded-2xl border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-2"
                                >
                                    {SORT_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="option"
                                            aria-selected={option.value === sortOption}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSortOption(option.value);
                                                setSortMenuOpen(false);
                                            }}
                                            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-black transition ${option.value === sortOption ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-800 hover:text-primary'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> جديد</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> قيد التعلم</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> مراجعة</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> متقن</span>
                </div>

                {selectedCards.size > 0 && (
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-gray-900 border-2 border-stone-100 dark:border-gray-700 rounded-2xl px-4 py-3 md:px-6 md:py-4 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-black text-gray-600 dark:text-gray-300">
                            <CheckCircle size={18} className="text-primary" />
                            <span>تم تحديد {selectedCards.size} بطاقة</span>
                            {lockedSelectionCount > 0 && (
                                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">({lockedSelectionCount} محمية)</span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            <button
                                onClick={() => onStartSession(currentFolderId, 'all', Array.from(selectedCards))}
                                className="bg-primary text-white px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition"
                            >
                                <PlayCircle size={16} /> مراجعة المحدد
                            </button>
                            <button
                                onClick={clearSelection}
                                className="bg-stone-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 border-2 border-stone-200 dark:border-gray-700 hover:border-primary/30 hover:text-primary transition"
                            >
                                <X size={16} /> إلغاء التحديد
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={!hasEditableSelection}
                                title={hasEditableSelection ? 'حذف البطاقات المحددة' : 'لا يمكن حذف البطاقات المحمية'}
                                className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 border-2 border-stone-200 dark:border-gray-700 hover:border-red-400 hover:text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 size={16} /> حذف
                            </button>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-stone-200 dark:border-gray-700 rounded-xl px-3 py-2">
                                <Filter size={14} className="text-gray-400" />
                                <select
                                    defaultValue=""
                                    disabled={!hasEditableSelection}
                                    onChange={(e) => {
                                        const value = e.target.value as Card['status'] | '';
                                        if (!value) return;
                                        handleBulkStatusUpdate(value as Card['status']);
                                        e.currentTarget.value = '';
                                    }}
                                    className="bg-transparent text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 outline-none disabled:opacity-60"
                                    aria-label="تغيير حالة البطاقات المحددة"
                                >
                                    <option value="" disabled>تغيير الحالة</option>
                                    <option value="new">جديدة</option>
                                    <option value="learning">تعلم</option>
                                    <option value="review">مراجعة</option>
                                    <option value="mastered">متقنة</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-stone-200 dark:border-gray-700 rounded-xl px-3 py-2">
                                <FolderIcon size={14} className="text-gray-400" />
                                <select
                                    value={moveTargetFolderId}
                                    onChange={(e) => setMoveTargetFolderId(e.target.value)}
                                    disabled={!hasEditableSelection}
                                    className="bg-transparent text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 outline-none disabled:opacity-60"
                                    aria-label="نقل البطاقات المحددة إلى مجلد"
                                >
                                    <option value="">نقل إلى...</option>
                                    {folders.filter(f => f.id !== currentFolderId && canUserManageFolder(f, user)).map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleBulkMove}
                                    disabled={!hasEditableSelection || !moveTargetFolderId || moveTargetFolderId === currentFolderId}
                                    className="text-primary font-black text-xs md:text-sm px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="نقل البطاقات"
                                >
                                    نقل
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {filteredCards.length > 0 ? (
                    <>
                        {/* Changed grid-cols-1 to grid-cols-2 for mobile viewing */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(14rem,17rem))] xl:grid-cols-[repeat(auto-fill,minmax(15rem,18rem))] justify-start gap-3 md:gap-4">
                            {visibleCards.map(card => {
                                const isFlipped = flippedCardIds.includes(card.id);
                                const isSelected = selectedCards.has(card.id);
                                const cardFolder = folders.find(f => f.id === card.folderId);
                                const canEditCard = canUserManageCard(card, cardFolder, user);
                                const imageFit = resolveCardImageFit(card);
                                const isPortraitImage = imageFit === 'portrait';
                                return (
                                    <div
                                        key={card.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={isFlipped}
                                        aria-label={`بطاقة: ${card.frontText}. ${isFlipped ? 'اضغط لعرض الوجه الأمامي' : 'اضغط لقلب البطاقة'}`}
                                        onClick={(e) => toggleCardFlip(card.id, e)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                toggleCardFlip(card.id, e);
                                            }
                                        }}
                                        className={`group perspective-1000 cursor-pointer content-auto contain-intrinsic focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                                            isPortraitImage
                                                ? 'h-72 md:h-[22rem] w-full max-w-[18rem]'
                                                : 'h-48 md:h-64 w-full'
                                        }`}
                                    >
                                        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d flip-card ${isFlipped ? 'rotate-y-180' : ''}`}>
                                            <div className={`absolute inset-0 backface-hidden bg-gradient-to-br from-white via-stone-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-gray-900 rounded-2xl md:rounded-3xl shadow-warm dark:shadow-none border border-stone-100 dark:border-slate-700/70 flex flex-col hover:shadow-warm-hover dark:hover:border-slate-500/80 transition overflow-hidden ${
                                                isPortraitImage ? 'p-3 md:p-4' : 'p-3 md:p-6'
                                            }`}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCards(prev => {
                                                            const next = new Set(prev);
                                                            if (next.has(card.id)) next.delete(card.id);
                                                            else next.add(card.id);
                                                            return next;
                                                        });
                                                    }}
                                                    aria-pressed={isSelected}
                                                    aria-label={isSelected ? 'إلغاء تحديد البطاقة' : 'تحديد البطاقة'}
                                                    className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary scale-110' : 'bg-white/50 border-gray-300 hover:border-primary'}`}
                                                >
                                                    {isSelected && <CheckCircle size={16} className="text-white" />}
                                                </button>
                                                <div className="absolute top-4 left-4 flex justify-between items-center z-10 gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${card.status === 'new' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : card.status === 'mastered' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`}></div>
                                                    {card.nextReview > now ? <CountdownTimer nextReview={card.nextReview} now={now} /> : <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black animate-bounce shadow-sm"><Zap size={12} fill="currentColor" /></div>}
                                                </div>
                                                <div className="flex flex-col h-full w-full">
                                                    <h3 className="pt-7 md:pt-6 px-8 md:px-10 text-sm md:text-xl xl:text-2xl font-black text-gray-800 dark:text-white text-center line-clamp-2 leading-tight">{card.frontText}</h3>
                                                    <div className={`mt-2 flex-1 w-full rounded-xl md:rounded-2xl overflow-hidden border border-stone-100 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 shadow-inner relative ${isPortraitImage ? 'p-1.5 md:p-2' : ''}`}>
                                                        {card.frontImage ? (
                                                            <div className="relative z-[1] w-full h-full flex items-center justify-center">
                                                                <img src={card.frontImage} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-25 transition-transform duration-700 ease-out group-hover:scale-[1.16]" alt="" aria-hidden="true" />
                                                                <img
                                                                    src={card.frontImage}
                                                                    className={
                                                                        isPortraitImage
                                                                            ? 'relative z-[1] h-full max-h-full w-auto max-w-[80%] rounded-lg bg-white/85 dark:bg-white/10 object-contain p-0.5 shadow-lg ring-1 ring-white/50 dark:ring-white/10 transition-transform duration-700 ease-out group-hover:scale-[1.045]'
                                                                            : 'relative z-[1] w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]'
                                                                    }
                                                                    alt=""
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    onLoad={(event) => handleCardImageLoad(card.id, event)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300 dark:text-gray-600">
                                                                <ImageIcon size={28} className="opacity-70" />
                                                                <span className="text-[10px] font-black">بدون صورة</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 md:mt-4 w-full flex items-center justify-between text-gray-400">
                                                        <button onClick={(e) => { e.stopPropagation(); speakCardText(card.frontText); }} aria-label="تشغيل النطق للوجه الأمامي" className="hover:text-primary transition p-1 md:p-2"><Volume2 size={20} className="w-5 h-5 md:w-6 md:h-6" /></button>
                                                        <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold">
                                                            <RotateCw size={14} className="opacity-70 group-hover:opacity-100 transition md:w-4 md:h-4" />
                                                            <span>اضغط للقلب</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 dark:from-slate-800 dark:via-gray-900 dark:to-black rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-600/50 flex flex-col items-center text-white overflow-hidden">
                                                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
                                                <div className="absolute -bottom-20 -left-16 w-44 h-44 rounded-full bg-blue-400/10 blur-3xl" />
                                                <div className="relative z-[1] w-full flex-1 flex flex-col items-center justify-center gap-3 md:gap-5 pt-4">
                                                    <p className="max-w-full px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] md:text-xs font-black text-amber-200 text-center line-clamp-1">
                                                        {card.frontText}
                                                    </p>
                                                    <h3 className="text-base md:text-2xl font-black text-center line-clamp-4 leading-relaxed text-white">{card.backText}</h3>
                                                </div>
                                                <div className="mt-auto flex items-center gap-2 md:gap-4">
                                                    <button onClick={(e) => { e.stopPropagation(); speakCardText(card.backText); }} aria-label="تشغيل النطق للوجه الخلفي" className="hover:text-primary transition p-2"><Volume2 size={20} className="w-5 h-5 md:w-6 md:h-6" /></button>
                                                    {canEditCard && (
                                                        <>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); openEditCardModal(card); }} aria-label="تعديل البطاقة" className="text-gray-500 hover:text-blue-400 transition p-2"><Edit2 size={20} className="w-5 h-5 md:w-6 md:h-6" /></button>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, title: 'حذف البطاقة', message: 'هل أنت متأكد من حذف هذه البطاقة؟', onConfirm: () => void onDeleteCard(card.id) }); }} aria-label="حذف البطاقة" className="text-gray-500 hover:text-red-500 transition p-2"><Trash2 size={20} className="w-5 h-5 md:w-6 md:h-6" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {canLoadMore && (
                            <div className="flex items-center justify-center pt-4">
                                <button
                                    onClick={() => setVisibleCount(prev => Math.min(prev + 24, filteredCards.length))}
                                    className="px-6 py-3 rounded-xl font-black text-sm bg-white dark:bg-gray-800 border-2 border-stone-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/30 hover:text-primary transition"
                                >
                                    عرض المزيد ({visibleCards.length}/{filteredCards.length})
                                </button>
                            </div>
                        )}
                        {canLoadMore && <div ref={loadMoreRef} className="h-6" aria-hidden="true" />}
                    </>
                ) : (
                    <EmptyState
                        title={hasActiveFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد بطاقات هنا'}
                        description={hasActiveFilters ? 'جرّب تعديل البحث أو الفلاتر.' : 'ابدأ بإضافة كلماتك الخاصة، أو ارفع صورة، أو ولّد جملة توضيحية بالذكاء الاصطناعي من نموذج البطاقة.'}
                        icon={Layers}
                        actionLabel={!hasActiveFilters && currentFolder && canUserManageFolder(currentFolder, user) ? 'إضافة بطاقة جديدة' : undefined}
                        onAction={!hasActiveFilters && currentFolder && canUserManageFolder(currentFolder, user) ? openNewCardModal : undefined}
                    />
                )}
            </div>

            <FolderFormModal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} onSubmit={handleSaveFolder} initialData={editingFolderData} t={t} />

            {/* Card modal عبر portal حتى لا يكسرها transform على motion.div في App */}
            {showCardModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-black/60 z-[10050] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-gray-800 dark:text-white">{editingCardId ? 'تعديل البطاقة' : 'إضافة بطاقة جديدة'}</h3>
                            <button type="button" disabled={isSavingCard} onClick={() => !isSavingCard && setShowCardModal(false)} aria-label="إغلاق">
                                <X className="text-gray-400 hover:text-red-500" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="flex justify-between text-sm font-bold text-gray-500 mb-2"><span>الوجه الأمامي (السؤال/الكلمة)</span></label>
                                <input type="text" placeholder="مثال: Apple" disabled={isSavingCard} className="w-full bg-stone-50 dark:bg-gray-800 border-2 border-stone-200 dark:border-transparent focus:border-primary p-4 rounded-xl outline-none font-bold dark:text-white transition disabled:opacity-60" value={cardForm.front} onChange={e => setCardForm({ ...cardForm, front: e.target.value })} />
                            </div>
                            <div>
                                <label className="flex justify-between text-sm font-bold text-gray-500 mb-2"><span>الوجه الخلفي (الإجابة/المعنى)</span></label>
                                <textarea rows={3} placeholder="مثال: تفاحة" disabled={isSavingCard} className="w-full bg-stone-50 dark:bg-gray-800 border-2 border-stone-200 dark:border-transparent focus:border-primary p-4 rounded-xl outline-none font-bold dark:text-white transition resize-none disabled:opacity-60" value={cardForm.back} onChange={e => setCardForm({ ...cardForm, back: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2">صورة توضيحية (اختياري)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className={`cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary transition min-h-[8rem] ${isSavingCard ? 'pointer-events-none opacity-50' : ''}`}>
                                        <ImageIcon size={28} /> <span className="text-sm font-bold text-center">رفع صورة من جهازك</span>
                                        <input type="file" accept="image/*" className="hidden" disabled={isSavingCard} onChange={handleImageUpload} />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => void handleOpenCardImagePicker()}
                                        disabled={isSavingCard || imageSearchLoading}
                                        className={`border-2 rounded-xl p-5 min-h-[8rem] flex flex-col items-center justify-center gap-2 font-black transition disabled:opacity-50 ${
                                            cardImageButtonState.exhausted
                                                ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:border-rose-400'
                                                : cardImagePlanActive
                                                    ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                                    : 'border-amber-200 dark:border-amber-800 hover:border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                        }`}
                                    >
                                        {imageSearchLoading ? <Loader2 size={28} className="animate-spin" /> : <Sparkles size={28} />}
                                        <span className="text-sm text-center">{cardImageButtonState.title}</span>
                                        <span className="text-[11px] font-black opacity-90 text-center">{cardImageButtonState.subtitle}</span>
                                        <span className="text-[10px] font-bold opacity-75 text-center leading-relaxed">{cardImageButtonState.detail}</span>
                                    </button>
                                </div>
                                <div className="mt-4">
                                    {cardSentenceQuota.lim != null && (
                                        <p className={`text-xs font-bold text-center mb-2 ${cardSentenceQuota.used >= cardSentenceQuota.lim ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            توليد الجمل اليوم: {cardSentenceQuota.used} / {cardSentenceQuota.lim}
                                            <span className="block text-[10px] font-medium mt-0.5 opacity-90">
                                                باقة سيلفر: 10 جمل يومياً · باقة البرو: 20 جملة يومياً (يُعاد العد بتوقيت جهازك)
                                            </span>
                                        </p>
                                    )}
                                    {!paidCardSentenceDailyLimit(user?.plan) && (
                                        <p className="text-[11px] font-bold text-center text-gray-500 dark:text-gray-400 mb-2">
                                            بدون اشتراك: {aiUsageCount} / 4 تجارب مجانية لتوليد جمل
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleGenerateSentenceClick}
                                        disabled={
                                            isAISentenceGenerating ||
                                            isSavingCard ||
                                            (cardSentenceQuota.lim != null && cardSentenceQuota.used >= cardSentenceQuota.lim) ||
                                            (!paidCardSentenceDailyLimit(user?.plan) && aiUsageCount >= 4)
                                        }
                                        className="w-full border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                                    >
                                        {isAISentenceGenerating ? <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Brain size={20} />}
                                        توليد جملة توضيحية للكلمة
                                    </button>
                                </div>
                                {cardForm.image && (
                                    <div className="mt-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-gray-500">معاينة الصورة</span>
                                            <button
                                                type="button"
                                                disabled={isSavingCard}
                                                onClick={() => setCardForm({ ...cardForm, image: '' })}
                                                className="flex items-center gap-1 text-[11px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                                            >
                                                <X size={12} /> إزالة
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {CARD_IMAGE_FIT_OPTIONS.map((option) => {
                                                const selected = cardForm.imageFit === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        disabled={isSavingCard}
                                                        onClick={() => setCardForm(prev => ({ ...prev, imageFit: option.value }))}
                                                        className={`rounded-2xl border-2 p-3 text-right transition disabled:opacity-50 ${
                                                            selected
                                                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                                                : 'border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-gray-500 hover:border-primary/40'
                                                        }`}
                                                    >
                                                        <span className="block text-sm font-black">{option.label}</span>
                                                        <span className="block text-[10px] font-bold mt-1 leading-4 opacity-80">{option.description}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className={`relative mx-auto rounded-2xl overflow-hidden border-2 border-stone-100 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 shadow-lg transition-all duration-300 ${
                                            cardForm.imageFit === 'portrait'
                                                ? 'aspect-[9/16] max-w-[180px]'
                                                : 'aspect-video w-full'
                                        }`}>
                                            <img src={cardForm.image} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" aria-hidden="true" />
                                            <img
                                                src={cardForm.image}
                                                alt="معاينة الصورة"
                                                className={cardForm.imageFit === 'portrait'
                                                    ? 'absolute inset-0 m-auto h-full w-auto max-w-full object-contain p-2'
                                                    : 'absolute inset-0 w-full h-full object-cover'
                                                }
                                            />
                                            <div className="absolute inset-0 ring-1 ring-black/5 dark:ring-white/10" />
                                            <div className="absolute bottom-3 right-3 text-[10px] font-black text-white bg-black/40 px-2.5 py-1 rounded-full">
                                                {cardForm.imageFit === 'portrait' ? 'معاينة طولية' : 'معاينة عريضة'}
                                            </div>
                                        </div>
                                        <p className="mt-2 text-[11px] font-bold text-gray-400">اختر الشكل الأقرب لمقاس الصورة قبل حفظ البطاقة.</p>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                disabled={isSavingCard}
                                onClick={() => void submitCard()}
                                className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-red-700 transition shadow-xl shadow-primary/30 text-lg disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
                            >
                                {isSavingCard ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : editingCardId ? (
                                    'حفظ التغييرات'
                                ) : (
                                    'إضافة البطاقة'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showImagePickerModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-black/70 z-[10070] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-3xl rounded-[2rem] shadow-2xl border border-stone-100 dark:border-gray-700 max-h-[88vh] overflow-hidden flex flex-col">
                        <div className="p-5 md:p-6 border-b border-stone-100 dark:border-gray-700 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                                    <Sparkles size={22} className="text-emerald-500" />
                                    مولد الصور بـ AI
                                </h3>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">
                                    {targetLanguage === 'de' ? 'مكتبة الصور الألمانية' : 'مكتبة الصور الإنجليزية'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowImagePickerModal(false)}
                                disabled={!!imageUseLoadingId}
                                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                                aria-label="إغلاق"
                            >
                                <X className="text-gray-400 hover:text-red-500" />
                            </button>
                        </div>

                        <div className="p-5 md:p-6 border-b border-stone-100 dark:border-gray-700 space-y-4">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void searchCardImageAssets(imageSearchText);
                                }}
                                className="flex flex-col sm:flex-row gap-3"
                            >
                                <input
                                    type="text"
                                    value={imageSearchText}
                                    onChange={(event) => setImageSearchText(event.target.value)}
                                    disabled={imageSearchLoading || !!imageUseLoadingId}
                                    className="flex-1 bg-stone-50 dark:bg-gray-800 border-2 border-stone-200 dark:border-transparent focus:border-emerald-400 p-4 rounded-xl outline-none font-bold dark:text-white transition disabled:opacity-60"
                                    placeholder="تفاحة / apple / der Apfel"
                                    dir="auto"
                                />
                                <button
                                    type="submit"
                                    disabled={imageSearchLoading || !!imageUseLoadingId}
                                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-black transition flex items-center justify-center gap-2"
                                >
                                    {imageSearchLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                    بحث
                                </button>
                            </form>

                            {imageQuota && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-black">
                                    {imageQuota.limit == null ? (
                                        <span className="text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl">
                                            {imageQuota.plan === 'enterprise' ? 'باقة Enterprise' : 'باقة برو'} · استخدام الصور متاح بدون حد يومي
                                        </span>
                                    ) : (
                                        <span className={`px-3 py-2 rounded-xl ${imageQuota.remaining === 0 ? 'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20' : 'text-gray-600 dark:text-gray-300 bg-stone-100 dark:bg-gray-800'}`}>
                                            {imageQuota.remaining === 0
                                                ? `استخدمت ${imageQuota.used}/${imageQuota.limit} صورة اليوم`
                                                : `متبقي ${imageQuota.remaining} من ${imageQuota.limit} صورة اليوم`}
                                        </span>
                                    )}
                                    {imageQuota.limit != null && imageQuota.remaining === 0 && (
                                        <span className="text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl flex items-center gap-2">
                                            <Clock size={14} />
                                            يتجدد الحد {formatImageQuotaResetText(imageQuotaSecondsRemaining)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar min-h-[260px]">
                            {imageSearchLoading ? (
                                <div className="min-h-[260px] flex flex-col items-center justify-center text-gray-400 gap-3">
                                    <Loader2 size={34} className="animate-spin text-emerald-500" />
                                    <p className="text-sm font-black">جاري البحث عن صور مناسبة...</p>
                                </div>
                            ) : imageAssets.length === 0 ? (
                                <div className="min-h-[260px] border-2 border-dashed border-stone-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                                    <ImageIcon size={38} className="text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-700 dark:text-gray-200 font-black">
                                        {imagePickerError || 'اكتب كلمة وابحث عن صورة مناسبة.'}
                                    </p>
                                    {imageQuota?.limit != null && imageQuota.remaining === 0 && (
                                        <p className="text-xs text-rose-500 font-bold mt-2">
                                            يتجدد حد سيلفر {formatImageQuotaResetText(imageQuotaSecondsRemaining)}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {imageAssets.map((asset) => {
                                        const imageUrl = resolveMediaUrl(asset.imageUrl);
                                        const quotaBlocked = imageQuota?.limit != null && imageQuota.remaining === 0;
                                        return (
                                            <article key={asset.id} className="rounded-2xl overflow-hidden border border-stone-100 dark:border-gray-700 bg-stone-50 dark:bg-gray-800">
                                                <div className="relative aspect-video overflow-hidden bg-white/70 dark:bg-gray-900">
                                                    <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-25" aria-hidden="true" />
                                                    <img src={imageUrl} alt={asset.arLabel} className="relative z-[1] w-full h-full object-contain p-3" />
                                                </div>
                                                <div className="p-4">
                                                    <p className="font-black text-gray-800 dark:text-white truncate">{asset.arLabel}</p>
                                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300 truncate" dir="ltr">{asset.targetWord}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleUseCardImageAsset(asset)}
                                                        disabled={!!imageUseLoadingId || quotaBlocked}
                                                        className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-black transition flex items-center justify-center gap-2"
                                                    >
                                                        {imageUseLoadingId === asset.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                        استخدم الصورة
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={deleteModal.onConfirm} title={deleteModal.title} message={deleteModal.message} />
        </div>
    );
};
