
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Zap, Mic, Headphones, MessageSquare, GraduationCap, Play, StopCircle, RefreshCcw, Calendar, CheckCircle2, Clock, MapPin, ListChecks, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/aiService';
import { speakText, stopSpeaking, classifyPracticeInputLang } from '../services/ttsService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface AIAssistantViewProps {
    t: any;
    targetLanguage?: 'en' | 'de';
    userImage?: string | null;
    userName?: string;
    studyPlan?: any;
    setStudyPlan?: (plan: any) => void;
    /** إن كان false تُطبَّق حدود المجانية (محادثة 10 جمل، وقف الصوتي/الخطة). الافتراضي true لعدم كسر أي استدعاء قديم. */
    isProSubscriber?: boolean;
    onRequirePro?: (message: string) => void;
}

type Mode = 'chat' | 'voice' | 'plan';

const FREE_CHAT_USER_MESSAGES = 10;

const MIC_PERMISSION_GUIDE_AR =
 'لم يُمنح إذن الميكروفون بعد. لاستخدام المعلم الصوتي، منح الأذونات كالتالي:\n\n' +
    '• Chrome / Edge: اضغط أيقونة القفل أو «i» بجانب شريط العنوان ← «إعدادات الموقع» أو «أذونات» ← فعّل «الميكروفون» على «السماح».\n' +
    '• إن ظهرت نافذة منبثقة من المتصفح، اختر «السماح» أو Allow.\n' +
    '• إذا سبق واخترت «منع»، افتح نفس القائمة وغيّر الميكروفون إلى «السماح»، أو من إعدادات المتصفح ← الخصوصية والأمان ← أذونات الموقع ← الميكروفون.\n\n' +
    'بعد السماح، اضغط زر الميكروفون مرة أخرى.';

async function queryMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    try {
        const perm = navigator.permissions as Permissions & {
            query: (desc: { name: 'microphone' }) => Promise<PermissionStatus>;
        };
        const status = await perm.query({ name: 'microphone' });
        return status.state as 'granted' | 'denied' | 'prompt';
    } catch {
        return 'unknown';
    }
}

function messageForGetUserMediaError(err: unknown): string {
    const name = err instanceof DOMException ? err.name : (err as { name?: string })?.name;
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return MIC_PERMISSION_GUIDE_AR;
    }
    if (name === 'NotFoundError') {
        return 'لم يُعثر على ميكروفون. وصّل ميكروفوناً أو تحقق من إعدادات الصوت في النظام.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
        return 'الميكروفون مشغول أو لا يمكن فتحه. أغلق التطبيقات التي تستخدم الميكروفون ثم حاول مرة أخرى.';
    }
    if (name === 'SecurityError') {
        return 'المتصفح يمنع الوصول للميكروفون في هذا العنوان. افتح الموقع عبر https:// أو http://localhost.';
    }
    return MIC_PERMISSION_GUIDE_AR;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
    t,
    targetLanguage = 'en',
    userImage,
    userName,
    studyPlan,
    setStudyPlan,
    isProSubscriber = true,
    onRequirePro,
}) => {
    // --- STATE ---
    const [mode, setMode] = useState<Mode>(() => (isProSubscriber ? 'voice' : 'chat'));
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        isCorrect: boolean;
        correctedText: string;
        explanation: string;
        improvements: string[];
        cefrLevel: string;
        mistakes: { original: string; correction: string; reason: string }[];
    } | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const listeningRef = useRef(false);
    const processVoiceTextRef = useRef<(text: string) => Promise<void>>(async () => {});

    // Level State
    const [selectedLevel, setSelectedLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1');

    // --- NEW: PLAN WIZARD STATE ---
    const [planStep, setPlanStep] = useState<number>(0);
    const [planData, setPlanData] = useState({
        daysPerWeek: '1-2 أيام (وقت ضيق جداً 🏃)',
        hoursPerWeek: '1-3 ساعات (نمط حياتي مزدحم ⏳)',
        primaryGoal: 'التواصل اليومي',
        biggestWeakness: 'الخوف من التحدث',
        learningStyle: 'تفاعلي 🎮',
        pace: 'متوازن ومستدام ⚖️'
    });
    const [generatedPlan, setGeneratedPlan] = useState<any>(studyPlan || null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    /** للمستخدم المجاني: لا نعرض صوتي/خطة حتى لا تختلف الواجهة عن منطق الإرسال. */
    const assistantMode = useMemo<Mode>(
        () => (!isProSubscriber && (mode === 'voice' || mode === 'plan') ? 'chat' : mode),
        [isProSubscriber, mode]
    );

    // Sync from global study plan if mode changes to plan
    useEffect(() => {
        if (mode === 'plan' && studyPlan && planStep === 0) {
            setGeneratedPlan(studyPlan);
            setPlanStep(6);
        }
    }, [mode, studyPlan, planStep]);

    // Check intent from Home
    useEffect(() => {
        const intent = localStorage.getItem('ai_assistant_intent');
        if (intent === 'plan') {
            localStorage.removeItem('ai_assistant_intent');
            if (!isProSubscriber) {
                onRequirePro?.('خطة المذاكرة الذكية متاحة لمشتركي برو فقط.');
                return;
            }
            setMode('plan');
        }
    }, [isProSubscriber, onRequirePro]);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const speechSupported = useMemo(
        () => typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
        []
    );

    const conversationLang = targetLanguage === 'de' ? 'de' : 'en';
    const conversationDir: 'ltr' | 'rtl' = 'ltr';
    const chatSuggestions = useMemo(() => (
        targetLanguage === 'de'
            ? [
                { t: 'Hallo! 👋', i: '👋' },
                { t: 'Wie geht es dir heute?', i: '🤔' },
                { t: 'Erzähl mir etwas über Technologie.', i: '💻' },
                { t: 'Ich möchte neue Wörter lernen.', i: '📚' }
            ]
            : [
                { t: 'Hello! 👋', i: '👋' },
                { t: 'How are you today?', i: '🤔' },
                { t: 'Tell me about technology.', i: '💻' },
                { t: 'I want to learn new words.', i: '📚' }
            ]
    ), [targetLanguage]);
    const inputPlaceholder = targetLanguage === 'de'
        ? 'اكتب بالألمانية هنا...'
        : 'اكتب بالإنجليزية هنا...';
    const pleaseSpeakOnlyTarget = useMemo(
        () =>
            targetLanguage === 'de'
                ? 'Bitte sprich nur Deutsch — wir üben zusammen auf Deutsch. 😊'
                : "Please speak in English only — we're practicing English together. 😊",
        [targetLanguage]
    );

    const userMessages = useMemo(() => messages.filter(m => m.sender === 'user'), [messages]);
    const freeChatBlocked = !isProSubscriber && assistantMode === 'chat' && userMessages.length >= FREE_CHAT_USER_MESSAGES;
    const transcriptText = useMemo(() => (
        messages.map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n')
    ), [messages]);
    const userText = useMemo(() => userMessages.map(m => m.text).join(' '), [userMessages]);
    const [sessionDurationMinutes, setSessionDurationMinutes] = useState(0);

    useEffect(() => {
        if (messages.length < 2) {
            setSessionDurationMinutes(0);
            return;
        }

        const updateTimer = () => {
            const first = messages[0].timestamp.getTime();
            const now = Date.now();
            setSessionDurationMinutes(Math.max(1, Math.round((now - first) / 60000)));
        };

        // Update immediately
        updateTimer();

        // Then update every 30 seconds
        const interval = setInterval(updateTimer, 30000);
        return () => clearInterval(interval);
    }, [messages]);
    const userWordCount = useMemo(() => {
        const trimmed = userText.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).length;
    }, [userText]);

    // --- RESET ON LANGUAGE CHANGE ---
    useEffect(() => {
        // When language changes, hard reset the AI state to match
        setMessages([]);
        setAnalysisResult(null);
        setAnalysisError(null);
        setIsTyping(false);
        // Process new welcome message
        const welcomeMsg: Message = {
            id: 'welcome_lang_switch',
            text: targetLanguage === 'en'
                ? "Switching to English! 🇺🇸 Ready for your lesson?"
                : "Wir wechseln zu Deutsch! 🇩🇪 Bereit für den Unterricht?",
            sender: 'ai',
            timestamp: new Date()
        };
        setMessages([welcomeMsg]);
    }, [targetLanguage]);

    // --- INITIAL WELCOME (On Mount Only) ---
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMsg: Message = {
                id: 'welcome',
                text: targetLanguage === 'en'
                    ? "Welcome to Et3alem Bel Araby AI! Choose a mode to start practicing."
                    : "Willkommen! Wähle einen Modus, um zu üben.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages([welcomeMsg]);
        }
    }, [mode]); // Removed targetLanguage from dependency to avoid double firing with the reset effect

    // --- SCROLL TO BOTTOM ---
    useEffect(() => {
        if (mode === 'chat' && chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping, transcript, mode]);

    // --- SPEECH RECOGNITION SETUP ---
    useEffect(() => {
        if (!speechSupported) {
            recognitionRef.current = null;
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        recognitionRef.current = rec;
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = targetLanguage === 'de' ? 'de-DE' : 'en-US';

        rec.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const finalTranscript = event.results[i][0].transcript;
                    void processVoiceTextRef.current(finalTranscript);
                } else {
                    interimTranscript += event.results[i][0].transcript;
                    setTranscript(interimTranscript);
                }
            }
        };

        rec.onerror = (event: any) => {
            console.error("Speech Rec Error", event.error);
            listeningRef.current = false;
            setIsListening(false);
            if (event.error === 'not-allowed') {
                setVoiceError(MIC_PERMISSION_GUIDE_AR);
            } else if (event.error === 'service-not-allowed') {
                setVoiceError('خدمة التعرف على الصوت غير متاحة في هذا السياق. استخدم Chrome أو Edge على localhost أو HTTPS.');
            } else if (event.error === 'network') {
                setVoiceError('خطأ شبكة أثناء التعرف على الصوت. تحقق من الاتصال.');
            } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setVoiceError(`تعذّر الاستماع (${event.error}). جرّب مرة أخرى.`);
            }
        };

        rec.onend = () => {
            if (listeningRef.current) {
                try {
                    rec.start();
                } catch {
                    listeningRef.current = false;
                    setIsListening(false);
                }
            }
        };

        return () => {
            listeningRef.current = false;
            try {
                rec.onresult = null;
                rec.onerror = null;
                rec.onend = null;
                rec.stop();
            } catch {
                /* ignore */
            }
            if (recognitionRef.current === rec) recognitionRef.current = null;
        };
    }, [targetLanguage, speechSupported]);

    useEffect(() => {
        listeningRef.current = isListening;
    }, [isListening]);

    const toggleListening = async () => {
        setVoiceError(null);
        if (!isProSubscriber) {
            onRequirePro?.('المعلم الصوتي متاح لمشتركي برو فقط.');
            return;
        }
        if (isListening) {
            listeningRef.current = false;
            recognitionRef.current?.stop?.();
            setIsListening(false);
            setTranscript('');
            return;
        }

        if (!speechSupported || !recognitionRef.current) {
            setVoiceError('المتصفح لا يدعم التعرف على الصوت من الميكروفون. جرّب Google Chrome أو Microsoft Edge.');
            return;
        }

        if (!window.isSecureContext) {
            setVoiceError('افتح الموقع عبر https:// أو http://localhost حتى يعمل الميكروفون.');
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setVoiceError(MIC_PERMISSION_GUIDE_AR);
            return;
        }

        const permState = await queryMicrophonePermission();
        if (permState === 'denied') {
            setVoiceError(MIC_PERMISSION_GUIDE_AR);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
            setVoiceError(messageForGetUserMediaError(err));
            return;
        }

        try {
            listeningRef.current = true;
            recognitionRef.current.start();
            setIsListening(true);
        } catch {
            listeningRef.current = false;
            setIsListening(false);
            setVoiceError('تعذّر بدء الاستماع. انتظر ثانية ثم اضغط زر الميكروفون مرة أخرى.');
        }
    };

    const handleVoiceInput = async (text: string) => {
        if (!text.trim()) return;

        // Use standard send logic
        await processMessage(text);
        setTranscript('');
    };

    processVoiceTextRef.current = handleVoiceInput;

    const processMessage = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        if (assistantMode === 'chat' && !isProSubscriber) {
            const userCount = messages.filter((m) => m.sender === 'user').length;
            if (userCount >= FREE_CHAT_USER_MESSAGES) {
                onRequirePro?.('استخدمت 10 جملاً في المحادثة الحرة لهذه الجلسة. للمتابعة بلا حدود، اشترك في برو.');
                return;
            }
        }

        // Optimistic UI Update
        setAnalysisResult(null);
        setAnalysisError(null);
        const userMsg: Message = { id: crypto.randomUUID(), text: trimmed, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        const inputLang = classifyPracticeInputLang(trimmed);
        const allowedPractice = targetLanguage === 'en' ? 'en' : 'de';
        const violatesPracticeLang =
            inputLang !== 'neutral' && inputLang !== allowedPractice;

        if (violatesPracticeLang) {
            const aiMsg: Message = {
                id: crypto.randomUUID(),
                text: pleaseSpeakOnlyTarget,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setIsTyping(false);
            if (assistantMode === 'voice') {
                speakText(pleaseSpeakOnlyTarget, targetLanguage as 'en' | 'de' | 'ar');
            }
            return;
        }

        setIsTyping(true);

        try {
            const response = await aiService.sendMessage(
                trimmed,
                targetLanguage as 'en' | 'de',
                messages.map(m => ({ text: m.text, sender: m.sender })),
                assistantMode === 'voice' ? 'tutor' : 'general',
                undefined,
                selectedLevel // Pass the selected level
            );

            const aiMsg: Message = { id: crypto.randomUUID(), text: response, sender: 'ai', timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);

            // Auto-Speak in Voice Mode
            if (assistantMode === 'voice') {
                speakText(response, targetLanguage as 'en' | 'de' | 'ar');
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAnalyzeSession = async () => {
        if (!userText.trim()) {
            setAnalysisError('لا يوجد نص لتحليله بعد.');
            return;
        }
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const result = await aiService.analyzeText(
                userText,
                targetLanguage as 'en' | 'de',
                selectedLevel
            );
            setAnalysisResult(result);
        } catch (error) {
            console.error(error);
            setAnalysisError('حدث خطأ أثناء تحليل الجلسة.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCopyTranscript = async () => {
        if (!transcriptText.trim()) return;
        try {
            await navigator.clipboard.writeText(transcriptText);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    };

    const handleClearSession = () => {
        listeningRef.current = false;
        recognitionRef.current?.stop?.();
        stopSpeaking();
        setMessages([]);
        setAnalysisResult(null);
        setAnalysisError(null);
        setVoiceError(null);
        setTranscript('');
        setInputText('');
        setIsTyping(false);
        setIsListening(false);
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;
        processMessage(inputText);
    };

    // --- RENDER HELPERS ---

    const renderPlanMode: () => React.JSX.Element = () => {
        const handleGeneratePlan = async () => {
            if (!isProSubscriber) {
                onRequirePro?.('خطة المذاكرة الذكية متاحة لمشتركي برو فقط.');
                return;
            }
            setIsGeneratingPlan(true);
            try {
                // Dynamic import not needed since we already imported aiService at the top
                const fullProfile = {
                    ...planData,
                    level: selectedLevel // Ensure we use the latest globally selected level within the wizard
                }
                const plan = await aiService.createStudyPlan(fullProfile, targetLanguage as 'en' | 'de');
                console.log("Generated Plan:", plan);
                setGeneratedPlan(plan);
                if (setStudyPlan) {
                    setStudyPlan(plan);
                }
                setPlanStep(6); // Show Result in Step 6
            } catch (e) {
                console.error(e);
            } finally {
                setIsGeneratingPlan(false);
            }
        };

        return (
            <div className="h-full flex flex-col max-w-2xl mx-auto">
                <AnimatePresence mode='wait'>
                    {planStep === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl text-center h-full flex flex-col justify-center items-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                            <div className="mb-8 relative">
                                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                    <Sparkles size={40} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2">أهلاً بك يا {userName || 'صديقي'}! 👋</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-bold">أنا مينا، مساعدك الذكي. دعنا نصمم خطة نجاحك معاً!</p>
                            </div>

                            <button
                                onClick={() => setPlanStep(1)}
                                className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                لنبدأ الرحلة <CheckCircle2 size={24} />
                            </button>
                        </motion.div>
                    )}

                    {planStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 shadow-xl h-full flex flex-col justify-center relative"
                        >
                            <button onClick={() => setPlanStep(0)} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
                                رجوع &rarr;
                            </button>
                            <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-6 md:mb-8 flex items-center gap-3">
                                <GraduationCap className="text-blue-500" size={28} /> ما هو مستواك الحالي تقريباً؟
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                                    <button
                                        key={lvl}
                                        onClick={() => {
                                            setSelectedLevel(lvl as any);
                                            setPlanStep(2);
                                        }}
                                        className={`p-4 md:p-6 rounded-2xl border-2 font-black transition-all text-xl md:text-2xl ${selectedLevel === lvl ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md scale-105' : 'border-stone-100 dark:border-gray-700 text-gray-500 hover:border-blue-300'}`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {planStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 shadow-xl h-full flex flex-col justify-center relative"
                        >
                            <button onClick={() => setPlanStep(1)} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
                                رجوع &rarr;
                            </button>
                            <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-6 md:mb-8 flex items-center gap-3">
                                <Calendar className="text-emerald-500" size={28} /> كم يوم متاح لك للمذاكرة في الأسبوع؟
                            </h3>
                            <div className="grid grid-cols-1 gap-3 md:gap-4">
                                {['1-2 أيام (وقت ضيق جداً 🏃)', '3-4 أيام (معتدل ومناسب 👍)', '5-6 أيام (شبه يومي 💪)', 'كل يوم (تفرغ تام 🔥)'].map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setPlanData({ ...planData, daysPerWeek: opt }); setPlanStep(3); }}
                                        className="p-4 md:p-6 rounded-2xl border-2 border-stone-100 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-right font-bold transition-all text-base md:text-lg text-gray-700 dark:text-gray-200"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {planStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 shadow-xl h-full flex flex-col justify-center relative"
                        >
                            <button onClick={() => setPlanStep(2)} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
                                رجوع &rarr;
                            </button>
                            <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-6 md:mb-8 flex items-center gap-3">
                                <Clock className="text-indigo-500" size={28} /> كم ساعة يمكنك الالتزام بها أسبوعياً؟
                            </h3>
                            <div className="grid grid-cols-1 gap-3 md:gap-4">
                                {['1-3 ساعات (نمط حياتي مزدحم ⏳)', '3-5 ساعات (التزام معتدل ☕)', '5-10 ساعات (جدية وتركيز 🚀)', 'أكثر من 10 ساعات (تفرغ وشغف 🔥)'].map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setPlanData({ ...planData, hoursPerWeek: opt }); setPlanStep(4); }}
                                        className="p-4 md:p-6 rounded-2xl border-2 border-stone-100 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-right font-bold transition-all text-base md:text-lg text-gray-700 dark:text-gray-200"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {planStep === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 shadow-xl h-full flex flex-col justify-center relative"
                        >
                            <button onClick={() => setPlanStep(3)} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
                                رجوع &rarr;
                            </button>
                            <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3">
                                <MapPin className="text-rose-500" size={32} /> ما هو هدفك الأساسي الملحّ في الوقت الحالي؟
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { label: 'اجتياز امتحان دولي وتحديد مستوى 🎓', id: 'اجتياز امتحان دولي' },
                                    { label: 'التحدث بطلاقة وتكوين علاقات عمل 💼', id: 'الطلاقة المهنية المتقدمة' },
                                    { label: 'السفر والهجرة والاندماج المجتمعي ✈️', id: 'السفر والهجرة' },
                                    { label: 'فهم الأساسيات والتواصل اليومي البسيط 🗣️', id: 'التواصل اليومي البسيط' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { setPlanData({ ...planData, primaryGoal: opt.label }); setPlanStep(5); }}
                                        className="p-4 md:p-6 rounded-2xl border-2 border-stone-100 dark:border-gray-700 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-right font-bold transition-all text-base md:text-lg text-gray-700 dark:text-gray-200"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {planStep === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 shadow-xl h-full flex flex-col justify-center relative"
                        >
                            <button onClick={() => setPlanStep(4)} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
                                رجوع &rarr;
                            </button>
                            <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                                <GraduationCap className="text-blue-500" size={32} /> ما هو أكبر عائق أو نقطة ضعف لديك حالياً؟
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {[
                                    'الخوف والتردد من التحدث 😰',
                                    'أفهم كل شيء ولكن لا أستطيع التعبير 🤐',
                                    'نسيان الكلمات والمصطلحات بسرعة 📉',
                                    'القواعد معقدة ولا أستطيع تركيب جمل صحيحة 🧩',
                                    'الاستماع للشخصيات الأصلية غير واضح 🎧',
                                    'أفتقر لأساسيات القراءة والنصوص المعقدة 📖'
                                ].map((weakness) => (
                                    <button
                                        key={weakness}
                                        onClick={() => {
                                            setPlanData({ ...planData, biggestWeakness: weakness });
                                            setPlanStep(6);
                                        }}
                                        className="p-4 md:p-5 rounded-2xl border-2 border-stone-100 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-right font-bold transition-all text-sm md:text-base text-gray-700 dark:text-gray-200 shadow-sm"
                                    >
                                        {weakness}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {planStep === 6 && !generatedPlan && (
                        <motion.div
                            key="step6"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-xl h-full flex flex-col pt-8 relative"
                        >
                            <button onClick={() => setPlanStep(4)} className="absolute top-6 left-6 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-sm font-bold flex items-center gap-1">
                                رجوع &rarr;
                            </button>
                            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-8 mt-4">لمسات أخيرة لتخصيص الخطة بشكل مثالي لك 🎯</h3>

                            <div className="space-y-8 flex-1">
                                {/* Learning Style */}
                                <div>
                                    <label className="text-sm font-black text-gray-600 dark:text-gray-400 mb-4 block flex items-center gap-2"><Headphones size={18} /> كيف تفضل تلقي المعلومات وتذكرها؟</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {['بصري (فيديوهات وصور) 👁️', 'سمعي (بودكاست واستماع) 👂', 'تفاعلي (ممارسة وتمارين) 🎮', 'تحليلي (قراءة وكتابة وقواعد) 📖'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setPlanData({ ...planData, learningStyle: s })}
                                                className={`py-4 px-4 rounded-xl text-sm font-bold border-2 transition-all ${planData.learningStyle === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-[1.02]' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pace */}
                                <div>
                                    <label className="text-sm font-black text-gray-600 dark:text-gray-400 mb-4 block flex items-center gap-2"><Zap size={18} /> كيف تفضل أن يكون إيقاع التدريب (Pace) لضمان عدم الاستسلام؟</label>
                                    <div className="flex gap-3">
                                        {['مكثف وسريع ⚡', 'متوازن ومستدام ⚖️', 'هادئ ومريح 🐢'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPlanData({ ...planData, pace: p })}
                                                className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all ${planData.pace === p ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20 scale-[1.02]' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/10'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGeneratePlan}
                                className="w-full mt-auto pt-5 pb-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02]"
                            >
                                {isGeneratingPlan ? <Loader2 className="animate-spin" /> : "صمم خطتي الاحترافية الآن بناءً على تحليل الذكاء ✨"}
                            </button>
                        </motion.div>
                    )}

                    {planStep === 6 && generatedPlan && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            dir="rtl"
                            className="bg-gray-50 dark:bg-[#0f0f13] rounded-[2.5rem] shadow-2xl h-full flex flex-col overflow-hidden border border-gray-100 dark:border-white/5"
                        >
                            {/* Header Banner - Ultra Premium */}
                            <div className="relative p-8 text-white shrink-0 overflow-hidden bg-gray-900">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-gray-900 opacity-90"></div>
                                <div className="absolute -top-32 -right-32 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-white/20 shadow-lg">
                                            <Sparkles size={14} className="text-yellow-400" />
                                            خطة الذكاء الاصطناعي المخصصة
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100">
                                            خارطة طريقك للنجاح 🚀
                                        </h2>
                                        <p className="text-indigo-200 text-sm mt-3 font-medium flex items-center gap-2">
                                            <User size={16} /> مصممة خصيصاً لـ: {userName || 'البطل'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl shrink-0 min-w-[100px]">
                                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500">{selectedLevel}</div>
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-100 mt-1">المستوى</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-8 md:px-8">
                                {/* Motivation Banner */}
                                <div className="mb-10 relative p-8 rounded-[2rem] bg-white dark:bg-[#1a1a20] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-gray-100 dark:border-white/5 overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-2 min-h-full bg-gradient-to-b from-orange-400 via-rose-500 to-purple-600"></div>
                                    <QuoteIcon className="absolute -top-4 -right-4 text-gray-50 dark:text-white/5 transform rotate-180" size={120} />
                                    <div className="relative z-10">
                                        <p className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 leading-relaxed text-right">
                                            {generatedPlan.motivation}
                                        </p>
                                    </div>
                                </div>

                                {/* Weekly Timeline Header */}
                                <div className="mb-6 flex items-center gap-3">
                                    <Calendar className="text-indigo-500" size={24} />
                                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">جدولك الأسبوعي</h3>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-6 relative ml-2 md:ml-4 border-l-[3px] border-indigo-100 dark:border-gray-800/80 pl-6 md:pl-10 pb-8">
                                    {generatedPlan.weeklySchedule?.map((item: any, idx: number) => (
                                        <div key={idx} className="relative group/timeline">
                                            {/* Glow Dot */}
                                            <div className="absolute -left-[32px] md:-left-[48px] top-5 w-5 h-5 rounded-full bg-white dark:bg-[#0f0f13] border-[5px] border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10 group-hover/timeline:scale-125 transition-transform"></div>

                                            <div className="bg-white dark:bg-[#1a1a20] rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100 dark:border-white/5">
                                                    <h4 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">{item.day}</h4>
                                                    <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl border border-indigo-100/50 dark:border-indigo-800/30 shadow-sm">
                                                        🎯 {item.focus}
                                                    </span>
                                                </div>

                                                <div className="space-y-4">
                                                    {item.tasks?.map((t: string, tIdx: number) => (
                                                        <div key={tIdx} className="flex gap-4 group/task items-start">
                                                            <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover/task:bg-emerald-500 group-hover/task:border-emerald-500 transition-all shadow-inner">
                                                                <CheckCircle2 size={12} className="text-gray-300 dark:text-gray-600 group-hover/task:text-white transition-colors" strokeWidth={3} />
                                                            </div>
                                                            <p className="text-base text-gray-700 dark:text-gray-300 font-bold leading-relaxed group-hover/task:text-gray-900 dark:group-hover/task:text-white transition-colors">
                                                                {t}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {item.tips && (
                                                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                                        <div className="flex gap-3 items-start">
                                                            <div className="bg-amber-100 dark:bg-amber-500/20 p-1.5 rounded-lg shrink-0 mt-0.5">
                                                                <Zap size={16} className="text-amber-600 dark:text-amber-400" />
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1">سر احترافي</span>
                                                                <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{item.tips}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Overall Strategy */}
                                {generatedPlan.overallTips?.length > 0 && (
                                    <div className="mt-8 relative overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-500/20">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-black opacity-95"></div>
                                        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay opacity-20 pointer-events-none"></div>

                                        <div className="relative z-10">
                                            <h3 className="text-2xl font-black mb-6 flex items-center justify-center gap-3">
                                                <GraduationCap className="text-yellow-400" size={32} /> نصائح ذهبية ومستدامة
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                                {generatedPlan.overallTips.map((tip: string, i: number) => (
                                                    <div key={i} className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-4 md:p-5 text-sm md:text-base font-bold border border-white/10 transition-colors shadow-lg flex gap-3 items-start">
                                                        <Sparkles className="text-indigo-300 shrink-0 mt-0.5" size={18} />
                                                        <span>{tip}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Projected Level */}
                                {generatedPlan.projectedLevel && (
                                    <div className="mt-8 relative overflow-hidden rounded-[2rem] p-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-2xl">
                                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-[1.5rem] shrink-0 border border-white/30">
                                                <TrendingUp size={40} className="text-emerald-100" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                                                    مستواك المتوقع بعد شهر 🚀
                                                </h3>
                                                <p className="text-emerald-50 text-base md:text-lg font-bold leading-relaxed shadow-sm">
                                                    {generatedPlan.projectedLevel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button onClick={() => {
                                    if (setStudyPlan) setStudyPlan(null);
                                    setGeneratedPlan(null);
                                    setPlanData({
                                        daysPerWeek: '1-2 أيام (وقت ضيق جداً 🏃)',
                                        hoursPerWeek: '1-3 ساعات (نمط حياتي مزدحم ⏳)',
                                        primaryGoal: 'التواصل اليومي',
                                        biggestWeakness: 'الخوف من التحدث',
                                        learningStyle: 'تفاعلي 🎮',
                                        pace: 'متوازن ومستدام ⚖️'
                                    });
                                    setPlanStep(0);
                                }} className="w-full mt-10 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2">
                                    <RefreshCcw size={16} /> إنشاء خطة بمقاييس جديدة
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Helper for Quote Icon (since it's not in Lucide regular import sometimes or to avoid errors)
    const QuoteIcon = ({ className, size }: { className?: string, size?: number }) => (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.01697 21L5.01697 18C5.01697 16.8954 5.9124 16 7.01697 16H10.017C10.5693 16 11.017 15.5523 11.017 15V9C11.017 8.44772 10.5693 8 10.017 8H6.01697C5.46468 8 5.01697 8.44772 5.01697 9V11C5.01697 11.5523 4.56925 12 4.01697 12H3.01697V5H13.017V15C13.017 18.3137 10.3307 21 7.01697 21H5.01697Z" />
        </svg>
    );

    const renderSessionPanel: () => React.JSX.Element = () => (
        <div className="bg-white/70 dark:bg-black/30 rounded-[2.5rem] border border-white/20 shadow-2xl p-5 md:p-6 h-auto xl:h-full max-h-[60vh] xl:max-h-none overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h4 className="text-lg font-black text-gray-800 dark:text-white">ملخص الجلسة</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">ملخص سريع + تحليل الأداء</p>
                </div>
                <button
                    type="button"
                    onClick={handleAnalyzeSession}
                    disabled={isAnalyzing || !userText.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {isAnalyzing ? 'جارٍ التحليل...' : 'تحليل الأداء'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-3 border border-stone-100 dark:border-white/10">
                    <p className="text-[10px] text-gray-400 font-bold">الرسائل</p>
                    <p className="text-lg font-black text-gray-800 dark:text-white">{messages.length}</p>
                </div>
                <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-3 border border-stone-100 dark:border-white/10">
                    <p className="text-[10px] text-gray-400 font-bold">كلماتك</p>
                    <p className="text-lg font-black text-gray-800 dark:text-white">{userWordCount}</p>
                </div>
                <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-3 border border-stone-100 dark:border-white/10">
                    <p className="text-[10px] text-gray-400 font-bold">المدة</p>
                    <p className="text-lg font-black text-gray-800 dark:text-white">{sessionDurationMinutes} د</p>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-black text-gray-700 dark:text-gray-200">Transcript</h5>
                    <button
                        type="button"
                        onClick={handleCopyTranscript}
                        className="text-[10px] font-black text-gray-500 hover:text-indigo-600 transition"
                    >
                        نسخ النص
                    </button>
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar bg-white/80 dark:bg-black/40 rounded-2xl p-4 border border-stone-100 dark:border-white/10 space-y-3">
                    {messages.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center">لا توجد رسائل بعد.</p>
                    ) : (
                        messages.slice(-12).map((msg) => (
                            <div key={msg.id} className="flex items-start gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase mt-1">
                                    {msg.sender === 'user' ? 'You' : 'AI'}
                                </span>
                                <span
                                    dir={conversationDir}
                                    lang={conversationLang}
                                    className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed text-left"
                                >
                                    {msg.text}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-6">
                <h5 className="text-sm font-black text-gray-700 dark:text-gray-200 mb-3">تحليل الأداء</h5>
                {analysisError && (
                    <div className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl mb-3">
                        {analysisError}
                    </div>
                )}
                {!analysisResult ? (
                    <div className="text-xs text-gray-400 bg-white/70 dark:bg-black/40 rounded-2xl p-4 border border-stone-100 dark:border-white/10">
                        اكتب بضع جمل ثم اضغط "تحليل الأداء" للحصول على تقرير تفصيلي.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-4 border border-stone-100 dark:border-white/10">
                            <p className="text-xs font-black text-gray-500 mb-1">تقدير المستوى</p>
                            <p className="text-lg font-black text-gray-800 dark:text-white">{analysisResult.cefrLevel || selectedLevel}</p>
                            <p className="text-xs text-gray-500 mt-2">{analysisResult.explanation}</p>
                        </div>
                        {(analysisResult.mistakes || []).length > 0 && (
                            <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-4 border border-stone-100 dark:border-white/10">
                                <p className="text-xs font-black text-gray-500 mb-3">الأخطاء الشائعة</p>
                                <div className="space-y-3">
                                    {(analysisResult.mistakes || []).slice(0, 6).map((mistake, idx) => (
                                        <div key={idx} className="text-xs text-gray-700 dark:text-gray-200">
                                            <div className="flex gap-2">
                                                <span className="font-black text-rose-500">قال:</span>
                                                <span dir={conversationDir} lang={conversationLang} className="text-left">{mistake.original}</span>
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <span className="font-black text-emerald-600">الصحيح:</span>
                                                <span dir={conversationDir} lang={conversationLang} className="text-left">{mistake.correction}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1">{mistake.reason}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(analysisResult.improvements || []).length > 0 && (
                            <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-4 border border-stone-100 dark:border-white/10">
                                <p className="text-xs font-black text-gray-500 mb-2">تحسينات مقترحة</p>
                                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                                    {(analysisResult.improvements || []).slice(0, 5).map((tip, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-indigo-500 font-black">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analysisResult.correctedText && (
                            <div className="bg-white/80 dark:bg-black/40 rounded-2xl p-4 border border-stone-100 dark:border-white/10">
                                <p className="text-xs font-black text-gray-500 mb-2">الصياغة المصححة</p>
                                <p dir={conversationDir} lang={conversationLang} className="text-sm text-gray-700 dark:text-gray-200 text-left">
                                    {analysisResult.correctedText}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    const [showMobileStats, setShowMobileStats] = useState(false);

    const renderChatMode: () => React.JSX.Element = () => (
        <div className="h-full min-h-0 relative">
            <div className="h-full min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 lg:gap-6">
                <div className="min-h-0 flex flex-col bg-white/60 dark:bg-black/30 rounded-[2rem] md:rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden backdrop-blur-md relative h-full">
                    {/* Chat Header */}
                    <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-50 blur-xl"></div>
                        <div className="flex items-center gap-3 md:gap-4 relative z-10">
                            <div className="relative group cursor-pointer">
                                <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3 transition-transform group-hover:rotate-6 group-hover:scale-110">
                                    <Sparkles size={20} className="text-white animate-pulse md:w-7 md:h-7" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-5 md:h-5 bg-emerald-500 border-[3px] border-white dark:border-gray-900 rounded-full animate-bounce"></div>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-lg md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300">
                                    اتعلم بالعربي <span className="hidden md:inline text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full align-middle ml-2 border border-indigo-200">PRO</span>
                                </h3>
                                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-indigo-500 dark:text-indigo-400 mt-0.5">
                                    <Zap size={10} className="fill-current" />
                                    <span>متاح للرد الفوري</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 relative z-10">
                            {/* Mobile Stats Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowMobileStats(true)}
                                className="xl:hidden p-2 md:p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition-all"
                            >
                                <ListChecks size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={handleClearSession}
                                className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-all shadow-sm hover:shadow-md group"
                                title="مسح المحادثة"
                            >
                                <RefreshCcw size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>

                    {/* Persistent Level Selector Bar */}
                    <div className="px-3 py-2 md:py-3 bg-white/50 dark:bg-black/20 border-b border-white/10 backdrop-blur-md z-10 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
                        <span className="text-[10px] md:text-xs font-bold text-gray-500 ml-1 md:ml-2 whitespace-nowrap shrink-0">المستوى:</span>
                        {([
                            { level: 'A1' as const, label: 'A1', desc: 'مبتدئ', color: 'from-emerald-400 to-green-500' },
                            { level: 'A2' as const, label: 'A2', desc: 'أساسي', color: 'from-teal-400 to-emerald-500' },
                            { level: 'B1' as const, label: 'B1', desc: 'متوسط', color: 'from-blue-400 to-indigo-500' },
                            { level: 'B2' as const, label: 'B2', desc: 'فوق المتوسط', color: 'from-violet-400 to-purple-500' },
                            { level: 'C1' as const, label: 'C1', desc: 'متقدم', color: 'from-orange-400 to-rose-500' },
                            { level: 'C2' as const, label: 'C2', desc: 'إتقان', color: 'from-rose-500 to-red-600' },
                        ] as const).map(({ level, label, desc, color }) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => setSelectedLevel(level)}
                                className={`relative flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-3 rounded-lg md:rounded-xl font-black transition-all shrink-0 ${selectedLevel === level
                                    ? `bg-gradient-to-br ${color} text-white shadow-md scale-105`
                                    : 'bg-white dark:bg-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700'
                                    }`}
                            >
                                <span className="text-sm md:text-base">{label}</span>
                                <span className={`text-[9px] md:text-[10px] ${selectedLevel === level ? 'text-white/90' : 'text-gray-400'}`}>{desc}</span>
                            </button>
                        ))}
                    </div>

                    {/* Chat Messages Area */}
                    <div
                        ref={chatContainerRef}
                        role="log"
                        aria-live="polite"
                        aria-relevant="additions"
                        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth relative"
                    >
                        {/* Subtle Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                        </div>

                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="h-full flex flex-col items-center justify-center text-center opacity-80 py-10"
                            >
                                <div className="relative mb-6 md:mb-8">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full"></div>
                                    <div className="relative w-20 h-20 md:w-28 md:h-28 bg-gradient-to-tr from-white to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/50 dark:border-white/10 transform rotate-[-5deg]">
                                        <MessageSquare size={36} className="text-indigo-500 dark:text-indigo-400 md:w-12 md:h-12" />
                                    </div>
                                    <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 w-8 h-8 md:w-12 md:h-12 bg-rose-100 dark:bg-rose-900/50 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 animate-bounce-slow">
                                        <span className="text-lg md:text-2xl">👋</span>
                                    </div>
                                </div>

                                <h4 className="text-2xl md:text-3xl font-black mb-2 md:mb-3 text-gray-800 dark:text-white tracking-tight">ابدأ المحادثة الآن</h4>
                                <p className="max-w-xs md:max-w-sm text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    تحدث في أي موضوع تريده.. سأقوم بصياغة ردودي لتناسب مستواك.
                                </p>

                                <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-8 max-w-lg mb-8">
                                    {chatSuggestions.map(suggestion => (
                                        <button
                                            type="button"
                                            key={suggestion.t}
                                            disabled={freeChatBlocked}
                                            onClick={() => processMessage(suggestion.t)}
                                            className="group px-4 py-2 md:px-5 md:py-3 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:border-indigo-500 hover:ring-4 hover:ring-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none disabled:hover:border-stone-200 dark:disabled:hover:border-slate-700"
                                        >
                                            <span className="opacity-50 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">{suggestion.i}</span>
                                            {suggestion.t}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex max-w-[90%] md:max-w-[75%] gap-2 md:gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white dark:border-slate-700 transform ${msg.sender === 'user'
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 rotate-3'
                                            : 'bg-gradient-to-br from-indigo-600 to-violet-600 -rotate-3'
                                            }`}>
                                            {msg.sender === 'user' ?
                                                (userImage ?
                                                    <img src={userImage} alt="User" className="w-full h-full rounded-2xl object-cover" />
                                                    : <User size={14} className="text-indigo-600 dark:text-indigo-400 md:w-[18px] md:h-[18px]" />
                                                )
                                                : <Bot size={16} className="text-white md:w-5 md:h-5" />
                                            }
                                        </div>

                                        {/* Bubble */}
                                        <div
                                            dir={conversationDir}
                                            lang={conversationLang}
                                            className={`relative p-3 md:p-5 shadow-sm transform transition-transform hover:scale-[1.01] ${msg.sender === 'user'
                                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl md:rounded-[2rem] rounded-tr-sm shadow-indigo-500/20'
                                                : 'bg-white dark:bg-slate-800/90 border border-stone-100 dark:border-slate-700/50 text-gray-800 dark:text-gray-100 rounded-2xl md:rounded-[2rem] rounded-tl-sm shadow-xl'
                                                }`}
                                        >
                                            <p className="leading-relaxed text-sm md:text-lg whitespace-pre-wrap font-medium">{msg.text}</p>
                                            <div className={`text-[9px] md:text-[10px] font-bold mt-2 opacity-60 flex items-center gap-1.5 ${msg.sender === 'user' ? 'justify-end text-indigo-100' : 'text-gray-400'}`}>
                                                <Clock size={10} />
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.sender === 'ai' && <Sparkles size={10} className="text-amber-400" />}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex justify-start w-full pl-10 md:pl-14"
                                >
                                    <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 px-4 md:px-5 py-3 md:py-4 rounded-2xl md:rounded-[2rem] rounded-tl-sm shadow-lg flex items-center gap-1.5 min-w-[80px] justify-center">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 md:p-5 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-t border-white/10 z-20">
                        {!isProSubscriber && (
                            <p className="text-center text-[11px] md:text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 md:mb-3 px-2">
                                {freeChatBlocked
                                    ? 'وصلت إلى حد المحادثة المجانية (10 جمل). اشترك في برو للمتابعة بلا حدود.'
                                    : `المحادثة الحرة: ${userMessages.length} / ${FREE_CHAT_USER_MESSAGES} جمل في هذه الجلسة`}
                            </p>
                        )}
                        <div className={`flex items-end gap-2 md:gap-3 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] p-2 md:p-3 shadow-xl shadow-stone-200/50 dark:shadow-none focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all duration-300 ${freeChatBlocked ? 'opacity-60' : ''}`}>
                            <textarea
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                dir={conversationDir}
                                lang={conversationLang}
                                placeholder={inputPlaceholder}
                                disabled={freeChatBlocked}
                                className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder:text-gray-400 font-medium resize-none py-2 md:py-3.5 max-h-32 custom-scrollbar text-base md:text-lg text-left disabled:cursor-not-allowed"
                                rows={1}
                                style={{ minHeight: '48px' }}
                            />

                            <button
                                type="button"
                                onClick={handleSendMessage}
                                disabled={freeChatBlocked || !inputText.trim() || isTyping}
                                aria-label="إرسال الرسالة"
                                className="p-2 md:p-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl md:rounded-2xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95 flex-shrink-0"
                            >
                                {isTyping ? <Loader2 size={20} className="animate-spin md:w-6 md:h-6" /> : <Send size={20} className="rtl:rotate-180 md:w-6 md:h-6" />}
                            </button>
                        </div>
                        <div className="text-center mt-2 md:mt-3 flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                            <Sparkles size={10} className="text-indigo-500" />
                            <p className="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-wide">
                                Powered by Et3alem Bel Araby AI v2.0
                            </p>
                        </div>
                    </div>
                </div>

                {/* Session Panel - Desktop (Always visible) */}
                <div className="hidden xl:block min-h-0 h-full overflow-hidden">
                    {renderSessionPanel()}
                </div>

                {/* Session Panel - Mobile (Overlay) */}
                <AnimatePresence>
                    {showMobileStats && (
                        <div className="xl:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowMobileStats(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="bg-white dark:bg-[#1a1b1e] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 max-h-[85vh] flex flex-col"
                            >
                                <div className="p-2 flex justify-center">
                                    <div className="w-16 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                                </div>
                                <div className="p-1 h-full overflow-y-auto">
                                    {renderSessionPanel()}
                                </div>
                                <button
                                    onClick={() => setShowMobileStats(false)}
                                    className="m-4 mt-0 p-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white font-bold rounded-2xl hover:bg-gray-200"
                                >
                                    إغلاق
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div >
        </div >
    );
    const renderHeader: () => React.JSX.Element = () => (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col gap-3 mb-6 lg:mb-10 shrink-0"
        >
            {/* Language Indicator */}
            <div className="flex justify-center">
                <span className="px-3 py-1 bg-white dark:bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-2 border border-black/5">
                    {targetLanguage === 'en' ? '🇺🇸 English Mode' : '🇩🇪 German Mode'}
                </span>
            </div>

            <div className="flex p-1 gap-1 w-full bg-slate-200/50 dark:bg-black/40 rounded-full border border-white/20 backdrop-blur-xl">
                {([
                    { id: 'voice', label: 'المعلم الصوتي', icon: Mic },
                    { id: 'chat', label: 'محادثة حرة', icon: MessageSquare },
                    { id: 'plan', label: 'خطة مذاكرة', icon: Calendar },
                ] as const).map(m => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                            if ((m.id === 'voice' || m.id === 'plan') && !isProSubscriber) {
                                onRequirePro?.(
                                    m.id === 'voice'
                                        ? 'المعلم الصوتي متاح لمشتركي برو فقط.'
                                        : 'خطة المذاكرة الذكية متاحة لمشتركي برو فقط.'
                                );
                                return;
                            }
                            setMode(m.id as Mode);
                            stopSpeaking();
                            handleClearSession();
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all duration-300 ${assistantMode === m.id
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <m.icon size={18} />
                        <span className="hidden md:inline">{m.label}</span>
                        {(m.id === 'voice' || m.id === 'plan') && !isProSubscriber && (
                            <span className="hidden sm:inline text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Pro</span>
                        )}
                    </button>
                ))}
            </div>
        </motion.div>
    );

    const renderVoiceMode: () => React.JSX.Element = () => (
        <div className="flex flex-col items-center justify-center h-full pb-20 relative">
            {/* Ambient Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] transition-all duration-1000 ${isListening ? 'scale-150 bg-rose-500/20' : ''}`} />

            <div className="relative z-10 text-center mb-6 md:mb-10">
                <h2 className="text-3xl md:text-5xl font-black text-gray-800 dark:text-white mb-2 md:mb-4 tracking-tight">
                    {isListening ? "أنا أستمع إليك..." : "اضغط للتحدث"}
                </h2>
                <p
                    dir={isListening ? conversationDir : 'rtl'}
                    lang={isListening ? conversationLang : undefined}
                    className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-6"
                >
                    {isListening ? (transcript || "...") : "تدرب على النطق والمحادثة الحية"}
                </p>

                {/* Level Selector Bar */}
                <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                    {([
                        { level: 'A1' as const, label: 'A1', desc: 'مبتدئ', color: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-400/40' },
                        { level: 'A2' as const, label: 'A2', desc: 'أساسي', color: 'from-teal-400 to-emerald-500', glow: 'shadow-teal-400/40' },
                        { level: 'B1' as const, label: 'B1', desc: 'متوسط', color: 'from-blue-400 to-indigo-500', glow: 'shadow-blue-400/40' },
                        { level: 'B2' as const, label: 'B2', desc: 'فوق المتوسط', color: 'from-violet-400 to-purple-500', glow: 'shadow-violet-400/40' },
                        { level: 'C1' as const, label: 'C1', desc: 'متقدم', color: 'from-orange-400 to-rose-500', glow: 'shadow-orange-400/40' },
                        { level: 'C2' as const, label: 'C2', desc: 'إتقان', color: 'from-rose-500 to-red-600', glow: 'shadow-rose-500/40' },
                    ] as const).map(({ level, label, desc, color, glow }) => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => setSelectedLevel(level)}
                            className={`relative flex flex-col items-center px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl font-black transition-all duration-300 min-w-[52px] md:min-w-[72px] ${selectedLevel === level
                                ? `bg-gradient-to-br ${color} text-white shadow-xl ${glow} scale-110 md:scale-105`
                                : 'bg-white/60 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/20 border border-white/20 dark:border-white/10 hover:scale-105'
                                }`}
                        >
                            <span className="text-base md:text-xl font-black tracking-tight">{label}</span>
                            <span className={`text-[10px] md:text-xs font-bold whitespace-nowrap mt-0.5 ${selectedLevel === level ? 'text-white/80' : 'text-gray-400'}`}>{desc}</span>
                            {selectedLevel === level && (
                                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-md" />
                            )}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-3 uppercase tracking-widest">
                    المستوى المختار · الذكاء سيتحدث بـ{selectedLevel === 'A1' ? 'جمل بسيطة جداً' : selectedLevel === 'A2' ? 'جمل بسيطة' : selectedLevel === 'B1' ? 'مستوى متوسط' : selectedLevel === 'B2' ? 'مستوى متقدم' : selectedLevel === 'C1' ? 'لغة احترافية' : 'لغة أكاديمية'}
                </p>
                {!speechSupported && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-bold mt-4 max-w-md mx-auto leading-relaxed">
                        الميكروفون يعمل على Chrome أو Edge. افتح الموقع من أحد هذين المتصفحين ثم اسمح بالميكروفون عند الطلب.
                    </p>
                )}
                {voiceError && (
                    <p
                        dir="rtl"
                        className="text-sm text-rose-600 dark:text-rose-400 font-bold mt-3 max-w-lg mx-auto leading-relaxed px-2 whitespace-pre-line text-right"
                    >
                        {voiceError}
                    </p>
                )}
            </div>

            {/* Mic Button */}
            <motion.button
                type="button"
                whileHover={{ scale: speechSupported ? 1.05 : 1 }}
                whileTap={{ scale: speechSupported ? 0.95 : 1 }}
                onClick={() => void toggleListening()}
                disabled={!speechSupported}
                aria-pressed={isListening}
                aria-label={isListening ? 'إيقاف الاستماع' : 'بدء الاستماع'}
                className={`relative w-28 h-28 md:w-40 md:h-40 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${!speechSupported ? 'opacity-50 cursor-not-allowed' : ''} ${isListening
                    ? 'bg-gradient-to-tr from-rose-500 to-pink-600 shadow-rose-500/40'
                    : 'bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-indigo-500/40'
                    }`}
            >
                {/* Ripple Effect */}
                {isListening && (
                    <>
                        <span className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping opacity-75"></span>
                        <span className="absolute -inset-4 rounded-full border border-white/30 animate-ping opacity-50 animation-delay-500"></span>
                    </>
                )}

                <Mic size={64} className={isListening ? 'text-white' : 'text-white/90'} strokeWidth={isListening ? 2 : 1.75} />
            </motion.button>

            {/* Chat Preview (Last Message) */}
            <AnimatePresence>
                {messages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 max-w-2xl w-full px-6"
                    >
                        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] text-center shadow-2xl">
                            <div className="flex items-center justify-center gap-2 mb-3 text-indigo-400 uppercase text-xs font-bold tracking-widest">
                                <Bot size={14} /> اتعلم بالعربي AI
                            </div>
                            <p
                                dir={conversationDir}
                                lang={conversationLang}
                                className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed text-left"
                            >
                                {messages[messages.length - 1].text}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );



    return (
        <div className="h-screen bg-[#fafafa] dark:bg-[#0a0a0c] font-sans overflow-hidden flex flex-col">
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-indigo-500/10 rounded-full blur-[100px] animate-blob" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vh] h-[50vh] bg-rose-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
            </div>

            <div className="relative z-10 w-full max-w-[1800px] mx-auto h-full flex flex-col p-4 md:p-6 lg:p-8">
                {renderHeader()}

                <div className="flex-1 min-h-0 relative">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={assistantMode}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                            className="h-full min-h-0"
                        >
                            {assistantMode === 'voice' && renderVoiceMode()}

                            {assistantMode === 'plan' && renderPlanMode()}
                            {assistantMode === 'chat' && renderChatMode()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .animate-blob { animation: blob 7s infinite; }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
};
