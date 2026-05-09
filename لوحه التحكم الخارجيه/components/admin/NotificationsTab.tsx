import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Send, Clock, Users, CheckCircle, AlertCircle, Trash2,
    MessageSquare, Star, Trophy, Gift, Zap, Headphones, Loader2, RefreshCw, Check
} from 'lucide-react';
import { BroadcastNotification } from '../../types';
import type { AdminInboxNotificationsApi } from './AdminSupportNotificationBell';
import type { AdminInboxNotification } from '../../hooks/useAdminSupportNotifications';
import { AdminAPI } from '../../services/apiClient';

interface NotificationsTabProps {
    broadcasts: BroadcastNotification[];
    setBroadcasts: (broadcasts: BroadcastNotification[]) => void;
    adminInbox: AdminInboxNotificationsApi;
    onOpenSupportTicket: (ticketId: string) => void;
}

function inboxKindIcon(kind: string) {
    if (kind === 'support_new_ticket') return '🔔';
    if (kind === 'support_user_message') return '💬';
    return '📩';
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
    broadcasts,
    setBroadcasts,
    adminInbox,
    onOpenSupportTicket,
}) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedIcon, setSelectedIcon] = useState<BroadcastNotification['icon']>('bell');
    const [isSending, setIsSending] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ id: string } | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const refreshBroadcasts = useCallback(async () => {
        try {
            const res = (await AdminAPI.getAllBroadcasts()) as { broadcasts?: BroadcastNotification[] };
            if (res?.broadcasts) setBroadcasts(res.broadcasts);
        } catch {
            // يمكن إضافة toast لاحقاً
        }
    }, [setBroadcasts]);

    useEffect(() => {
        void refreshBroadcasts();
    }, [refreshBroadcasts]);

    const handleSend = async () => {
        if (!title || !message) return;
        setIsSending(true);
        try {
            await AdminAPI.createBroadcast({
                title,
                message,
                type: 'info',
                icon: selectedIcon,
                targetAudience: target,
            });
            setTitle('');
            setMessage('');
            await refreshBroadcasts();
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteRequest = (id: string) => {
        setDeleteModal({ id });
    };

    const performDelete = async (scope: 'all' | 'admin_only') => {
        if (!deleteModal) return;
        setDeleteBusy(true);
        try {
            await AdminAPI.deleteBroadcast(deleteModal.id, { scope });
            await refreshBroadcasts();
        } catch (e) {
            console.error(e);
        } finally {
            setDeleteBusy(false);
            setDeleteModal(null);
        }
    };

    const openTicketFromInbox = (n: AdminInboxNotification) => {
        if (!n.ticketId) return;
        if (!n.readAt) void adminInbox.markRead([n.id]);
        onOpenSupportTicket(n.ticketId);
    };

    const icons = [
        { id: 'bell', icon: Bell, label: 'تنبيه' },
        { id: 'star', icon: Star, label: 'مميز' },
        { id: 'trophy', icon: Trophy, label: 'إنجاز' },
        { id: 'gift', icon: Gift, label: 'عرض' },
        { id: 'alert-circle', icon: AlertCircle, label: 'تحذير' },
    ];

    return (
        <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
        >
            <AnimatePresence>
                {deleteModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" dir="rtl">
                        <div className="w-full max-w-[520px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                        حذف إشعار البث
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                        هل تريد حذف هذا الاشعار بالفعل ؟
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDeleteModal(null)}
                                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10"
                                    aria-label="إلغاء"
                                    disabled={deleteBusy}
                                >
                                    <span className="text-gray-500 dark:text-gray-300 text-lg font-bold leading-none">×</span>
                                </button>
                            </div>

                            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                                <button
                                    type="button"
                                    disabled={deleteBusy}
                                    onClick={() => void performDelete('admin_only')}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    مسح عندي فقط
                                </button>

                                <button
                                    type="button"
                                    disabled={deleteBusy}
                                    onClick={() => void performDelete('all')}
                                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                >
                                    مسح من عند كل الطلاب ومن عندي
                                </button>
                            </div>

                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                {deleteBusy ? 'جاري الحذف...' : 'اختر الخيار اللي يناسبك.'}
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <header>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">مركز الإشعارات 🔔</h2>
                <p className="text-gray-400 font-medium">إشعارات وارد الدعم من الطلاب، وإرسال تنبيهات للطلاب من هنا.</p>
            </header>

            {/* وارد الدعم (من الخادم) */}
            <div className="bg-slate-900 border border-amber-500/20 rounded-[2rem] p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <Headphones className="text-amber-500" />
                            وارد الدعم والشكاوى
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">يصلك إشعار عند إنشاء تذكرة جديدة أو عندما يرد المستخدم على المحادثة.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => void adminInbox.refresh()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold"
                        >
                            {adminInbox.loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            تحديث
                        </button>
                        {adminInbox.unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => void adminInbox.markAllRead()}
                                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-sm font-bold hover:bg-amber-500/30"
                            >
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>
                </div>
                {adminInbox.error && (
                    <p className="text-red-400 text-sm mb-3">{adminInbox.error}</p>
                )}
                <div className="space-y-2 max-h-[min(50vh,360px)] overflow-y-auto pr-1">
                    {adminInbox.items.length === 0 && !adminInbox.loading && (
                        <p className="text-center text-gray-600 text-sm py-8">لا توجد إشعارات وارد بعد</p>
                    )}
                    {adminInbox.items.map(n => (
                        <div
                            key={n.id}
                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 justify-between ${n.readAt ? 'border-white/5 bg-white/[0.02]' : 'border-amber-500/30 bg-amber-500/[0.06]'}`}
                        >
                            <div className="flex gap-3 min-w-0">
                                <span className="text-2xl shrink-0">{inboxKindIcon(n.kind)}</span>
                                <div className="min-w-0">
                                    <p className="font-bold text-white text-sm">{n.title}</p>
                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.body}</p>
                                    <p className="text-[10px] text-gray-600 mt-2">
                                        {n.createdAt ? new Date(n.createdAt).toLocaleString('ar-EG') : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0 justify-end">
                                {n.ticketId && (
                                    <button
                                        type="button"
                                        onClick={() => openTicketFromInbox(n)}
                                        className="text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600/40 text-blue-100 hover:bg-blue-600/60"
                                    >
                                        <Headphones size={14} />
                                        فتح في الدعم
                                    </button>
                                )}
                                {!n.readAt && (
                                    <button
                                        type="button"
                                        onClick={() => void adminInbox.markRead([n.id])}
                                        className="text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 text-gray-200 hover:bg-white/15"
                                    >
                                        <Check size={14} />
                                        مقروء
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* --- COMPOSER --- */}
                <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>

                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                        <MessageSquare className="text-blue-500" />
                        إنشاء إشعار جديد
                    </h3>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">عنوان الإشعار</label>
                            <input
                                type="text"
                                placeholder="مثال: قصة جديدة بانتظارك! 📖"
                                className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">نص الرسالة</label>
                            <textarea
                                rows={3}
                                placeholder="ادخل نصاً جذاباً يشجع الطلاب على الفتح..."
                                className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-white font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">الجمهور المستهدف</label>
                                <select
                                    className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none cursor-pointer"
                                    value={target}
                                    onChange={e => setTarget(e.target.value as any)}
                                >
                                    <option value="all">كل الطلاب (All)</option>
                                    <option value="active">النشطين (Active)</option>
                                    <option value="inactive">الخاملين (Inactive)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">أيقونة الإشعار</label>
                                <div className="flex bg-slate-950 border border-white/10 rounded-2xl p-2 gap-1 overflow-x-auto">
                                    {icons.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedIcon(item.id as any)}
                                            className={`p-2 rounded-xl transition-all ${selectedIcon === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                                            title={item.label}
                                        >
                                            <item.icon size={18} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!title || !message || isSending}
                            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${!title || !message
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : isSending
                                    ? 'bg-blue-600/80 text-white cursor-wait'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-1'
                                }`}
                        >
                            {isSending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    جاري الإرسال...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    إرسال الإشعار الآن
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* --- PREVIEW & HISTORY --- */}
                <div className="space-y-6">
                    {/* Live Preview */}
                    <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8">
                        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">معاينة مباشرة</h3>
                        <div className="bg-black/40 rounded-3xl p-4 border border-white/5 backdrop-blur-sm relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedIcon === 'trophy' ? 'bg-amber-500/20 text-amber-500' :
                                    selectedIcon === 'alert-circle' ? 'bg-red-500/20 text-red-500' :
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                    {(() => {
                                        const IconComponent = icons.find(i => i.id === selectedIcon)?.icon || Bell;
                                        return <IconComponent size={24} />;
                                    })()}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm mb-1">{title || 'عنوان الإشعار...'}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">{message || 'نص الرسالة سيظهر هنا...'}</p>
                                    <span className="text-[10px] text-gray-600 mt-2 block">الآن</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex-1 min-h-[300px]">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Clock className="text-gray-500" />
                            سجل الإشعارات
                        </h3>

                        <div className="space-y-3">
                            {(broadcasts || []).length === 0 && (
                                <div className="text-center py-10 text-gray-600">
                                    <Zap size={32} className="mx-auto mb-3 opacity-50" />
                                    <p>لا يوجد سجل إشعارات سابق</p>
                                </div>
                            )}

                            <AnimatePresence>
                                {(broadcasts || []).map(b => {
                                    const IconComponent = icons.find(i => i.id === b.icon)?.icon || Bell;
                                    return (
                                        <motion.div
                                            key={b.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                                    <IconComponent size={14} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">{b.title}</h4>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                        <span>{new Date(b.sentAt).toLocaleDateString('ar-EG')}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1"><Users size={10} /> {b.targetAudience}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteRequest(b.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
