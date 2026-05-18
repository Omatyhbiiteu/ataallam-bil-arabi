import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { AddCardResult, Story, Question, QuestionType, Folder, Card } from '../types';
import { ArrowRight, BookOpen, PauseCircle, PlayCircle, Square, Gauge, Type, Languages, ChevronUp, ChevronDown, ChevronRight, Settings2, Trophy, AlertCircle, CheckCircle, Brain, RotateCcw, X, Frown, PartyPopper, Plus, Volume2, Sparkles, Search, Filter, Headphones, Lock } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import confetti from 'canvas-confetti';
import { LevelSelector } from './learning-path/LevelSelector';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StoriesAPI, UserAPI } from '../services/apiClient';
import { canUserManageFolder } from '../utils/folderPermissions';

interface StoriesViewProps {
    stories: Story[];
    t: any;
    onQuizComplete?: (score: number, storyId: string) => void;
    /** قصص بلا اختبار: بعد انتهاء القراءة */
    onStoryReadComplete?: (storyId: string) => void;
    completedStoryIds?: string[];
    onAddCard?: (card: Partial<Card>) => void | Promise<AddCardResult | void>;
    folders?: Folder[];
    lang?: 'en' | 'de';
    user?: { id: string } | null;
    /** اشتراك مدفوع — يفتح جميع القصص */
    isProSubscriber?: boolean;
    /** عند محاولة فتح قصة مقفولة للمجاني */
    onRequirePro?: (message: string) => void;
}

type TextDirection = 'auto' | 'rtl' | 'ltr';

const RTL_TEXT_RE = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

const resolveTextDirection = (configured: TextDirection | undefined, text = ''): 'rtl' | 'ltr' => {
    if (configured === 'rtl' || configured === 'ltr') return configured;
    return RTL_TEXT_RE.test(text) ? 'rtl' : 'ltr';
};

const directionTextClass = (direction: 'rtl' | 'ltr') => (
    direction === 'rtl' ? 'text-right' : 'text-left'
);

const applySpeechLanguage = (utterance: SpeechSynthesisUtterance, speechLang: 'en' | 'de') => {
    const fallbackLang = speechLang === 'de' ? 'de-DE' : 'en-US';
    utterance.lang = fallbackLang;

    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const prefix = speechLang === 'de' ? 'de' : 'en';
    const availableVoices = window.speechSynthesis.getVoices();
    const preferredVoice =
        availableVoices.find(voice => voice.lang.toLowerCase().startsWith(prefix) && /google|microsoft|natural|online/i.test(voice.name)) ||
        availableVoices.find(voice => voice.lang.toLowerCase().startsWith(prefix));

    if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
    }
};

const SmartStoryImage: React.FC<{
    src: string;
    alt?: string;
    layoutId?: string;
    className?: string;
    containClassName?: string;
}> = ({ src, alt = '', layoutId, className = '', containClassName = 'p-3' }) => {
    const [fit, setFit] = useState<'cover' | 'contain'>('cover');

    const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        if (!img.naturalWidth || !img.naturalHeight) return;
        const ratio = img.naturalWidth / img.naturalHeight;
        setFit(ratio >= 1.25 ? 'cover' : 'contain');
    };

    return (
        <>
            <img
                src={src}
                alt=""
                aria-hidden="true"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-45"
            />
            <m.img
                layoutId={layoutId}
                src={src}
                alt={alt}
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                onLoad={handleLoad}
                className={`relative z-[1] w-full h-full ${fit === 'cover' ? 'object-cover' : `object-contain ${containClassName}`} ${className}`}
            />
        </>
    );
};

const playFeedbackSound = (type: 'success' | 'error') => {
    if (typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'success') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(); osc.stop(ctx.currentTime + 0.5);
        } else {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        }
    } catch (e) { console.error("Audio play failed", e); }
};

export const StoriesView: React.FC<StoriesViewProps> = ({ stories, t, onQuizComplete, onStoryReadComplete, completedStoryIds = [], onAddCard, folders, lang = 'en', user = null, isProSubscriber = false, onRequirePro }) => {
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [isSpeakingStory, setIsSpeakingStory] = useState(false);
    const [storyFontSize, setStoryFontSize] = useState(1.25);
    const [storyPlaybackRate, setStoryPlaybackRate] = useState(1.0);
    const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [loading, setLoading] = useState(false);

    const [isQuizMode, setIsQuizMode] = useState(false);
    // ── Quiz Queue State ──────────────────────────────────────────────────────
    const [quizQueue, setQuizQueue] = useState<number[]>([]); // ordered list of question indices
    const [queuePosition, setQueuePosition] = useState(0);   // current position in quizQueue
    const [wrongOriginalIndices, setWrongOriginalIndices] = useState<number[]>([]);
    const [isRetryRound, setIsRetryRound] = useState(false);
    const retryQueued = React.useRef(false);
    // ─────────────────────────────────────────────────────────────────────────
    const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
    const [quizResult, setQuizResult] = useState<{ score: number, correct: number, wrong: number, passed: boolean } | null>(null);
    const [quizState, setQuizState] = useState<'answering' | 'feedback_correct' | 'feedback_wrong'>('answering');
    const [currentSelectedAnswer, setCurrentSelectedAnswer] = useState<any>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const storyListRef = useRef<HTMLDivElement>(null);
    const [storyGridColumns, setStoryGridColumns] = useState(1);

    // Word selection for flashcards
    const [selectedWordMenu, setSelectedWordMenu] = useState<{ word: string, index: number, x: number, y: number } | null>(null);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [targetFolderId, setTargetFolderId] = useState<string>('');

    // Filtering and Focus Mode
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string>('A1');
    const [selectedSubLevel, setSelectedSubLevel] = useState<string>('A1.1');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
    const storiesText = t.stories;

    /** قصة واحدة مجانية لكل لغة: أول قصة في ترتيب المكتبة الحالي */
    const freeTierStory = useMemo(() => (stories.length > 0 ? { id: stories[0].id, title: stories[0].title } : null), [stories]);

    const isStoryUnlockedForUser = useCallback(
        (storyId: string) => {
            if (isProSubscriber) return true;
            return Boolean(freeTierStory && storyId === freeTierStory.id);
        },
        [isProSubscriber, freeTierStory]
    );

    useEffect(() => { return () => { cancelStorySpeech(); }; }, [selectedStory]);

    const writableFolders = useMemo(
        () => (folders || []).filter((f) => canUserManageFolder(f, user as any)),
        [folders, user]
    );

    useEffect(() => {
        if (writableFolders.length === 0) {
            setTargetFolderId('');
            return;
        }
        setTargetFolderId((prev) => (prev && writableFolders.some((f) => f.id === prev) ? prev : writableFolders[0].id));
    }, [writableFolders]);

    useEffect(() => {
        const updateColumns = () => {
            const width = storyListRef.current?.clientWidth || window.innerWidth;
            if (width >= 1280) setStoryGridColumns(3);
            else if (width >= 768) setStoryGridColumns(2);
            else setStoryGridColumns(1);
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const cancelStorySpeech = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); debounceTimerRef.current = null; }
        if (speechUtteranceRef.current) { speechUtteranceRef.current.onend = null; speechUtteranceRef.current = null; }
        setIsSpeakingStory(false); setHighlightedWordIndex(null);
    };

    const speakSingleWord = useCallback((word: string) => {
        const cleaned = (word || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) return;
        try {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleaned);
            applySpeechLanguage(utterance, lang);
            utterance.rate = Math.max(0.5, Math.min(2, storyPlaybackRate));
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        } catch {
            /* ignore */
        }
    }, [lang, storyPlaybackRate]);

    const getStoryWords = useMemo(() => {
        if (!selectedStory) return [];
        const raw = (selectedStory as any)?.content;
        const safeContent = typeof raw === 'string' ? raw : '';
        const text = safeContent.replace(/\n/g, ' \n ');
        const words = text.split(' ');
        let charCount = 0;
        return words.map((word, index) => {
            const startIndex = charCount; charCount += word.length + 1;
            return { word, startIndex, index, isNewline: word === '\n' };
        });
    }, [selectedStory]);

    const playStoryFromIndex = useCallback((startIndex: number, rateOverride?: number) => {
        if (!selectedStory) return;
        if (speechUtteranceRef.current) speechUtteranceRef.current.onend = null;
        window.speechSynthesis.cancel();
        const rateToUse = rateOverride !== undefined ? rateOverride : storyPlaybackRate;
        const textToSpeak = getStoryWords.slice(startIndex).map(w => w.word).join(' ');
        const startCharOffset = getStoryWords[startIndex]?.startIndex || 0;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        applySpeechLanguage(utterance, lang);
        utterance.rate = rateToUse;
        utterance.pitch = 1;
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const currentGlobalCharIndex = startCharOffset + event.charIndex;
                const foundWord = getStoryWords.find(w => w.startIndex <= currentGlobalCharIndex && (w.startIndex + w.word.length) >= currentGlobalCharIndex);
                if (foundWord) setHighlightedWordIndex(foundWord.index);
            }
        };
        utterance.onend = () => { setIsSpeakingStory(false); setHighlightedWordIndex(null); };
        utterance.onerror = () => { setIsSpeakingStory(false); setHighlightedWordIndex(null); };
        speechUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsSpeakingStory(true);
    }, [selectedStory, getStoryWords, storyPlaybackRate, lang]);

    const toggleStoryPlayPause = () => {
        if (isSpeakingStory) cancelStorySpeech();
        else playStoryFromIndex(highlightedWordIndex || 0);
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRate = parseFloat(e.target.value);
        setStoryPlaybackRate(newRate);
        if (isSpeakingStory) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => { playStoryFromIndex(highlightedWordIndex || 0, newRate); debounceTimerRef.current = null; }, 300);
        }
    };

    const handleSelectStory = (story: Story) => {
        if (!isStoryUnlockedForUser(story.id)) {
            onRequirePro?.(
                'الخطة المجانية تسمح بقراءة قصة واحدة فقط من المكتبة. اشترك في Pro لقراءة جميع القصص والمستويات.'
            );
            return;
        }
        setLoading(true);
        cancelStorySpeech();
        setIsFocusMode(false); // Reset focus mode on story change
        void (async () => {
            try {
                // If list payload doesn't include content, fetch full story from backend
                const hasContent = typeof (story as any)?.content === 'string' && (story as any).content.trim().length > 0;
                const full = hasContent ? story : ((await StoriesAPI.getById(lang, story.id)) as any)?.story as Story | undefined;
                setSelectedStory(full || story);
            } catch {
                setSelectedStory(story);
            } finally {
                setLoading(false);
                setIsSpeakingStory(false);
                setShowTranslation(false);
                setIsQuizMode(false);
                setQuizResult(null);
                setQuizQueue([]);
                setQueuePosition(0);
                setWrongOriginalIndices([]);
                setIsRetryRound(false);
                retryQueued.current = false;
                setQuizAnswers({});
                setQuizState('answering');
                setCurrentSelectedAnswer(null);
                setIsSettingsOpen(false);
                setHighlightedWordIndex(null);
            }
        })();
    };

    // Auto-scroll logic
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    // Optimized auto-scroll logic
    useEffect(() => {
        if (highlightedWordIndex !== null && wordRefs.current[highlightedWordIndex]) {
            const el = wordRefs.current[highlightedWordIndex];
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Define a "safe zone" for reading (e.g., between 150px from top and 200px from bottom)
            // Only scroll if the word is OUTSIDE this safe zone.
            // This allows the user to manually scroll freely as long as the active word remains somewhat visible.
            const isOutOfSafeZone = rect.top < 150 || rect.bottom > (viewportHeight - 200);

            if (isOutOfSafeZone) {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [highlightedWordIndex]);



    const readingProgress = useMemo(() => {
        if (!getStoryWords.length || highlightedWordIndex === null) return 0;
        return ((highlightedWordIndex + 1) / getStoryWords.length) * 100;
    }, [getStoryWords, highlightedWordIndex]);

    const filteredStories = useMemo(() => {
        return stories.filter(story => {
            const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                story.description.toLowerCase().includes(searchQuery.toLowerCase());

            // Strict Sub-Level Filtering Logic
            let matchesLevel = false;

            // 1. If story has a specific sub-level, it must match exactly
            if (story.subLevel) {
                matchesLevel = story.subLevel === selectedSubLevel;
            }
            // 2. If story has new level format (e.g. 'A1') but no sub-level, default to .1
            else if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(story.level)) {
                matchesLevel = selectedSubLevel === `${story.level}.1`;
            }
            // 3. Backward Compatibility for 'Beginner', 'Intermediate', 'Advanced'
            // Map them to the .1 sub-levels of their corresponding CEFR levels
            else {
                const isFirstSubLevel = selectedSubLevel.endsWith('.1');
                if (isFirstSubLevel) {
                    matchesLevel =
                        (story.level === 'Beginner' && (selectedLevel === 'A1' || selectedLevel === 'A2')) ||
                        (story.level === 'Intermediate' && (selectedLevel === 'B1' || selectedLevel === 'B2')) ||
                        (story.level === 'Advanced' && (selectedLevel === 'C1' || selectedLevel === 'C2'));
                } else {
                    // If selecting .2 (e.g. A1.2), legacy stories should NOT show up
                    matchesLevel = false;
                }
            }

            return matchesSearch && matchesLevel;
        });
    }, [stories, searchQuery, selectedLevel, selectedSubLevel]);

    const shouldVirtualize = filteredStories.length > 24;
    const rowCount = Math.ceil(filteredStories.length / storyGridColumns);
    const rowVirtualizer = useVirtualizer({
        count: shouldVirtualize ? rowCount : 0,
        getScrollElement: () => storyListRef.current,
        estimateSize: () => 320,
        overscan: 4
    });

    const handleWordClick = (word: string, index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const cleanedWord = word.replace(/[.,!?;:"'()[\]{}]/g, '').trim();
        let x = rect.left + rect.width / 2;
        if (typeof window !== 'undefined') {
            const menuWidth = onAddCard ? 220 : 160;
            const halfWidth = menuWidth / 2;
            const padding = 12;
            x = Math.min(window.innerWidth - padding - halfWidth, Math.max(padding + halfWidth, x));
        }
        setSelectedWordMenu({
            word: cleanedWord,
            index,
            x,
            y: rect.top
        });
    };

    const handleAddWordToCards = async () => {
        if (!selectedWordMenu || !onAddCard || !targetFolderId) return;
        setIsAddingCard(true);
        try {
            const word = selectedWordMenu.word;
            const ok = await Promise.resolve(
                onAddCard({
                    folderId: targetFolderId,
                    frontText: word,
                    backText: `${storiesText.wordMeaningPrefix} ${word}`,
                    status: 'new'
                })
            );
            if (ok === true) {
                setSelectedWordMenu(null);
            }
        } finally {
            setIsAddingCard(false);
        }
    };

    // ── Quiz Helper ───────────────────────────────────────────────────────────
    const evalStoryAnswer = (q: Question, userAnswer: any): boolean => {
        if (q.type === 'multiple-choice' || q.type === 'true-false') return userAnswer === q.correctAnswer;
        if (q.type === 'text-input') return String(userAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        if (q.type === 'checkbox') {
            const ca = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
            const ua = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
            return JSON.stringify(ca) === JSON.stringify(ua);
        }
        if (q.type === 'order') {
            const ca = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
            const ua = Array.isArray(userAnswer) ? userAnswer : [];
            return JSON.stringify(ca) === JSON.stringify(ua);
        }
        if (q.type === 'open') return !!userAnswer;
        return false;
    };

    // ── QUIZ LOGIC ────────────────────────────────────────────────────────────
    const startQuiz = () => {
        if (!selectedStory?.questions) return;
        cancelStorySpeech();
        const initialQueue = selectedStory.questions.map((_, i) => i);
        setIsQuizMode(true);
        setQuizQueue(initialQueue);
        setQueuePosition(0);
        setWrongOriginalIndices([]);
        setIsRetryRound(false);
        retryQueued.current = false;
        setQuizAnswers({});
        setQuizResult(null);
        setQuizState('answering');
        setCurrentSelectedAnswer(null);
    };

    // Derived: which question to show
    const currentQuestionIndex = quizQueue[queuePosition] ?? 0;

    const handleSelectAnswer = (value: any) => { if (quizState !== 'answering') return; setCurrentSelectedAnswer(value); };

    const checkAnswer = () => {
        if (!selectedStory?.questions || !currentSelectedAnswer) return;
        const q = selectedStory.questions[currentQuestionIndex];
        const isCorrect = evalStoryAnswer(q, currentSelectedAnswer);
        setQuizAnswers(prev => ({ ...prev, [q.id]: currentSelectedAnswer }));
        setQuizState(isCorrect ? 'feedback_correct' : 'feedback_wrong');
        const qid = q?.id;
        if (qid != null && selectedStory?.id) {
            UserAPI.recordStoryQuizAttempt({
                storyId: selectedStory.id,
                questionId: String(qid),
                correct: isCorrect,
                lang,
            }).catch(() => {});
        }
        playFeedbackSound(isCorrect ? 'success' : 'error');
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(isCorrect ? 50 : [50, 50, 50]);
        // Track wrong original questions for retry
        if (!isCorrect && !isRetryRound) {
            setWrongOriginalIndices(prev =>
                prev.includes(currentQuestionIndex) ? prev : [...prev, currentQuestionIndex]
            );
        }
    };

    const continueQuiz = () => {
        if (!selectedStory?.questions) return;
        const nextPos = queuePosition + 1;
        if (nextPos >= quizQueue.length) {
            // End of current queue
            if (!retryQueued.current && wrongOriginalIndices.length > 0) {
                // Append wrong questions for one retry round
                retryQueued.current = true;
                setIsRetryRound(true);
                setQuizQueue(prev => [...prev, ...wrongOriginalIndices]);
                setQueuePosition(nextPos);
                setQuizState('answering');
                setCurrentSelectedAnswer(null);
            } else {
                finishQuiz();
            }
        } else {
            setQueuePosition(nextPos);
            setQuizState('answering');
            setCurrentSelectedAnswer(null);
        }
    };

    const finishQuiz = () => {
        if (!selectedStory?.questions || !selectedStory.id) return;
        const originalQs = selectedStory.questions;
        let correct = 0;
        originalQs.forEach(q => {
            if (evalStoryAnswer(q, quizAnswers[q.id])) correct++;
        });
        const score = Math.round((correct / originalQs.length) * 100);
        const passed = score >= 60;
        const wrong = originalQs.length - correct;
        setQuizResult({ score, correct, wrong, passed });
        if (passed && onQuizComplete) onQuizComplete(score, selectedStory.id);
        if (passed) { playFeedbackSound('success'); confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); }
    };

    const QuizView = () => {
        if (!selectedStory?.questions) return null;

        // ── Result Screen ──────────────────────────────────────────────────────
        if (quizResult) {
            const passed = quizResult.passed;
            return (
                <div className="flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in text-center max-w-2xl mx-auto min-h-[60vh]">
                    {/* Icon */}
                    <div className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center mb-6 shadow-2xl ${
                        passed
                            ? 'bg-gradient-to-tr from-green-400 to-emerald-600'
                            : 'bg-gradient-to-tr from-red-400 to-rose-600'
                    }`}>
                        {passed
                            ? <Trophy size={56} className="text-white" />
                            : <Frown size={56} className="text-white" />}
                        {passed && (
                            <span className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full border-2 border-white dark:border-gray-900 shadow">ممتاز!</span>
                        )}
                    </div>

                    {/* Score */}
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white mb-2">
                        {passed ? '🎉 أحسنت!' : 'لم تجتز الاختبار'}
                    </h2>
                    <p className={`text-xl font-black mb-1 ${ passed ? 'text-green-500' : 'text-red-500'}`}>
                        {quizResult.score}%
                    </p>
                    <p className={`text-sm font-bold mb-6 ${ passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {passed ? 'اجتزت الاختبار بنجاح ✅' : 'مطلوب 60% على الأقل للاجتياز'}
                    </p>

                    {/* Score bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-1 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${ passed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                            style={{ width: `${quizResult.score}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 w-full mb-8">
                        <span>0%</span>
                        <span className="text-yellow-500">60% للاجتياز</span>
                        <span>100%</span>
                    </div>

                    {/* Correct / Wrong boxes */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mb-8">
                        <div className="bg-green-100 dark:bg-green-900/30 p-4 md:p-6 rounded-3xl border border-green-200 dark:border-green-900">
                            <span className="block text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-1">{quizResult.correct}</span>
                            <span className="text-xs md:text-sm font-bold text-green-700 dark:text-green-300">{storiesText.quiz.correct}</span>
                        </div>
                        <div className="bg-red-100 dark:bg-red-900/30 p-4 md:p-6 rounded-3xl border border-red-200 dark:border-red-900">
                            <span className="block text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400 mb-1">{quizResult.wrong}</span>
                            <span className="text-xs md:text-sm font-bold text-red-700 dark:text-red-300">{storiesText.quiz.wrong}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    {passed ? (
                        <div className="flex gap-3 md:gap-4 w-full flex-col sm:flex-row">
                            <button onClick={() => { setIsQuizMode(false); setQuizResult(null); }} className="w-full py-4 rounded-xl bg-gray-200 dark:bg-gray-700 font-bold text-gray-700 dark:text-white hover:bg-gray-300 transition">
                                {storiesText.quiz.backToStory}
                            </button>
                            <button onClick={startQuiz} className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                                <RotateCcw size={20} /> {storiesText.quiz.retryQuiz}
                            </button>
                        </div>
                    ) : (
                        /* FAIL: Only retry, no way to skip */
                        <div className="w-full space-y-3">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/20 text-sm text-red-700 dark:text-red-300 font-bold text-right">
                                ⚠️ يجب اجتياز الاختبار بنسبة 60% أو أعلى للانتهاء من القصة.
                            </div>
                            <button onClick={startQuiz} className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xl">
                                <RotateCcw size={20} /> إعادة الاختبار من البداية
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        const question = selectedStory.questions[currentQuestionIndex];
        const totalInQueue = quizQueue.length;
        const displayPos = queuePosition + 1;
        const progress = totalInQueue > 0 ? ((queuePosition) / totalInQueue) * 100 : 0;
        let containerClass = "bg-white dark:bg-gray-800 rounded-[2rem] p-4 md:p-8 shadow-warm dark:shadow-none border border-stone-100 dark:border-gray-700 transition-transform duration-300 w-full";
        if (quizState === 'feedback_wrong') containerClass += " animate-shake border-red-200 dark:border-red-900";

        return (
            <div className="flex flex-col min-h-[calc(100vh-64px)] w-full">
                <div className="flex-1 flex flex-col items-center justify-start p-2 md:p-8 w-full max-w-4xl mx-auto">
                    <div className="w-full max-w-2xl mb-4 md:mb-8">
                        {/* Retry round badge */}
                        {isRetryRound && (
                            <div className="flex justify-center mb-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black border border-orange-200 dark:border-orange-500/30">
                                    🔁 جولة إعادة الأسئلة الخاطئة
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-3 md:h-4 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full transition-[width] duration-700 ease-in-out rounded-full relative overflow-hidden ${
                                        isRetryRound
                                            ? 'bg-gradient-to-r from-orange-400 to-amber-400 shadow-[0_0_15px_rgba(251,146,60,0.6)]'
                                            : 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                                    }`}
                                    style={{ width: `${Math.max(progress, 5)}%` }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                            <span className="text-xs font-black text-gray-400 shrink-0">{displayPos}/{totalInQueue}</span>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center mb-8">
                        <div className={containerClass}>
                            {question.image && (
                                <div className="w-full flex justify-center mb-4 md:mb-6">
                                    <img src={question.image} alt="Question" className="max-h-40 md:max-h-64 object-contain rounded-xl shadow-sm" />
                                </div>
                            )}

                            <h3 className="text-xl md:text-3xl font-extrabold text-gray-800 dark:text-white mb-6 md:mb-8 leading-relaxed text-center" dir="rtl">
                                {question.text}
                            </h3>

                            <div className={`space-y-3 md:space-y-4 w-full ${quizState !== 'answering' ? 'pointer-events-none opacity-80' : ''}`} dir="rtl">
                                {question.type === 'multiple-choice' && (
                                    <div className={`grid ${question.options && question.options.some(o => o.length > 30) ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 md:gap-4`}>
                                        {question.options?.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectAnswer(opt)}
                                                className={`w-full p-4 md:p-6 rounded-2xl border-2 text-right font-bold text-base md:text-lg transition-all duration-200 flex items-center justify-between group
                                                ${currentSelectedAnswer === opt ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-[1.02]' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300'}`}
                                            >
                                                <span>{opt}</span>
                                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${currentSelectedAnswer === opt ? 'border-white bg-white' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                                    {currentSelectedAnswer === opt && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {question.type === 'true-false' && (
                                    <div className="grid grid-cols-2 gap-4 md:gap-8">
                                        <button onClick={() => handleSelectAnswer('true')} className={`py-6 md:py-8 rounded-2xl border-2 font-bold text-lg md:text-2xl transition-all duration-200 flex flex-col items-center justify-center gap-2 ${currentSelectedAnswer === 'true' ? 'border-green-600 bg-green-600 text-white shadow-lg scale-[1.02]' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-gray-50'}`}>
                                            <CheckCircle size={28} className="md:w-8 md:h-8" /> {storiesText.quiz.trueLabel}
                                        </button>
                                        <button onClick={() => handleSelectAnswer('false')} className={`py-6 md:py-8 rounded-2xl border-2 font-bold text-lg md:text-2xl transition-all duration-200 flex flex-col items-center justify-center gap-2 ${currentSelectedAnswer === 'false' ? 'border-red-600 bg-red-600 text-white shadow-lg scale-[1.02]' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-gray-50'}`}>
                                            <X size={28} className="md:w-8 md:h-8" /> {storiesText.quiz.falseLabel}
                                        </button>
                                    </div>
                                )}
                                {question.type === 'checkbox' && (
                                    <div className="space-y-3">
                                        {question.options?.map((opt, idx) => {
                                            const selected = (currentSelectedAnswer || []).includes(opt);
                                            return (
                                                <button key={idx} onClick={() => { const curr = currentSelectedAnswer || []; const newVal = curr.includes(opt) ? curr.filter((x: string) => x !== opt) : [...curr, opt]; handleSelectAnswer(newVal); }} className={`w-full p-4 rounded-xl border-2 text-right font-medium transition-all duration-200 flex items-center justify-between ${selected ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-gray-50'}`}>
                                                    <span>{opt}</span>
                                                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-white text-blue-600' : 'border-2 border-gray-300'}`}>{selected && <CheckCircle size={14} />}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {question.type === 'text-input' && (
                                    <div className="py-4">
                                        <input type="text" className="w-full p-4 md:p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-primary outline-none text-lg md:text-2xl text-center font-bold transition focus:shadow-md placeholder-gray-400 text-gray-900 dark:text-white" placeholder={storiesText.quiz.inputPlaceholder} value={currentSelectedAnswer || ''} onChange={(e) => handleSelectAnswer(e.target.value)} />
                                    </div>
                                )}
                                {question.type === 'order' && (
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="flex flex-wrap gap-2 min-h-[60px] md:min-h-[80px] p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center">
                                            {(currentSelectedAnswer || []).map((word: string, idx: number) => (
                                                <button key={idx} onClick={() => { const newAns = (currentSelectedAnswer || []).filter((_: any, i: number) => i !== idx); handleSelectAnswer(newAns); }} className="px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 font-bold text-sm md:text-base animate-fade-in hover:bg-red-50 hover:border-red-200 text-gray-800 dark:text-white transition">{word}</button>
                                            ))}
                                            {(currentSelectedAnswer || []).length === 0 && <span className="text-gray-400 text-xs md:text-sm">{storiesText.quiz.orderPlaceholder}</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                                            {question.options?.filter(opt => !(currentSelectedAnswer || []).includes(opt)).map((opt, idx) => (
                                                <button key={idx} onClick={() => handleSelectAnswer([...(currentSelectedAnswer || []), opt])} className="px-4 py-2 md:px-5 md:py-3 bg-white dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl font-bold border border-blue-100 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition shadow-sm hover:shadow-md text-base md:text-lg">{opt}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 z-40 w-full">
                    {(quizState === 'feedback_correct' || quizState === 'feedback_wrong') && (
                        <div className={`w-full p-4 md:p-6 animate-slide-up shadow-[0_-5px_30px_rgba(0,0,0,0.1)] ${quizState === 'feedback_correct' ? 'bg-green-100 dark:bg-green-900/95 text-green-900 dark:text-green-100 backdrop-blur-md' : 'bg-red-100 dark:bg-red-900/95 text-red-900 dark:text-red-100 backdrop-blur-md'} border-t-2 ${quizState === 'feedback_correct' ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'}`}>
                            <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                                    <div className={`p-2 rounded-full flex-shrink-0 ${quizState === 'feedback_correct' ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'}`}>
                                        {quizState === 'feedback_correct' ? <CheckCircle size={24} className="md:w-8 md:h-8" /> : <AlertCircle size={24} className="md:w-8 md:h-8" />}
                                    </div>
                                    <div>
                                        <h4 className="text-xl md:text-2xl font-bold mb-1">{quizState === 'feedback_correct' ? storiesText.quiz.correctFeedback : storiesText.quiz.wrongFeedback}</h4>
                                        {quizState === 'feedback_wrong' && (<p className="text-sm md:text-base opacity-90 font-medium">{storiesText.quiz.correctAnswer} <span className="font-bold">{String(question.correctAnswer)}</span></p>)}
                                    </div>
                                </div>
                                <button onClick={continueQuiz} className={`w-full md:w-auto px-8 py-3 md:px-10 md:py-4 rounded-2xl font-extrabold text-white text-base md:text-lg shadow-lg transition transform hover:scale-105 active:scale-95 ${quizState === 'feedback_correct' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
                                    {quizState === 'feedback_wrong' && !isRetryRound ? '🔁 متابعة (سيُعاد هذا السؤال)' : (queuePosition === quizQueue.length - 1 ? storiesText.quiz.finish : storiesText.quiz.next)}
                                </button>
                            </div>
                        </div>
                    )}
                    {quizState === 'answering' && (
                        <div className="p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                            <div className="max-w-3xl mx-auto">
                                <button onClick={checkAnswer} disabled={!currentSelectedAnswer || (Array.isArray(currentSelectedAnswer) && currentSelectedAnswer.length === 0)} className="w-full py-3 md:py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-lg md:text-xl shadow-lg transition transform active:scale-95 tracking-wide touch-manipulation">{storiesText.quiz.checkAnswer}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderStoryCard = (story: Story) => {
        const isCompleted = completedStoryIds.includes(story.id);
        const isLocked = !isStoryUnlockedForUser(story.id);
        return (
            <m.div
                key={story.id}
                whileHover={isLocked ? undefined : { y: -12, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                whileTap={isLocked ? undefined : { scale: 0.98 }}
                onClick={() => (isLocked ? onRequirePro?.('الخطة المجانية: قصة واحدة فقط. باقي القصص متاحة مع اشتراك Pro.') : handleSelectStory(story))}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isLocked) onRequirePro?.('الخطة المجانية: قصة واحدة فقط. باقي القصص متاحة مع اشتراك Pro.');
                        else handleSelectStory(story);
                    }
                }}
                role="button"
                tabIndex={isLocked ? -1 : 0}
                aria-label={isLocked ? `قصة مقفولة — ${story.title}` : `فتح قصة ${story.title}`}
                className={`group bg-white dark:bg-gray-800 rounded-[2rem] md:rounded-3xl overflow-hidden shadow-warm dark:shadow-none border border-stone-100 dark:border-gray-700 transition-shadow duration-300 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${isLocked ? 'cursor-not-allowed opacity-95' : 'cursor-pointer hover:shadow-2xl hover:shadow-primary/10'}`}
            >
                <div className="aspect-video overflow-hidden relative bg-slate-950">
                    <SmartStoryImage
                        layoutId={`story-img-${story.id}`}
                        src={story.image}
                        alt={story.title}
                        containClassName="p-2"
                        className="transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 md:p-6">
                        <div className="flex justify-between w-full items-center">
                            <span className="bg-white/20 backdrop-blur-md text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold border border-white/30">{story.level}</span>
                            <div className="flex gap-2">
                                {story.questions && story.questions.length > 0 && (
                                    <span className="bg-green-500/80 backdrop-blur-md text-white px-2 py-1 rounded-full text-[10px] font-bold border border-white/30 flex items-center gap-1">
                                        <Brain size={10} /> {storiesText.quizTag}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {isLocked && (
                        <div className="absolute inset-0 z-10 bg-slate-900/55 dark:bg-black/60 flex flex-col items-center justify-center gap-2 text-center px-3 pointer-events-none">
                            <Lock className="w-9 h-9 md:w-11 md:h-11 text-amber-200 drop-shadow-lg" strokeWidth={2.5} />
                            <span className="text-[11px] md:text-xs font-black text-white tracking-wide">Pro — قصة واحدة للمجاني</span>
                        </div>
                    )}
                    {isCompleted && (
                        <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-green-500 text-white p-1.5 md:p-2 rounded-full shadow-lg border-2 border-white dark:border-gray-800 animate-bounce-custom z-20">
                            <CheckCircle size={16} className="md:w-[20px] md:h-[20px]" />
                        </div>
                    )}
                </div>
                <div className="p-4 md:p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-lg md:text-xl font-bold text-gray-800 dark:text-white transition-colors ${isLocked ? '' : 'group-hover:text-primary'}`}>{story.title}</h3>
                        {isCompleted && <span className="text-[10px] font-bold text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">{storiesText.completed}</span>}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 md:line-clamp-3 leading-relaxed mb-4">{story.description}</p>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1"><BookOpen size={14} /> {storiesText.readingLabel}</span>
                        {story.wordCount && <span className="flex items-center gap-1">• {story.wordCount} {storiesText.wordCountLabel}</span>}
                    </div>
                </div>
            </m.div>
        );
    };

    if (selectedStory) {
        if (loading) return <div className="p-8"><Skeleton className="h-80 w-full rounded-3xl" /></div>;

        if (isQuizMode) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-stone-200 dark:border-gray-700 z-50 px-4 py-3 md:py-4 flex items-center justify-between shadow-sm">
                        <button onClick={() => { setIsQuizMode(false); setQuizResult(null); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"><X className="text-gray-400 hover:text-red-500" size={24} /></button>
                        <div className="text-sm font-bold text-gray-400">{currentQuestionIndex + 1} / {selectedStory.questions?.length}</div>
                    </div>
                    <QuizView />
                </div>
            );
        }

        const storyContentDirection = resolveTextDirection(selectedStory.contentDirection, selectedStory.content);
        const storyTranslationDirection = resolveTextDirection(selectedStory.translationDirection, selectedStory.translation || '');

        return (
            <div className="story-detail-page site-responsive-root min-h-screen bg-stone-50 dark:bg-gray-950 transition-colors duration-300">
                <div className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-stone-200 dark:border-gray-700 z-30 px-3 py-2.5 sm:px-4 lg:px-6 md:py-3 flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
                        <button onClick={() => { setSelectedStory(null); cancelStorySpeech(); }} className="shrink-0 p-2 rounded-full hover:bg-amber-50 dark:hover:bg-gray-800 transition ltr:rotate-180 rtl:rotate-0"><ArrowRight className="text-gray-600 dark:text-gray-300 w-5 h-5 md:w-6 md:h-6" /></button>
                        <h2 className="min-w-0 flex-1 font-bold text-gray-800 dark:text-white line-clamp-1 text-sm md:text-base">{selectedStory.title}</h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 md:gap-2">
                        <button
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className={`p-2 md:p-2.5 rounded-full border transition-all ${isFocusMode ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'} flex items-center gap-2 text-xs font-bold`}
                        >
                            <Sparkles size={16} /> <span className="hidden md:inline">{isFocusMode ? storiesText.focusModeOff : storiesText.focusModeOn}</span>
                        </button>

                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-1">
                            <button onClick={toggleStoryPlayPause} className="p-1.5 md:p-2 rounded-full hover:bg-white dark:hover:bg-gray-700 text-primary transition shadow-sm" title={isSpeakingStory ? storiesText.pause : storiesText.play}>
                                {isSpeakingStory ? <PauseCircle size={18} fill="currentColor" className="md:w-5 md:h-5" /> : <PlayCircle size={18} fill="currentColor" className="md:w-5 md:h-5" />}
                            </button>
                            <button onClick={cancelStorySpeech} className={`p-1.5 md:p-2 rounded-full transition ${isSpeakingStory ? 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500' : 'text-gray-300 dark:text-gray-600'}`} title={storiesText.stop}>
                                <Square size={14} fill="currentColor" className="md:w-4 md:h-4" />
                            </button>
                        </div>

                        <div className="relative">
                            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 md:p-2.5 rounded-full border transition ${isSettingsOpen ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>
                                {isSettingsOpen ? <X size={18} className="md:w-5 md:h-5" /> : <Settings2 size={18} className="md:w-5 md:h-5" />}
                            </button>
                            {isSettingsOpen && (
                                <m.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    className="absolute top-full left-0 mt-3 w-[min(18rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-gray-700 p-4 md:p-5 flex flex-col gap-4 md:gap-5 z-50 origin-top-left ring-1 ring-black/5"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"><Gauge size={16} className="text-primary" /> {storiesText.speed}</span>
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-black">{storyPlaybackRate}x</span>
                                        </div>
                                        <input
                                            type="range" min="0.5" max="2" step="0.1"
                                            value={storyPlaybackRate}
                                            onChange={handleSpeedChange}
                                            className="w-full h-2 bg-stone-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                                            <span>{storiesText.speedSlow}</span>
                                            <span>{storiesText.speedNormal}</span>
                                            <span>{storiesText.speedFast}</span>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-gray-700/50"></div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"><Type size={16} className="text-secondary" /> {storiesText.fontSize}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400 font-bold">A</span>
                                            <input
                                                type="range" min="1" max="2" step="0.1"
                                                value={storyFontSize}
                                                onChange={(e) => setStoryFontSize(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-stone-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-secondary hover:accent-secondary/80 transition-all"
                                            />
                                            <span className="text-lg text-gray-400 font-bold">A</span>
                                        </div>
                                    </div>

                                    {selectedStory.translation && (
                                        <>
                                            <div className="h-px bg-gray-100 dark:bg-gray-700/50"></div>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Languages size={16} className="text-green-500" /> {storiesText.showTranslation}</span>
                                                <button
                                                    onClick={() => setShowTranslation(!showTranslation)}
                                                    className={`w-12 h-7 rounded-full transition-colors relative shadow-inner ${showTranslation ? 'bg-green-500' : 'bg-stone-200 dark:bg-gray-600'}`}
                                                >
                                                    <m.div
                                                        layout
                                                        className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
                                                        animate={{ x: showTranslation ? 20 : 0 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </m.div>
                            )}
                        </div>
                    </div>
                </div>

                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`grid ${showTranslation ? 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-5 md:gap-8' : 'grid-cols-1'} mx-auto w-full transition-all duration-500 ${isFocusMode ? 'max-w-3xl px-4 sm:px-6 py-6 md:py-8' : 'max-w-[1180px] px-3 sm:px-5 lg:px-8 py-5 md:py-8'}`}
                >
                    <div className={`prose dark:prose-invert max-w-none ${directionTextClass(storyContentDirection)}`} dir={storyContentDirection}>
                        <m.div
                            className={`story-media-frame ${showTranslation ? 'story-media-frame-compact' : ''} group protected-media relative rounded-2xl md:rounded-[2rem] overflow-hidden mb-6 md:mb-8 shadow-[0_18px_45px_rgba(0,0,0,0.22)] border border-white/5 dark:border-gray-700/50 w-full bg-slate-950 transition-all duration-700 ease-out`}
                        >
                            <SmartStoryImage
                                layoutId={`story-img-${selectedStory.id}`}
                                src={selectedStory.image}
                                alt={selectedStory.title}
                                containClassName="p-3 md:p-5"
                                className="transition-transform duration-1000 group-hover:scale-[1.03]"
                            />

                            {!showTranslation && (
                                <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col items-end justify-end p-6 md:p-10 text-right" dir="rtl">
                                    <m.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.6 }}
                                        className="space-y-2 md:space-y-4 max-w-[min(460px,92%)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="inline-block bg-primary px-3 py-1 rounded-lg text-[10px] md:text-xs font-black tracking-widest uppercase text-white shadow-xl">
                                                {selectedStory.level}
                                            </span>
                                            <div className="h-px w-12 bg-white/30"></div>
                                        </div>
                                        <h1 className="story-hero-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                                            {selectedStory.title}
                                        </h1>
                                        <div className="flex items-center gap-3 pt-1">
                                            <button
                                                type="button"
                                                onClick={toggleStoryPlayPause}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs md:text-sm border transition-all shadow-lg active:scale-95 ${isSpeakingStory
                                                    ? 'bg-white text-gray-900 border-white/80 hover:bg-white/90'
                                                    : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                                                    }`}
                                                title={isSpeakingStory ? storiesText.pause : storiesText.play}
                                            >
                                                <Headphones size={18} />
                                                {isSpeakingStory ? 'إيقاف القراءة' : 'قراءة القصة'}
                                            </button>

                                            {isSpeakingStory && (
                                                <button
                                                    type="button"
                                                    onClick={cancelStorySpeech}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs md:text-sm border border-red-500/30 bg-red-500/15 text-white hover:bg-red-500/25 transition-all shadow-lg active:scale-95"
                                                    title={storiesText.stop}
                                                >
                                                    <Square size={16} />
                                                    إيقاف كامل
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-1 bg-primary rounded-full"></div>
                                            <span className="text-white/60 text-xs md:text-sm font-medium tracking-wide">{storiesText.premiumLabel}</span>
                                        </div>
                                    </m.div>
                                </div>
                            )}
                        </m.div>
                        <div style={{ '--story-font-size': `${storyFontSize}rem` } as React.CSSProperties} className="story-reading-text text-gray-800 dark:text-gray-200 pb-14 md:pb-20">
                            {getStoryWords.map((item, i) => (
                                <React.Fragment key={i}>
                                    <m.span
                                        ref={el => { wordRefs.current[i] = el }}
                                        onClick={(e) => handleWordClick(item.word, item.index, e)}
                                        animate={{
                                            backgroundColor: highlightedWordIndex === item.index ? 'rgba(253, 224, 71, 0.8)' : 'transparent',
                                            scale: highlightedWordIndex === item.index ? 1.1 : 1,
                                            color: highlightedWordIndex === item.index ? '#000' : 'inherit'
                                        }}
                                        className={`cursor-pointer transition-all duration-200 rounded px-1 py-0.5 inline-block ${highlightedWordIndex === item.index ? 'shadow-sm z-10' : 'hover:bg-amber-100 dark:hover:bg-blue-900/30'}`}
                                    >
                                        {item.word}
                                    </m.span>{' '}{item.isNewline && <br className="mb-4 md:mb-6 block" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence>
                        {showTranslation && selectedStory.translation && (
                            <m.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className={`prose dark:prose-invert max-w-none ${directionTextClass(storyTranslationDirection)} border-t pt-6 md:pt-8 xl:border-t-0 xl:border-l xl:pl-8 border-stone-200 dark:border-gray-700`}
                                dir={storyTranslationDirection}
                            >
                                <h3 className="text-lg md:text-xl font-bold mb-4 text-primary flex items-center gap-2"><Languages size={20} /> {storiesText.translationTitle}</h3>
                                <div style={{ '--story-font-size': `${storyFontSize}rem` } as React.CSSProperties} className="story-reading-text text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedStory.translation}</div>
                            </m.div>
                        )}
                    </AnimatePresence>

                    {selectedStory.questions && selectedStory.questions.length > 0 && (
                        <div className="col-span-1 lg:col-span-2 mt-8 md:mt-12 flex justify-center pb-8 border-t border-gray-100 dark:border-gray-800 pt-8">
                            <button
                                onClick={startQuiz}
                                className="w-full md:w-auto bg-primary hover:bg-red-700 text-white font-extrabold py-4 px-12 rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 transform hover:-translate-y-1"
                            >
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Brain size={28} />
                                </div>
                                <div className="text-right">
                                    <div className="text-xl">{storiesText.startQuiz}</div>
                                    <div className="text-xs text-white/80 font-medium">{selectedStory.questions.length} {storiesText.questionsCountLabel}</div>
                                </div>
                            </button>
                        </div>
                    )}

                    {(!selectedStory.questions || selectedStory.questions.length === 0) && (
                        <div className="col-span-1 lg:col-span-2 mt-8 md:mt-12 flex flex-col items-center justify-center gap-3 pb-8 border-t border-gray-100 dark:border-gray-800 pt-8">
                            {completedStoryIds.includes(selectedStory.id) ? (
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-lg">
                                    <CheckCircle size={28} />
                                    {storiesText.readCompleteDone}
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 text-center max-w-md">
                                        {storiesText.markReadCompleteHint}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            playFeedbackSound('success');
                                            onStoryReadComplete?.(selectedStory.id);
                                        }}
                                        disabled={!onStoryReadComplete}
                                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-4 px-10 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <CheckCircle size={26} />
                                        <span>{storiesText.markReadComplete}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </m.div>

                <AnimatePresence>
                    {selectedWordMenu && (
                        <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setSelectedWordMenu(null)} />
                            <m.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                style={{ left: selectedWordMenu.x, top: selectedWordMenu.y - 120, transform: 'translateX(-50%)' }}
                                className="fixed z-[70] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 flex flex-col gap-1 min-w-[160px] transform-gpu"
                            >
                                <button
                                    onClick={() => { speakSingleWord(selectedWordMenu.word); setSelectedWordMenu(null); }}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-sm font-bold text-gray-700 dark:text-gray-200"
                                >
                                    <Volume2 size={18} className="text-primary" /> {storiesText.wordMenuPlayFromHere}
                                </button>
                                <button
                                    onClick={() => { playStoryFromIndex(selectedWordMenu.index); setSelectedWordMenu(null); }}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-sm font-bold text-gray-700 dark:text-gray-200"
                                >
                                    <PlayCircle size={18} className="text-primary" /> {storiesText.play}
                                </button>
                                {onAddCard && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                                        <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{storiesText.wordMenuAddTitle}</div>
                                        <div className="flex flex-col gap-2 p-2">
                                            <select
                                                value={targetFolderId}
                                                onChange={(e) => setTargetFolderId(e.target.value)}
                                                aria-label={storiesText.wordMenuFolderLabel}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none dark:text-white"
                                            >
                                                {writableFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                            <button
                                                onClick={handleAddWordToCards}
                                                disabled={isAddingCard || !targetFolderId}
                                                className="w-full bg-primary text-white py-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                                            >
                                                <m.div animate={isAddingCard ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                                    {isAddingCard ? <RotateCcw size={14} /> : <Plus size={14} />}
                                                </m.div>
                                                {isAddingCard ? storiesText.wordMenuAdding : storiesText.wordMenuAddButton}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute left-1/2 -bottom-2 w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-gray-100 dark:border-gray-700 rotate-45 -translate-x-1/2" />
                            </m.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Professional Minimal Side Audio Control */}
                <AnimatePresence>
                    {isSpeakingStory && (
                        <m.div
                            initial={{ x: -60, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -60, opacity: 0 }}
                            className="fixed left-2 md:left-6 top-1/2 -translate-y-1/2 z-50"
                        >
                            <m.div
                                layout
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl border border-stone-200 dark:border-gray-700 rounded-full flex flex-col items-center overflow-hidden"
                            >
                                {/* Main Toggle / Status Icon */}
                                <button
                                    onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)}
                                    className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-primary relative z-10 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    {isAudioMenuOpen ? (
                                        <X size={20} className="md:w-6 md:h-6" />
                                    ) : (
                                        <div className="flex items-end gap-0.5 h-4">
                                            <div className="w-1 bg-primary rounded-full animate-[music-bar_1s_ease-in-out_infinite]" style={{ height: '60%' }}></div>
                                            <div className="w-1 bg-primary rounded-full animate-[music-bar_1s_ease-in-out_infinite_0.2s]" style={{ height: '100%' }}></div>
                                            <div className="w-1 bg-primary rounded-full animate-[music-bar_1s_ease-in-out_infinite_0.4s]" style={{ height: '40%' }}></div>
                                        </div>
                                    )}
                                </button>

                                {/* Expanded Controls */}
                                <AnimatePresence>
                                    {isAudioMenuOpen && (
                                        <m.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="flex flex-col gap-3 pb-4 items-center w-12 md:w-14"
                                        >
                                            <div className="w-8 h-px bg-gray-200 dark:bg-gray-700"></div>

                                            <button
                                                onClick={toggleStoryPlayPause}
                                                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition transform active:scale-90"
                                                title={`${storiesText.play} / ${storiesText.pause}`}
                                            >
                                                <PauseCircle size={20} fill="currentColor" />
                                            </button>

                                            <button
                                                onClick={cancelStorySpeech}
                                                className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition border border-red-200 dark:border-red-800"
                                                title={storiesText.stop}
                                            >
                                                <Square size={14} fill="currentColor" />
                                            </button>
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </m.div>
                        </m.div>
                    )}
                </AnimatePresence>

                {/* Fixed Progress Bar at Bottom */}
                <div className="fixed bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-800 z-50">
                    <m.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${readingProgress}%` }}
                        transition={{ type: 'spring', stiffness: 50 }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 animate-slide-up pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white">{storiesText.title}</h2>
                <div className="relative group w-full md:w-auto">
                    <input
                        type="text"
                        placeholder={storiesText.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label={storiesText.searchPlaceholder}
                        className="bg-white dark:bg-gray-800 border-2 border-stone-100 dark:border-gray-700 rounded-2xl px-5 py-2.5 pr-12 text-sm focus:border-primary outline-none transition-all w-full md:w-80 shadow-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                        <Search size={18} />
                    </div>
                </div>
            </header>

            {!isProSubscriber && freeTierStory && (
                <div
                    className="rounded-2xl md:rounded-3xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/40 px-4 py-4 md:px-6 md:py-5 text-amber-950 dark:text-amber-100 shadow-sm"
                    role="status"
                >
                    <p className="text-sm md:text-base font-bold leading-relaxed">
                        <span className="font-black">الخطة المجانية:</span> يمكنك قراءة{' '}
                        <strong className="font-black">قصة واحدة فقط</strong> — القصة المفتوحة مجاناً هي «
                        <strong className="font-black">{freeTierStory.title}</strong>
                        ». باقي القصص في المكتبة تتطلب اشتراك <strong className="font-black">Pro</strong>.
                    </p>
                </div>
            )}

            <div className="flex justify-center w-full pb-4">
                <LevelSelector
                    selectedLevel={selectedLevel}
                    selectedSubLevel={selectedSubLevel}
                    onSelectLevel={setSelectedLevel}
                    onSelectSubLevel={setSelectedSubLevel}
                    variant="stories"
                />
            </div>

            <AnimatePresence mode="wait">
                {filteredStories.length > 0 ? (
                    shouldVirtualize ? (
                        <div ref={storyListRef} className="max-h-[70vh] md:max-h-[72vh] overflow-y-auto custom-scrollbar pr-1">
                            <div
                                style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
                                role="list"
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const startIndex = virtualRow.index * storyGridColumns;
                                    const items = filteredStories.slice(startIndex, startIndex + storyGridColumns);
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            ref={rowVirtualizer.measureElement}
                                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                transform: `translateY(${virtualRow.start}px)`
                                            }}
                                        >
                                            {items.map(renderStoryCard)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <m.div
                            key={selectedLevel + searchQuery}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0 }}
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                            }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
                        >
                            {filteredStories.map(renderStoryCard)}
                        </m.div>
                    )
                ) : (
                    <EmptyState
                        title={storiesText.emptyTitle}
                        description={storiesText.emptyDescription}
                        icon={BookOpen}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};
