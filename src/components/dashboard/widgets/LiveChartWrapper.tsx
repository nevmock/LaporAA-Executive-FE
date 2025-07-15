'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface ChartUpdateData {
  type: 'chart_update' | 'new_data' | 'filter_change';
  chartType: 'pie' | 'line' | 'bar_opd' | 'bar_wilayah';
  data: Record<string, unknown>;
  timestamp: string;
}

interface LiveChartWrapperProps {
  children: React.ReactNode;
  chartType: 'pie' | 'line' | 'bar_opd' | 'bar_wilayah';
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
  className = ""
}: LiveChartWrapperProps) {
  const { socket, isConnected } = useSocket();
  // Note: lastUpdate and isUpdating variables removed as they were unused
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refresh the wrapped chart component
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
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
    <div className={`w-full h-full ${className}`}>
      {/* Wrapped chart component without live indicators */}
      <div className="w-full h-full">
        {React.cloneElement(children as React.ReactElement, { key: refreshTrigger })}
      </div>
    </div>
  );
}
