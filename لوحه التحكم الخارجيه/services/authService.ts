
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseConfigValid } from './firebase';
import { User } from '../types';
import { db as localDb } from './db';

const mapFirebaseUser = (fbUser: FirebaseUser): User => {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    avatar: fbUser.photoURL || undefined,
    token: '',
    plan: 'free',
    targetLanguage: 'en'
  };
};

const MOCK_USER: User = {
  id: 'guest_user',
  email: 'guest@hcardpro.com',
  name: 'ضيف (Demo Mode)',
  avatar: undefined,
  token: 'mock_token',
  plan: 'pro',
  targetLanguage: 'en'
};

const isConfigError = (error: any) => {
  const code = error.code || '';
  const message = error.message || '';
  return code === 'auth/invalid-api-key' ||
    code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
    code === 'auth/internal-error' ||
    code === 'auth/configuration-not-found' ||
    code === 'auth/project-not-found' ||
    message.includes('apiKey') ||
    message.includes('api-key');
};

export const authService = {
  isMockMode: !isFirebaseConfigValid,

  // Login with Email
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    if (!isFirebaseConfigValid) {
      const user = { ...MOCK_USER, email, name: email.split('@')[0] };
      localDb.save('auth_session', user);
      return { success: true, user };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = mapFirebaseUser(userCredential.user);
      localDb.save('auth_session', user);
      return { success: true, user };
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      if (isConfigError(error)) {
        const user = MOCK_USER;
        localDb.save('auth_session', user);
        return { success: true, user };
      }
      let msg = 'فشل تسجيل الدخول';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      if (error.code === 'auth/wrong-password') msg = 'كلمة المرور غير صحيحة';
      return { success: false, error: msg };
    }
  },

  // Signup with Email
  signup: async (name: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    if (!isFirebaseConfigValid) {
      const user = { ...MOCK_USER, id: 'mock_' + Date.now(), name, email };
      localDb.save('auth_session', user);
      return { success: true, user };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      const user = mapFirebaseUser(userCredential.user);
      user.name = name;
      localDb.save('auth_session', user);
      return { success: true, user };
    } catch (error: any) {
      console.error("Signup Error:", error);
      if (isConfigError(error)) {
        const user = { ...MOCK_USER, name, email };
        localDb.save('auth_session', user);
        return { success: true, user };
      }
      let msg = 'فشل إنشاء الحساب';
      if (error.code === 'auth/email-already-in-use') msg = 'البريد الإلكتروني مستخدم بالفعل';
      if (error.code === 'auth/weak-password') msg = 'كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل)';
      if (error.code === 'auth/invalid-email') msg = 'البريد الإلكتروني غير صالح';
      return { success: false, error: msg };
    }
  },

  // Login with Google
  loginWithGoogle: async (): Promise<User> => {
    if (!isFirebaseConfigValid) {
      localDb.save('auth_session', MOCK_USER);
      return MOCK_USER;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = mapFirebaseUser(result.user);
      localDb.save('auth_session', user);
      return user;
    } catch (error: any) {
      if (isConfigError(error)) {
        localDb.save('auth_session', MOCK_USER);
        return MOCK_USER;
      }
      throw new Error('Google Sign-In Failed');
    }
  },

  // Logout
  logout: async () => {
    try {
      if (isFirebaseConfigValid) await signOut(auth);
    } catch (error) { }
    localStorage.removeItem('hcard_auth_session');
  },

  // Get Current User
  getCurrentUser: (): User | null => {
    return localDb.load<User | null>('auth_session', null);
  },

  // Save User
  saveUser: (user: User) => {
    localDb.save('auth_session', user);
  },

  // Listener setup
  onAuthChange: (callback: (user: User | null) => void) => {
    if (!isFirebaseConfigValid) {
      const u = localDb.load<User | null>('auth_session', null);
      callback(u);
      return () => { };
    }
    try {
      return onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const user = mapFirebaseUser(fbUser);
          localDb.save('auth_session', user);
          callback(user);
        } else {
          localStorage.removeItem('hcard_auth_session');
          callback(null);
        }
      });
    } catch (e) {
      const u = localDb.load<User | null>('auth_session', null);
      callback(u);
      return () => { };
    }
  }
};
