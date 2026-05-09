
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db as firestore } from './firebase';
import { auth } from './firebase';

// Data Layer - Hybrid System
// 1. Always reads/writes to LocalStorage for instant UI updates (Optimistic UI).
// 2. If logged in, syncs changes to Firestore in the background.

const PREFIX = 'hcard_';

export const db = {
  save: async (key: string, data: any, scope?: string): Promise<{ success: boolean, error?: string }> => {
    try {
      const finalKey = scope ? `${scope}_${key}` : key;
      // 1. Local Save
      if (typeof window !== 'undefined') {
        const serialized = JSON.stringify(data);
        localStorage.setItem(PREFIX + finalKey, serialized);
      }

      // 2. Cloud Sync (if user is logged in)
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        await setDoc(userDocRef, { [finalKey]: data }, { merge: true });
      }

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
