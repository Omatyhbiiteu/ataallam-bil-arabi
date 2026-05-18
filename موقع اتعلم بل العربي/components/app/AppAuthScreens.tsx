import { Dispatch, SetStateAction } from 'react';
import { ForgotPasswordView } from '../ForgotPasswordView';
import { LandingPage } from '../LandingPage';
import { LoginView } from '../LoginView';
import { SignupView } from '../SignupView';
import { LanguageAvailability, User } from '../../types';

type AuthView = 'landing' | 'login' | 'signup' | 'forgot-password';

type AppAuthScreensProps = {
  authView: string;
  dir: 'rtl' | 'ltr';
  darkMode: boolean;
  animationsEnabled: boolean;
  langAvailability: LanguageAvailability;
  forgotPasswordPrefillEmail: string;
  toggleTheme: () => void;
  setAuthView: Dispatch<SetStateAction<any>>;
  setForgotPasswordPrefillEmail: Dispatch<SetStateAction<string>>;
  onLoginSuccess: (user: User) => void;
};

export function AppAuthScreens({
  authView,
  dir,
  darkMode,
  animationsEnabled,
  langAvailability,
  forgotPasswordPrefillEmail,
  toggleTheme,
  setAuthView,
  setForgotPasswordPrefillEmail,
  onLoginSuccess,
}: AppAuthScreensProps) {
  const view = authView as AuthView;

  if (view === 'landing') {
    return (
      <LandingPage
        onLoginClick={() => setAuthView('login')}
        isDarkMode={darkMode}
        toggleTheme={toggleTheme}
        animationsEnabled={animationsEnabled}
      />
    );
  }

  if (view === 'signup') {
    return (
      <div className="font-sans" dir={dir}>
        <SignupView
          onSignupSuccess={onLoginSuccess}
          onNavigateToLogin={() => setAuthView('login')}
          onBackToHome={() => setAuthView('landing')}
          isDarkMode={darkMode}
          toggleTheme={toggleTheme}
          langAvailability={langAvailability}
        />
      </div>
    );
  }

  if (view === 'forgot-password') {
    return (
      <div className="font-sans" dir={dir}>
        <ForgotPasswordView
          onBackToLogin={() => setAuthView('login')}
          onBackToHome={() => setAuthView('landing')}
          isDarkMode={darkMode}
          toggleTheme={toggleTheme}
          initialEmail={forgotPasswordPrefillEmail}
        />
      </div>
    );
  }

  return (
    <div className="font-sans" dir={dir}>
      <LoginView
        onLoginSuccess={onLoginSuccess}
        onBackToHome={() => setAuthView('landing')}
        onNavigateToSignup={() => setAuthView('signup')}
        onForgotPassword={(emailFromField) => {
          setForgotPasswordPrefillEmail(emailFromField);
          setAuthView('forgot-password');
        }}
        isDarkMode={darkMode}
        toggleTheme={toggleTheme}
        langAvailability={langAvailability}
      />
    </div>
  );
}
