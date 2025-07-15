import React, { useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { IconType } from 'react-icons';

interface ChartEventParams {
  data?: unknown;
  dataIndex?: number;
  name?: string;
  value?: number | string;
  seriesName?: string;
  [key: string]: unknown;
}
import { 
  FiMaximize2, 
  FiMinimize2, 
  FiDownload, 
  FiInfo, 
  FiRefreshCw,
  FiBarChart,
  FiPieChart,
  FiTrendingUp
} from 'react-icons/fi';
import FullscreenModal from './FullscreenModal';

interface ModernChartCardProps {
  title: string;
  subtitle?: string;
  icon?: IconType;
  option: EChartsOption;
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  showFullscreen?: boolean;
  showDownload?: boolean;
  showRefresh?: boolean;
  showInfo?: boolean;
  onRefresh?: () => void;
  onInfo?: () => void;
  onDownload?: () => void;
  onFullscreen?: () => void;
  onChartClick?: (params: ChartEventParams) => void;  // Add chart click handler
  onChartEvents?: Record<string, (params: ChartEventParams) => void>;  // Multiple event handlers
  className?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'indigo';
  filters?: React.ReactNode;
  children?: React.ReactNode; // Support custom content
  useInternalFullscreen?: boolean; // Use internal modal instead of external handler
}

const ModernChartCard: React.FC<ModernChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  option,
  height = '100%',
  loading = false,
  error = null,
  showFullscreen = true,
  showDownload = true,
  showRefresh = false,
  showInfo = false,
  onRefresh,
  onInfo,
  onDownload,
  onFullscreen,
  onChartClick,
  onChartEvents = {},
  className = "",
  chartType = 'bar',
  color = 'blue',
  filters,
  children,
  useInternalFullscreen = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const chartRef = useRef<ReactECharts>(null);

  // Handle fullscreen toggle
  const handleFullscreen = () => {
    if (useInternalFullscreen) {
      setIsFullscreen(!isFullscreen);
    } else if (onFullscreen) {
      onFullscreen();
    }
  };

  const colorClasses = {
    blue: {
      border: 'border-blue-200',
      headerBg: 'bg-gradient-to-r from-blue-50 to-blue-100',
      icon: 'text-blue-600',
      accent: 'text-blue-600'
    },
    green: {
      border: 'border-green-200',
      headerBg: 'bg-gradient-to-r from-green-50 to-green-100',
      icon: 'text-green-600',
      accent: 'text-green-600'
    },
    red: {
      border: 'border-red-200',
      headerBg: 'bg-gradient-to-r from-red-50 to-red-100',
      icon: 'text-red-600',
      accent: 'text-red-600'
    },
    orange: {
      border: 'border-orange-200',
      headerBg: 'bg-gradient-to-r from-orange-50 to-orange-100',
      icon: 'text-orange-600',
      accent: 'text-orange-600'
    },
    purple: {
      border: 'border-purple-200',
      headerBg: 'bg-gradient-to-r from-purple-50 to-purple-100',
      icon: 'text-purple-600',
      accent: 'text-purple-600'
    },
    indigo: {
      border: 'border-indigo-200',
      headerBg: 'bg-gradient-to-r from-indigo-50 to-indigo-100',
      icon: 'text-indigo-600',
      accent: 'text-indigo-600'
    }
  };

  const classes = colorClasses[color];

  const getChartTypeIcon = () => {
    switch (chartType) {
      case 'bar':
        return FiBarChart;
      case 'pie':
        return FiPieChart;
      case 'line':
      case 'area':
        return FiTrendingUp;
      default:
        return FiBarChart;
    }
  };

  const ChartTypeIcon = Icon || getChartTypeIcon();

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      const url = echartsInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_chart.png`;
      link.click();
    }
    
    if (onDownload) {
      onDownload();
    }
  };

  if (error) {
    return (
      <div className={`bg-white rounded-xl border ${classes.border} p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Chart
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`
        bg-white rounded-xl border transition-all duration-300
        ${classes.border} ${className}
        ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'shadow-sm hover:shadow-md'}
      `}>
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 ${classes.headerBg} rounded-t-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                <ChartTypeIcon size={20} className={classes.icon} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-sm text-gray-600">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {showInfo && onInfo && (
                <button
                  onClick={onInfo}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/50 transition-all"
                  title="Chart Information"
                >
                  <FiInfo size={18} />
                </button>
              )}
              
              {showRefresh && onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/50 transition-all ${refreshing ? 'animate-spin' : ''}`}
                  title="Refresh Data"
                >
                  <FiRefreshCw size={18} />
                </button>
              )}
              
              {showDownload && (
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/50 transition-all"
                  title="Download Chart"
                >
                  <FiDownload size={18} />
                </button>
              )}
              
              {showFullscreen && (
                <button
                  onClick={handleFullscreen}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/50 transition-all"
                  title={useInternalFullscreen ? (isFullscreen ? "Exit Fullscreen" : "Fullscreen") : "Open in Fullscreen"}
                >
                  {useInternalFullscreen && isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters - only show if not in fullscreen modal */}
        {filters && !isFullscreen && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            {filters}
          </div>
        )}

        {/* Chart Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full" style={{ minHeight: height === '100%' ? '400px' : (typeof height === 'number' ? `${height}px` : height) }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading chart data...</p>
              </div>
            </div>
          ) : children ? (
            // Render custom content if children provided
            <div className="h-full" style={{ 
              height: typeof height === 'number' ? `${height}px` : (height === '100%' ? '400px' : height),
              minHeight: height === '100%' ? '400px' : (typeof height === 'number' ? `${height}px` : height) 
            }}>
              {children}
            </div>
          ) : (
            // Render ECharts
            <ReactECharts
              ref={chartRef}
              option={option}
              style={{ 
                height: isFullscreen && !useInternalFullscreen ? 'calc(100vh - 200px)' : (typeof height === 'number' ? `${height}px` : height),
                width: '100%'
              }}
              opts={{
                renderer: 'canvas'
              }}
              notMerge={true}
              lazyUpdate={true}
              onEvents={{
                ...(onChartClick && { click: onChartClick }),
                ...(onChartEvents || {})
              }}
            />
          )}
        </div>
      </div>
      
      {/* Fullscreen Modal */}
      {useInternalFullscreen && (
        <FullscreenModal
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          title={title}
          subtitle={subtitle}
          controls={filters}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading chart data...</p>
              </div>
            </div>
          ) : children ? (
            <div className="h-full w-full bg-white">
              {children}
            </div>
          ) : (
            <div className="bg-white h-full w-full">
              <ReactECharts
                option={option}
                style={{ 
                  height: 'calc(100vh - 250px)',
                  width: '100%',
                  backgroundColor: '#ffffff'
                }}
                opts={{
                  renderer: 'canvas'
                }}
                notMerge={true}
                lazyUpdate={true}
                onEvents={{
                  ...(onChartClick && { click: onChartClick }),
                  ...(onChartEvents || {})
                }}
              />
            </div>
          )}
        </FullscreenModal>
      )}
      
      {/* Legacy Fullscreen Backdrop - only for non-internal fullscreen */}
      {isFullscreen && !useInternalFullscreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleFullscreen}
        />
      )}
    </>
  );
};

export default ModernChartCard;
