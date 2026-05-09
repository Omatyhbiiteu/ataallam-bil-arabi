import React from 'react';

interface ProgressRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

export const ProgressRow: React.FC<ProgressRowProps> = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-gray-600 dark:text-gray-300 font-medium">{label}</span>
        <span className="font-bold text-gray-800 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};