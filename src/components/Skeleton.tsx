'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  circle?: boolean;
  lines?: number;
  variant?: 'text' | 'rect' | 'circle' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = false,
  circle = false,
  lines = 1,
  variant = 'rect'
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circle':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-lg';
      default:
        return rounded ? 'rounded-lg' : circle ? 'rounded-full' : '';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...style,
              width: index === lines - 1 ? '60%' : style.width || '100%'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-md p-6 ${className}`}>
    <div className="space-y-4">
      <Skeleton height="24px" width="60%" />
      <Skeleton lines={3} />
      <div className="flex justify-between items-center">
        <Skeleton width="40%" height="20px" />
        <Skeleton width="80px" height="32px" rounded />
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
    <div className="p-4 border-b">
      <Skeleton height="24px" width="200px" />
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <Skeleton height="16px" width="80px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-200">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton height="16px" width={colIndex === 0 ? "120px" : "80px"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ className?: string; type?: 'bar' | 'line' | 'pie' }> = ({ 
  className = '',
  type = 'bar'
}) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-md p-6 ${className}`}>
    <div className="space-y-4">
      <Skeleton height="24px" width="40%" />
      <div className="h-64 bg-gray-100 rounded-lg flex items-end justify-center space-x-2 p-4">
        {type === 'pie' ? (
          <Skeleton circle width="200px" height="200px" />
        ) : type === 'line' ? (
          <div className="w-full h-full relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="skeleton-line" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f3f4f6" />
                  <stop offset="50%" stopColor="#e5e7eb" />
                  <stop offset="100%" stopColor="#f3f4f6" />
                </linearGradient>
              </defs>
              <path 
                d="M 10 150 Q 100 100 200 120 T 390 80" 
                stroke="url(#skeleton-line)" 
                strokeWidth="3" 
                fill="none"
                className="animate-pulse"
              />
              {Array.from({ length: 8 }).map((_, i) => (
                <circle
                  key={i}
                  cx={10 + i * 55}
                  cy={150 - Math.random() * 80}
                  r="4"
                  fill="#e5e7eb"
                  className="animate-pulse"
                />
              ))}
            </svg>
          </div>
        ) : (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-300 animate-pulse rounded-t"
              style={{
                width: '40px',
                height: `${Math.random() * 150 + 50}px`
              }}
            />
          ))
        )}
      </div>
      <div className="flex justify-between items-center">
        <Skeleton width="30%" height="16px" />
        <Skeleton width="20%" height="16px" />
      </div>
    </div>
  </div>
);

export const SkeletonMap: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-md p-6 ${className}`}>
    <div className="space-y-4">
      <Skeleton height="24px" width="40%" />
      <div className="h-96 bg-gray-100 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
          {/* Simulate map markers */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="absolute w-4 h-4 bg-red-300 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                animationDelay: `${index * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 5, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg">
        <Skeleton circle width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton height="16px" width="70%" />
          <Skeleton height="14px" width="50%" />
        </div>
        <Skeleton width="80px" height="32px" rounded />
      </div>
    ))}
  </div>
);

export const SkeletonHeader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white border-b shadow-sm p-4 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Skeleton circle width="40px" height="40px" />
        <div className="space-y-2">
          <Skeleton height="16px" width="120px" />
          <Skeleton height="12px" width="80px" />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton width="100px" height="32px" rounded />
        <Skeleton width="80px" height="32px" rounded />
      </div>
    </div>
  </div>
);

export const SkeletonProgressBar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-2 md:gap-3 w-full ${className}`}>
    <div className="flex-1 relative h-8 flex items-center">
      <div className="absolute top-1/2 left-0 right-0 h-2 md:h-3 bg-gray-200 rounded-full" style={{ transform: 'translateY(-50%)' }} />
      <div className="flex justify-between relative z-10 w-full">
        {Array.from({ length: 7 }).map((_, idx) => (
          <Skeleton key={idx} circle width="24px" height="24px" className="md:w-8 md:h-8" />
        ))}
      </div>
    </div>
    <Skeleton width="100px" height="28px" rounded />
  </div>
);

export default Skeleton;
