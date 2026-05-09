
import { Plane, Coffee, Briefcase, ShoppingBag, HeartPulse, Car, Landmark, Utensils, Globe, Stethoscope, GraduationCap, Video, ShieldAlert, Monitor, Home, UserPlus, Pizza, Music, Camera, Wrench, Smartphone, Sun, Gavel, FileText, Gift, Ticket, Map, Key, Wifi, CreditCard, DollarSign, CloudRain, Hammer, BookOpen, Clock, Phone, Mail, Mic, Zap, Smile, Frown, ThumbsUp, PenTool } from 'lucide-react';

export interface Scenario {
    id: string;
    title: string;
    icon: any;
    category: 'travel' | 'business' | 'social' | 'emergency' | 'daily' | 'shopping' | 'health' | 'education';
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    role: string;
    objective: string;
    bg: string;
}

export const ROLEPLAY_SCENARIOS: Scenario[] = [
    // ==========================================
    // LEVEL A1: BEGINNER (Survival & Basics)
    // ==========================================
    {
        id: 'intro_self',
        title: 'التعريف بالنفس',
        icon: UserPlus,
        category: 'social',
        level: 'A1',
        role: 'New Friend',
        objective: 'قل اسمك، عمرك، ومن أين أنت.',
        bg: 'from-blue-500 to-cyan-600'
    },
    {
        id: 'cafe_basic',
        title: 'طلب قهوة',
        icon: Coffee,
        category: 'daily',
        level: 'A1',
        role: 'Barista',
        objective: 'اطلب قهوة وحساب السعر.',
        bg: 'from-amber-600 to-orange-800'
    },
    {
        id: 'taxi_basic',
        title: 'تاكسي',
        icon: Car,
        category: 'travel',
        level: 'A1',
        role: 'Driver',
        objective: 'قل للسائق وجهتك واسأل عن الأجرة.',
        bg: 'from-yellow-500 to-yellow-700'
    },
    {
        id: 'supermarket_basic',
        title: 'التسوق الأساسي',
        icon: ShoppingBag,
        category: 'shopping',
        level: 'A1',
        role: 'Cashier',
        objective: 'اسأل عن سعر الخبز والماء.',
        bg: 'from-green-500 to-emerald-700'
    },
    {
        id: 'hotel_dates',
        title: 'مواعيد الفندق',
        icon: Clock,
        category: 'travel',
        level: 'A1',
        role: 'Receptionist',
        objective: 'اسأل متى الإفطار ومتى الخروج.',
        bg: 'from-slate-500 to-slate-700'
    },

    // ==========================================
    // LEVEL A2: ELEMENTARY (Routine & Descriptions)
    // ==========================================
    {
        id: 'restaurant_order',
        title: 'في المطعم',
        icon: Utensils,
        category: 'daily',
        level: 'A2',
        role: 'Waiter',
        objective: 'اطلب وجبة كاملة واسأل عن المكونات.',
        bg: 'from-rose-500 to-pink-700'
    },
    {
        id: 'directions',
        title: 'وصف الطريق',
        icon: Map,
        category: 'travel',
        level: 'A2',
        role: 'Stranger',
        objective: 'اسأل كيف تذهب إلى المتحف سيراً.',
        bg: 'from-indigo-500 to-purple-700'
    },
    {
        id: 'doctor_symptoms',
        title: 'ألم بسيط',
        icon: Stethoscope,
        category: 'health',
        level: 'A2',
        role: 'Doctor',
        objective: 'اشرح أن لديك صداع وحرارة.',
        bg: 'from-teal-500 to-cyan-700'
    },
    {
        id: 'clothing_shop',
        title: 'شراء ملابس',
        icon: ShoppingBag,
        category: 'shopping',
        level: 'A2',
        role: 'Assistant',
        objective: 'اطلب مقاساً أكبر ولوناً مختلفاً.',
        bg: 'from-fuchsia-500 to-pink-700'
    },
    {
        id: 'daily_routine',
        title: 'روتيني اليومي',
        icon: Sun,
        category: 'social',
        level: 'A2',
        role: 'Friend',
        objective: 'تحدث عما تفعله كل صباح ومساء.',
        bg: 'from-orange-400 to-red-500'
    },

    // ==========================================
    // LEVEL B1: INTERMEDIATE (Problems & Opinions)
    // ==========================================
    {
        id: 'hotel_problem',
        title: 'مشكلة الفندق',
        icon: Wrench,
        category: 'travel',
        level: 'B1',
        role: 'Manager',
        objective: 'التكييف معطل! قدم شكوى واطلب تغييراً.',
        bg: 'from-red-600 to-rose-800'
    },
    {
        id: 'job_inquiry',
        title: 'الاستفسار عن عمل',
        icon: Briefcase,
        category: 'business',
        level: 'B1',
        role: 'Recruiter',
        objective: 'اتصل لتسأل عن تفاصيل وظيفة شاغرة.',
        bg: 'from-slate-600 to-gray-800'
    },
    {
        id: 'future_plans',
        title: 'خطط المستقبل',
        icon: Rocket,
        category: 'social',
        level: 'B1',
        role: 'Friend',
        objective: 'ناقش أين تريد السفر وماذا ستعمل.',
        bg: 'from-violet-600 to-indigo-800'
    },
    {
        id: 'pharmacy_advice',
        title: 'نصيحة طبية',
        icon: HeartPulse,
        category: 'health',
        level: 'B1',
        role: 'Pharmacist',
        objective: 'اشرح حساسية لديك واطلب دواء مناسب.',
        bg: 'from-green-600 to-teal-800'
    },
    {
        id: 'return_item',
        title: 'إرجاع منتج',
        icon: RefreshCcw,
        category: 'shopping',
        level: 'B1',
        role: 'Customer Service',
        objective: 'تريد إرجاع لابتوب لأنه لا يعمل جيداً.',
        bg: 'from-amber-600 to-orange-800'
    },

    // ==========================================
    // LEVEL B2: UPPER INTERMEDIATE (Abstract & Fluent)
    // ==========================================
    {
        id: 'job_interview_pro',
        title: 'مقابلة عمل احترافية',
        icon: Briefcase,
        category: 'business',
        level: 'B2',
        role: 'HR Manager',
        objective: 'ناقش نقاط قوتك وضعفك وخبراتك بالتفصيل.',
        bg: 'from-slate-700 to-black'
    },
    {
        id: 'political_debate',
        title: 'نقاش عام',
        icon: Globe,
        category: 'social',
        level: 'B2',
        role: 'Colleague',
        objective: 'ناقش مزايا وعيوب التكنولوجيا الحديثة.',
        bg: 'from-blue-700 to-indigo-900'
    },
    {
        id: 'car_accident',
        title: 'حادث سيارة',
        icon: ShieldAlert,
        category: 'emergency',
        level: 'B2',
        role: 'Police Officer',
        objective: 'اشرح تفاصيل الحادث ومن المخطأ بدقة.',
        bg: 'from-red-700 to-red-900'
    },
    {
        id: 'bank_loan',
        title: 'قرض بنكي',
        icon: Landmark,
        category: 'business',
        level: 'B2',
        role: 'Banker',
        objective: 'ناقش شروط القرض والفوائد والضمانات.',
        bg: 'from-emerald-700 to-green-900'
    },

    // ==========================================
    // LEVEL C1: ADVANCED (Complex & Nuanced)
    // ==========================================
    {
        id: 'salary_negotiation',
        title: 'تفاوض الراتب',
        icon: DollarSign,
        category: 'business',
        level: 'C1',
        role: 'Boss',
        objective: 'استخدم مهارات الإقناع للحصول على زيادة كبيرة.',
        bg: 'from-green-800 to-emerald-950'
    },
    {
        id: 'legal_dispute',
        title: 'نزاع قانوني',
        icon: Gavel,
        category: 'business',
        level: 'C1',
        role: 'Lawyer',
        objective: 'ناقش تفاصيل عقد وشروط جزائية معقدة.',
        bg: 'from-stone-700 to-stone-900'
    },
    {
        id: 'academic_presentation',
        title: 'عرض أكاديمي',
        icon: GraduationCap,
        category: 'education',
        level: 'C1',
        role: 'Professor',
        objective: 'دافع عن أطروحتك العلمية وأجب عن نقد.',
        bg: 'from-cyan-800 to-blue-950'
    },

    // ==========================================
    // LEVEL C2: MASTERY (Native-like)
    // ==========================================
    {
        id: 'philosophical',
        title: 'نقاش فلسفي',
        icon: Lightbulb,
        category: 'social',
        level: 'C2',
        role: 'Intellectual',
        objective: 'ناقش معنى السعادة والوجودية بعمق.',
        bg: 'from-violet-900 to-purple-950'
    },
    {
        id: 'poetry_literature',
        title: 'الأدب والشعر',
        icon: PenTool,
        category: 'social',
        level: 'C2',
        role: 'Critic',
        objective: 'حلل قصيدة أو رواية واستخدم لغة مجازية.',
        bg: 'from-rose-900 to-pink-950'
    },
    {
        id: 'comedy_improvisation',
        title: 'الارتجال والفكاهة',
        icon: Smile,
        category: 'social',
        level: 'C2',
        role: 'Comedian',
        objective: 'استخدم النكات والتلاعب اللفظي بذكاء.',
        bg: 'from-yellow-700 to-orange-900'
    }
];

// Import statements at top need to be adjusted to include all used icons
// I will ensure the import line in the final file includes: Rocket, RefreshCcw, Lightbulb which I used above.
import { Rocket, RefreshCcw, Lightbulb } from 'lucide-react';
