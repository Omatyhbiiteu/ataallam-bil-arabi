
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: Replace these with your actual Firebase project keys
// For now, these are placeholders. You must update them for the backend to work.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const invalidValues = new Set([
  "",
  "YOUR_API_KEY",
  "your_api_key",
  "your-project-id",
  "your-project.firebaseapp.com",
  "your-project-id.appspot.com",
  "your_sender_id",
  "your_app_id",
  "123456789",
  "1:123456789:web:abcdef",
]);

export const isFirebaseConfigValid =
  !invalidValues.has(firebaseConfig.apiKey) &&
  !invalidValues.has(firebaseConfig.authDomain) &&
  !invalidValues.has(firebaseConfig.projectId) &&
  !invalidValues.has(firebaseConfig.storageBucket) &&
  !invalidValues.has(firebaseConfig.messagingSenderId) &&
  !invalidValues.has(firebaseConfig.appId);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
