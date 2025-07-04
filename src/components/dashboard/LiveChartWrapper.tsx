'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface ChartUpdateData {
  type: 'chart_update' | 'new_data' | 'filter_change';
  chartType: 'pie' | 'line' | 'bar_opd' | 'bar_wilayah';
  data: any;
  timestamp: string;
}

interface LiveChartWrapperProps {
  children: React.ReactNode;
  chartType: 'pie' | 'line' | 'bar_opd' | 'bar_wilayah';
  title: string;
  className?: string;
}

/**
 * LiveChartWrapper Component
 * Wraps chart components with real-time update capabilities
 * Provides visual indicators for live updates and data refresh
 */
export default function LiveChartWrapper({ 
  children, 
  chartType, 
  title,
  className = ""
}: LiveChartWrapperProps) {
  const { socket, isConnected } = useSocket();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Force refresh the wrapped chart component
  const triggerRefresh = useCallback(() => {
    setIsUpdating(true);
    setRefreshTrigger(prev => prev + 1);
    setLastUpdate(new Date());
    
    // Reset updating state after animation
    setTimeout(() => {
      setIsUpdating(false);
    }, 1000);
  }, []);

  // Handle real-time chart updates
  const handleChartUpdate = useCallback((data: ChartUpdateData) => {
    // Only handle updates for this specific chart type
    if (data.chartType !== chartType) return;
    
    console.log(`📊 Real-time ${chartType} chart update:`, data);
    triggerRefresh();
  }, [chartType, triggerRefresh]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join chart updates room
    socket.emit('join_room', `chart_updates_${chartType}`);

    // Listen for chart-specific events
    const events = [
      'chart_data_updated',
      'new_report_submitted',
      'report_status_changed',
      `${chartType}_chart_update`
    ];

    events.forEach(event => {
      socket.on(event, handleChartUpdate);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        socket.off(event, handleChartUpdate);
      });
      socket.emit('leave_room', `chart_updates_${chartType}`);
    };
  }, [socket, isConnected, chartType, handleChartUpdate]);

  return (
    <div className={`relative ${className}`}>
      {/* Live update indicator overlay */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {/* Connection status */}
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-gray-400'
        } ${isUpdating ? 'animate-pulse' : ''}`} />
        
        {/* Update animation */}
        {isUpdating && (
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
            Updating...
          </div>
        )}
        
        {/* Last update time */}
        <div className="bg-white bg-opacity-90 backdrop-blur text-xs text-gray-600 px-2 py-1 rounded">
          {lastUpdate.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
        
        {/* Real-time badge */}
        {isConnected && (
          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            Live
          </div>
        )}
      </div>

      {/* Chart update shimmer effect */}
      {isUpdating && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer z-5" />
      )}

      {/* Wrapped chart component */}
      <div className={`transition-opacity duration-300 ${isUpdating ? 'opacity-75' : 'opacity-100'}`}>
        {React.cloneElement(children as React.ReactElement, { key: refreshTrigger })}
      </div>
    </div>
  );
}
