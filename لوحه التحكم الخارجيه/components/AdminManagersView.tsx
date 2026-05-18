import React, { useEffect, useMemo, useState } from 'react';
import { AdminAPI } from '../services/apiClient';
import { Shield, Plus, Trash2, KeyRound, RefreshCw } from 'lucide-react';

type AdminRow = {
    id: number;
    name: string;
    email: string;
    created_at?: string;
};

type PendingAction =
    | { type: 'create-admin'; name: string; email: string; password: string }
    | { type: 'delete-admin'; id: number; name: string; email: string }
    | { type: 'reset-admin-password'; id: number; name: string; email: string; newPassword: string }
    | { type: 'update-my-password'; currentPassword: string; newPassword: string };

export const AdminManagersView: React.FC = () => {
    const [admins, setAdmins] = useState<AdminRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [myNewPassword, setMyNewPassword] = useState('');

    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [securityCode, setSecurityCode] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [successModalMessage, setSuccessModalMessage] = useState('');

    const myProfile = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('hcard_admin_profile') || 'null') as { id?: number; email?: string } | null;
        } catch {
            return null;
        }
    }, []);
    const requiredSecurityCode = import.meta.env.VITE_ADMIN_PASSWORD || 'change-this-security-code';

    const loadAdmins = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await AdminAPI.getAdminUsers();
            setAdmins(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err?.message || 'فشل تحميل المسؤولين');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const filteredAdmins = admins.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        setPendingAction({
            type: 'create-admin',
            name: newName.trim(),
            email: newEmail.trim(),
            password: newPassword,
        });
    };

    const handleUpdateMyPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPendingAction({
            type: 'update-my-password',
            currentPassword,
            newPassword: myNewPassword,
        });
    };

    const handleResetOtherPassword = (adminId: number, name: string, email: string) => {
        setPendingAction({
            type: 'reset-admin-password',
            id: adminId,
            name,
            email,
            newPassword: '',
        });
    };

    const handleDeleteAdmin = (adminId: number, name: string, email: string) => {
        setPendingAction({
            type: 'delete-admin',
            id: adminId,
            name,
            email,
        });
    };

    const closeModal = () => {
        if (actionLoading) return;
        setPendingAction(null);
        setSecurityCode('');
    };

    const executePendingAction = async () => {
        if (!pendingAction) return;
        if (securityCode !== requiredSecurityCode) {
            setError('رمز الحماية غير صحيح');
            return;
        }

        try {
            setActionLoading(true);
            setError('');
            if (pendingAction.type === 'create-admin') {
                await AdminAPI.createAdminUser({
                    name: pendingAction.name,
                    email: pendingAction.email,
                    password: pendingAction.password,
                });
                setNewName('');
                setNewEmail('');
                setNewPassword('');
                await loadAdmins();
                setSuccessModalMessage('تم إضافة المسؤول بنجاح');
            }

            if (pendingAction.type === 'update-my-password') {
                await AdminAPI.updateMyPassword({
                    current_password: pendingAction.currentPassword,
                    new_password: pendingAction.newPassword,
                });
                setCurrentPassword('');
                setMyNewPassword('');
                setSuccessModalMessage('تم تحديث كلمة المرور بنجاح');
            }

            if (pendingAction.type === 'reset-admin-password') {
                if (!pendingAction.newPassword || pendingAction.newPassword.length < 6) {
                    setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
                    setActionLoading(false);
                    return;
                }
                await AdminAPI.resetAdminPassword(String(pendingAction.id), { new_password: pendingAction.newPassword });
                setSuccessModalMessage('تم تحديث كلمة المرور بنجاح');
            }

            if (pendingAction.type === 'delete-admin') {
                await AdminAPI.deleteAdminUser(String(pendingAction.id));
                await loadAdmins();
            }

            closeModal();
        } catch (err: any) {
            setError(err?.message || 'حدث خطأ أثناء تنفيذ العملية');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8" dir="rtl">
            {successModalMessage && (
                <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setSuccessModalMessage('')} />
                    <div className="relative w-full max-w-md rounded-3xl bg-[#0f172a] border border-white/10 shadow-2xl p-6 md:p-8 text-center">
                        <h3 className="text-2xl font-black text-white mb-3">تمت العملية</h3>
                        <p className="text-gray-300 mb-6">{successModalMessage}</p>
                        <button
                            onClick={() => setSuccessModalMessage('')}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3"
                        >
                            تمام
                        </button>
                    </div>
                </div>
            )}

            {pendingAction && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-lg rounded-3xl bg-[#0f172a] border border-white/10 shadow-2xl p-6 md:p-8">
                        <h3 className="text-2xl font-black text-white mb-3">تأكيد العملية</h3>
                        {pendingAction.type === 'create-admin' && (
                            <p className="text-gray-300 leading-7">
                                متأكد انك عايز تضيف المسؤول ده؟
                                <br />
                                الاسم: <span className="font-black text-white">{pendingAction.name}</span>
                                <br />
                                الإيميل: <span className="font-black text-white">{pendingAction.email}</span>
                            </p>
                        )}
                        {pendingAction.type === 'delete-admin' && (
                            <p className="text-gray-300 leading-7">
                                متأكد انك عايز تمسح المسؤول ده؟
                                <br />
                                الاسم: <span className="font-black text-white">{pendingAction.name}</span>
                                <br />
                                الإيميل: <span className="font-black text-white">{pendingAction.email}</span>
                            </p>
                        )}
                        {pendingAction.type === 'reset-admin-password' && (
                            <div>
                                <p className="text-gray-300 leading-7">
                                    متأكد انك عايز تغيّر باسورد المسؤول ده؟
                                    <br />
                                    الاسم: <span className="font-black text-white">{pendingAction.name}</span>
                                    <br />
                                    الإيميل: <span className="font-black text-white">{pendingAction.email}</span>
                                </p>
                                <div className="mt-4">
                                    <label className="text-xs font-black text-gray-400 block mb-2">كلمة المرور الجديدة للمسؤول</label>
                                    <input
                                        type="password"
                                        value={pendingAction.newPassword}
                                        onChange={(e) =>
                                            setPendingAction((prev) =>
                                                prev && prev.type === 'reset-admin-password'
                                                    ? { ...prev, newPassword: e.target.value }
                                                    : prev
                                            )
                                        }
                                        className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white"
                                        placeholder="اكتب كلمة مرور جديدة"
                                    />
                                </div>
                            </div>
                        )}
                        {pendingAction.type === 'update-my-password' && (
                            <p className="text-gray-300 leading-7">
                                متأكد انك عايز تغيّر كلمة مرورك الحالية؟
                            </p>
                        )}

                        <div className="mt-6">
                            <label className="text-xs font-black text-gray-400 block mb-2">أدخل رمز الحماية قبل التنفيذ</label>
                            <input
                                type="password"
                                value={securityCode}
                                onChange={(e) => setSecurityCode(e.target.value)}
                                className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white"
                                placeholder="رمز الحماية"
                            />
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={executePendingAction}
                                disabled={actionLoading}
                                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black py-3"
                            >
                                {actionLoading ? 'جاري التنفيذ...' : 'نعم، تنفيذ'}
                            </button>
                            <button
                                onClick={closeModal}
                                disabled={actionLoading}
                                className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black py-3"
                            >
                                لا، إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                        <Shield className="text-red-400" />
                        إدارة المسؤولين
                    </h1>
                    <p className="text-gray-400">إضافة مسؤولين جدد، تعديل كلمات المرور، وحذف حسابات المسؤولين.</p>
                </div>
                <button
                    onClick={loadAdmins}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
                >
                    <RefreshCw size={16} />
                    تحديث
                </button>
            </div>

            {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-200 rounded-xl px-4 py-3 font-bold text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <form onSubmit={handleCreateAdmin} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-white font-black text-lg flex items-center gap-2"><Plus size={18} /> إضافة مسؤول جديد</h3>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="اسم المسؤول" className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white" required />
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white" required />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة المرور (6 أحرف على الأقل)" className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white" required />
                    <button className="w-full rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold py-3">إضافة المسؤول</button>
                </form>

                <form onSubmit={handleUpdateMyPassword} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-white font-black text-lg flex items-center gap-2"><KeyRound size={18} /> تغيير كلمة مروري</h3>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="كلمة المرور الحالية" className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white" required />
                    <input type="password" value={myNewPassword} onChange={(e) => setMyNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white" required />
                    <button className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-3">تحديث كلمة المرور</button>
                </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-black text-lg">قائمة المسؤولين</h3>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="بحث باسم أو إيميل..."
                        className="w-full max-w-sm rounded-xl bg-slate-900/80 border border-white/10 px-4 py-2.5 text-white"
                    />
                </div>

                {loading ? (
                    <div className="text-gray-400 py-6">جاري تحميل البيانات...</div>
                ) : (
                    <div className="space-y-3">
                        {filteredAdmins.map((admin) => {
                            const isMe = myProfile?.id === admin.id || (myProfile?.email && myProfile.email === admin.email);
                            return (
                                <div key={admin.id} className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                        <div>
                                            <div className="text-white font-bold">{admin.name} {isMe ? '(أنت)' : ''}</div>
                                            <div className="text-gray-400 text-sm">{admin.email}</div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button onClick={() => handleResetOtherPassword(admin.id, admin.name, admin.email)} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">
                                                تعديل/استرجاع الباسورد
                                            </button>

                                            <button
                                                onClick={() => handleDeleteAdmin(admin.id, admin.name, admin.email)}
                                                disabled={isMe}
                                                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center gap-1"
                                            >
                                                <Trash2 size={14} />
                                                حذف
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {!filteredAdmins.length && (
                            <div className="text-gray-500 text-sm py-6 text-center">لا يوجد مسؤولون مطابقون للبحث.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
