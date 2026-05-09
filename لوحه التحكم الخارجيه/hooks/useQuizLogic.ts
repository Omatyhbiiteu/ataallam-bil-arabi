import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Lesson, Question } from '../types';

const PASS_THRESHOLD = 60;

interface UseQuizLogicProps {
    activeLesson: Lesson;
    onComplete: (score: number) => void;
}

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
        return true;
    }
    return false;
};

export const useQuizLogic = ({ activeLesson, onComplete }: UseQuizLogicProps) => {
    const originalQuestions = activeLesson?.questions ?? [];

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

    const [questionQueue, setQuestionQueue] = useState<number[]>(() =>
        originalQuestions.map((_, i) => i)
    );
    const [queuePosition, setQueuePosition] = useState(0);
    const [wrongOriginalIndices, setWrongOriginalIndices] = useState<number[]>([]);
    const [isRetryRound, setIsRetryRound] = useState(false);
    const retryQueued = useRef(false);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
    const [quizState, setQuizState] = useState<'answering' | 'feedback_correct' | 'feedback_wrong'>('answering');
    const [currentSelectedAnswer, setCurrentSelectedAnswer] = useState<any>(null);
    const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
    const [scrambledWords, setScrambledWords] = useState<string[]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

    const currentQuestionIndex = questionQueue[queuePosition] ?? 0;

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

    useEffect(() => {
        if (selectedWords.length > 0) {
            setCurrentSelectedAnswer(selectedWords);
        } else {
            setCurrentSelectedAnswer(null);
        }
    }, [selectedWords]);

    const handleSelectAnswer = (value: any) => {
        if (quizState === 'answering') setCurrentSelectedAnswer(value);
    };

    const checkAnswer = () => {
        if (!originalQuestions.length || !currentSelectedAnswer) return;
        const q = originalQuestions[currentQuestionIndex];
        const isCorrect = evaluateAnswer(q, currentSelectedAnswer);

        setQuizAnswers(prev => ({ ...prev, [q.id]: currentSelectedAnswer }));
        setQuizState(isCorrect ? 'feedback_correct' : 'feedback_wrong');

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
            if (!retryQueued.current && wrongOriginalIndices.length > 0) {
                retryQueued.current = true;
                setIsRetryRound(true);
                setQuestionQueue(prev => [...prev, ...wrongOriginalIndices]);
                setQueuePosition(nextPosition);
                setQuizState('answering');
                setCurrentSelectedAnswer(null);
            } else {
                finishQuiz();
            }
        } else {
            setQueuePosition(nextPosition);
            setQuizState('answering');
            setCurrentSelectedAnswer(null);
        }
    };

    const finishQuiz = () => {
        const originalQs = originalQuestions;
        let correct = 0;

        originalQs.forEach(q => {
            const userAnswer = quizAnswers[q.id];
            if (evaluateAnswer(q, userAnswer)) correct++;
        });

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

    const totalQuestionsInQueue = questionQueue.length;
    const currentDisplayIndex = queuePosition + 1;

    return {
        currentQuestionIndex,
        currentDisplayIndex,
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
