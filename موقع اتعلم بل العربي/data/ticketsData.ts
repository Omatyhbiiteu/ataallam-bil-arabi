// بيانات تذاكر الدعم الفني
export const INITIAL_TICKETS: any[] = [
    {
        id: 't-1',
        userId: 'user-1',
        userName: 'أحمد محمد',
        subject: 'مشكلة في تشغيل الصوت',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        lastUpdate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        messages: [
            { id: 'm-1', sender: 'user', text: 'مرحباً، حاولت تشغيل الصوت في القصة الثالثة ولكن لا يعمل. جربت متصفح كروم وفايرفوكس.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() }
        ]
    },
    {
        id: 't-2',
        userId: 'user-2',
        userName: 'سارة علي',
        subject: 'استفسار عن الاشتراكات',
        status: 'in_progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        lastUpdate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        messages: [
            { id: 'm-2', sender: 'user', text: 'هل يمكنني الدفع عن طريق فودافون كاش؟', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
            { id: 'm-3', sender: 'admin', text: 'أهلاً سارة، نعم متاح. يمكنك التحويل على الرقم الموجود في صفحة الإعدادات.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() }
        ]
    },
    {
        id: 't-3',
        userId: 'user-3',
        userName: 'خالد عمر',
        subject: 'اقتراح لإضافة قصص جديدة',
        status: 'resolved',
        priority: 'low',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        lastUpdate: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
        messages: [
            { id: 'm-4', sender: 'user', text: 'ياريت تضيفوا قصص خيال علمي أكثر.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
            { id: 'm-5', sender: 'admin', text: 'شكراً لاقتراحك يا خالد! سنقوم بإضافة مجموعة جديدة قريباً.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString() }
        ]
    }
];
