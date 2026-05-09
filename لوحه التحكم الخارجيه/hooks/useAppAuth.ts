import { useState } from 'react';
import { User, AppNotification } from '../types';
import { authService } from '../services/authService';
import { db } from '../services/db';

interface UseAppAuthProps {
    onLoginNavigate: () => void;
    onLogoutNavigate: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
}

export function useAppAuth({ onLoginNavigate, onLogoutNavigate, showToast, addNotification }: UseAppAuthProps) {
    // --- AUTH STATE ---
    const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
    const [authView, setAuthView] = useState<'landing' | 'login' | 'signup' | 'forgot-password'>('landing');
    const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // --- HANDLERS ---
    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);

        // Check if new user needs onboarding
        const onboardingComplete = localStorage.getItem(`onboarding_${user.id}`);
        if (!onboardingComplete) {
            setShowOnboarding(true);
        }

        onLoginNavigate(); // Navigate to home usually

        if (user.targetLanguage) {
            showToast(
                user.targetLanguage === 'de' ? 'تم تفعيل وضع اللغة الألمانية 🇩🇪' : 'تم تفعيل وضع اللغة الإنجليزية 🇬🇧',
                'success'
            );
        }
    };

    const handleOnboardingComplete = (userName: string) => {
        setShowOnboarding(false);
        if (currentUser) {
            localStorage.setItem(`onboarding_${currentUser.id}`, 'true');
            // Start the user on a high note with a celebration
            addNotification({
                type: 'system',
                title: 'تم إعداد حسابك بنجاح! 🎉',
                message: 'استناداً لإجاباتك، قمنا بتخصيص خطة التعلم المناسبة لك.',
                icon: 'check-circle'
            });
        }
    };

    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
        setAuthView('landing');
        onLogoutNavigate(); // Reset view/tabs
    };

    const updateCurrentUser = (updates: Partial<User>) => {
        if (!currentUser) return;
        const updated = { ...currentUser, ...updates };
        setCurrentUser(updated);
        authService.saveUser(updated);
        if (updated.targetLanguage) {
            // Trigger any side effects if needed, usually AppData watches this
            db.save('auth_session', updated);
        }
    };

    return {
        currentUser, setCurrentUser,
        authView, setAuthView,
        isAdminAuthModalOpen, setIsAdminAuthModalOpen,
        isAdminAuthenticated, setIsAdminAuthenticated,
        showOnboarding, setShowOnboarding,
        handleLoginSuccess,
        handleOnboardingComplete,
        handleLogout,
        updateCurrentUser
    };
}
