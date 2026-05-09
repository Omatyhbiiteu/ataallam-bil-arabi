import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, Headphones, Loader2, RefreshCw, X } from 'lucide-react';
import type { AdminInboxNotification } from '../../hooks/useAdminSupportNotifications';

export interface AdminInboxNotificationsApi {
    items: AdminInboxNotification[];
    loading: boolean;
    error: string | null;
    refresh: () => void | Promise<void>;
    unreadCount: number;
    markRead: (ids: string[]) => void | Promise<void>;
    markAllRead: () => void | Promise<void>;
}

interface AdminSupportNotificationBellProps {
    onOpenTicket: (ticketId: string) => void;
    inbox: AdminInboxNotificationsApi;
}

function kindIcon(kind: string) {
    if (kind === 'support_new_ticket') return '🔔';
    if (kind === 'support_user_message') return '💬';
    return '📩';
}

export const AdminSupportNotificationBell: React.FC<AdminSupportNotificationBellProps> = ({ onOpenTicket, inbox }) => {
    const [open, setOpen] = useState(false);
    const { items, loading, refresh, unreadCount, markRead, markAllRead } = inbox;

    const handleOpenTicket = (n: AdminInboxNotification) => {
        if (n.ticketId) {
            if (!n.readAt) void markRead([n.id]);
            onOpenTicket(n.ticketId);
            setOpen(false);
        }
    };

    return (
        <div className="relative z-[45]">
            <button
                type="button"
                onClick={() => { setOpen(v => !v); void refresh(); }}
                className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"
                title="إشعارات الدعم"
                aria-label="إشعارات الدعم"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-black text-black flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-[46]"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            className="absolute start-0 top-full z-[47] mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,420px)] max-w-[calc(100vw-1.5rem)] -translate-x-3 origin-top-start flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                        >
                            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-slate-950/80">
                                <span className="font-black text-sm text-white">وارد الدعم</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => void refresh()}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
                                        title="تحديث"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    </button>
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => void markAllRead()}
                                            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1"
                                        >
                                            الكل مقروء
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                                {items.length === 0 && !loading && (
                                    <p className="text-center text-gray-500 text-xs py-8">لا توجد إشعارات بعد</p>
                                )}
                                {items.map(n => (
                                    <div
                                        key={n.id}
                                        className={`rounded-xl p-3 border text-right ${n.readAt ? 'border-white/5 bg-white/[0.03]' : 'border-amber-500/25 bg-amber-500/5'}`}
                                    >
                                        <div className="flex gap-2 items-start">
                                            <span className="text-lg shrink-0">{kindIcon(n.kind)}</span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-white text-xs leading-snug">{n.title}</p>
                                                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-3">{n.body}</p>
                                                <p className="text-[10px] text-gray-600 mt-1">
                                                    {n.createdAt ? new Date(n.createdAt).toLocaleString('ar-EG') : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2 justify-end flex-wrap">
                                            {n.ticketId && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenTicket(n)}
                                                    className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600/30 text-blue-200 hover:bg-blue-600/50"
                                                >
                                                    <Headphones size={12} />
                                                    فتح التذكرة
                                                </button>
                                            )}
                                            {!n.readAt && (
                                                <button
                                                    type="button"
                                                    onClick={() => void markRead([n.id])}
                                                    className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10"
                                                >
                                                    <Check size={12} />
                                                    تم القراءة
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
