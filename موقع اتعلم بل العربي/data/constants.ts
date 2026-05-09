import { SubscriptionPlan } from '../types';

export const APP_CONSTANTS = {
    SUBSCRIPTION_PRICE: 99,
    CURRENCY: 'جنيه'
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'silver',
        name: 'باقة سيلفر',
        price: 59,
        originalPrice: 120,
        description: 'توازن مثالي: مزايا Pro الأساسية مع حدود يومية منطقية للذكاء الاصطناعي.',
        theme: 'purple',
        isPopular: false,
        features: [
            { text: 'حتى 70 رسالة يومياً للذكاء الاصطناعي', subText: 'محادثة نصية مع المعلم الذكي', isEnabled: true },
            { text: 'حتى 10 دقائق يومياً من الحديث الصوتي مع الـ AI', subText: 'تدريب نطق وممارسة محادثة', isEnabled: true },
            { text: 'وصول موسع للقصص والفيديوهات', subText: 'بدون حدود المجانية', isEnabled: true },
            { text: 'بدون إعلانات', subText: 'تركيز كامل على التعلم', isEnabled: true },
            { text: 'المهندس الشخصي (Planner)', subText: 'جدول مذاكرة أسبوعي', isEnabled: true },
            { text: 'المعمل اللغوي (Writing Lab)', subText: 'تصحيح النصوص', isEnabled: true },
        ]
    },
    {
        id: 'pro',
        name: 'باقة البرو',
        price: APP_CONSTANTS.SUBSCRIPTION_PRICE,
        originalPrice: 199,
        description: 'أقصى استفادة: حدود يومية أعلى للذكاء الاصطناعي والمحادثة الصوتية.',
        theme: 'amber',
        isPopular: true,
        features: [
            { text: 'حتى 150 رسالة يومياً للذكاء الاصطناعي', subText: 'محادثة نصية مع المعلم الذكي', isEnabled: true },
            { text: 'حتى 20 دقيقة يومياً من الحديث الصوتي مع الـ AI', subText: 'تدريب نطق وممارسة محادثة', isEnabled: true },
            { text: 'وصول كامل لكل القصص والفيديوهات', subText: 'مكتبة مفتوحة بلا قيود', isEnabled: true },
            { text: 'بدون إعلانات نهائياً', subText: 'ركز في التعلم فقط', isEnabled: true },
            { text: 'المهندس الشخصي (Planner)', subText: 'جدول مذاكرة مفصل أسبوعياً', isEnabled: true },
            { text: 'المعمل اللغوي (Writing Lab)', subText: 'تصحيح احترافي لأي نص', isEnabled: true },
        ]
    }
];
