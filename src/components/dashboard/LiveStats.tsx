'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import SummaryTable from './SummaryTable';

interface StatsUpdateData {
  type: 'status_counts' | 'new_report' | 'status_change';
  data: {
    statusCounts?: Record<string, number>;
    reportId?: string;
    oldStatus?: string;
    newStatus?: string;
    timestamp?: string;
  };
}

/**
 * LiveStats Component
 * Wraps SummaryTable with real-time socket updates
 * Listens for status changes and new reports to trigger refreshes
 */
export default function LiveStats() {
  const { socket, isConnected } = useSocket();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refresh the wrapped SummaryTable
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setLastUpdate(new Date());
  }, []);

  // Handle real-time statistics updates
  const handleStatsUpdate = useCallback((data: StatsUpdateData) => {
    console.log('📊 Real-time stats update:', data);
    
    switch (data.type) {
      case 'status_counts':
        // Direct status counts update from server
        triggerRefresh();
        break;
      case 'new_report':
        // New report submitted - refresh stats
        triggerRefresh();
        break;
      case 'status_change':
        // Report status changed - refresh stats
        triggerRefresh();
        break;
    }
  }, [triggerRefresh]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join dashboard stats room for real-time updates
    socket.emit('join_room', 'dashboard_stats');

    // Listen for various stats-related events
    const events = [
      'stats_update',
      'new_report_submitted',
      'report_status_changed',
      'dashboard_stats_updated'
    ];

    events.forEach(event => {
      socket.on(event, handleStatsUpdate);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        socket.off(event, handleStatsUpdate);
      });
      socket.emit('leave_room', 'dashboard_stats');
    };
  }, [socket, isConnected, handleStatsUpdate]);

  return (
    <div className="relative">
      {/* Real-time indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center gap-2 text-xs">
          {/* Connection status */}
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          
          {/* Last update time */}
          <span className="text-gray-500">
            Terakhir: {lastUpdate.toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          
          {/* Real-time badge */}
          {isConnected && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              Real-time
            </span>
          )}
        </div>
      </div>

      {/* Wrapped SummaryTable */}
      <SummaryTable key={refreshTrigger} />
    </div>
  );
}
