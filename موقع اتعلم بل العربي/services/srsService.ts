
import { Card, SRSGrade } from '../types';

// ─────────────────────────────────────────────────────────────────
// Improved SRS Algorithm — KeyLang v2
// Based on SM-2 with practical UX enhancements
// ─────────────────────────────────────────────────────────────────

/**
 * First-cycle intervals in minutes.
 * The app is built for fast daily practice, so new/learning cards should come
 * back inside the same study day instead of disappearing for several days.
 */
const INTERVALS = {
  AGAIN: 0,   // immediate repeat in the same session
  HARD:  5,   // short delay, then re-test
  GOOD:  30,  // understood, but still same-day confirmation
  EASY:  60,  // strong understanding, one-hour confirmation
};

// Add ±5% "fuzz" so cards reviewed together don't always cluster back together
const applyFuzz = (interval: number): number => {
  if (interval <= 5) return interval;
  const variance = interval * 0.05 * (Math.random() - 0.5);
  return Math.round(interval + variance);
};

const getBaseIntervalAndStatus = (card: Card, grade: SRSGrade): { baseInterval: number; newStatus: Card['status'] } => {
  let baseInterval = card.interval;
  let newStatus = card.status;

  // ── 1. Base Interval & Status ──────────────────────────────────

  if (grade === SRSGrade.AGAIN) {
    baseInterval = 0;
    newStatus = 'learning';

  } else if (grade === SRSGrade.HARD) {
    baseInterval = INTERVALS.HARD;
    newStatus = 'learning';

  } else if (grade === SRSGrade.GOOD) {
    // First time through: 30 minutes. Already-reviewed cards grow with ease.
    baseInterval = card.status === 'review' || card.status === 'mastered'
      ? Math.max(INTERVALS.GOOD, Math.round((card.interval || INTERVALS.GOOD) * card.easeFactor))
      : INTERVALS.GOOD;
    newStatus = 'review';

  } else if (grade === SRSGrade.EASY) {
    if (card.status === 'review' || card.status === 'mastered') {
      baseInterval = Math.max(
        INTERVALS.EASY,
        Math.round((card.interval || INTERVALS.EASY) * card.easeFactor * 1.3)
      );
      newStatus = 'mastered';
    } else {
      baseInterval = INTERVALS.EASY;
      newStatus = 'review';
    }
  }

  return { baseInterval, newStatus };
};

export const getNextReviewIntervalMinutes = (card: Card, grade: SRSGrade): number => {
  return getBaseIntervalAndStatus(card, grade).baseInterval;
};

export const formatReviewIntervalLabel = (minutes: number): string => {
  if (minutes <= 0) return '<1m';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);
  return `${days}d`;
};

export const calculateNextReview = (card: Card, grade: SRSGrade): Partial<Card> => {
  const now = Date.now();
  const { baseInterval, newStatus } = getBaseIntervalAndStatus(card, grade);

  // ── 2. Fuzz (prevents clustering) ─────────────────────────────
  const finalInterval = applyFuzz(baseInterval);

  // ── 3. Ease Factor — SM-2 style ────────────────────────────────
  let newEase = card.easeFactor;
  if (grade === SRSGrade.HARD) newEase = Math.max(1.3, newEase - 0.15);
  if (grade === SRSGrade.GOOD) newEase = Math.max(1.3, Math.min(4.0, newEase));       // clamp
  if (grade === SRSGrade.EASY) newEase = Math.min(4.0, newEase + 0.15);               // cap at 4.0

  // ── 4. Next review timestamp ───────────────────────────────────
  const nextReviewDate = now + finalInterval * 60 * 1000;

  return {
    nextReview: nextReviewDate,
    interval: finalInterval,
    reviews: card.reviews + 1,
    easeFactor: parseFloat(newEase.toFixed(2)),
    status: newStatus,
    lastGrade: grade,
    // Only AGAIN/HARD can reappear inside the current session.
    dueTimeInSession:
      grade === SRSGrade.AGAIN ? now :
      grade === SRSGrade.HARD ? nextReviewDate :
      undefined,
  };
};
