import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Star, Trophy, BookOpen, Target, Gift, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { AppNotification } from '../types';
import { AdminAPI } from '../services/apiClient';

interface NotificationsViewProps {
    t: any;
    dueCardsCount: number;
    notifications: AppNotification[];
    setNotifications: (notifs: AppNotification[]) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ t, dueCardsCount, notifications, setNotifications }) => {
    // Track if a manual reminder was already added to avoid duplicates if count changes
    const [hasReminder, setHasReminder] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    useEffect(() => {
        if (dueCardsCount > 0 && !hasReminder) {
            const reminder: AppNotification = {
                id: 'reminder-due',
                type: 'reminder',
                title: 'جاهز للمراجعة!',
                message: `لديك ${dueCardsCount} بطاقة جاهزة للمراجعة الآن. لا تدع الذاكرة تتلاشى!`,
                time: 'الآن',
                read: false,
                icon: 'clock'
            };
            // Only add if not already there
            if (!notifications.find(n => n.id === 'reminder-due')) {
                setNotifications([reminder, ...notifications]);
            }
            setHasReminder(true);
        }
    }, [dueCardsCount, notifications, hasReminder, setNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(
            notifications.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
        if (id === 'reminder-due') setHasReminder(false);
    };

    const clearAll = () => {
        setNotifications([]);
        setHasReminder(false);
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'trophy': return <Trophy size={24} />;
            case 'star': return <Star size={24} />;
            case 'target': return <Target size={24} />;
            case 'book': return <BookOpen size={24} />;
            case 'gift': return <Gift size={24} />;
            case 'clock': return <Clock size={24} />;
            case 'check-circle': return <CheckCircle size={24} />;
            default: return <Bell size={24} />;
        }
    };
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'achievement': return 'from-amber-500 to-orange-600';
            case 'reminder': return 'from-blue-500 to-indigo-600';
            case 'milestone': return 'from-purple-500 to-violet-600';
            case 'system': return 'from-green-500 to-emerald-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <div className="p-4 md:p-8 lg:p-12 space-y-6 md:space-y-8 animate-slide-up pb-24 max-w-[1920px] mx-auto">
            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" dir="rtl">
                    <div className="w-full max-w-[520px] bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    حذف الإشعار
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                    هل تريد حذف هذا الاشعار بالفعل ؟
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10"
                                aria-label="إلغاء"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                            <button
                                type="button"
                                disabled={deleteBusy}
                                onClick={() => {
                                    deleteNotification(deleteTarget.id);
                                    setDeleteTarget(null);
                                }}
                                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                مسح عندي فقط
                            </button>

                            <button
                                type="button"
                                disabled={
                                    deleteBusy ||
                                    !deleteTarget.broadcastId ||
                                    !localStorage.getItem('hcard_admin_token')
                                }
                                onClick={() => {
                                    if (!deleteTarget.broadcastId) return;
                                    if (!localStorage.getItem('hcard_admin_token')) return;

                                    void (async () => {
                                        setDeleteBusy(true);
                                        try {
                                            await AdminAPI.deleteBroadcast(deleteTarget.broadcastId as string);
                                            setNotifications(
                                                notifications.filter((n) => n.broadcastId !== deleteTarget.broadcastId)
                                            );
                                            setDeleteTarget(null);
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            setDeleteBusy(false);
                                        }
                                    })();
                                }}
                                className="flex-1 py-3 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            >
                                مسح من عند كل الطلاب
                            </button>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            خيار مسح كل الطلاب يتطلب صلاحية مسؤول ويعتمد على إشعار البث (Broadcast).
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl">
                            <Bell size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black mb-2">الإشعارات</h1>
                            <p className="text-lg text-white/80">
                                {unreadCount > 0 ? `لديك ${unreadCount} إشعار جديد` : 'لا توجد إشعارات جديدة'}
                            </p>
                        </div>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex gap-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-2xl font-bold hover:bg-white/30 transition-colors border border-white/30"
                                >
                                    <Check size={20} className="inline mr-2" />
                                    تحديد الكل كمقروء
                                </button>
                            )}
                            <button
                                onClick={clearAll}
                                className="px-6 py-3 bg-red-500/80 backdrop-blur-md text-white rounded-2xl font-bold hover:bg-red-600 transition-colors"
                            >
                                <X size={20} className="inline mr-2" />
                                حذف الكل
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="bg-white dark:bg-dark-card p-12 rounded-3xl shadow-lg border border-stone-200 dark:border-gray-700 text-center">
                    <Bell size={64} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">لا توجد إشعارات</h3>
                    <p className="text-gray-600 dark:text-gray-400">ستظهر إشعاراتك هنا عند حدوث أي نشاط جديد</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`bg-white dark:bg-dark-card p-6 rounded-3xl shadow-lg border-2 transition-all hover:shadow-xl ${notification.read
                                ? 'border-stone-200 dark:border-gray-700 opacity-75'
                                : 'border-amber-300 dark:border-amber-800 shadow-amber-500/20'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`w-14 h-14 bg-gradient-to-br ${getTypeColor(notification.type)} rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                                    {getIcon(notification.icon)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">
                                            {notification.title}
                                        </h3>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {notification.time}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                                        {notification.message}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm"
                                            >
                                                <Check size={16} className="inline mr-1" />
                                                تحديد كمقروء
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDeleteTarget(notification)}
                                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                                        >
                                            <X size={16} className="inline mr-1" />
                                            حذف
                                        </button>
                                    </div>
                                </div>

                                {/* Unread Indicator */}
                                {!notification.read && (
                                    <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};
