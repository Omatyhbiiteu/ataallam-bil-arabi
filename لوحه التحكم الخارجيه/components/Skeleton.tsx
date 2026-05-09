
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700/50 ${className}`}
    />
  );
};
