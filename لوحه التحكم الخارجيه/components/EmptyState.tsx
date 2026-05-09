import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 ${className || ''}`}>
      <div className="w-28 h-28 bg-stone-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
        {Icon ? <Icon size={42} className="text-gray-400 dark:text-gray-600" /> : null}
      </div>
      <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-red-600 transition shadow-lg shadow-primary/30"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
