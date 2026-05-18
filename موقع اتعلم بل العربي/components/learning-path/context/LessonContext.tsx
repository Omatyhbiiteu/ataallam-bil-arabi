import React, { createContext, useContext, ReactNode } from 'react';
import { Lesson } from '../../../types';

interface Note {
    id: string;
    lessonId: string;
    content: string;
    timestamp: number;
}

interface LessonContextType {
    activeLesson: Lesson;
    activeLessonIndex: number;
    timeSpent: number;
    isBookmarked: boolean;
    isLastLessonInLevel: boolean;
    lessonNotes: Note[];
    lessonRating?: { rating: number, comment?: string };
    // Actions
    onClose: () => void;
    onPrevLesson: () => void;
    onToggleBookmark: () => void;
    onAddNote: (content: string) => void;
    onDeleteNote: (id: string) => void;
    onComplete: (lessonId: string, score?: number) => void;
    onRateLesson: (rating: number) => void;
    speakText: (text: string) => void;
    // Utils
    t: any;
    dir?: string;
    formatTimeSpent: (seconds: number) => string;
}

const LessonContext = createContext<LessonContextType | undefined>(undefined);

export const useLessonContext = () => {
    const context = useContext(LessonContext);
    if (!context) {
        throw new Error('useLessonContext must be used within a LessonProvider');
    }
    return context;
};

interface LessonProviderProps extends LessonContextType {
    children: ReactNode;
}

export const LessonProvider: React.FC<LessonProviderProps> = ({ children, ...props }) => {
    return (
        <LessonContext.Provider value={props}>
            {children}
        </LessonContext.Provider>
    );
};
