import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, Sparkles, Tag, Clock } from 'lucide-react';
import { PromoBanner, Coupon } from '../types';

interface PromoPopupProps {
    banner: PromoBanner;
    onClose: () => void;
    coupon?: Coupon;
}

export const PromoPopup: React.FC<PromoPopupProps> = ({ banner, onClose, coupon }) => {
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ bg: string, text: string }>({ bg: 'white', text: 'black' });

    // Determine colors based on theme override or default
    useEffect(() => {
        if (banner.backgroundColor) {
            // Simple logic: if customizable, these would come from props, currently using safe defaults or banner props
        }
    }, [banner]);

    const handleCopy = () => {
        if (coupon?.code) {
            navigator.clipboard.writeText(coupon.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                    className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl bg-slate-900 border border-white/10"
                >
                    {/* Background Effects */}
                    <div className="absolute inset-0 z-0">
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full translate-x-1/3 -translate-y-1/3 blur-[80px] opacity-40 ${banner.backgroundColor === 'gold' ? 'bg-amber-500' : 'bg-red-600'}`}></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full -translate-x-1/3 translate-y-1/3 bg-blue-600/30 blur-[60px]"></div>
                        {/* Noise Texture */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-8 flex flex-col items-center text-center">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-20 h-20 mb-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-lg shadow-black/20 text-5xl"
                        >
                            {banner.emoji || '🎁'}
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-black text-white mb-3 tracking-tight"
                        >
                            {banner.title}
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-300 font-medium mb-8 leading-relaxed"
                        >
                            {banner.description}
                        </motion.p>

                        {/* Coupon Display */}
                        {coupon && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-full mb-8"
                            >
                                <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 flex items-center justify-between gap-4 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                            <Tag size={20} />
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs font-bold text-gray-500 uppercase">كود الخصم</span>
                                            <span className="font-mono text-xl font-black text-white tracking-wider">{coupon.code}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCopy}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-white text-slate-900 hover:scale-105'}`}
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'تم النسخ' : 'نسخ'}
                                    </button>
                                </div>
                                {banner.relatedCouponCode && (
                                    <p className="mt-3 text-xs font-bold text-red-400 flex items-center justify-center gap-1">
                                        <Clock size={12} />
                                        ينتهي قريباً
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* CTA Button */}
                        {banner.ctaLink && (
                            <motion.a
                                href={banner.ctaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl font-black text-white shadow-xl shadow-red-900/40 hover:shadow-red-900/60 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span>{banner.ctaText || 'احصل على العرض الآن'}</span>
                                <ExternalLink size={18} className="group-hover:translate-x-1 transition-transform" />
                            </motion.a>
                        )}

                        {!banner.ctaLink && (
                            <motion.button
                                onClick={onClose}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                حسناً، شكراً
                            </motion.button>
                        )}

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
