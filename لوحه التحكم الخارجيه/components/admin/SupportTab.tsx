import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare, Clock, CheckCircle,
    Send, RefreshCw, X, Loader2, UserRound
} from 'lucide-react';
import { SupportTicket } from '../../types';
import { AdminAPI } from '../../services/apiClient';

interface SupportTabProps {
    tickets: SupportTicket[];
    setTickets: (tickets: SupportTicket[]) => void;
    /** عند فتح تذكرة من إشعار المسؤول */
    initialSelectedTicketId?: string | null;
    onConsumedInitialTicket?: () => void;
    /** فتح صفحة المستخدمين على هذا المستخدم (معرّف التطبيق) */
    onOpenUserInUsersTab?: (userId: string) => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({
    tickets,
    setTickets,
    initialSelectedTicketId,
    onConsumedInitialTicket,
    onOpenUserInUsersTab,
}) => {
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
    const [busy, setBusy] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    const refreshTickets = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = (await AdminAPI.getAllTickets()) as { tickets?: SupportTicket[] };
            if (res?.tickets) setTickets(res.tickets);
        } catch {
            // يمكن إضافة toast لاحقاً
        } finally {
            setRefreshing(false);
        }
    }, [setTickets]);

    useEffect(() => {
        if (!initialSelectedTicketId) return;
        let cancelled = false;
        void (async () => {
            await refreshTickets();
            if (cancelled) return;
            setSelectedTicketId(initialSelectedTicketId);
            onConsumedInitialTicket?.();
        })();
        return () => {
            cancelled = true;
        };
    }, [initialSelectedTicketId, refreshTickets]);

    const handleSendMessage = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setBusy(true);
        try {
            const res = (await AdminAPI.addTicketMessage(selectedTicket.id, replyText.trim())) as { ticket: SupportTicket };
            setTickets(prev => prev.map(t => t.id === res.ticket.id ? res.ticket : t));
            setReplyText('');
        } catch {
            // يمكن إضافة toast
        } finally {
            setBusy(false);
        }
    };

    const handleStatusChange = async (status: SupportTicket['status']) => {
        if (!selectedTicket) return;
        setBusy(true);
        try {
            const res = (await AdminAPI.updateTicketStatus(selectedTicket.id, { status })) as { ticket: SupportTicket };
            setTickets(prev => prev.map(t => t.id === res.ticket.id ? res.ticket : t));
        } catch {
            //
        } finally {
            setBusy(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'resolved') return t.status === 'resolved';
        return t.status === 'open' || t.status === 'in_progress';
    }).sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());

    return (
        <motion.div
            key="support"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6"
        >
            <div className={`w-full md:w-96 flex flex-col bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <MessageSquare className="text-amber-500" />
                            رسائل الدعم
                        </h2>
                        <button
                            type="button"
                            onClick={() => void refreshTickets()}
                            disabled={refreshing}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-50"
                            title="تحديث من الخادم"
                        >
                            {refreshing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <FilterButton label="الكل" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
                        <FilterButton label="مفتوحة" active={filterStatus === 'open'} onClick={() => setFilterStatus('open')} />
                        <FilterButton label="مغلقة" active={filterStatus === 'resolved'} onClick={() => setFilterStatus('resolved')} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredTickets.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            <Clock size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">لا توجد رسائل بهذا التصنيف</p>
                        </div>
                    )}
                    {filteredTickets.map(ticket => (
                        <div
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border border-transparent ${selectedTicketId === ticket.id
                                ? 'bg-blue-600/10 border-blue-500/30 ring-1 ring-blue-500/30'
                                : 'bg-white/5 hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-green-500/20 text-green-500' :
                                    ticket.status === 'in_progress' ? 'bg-amber-500/20 text-amber-500' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {ticket.status === 'open' ? 'جديد' : ticket.status === 'in_progress' ? 'جاري' : 'مغلق'}
                                </span>
                                <span className="text-[10px] text-gray-500">{new Date(ticket.lastUpdate).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <h4 className="font-bold text-white text-sm mb-1 truncate">{ticket.subject}</h4>
                            <p className="text-xs text-gray-400 truncate">{ticket.messages[ticket.messages.length - 1]?.text ?? ''}</p>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (ticket.userId && onOpenUserInUsersTab) onOpenUserInUsersTab(ticket.userId);
                                }}
                                disabled={!ticket.userId || !onOpenUserInUsersTab}
                                className="mt-3 flex items-center gap-2 text-right rounded-xl p-1.5 -mr-1.5 -mb-1 w-full hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors group/user"
                                title="عرض ملف المستخدم في «المستخدمين»"
                            >
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold shrink-0">
                                    {ticket.userName.charAt(0)}
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium group-hover/user:text-blue-300 flex items-center gap-1 min-w-0">
                                    <UserRound size={12} className="shrink-0 text-blue-400" />
                                    <span className="truncate">{ticket.userName}</span>
                                </span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedTicket ? (
                <div className="flex-1 flex flex-col bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setSelectedTicketId(null)} className="md:hidden p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
                            <div>
                                <h3 className="font-bold text-white text-lg">{selectedTicket.subject}</h3>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                    <span>بواسطة</span>
                                    {selectedTicket.userId && onOpenUserInUsersTab ? (
                                        <button
                                            type="button"
                                            onClick={() => onOpenUserInUsersTab(selectedTicket.userId)}
                                            className="inline-flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 hover:underline"
                                        >
                                            <UserRound size={14} />
                                            {selectedTicket.userName}
                                        </button>
                                    ) : (
                                        <span>{selectedTicket.userName}</span>
                                    )}
                                    <span>•</span>
                                    <span>{new Date(selectedTicket.createdAt).toLocaleString('ar-EG')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedTicket.status !== 'resolved' ? (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleStatusChange('resolved')}
                                    className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircle size={14} /> إغلاق التذكرة
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleStatusChange('in_progress')}
                                    className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <RefreshCw size={14} /> إعادة فتح
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {selectedTicket.messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 ${msg.sender === 'admin'
                                    ? 'bg-blue-600 text-white rounded-tl-sm'
                                    : 'bg-white/10 text-gray-200 rounded-tr-sm'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <span className={`text-[10px] mt-2 block ${msg.sender === 'admin' ? 'text-blue-200' : 'text-gray-500'}`}>
                                        {msg.sender === 'admin' ? 'أنت' : selectedTicket.userName} • {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/5">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="اكتب ردك هنا..."
                                className="w-full bg-slate-950 border border-white/10 pl-12 pr-6 py-4 rounded-xl text-white outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !busy && void handleSendMessage()}
                                disabled={busy}
                            />
                            <button
                                type="button"
                                onClick={() => void handleSendMessage()}
                                disabled={!replyText.trim() || busy}
                                className="absolute left-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                {busy ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 bg-slate-900 border border-white/5 rounded-[2.5rem] items-center justify-center text-gray-500 flex-col gap-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                        <MessageSquare size={40} className="opacity-50" />
                    </div>
                    <p className="font-medium">اختر محادثة للبدء في الرد</p>
                    <p className="text-xs text-gray-600 max-w-sm text-center">التذاكر تُحمّل من قاعدة البيانات — نفس المحادثات التي يرسلها المستخدمون من «التواصل المباشر».</p>
                </div>
            )}
        </motion.div>
    );
};

const FilterButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${active ? 'bg-white text-slate-900' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
    >
        {label}
    </button>
);
