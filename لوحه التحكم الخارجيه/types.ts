
export type Language = 'ar' | 'en' | 'de';
export type AppTheme = 'standard' | 'ramadan' | 'eid_fitr' | 'eid_adha' | 'victory_october' | 'winter' | 'summer' | 'school' | 'custom';

export type InspirationalIcon =
  | 'BookOpen' | 'Scroll' | 'Lightbulb' | 'Feather' | 'Sparkles'
  | 'Star' | 'Moon' | 'Heart' | 'Sun' | 'Flame'
  | 'GraduationCap' | 'Globe' | 'Compass' | 'Leaf' | 'Zap';

export interface InspirationalSlide {
  id: string;
  text: string;
  source: string;
  gradient: string;  // Tailwind gradient e.g. "from-emerald-600 via-teal-500 to-emerald-700"
  icon: InspirationalIcon;
  createdAt: number;
}

export interface ThemeSchedule {
  id: string;
  theme: AppTheme;
  startDate: string; // ISO Date String
  endDate: string;   // ISO Date String
  isActive: boolean;
}

export interface CustomThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  icon?: string; // Base64 or URL
  effect?: 'stars' | 'confetti' | 'snow' | 'fireworks' | 'bubbles' | 'petals' | 'lightning' | 'leaves' | 'none';
  soundUrl?: string; // Optional ambient sound
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  token?: string;
  plan: 'free' | 'pro' | 'enterprise';
  targetLanguage?: 'en' | 'de' | 'ar';
  selectedTheme?: AppTheme; // Theme preference
  startLevel?: 'beginner' | 'intermediate' | 'advanced' | string;
  age?: number;
  gender?: 'male' | 'female';
}

export interface LanguageAvailability {
  en: boolean;
  de: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string; // Tailwind color class e.g. 'bg-blue-500'
  createdAt: number;
  isSystem?: boolean; // If true, regular users cannot delete this
  parentId?: string; // Support for nested folders
  /** لغة/وجهة حفظ المحتوى (لوحة المسئول) */
  contentLang?: 'en' | 'de' | 'both';
}

export interface Card {
  id: string;
  folderId: string; // Link card to a folder
  frontText: string;
  frontImage?: string; // Base64
  frontImageFit?: 'wide' | 'portrait';
  backText: string;
  backImage?: string; // Base64
  createdAt: number;
  nextReview: number; // Timestamp
  interval: number; // In minutes
  reviews: number; // Total review count
  easeFactor: number; // SRS multiplier (default 2.5)
  status: 'new' | 'learning' | 'review' | 'mastered';
  isSystem?: boolean; // Inherited from folder usually
  lastGrade?: SRSGrade; // Track the last grade given in this session (for stats)
  dueTimeInSession?: number; // Timestamp when this card should reappear in current session
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'text-input' | 'checkbox' | 'order' | 'open' | 'note';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  image?: string; // Legacy: kept for backward compatibility
  options?: string[]; // For MC, Checkbox, Order
  correctAnswer?: string | string[] | boolean; // Flexible type based on question kind
  explanation?: string;

  // New Rich Media Support
  mediaType?: 'image' | 'video' | 'audio' | 'none';
  mediaUrl?: string;
}

export type GameType = 'word_match' | 'sentence_builder' | 'listening';

export interface GameQuestion {
  id: string;
  prompt: string;
  answer: string;
  translation?: string | null;
  options?: string[];
  tokens?: string[];
  audioText?: string | null;
  explanation?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface GameSet {
  id: string;
  lang: 'en' | 'de';
  type: GameType;
  title: string;
  description: string;
  level: string;
  subLevel?: string | null;
  icon?: string | null;
  color: string;
  xpReward: number;
  timeLimitSeconds: number;
  isActive: boolean;
  questionCount?: number;
  questions?: GameQuestion[];
}

export interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  translation?: string; // Arabic translation
  image: string;
  level: string; // Changed to string to support 'A1', 'A2', etc.
  subLevel?: string; // Optional sub-level (e.g., 'A1.1', 'A1.2')
  isSystem?: boolean; // If created by admin
  questions?: Question[]; // New field for quiz

  // Enhanced fields for professional features
  wordCount?: number; // Total word count
  estimatedReadingTime?: number; // In minutes
  difficulty?: number; // 1-10 scale
  tags?: string[]; // For categorization (e.g., 'adventure', 'history', 'fiction')
  isFavorite?: boolean; // User's favorite status
  readingProgress?: number; // 0-100 percentage
  lastReadAt?: number; // Timestamp of last read
  viewCount?: number; // Number of times viewed (mock data)
  createdAt?: string | null; // API creation date for stable ordering
  contentDirection?: 'auto' | 'rtl' | 'ltr';
  translationDirection?: 'auto' | 'rtl' | 'ltr';
}

export interface ReviewLog {
  date: number;
  count: number;
}

export enum SRSGrade {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3,
}

export interface SessionResults {
  totalReviewed: number;
  breakdown: {
    [SRSGrade.AGAIN]: number;
    [SRSGrade.HARD]: number;
    [SRSGrade.GOOD]: number;
    [SRSGrade.EASY]: number;
  };
  score: number; // Total points calculated
  hardestCards: Card[]; // Cards marked as AGAIN or HARD
  startTime: number;
  endTime: number;
}

export interface Stats {
  totalCards: number;
  reviewedToday: number;
  streak: number;
  successRate: number;
  byStatus: {
    new: number;
    learning: number;
    review: number;
    mastered: number;
    completedStoryIds?: string[]; // Added: Track finished stories
  };
  quizStats?: {
    totalQuizzes: number;
    averageScore: number;
  }
}

export type Translation = any; // Simplifying for TS

// --- Learning Path Types ---
export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'video';
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g. "5 min"
  level?: string;
  content?: string; // HTML/Markdown string for the lesson content
  image?: string;

  // Multimedia Support
  videoUrl?: string; // YouTube/Vimeo
  audioUrl?: string; // MP3 Link
  resources?: Resource[]; // PDFs or Links

  questions?: Question[];
  ratingSummary?: LessonRatingSummary;
  // Calculated at runtime, not stored
  isLocked?: boolean;
  isCompleted?: boolean;
}

export interface Module {
  id: string;
  title: string;
  level: string; // 'A1', 'A2', 'B1', etc.
  subLevel: string; // 'A1.1', 'A1.2', etc.
  lessons: Lesson[];
}

// --- Dictionary Types ---
export interface Phonetic {
  text: string;
  audio?: string;
}

export interface Definition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
  sourceUrls: string[];
}

export interface StoryBookmark {
  id: string;
  storyId: string;
  wordIndex: number;
  note?: string;
  createdAt: number;
}

export interface StoryStats {
  totalStoriesRead: number;
  totalReadingTime: number; // In minutes
  favoriteStories: string[];
  bookmarks: StoryBookmark[];
  completedByLevel: {
    Beginner: number;
    Intermediate: number;
    Advanced: number;
  };
}

export interface AppNotification {
  id: string;
  type: 'achievement' | 'reminder' | 'milestone' | 'system' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: 'trophy' | 'star' | 'target' | 'book' | 'gift' | 'clock' | 'bell' | 'check-circle' | 'alert-circle';
}

// ============================================
// GAMIFICATION TYPES
// ============================================

// Streak System
export interface StreakDay {
  date: string; // YYYY-MM-DD
  completed: boolean;
  frozen?: boolean;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActivityDate: string; // YYYY-MM-DD
  freezes: number; // Available freezes
  maxFreezes: number; // Max freezes allowed (default 3)
  history: StreakDay[]; // Last 30 days
}

// Daily Goals
export type DailyGoalType = 'cards' | 'lessons' | 'quiz' | 'story' | 'time';

export interface DailyGoal {
  id: string;
  type: DailyGoalType;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: {
    xp: number;
    coins?: number;
  };
  completed: boolean;
}

export interface DailyGoalsState {
  date: string; // YYYY-MM-DD
  goals: DailyGoal[];
  completedCount: number;
}

// Achievements
export type AchievementCategory = 'learning' | 'streak' | 'cards' | 'social' | 'hidden';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  icon: string; // Emoji or icon name
  rarity: AchievementRarity;
  requirement: {
    type: string; // e.g., 'lessons_completed', 'streak_days', 'cards_reviewed'
    value: number;
  };
  reward: {
    xp: number;
    coins?: number;
  };
  progress?: number; // Current progress (0-100)
  unlockedAt?: string; // ISO timestamp when unlocked
  isHidden?: boolean; // Hidden until unlocked
}

// User Gamification Stats
export type UserRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';

export interface UserGameStats {
  totalXP: number;
  level: number;
  coins: number;
  rank: UserRank;
  xpToNextLevel: number;
}

export interface UserGamificationData {
  streak: StreakData;
  dailyGoals: DailyGoalsState;
  achievements: Achievement[];
  stats: UserGameStats;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface ActivityLog {
  id: string;
  userId: string;
  action: 'login' | 'study_session' | 'quiz_completed' | 'story_read' | 'sign_up' | 'video_watched';
  details: string;
  timestamp: string; // ISO date string
  section?: 'stories' | 'cards' | 'audio' | 'profile' | 'dashboard' | 'settings';
}

export interface UserAnalyticsProfile extends User {
  joinDate: string; // ISO date string
  lastActive: string; // ISO date string
  totalTimeSpent: number; // in minutes
  timeBySection: {
    stories: number;
    cards: number;
    audio: number;
    quizzes: number;
  };
  age: number;
  gender: 'male' | 'female';
  device: 'mobile' | 'desktop' | 'tablet';
  location: string;
  engagementScore: number; // 0-100 calculated score
  recentActivity: ActivityLog[];
  startLevel?: string;
  currentLevel: string;
}


export interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  avgSessionDuration: number; // minutes
  genderDistribution: { male: number; female: number };
  ageDistribution: {
    under18: number;
    youngAdults: number; // 18-24
    adults: number; // 25-34
    middleAged: number; // 35-50
    seniors: number; // 50+
  };
}

// ============================================
// MARKETING TYPES
// ============================================

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  expiryDate?: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  type: 'popup' | 'banner';
  relatedCouponCode?: string;
  expiryDate?: string | null;
  backgroundColor?: string;
  textColor?: string;
}

// ============================================
// ADVANCED ANALYTICS TYPES
// ============================================

export interface StoryPerformance {
  id: string;
  title: string;
  views: number;
  completions: number;
  completionRate: number; // Percentage
  avgTimeSpent: number; // Minutes
  likes: number;
}

export interface QuestionPerformance {
  id: string;
  storyTitle: string;
  questionText: string;
  errorRate: number; // Percentage of wrong answers
  attempts: number;
  difficulty: 'Easy' | 'Medium' | 'Hard'; // Calculated based on error rate
}

export interface RetentionMetric {
  date: string; // YYYY-MM-DD
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  retentionRate: number; // Percentage
}

export interface LessonRatingSatisfaction {
  status: 'insufficient' | 'excellent' | 'very_good' | 'average' | 'weak' | 'very_bad';
  label: string;
  color: 'gray' | 'green' | 'emerald' | 'amber' | 'orange' | 'red';
  description?: string;
}

export interface LessonRatingSummary {
  averageRating: number;
  ratingsCount: number;
  distribution: Record<'5' | '4' | '3' | '2' | '1', number>;
  satisfaction: LessonRatingSatisfaction;
}

export interface LessonRatingPerformance extends LessonRatingSummary {
  lang: 'en' | 'de';
  lessonId: string;
  lessonTitle: string;
  moduleId?: string | null;
  moduleTitle?: string | null;
}

export interface LessonRatingsAnalytics {
  overview: {
    totalRatings: number;
    ratedLessons: number;
    averageRating: number;
    satisfaction: LessonRatingSatisfaction;
    bestLesson: LessonRatingPerformance | null;
    lowestLesson: LessonRatingPerformance | null;
    minimumReliableRatings: number;
  };
  lessons: LessonRatingPerformance[];
}

export interface AnalyticsDashboardData {
  overview: {
    totalStudents: number;
    activeNow: number;
    completionRateAvg: number;
    totalTimeSpent: number; // Hours
  };
  topStories: StoryPerformance[];
  difficultQuestions: QuestionPerformance[];
  retention: RetentionMetric[];
  lessonRatings?: LessonRatingsAnalytics;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'system';
  icon: 'bell' | 'star' | 'trophy' | 'gift' | 'alert-circle';
  sentAt: string; // ISO string
  targetAudience: 'all' | 'active' | 'inactive';
  expiresAt?: string; // Optional expiration
}




// ============================================
// SUBSCRIPTION TYPES
// ============================================

export interface PlanFeature {
  text: string;
  subText?: string;
  isEnabled: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  theme: 'amber' | 'blue' | 'purple' | 'red' | 'green';
  isPopular?: boolean;
  features: PlanFeature[];
}

// ============================================
// SUPPORT & TICKETS TYPES
// ============================================


export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string; // ISO string
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string; // ISO string
  lastUpdate: string; // ISO string
  messages: TicketMessage[];
}

// ============================================
// MEDIA LIBRARY TYPES
// ============================================

export interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string; // The text URL (not Base64)
  size: number; // In bytes
  uploadedAt: string; // ISO string
  dimensions?: { width: number; height: number };
}

export interface CardImageAsset {
  id: string;
  lang: 'en' | 'de';
  arLabel: string;
  targetWord: string;
  imageUrl: string;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}


// ============================================
// SENTENCES / CONVERSATIONS TYPES
// ============================================

export interface SentenceItem {
  id: string;
  original: string; // The sentence in target language
  translation: string;
  transliteration?: string;
  audioUrl?: string; // Optional audio override
  notes?: string;
}

export interface SentenceTopic {
  id: string;
  sentenceLang?: 'en' | 'de' | 'both';
  level: string; // A1, A2...
  subLevel: string; // A1.1, A1.2...
  title: string;
  description: string;
  image: string; // URL or gradient class
  icon?: string; // Optional lucide-react icon name
  progress: number; // 0-100 logic handled by app
  color: string;

  // Content
  mediaType: 'image' | 'video' | 'none';
  mediaUrl?: string; // URL for the video/image in detail view

  sentences: SentenceItem[];
  grammarNotes?: string; // HTML/Markdown

  quizQuestions?: Question[];
}
