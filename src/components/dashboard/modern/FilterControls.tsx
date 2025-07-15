import React from 'react';
import { FiCalendar, FiMapPin, FiFilter, FiEye, FiLayers } from 'react-icons/fi';

interface FilterOption {
  label: string;
  value: string | number;
}

interface SelectFilter {
  type: 'select';
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options?: FilterOption[];
  placeholder?: string;
  icon?: React.ReactNode;
}

interface ToggleFilter {
  type: 'toggle';
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ReactNode;
}

interface InputFilter {
  type: 'input';
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

type CustomFilter = SelectFilter | ToggleFilter | InputFilter;

interface FilterControlsProps {
  filters: {
    // Core time filters (always available)
    timeFilter?: {
      value: string;
      onChange: (value: string) => void;
      options: FilterOption[];
    };
    year?: {
      value: number;
      onChange: (value: number) => void;
      options: number[];
    };
    month?: {
      value: number;
      onChange: (value: number) => void;
      options: { label: string; value: number }[];
      show: boolean;
    };
    week?: {
      value: number;
      onChange: (value: number) => void;
      options: number[];
      show: boolean;
    };
    
    // Location filters
    location?: {
      value: string;
      onChange: (value: string) => void;
      options: string[];
      placeholder: string;
    };
    
    // Status filters
    status?: {
      value: string;
      onChange: (value: string) => void;
      options: string[];
      placeholder?: string;
    };
    
    // Limit/View filters
    limitView?: {
      value: number;
      onChange: (value: number) => void;
      options: number[];
      label?: string;
    };
    
    // Toggle filters
    boundaries?: {
      value: boolean;
      onChange: (value: boolean) => void;
      label: string;
      loading?: boolean;
    };
    
    // Custom filters (for extensibility)
    custom?: CustomFilter[];
  };
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filters
}) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex flex-wrap gap-3 items-center">
        
        {/* Core Time Filters */}
        {filters.timeFilter && (
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-500 text-sm" />
            <select 
              value={filters.timeFilter.value}
              onChange={e => filters.timeFilter!.onChange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {filters.timeFilter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Year Filter */}
        {filters.year && (
          <select 
            value={filters.year.value}
            onChange={e => filters.year!.onChange(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {filters.year.options.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}

        {/* Month Filter */}
        {filters.month?.show && (
          <select 
            value={filters.month.value}
            onChange={e => filters.month!.onChange(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {filters.month.options.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        )}

        {/* Week Filter */}
        {filters.week?.show && (
          <select 
            value={filters.week.value}
            onChange={e => filters.week!.onChange(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {filters.week.options.map(week => (
              <option key={week} value={week}>Minggu ke-{week}</option>
            ))}
          </select>
        )}

        {/* Location Filter */}
        {filters.location && (
          <div className="flex items-center gap-2">
            <FiMapPin className="text-gray-500 text-sm" />
            <select 
              value={filters.location.value}
              onChange={e => filters.location!.onChange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">{filters.location.placeholder}</option>
              {filters.location.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        {filters.status && (
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500 text-sm" />
            <select 
              value={filters.status.value}
              onChange={e => filters.status!.onChange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {filters.status.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}

        {/* Limit View Filter */}
        {filters.limitView && (
          <div className="flex items-center gap-2">
            <FiEye className="text-gray-500 text-sm" />
            <select 
              value={filters.limitView.value}
              onChange={e => filters.limitView!.onChange(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {filters.limitView.options.map(opt => (
                <option key={opt} value={opt}>{filters.limitView!.label || 'Tampilkan'} {opt}</option>
              ))}
            </select>
          </div>
        )}

        {/* Boundaries Toggle */}
        {filters.boundaries && (
          <div className="flex items-center gap-2">
            <FiLayers className="text-gray-500 text-sm" />
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.boundaries.value}
                onChange={e => filters.boundaries!.onChange(e.target.checked)}
                disabled={filters.boundaries.loading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="flex items-center gap-1">
                {filters.boundaries.label}
                {filters.boundaries.loading && (
                  <span className="w-3 h-3 border border-gray-400 border-t-blue-500 rounded-full animate-spin"></span>
                )}
              </span>
            </label>
          </div>
        )}

        {/* Custom Filters */}
        {filters.custom?.map((customFilter, index) => (
          <div key={index} className="flex items-center gap-2">
            {customFilter.icon}
            {customFilter.type === 'select' && (
              <select 
                value={customFilter.value}
                onChange={e => customFilter.onChange(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {customFilter.placeholder && <option value="">{customFilter.placeholder}</option>}
                {customFilter.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {customFilter.type === 'toggle' && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customFilter.value}
                  onChange={e => customFilter.onChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                {customFilter.label}
              </label>
            )}
            {customFilter.type === 'input' && (
              <input
                type="text"
                value={customFilter.value}
                onChange={e => customFilter.onChange(e.target.value)}
                placeholder={customFilter.placeholder}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            )}
          </div>
        ))}

      </div>
    </div>
  );
};

export default FilterControls;
