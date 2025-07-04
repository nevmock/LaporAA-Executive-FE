'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import MapPersebaran from './MapPersebaran';

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
}

/**
 * LiveMapUpdates Component
 * Wraps MapPersebaran with real-time socket updates
 * Provides live marker updates and boundary changes
 */
export default function LiveMapUpdates({ isFullscreen = false, className = "" }: LiveMapUpdatesProps) {
  const { socket, isConnected } = useSocket();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recentUpdates, setRecentUpdates] = useState<MapUpdateData[]>([]);

  // Force refresh the wrapped MapPersebaran
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setLastUpdate(new Date());
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

  // Get update message
  const getUpdateMessage = (update: MapUpdateData) => {
    switch (update.type) {
      case 'new_marker':
        return `Marker baru ditambahkan di ${update.data.location || 'lokasi tidak diketahui'}`;
      case 'marker_update':
        return `Marker diperbarui: ${update.data.oldStatus} → ${update.data.newStatus}`;
      case 'marker_delete':
        return `Marker dihapus dari peta`;
      case 'boundary_update':
        return `Data wilayah diperbarui`;
      default:
        return 'Peta diperbarui';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Real-time updates indicator */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <span className="text-xs font-medium">
            {isConnected ? 'Live Updates' : 'Offline'}
          </span>
        </div>
        
        <div className="text-xs text-gray-600">
          Terakhir: {lastUpdate.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

        {/* Recent updates */}
        {recentUpdates.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="text-xs font-medium text-gray-700">Update Terbaru:</div>
            {recentUpdates.slice(0, 3).map((update, index) => (
              <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {getUpdateMessage(update)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New report notification overlay */}
      {recentUpdates.some(u => u.type === 'new_marker') && (
        <div className="absolute top-4 left-4 z-[1000] bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span className="text-sm font-medium">Laporan baru diterima!</span>
          </div>
        </div>
      )}

      {/* Wrapped MapPersebaran component */}
      <MapPersebaran 
        key={refreshTrigger} 
        isFullscreen={isFullscreen}
      />
    </div>
  );
}
