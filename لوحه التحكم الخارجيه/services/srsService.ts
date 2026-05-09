
import { Card, SRSGrade } from '../types';

// Multipliers in minutes
const INTERVALS = {
  AGAIN: 0,     // Immediate retry
  HARD: 5,      // 5 minutes
  GOOD: 1440,   // 1 day (24 hours)
  EASY: 10080,  // 7 days
};

// Advanced: Add "Fuzz" factor to prevent cards reviewed together from always sticking together
// We add/subtract up to 5% variance to the interval
const applyFuzz = (interval: number): number => {
  if (interval <= 5) return interval; // Don't fuzz very short intervals
  const fuzzFactor = 0.05; // 5%
  const variance = interval * fuzzFactor * (Math.random() - 0.5); // Random between -2.5% and +2.5%
  return Math.round(interval + variance);
};

export const calculateNextReview = (card: Card, grade: SRSGrade): Partial<Card> => {
  const now = Date.now();
  let baseInterval = card.interval;
  let newStatus = card.status;

  // 1. Determine Base Interval based on Grade
  if (grade === SRSGrade.AGAIN) {
    baseInterval = 0;
    newStatus = 'learning';
  } else if (grade === SRSGrade.HARD) {
    baseInterval = INTERVALS.HARD;
    newStatus = 'learning';
  } else if (grade === SRSGrade.GOOD) {
    // If it was already in review, multiply interval (Simple exponential growth)
    // If new, set to base GOOD interval
    baseInterval = card.status === 'review'
      ? Math.max(INTERVALS.GOOD, Math.round(card.interval * card.easeFactor))
      : INTERVALS.GOOD;
    newStatus = 'review';
  } else if (grade === SRSGrade.EASY) {
    baseInterval = card.status === 'review' || card.status === 'mastered'
      ? Math.max(INTERVALS.EASY, Math.round(card.interval * card.easeFactor * 1.3)) // Bonus multiplier for Easy
      : INTERVALS.EASY;
    newStatus = 'mastered';
  }

  // 2. Apply Fuzzing (Algorithmic Improvement)
  const finalInterval = applyFuzz(baseInterval);

  // 3. Calculate Ease Factor Adjustments (Anki-style)
  // Decrease ease if hard, increase if easy, stay same if good
  let newEase = card.easeFactor;
  if (grade === SRSGrade.HARD) newEase = Math.max(1.3, newEase - 0.15); // Minimum 1.3 (SM-2 standard)
  if (grade === SRSGrade.EASY) newEase += 0.15;

  // 4. Calculate Absolute Timestamp
  // interval is in minutes, so * 60 * 1000
  const nextReviewDate = now + (finalInterval * 60 * 1000);

  return {
    nextReview: nextReviewDate,
    interval: finalInterval,
    reviews: card.reviews + 1,
    easeFactor: parseFloat(newEase.toFixed(2)), // Clean float
    status: newStatus,
    lastGrade: grade,
    dueTimeInSession: grade === SRSGrade.EASY ? undefined : nextReviewDate
  };
};
