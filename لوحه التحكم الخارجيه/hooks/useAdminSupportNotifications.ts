import { useCallback, useEffect, useState } from 'react';
import { AdminAPI } from '../services/apiClient';

export type AdminInboxNotification = {
    id: string;
    kind: string;
    title: string;
    body: string;
    ticketId: string | null;
    readAt: string | null;
    createdAt: string;
};

export function useAdminSupportNotifications(pollMs = 45000) {
    const [items, setItems] = useState<AdminInboxNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = (await AdminAPI.getNotifications()) as { notifications?: AdminInboxNotification[] };
            setItems(res?.notifications ?? []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'تعذر تحميل الإشعارات');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        if (pollMs <= 0) return undefined;
        const id = window.setInterval(() => void refresh(), pollMs);
        return () => window.clearInterval(id);
    }, [pollMs, refresh]);

    const unreadCount = items.filter(n => !n.readAt).length;

    const markRead = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;
        await AdminAPI.markNotificationsRead(ids);
        setItems(prev =>
            prev.map(n => (ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n))
        );
    }, []);

    const markAllRead = useCallback(async () => {
        await AdminAPI.markAllNotificationsRead();
        const now = new Date().toISOString();
        setItems(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? now })));
    }, []);

    return { items, loading, error, refresh, unreadCount, markRead, markAllRead };
}
