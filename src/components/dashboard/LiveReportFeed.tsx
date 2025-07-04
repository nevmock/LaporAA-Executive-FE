'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Bell, MapPin, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';

interface ReportActivity {
  id: string;
  type: 'new_report' | 'status_change' | 'assignment' | 'comment';
  reportId: string;
  title: string;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
  location?: string;
  assignedTo?: string;
  adminName?: string;
  timestamp: string;
  priority?: 'high' | 'medium' | 'low';
}

interface LiveReportFeedProps {
  maxItems?: number;
  showActions?: boolean;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  "Perlu Verifikasi": "#FF3131",
  "Verifikasi Situasi": "#5E17EB", 
  "Verifikasi Kelengkapan Berkas": "#FF9F12",
  "Proses OPD Terkait": "#FACC15",
  "Selesai Penanganan": "#60A5FA",
  "Selesai Pengaduan": "#4ADE80",
  "Ditutup": "#000000",
};

/**
 * LiveReportFeed Component
 * Real-time feed of report activities and updates
 */
export default function LiveReportFeed({ 
  maxItems = 10, 
  showActions = true,
  className = ""
}: LiveReportFeedProps) {
  const { socket, isConnected } = useSocket();
  const [activities, setActivities] = useState<ReportActivity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add new activity to the feed
  const addActivity = useCallback((activity: ReportActivity) => {
    setActivities(prev => {
      const newActivities = [activity, ...prev].slice(0, maxItems);
      return newActivities;
    });
    setUnreadCount(prev => prev + 1);
  }, [maxItems]);

  // Handle real-time report events
  const handleReportEvent = useCallback((data: any) => {
    const timestamp = new Date().toISOString();
    
    switch (data.type) {
      case 'new_report':
        addActivity({
          id: `new_${data.reportId}_${Date.now()}`,
          type: 'new_report',
          reportId: data.reportId,
          title: data.title || 'Laporan Baru',
          status: data.status || 'Perlu Verifikasi',
          location: data.location,
          timestamp,
          priority: data.priority || 'medium'
        });
        break;
        
      case 'status_change':
        addActivity({
          id: `status_${data.reportId}_${Date.now()}`,
          type: 'status_change',
          reportId: data.reportId,
          title: data.title || 'Status Diperbarui',
          oldStatus: data.oldStatus,
          newStatus: data.newStatus,
          adminName: data.adminName,
          timestamp,
          priority: 'medium'
        });
        break;
        
      case 'assignment':
        addActivity({
          id: `assign_${data.reportId}_${Date.now()}`,
          type: 'assignment',
          reportId: data.reportId,
          title: data.title || 'Laporan Ditugaskan',
          assignedTo: data.assignedTo,
          adminName: data.adminName,
          timestamp,
          priority: 'high'
        });
        break;
        
      case 'comment':
        addActivity({
          id: `comment_${data.reportId}_${Date.now()}`,
          type: 'comment',
          reportId: data.reportId,
          title: data.title || 'Komentar Baru',
          adminName: data.adminName,
          timestamp,
          priority: 'low'
        });
        break;
    }
  }, [addActivity]);

  // Mark activities as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join live feed room
    socket.emit('join_room', 'live_feed');

    // Listen for report events
    const events = [
      'new_report_submitted',
      'report_status_changed', 
      'report_assigned',
      'report_comment_added',
      'live_activity_update'
    ];

    events.forEach(event => {
      socket.on(event, handleReportEvent);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        socket.off(event, handleReportEvent);
      });
      socket.emit('leave_room', 'live_feed');
    };
  }, [socket, isConnected, handleReportEvent]);

  // Activity icon based on type
  const getActivityIcon = (activity: ReportActivity) => {
    switch (activity.type) {
      case 'new_report':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'status_change':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'assignment':
        return <User className="w-4 h-4 text-purple-500" />;
      case 'comment':
        return <Bell className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Activity description
  const getActivityDescription = (activity: ReportActivity) => {
    switch (activity.type) {
      case 'new_report':
        return (
          <div>
            <span className="font-medium">Laporan baru diterima</span>
            {activity.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3" />
                {activity.location}
              </div>
            )}
          </div>
        );
      case 'status_change':
        return (
          <div>
            <span className="font-medium">Status diubah</span>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span 
                className="px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: STATUS_COLORS[activity.oldStatus || ''] || '#gray' }}
              >
                {activity.oldStatus}
              </span>
              <span>→</span>
              <span 
                className="px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: STATUS_COLORS[activity.newStatus || ''] || '#gray' }}
              >
                {activity.newStatus}
              </span>
            </div>
            {activity.adminName && (
              <div className="text-xs text-gray-500 mt-1">
                oleh {activity.adminName}
              </div>
            )}
          </div>
        );
      case 'assignment':
        return (
          <div>
            <span className="font-medium">Laporan ditugaskan</span>
            {activity.assignedTo && (
              <div className="text-xs text-gray-500 mt-1">
                kepada {activity.assignedTo}
              </div>
            )}
          </div>
        );
      case 'comment':
        return (
          <div>
            <span className="font-medium">Komentar baru</span>
            {activity.adminName && (
              <div className="text-xs text-gray-500 mt-1">
                dari {activity.adminName}
              </div>
            )}
          </div>
        );
      default:
        return activity.title;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Aktivitas Real-time</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Live' : 'Offline'}
          </span>
          
          {unreadCount > 0 && (
            <button
              onClick={markAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Tandai sudah dibaca
            </button>
          )}
        </div>
      </div>

      {/* Activities List */}
      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Belum ada aktivitas terbaru</p>
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="text-sm">
                      {getActivityDescription(activity)}
                    </div>
                    
                    {/* Timestamp and Report ID */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(activity.timestamp).toLocaleString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                      <span>•</span>
                      <span>ID: {activity.reportId}</span>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  {showActions && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          // Navigate to report detail
                          window.open(`/pengaduan/laporan/${activity.reportId}`, '_blank');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                      >
                        Lihat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
