
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string; // Tailwind bg class for the icon container
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass }) => {
  return (
    <div className="bg-white dark:bg-dark-card p-5 md:p-6 lg:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-warm dark:shadow-none border border-stone-100 dark:border-dark-border flex items-center justify-between hover:shadow-warm-hover dark:hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group h-full">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h3 className="text-gray-500 dark:text-gray-400 font-bold text-xs md:text-sm tracking-wide uppercase opacity-80 truncate pr-2">{label}</h3>
        {/* Adjusted text sizes: smaller on tablet (md), larger on desktop (lg/xl) */}
        <p className="text-3xl md:text-3xl xl:text-5xl font-extrabold text-gray-800 dark:text-white tracking-tight mt-1 md:mt-2 truncate" title={String(value)}>{value}</p>
      </div>
      <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-20 lg:h-20 rounded-2xl md:rounded-3xl flex-shrink-0 flex items-center justify-center shadow-lg ${colorClass} text-white ring-2 md:ring-4 ring-opacity-20 ring-gray-100 dark:ring-gray-700 transition-transform group-hover:scale-110`}>
        {/* Clone the icon element to increase its size if passed as a React Element */}
        {React.isValidElement(icon) 
          ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6 md:w-7 md:h-7 lg:w-9 lg:h-9", strokeWidth: 2.5 }) 
          : icon}
      </div>
    </div>
  );
};
