"use client";

import React, { useState, useEffect } from 'react';
import { FiUsers, FiActivity, FiClock, FiRefreshCw } from 'react-icons/fi';
import { adminPerformanceService, OnlineStatus } from '@/services/adminPerformanceService';

interface OnlineStatusWidgetProps {
  onAdminClick?: (adminId: string) => void;
}

const OnlineStatusWidget: React.FC<OnlineStatusWidgetProps> = ({ onAdminClick }) => {
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOnlineStatus = async () => {
    try {
      setLoading(true);
      const data = await adminPerformanceService.getOnlineStatus();
      setOnlineStatus(data);
    } catch (error) {
      console.error('Error loading online status:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      setRefreshing(true);
      await loadOnlineStatus();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOnlineStatus();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(loadOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading status...</p>
        </div>
      </div>
    );
  }

  if (!onlineStatus) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>Unable to load admin status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Admin Status</h3>
            <p className="text-sm text-gray-600">Real-time admin activity</p>
          </div>
          <button
            onClick={refreshStatus}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={18} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-2xl font-bold text-green-600">{onlineStatus.totalOnline}</span>
            </div>
            <p className="text-xs text-gray-500">Online</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FiActivity className="text-blue-600" size={16} />
              <span className="text-2xl font-bold text-blue-600">{onlineStatus.totalActive}</span>
            </div>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FiUsers className="text-gray-600" size={16} />
              <span className="text-2xl font-bold text-gray-600">{onlineStatus.adminList.length}</span>
            </div>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Admin List */}
      <div className="p-6">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {onlineStatus.adminList.map((admin) => (
            <div 
              key={admin.adminId} 
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                onAdminClick ? 'cursor-pointer hover:bg-gray-50 hover:border-blue-200' : ''
              }`}
              onClick={() => onAdminClick?.(admin.adminId)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-xs">
                      {admin.adminName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {admin.adminName}
                    </p>
                    <div className={`w-2 h-2 rounded-full ${
                      admin.isOnline ? 'bg-green-400' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  <p className="text-xs text-gray-500">{admin.role}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FiClock size={12} />
                  {formatDuration(admin.sessionDuration)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FiActivity size={12} />
                  {admin.activityCount}
                </div>
                {admin.isOnline && (
                  <span className="text-xs text-green-600">
                    Active {formatDateTime(admin.lastActivity)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {onlineStatus.adminList.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <FiUsers size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No admin data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineStatusWidget;
