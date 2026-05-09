import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Folder } from '../types';

const FOLDER_COLORS = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'];

interface FolderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, color: string, id?: string) => void;
    initialData?: Folder | null;
    t: any;
}

export const FolderFormModal: React.FC<FolderFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, t }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(FOLDER_COLORS[0]);
    const [showNameHint, setShowNameHint] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowNameHint(false);
            if (initialData) {
                setName(initialData.name);
                setColor(initialData.color);
            } else {
                setName('');
                setColor(FOLDER_COLORS[0]);
            }
        }
    }, [isOpen, initialData]);

    const trimmedName = name.trim();
    const canSubmit = trimmedName.length > 0;

    const handleSubmit = () => {
        if (!trimmedName) {
            setShowNameHint(true);
            return;
        }
        onSubmit(trimmedName, color, initialData?.id);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-stone-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {initialData ? 'تعديل المجلد' : t.folders.createFolderTitle}
                    </h3>
                    <button type="button" onClick={onClose} aria-label="إغلاق">
                        <X className="text-gray-400 hover:text-red-500" />
                    </button>
                </div>
                <form
                    className="space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">اسم المجلد</label>
                        <input
                            type="text"
                            placeholder={t.folders.folderNamePlaceholder}
                            className={`w-full bg-stone-50 dark:bg-gray-800 border-2 p-4 rounded-xl outline-none font-bold dark:text-white transition ${showNameHint && !canSubmit ? 'border-amber-500 focus:border-amber-500' : 'border-stone-200 dark:border-transparent focus:border-primary'}`}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (showNameHint) setShowNameHint(false);
                            }}
                            autoFocus
                        />
                        {!canSubmit && (
                            <p className={`mt-2 text-xs font-bold ${showNameHint ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                {showNameHint
                                    ? 'اكتب اسماً للمجلد في الحقل أعلاه ثم اضغط «إنشاء» مرة أخرى.'
                                    : 'اسم المجلد مطلوب — اكتب اسماً ثم اضغط إنشاء.'}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">لون المجلد</label>
                        <div className="flex gap-3 justify-center flex-wrap bg-stone-50 dark:bg-gray-800 p-4 rounded-xl">
                            {FOLDER_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-10 h-10 rounded-full ${c} ${color === c ? 'ring-4 ring-offset-2 ring-primary dark:ring-offset-dark-card scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'} transition-all`}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-red-700 transition shadow-xl shadow-primary/30 text-lg"
                    >
                        {initialData ? 'حفظ التغييرات' : t.folders.create}
                    </button>
                </form>
            </div>
        </div>
    );
};
