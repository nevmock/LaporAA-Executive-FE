// useSocket Hook - Easy Socket Access and Management
// Generated: July 3, 2025

'use client';

import { useEffect, useCallback } from 'react';
import { useSocketContext } from '../contexts/SocketContext';
import { socketService } from '../services/socketService';
import { SocketContextType, SocketEventHandler, ConnectionStats } from '../types/socket.types';

interface UseSocketOptions {
  autoJoinRooms?: string[];
  eventHandlers?: Record<string, SocketEventHandler>;
  dependencies?: unknown[];
}

interface UseSocketReturn extends SocketContextType {
  // Additional helper methods
  emit: (event: string, data?: unknown) => void;
  on: (event: string, callback: SocketEventHandler) => void;
  off: (event: string, callback?: SocketEventHandler) => void;
  joinRooms: (rooms: string[]) => void;
  leaveRooms: (rooms: string[]) => void;
  getCurrentRooms: () => string[];
  getConnectionStats: () => ConnectionStats | null;
  isEventSupported: (event: string) => boolean;
}

/**
 * Custom hook for easy socket access and management
 */
export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const socketContext = useSocketContext();
  const { autoJoinRooms = [], eventHandlers = {}, dependencies = [] } = options;

  // Auto-join rooms when connected
  useEffect(() => {
    if (socketContext.isConnected && autoJoinRooms.length > 0) {
      autoJoinRooms.forEach(room => {
        socketContext.joinRoom(room);
      });
    }
  }, [socketContext, autoJoinRooms]);

  // Register event handlers
  useEffect(() => {
    if (!socketContext.isConnected) return;

    const handlers: Array<{ event: string; callback: SocketEventHandler }> = [];

    Object.entries(eventHandlers).forEach(([event, callback]) => {
      socketService.on(event, callback);
      handlers.push({ event, callback });
    });

    return () => {
      handlers.forEach(({ event, callback }) => {
        socketService.off(event, callback);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketContext.isConnected, eventHandlers, ...dependencies]);

  // Helper methods
  const emit = useCallback((event: string, data?: unknown) => {
    socketContext.sendMessage(event, data);
  }, [socketContext]);

  const on = useCallback((event: string, callback: SocketEventHandler) => {
    socketService.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: SocketEventHandler) => {
    socketService.off(event, callback);
  }, []);

  const joinRooms = useCallback((rooms: string[]) => {
    rooms.forEach(room => {
      socketContext.joinRoom(room);
    });
  }, [socketContext]);

  const leaveRooms = useCallback((rooms: string[]) => {
    rooms.forEach(room => {
      socketContext.leaveRoom(room);
    });
  }, [socketContext]);

  const getCurrentRooms = useCallback(() => {
    return socketService.getRooms();
  }, []);

  const getConnectionStats = useCallback(() => {
    return socketService.getStats();
  }, []);

  const isEventSupported = useCallback((event: string) => {
    // List of supported events
    const supportedEvents = [
      // System events
      'connect', 'disconnect', 'connect_error', 'reconnect', 'reconnecting', 'reconnect_error',
      
      // Chat events
      'newMessage', 'messageStatus', 'userTyping', 'adminTyping', 'messageRead', 'markMessageRead',
      
      // Dashboard events
      'dashboardUpdate', 'liveStatsUpdate', 'activeUsersUpdate', 'performanceUpdate',
      
      // Notification events
      'notificationNew', 'notificationRead', 'alertCritical', 'systemAlert',
      
      // Report events
      'newReport', 'reportStatusUpdate', 'reportUpdate',
      
      // System events
      'modeChanged', 'systemUpdate', 'serverMaintenance',
      
      // Room events
      'join_room', 'leave_room', 'room_joined', 'room_left',
      
      // User events
      'userOnlineStatus', 'userActivity', 'userSessionUpdate'
    ];

    return supportedEvents.includes(event);
  }, []);

  return {
    ...socketContext,
    emit,
    on,
    off,
    joinRooms,
    leaveRooms,
    getCurrentRooms,
    getConnectionStats,
    isEventSupported
  };
};

/**
 * Hook for specific room management
 */
export const useSocketRoom = (roomId: string) => {
  const socket = useSocket({
    autoJoinRooms: [roomId]
  });

  useEffect(() => {
    // Auto-join room when connected
    if (socket.isConnected) {
      socket.joinRoom(roomId);
    }

    // Cleanup: leave room when unmounting
    return () => {
      if (socket.isConnected) {
        socket.leaveRoom(roomId);
      }
    };
  }, [socket, roomId]);

  return socket;
};

/**
 * Hook for event-specific socket usage
 */
export const useSocketEvent = (event: string, callback: SocketEventHandler, dependencies: unknown[] = []) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket.isConnected) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, event, callback, ...dependencies]);

  return socket;
};

/**
 * Hook for chat-specific socket functionality
 */
export const useSocketChat = (sessionId: string) => {
  const socket = useSocket({
    autoJoinRooms: [`chat_${sessionId}`]
  });

  const sendMessage = useCallback((message: string, type: string = 'text', mediaUrl?: string) => {
    socket.emit('sendMessage', {
      sessionId,
      message,
      type,
      mediaUrl,
      timestamp: new Date().toISOString()
    });
  }, [socket, sessionId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    socket.emit('userTyping', {
      sessionId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  }, [socket, sessionId]);

  const markMessageRead = useCallback((messageId: string) => {
    socket.emit('markMessageRead', {
      sessionId,
      messageId,
      timestamp: new Date().toISOString()
    });
  }, [socket, sessionId]);

  return {
    ...socket,
    sendMessage,
    sendTyping,
    markMessageRead
  };
};

/**
 * Hook for admin-specific socket functionality
 */
export const useSocketAdmin = (adminId: string) => {
  const socket = useSocket({
    autoJoinRooms: ['admin', `admin_${adminId}`]
  });

  const broadcastMessage = useCallback((message: string, targetRooms: string[] = []) => {
    socket.emit('adminBroadcast', {
      adminId,
      message,
      targetRooms,
      timestamp: new Date().toISOString()
    });
  }, [socket, adminId]);

  const sendSystemAlert = useCallback((alert: { type: string; message: string; priority?: string }) => {
    socket.emit('systemAlert', {
      adminId,
      alert,
      timestamp: new Date().toISOString()
    });
  }, [socket, adminId]);

  return {
    ...socket,
    broadcastMessage,
    sendSystemAlert
  };
};

export default useSocket;
