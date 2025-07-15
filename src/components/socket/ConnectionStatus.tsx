// Enhanced Connection Status Indicator Component
// Generated: July 4, 2025

'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { FaWifi, FaExclamationTriangle, FaSpinner, FaSignal } from 'react-icons/fa';

interface ConnectionStatusProps {
  showText?: boolean;
  showDetails?: boolean;
  showProgress?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showText = true,
  showDetails = false,
  showProgress = true,
  className = '',
  size = 'md'
}) => {
  const { 
    isConnected, 
    isReconnecting, 
    connectionStatus, 
    lastConnected, 
    reconnectAttempts,
    networkStatus,
    connectionQuality,
    error,
    reconnect
  } = useSocket();

  const [showTooltip, setShowTooltip] = useState(false);
  const [reconnectionProgress, setReconnectionProgress] = useState(0);
  const [isManualReconnecting, setIsManualReconnecting] = useState(false);

  // Simulate reconnection progress
  useEffect(() => {
    if (isReconnecting || isManualReconnecting) {
      setReconnectionProgress(0);
      const interval = setInterval(() => {
        setReconnectionProgress(prev => {
          if (prev >= 90) return 90; // Don't go to 100% until actually connected
          return prev + Math.random() * 20;
        });
      }, 500);

      return () => clearInterval(interval);
    } else if (isConnected) {
      setReconnectionProgress(100);
      setTimeout(() => setReconnectionProgress(0), 1000);
      setIsManualReconnecting(false); // Reset manual reconnect state
    }
  }, [isReconnecting, isConnected, isManualReconnecting]);

  // Manual reconnect handler
  const handleManualReconnect = async () => {
    if (isManualReconnecting || isReconnecting) return;
    
    try {
      setIsManualReconnecting(true);
      await reconnect();
    } catch (error) {
      console.error('Manual reconnect failed:', error);
      setIsManualReconnecting(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { icon: 'w-3 h-3', text: 'text-xs', padding: 'px-2 py-1' };
      case 'lg':
        return { icon: 'w-6 h-6', text: 'text-base', padding: 'px-4 py-2' };
      default:
        return { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-3 py-1' };
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'connecting':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'reconnecting':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'disconnected':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    const sizeClasses = getSizeClasses();
    
    switch (connectionStatus) {
      case 'connected':
        return <FaWifi className={sizeClasses.icon} />;
      case 'connecting':
      case 'reconnecting':
        return <FaSpinner className={`${sizeClasses.icon} animate-spin`} />;
      case 'disconnected':
        return <FaExclamationTriangle className={sizeClasses.icon} />;
      default:
        return <FaWifi className={sizeClasses.icon} />;
    }
  };

  const getStatusText = () => {
    if (isManualReconnecting) return 'Menghubungkan ulang...';
    
    switch (connectionStatus) {
      case 'connected':
        return 'Terhubung';
      case 'connecting':
        return 'Menghubungkan...';
      case 'reconnecting':
        return `Menghubungkan ulang... (${reconnectAttempts})`;
      case 'disconnected':
        return 'Terputus';
      default:
        return 'Tidak diketahui';
    }
  };

  const getQualityIcon = () => {
    const sizeClasses = getSizeClasses();
    
    return (
      <div className="relative">
        <FaSignal className={`${sizeClasses.icon} ${getQualityColor()}`} />
        <div className="absolute -bottom-1 -right-1">
          {connectionQuality === 'excellent' && (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          )}
          {connectionQuality === 'good' && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
          {connectionQuality === 'fair' && (
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          )}
          {connectionQuality === 'poor' && (
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          )}
        </div>
      </div>
    );
  };

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getQualityText = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'Sangat baik';
      case 'good':
        return 'Baik';
      case 'fair':
        return 'Cukup';
      case 'poor':
        return 'Buruk';
      default:
        return 'Tidak diketahui';
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div 
      className={`relative inline-flex items-center space-x-2 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Main Status Indicator */}
      <div className={`flex items-center space-x-2 ${sizeClasses.padding} rounded-full border ${getStatusColor()}`}>
        <div className="flex items-center space-x-1">
          {getStatusIcon()}
          {showText && (
            <span className={`${sizeClasses.text} font-medium`}>
              {getStatusText()}
            </span>
          )}
        </div>
        
        {/* Manual Reconnect Button */}
        {!isConnected && (
          <button
            onClick={handleManualReconnect}
            disabled={isReconnecting || isManualReconnecting}
            className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Hubungkan ulang ke server"
          >
            <FaSpinner className={`w-3 h-3 ${isManualReconnecting ? 'animate-spin' : ''}`} />
          </button>
        )}
        
        {/* Network Quality Indicator */}
        <div className="ml-2">
          {getQualityIcon()}
        </div>
      </div>

      {/* Reconnection Progress Bar */}
      {showProgress && (isReconnecting || isManualReconnecting) && (
        <div className="absolute -bottom-6 left-0 right-0 bg-gray-200 rounded-full h-1 overflow-hidden">
          <div 
            className="bg-orange-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${reconnectionProgress}%` }}
          ></div>
        </div>
      )}

      {/* Detailed Tooltip */}
      {(showDetails || showTooltip) && (
        <div className="absolute top-full left-0 mt-2 bg-black text-white text-xs rounded px-3 py-2 z-50 whitespace-nowrap shadow-lg">
          <div className="space-y-1">
            <div>Status: {getStatusText()}</div>
            <div>Jaringan: {networkStatus}</div>
            <div className={getQualityColor()}>
              Kualitas: {getQualityText()}
            </div>
            {lastConnected && (
              <div>
                Terakhir: {lastConnected.toLocaleTimeString()}
              </div>
            )}
            {reconnectAttempts > 0 && (
              <div>
                Percobaan: {reconnectAttempts}
              </div>
            )}
            {error && (
              <div className="text-red-300 max-w-xs">
                Error: {error}
              </div>
            )}
          </div>
          
          {/* Tooltip Arrow */}
          <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black"></div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
