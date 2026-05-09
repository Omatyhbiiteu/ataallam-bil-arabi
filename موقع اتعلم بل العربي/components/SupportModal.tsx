import React, { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
    X, Send, MessageSquare, Plus, ChevronRight, Clock, CheckCircle,
    Headphones, ArrowRight, Loader2
} from 'lucide-react';
import { SupportAPI } from '../services/apiClient';
import { SupportTicket } from '../types';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userName }) => {
    const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [replyText, setReplyText] = useState('');
    const [listLoading, setListLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const load = async () => {
            setLoadError('');
            setListLoading(true);
            try {
                const token = localStorage.getItem('hcard_user_token') || localStorage.getItem('auth_token');
                if (!token) {
                    setLoadError('يجب تسجيل الدخول لاستخدام التواصل المباشر مع الدعم.');
                    setTickets([]);
                    return;
                }
                const res = (await SupportAPI.getTickets()) as { tickets?: SupportTicket[] };
                setTickets(res.tickets ?? []);
            } catch (e: any) {
                setLoadError(e?.message || 'تعذر تحميل التذاكر. تأكد أن السيرفر يعمل وأنك مسجّل الدخول.');
                setTickets([]);
            } finally {
                setListLoading(false);
            }
        };

        void load();
    }, [isOpen]);

    const handleCreateTicket = async () => {
        if (!newSubject.trim() || !newMessage.trim()) return;
        setActionLoading(true);
        setLoadError('');
        try {
            const res = (await SupportAPI.createTicket({
                subject: newSubject.trim(),
                message: newMessage.trim(),
            })) as { ticket: SupportTicket };
            setTickets((prev) => [res.ticket, ...prev]);
            setNewSubject('');
            setNewMessage('');
            setView('list');
        } catch (e: any) {
            setLoadError(e?.message || 'فشل إنشاء التذكرة');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicketId) return;
        setActionLoading(true);
        setLoadError('');
        try {
            const res = (await SupportAPI.addMessage(selectedTicketId, { text: replyText.trim() })) as { ticket: SupportTicket };
            setTickets((prev) => prev.map((t) => (t.id === res.ticket.id ? res.ticket : t)));
            setReplyText('');
        } catch (e: any) {
            setLoadError(e?.message || 'فشل إرسال الرسالة');
        } finally {
            setActionLoading(false);
        }
    };

    const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <m.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-2xl h-[600px] rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-4">
                        {view !== 'list' && (
                            <button
                                type="button"
                                onClick={() => { setView('list'); setSelectedTicketId(null); }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                <ArrowRight size={20} className="text-gray-500" />
                            </button>
                        )}
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Headphones className="text-primary" />
                                {view === 'list' ? 'مركز المساعدة والرسائل' : view === 'new' ? 'إنشاء تذكرة دعم' : 'محادثة الدعم'}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {view === 'list' ? `مرحباً ${userName} — تظهر تذاكرك عند المسؤول فوراً` : 'فريقنا متاح لمساعدتك دائماً'}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {loadError && (
                    <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center">
                        {loadError}
                    </div>
                )}

                <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-slate-900/50">
                    <AnimatePresence mode="wait">
                        {view === 'list' && (
                            <m.div
                                key="list"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col p-6"
                            >
                                <button
                                    type="button"
                                    onClick={() => setView('new')}
                                    disabled={listLoading}
                                    className="w-full p-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mb-6 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    <Plus size={20} />
                                    فتح تذكرة دعم جديدة
                                </button>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                    {listLoading ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
                                            <Loader2 className="animate-spin" size={32} />
                                            <span className="font-bold text-sm">جاري التحميل...</span>
                                        </div>
                                    ) : tickets.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                                            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                                                <MessageSquare size={40} />
                                            </div>
                                            <p className="font-bold text-gray-500">لا توجد تذاكر بعد</p>
                                            <p className="text-xs text-gray-400 max-w-xs">اضغط «فتح تذكرة دعم جديدة» لمراسلة الفريق.</p>
                                        </div>
                                    ) : (
                                        tickets.map((ticket) => (
                                            <button
                                                type="button"
                                                key={ticket.id}
                                                onClick={() => { setSelectedTicketId(ticket.id); setView('chat'); }}
                                                className="w-full text-right p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl hover:border-primary/30 transition-all group flex items-start gap-4"
                                            >
                                                <div className={`mt-1 p-2 rounded-xl shrink-0 ${ticket.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {ticket.status === 'resolved' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-black text-gray-900 dark:text-white truncate">{ticket.subject}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 shrink-0 mr-2">{new Date(ticket.lastUpdate).toLocaleDateString('ar-EG')}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">{ticket.messages[ticket.messages.length - 1]?.text ?? ''}</p>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-300 mt-3 group-hover:translate-x-1 transition-transform shrink-0" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </m.div>
                        )}

                        {view === 'chat' && selectedTicket && (
                            <m.div
                                key="chat"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {selectedTicket.messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.sender === 'user'
                                                ? 'bg-primary text-white rounded-tl-none'
                                                : 'bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-tr-none border border-gray-100 dark:border-white/5'
                                                }`}>
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                                <span className={`text-[9px] mt-2 block font-bold ${msg.sender === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5 flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !actionLoading && void handleSendReply()}
                                        placeholder="اكتب ردك هنا..."
                                        disabled={actionLoading}
                                        className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all dark:text-white disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void handleSendReply()}
                                        disabled={!replyText.trim() || actionLoading}
                                        className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 disabled:grayscale disabled:opacity-50 transition-all hover:scale-105"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                    </button>
                                </div>
                            </m.div>
                        )}

                        {view === 'new' && (
                            <m.div
                                key="new"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full p-8 flex flex-col justify-center max-w-md mx-auto space-y-6 overflow-y-auto"
                            >
                                <div className="text-center space-y-2 mb-4">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
                                        <Plus size={32} />
                                    </div>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">كيف يمكننا مساعدتك؟</h4>
                                    <p className="text-xs text-gray-500 font-bold">سيتم إرسال طلبك لفريق الدعم عبر الخادم (يظهر في لوحة المسؤول).</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 mb-1 block">رأس الموضوع</label>
                                        <input
                                            type="text"
                                            value={newSubject}
                                            onChange={(e) => setNewSubject(e.target.value)}
                                            placeholder="مثال: مشكلة في تفعيل الكود"
                                            disabled={actionLoading}
                                            className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all dark:text-white font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 mb-1 block">تفاصيل الرسالة</label>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            rows={4}
                                            placeholder="اشرح مشكلتك هنا بالتفصيل..."
                                            disabled={actionLoading}
                                            className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary transition-all dark:text-white resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleCreateTicket()}
                                    disabled={!newSubject.trim() || !newMessage.trim() || actionLoading}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={22} /> : null}
                                    إرسال التذكرة الآن
                                </button>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>
            </m.div>
        </div>
    );
};
