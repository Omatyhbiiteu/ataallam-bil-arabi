
import React, { useState, useEffect } from 'react';
import { Card, SRSGrade } from '../types';
import { speakText, detectLang } from '../services/ttsService';
import { calculateNextReview, formatReviewIntervalLabel, getNextReviewIntervalMinutes } from '../services/srsService';
import { ArrowLeft, Brain, Volume2, Mic, Check, X as XIcon, Sparkles, Image as ImageIcon, Clock } from 'lucide-react';
import { SessionSummary } from './SessionSummary';
import confetti from 'canvas-confetti';
import { Toast } from './Toast';

interface ReviewSessionProps {
  queue: Card[];
  onExit: () => void;
  onUpdateCard: (card: Card) => void;
  onLogReview: (count: number, timestamp: number) => void;
  t: any;
  dir: string;
  targetLanguage?: 'en' | 'de';
  practiceMode?: boolean;
}

const formatSessionWait = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

type CardImageOrientation = 'portrait' | 'landscape' | 'square' | 'unknown';

export const ReviewSession: React.FC<ReviewSessionProps> = ({ queue, onExit, onUpdateCard, onLogReview, t, dir, targetLanguage, practiceMode = false }) => {
  const [activeQueue, setActiveQueue] = useState<Card[]>(queue);
  const [waitingQueue, setWaitingQueue] = useState<Card[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [showSummary, setShowSummary] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState<string | null>(null);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [imageOrientations, setImageOrientations] = useState<Record<string, CardImageOrientation>>({});

  const [stats, setStats] = useState<Record<SRSGrade, number>>({
    [SRSGrade.AGAIN]: 0,
    [SRSGrade.HARD]: 0,
    [SRSGrade.GOOD]: 0,
    [SRSGrade.EASY]: 0,
  });
  const [sessionScore, setSessionScore] = useState(0);
  const [hardestCards, setHardestCards] = useState<Card[]>([]);

  const currentCard = activeQueue[0];
  const nextWaitingCard = waitingQueue.reduce<Card | null>((closest, card) => {
    if (!card.dueTimeInSession) return closest;
    if (!closest?.dueTimeInSession) return card;
    return card.dueTimeInSession < closest.dueTimeInSession ? card : closest;
  }, null);
  const nextWaitMs = nextWaitingCard?.dueTimeInSession ? nextWaitingCard.dueTimeInSession - now : 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      if (waitingQueue.length > 0) {
        const currentTime = Date.now();
        const dueCards = waitingQueue.filter(c => c.dueTimeInSession && c.dueTimeInSession <= currentTime);
        if (dueCards.length > 0) {
          setWaitingQueue(prev => prev.filter(c => !dueCards.find(d => d.id === c.id)));
          setActiveQueue(prev => [...prev, ...dueCards]);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [waitingQueue]);

  useEffect(() => {
    // الإصلاح: لا تنهِ الجلسة إلا إذا كانت القائمتان فارغتَين
    if (activeQueue.length === 0 && waitingQueue.length === 0 && !showSummary) {
      const timer = setTimeout(() => {
        setShowSummary(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff']
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeQueue, waitingQueue, showSummary]);

  const handleFlip = () => {
    // الإصلاح: حذف تشغيل الصوت التلقائي — المستخدم يملك زر صوت منفصل
    setIsFlipped(!isFlipped);
  };

  const handleManualSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    // Use the known targetLanguage first; fall back to detectLang for Arabic detection
    const lang = (targetLanguage && detectLang(text) !== 'ar') ? targetLanguage : detectLang(text);
    speakText(text, lang);
  };

  const handleRate = (grade: SRSGrade) => {
    if (!currentCard) return;
    const updates = calculateNextReview(currentCard, grade);
    const updatedCard = { ...currentCard, ...updates } as Card;
    const sessionCard = practiceMode
      ? ({ ...currentCard, lastGrade: grade, dueTimeInSession: undefined } as Card)
      : updatedCard;

    if (!practiceMode) {
      onUpdateCard(updatedCard);
      onLogReview(1, Date.now());
    }
    setStats(prev => ({ ...prev, [grade]: (prev[grade] || 0) + 1 }));
    let points = 0;
    if (grade === SRSGrade.EASY) points = 3;
    if (grade === SRSGrade.GOOD) points = 2;
    if (grade === SRSGrade.HARD) points = 1;
    setSessionScore(prev => prev + points);

    if (grade === SRSGrade.AGAIN || grade === SRSGrade.HARD) {
      if (!hardestCards.find(c => c.id === currentCard.id)) setHardestCards(prev => [...prev, currentCard]);
    }

    setIsFlipped(false);

    if (grade === SRSGrade.AGAIN) {
      // مجدداً: ترجع في آخر الجلسة الحالية (لا تقاطع التدفق)
      setActiveQueue(prev => { const [, ...rest] = prev; return [...rest, sessionCard]; });
    } else if (grade === SRSGrade.HARD) {
      if (practiceMode) {
        setActiveQueue(prev => { const [, ...rest] = prev; return [...rest, sessionCard]; });
        setWaitingQueue(prev => prev.filter(c => c.id !== currentCard.id));
        setSpeechResult(null);
        setPronunciationScore(null);
        return;
      }
      // صعب: يدخل انتظار قصير، ثم يعود تلقائياً عند انتهاء المؤقت.
      setActiveQueue(prev => prev.slice(1));
      setWaitingQueue(prev => {
        const withoutCurrent = prev.filter(c => c.id !== updatedCard.id);
        return [...withoutCurrent, updatedCard].sort((a, b) => (a.dueTimeInSession || 0) - (b.dueTimeInSession || 0));
      });
    } else if (grade === SRSGrade.GOOD) {
      // كويس: تخرج من الجلسة، وتظهر مرة أخرى حسب موعد المراجعة.
      setActiveQueue(prev => prev.slice(1));
    } else if (grade === SRSGrade.EASY) {
      // سهل: تخرج من الجلسة بموعد أطول من "جيد".
      setActiveQueue(prev => prev.slice(1));
    }

    // Reset AI state for next card
    setSpeechResult(null);
    setPronunciationScore(null);
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToastMessage({ text, type });
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast("متصفحك لا يدعم خاصية التعرف على الصوت. 🚫", "error");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Use the known targetLanguage for recognition when available
    const backLang = detectLang(currentCard.backText);
    recognition.lang = backLang === 'ar' ? 'ar-SA' : (targetLanguage === 'de' ? 'de-DE' : 'en-US');
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechResult(null);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setSpeechResult(result);
      evaluatePronunciation(result);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const evaluatePronunciation = (spoken: string) => {
    setIsAiEvaluating(true);
    const target = currentCard.backText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    const actual = spoken.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

    // Simple Levenshtein-based similarity or basic comparison for MVP
    // In a real "Deep AI" setup, this would call an API like Azure/Whisper
    setTimeout(() => {
      let score = 0;
      if (actual === target) {
        score = 100;
      } else {
        // Very basic word match score
        const targetWords = target.split(' ');
        const actualWords = actual.split(' ');
        const matched = targetWords.filter(w => actualWords.includes(w)).length;
        score = Math.round((matched / targetWords.length) * 100);
      }

      setPronunciationScore(score);
      setIsAiEvaluating(false);

      // Auto-flash "Good" if score is high
      if (score > 90) {
        // We could auto-rate here, but better to let user see feedback
      }
    }, 800);
  };

  if (showSummary) {
    return (
      <div className={`flex-1 xl:w-[calc(100%-20rem)] w-full ${dir === 'rtl' ? 'xl:mr-80' : 'xl:ml-80'}`}>
        <SessionSummary results={{
          totalReviewed: (Object.values(stats) as number[]).reduce((a: number, b: number) => a + b, 0),
          breakdown: stats as any,
          score: sessionScore,
          hardestCards: hardestCards,
          startTime: sessionStartTime,
          endTime: Date.now()
        }} onClose={onExit} t={t} />
      </div>
    );
  }

  const marginClass = dir === 'rtl' ? 'xl:mr-80' : 'xl:ml-80';
  // الإصلاح: حساب التقدم الحقيقي بإجمالي الكل ناقص المتبقي
  const totalInSession = queue.length;
  const remainingCount = activeQueue.length + waitingQueue.length;
  const reviewedCount = totalInSession - remainingCount;
  const progress = (reviewedCount / Math.max(totalInSession, 1)) * 100;
  const timeElapsed = Math.floor((now - sessionStartTime) / 1000);
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const currentImageOrientation = currentCard?.frontImage ? imageOrientations[currentCard.id] || 'unknown' : 'unknown';
  const hasPortraitFrontImage = currentCard?.frontImageFit === 'portrait' || (!currentCard?.frontImageFit && currentImageOrientation === 'portrait');

  const handleFrontImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!currentCard) return;
    const image = event.currentTarget;
    if (!image.naturalWidth || !image.naturalHeight) return;

    const ratio = image.naturalWidth / image.naturalHeight;
    const orientation: CardImageOrientation =
      ratio < 0.85 ? 'portrait' : ratio > 1.2 ? 'landscape' : 'square';

    setImageOrientations((prev) => (
      prev[currentCard.id] === orientation ? prev : { ...prev, [currentCard.id]: orientation }
    ));
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto transition-colors duration-500 ${isFlipped ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' : 'bg-stone-50 dark:bg-dark-bg'}`}
      dir={dir}
    >
      <Toast
        message={toastMessage?.text || ""}
        isVisible={!!toastMessage}
        onClose={() => setToastMessage(null)}
        type={toastMessage?.type}
      />

      {/* Progress Bar Top */}
      <div className={`absolute top-0 left-0 w-full h-1.5 z-20 transition-colors duration-500 ${isFlipped ? 'bg-white/10' : 'bg-stone-200 dark:bg-gray-800'}`}>
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          style={{ width: `${Math.max(2, progress)}%` }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-4 w-full px-6 flex justify-between items-center z-10">
        <button onClick={onExit} className={`p-2.5 rounded-2xl transition ltr:rotate-0 rtl:rotate-180 group ${isFlipped ? 'bg-white/10 hover:bg-white/20 border border-white/10' : 'bg-white dark:bg-dark-card shadow-warm hover:bg-amber-50 dark:hover:bg-gray-700 border border-stone-100 dark:border-gray-700'}`}>
          <ArrowLeft className="text-gray-600 dark:text-gray-300 group-hover:text-primary transition" size={20} />
        </button>

        <div className="flex items-center gap-3">
          {practiceMode && (
            <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black border ${isFlipped ? 'bg-white/10 border-white/10 text-amber-200' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-600'}`}>
              تدريب حر
            </div>
          )}
          {/* Timer Widget */}
          <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-sm ${isFlipped ? 'bg-white/10 border border-white/10 text-gray-300' : 'bg-white dark:bg-dark-card shadow-warm border border-stone-100 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>

          <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-3 ${isFlipped ? 'bg-white/10 border border-white/10 text-amber-300' : 'bg-white dark:bg-dark-card text-primary shadow-warm border border-stone-100 dark:border-gray-700'}`}>
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-amber-500" />
              <span className="dark:text-white">{activeQueue.length}</span>
            </div>
            {waitingQueue.length > 0 && (
              <div className="flex items-center gap-1.5 border-l border-stone-100 dark:border-gray-700 pl-3 ml-1">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                <span className="text-orange-400 text-xs">+{waitingQueue.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Card Container */}
      {!currentCard && waitingQueue.length > 0 && (
        <div className="w-full max-w-md px-4">
          <div className="bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 shadow-warm-lg border border-stone-100 dark:border-gray-800 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mb-5">
              <Clock size={34} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">كل الكروت في انتظار المراجعة</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
              أقرب كرت هيفتح تلقائياً بعد انتهاء العداد.
            </p>
            <div className="mt-6 rounded-2xl bg-stone-50 dark:bg-gray-800 border border-stone-100 dark:border-gray-700 p-5">
              <p className="text-xs font-black text-gray-400 mb-2">الكرت القادم</p>
              <p className="text-lg font-black text-gray-900 dark:text-white truncate">{nextWaitingCard?.frontText || 'بطاقة مراجعة'}</p>
              <p className="mt-3 text-4xl font-black font-mono text-orange-500">{formatSessionWait(nextWaitMs)}</p>
            </div>
            <button
              type="button"
              onClick={onExit}
              className="mt-6 w-full bg-stone-900 dark:bg-white text-white dark:text-gray-900 py-3.5 rounded-2xl font-black hover:opacity-90 transition"
            >
              إنهاء الجلسة الآن
            </button>
          </div>
        </div>
      )}

      {currentCard && (
        <div className={`w-full px-4 flex flex-col items-center transition-[max-width] duration-500 ease-out ${hasPortraitFrontImage ? 'max-w-[340px] sm:max-w-[370px]' : 'max-w-sm sm:max-w-md'}`}>
          <div
            className={`relative w-full cursor-pointer flip-card ${isFlipped ? 'flipped' : ''}`}
            style={{
              height: hasPortraitFrontImage ? 'min(72vh, 560px)' : 'min(62vh, 500px)',
              minHeight: hasPortraitFrontImage ? '420px' : '340px',
            }}
            onClick={handleFlip}
          >
            <div className="flip-card-inner w-full h-full relative shadow-warm-lg rounded-[2rem] md:rounded-[2.5rem]">

              {/* --- CARD FRONT --- */}
              <div className="flip-card-front absolute w-full h-full bg-white dark:bg-dark-card rounded-[2rem] md:rounded-[2.5rem] flex flex-col p-6 md:p-10 border-2 border-stone-100 dark:border-gray-800 transition overflow-hidden">

                {/* Top badge row */}
                <div className="flex justify-between items-center mb-3 shrink-0">
                  <button
                    onClick={(e) => handleManualSpeak(e, currentCard.frontText)}
                    className="p-2.5 rounded-xl bg-amber-500 text-white hover:scale-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                  >
                    <Volume2 size={18} />
                  </button>
                  <div className="text-[11px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full uppercase tracking-[0.15em] shadow-sm">{t.review.question}</div>
                </div>

                {/* Card text */}
                <div className="shrink-0 flex items-center justify-center py-2">
                  <h2 className="text-2xl md:text-5xl font-black text-gray-900 dark:text-white text-center leading-tight tracking-tight">{currentCard.frontText}</h2>
                </div>

                {/* Image area - flex-1 to fill remaining space */}
                <div className={`flex-1 mt-3 w-full rounded-xl md:rounded-2xl overflow-hidden border-2 border-stone-100 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 shadow-inner min-h-0 relative ${hasPortraitFrontImage ? 'p-3 md:p-4' : ''}`}>
                  {currentCard.frontImage ? (
                    <div className="relative z-[1] w-full h-full flex items-center justify-center">
                      <img src={currentCard.frontImage} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" />
                      <img
                        src={currentCard.frontImage}
                        alt=""
                        onLoad={handleFrontImageLoad}
                        className={
                          hasPortraitFrontImage
                            ? 'relative z-[1] h-full max-h-full w-auto max-w-[78%] object-contain rounded-xl bg-white/75 dark:bg-white/10 p-1.5 shadow-2xl ring-1 ring-white/70 dark:ring-white/10'
                            : 'relative z-[1] w-full h-full object-cover'
                        }
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300 dark:text-gray-600">
                      <ImageIcon size={28} className="opacity-70" />
                      <span className="text-[11px] font-black">بدون صورة</span>
                    </div>
                  )}
                </div>

                {/* Hint */}
                <div className="mt-3 shrink-0 flex items-center justify-center">
                  <p className="text-stone-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                    {t.review.clickToReveal}
                  </p>
                </div>
              </div>

              {/* --- CARD BACK --- */}
              <div className="flip-card-back absolute w-full h-full bg-gradient-to-br from-gray-900 via-slate-900 to-black dark:from-black dark:to-slate-900 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center p-6 md:p-10 text-white border-2 border-amber-500/30 shadow-2xl overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

                <div className="absolute top-8 right-8 text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">{t.review.answer}</div>

                <button
                  onClick={(e) => handleManualSpeak(e, currentCard.backText)}
                  className="absolute top-8 left-8 p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg backdrop-blur-md"
                >
                  <Volume2 size={24} />
                </button>

                <div className="z-10 flex flex-col items-center gap-6 w-full">
                  <h2 className="text-3xl md:text-6xl font-bold text-center leading-[1.2] max-w-2xl">{currentCard.backText}</h2>

                  {/* AI Pronunciation Feedback */}
                  <div className="flex flex-col items-center gap-4 mt-6">
                    {!speechResult ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); startListening(); }}
                        disabled={isListening}
                        className={`relative group flex flex-col items-center gap-3 transition-all duration-500`}
                      >
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-red-500 animate-pulse scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 hover:bg-primary hover:scale-110 shadow-lg'}`}>
                          {isListening ? <Mic size={32} className="animate-bounce" /> : <Mic size={32} />}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">
                          {isListening ? 'جاري الاستماع...' : 'اضغط للتحدث (AI)'}
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center animate-scale-up">
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${pronunciationScore && pronunciationScore > 80 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'} backdrop-blur-md`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pronunciationScore && pronunciationScore > 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                            {pronunciationScore && pronunciationScore > 80 ? <Check size={18} /> : <XIcon size={18} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold opacity-60">نطقك: "{speechResult}"</span>
                            <span className={`text-lg font-black ${pronunciationScore && pronunciationScore > 80 ? 'text-emerald-400' : 'text-orange-400'}`}>
                              دقة النطق: {pronunciationScore}%
                            </span>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSpeechResult(null); startListening(); }} className="mt-4 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2">
                          <Sparkles size={14} className="text-amber-500" /> حاول مرة أخرى
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isFlipped && (
            <div className="mt-4 md:mt-6 grid grid-cols-4 gap-2 md:gap-4 w-full animate-slide-up">
              {[
                { grade: SRSGrade.AGAIN, label: t.review.again, color: 'text-red-500', bg: 'bg-red-50/80 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900/40' },
                { grade: SRSGrade.HARD, label: t.review.hard, color: 'text-orange-500', bg: 'bg-orange-50/80 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-900/40' },
                { grade: SRSGrade.GOOD, label: t.review.good, color: 'text-emerald-500', bg: 'bg-emerald-50/80 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900/40' },
                { grade: SRSGrade.EASY, label: t.review.easy, color: 'text-blue-500', bg: 'bg-blue-50/80 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900/40' }
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRate(btn.grade)}
                  className={`group p-2.5 md:p-5 rounded-2xl ${btn.bg} border-2 ${btn.border} transition-all duration-200 flex flex-col items-center shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95`}
                >
                  <span className={`${btn.color} font-black text-sm md:text-lg mb-0.5`}>{btn.label}</span>
                  <span className="text-[10px] md:text-xs text-stone-500 dark:text-gray-400 font-bold uppercase opacity-70">
                    {practiceMode ? 'بدون عداد' : formatReviewIntervalLabel(getNextReviewIntervalMinutes(currentCard, btn.grade))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
