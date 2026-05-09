import { Module } from '../types';

export const INITIAL_CURRICULUM_EN: Module[] = [
    {
        id: 'mod-en-1',
        title: 'English Basics (أساسيات الإنجليزية)',
        level: 'A1',
        subLevel: 'A1.1',
        lessons: [
            { id: 'l-en-1', title: 'The Alphabet', description: 'Learn the ABCs.', duration: '10 min', content: 'A, B, C, D...', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800' },
            { id: 'l-en-2', title: 'Greetings', description: 'How to say Hello.', duration: '15 min', content: 'Hello, Good Morning...', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        id: 'mod-en-2',
        title: 'Basic Conversations (محادثات بسيطة)',
        level: 'A1',
        subLevel: 'A1.2',
        lessons: [
            { id: 'l-en-3', title: 'Introductions', description: 'Introduce yourself.', duration: '12 min', content: 'My name is...', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        id: 'mod-en-3',
        title: 'Daily Routine (الروتين اليومي)',
        level: 'A2',
        subLevel: 'A2.1',
        lessons: [
            { id: 'l-en-4', title: 'Simple Present', description: 'Talking about habits.', duration: '20 min', content: 'I wake up at...', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800' },
        ]
    }
];

export const INITIAL_CURRICULUM_DE: Module[] = [
    {
        id: 'mod-de-1',
        title: 'Grundlagen (الأساسيات الألمانية)',
        level: 'A1',
        subLevel: 'A1.1',
        lessons: [
            { id: 'l-de-1', title: 'Das Alphabet', description: 'Lerne das deutsche Alphabet.', duration: '10 min', content: 'A, B, C, D, E...', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800' },
            { id: 'l-de-2', title: 'Begrüßungen', description: 'Wie sagt man Hallo?', duration: '15 min', content: 'Hallo, Guten Morgen, Guten Tag...', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        id: 'mod-de-2',
        title: 'Erste Gespräche (محادثات أولية)',
        level: 'A1',
        subLevel: 'A1.2',
        lessons: [
            { id: 'l-de-3', title: 'Vorstellung', description: 'Sich vorstellen.', duration: '12 min', content: 'Ich heiße...', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        id: 'mod-de-3',
        title: 'Alltag (الحياة اليومية)',
        level: 'A2',
        subLevel: 'A2.1',
        lessons: [
            { id: 'l-de-4', title: 'Tagesablauf', description: 'Über den Tag sprechen.', duration: '20 min', content: 'Ich stehe auf...', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800' },
        ]
    }
];
