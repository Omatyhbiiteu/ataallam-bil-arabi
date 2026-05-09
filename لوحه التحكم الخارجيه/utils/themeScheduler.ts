import { AppTheme } from "../types";

// --- Hijri Date Calculation (Using Intl API) ---
// Uses the standard 'islamic-umaqura' calendar which is widely used in the region.

export interface HijriDate {
    year: number;
    month: number;
    day: number;
}

export function getHijriDate(date: Date = new Date()): HijriDate {
    try {
        // Use Intl.DateTimeFormat with 'en-u-ca-islamic-umaqura-nu-latn'
        // We use 'en' to ensure numbers are returned as '123' not Arabic numerals, for parsing.
        const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umaqura-nu-latn', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });

        const parts = formatter.formatToParts(date);

        const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
        const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
        const year = parseInt(parts.find(p => p.type === 'year')?.value || '1446');

        return { day, month, year };
    } catch (e) {
        // Fallback or safe default if Intl fails (rare)
        console.error("Hijri Date calculation failed", e);
        return { day: 1, month: 1, year: 1446 };
    }
}

// --- Theme Logic ---

export const getAutoTheme = (date: Date = new Date()): AppTheme => {
    // 1. Check Fixed Gregorian Dates
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // October 6th (Victory Day)
    if (month === 10 && day === 6) {
        return 'victory_october';
    }

    // 2. Check Hijri Dates
    const hijri = getHijriDate(date);

    // Ramadan: Month 9
    if (hijri.month === 9) {
        return 'ramadan';
    }

    // Eid Fitr: Month 10, Days 1-3
    if (hijri.month === 10 && hijri.day >= 1 && hijri.day <= 3) {
        return 'eid_fitr';
    }

    // Eid Adha: Month 12, Days 10-13
    if (hijri.month === 12 && hijri.day >= 10 && hijri.day <= 13) {
        return 'eid_adha';
    }

    // Default
    return 'standard';
};

export const formatHijriDate = (date: Date = new Date()): string => {
    const h = getHijriDate(date);
    const months = [
        "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ];
    // Safety check for month index
    const monthName = months[h.month - 1] || "غير معروف";
    return `${h.day} ${monthName} ${h.year} هـ`;
};
