import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'unknown' | 'ethernet' | 'wifi' | 'cellular' | 'bluetooth';
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  isSlowConnection: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

// Type definitions for experimental Network Information API
interface NetworkInformation extends EventTarget {
  type?: 'unknown' | 'ethernet' | 'wifi' | 'cellular' | 'bluetooth';
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  onchange?: ((this: NetworkInformation, ev: Event) => unknown) | null;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

/**
 * Custom hook for monitoring network status and connection quality
 * Provides real-time information about:
 * - Online/offline status
 * - Connection type (wifi, cellular, etc.)
 * - Connection speed and quality
 * - Data saver mode
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
    isSlowConnection: false,
    quality: 'unknown',
  });

  // Get connection quality based on effective type and RTT
  const getConnectionQuality = useCallback((effectiveType: string, rtt: number): NetworkStatus['quality'] => {
    if (rtt === 0) return 'unknown';
    
    if (effectiveType === '4g' && rtt < 100) return 'excellent';
    if (effectiveType === '4g' && rtt < 200) return 'good';
    if (effectiveType === '3g' && rtt < 300) return 'good';
    if (effectiveType === '3g' && rtt < 500) return 'fair';
    if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'poor';
    
    // Fallback based on RTT only
    if (rtt < 100) return 'excellent';
    if (rtt < 200) return 'good';
    if (rtt < 500) return 'fair';
    return 'poor';
  }, []);

  // Update network information from Navigator API
  const updateNetworkInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return;
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType || 'unknown';
      const rtt = connection.rtt || 0;
      const downlink = connection.downlink || 0;
      const isSlowConnection = effectiveType === '2g' || effectiveType === 'slow-2g' || rtt > 500;
      
      setNetworkStatus(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        effectiveType,
        downlink,
        rtt,
        saveData: connection.saveData || false,
        isSlowConnection,
        quality: getConnectionQuality(effectiveType, rtt),
      }));
    }
  }, [getConnectionQuality]);

  // Handle online status change
  const handleOnlineStatusChange = useCallback(() => {
    if (typeof navigator === 'undefined') return;
    
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }));
    
    // Update network info when coming back online
    if (navigator.onLine) {
      updateNetworkInfo();
    }
  }, [updateNetworkInfo]);

  // Handle connection change
  const handleConnectionChange = useCallback(() => {
    updateNetworkInfo();
  }, [updateNetworkInfo]);

  useEffect(() => {
    // Initial network info update
    updateNetworkInfo();

    // Listen for online/offline events
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Listen for connection changes (experimental API)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [handleOnlineStatusChange, handleConnectionChange, updateNetworkInfo]);

  return networkStatus;
};

export default useNetworkStatus;
