import { SubscriptionPlan, PlanFeature } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/constants';
import { PaymentsAPI } from './apiClient';

export type { SubscriptionPlan, PlanFeature };

export interface PaymentMethodConfig {
    id: 'vodafone_cash' | 'instapay' | 'fawry';
    isEnabled: boolean;
    number?: string; // For Vodafone/Instapay
    name?: string; // Account holder name or custom label
    instruction?: string; // Custom instructions
}

export interface PaymentSettings {
    vodafoneCash: PaymentMethodConfig;
    instapay: PaymentMethodConfig;
    fawry: PaymentMethodConfig;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    currency: string;
    isLiveMode: boolean;
    price: number;
    plans: SubscriptionPlan[];
}


const DEFAULT_SETTINGS: PaymentSettings = {
    vodafoneCash: {
        id: 'vodafone_cash',
        isEnabled: true,
        number: '01012345678',
        instruction: 'حول المبلغ المطلوب وسنقوم بتفعيل حسابك فوراً'
    },
    instapay: {
        id: 'instapay',
        isEnabled: false,
        number: 'username@instapay', // Handle or number
        instruction: 'استخدم تطبيق انستا باي للتحويل الفوري'
    },
    fawry: {
        id: 'fawry',
        isEnabled: false,
        number: '123456', // Reference number
        instruction: 'ادفع عن طريق أي ماكينة فوري باستخدام الكود'
    },
    stripePublishableKey: '',
    stripeSecretKey: '',
    currency: 'USD',
    isLiveMode: false,
    price: 99,
    plans: SUBSCRIPTION_PLANS
};


const STORAGE_KEY = 'fluentflow_payment_settings';

/** دمج إعدادات الخادم الجزئية مع الافتراضيات (نفس شكل الواجهة). */
export function mergePaymentSettings(partial: Partial<PaymentSettings> | null | undefined): PaymentSettings {
    const basePlans = [...DEFAULT_SETTINGS.plans];
    if (!partial) {
        return { ...DEFAULT_SETTINGS, plans: basePlans };
    }
    const plans =
        partial.plans != null && Array.isArray(partial.plans) && partial.plans.length > 0
            ? partial.plans
            : basePlans;

    return {
        ...DEFAULT_SETTINGS,
        ...partial,
        vodafoneCash: { ...DEFAULT_SETTINGS.vodafoneCash, ...(partial.vodafoneCash || {}) },
        instapay: { ...DEFAULT_SETTINGS.instapay, ...(partial.instapay || {}) },
        fawry: { ...DEFAULT_SETTINGS.fawry, ...(partial.fawry || {}) },
        plans,
    };
}

export const PaymentService = {
    getSettings: (): PaymentSettings => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
        } catch (e) {
            console.error("Failed to load payment settings", e);
            return DEFAULT_SETTINGS;
        }
    },

    saveSettings: (settings: PaymentSettings) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save payment settings", e);
        }
    },

    /** جلب الإعدادات من الـ API وحفظها محلياً (لصفحة الاشتراك). */
    fetchFromServer: async (): Promise<PaymentSettings> => {
        try {
            const res = (await PaymentsAPI.getPaymentSettings()) as {
                settings?: Partial<PaymentSettings> | null;
            };
            const merged = mergePaymentSettings(res?.settings ?? null);
            PaymentService.saveSettings(merged);
            return merged;
        } catch (e) {
            console.error('fetchFromServer payment settings', e);
            return PaymentService.getSettings();
        }
    },

    // Helper to get active methods
    getActiveMethods: (settings?: PaymentSettings) => {
        const s = settings || PaymentService.getSettings();
        const methods: string[] = [];
        // Explicitly check each supported method to ensure correct order and type
        if (s.vodafoneCash && s.vodafoneCash.isEnabled) methods.push('vodafone_cash');
        if (s.instapay && s.instapay.isEnabled) methods.push('instapay');
        if (s.fawry && s.fawry.isEnabled) methods.push('fawry');
        return methods;
    }
};
