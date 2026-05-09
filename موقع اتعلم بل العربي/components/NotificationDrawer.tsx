import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Star, Trophy, BookOpen, Target, Gift, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppNotification } from '../types';

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: AppNotification[];
    setNotifications: (notifs: AppNotification[]) => void;
    t: any;
    dir: string;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, notifications, setNotifications, t, dir }) => {
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
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'trophy': return <Trophy size={20} />;
            case 'star': return <Star size={20} />;
            case 'target': return <Target size={20} />;
            case 'book': return <BookOpen size={20} />;
            case 'gift': return <Gift size={20} />;
            case 'clock': return <Clock size={20} />;
            case 'check-circle': return <CheckCircle size={20} />;
            default: return <Bell size={20} />;
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
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: dir === 'rtl' ? '-100%' : '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed top-0 bottom-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-full max-w-md bg-white dark:bg-dark-card shadow-2xl z-[70] border-r border-l border-stone-200 dark:border-gray-800 flex flex-col`}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-stone-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Bell size={24} className="text-gray-800 dark:text-white" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-gray-900">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white">الإشعارات</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Actions Toolbar */}
                        {notifications.length > 0 && (
                            <div className="px-6 py-3 border-b border-stone-100 dark:border-gray-800 flex gap-2 overflow-x-auto no-scrollbar">
                                <button onClick={markAllAsRead} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap">
                                    <Check size={14} /> تحديد الكل كمقروء
                                </button>
                                <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap">
                                    <Trash2 size={14} /> مسح الكل
                                </button>
                            </div>
                        )}

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-6">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <Bell size={32} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">لا توجد إشعارات</h3>
                                    <p className="text-sm text-gray-500">بداية هادئة! ستظهر إشعاراتك هنا.</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <motion.div
                                        key={notification.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className={`relative p-4 rounded-2xl border transition-all hover:bg-stone-50 dark:hover:bg-white/5 ${notification.read
                                                ? 'bg-transparent border-stone-100 dark:border-gray-800 opacity-60'
                                                : 'bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900/50 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${getTypeColor(notification.type)} flex-shrink-0`}>
                                                {getIcon(notification.icon)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm font-bold ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{notification.time}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2 line-clamp-2">
                                                    {notification.message}
                                                </p>

                                                {!notification.read && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                                                        >
                                                            <Check size={12} /> تم
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="absolute top-2 left-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={12} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
