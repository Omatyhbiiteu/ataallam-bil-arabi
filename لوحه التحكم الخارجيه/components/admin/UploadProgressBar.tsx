import React, { useEffect, useRef } from 'react';
import { CheckCircle2, UploadCloud, AlertCircle } from 'lucide-react';

interface UploadProgressBarProps {
    /** نسبة التقدم من 0 إلى 100 */
    progress: number;
    /** اسم الملف للعرض */
    fileName?: string;
    /** هل اكتمل الرفع بنجاح؟ */
    done?: boolean;
    /** هل حدث خطأ؟ */
    error?: string;
}

/**
 * مؤشر تقدم رفع الملفات الاحترافي
 * ملاحظة: يتوقف عند 90% تلقائياً حتى يُؤكِّد الخادم الاستلام،
 * ثم يقفز لـ 100% عند النجاح — لأن XHR يقيس البيانات المُرسَلة
 * وليس معالجة الخادم.
 */
export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
    progress,
    fileName,
    done = false,
    error,
}) => {
    const clamp = (v: number) => Math.min(100, Math.max(0, v));

    // عرض 90% كحد أقصى حتى يكتمل فعلياً، ثم 100% عند done
    const displayProgress = done ? 100 : error ? clamp(progress) : clamp(Math.min(progress, 90));

    // Short file name
    const shortName = fileName
        ? fileName.length > 30
            ? fileName.slice(0, 27) + '…'
            : fileName
        : null;

    if (error) {
        return (
            <div className="w-full rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 flex items-center gap-3">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span className="text-xs font-bold text-red-700 dark:text-red-400 truncate">{error}</span>
            </div>
        );
    }

    return (
        <div className="w-full rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/80 dark:bg-indigo-950/40 px-4 py-3 space-y-2">
            {/* Top row: icon + label + percent */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    {done ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    ) : (
                        <UploadCloud size={15} className="text-indigo-500 shrink-0 animate-pulse" />
                    )}
                    <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 truncate">
                        {done
                            ? 'اكتمل الرفع بنجاح ✓'
                            : shortName
                                ? shortName
                                : 'جاري رفع الملف…'
                        }
                    </span>
                </div>
                <span className={`text-[11px] font-black tabular-nums shrink-0 ${done ? 'text-emerald-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {displayProgress}%
                </span>
            </div>

            {/* Progress track */}
            <div className="h-1.5 w-full rounded-full bg-indigo-100 dark:bg-indigo-900/60 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                        done
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            : displayProgress < 90
                                ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                : 'bg-gradient-to-r from-violet-500 to-indigo-400 animate-pulse'
                    }`}
                    style={{ width: `${displayProgress}%` }}
                />
            </div>

            {/* Waiting message when near 90% but server not yet responded */}
            {!done && displayProgress >= 89 && (
                <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 text-center">
                    في انتظار تأكيد الخادم…
                </p>
            )}
        </div>
    );
};
