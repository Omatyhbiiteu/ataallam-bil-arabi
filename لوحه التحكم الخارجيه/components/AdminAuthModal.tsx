
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ArrowRight, X, AlertCircle, CheckCircle2, Shield, Hexagon } from 'lucide-react';

interface AdminAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onFailure?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess, onFailure }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError(false);
            setSuccess(false);
            setIsFocused(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(false);

        // Simulate network delay for realism and to show the animation
        await new Promise(resolve => setTimeout(resolve, 1200));

        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'change-this-security-code';

        if (password === adminPassword) {
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 800);
        } else {
            setError(true);
            setTimeout(() => {
                setIsSubmitting(false);
                if (onFailure) onFailure();
            }, 700);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Dark, intensely blurred background */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#05050A]/80 backdrop-blur-xl"
                    />

                    {/* Animated Background Mesh Orbs */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center items-center"
                    >
                        <motion.div 
                            animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute w-[800px] h-[800px] bg-gradient-to-tr from-indigo-900/30 to-purple-900/30 rounded-full blur-[100px] mix-blend-screen"
                        />
                        <motion.div 
                            animate={{ rotate: -360, scale: [1, 1.3, 1] }} 
                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                            className="absolute w-[600px] h-[600px] -top-32 -right-32 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-full blur-[100px] mix-blend-screen"
                        />
                    </motion.div>

                    {/* Modal Card wrapper for 3D perspective and glow */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30, rotateX: 10 }}
                        animate={{ 
                            scale: 1, 
                            opacity: 1, 
                            y: 0, 
                            rotateX: 0,
                            boxShadow: success 
                                ? '0 0 80px rgba(34, 197, 94, 0.2)' 
                                : isFocused 
                                    ? '0 0 80px rgba(99, 102, 241, 0.15)' 
                                    : '0 30px 60px -15px rgba(0, 0, 0, 0.8)'
                        }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-sm rounded-[32px] overflow-visible perspective-1000 z-10"
                    >
                        {/* The actual Glass Card */}
                        <div className="relative w-full h-full bg-[#0A0A0F]/60 backdrop-blur-2xl border border-white/5 rounded-[32px] overflow-hidden">
                            
                            {/* Inner ambient light tracing the top border */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

                            {/* Close Button */}
                            <button 
                                onClick={onClose}
                                className="absolute top-5 right-5 p-2.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300 z-20 hover:rotate-90 group"
                            >
                                <X size={20} className="group-hover:scale-110 transition-transform" />
                            </button>

                            <div className="relative px-8 pt-16 pb-10">
                                {/* Hexagon Shield Icon Animation */}
                                <div className="flex flex-col items-center mb-10 relative">
                                    <motion.div 
                                        className="relative w-20 h-20 mb-6 flex items-center justify-center"
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <motion.div 
                                            animate={{ rotate: 360 }} 
                                            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0"
                                        >
                                            <Hexagon size={80} strokeWidth={0.5} className={success ? 'text-green-500/30' : 'text-indigo-500/30'} />
                                        </motion.div>
                                        <div className={`absolute inset-2 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-all duration-700 ${
                                            success 
                                                ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]' 
                                                : error 
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                                                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
                                        }`}>
                                            {success ? (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                                    <Unlock size={32} strokeWidth={1.5} />
                                                </motion.div>
                                            ) : (
                                                <Lock size={32} strokeWidth={1.5} className={`${error ? 'animate-bounce' : ''}`} />
                                            )}
                                        </div>
                                    </motion.div>
                                    
                                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                        بيئة الإدارة
                                    </h2>
                                    <p className="text-gray-400 text-sm tracking-wide font-medium flex items-center gap-2">
                                        <Shield size={14} className="text-indigo-400" />
                                        النظام محمي ومشفّر
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-3 relative group">
                                        {/* Input wrapper with animated gradient border */}
                                        <div className={`relative rounded-2xl p-[1px] transition-all duration-500 ${isFocused ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500' : error ? 'bg-red-500/50' : 'bg-white/10'}`}>
                                            <div className="absolute inset-0 rounded-2xl blur-md opacity-0 group-focus-within:opacity-50 transition-opacity duration-500 bg-gradient-to-r from-indigo-500 to-purple-500" />
                                            <input
                                                type="password"
                                                value={password}
                                                onFocus={() => setIsFocused(true)}
                                                onBlur={() => setIsFocused(false)}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    setError(false);
                                                }}
                                                className="relative w-full bg-[#0A0A0F]/90 backdrop-blur-sm rounded-2xl px-5 py-4 text-center text-white placeholder-gray-600 focus:outline-none transition-all text-xl tracking-[0.5em] font-mono shadow-inner border-none"
                                                placeholder="••••••"
                                                autoFocus
                                            />
                                        </div>
                                        
                                        {/* Error Message */}
                                        <div className="h-6 flex items-center justify-center">
                                            <AnimatePresence mode="wait">
                                                {error && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="flex items-center gap-1.5 text-red-400 text-xs font-bold tracking-wide"
                                                    >
                                                        <AlertCircle size={14} />
                                                        <span>رمز الدخول غير صالح</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <motion.button
                                        whileHover={!isSubmitting && !success ? { scale: 1.02 } : {}}
                                        whileTap={!isSubmitting && !success ? { scale: 0.98 } : {}}
                                        type="submit"
                                        disabled={!password || isSubmitting}
                                        className={`relative w-full py-4 rounded-2xl font-bold text-sm tracking-widest flex items-center justify-center gap-3 overflow-hidden transition-all duration-500 ${
                                            success 
                                                ? 'bg-green-500 text-white shadow-[0_0_40px_rgba(34,197,94,0.4)]'
                                                : isSubmitting
                                                    ? 'bg-indigo-600/50 text-white cursor-wait'
                                                    : 'bg-white text-black hover:bg-gray-100 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-20 disabled:hover:bg-white disabled:shadow-none disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {/* Shine effect on hover */}
                                        {!isSubmitting && !success && (
                                            <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
                                        )}
                                        
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span className="text-white/80 animate-pulse">جاري التحقق...</span>
                                            </div>
                                        ) : success ? (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                                                className="flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={20} />
                                                <span>تم التصريح</span>
                                            </motion.div>
                                        ) : (
                                            <>
                                                <span>تأكيد رمز الحماية</span>
                                                <ArrowRight size={18} className="rtl:rotate-180 opacity-60" />
                                            </>
                                        )}
                                    </motion.button>
                                </form>
                                
                                <div className="mt-8 text-center flex items-center justify-center gap-2 opacity-40">
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent flex-1" />
                                    <span className="text-[10px] font-mono tracking-[0.2em] font-bold uppercase text-white">SECURE AUTH</span>
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent flex-1" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

