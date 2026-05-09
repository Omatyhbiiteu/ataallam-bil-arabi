import React from 'react';
import { X, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, onClose, onConfirm, title, message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: 'bg-red-500',
            text: 'text-red-500',
            border: 'border-red-500/20',
            lightBg: 'bg-red-100 dark:bg-red-900/20',
            icon: <Trash2 className="text-red-500" size={32} />
        },
        warning: {
            bg: 'bg-orange-500',
            text: 'text-orange-500',
            border: 'border-orange-500/20',
            lightBg: 'bg-orange-100 dark:bg-orange-900/20',
            icon: <AlertTriangle className="text-orange-500" size={32} />
        },
        info: {
            bg: 'bg-blue-500',
            text: 'text-blue-500',
            border: 'border-blue-500/20',
            lightBg: 'bg-blue-100 dark:bg-blue-900/20',
            icon: <CheckCircle className="text-blue-500" size={32} />
        }
    };

    const currentTheme = colors[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-white/5 animate-scale-up overflow-hidden">
                {/* Decorative Elements */}
                <div className={`absolute -top-12 -right-12 w-32 h-32 ${currentTheme.bg} opacity-10 rounded-full blur-3xl`} />
                <div className={`absolute -bottom-12 -left-12 w-32 h-32 ${currentTheme.bg} opacity-10 rounded-full blur-3xl`} />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-20 h-20 ${currentTheme.lightBg} rounded-3xl flex items-center justify-center mb-6 shadow-inner border ${currentTheme.border}`}>
                        {currentTheme.icon}
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                        {title}
                    </h3>

                    <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-10 px-4">
                        {message}
                    </p>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-4 ${currentTheme.bg} text-white rounded-2xl font-black shadow-lg shadow-${type}-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-300`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
