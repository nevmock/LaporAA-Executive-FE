'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';

interface SystemNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  persistent?: boolean;
  sound?: boolean;
}

interface ToastNotificationProps {
  notification: SystemNotification;
  onClose: (id: string) => void;
}

interface GlobalNotificationSystemProps {
  enableSound?: boolean;
  maxNotifications?: number;
}

// Individual Toast Notification Component
function ToastNotification({ notification, onClose }: ToastNotificationProps) {
  // const [isVisible, setIsVisible] = useState(true); // Currently unused
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Match animation duration
  }, [notification.id, onClose]);

  // Auto-close timer
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, onClose, handleClose]); // Added missing dependency

  // Icon based on type
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Background color based on type
  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isExiting 
          ? 'translate-x-full opacity-0 scale-95' 
          : 'translate-x-0 opacity-100 scale-100'
        }
        animate-slide-in-right
      `}
    >
      <div className={`
        max-w-sm w-full shadow-lg rounded-lg border
        ${getBgColor()}
        ${notification.priority === 'high' ? 'ring-2 ring-opacity-50 ring-red-500' : ''}
      `}>
        <div className="p-4">
          <div className="flex items-start">
            {/* Icon */}
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            
            {/* Content */}
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
              
              {/* Action button */}
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
              
              {/* Timestamp */}
              <div className="mt-2 text-xs text-gray-400">
                {new Date(notification.timestamp).toLocaleTimeString('id-ID')}
              </div>
            </div>
            
            {/* Close button */}
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar for timed notifications */}
        {notification.duration && notification.duration > 0 && (
          <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-blue-500 animate-progress"
              style={{ 
                animationDuration: `${notification.duration}ms`,
                animationTimingFunction: 'linear'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * GlobalNotificationSystem Component
 * Provides system-wide toast notifications and alerts
 * Integrates with socket for real-time notifications
 */
export default function GlobalNotificationSystem({ 
  enableSound = false,
  maxNotifications = 5 
}: GlobalNotificationSystemProps) {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Play notification sound
  const playNotificationSound = useCallback((type: SystemNotification['type']) => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Different frequencies for different types
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 700
      };

      oscillator.frequency.setValueAtTime(frequencies[type], context.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);
    }
  }, []);

  // Add notification
  const addNotification = useCallback((notification: Omit<SystemNotification, 'id' | 'timestamp'>) => {
    const newNotification: SystemNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      duration: notification.duration ?? 5000, // Default 5 seconds
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Play sound if enabled
    if (enableSound && notification.sound !== false) {
      playNotificationSound(notification.type);
    }
  }, [maxNotifications, enableSound, playNotificationSound]); // Added missing dependency

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  // Handle socket notifications
  const handleSocketNotification = useCallback((...args: unknown[]) => {
    const data = args[0] as { type: string; message?: string; title?: string; priority?: string; [key: string]: unknown };
    console.log('🔔 Received system notification:', data);
    
    let notification: Omit<SystemNotification, 'id' | 'timestamp'>;

    switch (data.type) {
      case 'system_alert':
        notification = {
          type: 'warning',
          title: 'Peringatan Sistem',
          message: data.message || 'Terjadi masalah sistem',
          priority: 'high',
          persistent: true,
          duration: 0
        };
        break;
        
      case 'new_report_admin':
        notification = {
          type: 'info',
          title: 'Laporan Baru',
          message: `Laporan baru diterima: ${data.title || 'Tanpa judul'}`,
          priority: 'medium',
          duration: 7000,
          action: {
            label: 'Lihat Laporan',
            onClick: () => window.open(`/pengaduan/laporan/${data.reportId}`, '_blank')
          }
        };
        break;
        
      case 'assignment_notification':
        notification = {
          type: 'success',
          title: 'Tugas Baru',
          message: `Anda mendapat tugas baru: ${data.title || 'Tanpa judul'}`,
          priority: 'high',
          duration: 10000,
          sound: true
        };
        break;
        
      case 'status_update':
        notification = {
          type: 'info',
          title: 'Status Diperbarui',
          message: `Status laporan ${data.reportId} diubah menjadi ${data.newStatus}`,
          priority: 'low',
          duration: 5000
        };
        break;
        
      case 'maintenance_alert':
        notification = {
          type: 'warning',
          title: 'Pemeliharaan Sistem',
          message: data.message || 'Sistem akan mengalami pemeliharaan',
          priority: 'high',
          persistent: true,
          duration: 0
        };
        break;
        
      case 'connection_restored':
        notification = {
          type: 'success',
          title: 'Koneksi Pulih',
          message: 'Koneksi ke server telah pulih',
          priority: 'medium',
          duration: 3000
        };
        break;
        
      default:
        notification = {
          type: 'info',
          title: data.title || 'Notifikasi',
          message: data.message || 'Anda memiliki notifikasi baru',
          priority: (data.priority as 'high' | 'medium' | 'low') || 'medium',
          duration: 5000
        };
    }

    addNotification(notification);
  }, [addNotification]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join notification room
    socket.emit('join_room', 'system_notifications');

    // Listen for various notification events
    const events = [
      'system_notification',
      'admin_notification',
      'broadcast_notification',
      'maintenance_alert',
      'connection_restored'
    ];

    events.forEach(event => {
      socket.on(event, handleSocketNotification);
    });

    // Connection status notifications - connect notification removed per request

    socket.on('disconnect', () => {
      addNotification({
        type: 'warning',
        title: 'Terputus',
        message: 'Koneksi real-time terputus',
        priority: 'medium',
        duration: 0,
        persistent: true
      });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        socket.off(event, handleSocketNotification);
      });
      socket.off('disconnect');
      socket.emit('leave_room', 'system_notifications');
    };
  }, [socket, isConnected, handleSocketNotification, addNotification]);

  return (
    <>
      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
      
      {/* Add custom CSS for animations */}
      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-progress {
          animation: progress linear;
        }
      `}</style>
    </>
  );
}
