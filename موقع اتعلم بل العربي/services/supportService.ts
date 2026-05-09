import { SupportTicket, TicketMessage } from '../types';

const STORAGE_KEY = 'fluentflow_support_tickets';

const DEFAULT_TICKETS: SupportTicket[] = [
    {
        id: '1',
        userId: 'current_user_id', // Mock user id
        userName: 'أحمد علي',
        subject: 'مشكلة في تفعيل الاشتراك',
        status: 'open',
        priority: 'medium',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastUpdate: new Date(Date.now() - 3600000).toISOString(),
        messages: [
            {
                id: 'm1',
                sender: 'user',
                text: 'أهلاً، أنا دفعت عن طريق فودافون كاش ومحتاج أفعل حسابي.',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'm2',
                sender: 'admin',
                text: 'أهلاً بك، يرجى إرسال صورة الإيصال هنا لتأكيد العملية.',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            }
        ]
    }
];

export const SupportService = {
    getTickets: (): SupportTicket[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : DEFAULT_TICKETS;
        } catch (e) {
            console.error("Failed to load support tickets", e);
            return DEFAULT_TICKETS;
        }
    },

    getUserTickets: (userId: string): SupportTicket[] => {
        return SupportService.getTickets().filter(t => t.userId === userId);
    },

    saveTickets: (tickets: SupportTicket[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
        } catch (e) {
            console.error("Failed to save support tickets", e);
        }
    },

    createTicket: (userId: string, userName: string, subject: string, initialMessage: string): SupportTicket => {
        const tickets = SupportService.getTickets();
        const newTicket: SupportTicket = {
            id: crypto.randomUUID(),
            userId,
            userName,
            subject,
            status: 'open',
            priority: 'medium',
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            messages: [
                {
                    id: crypto.randomUUID(),
                    sender: 'user',
                    text: initialMessage,
                    timestamp: new Date().toISOString()
                }
            ]
        };
        SupportService.saveTickets([newTicket, ...tickets]);
        return newTicket;
    },

    addMessage: (ticketId: string, sender: 'user' | 'admin', text: string): SupportTicket | null => {
        const tickets = SupportService.getTickets();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index === -1) return null;

        const newMessage: TicketMessage = {
            id: crypto.randomUUID(),
            sender,
            text,
            timestamp: new Date().toISOString()
        };

        const updatedTicket = {
            ...tickets[index],
            messages: [...tickets[index].messages, newMessage],
            lastUpdate: new Date().toISOString(),
            status: sender === 'user' ? 'open' as const : 'in_progress' as const
        };

        tickets[index] = updatedTicket;
        SupportService.saveTickets(tickets);
        return updatedTicket;
    }
};
