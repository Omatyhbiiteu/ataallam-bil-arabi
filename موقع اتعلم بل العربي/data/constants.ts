import { SubscriptionPlan } from '../types';

export const APP_CONSTANTS = {
    SUBSCRIPTION_PRICE: 50,
    CURRENCY: 'جنيه'
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'default_pro',
        name: 'باقة القمة',
        price: APP_CONSTANTS.SUBSCRIPTION_PRICE,
        originalPrice: 150,
        description: 'الحل الشامل: تعلم بلا حدود، بلا إعلانات، وبذكاء اصطناعي كامل.',
        theme: 'amber',
        isPopular: true,
        features: [
            { text: "وصول كامل لكل القصص والفيديوهات", subText: "مكتبة مفتوحة بلا قيود", isEnabled: true },
            { text: "بدون إعلانات نهائياً", subText: "ركز في التعلم فقط", isEnabled: true },
            { text: "معلم صوتي لا نهائي (Voice AI)", subText: "تحدث كأنك ابن البلد", isEnabled: true },
            { text: "المهندس الشخصي (Planner)", subText: "جدول مذاكرة مفصل أسبوعياً", isEnabled: true },
            { text: "المعمل اللغوي (Writing Lab)", subText: "تصحيح احترافي لأي نص", isEnabled: true },
        ]
    }
];

