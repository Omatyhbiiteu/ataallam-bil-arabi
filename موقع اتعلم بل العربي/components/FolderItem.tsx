import React, { useState } from 'react';
import { Folder } from '../types';
import { Folder as FolderIcon, ShieldCheck, Flame, MoreVertical, Edit2, Trash2, CheckCircle, ArrowRight } from 'lucide-react';

// Helper Component for Circular Progress
// Memoized to prevent re-renders if percentage hasn't changed significanly
const CircularProgress = React.memo(({ percentage, colorClass, size = 60, strokeWidth = 4 }: { percentage: number, colorClass: string, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = (cls: string) => {
        if (cls.includes('blue')) return '#3b82f6';
        if (cls.includes('red')) return '#ef4444';
        if (cls.includes('green')) return '#22c55e';
        if (cls.includes('purple')) return '#a855f7';
        if (cls.includes('orange')) return '#f97316';
        return '#64748b';
    };

    return (
        <div className="relative flex items-center justify-center transform-gpu" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-gray-200 dark:text-gray-700" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={getColor(colorClass)}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                {Math.round(percentage)}%
            </div>
        </div>
    );
});

interface FolderItemProps {
    folder: Folder;
    stats: { total: number; mastered: number; due: number; percent: number; newCount: number };
    onClick: () => void;
    onEdit: (folder: Folder) => void;
    onDelete: (id: string) => void;
    /** مجلدات النظام والمجلدات غير المملوكة للمستخدم لا تظهر لها قائمة التعديل/الحذف */
    canManage: boolean;
}

const FolderItemComponent: React.FC<FolderItemProps> = ({ folder, stats, onClick, onEdit, onDelete, canManage }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Prevent propagation when clicking menu buttons
    const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        setIsMenuOpen(false);
    };

    return (
        <div onClick={onClick} className="group bg-white dark:bg-dark-card rounded-2xl md:rounded-[2.5rem] p-3 md:p-6 lg:p-8 shadow-sm md:shadow-warm dark:shadow-none hover:shadow-lg md:hover:shadow-2xl dark:hover:shadow-black/50 border border-transparent md:border-2 hover:border-primary/20 cursor-pointer transition-all duration-300 md:hover:-translate-y-2 hover:-translate-y-1 relative overflow-hidden transform-gpu will-change-transform">
            {/* Inner Gradient Glow - Optimized: Reduced blur radius and opacity for performance, used transform-gpu */}
            <div className={`absolute -right-20 -top-20 w-40 h-40 ${folder.color} opacity-0 group-hover:opacity-5 blur-[60px] transition-opacity duration-500 will-change-opacity`} />

            {/* Header: Icon & Progress */}
            <div className="flex justify-between items-start mb-4 md:mb-8 relative z-10">
                <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl ${folder.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
                    <div className={`text-${folder.color.replace('bg-', '')} transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center w-full h-full`}>
                        {folder.isSystem ? <ShieldCheck className="w-5 h-5 md:w-9 md:h-9" /> : <FolderIcon className="w-5 h-5 md:w-9 md:h-9" />}
                    </div>
                </div>
                <div className="scale-75 md:scale-100 origin-top-left rtl:origin-top-right">
                    <CircularProgress percentage={stats.percent} colorClass={folder.color} size={52} strokeWidth={4} />
                </div>
            </div>

            {/* Folder Name */}
            <h3 className="text-sm md:text-xl lg:text-2xl font-black text-gray-800 dark:text-white mb-2 md:mb-4 group-hover:text-primary transition-colors truncate relative z-10 pr-1 md:pr-2">
                {folder.name}
            </h3>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-1.5 text-[9px] md:text-xs font-black text-gray-400 mb-4 md:mb-8 relative z-10">
                <div className="bg-stone-50 dark:bg-gray-800/50 p-1.5 md:p-3 rounded-lg md:rounded-2xl text-center">
                    <div className="text-stone-800 dark:text-white mb-0.5 md:mb-1">{stats.total}</div>
                    <div className="opacity-50 tracking-tighter uppercase scale-[0.85] md:scale-100 line-clamp-1">بطاقة</div>
                </div>
                <div className="bg-stone-50 dark:bg-gray-800/50 p-1.5 md:p-3 rounded-lg md:rounded-2xl text-center">
                    <div className="text-emerald-500 mb-0.5 md:mb-1">{stats.mastered}</div>
                    <div className="opacity-50 tracking-tighter uppercase scale-[0.85] md:scale-100 line-clamp-1">متقن</div>
                </div>
                <div className="bg-stone-50 dark:bg-gray-800/50 p-1.5 md:p-3 rounded-lg md:rounded-2xl text-center">
                    <div className="text-blue-500 mb-0.5 md:mb-1">{stats.newCount}</div>
                    <div className="opacity-50 tracking-tighter uppercase scale-[0.85] md:scale-100 line-clamp-1">جديد</div>
                </div>
            </div>

            {/* Footer: Due & Action */}
            <div className="flex items-center justify-between mt-auto relative z-10 gap-1.5">
                {stats.due > 0 ? (
                    <div className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white px-2 py-1 md:px-4 md:py-2 rounded-full text-[8px] md:text-[11px] font-black shadow-md md:shadow-lg shadow-orange-500/30 animate-pulse whitespace-nowrap">
                        <Flame className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 flex-shrink-0" fill="currentColor" />
                        <span className="truncate">{stats.due} مراجعة</span>
                    </div>
                ) : (
                    <div className="text-emerald-500 text-[8px] md:text-xs font-black flex items-center gap-1.5 md:gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 md:px-4 md:py-2 rounded-full border border-emerald-100 dark:border-emerald-800 whitespace-nowrap">
                        <CheckCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 flex-shrink-0" />
                        <span className="truncate hidden sm:inline">الكل مكتمل</span>
                        <span className="truncate sm:hidden">مكتمل</span>
                    </div>
                )}
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 rtl:rotate-180 flex-shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </div>
            </div>

            {/* Menu Button */}
            {canManage && (
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/50 flex items-center justify-center transition-all text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white backdrop-blur-sm shadow-sm md:shadow-none opacity-80 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                    >
                        <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
                            <div className="absolute top-10 left-0 bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl border border-stone-100 dark:border-gray-700 min-w-[140px] md:min-w-[160px] overflow-hidden animate-fade-in z-30">
                                <button
                                    onClick={(e) => handleMenuClick(e, () => onEdit(folder))}
                                    className="w-full text-right px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-700 flex items-center gap-2 md:gap-3 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4 text-blue-500" /> تعديل
                                </button>
                                <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2" />
                                <button
                                    onClick={(e) => handleMenuClick(e, () => onDelete(folder.id))}
                                    className="w-full text-right px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 md:gap-3 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> حذف
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// Memoize the component to prevent re-renders unless props change
export const FolderItem = React.memo(FolderItemComponent, (prev, next) => {
    // Custom comparison to ensure deep equality checking
    const statsEqual =
        prev.stats.total === next.stats.total &&
        prev.stats.mastered === next.stats.mastered &&
        prev.stats.due === next.stats.due &&
        prev.stats.percent === next.stats.percent &&
        prev.stats.newCount === next.stats.newCount;

    const folderEqual =
        prev.folder.id === next.folder.id &&
        prev.folder.name === next.folder.name &&
        prev.folder.color === next.folder.color &&
        prev.folder.parentId === next.folder.parentId &&
        prev.folder.isSystem === next.folder.isSystem &&
        prev.folder.userId === next.folder.userId;

    return statsEqual && folderEqual && prev.canManage === next.canManage && prev.onClick === next.onClick && prev.onEdit === next.onEdit && prev.onDelete === next.onDelete;
});
