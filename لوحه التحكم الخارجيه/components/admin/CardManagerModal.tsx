import React, { useState } from 'react';
import { motion as m } from 'framer-motion';
import { X, Layers, Trash2, Image as ImageIcon } from 'lucide-react';
import { Card, Folder } from '../../types';

// Copied helper (or import if needed, but simple enough to inline or prop)
const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

interface CardManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId: string | null;
    folderName?: string;
    cards: Card[];
    setCards: (cards: Card[]) => void;
    showToast: (msg: string, type: 'error' | 'success' | 'info') => void;
}

export const CardManagerModal: React.FC<CardManagerModalProps> = ({
    isOpen,
    onClose,
    folderId,
    folderName,
    cards,
    setCards,
    showToast
}) => {
    const [newCard, setNewCard] = useState<{ front: string; back: string; image: string }>({ front: '', back: '', image: '' });

    if (!isOpen || !folderId) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewCard(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddSystemCard = () => {
        if (!newCard.front || !newCard.back) {
            showToast("يجب ملء الوجه الأمامي والخلفي للبطاقة", "error");
            return;
        }
        setCards([...cards, {
            id: generateId(),
            folderId: folderId,
            frontText: newCard.front,
            backText: newCard.back,
            frontImage: newCard.image,
            createdAt: Date.now(),
            nextReview: Date.now(),
            interval: 0,
            reviews: 0,
            easeFactor: 2.5,
            status: 'new',
            isSystem: true
        }]);
        setNewCard({ front: '', back: '', image: '' });
        showToast("تم إضافة البطاقة", "success");
    };

    const handleDeleteSystemCard = (cardId: string) => {
        setCards(cards.filter(c => c.id !== cardId));
    };

    return (
        <div className="fixed inset-0 bg-[#0B0D17]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
            <m.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-slate-900 w-full max-w-5xl rounded-[3rem] p-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 h-[85vh] flex flex-col overflow-hidden"
            >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                            <Layers size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">إدارة الكروت</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                {folderName}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 group">
                        <X className="text-gray-400 group-hover:rotate-90 transition-transform" size={24} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-2/3 overflow-y-auto p-8 space-y-4 bg-slate-900/50">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 mr-2">الكروت الموجودة</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {cards.filter(c => c.folderId === folderId).map(c => (
                                <div key={c.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                                    <div className="min-w-0">
                                        <p className="text-white font-bold truncate">{c.frontText}</p>
                                        <p className="text-gray-500 text-xs truncate">{c.backText}</p>
                                    </div>
                                    <button onClick={() => handleDeleteSystemCard(c.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full md:w-1/3 p-8 border-r border-white/5 space-y-6 bg-slate-900">
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 mr-2">إضافة كرت جديد</h4>
                        <div className="space-y-4">
                            <input
                                className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white font-bold outline-none focus:border-red-500/50"
                                placeholder="الوجه الأمامي"
                                value={newCard.front}
                                onChange={e => setNewCard({ ...newCard, front: e.target.value })}
                            />
                            <input
                                className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white font-bold outline-none focus:border-red-500/50"
                                placeholder="الوجه الخلفي"
                                value={newCard.back}
                                onChange={e => setNewCard({ ...newCard, back: e.target.value })}
                            />

                            <div
                                className="bg-white/5 rounded-2xl border border-dashed border-white/10 aspect-video relative group overflow-hidden cursor-pointer flex flex-col items-center justify-center text-gray-600 hover:text-gray-400 hover:border-red-500/30 transition-all"
                                onClick={() => (document.getElementById('cardImageInput') as HTMLInputElement)?.click()}
                            >
                                {newCard.image ? (
                                    <>
                                        <img src={newCard.image} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35" alt="" aria-hidden="true" />
                                        <img src={newCard.image} className="relative z-[1] w-full h-full object-contain p-3" alt="" />
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={32} className="mb-2" />
                                        <span className="text-[10px] font-black uppercase">إضافة صورة</span>
                                    </>
                                )}
                                <input id="cardImageInput" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </div>

                            <button onClick={handleAddSystemCard} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-900/20 active:scale-95 transition-all">
                                إضافة للقاموس
                            </button>
                        </div>
                    </div>
                </div>
            </m.div>
        </div>
    );
};
