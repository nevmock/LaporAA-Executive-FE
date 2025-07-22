// NotificationDropdown Component - Real-time System Notifications
// Generated: July 4, 2025

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { FiBell, FiCheck, FiAlertTriangle, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';
import { NotificationData } from '../../types/socket.types';

interface NotificationDropdownProps {
  className?: string;
  maxVisible?: number;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  className = '',
  maxVisible = 5
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const socket = useSocket({
    autoJoinRooms: ['admin', 'system', 'dashboard'],
    eventHandlers: {
      'newReportCreated': handleNewReportCreated
    }
  });

  // Helper function to add notification internally
  function addNotificationInternal(notification: Partial<NotificationData> & { title: string; message: string }) {
    const notificationData: NotificationData = {
      id: notification.id || Date.now().toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      timestamp: new Date(notification.timestamp || new Date()),
      read: notification.read || false,
      priority: notification.priority || 'medium',
      actions: notification.actions
    };

    setNotifications(prev => [notificationData, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    // Trigger bell animation
    setHasNewNotification(true);
    setTimeout(() => setHasNewNotification(false), 3000); // Reset animation after 3 seconds
  }

  // Handle new report created (from backend real-time service)
  function handleNewReportCreated(...args: unknown[]) {
    const data = args[0] as { 
      reportId?: string; 
      sessionId?: string; 
      from?: string; 
      userName?: string;
      message?: string; 
      location?: string; 
      coordinates?: { lat: number; lng: number };
      timestamp?: string;
      [key: string]: unknown 
    };
    
    console.log('🔔 New report notification received:', data);
    
    // Extract report details
    const reporterName = data.userName || data.from || 'Anonim';
    const reportMessage = data.message || 'Laporan baru masuk';
    const location = data.location || '';
    
    // Truncate message if too long
    const truncatedMessage = reportMessage.length > 80 
      ? `${reportMessage.substring(0, 80)}...` 
      : reportMessage;
    
    // Format location for display
    const locationText = location ? ` dari ${location}` : '';
    
    // Format timestamp
    const timeAgo = data.timestamp 
      ? new Date(data.timestamp).toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : new Date().toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    
    addNotificationInternal({
      id: `new_report_${data.reportId || Date.now()}`,
      title: '📋 Laporan Baru Masuk',
      message: `**${reporterName}**${locationText}\n${truncatedMessage}`,
      type: 'info',
      timestamp: new Date(data.timestamp || new Date()),
      priority: 'high',
      actions: [{
        id: 'view_report',
        label: 'Lihat Laporan',
        type: 'button',
        url: `/pengaduan`,
        variant: 'primary'
      }]
    });
    
    // Show browser notification if supported and permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Laporan Baru Masuk', {
        body: `${reporterName}${locationText}: ${truncatedMessage}`,
        icon: '/LAPOR AA BUPATI.png',
        tag: `report_${data.reportId}`,
        requireInteraction: true
      });
    }
  }

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📱 Browser notification permission:', permission);
      });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    
    // Emit to server
    socket.emit('notificationRead', {
      notificationId,
      adminId: typeof window !== 'undefined' ? localStorage.getItem('nama_admin') : null,
      timestamp: new Date().toISOString()
    });
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    socket.emit('notificationReadAll', {
      adminId: typeof window !== 'undefined' ? localStorage.getItem('nama_admin') : null,
      timestamp: new Date().toISOString()
    });
  };

  // Remove notification
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <FiAlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <FiAlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FiInfo className="w-4 h-4 text-blue-500" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}h yang lalu`;
    if (hours > 0) return `${hours}j yang lalu`;
    if (minutes > 0) return `${minutes}m yang lalu`;
    return 'Baru saja';
  };

  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewNotification(false); // Stop animation when clicked
        }}
        className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${
          hasNewNotification ? 'animate-pulse' : ''
        }`}
        title={`${unreadCount} notifikasi belum dibaca`}
      >
        <FiBell className={`w-5 h-5 transition-all duration-300 ${
          unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'
        } ${hasNewNotification ? 'animate-bounce' : ''}`} />
        
        {unreadCount > 0 && (
          <div className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${
            hasNewNotification ? 'animate-ping' : ''
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tandai semua terbaca
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {visibleNotifications.length > 0 ? (
              visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <FiCheck className="w-3 h-3 inline mr-1" />
                            Tandai terbaca
                          </button>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex space-x-2 mt-2">
                          {notification.actions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => {
                                if (action.url) {
                                  window.location.href = action.url;
                                } else if (action.onClick) {
                                  action.onClick();
                                }
                                markAsRead(notification.id);
                              }}
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                action.variant === 'primary'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Tidak ada notifikasi</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > maxVisible && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center">
                Lihat semua notifikasi ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
