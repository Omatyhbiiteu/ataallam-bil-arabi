import { Moon, Star, Flag, Sparkles, Heart, BookOpen } from 'lucide-react';
import { AppTheme } from '../types';

export const THEMES_DATA: Record<AppTheme, {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    name: string;
    greeting?: string;
    icon?: any;
    soundUrl?: string; // Optional built-in sound URL
    description?: string;
}> = {
    standard: {
        primary: '#c0392b',
        secondary: '#f39c12',
        accent: '#e74c3c',
        glow: 'rgba(192, 57, 43, 0.1)',
        name: 'الافتراضي',
        description: 'المظهر الكلاسيكي المتوازن للأداء اليومي.',
        soundUrl: '' // No sound for standard
    },
    ramadan: {
        primary: '#4a148c',
        secondary: '#ffab00',
        accent: '#7b1fa2',
        glow: 'rgba(74, 20, 140, 0.4)',
        name: 'رمضان كريم',
        greeting: 'رمضان كريم',
        description: 'أجواء رمضانية هادئة مع ألوان بنفسجية وذهبية.',
        icon: Moon,
        soundUrl: 'https://cdn.pixabay.com/audio/2022/10/18/audio_6a053c7a0d.mp3' // Eastern/Mystical ambient
    },
    eid_fitr: {
        primary: '#00bfa5',
        secondary: '#ff4081',
        accent: '#1de9b6',
        glow: 'rgba(0, 191, 165, 0.3)',
        name: 'عيد الفطر',
        greeting: 'عيد مبارك',
        description: 'ألوان مبهجة واحتفالية تعكس فرحة العيد.',
        icon: Sparkles,
        soundUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3' // Celebration generic
    },
    eid_adha: {
        primary: '#2d5a27',
        secondary: '#f1c40f',
        accent: '#8d6e63',
        glow: 'rgba(45, 90, 39, 0.25)',
        name: 'عيد الأضحى',
        greeting: 'عيد أضحى مبارك',
        description: 'تصميم مستوحى من الطبيعة والألوان الترابية.',
        icon: Heart,
        soundUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3' // Celebration generic
    },
    victory_october: {
        primary: '#d32f2f',
        secondary: '#1976d2',
        accent: '#fbc02d',
        glow: 'rgba(211, 47, 47, 0.3)',
        name: '6 أكتوبر',
        greeting: 'نصر أكتوبر',
        description: 'ألوان وطنية تعبر عن الفخر والانتصار.',
        icon: Flag,
        soundUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_783df50275.mp3' // Epic cinematic
    },
    winter: {
        primary: '#90CAF9',
        secondary: '#1565C0',
        accent: '#E3F2FD',
        glow: 'rgba(144, 202, 249, 0.3)',
        name: 'شتاء',
        description: 'هدوء الشتاء وسحر الثلج — أجواء باردة وجميلة.',
        soundUrl: ''
    },
    summer: {
        primary: '#FF8F00',
        secondary: '#0288D1',
        accent: '#FFCC02',
        glow: 'rgba(255, 143, 0, 0.3)',
        name: 'صيف',
        greeting: 'صيفاً رائعاً!',
        description: 'حرارة الشمس وزرقة البحر — طاقة وانطلاق.',
        soundUrl: ''
    },
    school: {
        primary: '#2A5C82', // Navy/Academic Blue
        secondary: '#E2C044', // Pencil Yellow
        accent: '#58A4B0', // Chalkboard Green/Aqua
        glow: 'rgba(42, 92, 130, 0.3)',
        name: 'المدرسة',
        greeting: 'وقت الدراسة!',
        description: 'أجواء دراسية هادئة تساعد على التركيز والإنجاز.',
        icon: BookOpen,
        soundUrl: '' // Can be a subtle page turn or ambient library sound
    },
    custom: {
        primary: '#333',
        secondary: '#555',
        accent: '#777',
        glow: 'rgba(0,0,0,0.1)',
        name: 'مخصص',
        description: 'قم بتخصيص ألوانك الخاصة وتصميمك المفضل.'
    }
};
