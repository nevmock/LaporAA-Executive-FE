'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import MapPersebaran from '../maps/MapPersebaran';

interface MapUpdateData {
  type: 'new_marker' | 'marker_update' | 'marker_delete' | 'boundary_update';
  data: {
    reportId?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    oldStatus?: string;
    newStatus?: string;
    location?: string;
    timestamp?: string;
  };
}

interface LiveMapUpdatesProps {
  isFullscreen?: boolean;
  className?: string;
  timeFilter?: string;
  year?: number;
  month?: number;
  week?: number;
  selectedStatus?: string;
  selectedKecamatan?: string;
  limitView?: number;
  showBoundaries?: boolean;
  setBoundariesLoading?: (loading: boolean) => void;
}

/**
 * LiveMapUpdates Component
 * Wraps MapPersebaran with real-time socket updates
 * Provides live marker updates and boundary changes
 */
export default function LiveMapUpdates({ 
  // Note: isFullscreen parameter removed as it was unused
  className = "",
  timeFilter = 'monthly',
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  week = 1,
  selectedStatus = 'Semua Status',
  selectedKecamatan = 'Semua Kecamatan',
  limitView = 100,
  showBoundaries = true,
  setBoundariesLoading
}: LiveMapUpdatesProps) {
  const { socket, isConnected } = useSocket();
  // Note: lastUpdate variable removed as it was unused
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recentUpdates, setRecentUpdates] = useState<MapUpdateData[]>([]);

  // Force refresh the wrapped MapPersebaran
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Add recent update to the list
  const addRecentUpdate = useCallback((update: MapUpdateData) => {
    setRecentUpdates(prev => {
      const newUpdates = [update, ...prev].slice(0, 5); // Keep only last 5 updates
      return newUpdates;
    });
  }, []);

  // Handle real-time map updates
  const handleMapUpdate = useCallback((data: MapUpdateData) => {
    console.log('🗺️ Real-time map update:', data);
    
    addRecentUpdate(data);
    
    switch (data.type) {
      case 'new_marker':
        // New report with location - add new marker
        triggerRefresh();
        break;
      case 'marker_update':
        // Existing report status changed - update marker
        triggerRefresh();
        break;
      case 'marker_delete':
        // Report deleted or location removed
        triggerRefresh();
        break;
      case 'boundary_update':
        // Boundary/region data updated
        triggerRefresh();
        break;
    }
  }, [triggerRefresh, addRecentUpdate]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join map updates room
    socket.emit('join_room', 'map_updates');

    // Listen for map-related events
    const events = [
      'new_report_with_location',
      'report_location_updated',
      'report_status_changed',
      'report_deleted',
      'map_data_updated',
      'boundary_data_updated'
    ];

    events.forEach(event => {
      socket.on(event, handleMapUpdate);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        socket.off(event, handleMapUpdate);
      });
      socket.emit('leave_room', 'map_updates');
    };
  }, [socket, isConnected, handleMapUpdate]);

  // Clear old updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setRecentUpdates([]);
    }, 30000); // Clear after 30 seconds

    return () => clearTimeout(timer);
  }, [recentUpdates]);

  // Note: getUpdateMessage function removed as it was unused

  return (
    <div className={`w-full h-full ${className}`}>
      {/* Clean map display without live indicators */}
      <MapPersebaran 
        filter={timeFilter}
        year={year}
        month={month}
        week={week}
        selectedStatus={selectedStatus}
        selectedKecamatan={selectedKecamatan}
        limitView={limitView}
        showBoundaries={showBoundaries}
        setBoundariesLoading={setBoundariesLoading}
      />
    </div>
  );
}
