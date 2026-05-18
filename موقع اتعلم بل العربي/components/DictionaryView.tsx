
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Volume2, Book, AlertCircle, Loader, Plus, X, Check, CheckCircle, History, ArrowRight, GraduationCap, Languages, Copy, RotateCw, AlertTriangle, Sparkles, Folder, Image as ImageIcon, Trash2, Bookmark, Mic, Share2, ExternalLink, Briefcase, Plane, Coffee, Heart, Key, Image, Palette, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddCardResult, DictionaryEntry, Card, Folder as FolderType } from '../types';
import { detectLang, speakText } from '../services/ttsService';
import { db } from '../services/db';
import { Toast } from './Toast';
import { canUserManageFolder } from '../utils/folderPermissions';

interface DictionaryViewProps {
    t: any;
    /** يعيد false عند فشل الحفظ على الخادم حتى لا يُغلق المودال؛ `pro_limit` يغلق المودال ويُظهر ترقية Pro */
    onAddCard?: (card: Partial<Card>) => void | Promise<AddCardResult | void>;
    folders?: FolderType[];
    targetLanguage?: 'en' | 'de';
    user?: { id: string } | null;
}

const LEVELS = [
    { label: 'A1', color: 'bg-green-100 text-green-700 border-green-200' },
    { label: 'A2', color: 'bg-green-100 text-green-700 border-green-200' },
    { label: 'B1', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'B2', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'C1', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'C2', color: 'bg-red-100 text-red-700 border-red-200' },
];

type SmartAnalysisMode = 'correction' | 'translation';

type SmartAnalysisResult = {
    isCorrect: boolean;
    correctedText: string;
    explanation: string;
    improvements: string[];
    cefrLevel: string;
    mistakes: { original: string; correction: string; reason: string }[];
    mode?: SmartAnalysisMode;
    sourceLanguage?: 'ar' | 'target';
};

type DictionaryCandidate = {
    word: string;
    arabic: string;
    article?: string;
    plural?: string;
    partOfSpeech?: string;
    usage?: string;
    example?: string;
    exampleTranslation?: string;
    confidence?: string;
    alternatives?: string[];
    source?: string;
};

const targetLanguageLabel = (targetLanguage: 'en' | 'de', t?: any) =>
    targetLanguage === 'de'
        ? (t?.dictionary?.german || 'الألمانية')
        : (t?.dictionary?.english || 'الإنجليزية');

const translationCache = new Map<string, string | null>();
const translationCandidatesCache = new Map<string, string[]>();
const arabicCandidateCache = new Map<string, DictionaryCandidate[]>();

const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), ms);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

// --- HELPER: Fetch Translation ---
const fetchTranslation = async (text: string, from: string, to: string) => {
    const cacheKey = `${from}|${to}|${text.trim().toLowerCase()}`;
    if (translationCache.has(cacheKey)) return translationCache.get(cacheKey) || null;

    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
        const data = await res.json();
        const translated = data.responseData.translatedText || null;
        translationCache.set(cacheKey, translated);
        return translated;
    } catch (e) {
        console.error("Translation failed", e);
        translationCache.set(cacheKey, null);
        return null;
    }
};

const fetchTranslationCandidates = async (text: string, from: string, to: string): Promise<string[]> => {
    const cacheKey = `${from}|${to}|${text.trim().toLowerCase()}`;
    const cached = translationCandidatesCache.get(cacheKey);
    if (cached) return cached;

    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
        const data = await res.json();
        const matches = Array.isArray(data?.matches) ? data.matches : [];
        const values = [
            data?.responseData?.translatedText,
            ...matches.map((match: { translation?: string }) => match.translation),
        ];

        const seen = new Set<string>();
        const filteredValues = values
            .map((value) => String(value || '').trim())
            .filter((value) => {
                const key = value.toLowerCase();
                if (!value || key === text.toLowerCase() || seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .slice(0, 5);
        translationCandidatesCache.set(cacheKey, filteredValues);
        return filteredValues;
    } catch (e) {
        console.error("Translation candidates failed", e);
        translationCandidatesCache.set(cacheKey, []);
        return [];
    }
};

const normalizeArabicKey = (value: string) =>
    value
        .trim()
        .replace(/[ًٌٍَُِّْـ]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ')
        .toLowerCase();

const localArabicCandidates: Record<'en' | 'de', Record<string, DictionaryCandidate[]>> = {
    de: {
        [normalizeArabicKey('عمل')]: [
            { word: 'Arbeit', article: 'die', plural: 'Arbeiten', arabic: 'عمل / وظيفة / مجهود', partOfSpeech: 'noun', usage: 'الشغل أو الوظيفة بشكل عام', example: 'Ich gehe morgen zur Arbeit.', exampleTranslation: 'سأذهب إلى العمل غداً.', confidence: 'شائع' },
            { word: 'Job', article: 'der', plural: 'Jobs', arabic: 'وظيفة / شغل', partOfSpeech: 'noun', usage: 'كلمة يومية للوظيفة', example: 'Ich suche einen neuen Job.', exampleTranslation: 'أبحث عن وظيفة جديدة.', confidence: 'يومي' },
            { word: 'Werk', article: 'das', plural: 'Werke', arabic: 'عمل فني / مؤلف / مصنع', partOfSpeech: 'noun', usage: 'عمل إبداعي أو إنتاج كبير', example: 'Das ist ein wichtiges Werk.', exampleTranslation: 'هذا عمل مهم.', confidence: 'سياقي' },
            { word: 'Handlung', article: 'die', plural: 'Handlungen', arabic: 'فعل / تصرف / أحداث قصة', partOfSpeech: 'noun', usage: 'لما المقصود فعل أو أحداث', example: 'Seine Handlung war mutig.', exampleTranslation: 'كان تصرفه شجاعاً.', confidence: 'سياقي' },
        ],
        [normalizeArabicKey('عين')]: [
            { word: 'Auge', article: 'das', plural: 'Augen', arabic: 'عين الإنسان أو الحيوان', partOfSpeech: 'noun', usage: 'عضو النظر', example: 'Mein Auge tut weh.', exampleTranslation: 'عيني تؤلمني.', confidence: 'شائع' },
            { word: 'Quelle', article: 'die', plural: 'Quellen', arabic: 'عين ماء / مصدر', partOfSpeech: 'noun', usage: 'مصدر الماء أو المعلومة', example: 'Die Quelle liegt im Wald.', exampleTranslation: 'عين الماء في الغابة.', confidence: 'سياقي' },
        ],
        [normalizeArabicKey('حساب')]: [
            { word: 'Rechnung', article: 'die', plural: 'Rechnungen', arabic: 'فاتورة / حساب مطعم', partOfSpeech: 'noun', usage: 'عند الدفع أو الفاتورة', example: 'Die Rechnung bitte.', exampleTranslation: 'الحساب من فضلك.', confidence: 'شائع' },
            { word: 'Konto', article: 'das', plural: 'Konten', arabic: 'حساب بنكي أو حساب مستخدم', partOfSpeech: 'noun', usage: 'للبنك أو الحساب الإلكتروني', example: 'Ich habe ein neues Konto.', exampleTranslation: 'لدي حساب جديد.', confidence: 'شائع' },
            { word: 'Berechnung', article: 'die', plural: 'Berechnungen', arabic: 'عملية حسابية', partOfSpeech: 'noun', usage: 'الحساب الرياضي', example: 'Die Berechnung ist richtig.', exampleTranslation: 'الحساب صحيح.', confidence: 'سياقي' },
        ],
        [normalizeArabicKey('موعد')]: [
            { word: 'Termin', article: 'der', plural: 'Termine', arabic: 'موعد رسمي / موعد طبي', partOfSpeech: 'noun', usage: 'موعد محدد مع شخص أو جهة', example: 'Ich habe einen Termin beim Arzt.', exampleTranslation: 'لدي موعد عند الطبيب.', confidence: 'شائع' },
            { word: 'Verabredung', article: 'die', plural: 'Verabredungen', arabic: 'ميعاد شخصي / مقابلة', partOfSpeech: 'noun', usage: 'موعد بين أشخاص', example: 'Wir haben eine Verabredung.', exampleTranslation: 'لدينا موعد.', confidence: 'يومي' },
        ],
    },
    en: {
        [normalizeArabicKey('عمل')]: [
            { word: 'work', arabic: 'عمل / شغل', partOfSpeech: 'noun/verb', usage: 'المعنى العام للعمل أو يشتغل', example: 'I have a lot of work today.', exampleTranslation: 'لدي عمل كثير اليوم.', confidence: 'شائع' },
            { word: 'job', arabic: 'وظيفة', partOfSpeech: 'noun', usage: 'وظيفة أو شغل ثابت', example: 'She got a new job.', exampleTranslation: 'حصلت على وظيفة جديدة.', confidence: 'شائع' },
            { word: 'act', arabic: 'فعل / تصرف', partOfSpeech: 'noun/verb', usage: 'لما المقصود تصرف أو فعل', example: 'That was a brave act.', exampleTranslation: 'كان ذلك تصرفاً شجاعاً.', confidence: 'سياقي' },
        ],
        [normalizeArabicKey('حساب')]: [
            { word: 'account', arabic: 'حساب مستخدم أو بنك', partOfSpeech: 'noun', usage: 'حساب إلكتروني أو بنكي', example: 'I opened a new account.', exampleTranslation: 'فتحت حساباً جديداً.', confidence: 'شائع' },
            { word: 'bill', arabic: 'فاتورة / حساب مطعم', partOfSpeech: 'noun', usage: 'عند الدفع', example: 'Can I have the bill?', exampleTranslation: 'هل يمكن أن أحصل على الحساب؟', confidence: 'شائع' },
            { word: 'calculation', arabic: 'عملية حسابية', partOfSpeech: 'noun', usage: 'في الرياضيات أو الأرقام', example: 'The calculation is correct.', exampleTranslation: 'الحساب صحيح.', confidence: 'سياقي' },
        ],
    },
};

const uniqueCandidates = (items: DictionaryCandidate[]) => {
    const seen = new Set<string>();
    return items
        .map((item) => ({ ...item, word: String(item.word || '').trim(), arabic: String(item.arabic || '').trim() }))
        .filter((item) => {
            const key = item.word.toLowerCase();
            if (!item.word || seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 8);
};

const getArabicDictionaryCandidates = async (query: string, targetLanguage: 'en' | 'de', fastMode = false): Promise<DictionaryCandidate[]> => {
    const normalized = normalizeArabicKey(query);
    const fullCacheKey = `${targetLanguage}|${normalized}|full`;
    const fastCacheKey = `${targetLanguage}|${normalized}|fast`;
    const fullCached = arabicCandidateCache.get(fullCacheKey);
    if (fullCached) return fullCached;
    const fastCached = arabicCandidateCache.get(fastCacheKey);
    if (fastMode && fastCached) return fastCached;

    const localCandidates = localArabicCandidates[targetLanguage]?.[normalized] || [];
    if (fastMode && localCandidates.length > 0) {
        const immediate = uniqueCandidates(localCandidates);
        arabicCandidateCache.set(fastCacheKey, immediate);
        return immediate;
    }

    const [remoteWords, aiCandidates] = await Promise.all([
        withTimeout(fetchTranslationCandidates(query, 'ar', targetLanguage), fastMode ? 550 : 900, []),
        fastMode ? Promise.resolve([]) : withTimeout((async () => {
            try {
                const { aiService } = await import('../services/aiService');
                const generated = await aiService.getDictionaryCandidates(query, targetLanguage, 'B1');
                return Array.isArray(generated) ? generated : [];
            } catch (e) {
                console.error('AI dictionary candidates failed', e);
                return [];
            }
        })(), localCandidates.length > 0 ? 900 : 1300, []),
    ]);

    const remoteCandidates: DictionaryCandidate[] = remoteWords.map((word, index) => ({
        word,
        arabic: query,
        partOfSpeech: 'word',
        usage: index === 0 ? 'ترجمة مباشرة من القاموس العام' : 'اقتراح بديل من ترجمات عامة',
        confidence: index === 0 ? 'مباشر' : 'بديل',
        source: 'mymemory',
    }));

    const candidates = uniqueCandidates([...localCandidates, ...aiCandidates, ...remoteCandidates]);
    arabicCandidateCache.set(fastMode ? fastCacheKey : fullCacheKey, candidates);
    return candidates;
};

const candidateToEntry = (candidate: DictionaryCandidate): DictionaryEntry => ({
    word: candidate.word,
    phonetic: '',
    phonetics: [],
    meanings: [{
        partOfSpeech: candidate.partOfSpeech || 'word',
        definitions: [{
            definition: candidate.arabic,
            example: candidate.example,
            synonyms: candidate.alternatives || [],
            antonyms: [],
        }],
        synonyms: candidate.alternatives || [],
        antonyms: [],
    }],
    sourceUrls: [],
    ...(candidate as any),
} as DictionaryEntry);

interface EntryCardProps {
    entry: DictionaryEntry;
    searchTranslation: string | null;
    query: string;
    onOpenSave: (data: { front: string; back: string; image?: string }) => void;
    t: any;
    targetLanguage: 'en' | 'de';
}

// --- SUB-COMPONENT: Skeleton Loader ---
const SkeletonEntry = () => (
    <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border border-stone-100 dark:border-gray-800 p-8 mb-8 animate-pulse">
        <div className="flex justify-between items-start mb-10">
            <div className="space-y-4">
                <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            </div>
            <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"></div>
                <div className="w-24 h-12 rounded-full bg-gray-100 dark:bg-gray-800"></div>
            </div>
        </div>
        <div className="space-y-4">
            <div className="h-20 w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl"></div>
            <div className="h-20 w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl"></div>
        </div>
    </div>
);

// --- SUB-COMPONENT: Empty State ---
const EmptyState = ({ targetLang, t }: { targetLang: string, t: any }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
        <div className="relative mb-10">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"></div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-primary to-orange-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 transform -rotate-6">
                <Search size={64} className="text-white" />
            </div>
        </div>
        <h3 className="text-3xl font-black text-gray-800 dark:text-white mb-4">{t.dictionary.discoverTitle}</h3>
        <p className="max-w-md text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            {t.dictionary.discoverSubtitle}
        </p>
    </motion.div>
);

// --- SUB-COMPONENT: Entry Card (Enhanced with Deep Dive) ---
const EntryCard: React.FC<EntryCardProps> = ({ entry, searchTranslation, query, onOpenSave, t, targetLanguage }) => {
    const [exampleTranslations, setExampleTranslations] = useState<string[]>([]);
    const [loadingTranslations, setLoadingTranslations] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Deep Dive State
    const [deepDiveData, setDeepDiveData] = useState<{
        collocations: string[];
        nuance: string;
        example_context: string;
        visual_cue: string;
    } | null>(null);
    const [loadingDeepDive, setLoadingDeepDive] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const richEntry = entry as DictionaryEntry & DictionaryCandidate;
    const displayWord = richEntry.article ? `${richEntry.article} ${entry.word}` : entry.word;

    const entryExamples = useMemo(() => {
        const candidates = entry.meanings.flatMap(m => m.definitions.map(d => d.example))
            .filter((ex): ex is string => typeof ex === 'string' && ex.length > 15);
        const unique = Array.from(new Set(candidates));
        return unique.sort((a: string, b: string) => a.length - b.length).slice(0, 6);
    }, [entry]);

    const meaningGroups = useMemo(() => (
        entry.meanings
            .filter((meaning) => meaning.definitions.length > 0)
            .slice(0, 4)
            .map((meaning) => ({
                ...meaning,
                definitions: meaning.definitions.slice(0, 3),
            }))
    ), [entry]);

    useEffect(() => {
        if (entryExamples.length > 0) {
            setLoadingTranslations(true);
            const translateAll = async () => {
                const promises = entryExamples.map(ex => fetchTranslation(ex, targetLanguage, 'ar'));
                const translations = await Promise.all(promises);
                setExampleTranslations(translations.map(tr => tr || '...'));
                setLoadingTranslations(false);
            };
            translateAll();
        } else {
            setExampleTranslations([]);
        }
    }, [entryExamples, targetLanguage]);

    const playAudio = () => {
        const audioUrl = entry.phonetics.find(p => p.audio && p.audio.length > 0)?.audio;
        if (audioUrl && audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
        } else {
            speakText(displayWord, targetLanguage);
        }
    };

    const handleSaveRequest = () => {
        const isArSearch = detectLang(query) === 'ar';
        const arabicText = isArSearch ? query : (searchTranslation || '...');
        const wordText = displayWord;
        const front = `${wordText}`;
        const back = `${arabicText}\n${richEntry.usage ? `${richEntry.usage}\n` : ''}(${entry.meanings[0]?.partOfSpeech || 'word'})`;
        onOpenSave({ front, back });
    };

    const handleDeepDive = async () => {
        if (deepDiveData) return; // Already fetched
        setLoadingDeepDive(true);
        // Dynamic import to avoid circular dependency issues if any
        const { aiService } = await import('../services/aiService');
        const data = await aiService.getWordDetails(entry.word, targetLanguage, 'B1');
        setDeepDiveData(data);
        setLoadingDeepDive(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[3rem] shadow-warm-lg dark:shadow-2xl border-2 ${isHovered ? 'border-primary/30 dark:border-primary/50' : 'border-stone-100 dark:border-gray-800'} overflow-hidden mb-8 transition-all duration-500`}
        >
            <audio ref={audioRef} className="hidden" />

            {/* Header */}
            <div className="p-6 md:p-10 border-b border-stone-100 dark:border-gray-800 bg-gradient-to-br from-white to-stone-50/30 dark:from-dark-card dark:to-gray-900/40 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 md:gap-4 mb-3 flex-wrap">
                            <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-normal leading-tight drop-shadow-sm" dir="ltr">{displayWord}</h2>
                            <AnimatePresence>
                                {entry.meanings[0] && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-sm font-black uppercase tracking-widest bg-stone-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-1.5 rounded-xl border border-stone-200 dark:border-gray-700"
                                    >
                                        {entry.meanings[0].partOfSpeech}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {(searchTranslation || detectLang(query) === 'ar') && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-3 text-2xl md:text-3xl font-black text-primary dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-6 py-2 rounded-2xl border border-red-100 dark:border-red-900/30 mb-4"
                            >
                                <Languages size={24} className="opacity-70" />
                                {detectLang(query) === 'ar' ? query : searchTranslation}
                            </motion.div>
                        )}

                        {(richEntry.usage || richEntry.confidence || richEntry.exampleTranslation) && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {richEntry.confidence && (
                                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 text-xs font-black">
                                        {richEntry.confidence}
                                    </span>
                                )}
                                {richEntry.usage && (
                                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-xs font-black">
                                        {richEntry.usage}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-6 text-2xl text-gray-400 font-serif italic tracking-wide">
                            {(entry.phonetic || richEntry.plural) && (
                                <span className="bg-stone-50 dark:bg-gray-900/50 px-4 py-1 rounded-lg border border-stone-100 dark:border-gray-800">{entry.phonetic || richEntry.plural}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 md:gap-4 self-stretch md:self-center mt-4 md:mt-0">
                        <div className="flex flex-col gap-2">
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={playAudio}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white dark:bg-gray-800 text-primary hover:text-white hover:bg-primary transition-all flex items-center justify-center shadow-xl border-2 border-primary/20"
                            >
                                <Volume2 size={24} className="md:w-8 md:h-8" />
                            </motion.button>
                        </div>

                        <div className="flex flex-col gap-2 md:gap-3 flex-1">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSaveRequest}
                                className="px-6 md:px-8 h-14 md:h-16 rounded-2xl md:rounded-3xl bg-primary text-white font-black text-lg md:text-xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2 md:gap-3"
                            >
                                <Bookmark size={20} className="md:w-6 md:h-6" /> {t.dictionary.save}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDeepDive}
                                disabled={loadingDeepDive || !!deepDiveData}
                                className={`px-4 md:px-8 h-12 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all shadow-lg flex items-center justify-center gap-2 border-2 ${deepDiveData ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-gray-800 text-purple-600 border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                            >
                                {loadingDeepDive ? <Loader size={16} className="animate-spin" /> : deepDiveData ? <Check size={18} /> : <Sparkles size={18} />}
                                {deepDiveData ? t.dictionary.analyzed : t.dictionary.smartAnalysis}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {meaningGroups.length > 0 && (
                <div className="p-5 md:p-7 bg-slate-50 dark:bg-gray-950/40 border-b border-stone-100 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                        <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                <Book size={20} />
                            </span>
                            {t.dictionary.meaning || 'المعنى والاستخدام'}
                        </h3>
                        {richEntry.source && (
                            <span className="px-4 py-2 rounded-full bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 text-xs font-black uppercase tracking-widest">
                                {richEntry.source === 'ai' ? 'AI Dictionary' : richEntry.source}
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {meaningGroups.map((meaning, meaningIndex) => (
                            <div
                                key={`${meaning.partOfSpeech}-${meaningIndex}`}
                                className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 md:p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-100 border border-slate-200 dark:border-gray-700 text-xs font-black uppercase tracking-widest">
                                        {meaning.partOfSpeech}
                                    </span>
                                    {richEntry.plural && (
                                        <span className="text-xs md:text-sm font-black text-slate-700 dark:text-gray-200" dir="ltr">
                                            Pl. {richEntry.plural}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {meaning.definitions.map((definition, definitionIndex) => (
                                        <div key={definitionIndex} className="rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-gray-800 p-4">
                                            <p className="text-base md:text-lg font-extrabold text-slate-950 dark:text-white leading-relaxed" dir="auto">
                                                {definition.definition}
                                            </p>

                                            {definition.example && (
                                                <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3">
                                                    <p className="text-sm md:text-base font-bold text-slate-950 dark:text-amber-50 leading-relaxed" dir="ltr">
                                                        {definition.example}
                                                    </p>
                                                    {richEntry.exampleTranslation && (
                                                        <p className="mt-2 text-sm font-bold text-primary dark:text-red-200 leading-relaxed" dir="rtl">
                                                            {richEntry.exampleTranslation}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {definition.synonyms.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {definition.synonyms.slice(0, 6).map((synonym) => (
                                                        <span key={synonym} className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-black border border-blue-100 dark:border-blue-800" dir="ltr">
                                                            {synonym}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Deep Dive Content Section */}
            <AnimatePresence>
                {deepDiveData && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-900/10 dark:to-dark-card border-b border-stone-100 dark:border-gray-800"
                    >
                        <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Nuance & Visual */}
                            <div className="space-y-6">
                                <div className="bg-white/80 dark:bg-black/20 p-6 rounded-3xl border border-purple-100 dark:border-purple-500/20 shadow-sm">
                                    <h4 className="text-purple-600 dark:text-purple-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Key size={16} /> {t.dictionary.nuance}
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 font-bold leading-relaxed">
                                        {deepDiveData.nuance}
                                    </p>
                                </div>

                                <div className="bg-white/80 dark:bg-black/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-500/20 shadow-sm">
                                    <h4 className="text-amber-600 dark:text-amber-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Image size={16} /> {t.dictionary.visualCue}
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 font-bold leading-relaxed italic">
                                        "{deepDiveData.visual_cue}"
                                    </p>
                                </div>
                            </div>

                            {/* Collocations & Context */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Share2 size={16} /> {t.dictionary.collocations}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {deepDiveData.collocations.map((col, i) => (
                                            <span key={i} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm border border-blue-100 dark:border-blue-900/30">
                                                {col}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-500 to-primary p-6 rounded-3xl shadow-lg text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <h4 className="text-white/80 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                                        <Sparkles size={16} /> {t.dictionary.smartContext}
                                    </h4>
                                    <p className="text-xl font-bold leading-relaxed relative z-10 drop-shadow-md" dir="ltr">
                                        {deepDiveData.example_context}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Examples Section */}
            {entryExamples.length > 0 ? (
                <div className="p-6 md:p-10 bg-gradient-to-b from-stone-50/50 to-white dark:from-dark-card dark:to-black/30">
                    <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-white mb-6 md:mb-8 flex items-center gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-primary rounded-2xl shadow-inner"><GraduationCap size={24} /></div>
                        {t.dictionary.realContextExamples}
                    </h3>

                    <div className="space-y-6">
                        {entryExamples.map((example, idx) => {
                            const translatedEx = exampleTranslations[idx];
                            const lvl = LEVELS[idx % LEVELS.length];

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group/item flex flex-col md:flex-row items-stretch rounded-[2rem] overflow-hidden border border-stone-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 bg-white dark:bg-gray-800/40"
                                    dir="ltr"
                                >
                                    <div className={`flex items-center justify-center w-full md:w-16 p-3 font-black text-sm ${lvl.color} bg-opacity-20 border-b md:border-b-0 md:border-r border-stone-100 dark:border-gray-700`}>
                                        {lvl.label}
                                    </div>
                                    <div className="flex-1 p-6 text-left border-b md:border-b-0 md:border-r border-stone-100 dark:border-gray-700">
                                        <p className="text-lg md:text-xl text-gray-900 dark:text-white font-bold leading-relaxed">{example}</p>
                                    </div>
                                    <div className="flex-1 p-6 bg-stone-50/30 dark:bg-black/20 text-right flex items-center group-hover/item:bg-primary/5 transition-colors" dir="rtl">
                                        {loadingTranslations && !translatedEx ? (
                                            <div className="flex items-center gap-4 text-gray-400 font-bold animate-pulse">
                                                <Loader size={20} className="animate-spin" /> {t.dictionary.translating}
                                            </div>
                                        ) : (
                                            <p className="text-lg md:text-xl text-primary dark:text-red-400 font-bold leading-relaxed w-full">
                                                {translatedEx || '...'}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="p-10 text-center text-gray-400 italic font-medium">
                    {t.dictionary.noExamples}
                </div>
            )}
        </motion.div>
    );
};

// --- MAIN COMPONENT ---
export const DictionaryView: React.FC<DictionaryViewProps> = ({ t, onAddCard, folders = [], targetLanguage = 'en', user = null }) => {
    const [activeTab, setActiveTab] = useState<'dictionary' | 'translator'>('dictionary');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DictionaryEntry[] | null>(null);
    const [translation, setTranslation] = useState<string | null>(null);
    const [dictionaryCandidates, setDictionaryCandidates] = useState<DictionaryCandidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
    const d = t.dictionary || {};
    const targetLabel = targetLanguageLabel(targetLanguage, t);
    const arabicLabel = d.arabic || 'العربية';
    const formatDictText = (template: string, vars: Record<string, string | number>) =>
        Object.entries(vars).reduce((text, [key, value]) => text.replace(`{${key}}`, String(value)), template);

    const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Load history based on language
    useEffect(() => {
        setSearchHistory(db.load('dict_history', [], targetLanguage));
        setResults(null);
        setDictionaryCandidates([]);
        setQuery('');
    }, [targetLanguage]);

    // Translator State
    const [translatorText, setTranslatorText] = useState('');
    const [translatorResult, setTranslatorResult] = useState('');
    const [translatorLoading, setTranslatorLoading] = useState(false);
    const [transLang, setTransLang] = useState<'target-ar' | 'ar-target'>('target-ar'); // existing

    // --- NEW: Smart Analysis State ---
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<SmartAnalysisResult | null>(null);

    const handleSmartAnalysis = async () => {
        const text = translatorText.trim();
        if (!text) return;
        setIsAnalyzing(true);
        setAnalysisResult(null); // Reset previous result

        try {
            const detectedLanguage = detectLang(text);
            const isArabicSource = detectedLanguage === 'ar';
            const fallbackTranslation = isArabicSource
                ? await fetchTranslation(text, 'ar', targetLanguage)
                : null;

            const { aiService } = await import('../services/aiService');
            const result = await aiService.analyzeText(
                text,
                targetLanguage as 'en' | 'de',
                'B1',
                isArabicSource ? 'ar' : 'target'
            );

            const normalizedResult: SmartAnalysisResult = {
                ...result,
                correctedText: isArabicSource && fallbackTranslation && result.correctedText.trim() === text
                    ? fallbackTranslation
                    : result.correctedText,
                mode: isArabicSource ? 'translation' : 'correction',
                sourceLanguage: isArabicSource ? 'ar' : 'target',
            };

            if (isArabicSource && normalizedResult.improvements.length === 0) {
                normalizedResult.improvements = [
                    formatDictText(d.targetTranslationTitle || 'ترجمة ذكية إلى {language}', { language: targetLabel }),
                    d.addMoreContext || 'لو المعنى المقصود مختلف، أضف سياقاً أكثر للجملة قبل التحليل.',
                ];
            }

            setAnalysisResult(normalizedResult);
            setTranslatorResult(normalizedResult.correctedText);
        } catch (e) {
            console.error(e);
            showToast("حدث خطأ أثناء التحليل الذكي", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Save Modal State
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [wordToSave, setWordToSave] = useState<{ front: string, back: string, image: string }>({ front: '', back: '', image: '' });
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showStyleModal, setShowStyleModal] = useState(false);
    const [saveSubmitting, setSaveSubmitting] = useState(false);

    // Initial Trigger: Just opens the style modal
    const handleGenerateImageClick = () => {
        if (!wordToSave.front) {
            showToast("⚠️ يرجى كتابة الكلمة أولاً لتوليد الصورة", "error");
            return;
        }
        setShowStyleModal(true);
    };

    // Actual Generation Logic (Called after style selection)
    const triggerImageGeneration = async (style: string) => {
        setShowStyleModal(false);
        setIsGeneratingImage(true);

        // Optimistic UI
        showToast(`جاري تخيل المشهد بأسلوب ${style === 'cartoon' ? 'كرتوني' : style === 'realistic' ? 'واقعي' : style === 'anime' ? 'أنمي' : 'ثلاثي الأبعاد'}... 🎨`, 'info');

        try {
            const { aiService } = await import('../services/aiService');
            // Use the back text (translation/meaning) as context, or fallback to word
            const context = wordToSave.back.length > 5 ? wordToSave.back : `Meaning of ${wordToSave.front}`;

            // Pass the selected style
            const imageUrl = await aiService.generateCardImage(wordToSave.front, context, style);

            if (imageUrl) {
                setWordToSave(prev => ({ ...prev, image: imageUrl }));
                showToast("تم توليد الصورة بنجاح! ✨", "success");
            }
        } catch (e: any) {
            console.error(e);
            showToast(e.message || "⚠️ حدث خطأ أثناء التوليد", "error");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** المجلدات القابلة لحفظ بطاقات المستخدم (خاصة المستخدم فقط) */
    const saveFolders = useMemo(() => {
        const list = [...folders].filter((f) => canUserManageFolder(f, user as any));
        list.sort((a, b) => {
            if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
            return a.name.localeCompare(b.name, 'ar');
        });
        return list;
    }, [folders]);

    useEffect(() => {
        if (saveFolders.length === 0) {
            setSelectedFolderId('');
            return;
        }
        if (!selectedFolderId || !saveFolders.some(f => f.id === selectedFolderId)) {
            setSelectedFolderId(saveFolders[0].id);
        }
    }, [saveFolders, selectedFolderId]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setWordToSave({ ...wordToSave, image: reader.result as string }); };
            reader.readAsDataURL(file);
        }
    };

    const handleSearch = async (e?: React.FormEvent, termOverride?: string, saveHistory: boolean = true) => {
        if (e) e.preventDefault();
        const searchTerm = termOverride || query.trim();
        if (!searchTerm) return;

        if (searchTerm.trim().split(/\s+/).length > 1) {
            showToast("⚠️ يرجى إدخال كلمة واحدة فقط في القاموس. لترجمة الجمل، استخدم تبويب 'المترجم'.", "info");
            return;
        }

        setLoading(true);
        setError('');
        setDictionaryCandidates([]);

        if (saveHistory) {
            setResults(null);
            setTranslation(null);
            setShowHistory(false);
            const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 5);
            setSearchHistory(newHistory);
            db.save('dict_history', newHistory, targetLanguage);
        }

        if (termOverride) setQuery(searchTerm);

        try {
            const detected = detectLang(searchTerm);
            let searchWord = searchTerm;
            let trans = null;

            if (detected === 'ar') {
                // Input AR -> Target (EN or DE): show contextual alternatives first.
                const candidates = await getArabicDictionaryCandidates(searchTerm, targetLanguage, !saveHistory);
                if (candidates.length > 0) {
                    setDictionaryCandidates(candidates);
                    setTranslation(candidates[0].arabic || searchTerm);
                    setResults([candidateToEntry(candidates[0])]);
                    return;
                }

                const translatedTarget = await fetchTranslation(searchTerm, 'ar', targetLanguage);
                if (!translatedTarget) throw new Error('Translation failed');
                searchWord = translatedTarget;
                setTranslation(translatedTarget);
            } else {
                // Input Target -> AR
                trans = await fetchTranslation(searchTerm, targetLanguage, 'ar');
                setTranslation(trans);
            }

            // --- LOGIC FOR GERMAN vs ENGLISH ---
            if (targetLanguage === 'de') {
                try {
                    const deResponse = await fetch(`https://freedictionaryapi.com/api/v1/entries/de/${encodeURIComponent(searchWord)}`);
                    if (deResponse.ok) {
                        const deData = await deResponse.json();
                        if (Array.isArray(deData) && deData.length > 0) {
                            setResults(deData);
                            return;
                        }
                    }
                } catch (deErr) {
                    console.error("German Dictionary API error, falling back to translation:", deErr);
                }

                // Fallback for German: Use synthetic entry from translation
                setResults([{
                    word: searchWord,
                    phonetics: [],
                    meanings: [{
                        partOfSpeech: 'Word',
                        definitions: [{ definition: trans || (detected === 'ar' ? searchTerm : t.dictionary.noResults), synonyms: [], antonyms: [] }],
                        synonyms: [],
                        antonyms: []
                    }],
                    sourceUrls: []
                }]);
            } else {
                // ENGLISH: Use Real Dictionary API
                const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(searchWord)}`);
                if (!response.ok) {
                    // Fallback if dictionary API fails but translation worked
                    if (detected === 'ar' && searchWord) {
                        setResults([{
                            word: searchWord,
                            phonetics: [],
                            meanings: [{
                                partOfSpeech: 'Translation',
                                definitions: [{ definition: `${t.dictionary.translationPrefix}: ${searchTerm}`, synonyms: [], antonyms: [] }],
                                synonyms: [],
                                antonyms: []
                            }],
                            sourceUrls: []
                        }]);
                        return;
                    }
                    throw new Error('Not found');
                }
                const data = await response.json();
                setResults(data);
            }

        } catch (err) {
            setError(t.dictionary.noResults);
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab !== 'dictionary') return;
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        if (!query.trim()) {
            setResults(null);
            setTranslation(null);
            setDictionaryCandidates([]);
            setError('');
            return;
        }
        if (query.trim().split(/\s+/).length > 1) return;

        debounceTimeoutRef.current = setTimeout(() => {
            handleSearch(undefined, query, false);
        }, 450);
        return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
    }, [query]);

    // --- TRANSLATOR LOGIC ---
    const handleTranslate = async () => {
        if (!translatorText.trim()) return;
        setTranslatorLoading(true);
        const from = transLang === 'target-ar' ? targetLanguage : 'ar';
        const to = transLang === 'target-ar' ? 'ar' : targetLanguage;

        const result = await fetchTranslation(translatorText, from, to);
        setTranslatorResult(result || 'حدث خطأ في الترجمة');
        setTranslatorLoading(false);
    };

    const handleSaveTranslatorCard = () => {
        if (!translatorText || !translatorResult) return;
        setWordToSave({
            front: translatorText,
            back: translatorResult,
            image: ''
        });
        setSaveModalOpen(true);
    };

    const confirmSaveCard = async () => {
        if (!selectedFolderId) {
            showToast("⚠️ يرجى اختيار المجلد الذي ستحفظ فيه البطاقة", "error");
            return;
        }

        if (!wordToSave.front?.trim() || !wordToSave.back?.trim()) {
            showToast("⚠️ بيانات البطاقة غير مكتملة (الوجه الأمامي والخلفي)", "error");
            return;
        }

        if (!onAddCard) {
            showToast('تعذر الحفظ: إعدادات التطبيق لا تسمح بإضافة البطاقة.', 'error');
            return;
        }

        setSaveSubmitting(true);
        try {
            const result = await Promise.resolve(
                onAddCard({
                    folderId: selectedFolderId,
                    frontText: wordToSave.front.trim(),
                    backText: wordToSave.back.trim(),
                    frontImage: wordToSave.image || undefined,
                })
            );
            if (result === true) {
                setSaveModalOpen(false);
                setWordToSave({ front: '', back: '', image: '' });
            } else if (result === 'pro_limit') {
                setSaveModalOpen(false);
            }
        } finally {
            setSaveSubmitting(false);
        }
    };

    const dictionaryPlaceholder = useMemo(() => {
        if (targetLanguage === 'de') {
            return d.germanPlaceholder || 'اكتب كلمة بالألمانية...';
        }
        return d.placeholder;
    }, [targetLanguage, d]);

    const selectedCandidateWord = results?.[0]?.word?.toLowerCase() || '';
    const selectDictionaryCandidate = (candidate: DictionaryCandidate) => {
        setResults([candidateToEntry(candidate)]);
        setTranslation(candidate.arabic || query);
        setError('');
        setLoading(false);
    };

    return (
        <div className="p-4 md:p-8 animate-slide-up pb-20 max-w-5xl mx-auto min-h-screen relative" onClick={() => setShowHistory(false)}>

            <Toast
                message={toastMessage?.text || ""}
                isVisible={!!toastMessage}
                onClose={() => setToastMessage(null)}
                type={toastMessage?.type}
            />

            <header className="text-center mb-8">
                <h2 className="text-3xl md:text-5xl font-black text-gray-800 dark:text-white mb-4 tracking-tight flex items-center justify-center gap-3">
                    <Book className="text-primary" size={40} />
                    {t.dictionary.title} <span className="text-sm bg-primary text-white px-2 py-1 rounded ml-2">{targetLanguage === 'de' ? t.dictionary.german : t.dictionary.english}</span>
                </h2>
                {/* TABS SWITCHER */}
                <div className="flex justify-center mt-6">
                    <div className="bg-stone-100 dark:bg-gray-800 p-1.5 rounded-2xl flex gap-2 shadow-inner">
                        <button
                            onClick={() => setActiveTab('dictionary')}
                            className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 text-sm md:text-base ${activeTab === 'dictionary' ? 'bg-white dark:bg-gray-700 text-primary shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Book size={18} className="md:w-5 md:h-5" /> {t.dictionary.tabDictionary}
                        </button>
                        <button
                            onClick={() => setActiveTab('translator')}
                            className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 text-sm md:text-base ${activeTab === 'translator' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Languages size={18} className="md:w-5 md:h-5" /> {t.dictionary.tabTranslator}
                        </button>
                    </div>
                </div>
            </header>

            {/* === TAB 1: DICTIONARY === */}
            {activeTab === 'dictionary' && (
                <div className="animate-fade-in relative z-10">
                    {/* Hero Section: Search & Word of the Day */}
                    <div className="relative max-w-4xl mx-auto mb-12">
                        {/* Glassmorphic Search Container */}
                        <form onSubmit={(e) => handleSearch(e, undefined, true)} className="relative group perspective z-30">
                            <motion.div
                                animate={{
                                    scale: showHistory ? 1.02 : 1,
                                    y: showHistory ? -5 : 0,
                                    boxShadow: showHistory ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" : "0 10px 30px -10px rgba(0, 0, 0, 0.1)"
                                }}
                                className="relative bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[3rem] p-3 flex items-center transition-all duration-300 focus-within:border-primary/50 focus-within:bg-white/90 dark:focus-within:bg-black/60"
                            >
                                <div className="pl-6 text-gray-400 group-focus-within:text-primary transition-colors">
                                    {loading ? <Loader className="animate-spin" size={28} /> : <Search size={28} />}
                                </div>
                                <input
                                    type="text"
                                    placeholder={dictionaryPlaceholder}
                                    className="flex-1 bg-transparent py-3 md:py-5 px-3 md:px-4 text-lg md:text-2xl font-extrabold tracking-normal leading-relaxed text-gray-800 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => setShowHistory(true)}
                                    onClick={(e) => e.stopPropagation()}
                                    dir="auto"
                                    spellCheck={false}
                                />

                                {/* Voice Search Button */}
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 md:p-4 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors mx-1 md:mx-2"
                                    onClick={() => showToast(d.voiceSearchSoon || "جاري تفعيل البحث الصوتي... (قريباً)", "info")}
                                >
                                    <Mic size={20} className="md:w-6 md:h-6" />
                                </motion.button>

                                <button
                                    type="submit"
                                    disabled={loading || !query}
                                    className="bg-primary hover:bg-opacity-90 disabled:bg-gray-200 dark:disabled:bg-gray-800 text-white px-6 md:px-12 py-3 md:py-5 rounded-[2rem] md:rounded-[2.5rem] font-black text-base md:text-xl transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                                >
                                    {t.dictionary.search}
                                </button>
                            </motion.div>

                            {/* Search History Dropdown */}
                            <AnimatePresence>
                                {showHistory && searchHistory.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 15, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute top-full left-6 right-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden z-20"
                                    >
                                        <div className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/50 dark:bg-black/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2"><History size={14} /> {t.dictionary.searchHistory}</div>
                                            <button onClick={(e) => { e.stopPropagation(); setSearchHistory([]); db.save('dict_history', [], targetLanguage); }} className="hover:text-red-500 transition-colors">{t.dictionary.clear}</button>
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {searchHistory.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => { e.stopPropagation(); handleSearch(undefined, item, true); }}
                                                    className="w-full text-right px-8 py-4 hover:bg-primary/5 dark:hover:bg-white/5 flex items-center justify-between group transition-all"
                                                >
                                                    <span className="font-bold text-lg text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">{item}</span>
                                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-primary rtl:rotate-180 transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>

                    {/* Empty State: Word of the Day */}
                    {!loading && !results && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-primary p-1 shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[2rem] md:rounded-[2.8rem] p-6 md:p-12 text-center md:text-left relative z-10">
                                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/30 transform rotate-3">
                                            <Sparkles size={32} className="text-white animate-pulse md:w-10 md:h-10" />
                                        </div>
                                        <div className="flex-1 text-center md:text-left rtl:md:text-right">
                                            <div className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2 md:mb-3">
                                                {t.dictionary.wordOfTheDay}
                                            </div>
                                            <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2 font-serif">
                                                {targetLanguage === 'de' ? 'Herausforderung' : 'Serendipity'}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium text-base md:text-lg">
                                                {targetLanguage === 'de' ? (d.wordOfTheDayMeaningDe || 'تحدي / Challenge') : (d.wordOfTheDayMeaningEn || 'الصدفة السعيدة / Happy Accident')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSearch(undefined, targetLanguage === 'de' ? 'Herausforderung' : 'Serendipity', true)}
                                            className="px-6 py-3 md:px-8 md:py-4 bg-gray-100 dark:bg-white/10 hover:bg-primary hover:text-white dark:hover:bg-primary rounded-xl md:rounded-2xl font-bold transition-all group flex items-center gap-2 text-sm md:text-base"
                                        >
                                            <span>{t.dictionary.explore}</span>
                                            <ArrowRight size={16} className="rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform md:w-[18px] md:h-[18px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Categories */}
                            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { icon: Briefcase, label: d.categories?.business || "أعمال", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                                    { icon: Plane, label: d.categories?.travel || "سفر", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
                                    { icon: Coffee, label: d.categories?.daily || "يومي", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
                                    { icon: Heart, label: d.categories?.health || "صحة", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
                                ].map((cat, i) => (
                                    <button key={i} className={`p-3 md:p-4 rounded-2xl md:rounded-3xl ${cat.bg} hover:scale-105 transition-transform flex flex-col items-center gap-2 md:gap-3 group`}>
                                        <cat.icon size={24} className={`${cat.color} md:w-7 md:h-7`} />
                                        <span className="font-bold text-sm md:text-base text-gray-700 dark:text-gray-300">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {loading && !results && (
                        <div className="max-w-4xl mx-auto space-y-8 mt-12">
                            <SkeletonEntry />
                        </div>
                    )}

                    {error && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-2xl mx-auto flex flex-col items-center justify-center p-12 mt-8 text-center"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
                                <div className="relative w-32 h-32 bg-white dark:bg-dark-card rounded-full flex items-center justify-center shadow-2xl mb-8">
                                    <AlertCircle size={48} className="text-red-500" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-white mb-4">{d.wordNotFoundTitle || 'كلمة غير موجودة'}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
                                {d.wordNotFoundDesc || 'لم نتمكن من العثور على هذه الكلمة. جرب استخدام المترجم للنصوص الطويلة.'}
                            </p>
                            <button
                                onClick={() => setActiveTab('translator')}
                                className="px-10 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 hover:border-primary text-gray-700 dark:text-white rounded-[2rem] font-black text-lg transition-all flex items-center gap-3"
                            >
                                <Languages size={20} /> {d.goTranslator || 'الذهاب للمترجم'}
                            </button>
                        </motion.div>
                    )}

                    {dictionaryCandidates.length > 1 && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto mt-8 rounded-[1.75rem] border border-white/50 dark:border-white/10 bg-white/45 dark:bg-white/[0.04] backdrop-blur-2xl p-4 md:p-5 shadow-warm-lg"
                        >
                            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                                <div>
                                    <h3 className="text-base md:text-lg font-black text-slate-950 dark:text-white">
                                        {d.contextualMeanings || 'اختيارات المعنى حسب السياق'}
                                    </h3>
                                    <p className="text-xs md:text-sm font-bold text-slate-600 dark:text-gray-300 mt-1">
                                        {targetLanguage === 'de'
                                            ? (d.contextualMeaningsDe || 'الألماني يحتاج اختيار الكلمة المناسبة للسياق، خصوصاً مع أدوات التعريف والجمع.')
                                            : (d.contextualMeaningsEn || 'اختر المعنى الأقرب لاستخدامك عشان تظهر تفاصيل أدق.')}
                                    </p>
                                </div>
                                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/10">
                                    {dictionaryCandidates.length} {d.options || 'اختيارات'}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                                {dictionaryCandidates.map((candidate) => {
                                    const isSelected = selectedCandidateWord === candidate.word.toLowerCase();
                                    return (
                                        <button
                                            key={`${candidate.word}-${candidate.usage || candidate.arabic}`}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                selectDictionaryCandidate(candidate);
                                            }}
                                            className={`text-start rounded-2xl border px-4 py-3 transition-all min-w-[180px] max-w-full backdrop-blur-xl ${isSelected
                                                ? 'bg-primary/90 text-white border-primary/80 shadow-lg shadow-primary/20'
                                                : 'bg-white/35 dark:bg-white/[0.06] text-slate-900 dark:text-white border-white/60 dark:border-white/10 hover:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/15'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className={`text-lg font-extrabold tracking-normal leading-tight ${isSelected ? 'text-white' : 'text-slate-950 dark:text-white'}`} dir="ltr">
                                                    {candidate.article ? `${candidate.article} ${candidate.word}` : candidate.word}
                                                </span>
                                                {candidate.confidence && (
                                                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black border ${isSelected
                                                        ? 'bg-white/15 text-white border-white/20'
                                                        : 'bg-white/55 dark:bg-white/10 text-primary border-white/70 dark:border-white/10'
                                                        }`}>
                                                        {candidate.confidence}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`mt-1 text-xs md:text-sm font-bold leading-relaxed ${isSelected ? 'text-white/90' : 'text-slate-600 dark:text-gray-300'}`} dir="rtl">
                                                {candidate.usage || candidate.arabic}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {results && (
                            <motion.div
                                className="max-w-4xl mx-auto mt-12 space-y-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {results.map((entry, index) => (
                                    <EntryCard
                                        key={`${entry.word}-${index}`}
                                        entry={entry}
                                        searchTranslation={translation}
                                        query={query}
                                        t={t}
                                        targetLanguage={targetLanguage}
                                        onOpenSave={(data) => {
                                            setWordToSave({ ...wordToSave, ...data, image: '' });
                                            setSaveModalOpen(true);
                                        }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* === TAB 2: TRANSLATOR (Full Sentence) === */}
            {activeTab === 'translator' && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="bg-white dark:bg-dark-card rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] dark:shadow-none dark:border dark:border-gray-800 overflow-hidden">
                        <div className="bg-stone-50 dark:bg-gray-800/80 p-6 border-b border-stone-200 dark:border-gray-800 flex justify-between items-center px-12">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">{d.from || 'من'}</span>
                                <div className="text-xl font-black text-gray-900 dark:text-white">{transLang === 'target-ar' ? targetLabel : arabicLabel}</div>
                            </div>
                            <motion.button
                                whileHover={{ rotate: 180 }}
                                whileTap={{ scale: 0.8 }}
                                onClick={() => setTransLang(transLang === 'target-ar' ? 'ar-target' : 'target-ar')}
                                className="p-4 rounded-3xl bg-white dark:bg-gray-700 shadow-xl hover:shadow-primary/20 transition-all text-primary border border-stone-100 dark:border-gray-600"
                            >
                                <RotateCw size={24} />
                            </motion.button>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">{d.to || 'إلى'}</span>
                                <div className="text-xl font-black text-primary dark:text-red-400">{transLang === 'target-ar' ? arabicLabel : targetLabel}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-stone-100 dark:divide-gray-800 h-full">
                            <div className="p-5 md:p-10 flex flex-col min-h-[300px] md:min-h-[350px]">
                                <textarea
                                    placeholder={d.translatorPlaceholder || 'اكتب النص هنا للترجمة أو التصحيح...'}
                                    className="w-full h-full bg-transparent resize-none outline-none text-xl md:text-3xl font-black text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-gray-700 leading-normal"
                                    value={translatorText}
                                    onChange={e => {
                                        setTranslatorText(e.target.value);
                                        // Reset analysis when text changes
                                        if (analysisResult) setAnalysisResult(null);
                                    }}
                                    dir="auto"
                                ></textarea>
                                <div className="flex justify-between items-center mt-4 md:mt-6 pt-4 md:pt-6 border-t border-stone-50 dark:border-gray-900">
                                    <span className="text-xs font-black text-gray-300 uppercase tracking-widest">{translatorText.length} {d.chars || 'حرف'}</span>
                                    {translatorText && (
                                        <button onClick={() => { setTranslatorText(''); setAnalysisResult(null); }} className="bg-stone-100 dark:bg-gray-800 p-2 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 md:p-10 bg-stone-50/50 dark:bg-black/20 flex flex-col min-h-[300px] md:min-h-[350px] relative group/result">
                                {translatorLoading || isAnalyzing ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-black/20 backdrop-blur-sm gap-4">
                                        <Loader className="animate-spin text-primary" size={50} />
                                        <span className="text-gray-500 font-bold animate-pulse">
                                            {isAnalyzing ? (d.analyzingText || "جاري تحليل النص وكشف الأخطاء...") : (d.translating || "جاري الترجمة...")}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="w-full h-full text-xl md:text-3xl font-black text-primary dark:text-red-400 overflow-y-auto leading-normal whitespace-pre-wrap" dir="auto">
                                        {translatorResult || <span className="text-gray-200 dark:text-gray-800 italic font-black">{d.resultPlaceholder || 'النتيجة ستظهر هنا...'}</span>}
                                    </div>
                                )}

                                <AnimatePresence>
                                    {translatorResult && !translatorLoading && !isAnalyzing && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-3 md:gap-4 justify-end mt-4 md:mt-6 pt-4 md:pt-6 border-t border-stone-100 dark:border-gray-800"
                                        >
                                            <button onClick={handleSaveTranslatorCard} className="flex-1 lg:flex-none py-3 px-4 md:py-4 md:px-6 rounded-xl md:rounded-2xl bg-green-500/10 text-green-600 font-black text-sm md:text-base flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all"><Plus size={18} className="md:w-5 md:h-5" /> {d.saveAction || 'حفظ'}</button>
                                            <button onClick={() => navigator.clipboard.writeText(translatorResult)} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"><Copy size={18} className="md:w-5 md:h-5" /></button>
                                            <button onClick={() => speakText(translatorResult, detectLang(translatorResult) === 'ar' ? 'ar' : targetLanguage)} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"><Volume2 size={18} className="md:w-5 md:h-5" /></button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* --- NEW: VISUAL ANALYSIS RESULT --- */}
                        <AnimatePresence>
                            {analysisResult && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-stone-100 dark:border-gray-800 bg-gradient-to-b from-blue-50/30 to-white dark:from-blue-900/10 dark:to-dark-card overflow-hidden"
                                >
                                    <div className="p-10">
                                        {/* Header */}
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className={`p-4 rounded-2xl ${analysisResult.isCorrect ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {analysisResult.isCorrect ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                                    {analysisResult.mode === 'translation'
                                                        ? formatDictText(d.targetTranslationTitle || 'ترجمة ذكية إلى {language}', { language: targetLabel })
                                                        : analysisResult.isCorrect ? (d.excellentWriting || "أحسنت! كتابة ممتازة") : (d.suggestionsFound || "تم اكتشاف بعض الاقتراحات")}
                                                </h3>
                                                <p className="text-gray-500 font-bold">
                                                    {analysisResult.mode === 'translation'
                                                        ? formatDictText(d.arabicInputNote || 'النص المدخل عربي، لذلك نعرض ترجمة وملاحظات ترجمة بدل تصحيح العربية كلغة {language}.', { language: targetLabel })
                                                        : <>{d.textLevel || 'مستوى هذا النص:'} <span className="text-primary">{analysisResult.cefrLevel}</span></>}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left: Correction */}
                                            <div className="bg-white dark:bg-black/20 border border-stone-200 dark:border-gray-700 rounded-3xl p-8 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                                                    {analysisResult.mode === 'translation' ? (d.suggestedTranslation || 'الترجمة المقترحة') : (d.suggestedCorrection || 'التصحيح المقترح')}
                                                </div>
                                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 leading-relaxed mb-4" dir="ltr">
                                                    {analysisResult.correctedText}
                                                </p>
                                                {analysisResult.mistakes.length > 0 && (
                                                    <div className="space-y-3 mt-6">
                                                        {analysisResult.mistakes.map((mistake, i) => (
                                                            <div key={i} className="flex items-start gap-3 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                                                <X size={16} className="text-red-500 mt-1 shrink-0" />
                                                                <div>
                                                                    <div className="font-bold text-red-600 dark:text-red-400 line-through decoration-2 opacity-70" dir="auto">{mistake.original}</div>
                                                                    <div className="font-bold text-green-600 dark:text-green-400 mt-1" dir="auto">{mistake.correction}</div>
                                                                    <div className="text-gray-500 mt-1 text-xs">{mistake.reason}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Explanation & Feedback */}
                                            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-8">
                                                <h4 className="flex items-center gap-2 font-black text-indigo-900 dark:text-indigo-300 mb-4">
                                                    <MessageCircle size={20} />
                                                    {d.smartTeacherAnalysis || 'تحليل المعلم الذكي'}
                                                </h4>
                                                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-medium">
                                                    {analysisResult.explanation}
                                                </p>

                                                {analysisResult.improvements.length > 0 && (
                                                    <div>
                                                        <h5 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">
                                                            {analysisResult.mode === 'translation' ? (d.translationNotes || 'ملاحظات على الترجمة') : (d.proTips || 'نصائح احترافية')}
                                                        </h5>
                                                        <ul className="space-y-2">
                                                            {analysisResult.improvements.map((tip, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm font-bold">
                                                                    <span className="text-indigo-500">•</span> {tip}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-10 bg-white dark:bg-dark-card border-t border-stone-50 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleTranslate}
                                disabled={translatorLoading || isAnalyzing || !translatorText}
                                className="flex-1 px-8 py-6 bg-white dark:bg-gray-800 border-2 border-stone-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-[2rem] font-black text-xl shadow-lg hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                <Languages size={24} /> {d.translationOnly || 'ترجمة فقط'}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSmartAnalysis}
                                disabled={translatorLoading || isAnalyzing || !translatorText}
                                className="flex-[1.5] px-8 py-6 bg-gradient-to-r from-primary to-orange-500 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-4 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                                <Sparkles size={24} className="animate-pulse" /> {d.smartCorrection || 'تحليل وتصحيح ذكي AI'}
                            </motion.button>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-gray-400 font-bold flex items-center justify-center gap-2 opacity-50">
                        <Sparkles size={16} /> {d.poweredBy || 'مدعوم بتقنيات Gemini Pro للتعليم'}
                    </div>
                </motion.div>
            )}

            {/* SAVE MODAL — portal خارج شجرة motion/transform حتى يعمل النقر على الأزرار */}
            {saveModalOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[520] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => {
                            if (!saveSubmitting) setSaveModalOpen(false);
                        }}
                        role="presentation"
                    >
                        <div
                            className="bg-white dark:bg-dark-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 dark:border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="dictionary-save-card-title"
                        >
                        <div className="flex justify-between items-center mb-6">
                            <h3 id="dictionary-save-card-title" className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Check size={24} className="text-green-500" /> حفظ كبطاقة</h3>
                            <button type="button" onClick={() => !saveSubmitting && setSaveModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"><X className="text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 px-1">اختر المجلد</label>
                                <div className="relative">
                                    <select
                                        value={selectedFolderId}
                                        onChange={(e) => setSelectedFolderId(e.target.value)}
                                        className="w-full bg-stone-50 dark:bg-gray-800 p-4 rounded-2xl outline-none dark:text-white border border-stone-200 dark:border-transparent focus:border-primary font-bold text-base transition shadow-inner appearance-none cursor-pointer"
                                    >
                                        {saveFolders.length === 0 && <option value="" disabled>لا توجد مجلدات شخصية متاحة للحفظ</option>}
                                        {saveFolders.map(f => {
                                            const mine = user?.id && f.userId && String(f.userId) === String(user.id);
                                            const suffix = f.isSystem ? ' — مسئول' : mine ? ' — مجلدي' : (!f.userId && !f.isSystem) ? ' — عام' : '';
                                            return (
                                                <option key={f.id} value={f.id}>{f.name}{suffix}</option>
                                            );
                                        })}
                                    </select>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><Folder size={20} /></div>
                                </div>
                                {saveFolders.length === 0 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 px-1">
                                        أنشئ مجلداً شخصياً من تبويب البطاقات أولاً، ثم جرّب الحفظ مرة أخرى.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 px-1">الوجه الأمامي</label>
                                <input type="text" value={wordToSave.front} onChange={e => setWordToSave({ ...wordToSave, front: e.target.value })} className="w-full bg-stone-50 dark:bg-gray-800 p-4 rounded-2xl outline-none dark:text-white border border-stone-200 dark:border-transparent focus:border-primary font-bold text-lg transition shadow-inner" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 px-1">الوجه الخلفي</label>
                                <textarea value={wordToSave.back} onChange={e => setWordToSave({ ...wordToSave, back: e.target.value })} className="w-full bg-stone-50 dark:bg-gray-800 p-4 rounded-2xl outline-none dark:text-white border border-stone-200 dark:border-transparent focus:border-primary font-bold text-lg transition h-40 resize-none shadow-inner leading-relaxed" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center justify-center gap-3 p-4 bg-stone-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-gray-700 transition border border-stone-200 dark:border-transparent group h-16">
                                    <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-primary"><ImageIcon size={18} /></div>
                                    <span className="font-bold text-gray-600 dark:text-gray-300 text-sm">رفع صورة</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>

                                <button
                                    onClick={handleGenerateImageClick}
                                    disabled={isGeneratingImage || !wordToSave.front}
                                    className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale h-16 relative overflow-hidden"
                                >
                                    {isGeneratingImage ? (
                                        <Loader size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles size={18} className="animate-pulse" />
                                            <span className="font-bold text-sm">تخيل بالذكاء الاصطناعي</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Image Preview Area - Enhanced */}
                            <AnimatePresence>
                                {wordToSave.image && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg group mt-4"
                                    >
                                        <img src={wordToSave.image} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" alt="" aria-hidden="true" />
                                        <img src={wordToSave.image} className="relative z-[1] w-full h-full object-contain p-3" alt="preview" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-4">
                                            <button onClick={(e) => { e.preventDefault(); setWordToSave({ ...wordToSave, image: '' }); }} className="text-white text-sm font-bold bg-red-500/80 hover:bg-red-500 px-6 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105">
                                                <Trash2 size={16} /> إزالة الصورة
                                            </button>
                                        </div>
                                        {/* Badge if it's an AI Image (Pollinations URL check) */}
                                        {wordToSave.image.includes('pollinations') && (
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                                                <Sparkles size={10} className="text-purple-400" /> AI Generated
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void confirmSaveCard();
                            }}
                            disabled={!selectedFolderId || saveFolders.length === 0 || saveSubmitting}
                            className="w-full mt-8 bg-green-600 hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition shadow-xl shadow-green-600/30 text-lg flex items-center justify-center gap-2 transform active:scale-95"
                        >
                            {saveSubmitting ? <Loader className="animate-spin" size={22} /> : <Plus size={22} />}
                            {saveSubmitting ? 'جاري الحفظ…' : 'إضافة لمجموعتي'}
                        </button>
                        </div>
                    </div>,
                    document.body
                )}

            {/* STYLE SELECTION MODAL */}
            {showStyleModal &&
                typeof document !== 'undefined' &&
                createPortal(
                <div className="fixed inset-0 z-[530] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowStyleModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-stone-100 dark:border-gray-800"
                    >
                        <div className="p-8 pb-4">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <Palette className="text-purple-500" /> اختر أسلوب الرسم
                                    </h3>
                                    <p className="text-gray-500 text-sm font-bold mt-1">كيف تتخيل شكل الصورة؟</p>
                                </div>
                                <button onClick={() => setShowStyleModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"><X size={20} /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: '3d-cute', label: 'ثلاثي الأبعاد (مميز)', icon: '🧊', desc: 'أيقونات مجسمة لطيفة' },
                                    { id: 'cartoon', label: 'كرتون', icon: '🎨', desc: 'رسوم متحركة مبهجة' },
                                    { id: 'realistic', label: 'واقعي', icon: '📸', desc: 'صور كأنها حقيقية' },
                                    { id: 'anime', label: 'أنمي', icon: '✨', desc: 'ستايل ياباني' },
                                    { id: 'watercolor', label: 'ألوان مائية', icon: '🖌️', desc: 'فني وناعم' },
                                ].map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => triggerImageGeneration(style.id)}
                                        className="relative group p-4 rounded-2xl border-2 border-stone-100 dark:border-gray-800 hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-right flex flex-col gap-2 overflow-hidden"
                                    >
                                        <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">{style.icon}</div>
                                        <div className="font-black text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">{style.label}</div>
                                        <div className="text-[10px] text-gray-400 font-bold">{style.desc}</div>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-stone-50 dark:bg-gray-800/50 text-center text-xs font-bold text-gray-400">
                            سيتم إنشاء وصف ذكي للمشهد قبل الرسم 🧠✨
                        </div>
                    </motion.div>
                </div>,
                document.body
                )}
        </div>
    );
};
