'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import SummaryTable from '../tables/SummaryTable';

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
  // Note: lastUpdate variable removed as it was unused
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refresh the wrapped SummaryTable
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
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
    <div className="w-full">
      {/* Wrapped SummaryTable without real-time indicators */}
      <SummaryTable key={refreshTrigger} />
    </div>
  );
}
