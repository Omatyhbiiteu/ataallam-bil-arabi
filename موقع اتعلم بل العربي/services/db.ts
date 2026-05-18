
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db as firestore } from './firebase';
import { auth } from './firebase';

// Data Layer - Hybrid System
// 1. Always reads/writes to LocalStorage for instant UI updates (Optimistic UI).
// 2. If logged in, syncs changes to Firestore in the background.

const PREFIX = 'hcard_';
const STORAGE_VERSION_KEY = `${PREFIX}storage_version`;
const STORAGE_VERSION = 'clean-db-2026-05-17-v1';

function clearStaleLocalCache(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(STORAGE_VERSION_KEY) === STORAGE_VERSION) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX) && key !== STORAGE_VERSION_KEY)
      .forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  } catch (e) {
    console.warn('Local cache reset skipped:', e);
  }
}

clearStaleLocalCache();

/** نطاق تخزين التقدّم: لكل مستخدم ولغة تعلّم — يمنع مشاركة القصص/البطاقات بين حسابات على نفس الجهاز */
export function progressStorageScope(userId: string | undefined, lang: 'en' | 'de'): string {
  if (userId) return `${userId}_${lang}`;
  return `_guest_${lang}`;
}

const LEGACY_PROGRESS_KEYS = [
  'folders', 'cards', 'stories', 'curriculum', 'sentence_topics', 'quiz_stats', 'review_log',
  'completed_stories', 'completed_lessons', 'notifications', 'daily_goal', 'study_plan',
  'daily_mission',
] as const;

/** نسخ مفاتيح التقدّم القديمة (en_* / de_* فقط) إلى hcard_{userId}_{lang}_* */
export function migrateLegacyProgressKeys(userId: string, lang: 'en' | 'de'): void {
  if (typeof window === 'undefined' || !userId) return;
  const newScope = `${userId}_${lang}`;
  const oldScope = lang;
  for (const k of LEGACY_PROGRESS_KEYS) {
    const newKey = PREFIX + `${newScope}_${k}`;
    const oldKey = PREFIX + `${oldScope}_${k}`;
    if (localStorage.getItem(newKey) == null && localStorage.getItem(oldKey) != null) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey)!);
    }
  }
}

function getLaravelUserIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + 'auth_session');
    if (!raw || raw === 'null') return null;
    const u = JSON.parse(raw) as { id?: string };
    return u?.id != null && u.id !== '' ? String(u.id) : null;
  } catch {
    return null;
  }
}

/** مزامنة Firebase في الخلفية — لا تُستخدم await عليها في مسارات الحفظ الحرجة حتى لا تعلّق الواجهة إذا تعطلت الشبكة. */
function syncFirestoreBestEffort(finalKey: string, data: unknown): void {
  void (async () => {
    try {
      const laravelId = getLaravelUserIdFromStorage();
      if (laravelId) {
        const userDocRef = doc(firestore, 'user_progress', laravelId);
        await setDoc(userDocRef, { [finalKey]: data }, { merge: true });
        return;
      }
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        await setDoc(userDocRef, { [finalKey]: data }, { merge: true });
      }
    } catch (e) {
      console.warn(`Firestore sync skipped (${finalKey}):`, e);
    }
  })();
}

export const db = {
  save: async (key: string, data: any, scope?: string): Promise<{ success: boolean, error?: string }> => {
    try {
      const finalKey = scope ? `${scope}_${key}` : key;
      // 1. Local Save
      if (typeof window !== 'undefined') {
        const serialized = JSON.stringify(data);
        const storageKey = PREFIX + finalKey;
        if (localStorage.getItem(storageKey) !== serialized) {
          localStorage.setItem(storageKey, serialized);
        }
      }

      // 2. Cloud Sync — لا ننتظرها؛ كانت await setDoc تعلّق «جاري الحفظ» عند بطء/تعطل Firebase
      syncFirestoreBestEffort(finalKey, data);

      return { success: true };
    } catch (e: any) {
      console.error(`DB Save Error (${key}):`, e);
      if (e.name === 'QuotaExceededError') {
        return { success: false, error: 'QUOTA_EXCEEDED' };
      }
      return { success: false, error: e.message };
    }
  },

  load: <T>(key: string, defaultValue: T, scope?: string): T => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const finalKey = scope ? `${scope}_${key}` : key;
      const saved = localStorage.getItem(PREFIX + finalKey);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.error(`DB Load Error (${key}):`, e);
      return defaultValue;
    }
  },

  // Explicit method to pull data from cloud on login
  pullFromCloud: async (uid: string) => {
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Update LocalStorage with Cloud Data
        Object.keys(data).forEach(key => {
          localStorage.setItem(PREFIX + key, JSON.stringify(data[key]));
        });
        return { success: true, data };
      }
      return { success: true, data: null };
    } catch (e) {
      console.error("Cloud Pull Error:", e);
      return { success: false };
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error("DB Clear Error", e);
    }
  }
};
