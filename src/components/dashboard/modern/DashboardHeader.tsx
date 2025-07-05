import React from 'react';
import { IconType } from 'react-icons';
import { 
  FiCalendar, 
  FiFilter, 
  FiDownload, 
  FiRefreshCw,
  FiInfo,
  FiEye,
  FiSettings
} from 'react-icons/fi';

interface FilterOption {
  label: string;
  value: string;
}

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: IconType;
  showFilters?: boolean;
  showDateRange?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  showInfo?: boolean;
  
  // Date Range
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  
  // Filters
  filters?: FilterOption[];
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
  
  // Actions
  onExport?: () => void;
  onRefresh?: () => void;
  onInfo?: () => void;
  
  // Loading states
  refreshing?: boolean;
  exporting?: boolean;
  
  // Custom actions
  customActions?: React.ReactNode;
  
  className?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  icon: Icon = FiEye,
  showFilters = true,
  showDateRange = true,
  showExport = true,
  showRefresh = true,
  showInfo = false,
  startDate,
  endDate,
  onDateRangeChange,
  filters = [],
  selectedFilter,
  onFilterChange,
  onExport,
  onRefresh,
  onInfo,
  refreshing = false,
  exporting = false,
  customActions,
  className = ''
}) => {
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (onDateRangeChange) {
      if (type === 'start') {
        onDateRangeChange(value, endDate || '');
      } else {
        onDateRangeChange(startDate || '', value);
      }
    }
  };

  const getQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const handleQuickDateRange = (days: number) => {
    const { startDate: start, endDate: end } = getQuickDateRange(days);
    if (onDateRangeChange) {
      onDateRangeChange(start, end);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 ${className}`}>
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Icon size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Main Actions */}
        <div className="flex items-center gap-3">
          {showInfo && onInfo && (
            <button
              onClick={onInfo}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              title="Dashboard Information"
            >
              <FiInfo size={20} />
            </button>
          )}
          
          {showRefresh && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className={`p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh Data"
            >
              <FiRefreshCw size={20} />
            </button>
          )}
          
          {showExport && onExport && (
            <button
              onClick={onExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export Data"
            >
              <FiDownload size={18} className={exporting ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">
                {exporting ? 'Exporting...' : 'Export'}
              </span>
            </button>
          )}
          
          {customActions}
        </div>
      </div>
      
      {/* Filters Row */}
      {(showFilters || showDateRange) && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Date Range Picker */}
          {showDateRange && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-500 dark:text-gray-400" size={18} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date Range:
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Date Buttons */}
                <div className="flex gap-1">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => handleQuickDateRange(days)}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all"
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                
                {/* Date Inputs */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Filters */}
          {showFilters && filters.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-500 dark:text-gray-400" size={18} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter:
                </span>
              </div>
              
              <select
                value={selectedFilter || ''}
                onChange={(e) => onFilterChange?.(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Items</option>
                {filters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
