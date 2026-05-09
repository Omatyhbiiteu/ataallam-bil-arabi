
import { User } from '../types';
import { db as localDb } from './db';
import { AuthAPI } from './apiClient';
import { auth, isFirebaseConfigValid } from './firebase';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const USER_TOKEN_KEY = 'hcard_user_token';

export const authService = {
  isMockMode: false,

  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const result = await AuthAPI.login({ email, password });
      const token = result?.token as string | undefined;
      const user = result?.user as User | undefined;
      if (!token || !user) {
        return { success: false, error: 'فشل تسجيل الدخول' };
      }
      localStorage.setItem(USER_TOKEN_KEY, token);
      localStorage.setItem('auth_token', token);
      localDb.save('auth_session', user);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error?.message || 'فشل تسجيل الدخول' };
    }
  },

  signup: async (name: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const result = await AuthAPI.register({ name, email, password });
      const token = result?.token as string | undefined;
      const user = result?.user as User | undefined;
      if (!token || !user) {
        return { success: false, error: 'فشل إنشاء الحساب' };
      }
      localStorage.setItem(USER_TOKEN_KEY, token);
      localStorage.setItem('auth_token', token);
      localDb.save('auth_session', user);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error?.message || 'فشل إنشاء الحساب' };
    }
  },

  loginWithGoogle: async (): Promise<User> => {
    if (!isFirebaseConfigValid) {
      throw new Error('Google غير مفعّل: أضف مفاتيح Firebase في ملف .env ثم أعد تشغيل المشروع');
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;
    if (!email) {
      throw new Error('تعذر الحصول على البريد من Google');
    }
    const response = await AuthAPI.socialRegister({
      provider: 'google',
      email,
      name: result.user.displayName || email.split('@')[0],
      avatar: result.user.photoURL || null,
    });
    const token = response?.token as string | undefined;
    const user = response?.user as User | undefined;
    if (!token || !user) {
      throw new Error('تعذر إنشاء الحساب عبر Google');
    }
    localStorage.setItem(USER_TOKEN_KEY, token);
    localStorage.setItem('auth_token', token);
    localDb.save('auth_session', user);
    await signOut(auth).catch(() => { });
    return user;
  },

  loginWithFacebook: async (): Promise<User> => {
    if (!isFirebaseConfigValid) {
      throw new Error('Facebook غير مفعّل: أضف مفاتيح Firebase في ملف .env ثم أعد تشغيل المشروع');
    }
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;
    if (!email) {
      throw new Error('فيسبوك لم يرسل البريد الإلكتروني. تأكد من صلاحيات الحساب.');
    }
    const response = await AuthAPI.socialRegister({
      provider: 'facebook',
      email,
      name: result.user.displayName || email.split('@')[0],
      avatar: result.user.photoURL || null,
    });
    const token = response?.token as string | undefined;
    const user = response?.user as User | undefined;
    if (!token || !user) {
      throw new Error('تعذر إنشاء الحساب عبر Facebook');
    }
    localStorage.setItem(USER_TOKEN_KEY, token);
    localStorage.setItem('auth_token', token);
    localDb.save('auth_session', user);
    await signOut(auth).catch(() => { });
    return user;
  },

  logout: async () => {
    try { await AuthAPI.logout(); } catch (_) { }
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('hcard_auth_session');
  },

  deleteAccount: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await AuthAPI.deleteAccount();
    } catch (error: any) {
      return { success: false, error: error?.message || 'فشل حذف الحساب' };
    }
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('hcard_auth_session');
    localDb.save('auth_session', null);
    return { success: true };
  },

  getCurrentUser: (): User | null => {
    return localDb.load<User | null>('auth_session', null);
  },

  saveUser: (user: User) => {
    localDb.save('auth_session', user);
  },

  updateProfile: async (updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const result = await AuthAPI.updateProfile({
        name: updates.name,
        targetLanguage: updates.targetLanguage,
        age: updates.age,
        gender: updates.gender,
        startLevel: updates.startLevel,
        avatar: updates.avatar,
      });
      const user = result?.user as User | undefined;
      if (!user) {
        return { success: false, error: 'فشل تحديث البيانات' };
      }
      localDb.save('auth_session', user);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error?.message || 'فشل تحديث البيانات' };
    }
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    const token = localStorage.getItem(USER_TOKEN_KEY) || localStorage.getItem('auth_token');
    if (!token) {
      callback(null);
      return () => { };
    }
    AuthAPI.me()
      .then((res: any) => {
        if (res?.user) {
          localDb.save('auth_session', res.user);
          callback(res.user);
          return;
        }
        callback(null);
      })
      .catch(() => callback(null));
    return () => { };
  }
};
