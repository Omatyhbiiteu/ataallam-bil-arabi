import { Card, ReviewLog, SRSGrade } from '../types';

export const FREE_MAX_FOLDERS = 3;
export const FREE_MAX_CARDS_PER_FOLDER = 10;

export type ActiveReviewSession = {
  queue: Card[];
  isPractice: boolean;
};

export type LevelData = {
  level: number;
  totalXP: number;
  progressToNext: number;
};

export const getDayStart = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/** أيام متتالية بمراجعات فعلية (من سجل المراجعة اليومي) */
export function computeReviewStreak(reviewLog: ReviewLog[]): number {
  const dayMs = 86400000;
  const today = getDayStart(Date.now());
  const byDay = new Map(reviewLog.filter((e) => e.count > 0).map((e) => [e.date, e.count]));
  const hasToday = (byDay.get(today) || 0) > 0;
  const hasYesterday = (byDay.get(today - dayMs) || 0) > 0;
  if (!hasToday && !hasYesterday) return 0;
  const start = hasToday ? today : today - dayMs;
  let streak = 0;
  let d = start;
  while ((byDay.get(d) || 0) > 0) {
    streak += 1;
    d -= dayMs;
  }
  return streak;
}

/** نسبة نجاح حقيقية: من متوسط الاختبارات إن وُجد، وإلا من آخر تقييم SRS للبطاقات */
export function computeSuccessRate(
  cards: Card[],
  quizStats?: { totalQuizzes: number; averageScore: number }
): number {
  if (quizStats && quizStats.totalQuizzes > 0) {
    return Math.round(Math.min(100, Math.max(0, quizStats.averageScore)));
  }
  const graded = cards.filter((c) => (c.reviews || 0) > 0 && c.lastGrade != null);
  if (graded.length === 0) return 0;
  const good = graded.filter(
    (c) => c.lastGrade === SRSGrade.GOOD || c.lastGrade === SRSGrade.EASY
  ).length;
  return Math.round((good / graded.length) * 100);
}

export function computeLevelData(args: {
  cards: Card[];
  completedStoryCount: number;
  completedLessonCount: number;
  quizStats?: { totalQuizzes: number; averageScore: number };
  bonusXp: number;
  gameXp: number;
}): LevelData {
  const { cards, completedStoryCount, completedLessonCount, quizStats, bonusXp, gameXp } = args;
  const totalReviews = cards.reduce((s, c) => s + (c.reviews || 0), 0);
  const mastered = cards.filter((c) => c.status === 'mastered').length;
  const storyXP = completedStoryCount * 15;
  const lessonXP = completedLessonCount * 10;
  const quizXP =
    quizStats && quizStats.totalQuizzes > 0
      ? Math.round(quizStats.averageScore * Math.min(quizStats.totalQuizzes, 50) * 0.2)
      : 0;
  const reviewXP = totalReviews * 8;
  const masteredXP = mastered * 25;
  const totalXP = Math.max(0, reviewXP + masteredXP + storyXP + lessonXP + quizXP + bonusXp + gameXp);

  const level = Math.max(1, Math.floor(Math.sqrt(totalXP / 100)) + 1);
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const span = nextLevelXP - currentLevelXP;
  const progressToNext = span > 0 ? Math.min(100, Math.max(0, ((totalXP - currentLevelXP) / span) * 100)) : 0;

  return { level, totalXP, progressToNext };
}

export function formatServerNotificationTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'الآن';
  if (diff < 3_600_000) return `منذ ${Math.floor(diff / 60_000)} د`;
  if (diff < 86_400_000) return `منذ ${Math.floor(diff / 3_600_000)} س`;
  return d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
}
