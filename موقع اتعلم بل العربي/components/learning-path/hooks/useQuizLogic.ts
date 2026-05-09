import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Lesson, Question } from '../../../types';

// Minimum passing score (60% = max 40% wrong)
const PASS_THRESHOLD = 60;

interface UseQuizLogicProps {
    activeLesson: Lesson;
    onComplete: (score: number) => void;
}

// Helper to evaluate if an answer is correct
const evaluateAnswer = (q: Question, userAnswer: any): boolean => {
    if (q.type === 'multiple-choice' || q.type === 'true-false') {
        return userAnswer === q.correctAnswer;
    } else if (q.type === 'text-input') {
        return String(userAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
    } else if (q.type === 'checkbox') {
        const correctArr = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
        const userArr = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
        return JSON.stringify(correctArr) === JSON.stringify(userArr);
    } else if (q.type === 'order') {
        const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
        const userArr = Array.isArray(userAnswer) ? userAnswer : [];
        return JSON.stringify(correctArr) === JSON.stringify(userArr);
    } else if (q.type === 'open' || q.type === 'note') {
        return true; // Always correct for open/note types
    }
    return false;
};

export const useQuizLogic = ({ activeLesson, onComplete }: UseQuizLogicProps) => {
    const originalQuestions = activeLesson?.questions ?? [];

    // إعادة ضبط الاختبار عند فتح درس آخر (بعد جلب المنهج من السيرفر)
    useEffect(() => {
        setQuestionQueue(originalQuestions.map((_, i) => i));
        setQueuePosition(0);
        setQuizAnswers({});
        setQuizState('answering');
        setQuizResult(null);
        setCurrentSelectedAnswer(null);
        setWrongOriginalIndices([]);
        setIsRetryRound(false);
        retryQueued.current = false;
        setScrambledWords([]);
        setSelectedWords([]);
    }, [activeLesson.id, originalQuestions.length]);

    // ─── Queue-based question management ───────────────────────────────────────
    // We maintain a queue of question indices. After all original questions finish,
    // wrong questions are appended for one retry round.
    const [questionQueue, setQuestionQueue] = useState<number[]>(() =>
        originalQuestions.map((_, i) => i)
    );
    const [queuePosition, setQueuePosition] = useState(0); // index into questionQueue

    // Track which original question indices were answered wrong (for retry)
    const [wrongOriginalIndices, setWrongOriginalIndices] = useState<number[]>([]);
    // Whether we are now in the retry round
    const [isRetryRound, setIsRetryRound] = useState(false);
    // Retry indices already queued (to avoid double-adding)
    const retryQueued = useRef(false);

    // Standard quiz state
    const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
    const [quizState, setQuizState] = useState<'answering' | 'feedback_correct' | 'feedback_wrong'>('answering');
    const [currentSelectedAnswer, setCurrentSelectedAnswer] = useState<any>(null);
    const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
    const [scrambledWords, setScrambledWords] = useState<string[]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

    // Derived: which question are we currently showing?
    const currentQuestionIndex = questionQueue[queuePosition] ?? 0;

    // ─── Effects ───────────────────────────────────────────────────────────────
    // Shuffle words when an "order" question appears
    useEffect(() => {
        if (originalQuestions.length > 0) {
            const q = originalQuestions[currentQuestionIndex];
            if (q?.type === 'order' && q.options) {
                const words = [...q.options].sort(() => Math.random() - 0.5);
                setScrambledWords(words);
                setSelectedWords([]);
                setCurrentSelectedAnswer(null);
            }
        }
    }, [queuePosition, questionQueue]);

    // Sync selected word array to currentSelectedAnswer
    useEffect(() => {
        if (selectedWords.length > 0) {
            setCurrentSelectedAnswer(selectedWords);
        } else {
            setCurrentSelectedAnswer(null);
        }
    }, [selectedWords]);

    // ─── Handlers ──────────────────────────────────────────────────────────────
    const handleSelectAnswer = (value: any) => {
        if (quizState === 'answering') setCurrentSelectedAnswer(value);
    };

    const checkAnswer = () => {
        if (!originalQuestions.length || !currentSelectedAnswer) return;
        const q = originalQuestions[currentQuestionIndex];
        const isCorrect = evaluateAnswer(q, currentSelectedAnswer);

        // Record the answer using question ID
        setQuizAnswers(prev => ({ ...prev, [q.id]: currentSelectedAnswer }));
        setQuizState(isCorrect ? 'feedback_correct' : 'feedback_wrong');

        // Track wrong original questions (only during the first round, not retry)
        if (!isCorrect && !isRetryRound) {
            setWrongOriginalIndices(prev =>
                prev.includes(currentQuestionIndex) ? prev : [...prev, currentQuestionIndex]
            );
        }
    };

    const continueQuiz = () => {
        if (!originalQuestions.length) return;

        const nextPosition = queuePosition + 1;

        if (nextPosition >= questionQueue.length) {
            // We've reached the end of the current queue
            if (!retryQueued.current && wrongOriginalIndices.length > 0) {
                // Append wrong questions for one retry round
                retryQueued.current = true;
                setIsRetryRound(true);
                setQuestionQueue(prev => [...prev, ...wrongOriginalIndices]);
                setQueuePosition(nextPosition);
                setQuizState('answering');
                setCurrentSelectedAnswer(null);
            } else {
                // Really finished — calculate final score
                finishQuiz();
            }
        } else {
            setQueuePosition(nextPosition);
            setQuizState('answering');
            setCurrentSelectedAnswer(null);
        }
    };

    const finishQuiz = () => {
        // Score only based on ORIGINAL questions (not the retry round)
        const originalQs = originalQuestions;
        let correct = 0;

        originalQs.forEach(q => {
            const userAnswer = quizAnswers[q.id];
            if (evaluateAnswer(q, userAnswer)) correct++;
        });

        // For retry round: if a wrong question was answered correctly in retry, count it
        // (we keep the latest answer per question ID so this is automatic)

        const score = Math.round((correct / originalQs.length) * 100);
        const passed = score >= PASS_THRESHOLD;

        setQuizResult({ score, passed });

        if (passed) {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            onComplete(score);
        }
    };

    const retryQuiz = () => {
        setQuestionQueue(originalQuestions.map((_, i) => i));
        setQueuePosition(0);
        setQuizAnswers({});
        setQuizState('answering');
        setCurrentSelectedAnswer(null);
        setQuizResult(null);
        setScrambledWords([]);
        setSelectedWords([]);
        setWrongOriginalIndices([]);
        setIsRetryRound(false);
        retryQueued.current = false;
    };

    // Total questions shown in the header (original + retry)
    const totalQuestionsInQueue = questionQueue.length;
    const currentDisplayIndex = queuePosition + 1;

    return {
        currentQuestionIndex,        // which question object to render
        currentDisplayIndex,         // display "3 / 7" etc.
        totalQuestionsInQueue,
        quizState,
        currentSelectedAnswer,
        quizResult,
        isRetryRound,
        scrambledWords,
        selectedWords,
        setScrambledWords,
        setSelectedWords,
        handleSelectAnswer,
        checkAnswer,
        continueQuiz,
        retryQuiz
    };
};
