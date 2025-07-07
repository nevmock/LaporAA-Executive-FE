import React, { useState } from 'react';
import { FiDownload, FiFileText, FiImage, FiTable, FiCheck } from 'react-icons/fi';

interface ExportOption {
  type: 'pdf' | 'excel' | 'csv' | 'png' | 'jpeg';
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ExportOptions {
  quality?: number;
  format?: string;
  includeHeader?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  [key: string]: unknown;
}

interface ExportButtonProps {
  onExport: (type: string, options?: ExportOptions) => void;
  loading?: boolean;
  disabled?: boolean;
  showOptions?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  loading = false,
  disabled = false,
  showOptions = true,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExports, setSelectedExports] = useState<Set<string>>(new Set());

  const exportOptions: ExportOption[] = [
    {
      type: 'pdf',
      label: 'PDF Report',
      description: 'Complete report with charts and tables',
      icon: <FiFileText size={18} />
    },
    {
      type: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Raw data in spreadsheet format',
      icon: <FiTable size={18} />
    },
    {
      type: 'csv',
      label: 'CSV Data',
      description: 'Comma-separated values file',
      icon: <FiTable size={18} />
    },
    {
      type: 'png',
      label: 'PNG Image',
      description: 'High-quality image of charts',
      icon: <FiImage size={18} />
    }
  ];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent',
    outline: 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600'
  };

  const handleSingleExport = (type: string) => {
    onExport(type);
    setIsOpen(false);
  };

  const handleMultipleExport = () => {
    if (selectedExports.size === 0) return;
    
    selectedExports.forEach(type => {
      onExport(type);
    });
    
    setSelectedExports(new Set());
    setIsOpen(false);
  };

  const toggleExportSelection = (type: string) => {
    const newSelection = new Set(selectedExports);
    if (newSelection.has(type)) {
      newSelection.delete(type);
    } else {
      newSelection.add(type);
    }
    setSelectedExports(newSelection);
  };

  if (!showOptions) {
    return (
      <button
        onClick={() => onExport('pdf')}
        disabled={disabled || loading}
        className={`
          inline-flex items-center gap-2 border rounded-lg font-medium transition-all
          ${sizeClasses[size]} ${variantClasses[variant]} ${className}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
        `}
      >
        <FiDownload size={18} className={loading ? 'animate-pulse' : ''} />
        <span>{loading ? 'Exporting...' : 'Export'}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          inline-flex items-center gap-2 border rounded-lg font-medium transition-all
          ${sizeClasses[size]} ${variantClasses[variant]} ${className}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
        `}
      >
        <FiDownload size={18} className={loading ? 'animate-pulse' : ''} />
        <span>{loading ? 'Exporting...' : 'Export'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Export Options
              </h3>
              
              <div className="space-y-2">
                {exportOptions.map((option) => (
                  <div key={option.type}>
                    {/* Single Export Option */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          {option.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Multi-select checkbox */}
                        <button
                          onClick={() => toggleExportSelection(option.type)}
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                            ${selectedExports.has(option.type)
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                            }
                          `}
                        >
                          {selectedExports.has(option.type) && (
                            <FiCheck size={12} />
                          )}
                        </button>
                        
                        {/* Single export button */}
                        <button
                          onClick={() => handleSingleExport(option.type)}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all"
                        >
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Bulk Export Actions */}
              {selectedExports.size > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedExports.size} format(s) selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedExports(new Set())}
                        className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleMultipleExport}
                        className="px-4 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-all"
                      >
                        Export All Selected
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedExports(new Set(['pdf', 'excel']));
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all"
                  >
                    📊 Report Package
                  </button>
                  <button
                    onClick={() => {
                      setSelectedExports(new Set(['csv', 'excel']));
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all"
                  >
                    📈 Data Package
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
