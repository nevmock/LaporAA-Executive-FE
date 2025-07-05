import React from 'react';
import { IconType } from 'react-icons';
import { FiInfo, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

interface ModernStatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  trendLabel?: string;
  description?: string;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'indigo';
  loading?: boolean;
  onClick?: () => void;
  onInfoClick?: () => void;
}

const ModernStatCard: React.FC<ModernStatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  description,
  color = 'blue',
  loading = false,
  onClick,
  onInfoClick
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-white',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      value: 'text-blue-900',
      trend: {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600'
      }
    },
    green: {
      bg: 'bg-white',
      border: 'border-green-200',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
      value: 'text-green-900',
      trend: {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600'
      }
    },
    red: {
      bg: 'bg-white',
      border: 'border-red-200',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      value: 'text-red-900',
      trend: {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600'
      }
    },
    orange: {
      bg: 'bg-white',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      iconBg: 'bg-orange-100',
      value: 'text-orange-900',
      trend: {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600'
      }
    },
    purple: {
      bg: 'bg-white',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100',
      value: 'text-purple-900',
      trend: {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600'
      }
    },
    indigo: {
      bg: 'bg-white',
      border: 'border-indigo-200',
      icon: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      value: 'text-indigo-900',
      trend: {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600'
      }
    }
  };

  const classes = colorClasses[color];

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return FiTrendingUp;
      case 'down':
        return FiTrendingDown;
      case 'neutral':
        return FiMinus;
      default:
        return null;
    }
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <div className={`relative p-6 rounded-xl border ${classes.bg} ${classes.border} animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className={`p-3 rounded-lg ${classes.iconBg}`}>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative p-6 rounded-xl border transition-all duration-300 group
        ${classes.bg} ${classes.border}
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-opacity-60' : ''}
        backdrop-blur-sm
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-gray-600">
              {title}
            </h3>
            {onInfoClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfoClick();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiInfo size={14} />
              </button>
            )}
          </div>
          
          {/* Value */}
          <div className={`text-3xl font-bold ${classes.value} mb-2`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {/* Trend */}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mb-1">
              {TrendIcon && (
                <TrendIcon 
                  size={16} 
                  className={classes.trend[trend]}
                />
              )}
              <span className={`text-sm font-medium ${classes.trend[trend]}`}>
                {trendValue}
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
          
          {/* Description */}
          {description && (
            <p className="text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
        
        {/* Icon */}
        <div className={`p-3 rounded-lg ${classes.iconBg} transition-all duration-300 group-hover:scale-110`}>
          <Icon size={24} className={classes.icon} />
        </div>
      </div>
      
      {/* Click indicator */}
      {onClick && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      )}
    </div>
  );
};

export default ModernStatCard;
