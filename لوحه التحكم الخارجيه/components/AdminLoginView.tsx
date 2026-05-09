import React, { useState } from 'react';
import { Lock, Mail, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthAPI } from '../services/apiClient';

interface AdminLoginViewProps {
    onSuccess: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const result = await AuthAPI.adminLogin({
                email: email.trim(),
                password,
            });

            if (!result?.token) {
                setError('تعذر تسجيل الدخول. حاول مرة أخرى.');
                setIsSubmitting(false);
                return;
            }

            localStorage.setItem('hcard_admin_token', result.token);
            localStorage.setItem('hcard_admin_profile', JSON.stringify(result.admin || null));
            onSuccess();
        } catch (err: any) {
            setError(err?.message || 'بيانات دخول الأدمن غير صحيحة');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f172a] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/25 via-[#0f172a] to-black" />

            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="relative z-10 p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl max-w-md mx-4 w-full"
            >
                <h2 className="text-2xl font-black text-white mb-2 text-center">تسجيل دخول المسؤول</h2>
                <p className="text-gray-400 text-sm text-center mb-8">تم التحقق من رقم الحماية. أدخل بيانات المسؤول للمتابعة.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl bg-slate-900/80 border border-white/10 py-3 pr-10 pl-4 text-white placeholder-gray-500 outline-none focus:border-red-500/60"
                            placeholder="admin@et3alem.local"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl bg-slate-900/80 border border-white/10 py-3 pr-10 pl-4 text-white placeholder-gray-500 outline-none focus:border-red-500/60"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 text-center font-bold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !email || !password}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                جاري التحقق...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                دخول لوحة المسؤول
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
