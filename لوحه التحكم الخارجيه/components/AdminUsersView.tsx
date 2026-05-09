import React, { useEffect, useMemo, useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Activity, Calendar, Clock, Lock, Mail, MapPin, Orbit, Search, Shield, Snowflake, Smartphone, UserCheck, UserX, Users, Zap } from 'lucide-react';
import { AdminAPI } from '../services/apiClient';

type AdminUserRow = {
    id: string;
    name: string;
    email: string;
    age?: number;
    gender?: 'male' | 'female' | string;
    startLevel?: string;
    plan: 'free' | 'pro' | 'enterprise' | string;
    isFrozen: boolean;
    joinDate?: string;
    lastActive?: string;
};

type Summary = {
    totalUsers: number;
    proUsers: number;
    frozenUsers: number;
    activeUsers: number;
};

const UserDetailsModal: React.FC<{ user: AdminUserRow; onClose: () => void }> = ({ user, onClose }) => {
    const joinedAt = user.joinDate ? new Date(user.joinDate) : null;
    const lastActiveAt = user.lastActive ? new Date(user.lastActive) : null;
    const daysInactive = lastActiveAt ? Math.max(0, Math.floor((Date.now() - lastActiveAt.getTime()) / 86400000)) : 7;
    const engagement = Math.min(98, Math.max(20, 100 - daysInactive * 5));

    const statsBars = [
        { label: 'قصص مقروءة', val: Math.max(30, 190 - daysInactive * 12), color: 'bg-emerald-500' },
        { label: 'بطاقات تمت مراجعتها', val: Math.max(20, 145 - daysInactive * 9), color: 'bg-blue-500' },
        { label: 'جلسات استماع', val: Math.max(10, 85 - daysInactive * 6), color: 'bg-orange-500' },
        { label: 'اختبارات منجزة', val: Math.max(8, 70 - daysInactive * 5), color: 'bg-pink-500' },
    ];

    const timeline = Array.from({ length: 5 }).map((_, idx) => {
        const ts = new Date((lastActiveAt?.getTime() || Date.now()) - idx * 1000 * 60 * 60 * 7);
        return {
            id: `log_${idx}`,
            details: idx % 2 === 0 ? 'Completed session' : 'Reviewed flashcards',
            timestamp: ts.toISOString(),
        };
    });
    const [newPassword, setNewPassword] = useState('');
    const [editingPassword, setEditingPassword] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setPasswordMsg({ text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', type: 'error' });
            return;
        }
        try {
            setSavingPassword(true);
            setPasswordMsg(null);
            await AdminAPI.updateUserPassword(user.id, newPassword);
            setPasswordMsg({ text: 'تم تحديث كلمة مرور المستخدم بنجاح', type: 'success' });
            setNewPassword('');
            setEditingPassword(false);
        } catch (err: any) {
            setPasswordMsg({ text: err?.message || 'فشل تحديث كلمة المرور', type: 'error' });
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" dir="rtl">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <m.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0f111a] border border-white/10 shadow-2xl"
            >
                <div className="h-32 bg-gradient-to-r from-blue-900/50 to-purple-900/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
                </div>
                <div className="p-6 md:p-8 -mt-12">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-gray-900 border-4 border-[#0f111a] flex items-center justify-center text-2xl font-black text-white shadow-xl relative">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#0f111a] ${daysInactive <= 1 ? 'bg-green-500' : 'bg-gray-500'}`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                    {user.name || '-'}
                                    {user.plan === 'pro' && <Shield size={18} className="text-amber-400" />}
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">ملف المستخدم التفصيلي - Admin Profile</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold">
                            إغلاق
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
                        <div className="rounded-2xl bg-gray-800/30 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1">خطة المرور المشفّرة</p>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-white font-mono text-sm">
                                    <Lock size={13} className="text-gray-500" />
                                    ••••••••••••
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingPassword((v) => !v);
                                        setPasswordMsg(null);
                                    }}
                                    className="text-blue-400 text-xs font-bold hover:underline"
                                >
                                    تعديل
                                </button>
                            </div>
                            {editingPassword && (
                                <div className="mt-3 space-y-2">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="اكتب كلمة المرور الجديدة"
                                        className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdatePassword}
                                            disabled={savingPassword}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-60"
                                        >
                                            {savingPassword ? 'جاري الحفظ...' : 'حفظ'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingPassword(false);
                                                setNewPassword('');
                                                setPasswordMsg(null);
                                            }}
                                            disabled={savingPassword}
                                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            )}
                            {passwordMsg && (
                                <p className={`mt-2 text-xs font-bold ${passwordMsg.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                                    {passwordMsg.text}
                                </p>
                            )}
                        </div>
                        <div className="rounded-2xl bg-gray-800/30 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1">آخر ظهور</p>
                            <p className="text-white font-bold">{lastActiveAt ? lastActiveAt.toLocaleDateString('ar-EG') : '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-800/30 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1">الموقع / الحالة</p>
                            <div className="flex items-center gap-2 text-white text-sm">
                                <MapPin size={13} className="text-gray-500" />
                                <span>Unknown</span>
                                <span className="mx-1 text-gray-600">•</span>
                                <span className={user.isFrozen ? 'text-cyan-300' : 'text-emerald-300'}>{user.isFrozen ? 'مجمد' : 'نشط'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-800/20 p-6 rounded-3xl border border-white/10">
                            <h4 className="text-lg font-black text-white mb-5 flex items-center gap-2"><Activity size={16} className="text-purple-400" /> تحليل النشاط</h4>
                            <div className="space-y-4">
                                {statsBars.map((s) => (
                                    <div key={s.label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">{s.label}</span>
                                            <span className="text-white font-bold">{s.val} دقيقة</span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${s.color}`} style={{ width: `${Math.min(100, Math.round(s.val / 2))}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-800/20 p-6 rounded-3xl border border-white/10">
                            <h4 className="text-lg font-black text-white mb-5 flex items-center gap-2"><Orbit size={16} className="text-cyan-400" /> آخر التحركات</h4>
                            <div className="space-y-3">
                                {timeline.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center shrink-0">
                                            <Zap size={12} className="text-yellow-400" />
                                        </div>
                                        <div className="flex-1 rounded-xl bg-gray-900/50 border border-white/5 px-3 py-2">
                                            <p className="text-sm text-gray-200 font-bold">{item.details}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{new Date(item.timestamp).toLocaleString('ar-EG')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Mail size={12} /> البريد الإلكتروني</p>
                            <p className="text-white font-bold break-all">{user.email || '-'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> تاريخ الانضمام</p>
                            <p className="text-white font-bold">{joinedAt ? joinedAt.toLocaleDateString('ar-EG') : '-'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1">العمر / الجنس</p>
                            <p className="text-white font-bold">{user.age ?? '-'} / {user.gender === 'male' ? 'ذكر' : user.gender === 'female' ? 'أنثى' : '-'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1">المستوى</p>
                            <p className="text-white font-bold">{user.startLevel || '-'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1">الخطة</p>
                            <p className="text-white font-bold">{String(user.plan).toUpperCase()}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-4">
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Smartphone size={12} /> الجهاز</p>
                            <p className="text-white font-bold">Desktop</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-4 md:col-span-3">
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={12} /> آخر نشاط</p>
                            <p className="text-white font-bold">{lastActiveAt ? lastActiveAt.toLocaleString('ar-EG') : '-'}</p>
                            <p className="text-xs text-cyan-300 mt-1">Engagement Score: {engagement}%</p>
                        </div>
                    </div>
                </div>
            </m.div>
        </div>
    );
};

export interface AdminUsersViewProps {
    /** بعد التنقّل من تذكرة دعم: فتح تفاصيل هذا المستخدم */
    focusAppUserId?: string | null;
    onConsumedFocusAppUser?: () => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ focusAppUserId, onConsumedFocusAppUser }) => {
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalUsers: 0, proUsers: 0, frozenUsers: 0, activeUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'pro' | 'free' | 'frozen'>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await AdminAPI.getUsersList();
            setUsers(Array.isArray(response?.users) ? response.users : []);
            setSummary(response?.summary || { totalUsers: 0, proUsers: 0, frozenUsers: 0, activeUsers: 0 });
        } catch (err: any) {
            setError(err?.message || 'تعذر تحميل المستخدمين');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (!focusAppUserId) return;
        let cancelled = false;
        void (async () => {
            try {
                setLoading(true);
                setError('');
                const response = await AdminAPI.getUsersList();
                const list = Array.isArray(response?.users) ? response.users : [];
                if (cancelled) return;
                setUsers(list);
                setSummary(response?.summary || { totalUsers: 0, proUsers: 0, frozenUsers: 0, activeUsers: 0 });
                const match = list.find((u) => String(u.id) === String(focusAppUserId));
                if (match) {
                    setSelectedUser(match);
                    setSearchTerm('');
                    setFilterType('all');
                } else {
                    setToast({ msg: 'لم يُعثر على هذا المستخدم في القائمة.', type: 'error' });
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message || 'تعذر تحميل المستخدمين');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    onConsumedFocusAppUser?.();
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [focusAppUserId]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(t);
    }, [toast]);

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const searchOk =
                u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const filterOk =
                filterType === 'all' ||
                (filterType === 'pro' && u.plan === 'pro') ||
                (filterType === 'free' && u.plan === 'free') ||
                (filterType === 'frozen' && u.isFrozen);

            return !!searchOk && filterOk;
        });
    }, [users, searchTerm, filterType]);

    const togglePlan = async (user: AdminUserRow) => {
        if (updatingId) return;
        setUpdatingId(user.id);
        try {
            const targetPlan = user.plan === 'pro' ? 'free' : 'pro';
            await AdminAPI.updateUserPlan(user.id, targetPlan);
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, plan: targetPlan } : u)));
            setSummary((prev) => {
                const delta = targetPlan === 'pro' ? 1 : -1;
                return { ...prev, proUsers: Math.max(0, prev.proUsers + delta) };
            });
            setToast({ msg: targetPlan === 'pro' ? 'تم تفعيل Pro بنجاح' : 'تم إلغاء Pro بنجاح', type: 'success' });
        } catch (err: any) {
            setToast({ msg: err?.message || 'فشل تحديث الخطة', type: 'error' });
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleFreeze = async (user: AdminUserRow) => {
        if (updatingId) return;
        setUpdatingId(user.id);
        try {
            await AdminAPI.toggleUserFreeze(user.id);
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isFrozen: !u.isFrozen } : u)));
            setSummary((prev) => ({
                ...prev,
                frozenUsers: user.isFrozen ? Math.max(0, prev.frozenUsers - 1) : prev.frozenUsers + 1,
                activeUsers: user.isFrozen ? prev.activeUsers + 1 : Math.max(0, prev.activeUsers - 1),
            }));
            setToast({ msg: user.isFrozen ? 'تم إلغاء تجميد الحساب' : 'تم تجميد الحساب', type: 'success' });
        } catch (err: any) {
            setToast({ msg: err?.message || 'فشل تنفيذ العملية', type: 'error' });
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in pb-24">
            <AnimatePresence>
                {selectedUser && <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <m.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white font-bold text-sm ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}
                    >
                        {toast.msg}
                    </m.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">المستخدمين</h1>
                    <p className="text-gray-400">إدارة كاملة لمستخدمي الموقع الأساسي</p>
                </div>
                <button onClick={loadUsers} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">
                    تحديث القائمة
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">إجمالي المستخدمين</p>
                    <p className="text-3xl font-black text-white mt-2">{summary.totalUsers}</p>
                </div>
                <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">نشطين</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">{summary.activeUsers}</p>
                </div>
                <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">حسابات مجمدة</p>
                    <p className="text-3xl font-black text-cyan-400 mt-2">{summary.frozenUsers}</p>
                </div>
                <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">مشتركين Pro</p>
                    <p className="text-3xl font-black text-amber-400 mt-2">{summary.proUsers}</p>
                </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[260px]">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث بالاسم أو البريد..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'الكل' },
                            { id: 'pro', label: 'Pro' },
                            { id: 'free', label: 'مجاني' },
                            { id: 'frozen', label: 'مجمد' },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilterType(f.id as any)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold ${filterType === f.id ? 'bg-white text-black' : 'bg-white/5 text-gray-300'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-400">جاري تحميل المستخدمين...</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-400">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4">المستخدم</th>
                                    <th className="px-6 py-4">العمر / الجنس</th>
                                    <th className="px-6 py-4">المستوى</th>
                                    <th className="px-6 py-4">الخطة</th>
                                    <th className="px-6 py-4">الحالة</th>
                                    <th className="px-6 py-4">آخر نشاط</th>
                                    <th className="px-6 py-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map((user) => {
                                    const isUpdating = updatingId === user.id;
                                    const isPro = user.plan === 'pro';
                                    return (
                                        <tr key={user.id} className="hover:bg-white/5 cursor-pointer" onClick={() => setSelectedUser(user)}>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white">{user.name}</p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                {(user.age ?? '-') + ' سنة'} <span className="text-gray-500">/ {user.gender === 'male' ? 'ذكر' : user.gender === 'female' ? 'أنثى' : '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300">{user.startLevel || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${isPro ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                                                    <Shield size={11} /> {isPro ? 'PRO' : 'FREE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${user.isFrozen ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                                                    {user.isFrozen ? <Snowflake size={11} /> : <Zap size={11} />}
                                                    {user.isFrozen ? 'مجمد' : 'نشط'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{user.lastActive ? new Date(user.lastActive).toLocaleDateString('ar-EG') : '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePlan(user);
                                                        }}
                                                        disabled={isUpdating}
                                                        className={`px-3 py-2 rounded-lg text-xs font-bold ${isPro ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}
                                                    >
                                                        {isPro ? <span className="inline-flex items-center gap-1"><UserX size={13} /> إلغاء Pro</span> : <span className="inline-flex items-center gap-1"><UserCheck size={13} /> تفعيل Pro</span>}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFreeze(user);
                                                        }}
                                                        disabled={isUpdating}
                                                        className={`px-3 py-2 rounded-lg text-xs font-bold border ${user.isFrozen ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'}`}
                                                    >
                                                        {user.isFrozen ? 'فك التجميد' : 'تجميد الحساب'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!filteredUsers.length && (
                                    <tr>
                                        <td className="px-6 py-10 text-center text-gray-400" colSpan={7}>
                                            لا يوجد مستخدمون مطابقون للبحث
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
