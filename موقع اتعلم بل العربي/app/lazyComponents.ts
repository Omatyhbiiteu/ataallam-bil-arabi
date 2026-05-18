import React from 'react';

export const StoriesView = React.lazy(() => import('../components/StoriesView').then(m => ({ default: m.StoriesView })));
export const FoldersView = React.lazy(() => import('../components/FoldersView').then(m => ({ default: m.FoldersView })));
export const SettingsView = React.lazy(() => import('../components/SettingsView').then(m => ({ default: m.SettingsView })));
export const ReviewSession = React.lazy(() => import('../components/ReviewSession').then(m => ({ default: m.ReviewSession })));

export const LearningPathView = React.lazy(() => import('../components/LearningPathView').then(m => ({ default: m.LearningPathView })));
export const DictionaryView = React.lazy(() => import('../components/DictionaryView').then(m => ({ default: m.DictionaryView })));
export const AIAssistantView = React.lazy(() => import('../components/AIAssistantView').then(m => ({ default: m.AIAssistantView })));
export const HomeView = React.lazy(() => import('../components/HomeView').then(m => ({ default: m.HomeView })));
export const SentencesView = React.lazy(() => import('../components/sentences/SentencesView').then(m => ({ default: m.SentencesView })));
export const CommunityView = React.lazy(() => import('../components/CommunityView').then(m => ({ default: m.CommunityView })));
export const GamesView = React.lazy(() => import('../components/GamesView').then(m => ({ default: m.GamesView })));
export const NotificationDrawer = React.lazy(() => import('../components/NotificationDrawer').then(m => ({ default: m.NotificationDrawer })));

export const PromoPopupLazy = React.lazy(() => import('../components/PromoPopup').then(m => ({ default: m.PromoPopup })));
export const ThemeVisuals = React.lazy(() => import('../components/ThemeVisuals').then(m => ({ default: m.ThemeVisuals })));
export const OnboardingWizard = React.lazy(() => import('../components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
export const InteractiveTour = React.lazy(() => import('../components/InteractiveTour').then(m => ({ default: m.InteractiveTour })));
