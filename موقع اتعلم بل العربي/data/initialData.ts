// ============================================================
// initialData.ts — re-exports from split data files
// تم تقسيم هذا الملف لملفات أصغر لتحسين الأداء
// ============================================================

export { INITIAL_STORIES_EN, INITIAL_STORIES_DE } from './storiesData';
export { INITIAL_CURRICULUM_EN, INITIAL_CURRICULUM_DE } from './curriculumData';
export { INITIAL_SENTENCE_TOPICS } from './sentencesData';
export { INITIAL_TICKETS } from './ticketsData';
import { Folder, Card } from '../types';

// --- INITIAL FOLDERS ---
export const INITIAL_FOLDERS_EN: Folder[] = [
    { id: 'system_en_1', name: 'Common Words (System)', color: 'bg-green-500', createdAt: Date.now(), isSystem: true },
    { id: 'default_en', name: 'My English Cards', color: 'bg-blue-500', createdAt: Date.now() }
];

export const INITIAL_FOLDERS_DE: Folder[] = [
    { id: 'system_de_1', name: 'Häufige Wörter (System)', color: 'bg-green-500', createdAt: Date.now(), isSystem: true },
    { id: 'default_de', name: 'Meine deutschen Karten', color: 'bg-red-500', createdAt: Date.now() }
];

// --- INITIAL CARDS ---
export const INITIAL_CARDS_EN: Card[] = [
    { id: 'en_1', folderId: 'default_en', frontText: 'مرحباً', backText: 'Hello', createdAt: Date.now(), nextReview: Date.now() - 10000, interval: 0, reviews: 0, easeFactor: 2.5, status: 'new' }
];

export const INITIAL_CARDS_DE: Card[] = [
    { id: 'de_1', folderId: 'default_de', frontText: 'مرحباً', backText: 'Hallo', createdAt: Date.now(), nextReview: Date.now() - 10000, interval: 0, reviews: 0, easeFactor: 2.5, status: 'new' }
];
