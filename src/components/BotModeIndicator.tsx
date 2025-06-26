import React from 'react';
import { BotMode } from '../services/botModeService';

export interface BotModeIndicatorProps {
  mode: BotMode;
  isReady: boolean;
  isChanging: boolean;
  error: string | null;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function BotModeIndicator({
  mode,
  isReady,
  isChanging,
  error,
  className = '',
  showLabel = true,
  size = 'md',
  onClick
}: BotModeIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  };

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const getStatusColor = () => {
    if (error) return 'bg-red-500';
    if (isChanging) return 'bg-yellow-500 animate-pulse';
    if (!isReady) return 'bg-gray-400 animate-pulse';
    return mode === 'manual' ? 'bg-green-500' : 'bg-blue-500';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isChanging) return 'Mengubah...';
    if (!isReady) return 'Memuat...';
    return mode === 'manual' ? 'Manual' : 'Bot';
  };

  const getBgColor = () => {
    if (error) return 'bg-red-50 border-red-200';
    if (isChanging) return 'bg-yellow-50 border-yellow-200';
    if (!isReady) return 'bg-gray-50 border-gray-200';
    return 'bg-white border-gray-200';
  };

  return (
    <div
      className={`
        flex items-center gap-2 shadow rounded-full border transition-all
        ${getBgColor()}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
      title={error || `Mode: ${getStatusText()}`}
    >
      {/* Status Dot */}
      <span className={`rounded-full ${dotSizeClasses[size]} ${getStatusColor()}`} />
      
      {/* Label */}
      {showLabel && (
        <span className="text-gray-700 font-medium">
          {showLabel === true ? 'Mode:' : ''} {getStatusText()}
        </span>
      )}
    </div>
  );
}

// Debug panel component
export interface BotModeDebugPanelProps {
  mode: BotMode;
  isReady: boolean;
  isChanging: boolean;
  error: string | null;
  cacheStats: {
    size: number;
    entries?: Array<{
      from: string;
      mode: string;
      age: number;
    }>;
  } | null;
  onRefresh: () => void;
  onClearCache: () => void;
  onChangeMode: (mode: BotMode) => void;
}

export function BotModeDebugPanel({
  mode,
  isReady,
  isChanging,
  error,
  cacheStats,
  onRefresh,
  onClearCache,
  onChangeMode
}: BotModeDebugPanelProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm text-xs z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">Bot Mode Debug</h3>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-800"
          title="Refresh"
        >
          🔄
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Mode:</span>
          <span className={`font-medium ${mode === 'manual' ? 'text-green-600' : 'text-blue-600'}`}>
            {mode}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Ready:</span>
          <span className={isReady ? 'text-green-600' : 'text-red-600'}>
            {isReady ? '✓' : '✗'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Changing:</span>
          <span className={isChanging ? 'text-yellow-600' : 'text-gray-600'}>
            {isChanging ? '⏳' : '—'}
          </span>
        </div>
        
        {error && (
          <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        
        {cacheStats && (
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span>Cache entries:</span>
              <span>{cacheStats.size}</span>
            </div>
            {cacheStats.entries?.map((entry, idx: number) => (
              <div key={idx} className="text-xs text-gray-600">
                {entry.from}: {entry.mode} ({Math.round(entry.age/1000)}s)
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={() => onChangeMode('manual')}
            disabled={isChanging || mode === 'manual'}
            className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs disabled:opacity-50"
          >
            Manual
          </button>
          <button
            onClick={() => onChangeMode('bot')}
            disabled={isChanging || mode === 'bot'}
            className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50"
          >
            Bot
          </button>
        </div>
        
        <button
          onClick={onClearCache}
          className="w-full px-2 py-1 bg-gray-500 text-white rounded text-xs"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}
