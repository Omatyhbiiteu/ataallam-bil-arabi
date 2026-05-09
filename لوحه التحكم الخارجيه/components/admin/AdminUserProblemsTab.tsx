import React, { useCallback, useEffect, useState } from 'react';
import { motion as m } from 'framer-motion';
import { AlertTriangle, Loader, Mail, Phone, RefreshCw, User } from 'lucide-react';
import { AdminAPI } from '../../services/apiClient';

type RecoveryRow = {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    createdAt?: string;
};

export const AdminUserProblemsTab: React.FC = () => {
    const [rows, setRows] = useState<RecoveryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await AdminAPI.getPasswordRecoveryRequests();
            const list = Array.isArray(data?.requests) ? data.requests : [];
            setRows(list);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'تعذر تحميل الطلبات';
            setError(msg);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto"
            dir="rtl"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                            <AlertTriangle size={26} />
                        </span>
                        مشاكل المستخدمين
                    </h2>
                    <p className="text-gray-500 text-sm mt-2 font-medium">
                        طلبات استعادة كلمة المرور — الاسم الكامل، البريد، ورقم الهاتف كما أدخلها المستخدم
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    تحديث
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm font-bold">
                    {error}
                </div>
            )}

            {loading && rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
                    <Loader className="animate-spin w-10 h-10" />
                    <span className="font-bold">جاري التحميل...</span>
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-12 text-center text-gray-500 font-bold">
                    لا توجد طلبات حتى الآن.
                </div>
            ) : (
                <div className="rounded-3xl border border-white/5 bg-slate-900/30 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.03] text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-4 py-4 font-black">النوع</th>
                                    <th className="px-4 py-4 font-black">الاسم الكامل</th>
                                    <th className="px-4 py-4 font-black">البريد</th>
                                    <th className="px-4 py-4 font-black">الهاتف</th>
                                    <th className="px-4 py-4 font-black">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-black">
                                                استعادة كلمة المرور
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-white font-bold">
                                            <span className="inline-flex items-center gap-2">
                                                <User size={16} className="text-gray-500 shrink-0" />
                                                {r.fullName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <a
                                                href={`mailto:${encodeURIComponent(r.email)}`}
                                                className="inline-flex items-center gap-2 text-blue-400 hover:underline font-bold break-all"
                                            >
                                                <Mail size={16} className="shrink-0" />
                                                {r.email}
                                            </a>
                                        </td>
                                        <td className="px-4 py-4 text-gray-200 font-mono text-xs md:text-sm">
                                            <span className="inline-flex items-center gap-2">
                                                <Phone size={16} className="text-gray-500 shrink-0" />
                                                {r.phone}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                                            {r.createdAt
                                                ? new Date(r.createdAt).toLocaleString('ar-EG', {
                                                      dateStyle: 'short',
                                                      timeStyle: 'short',
                                                  })
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </m.div>
    );
};
