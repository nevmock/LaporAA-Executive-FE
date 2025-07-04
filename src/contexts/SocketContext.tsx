// Socket Context - Global Socket State Management
// Generated: July 3, 2025

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketService } from '../services/socketService';
import { messageQueue } from '../services/messageQueue';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { SocketContextType, AuthData, QueuedMessage, Socket, SocketEventCallback } from '../types/socket.types';

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
  apiUrl?: string;
  authData?: AuthData;
  autoConnect?: boolean;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  apiUrl = process.env.NEXT_PUBLIC_BE_BASE_URL || 'http://localhost:3001',
  authData,
  autoConnect = true
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<QueuedMessage[]>([]);

  // Use network status hook
  const networkStatus = useNetworkStatus();

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    const initializeSocket = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Get auth data from localStorage
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || localStorage.getItem('username');
        const role = localStorage.getItem('role');
        const sessionId = localStorage.getItem('sessionId');
        
        await socketService.connect(apiUrl, authData);
        
        // Authenticate with the server
        if (token && userId && role) {
          socketService.emit('authenticate', {
            token,
            userId,
            role,
            sessionId
          });
        }
        
        console.log('✅ Socket service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize socket service:', error);
        setError(error instanceof Error ? error.message : 'Connection failed');
        setConnectionStatus('disconnected');
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [apiUrl, authData, autoConnect]);

  // Set up event listeners for connection status
  useEffect(() => {
    const handleConnect = (...args: unknown[]) => {
      console.log('✅ Socket connected via context');
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionStatus('connected');
      setLastConnected(new Date());
      setReconnectAttempts(0);
      setError(null);
    };

    const handleDisconnect = (...args: unknown[]) => {
      const reason = args[0] as string;
      console.log('❌ Socket disconnected via context:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Check if this is a reconnection attempt
      if (reason === 'transport close' || reason === 'ping timeout') {
        setIsReconnecting(true);
        setConnectionStatus('reconnecting');
      }
    };

    const handleConnectError = (...args: unknown[]) => {
      const error = args[0] as Error;
      console.error('❌ Socket connection error via context:', error);
      setError(error.message);
      setConnectionStatus('disconnected');
      setIsReconnecting(false);
    };

    const handleReconnect = (...args: unknown[]) => {
      const attemptNumber = args[0] as number;
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setReconnectAttempts(attemptNumber);
      setIsReconnecting(false);
    };

    const handleReconnecting = (...args: unknown[]) => {
      const attemptNumber = args[0] as number;
      console.log(`🔄 Socket reconnecting, attempt ${attemptNumber}`);
      setReconnectAttempts(attemptNumber);
      setIsReconnecting(true);
      setConnectionStatus('reconnecting');
    };

    const handleReconnectError = (...args: unknown[]) => {
      const error = args[0] as Error;
      console.error('❌ Socket reconnection error via context:', error);
      setError(error.message);
      setIsReconnecting(false);
    };

    // Register event listeners with proper type casting
    socketService.on('connect', handleConnect as (...args: unknown[]) => void);
    socketService.on('disconnect', handleDisconnect as (...args: unknown[]) => void);
    socketService.on('connect_error', handleConnectError as (...args: unknown[]) => void);
    socketService.on('reconnect', handleReconnect as (...args: unknown[]) => void);
    socketService.on('reconnecting', handleReconnecting as (...args: unknown[]) => void);
    socketService.on('reconnect_error', handleReconnectError as (...args: unknown[]) => void);

    // Cleanup event listeners
    return () => {
      socketService.off('connect', handleConnect as (...args: unknown[]) => void);
      socketService.off('disconnect', handleDisconnect as (...args: unknown[]) => void);
      socketService.off('connect_error', handleConnectError as (...args: unknown[]) => void);
      socketService.off('reconnect', handleReconnect as (...args: unknown[]) => void);
      socketService.off('reconnecting', handleReconnecting as (...args: unknown[]) => void);
      socketService.off('reconnect_error', handleReconnectError as (...args: unknown[]) => void);
    };
  }, []);

  // Monitor network status changes and flush queue when back online
  useEffect(() => {
    if (networkStatus.isOnline && isConnected) {
      // Flush message queue when back online and connected
      const flushQueue = async () => {
        try {
          await messageQueue.flush(async (message) => {
            try {
              socketService.sendMessage(message.type, message.payload);
              return true; // Success
            } catch (error) {
              console.error('Failed to send message:', error);
              return false; // Failed
            }
          });
          console.log('✅ Message queue flushed successfully');
        } catch (error) {
          console.error('❌ Failed to flush message queue:', error);
        }
      };
      
      flushQueue();
    }
  }, [networkStatus.isOnline, isConnected]);

  // Update offline queue status periodically
  useEffect(() => {
    const updateOfflineQueue = () => {
      // We can remove queueStatus if not needed for display
      setOfflineQueue([]); // We'll update this to show actual queue items if needed
    };

    const interval = setInterval(updateOfflineQueue, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Context value
  const contextValue: SocketContextType = {
    socket: socketService.isConnected() ? socketService.getSocket() : null,
    isConnected,
    isReconnecting,
    connectionStatus,
    lastConnected,
    reconnectAttempts,
    error,
    offlineQueue,
    networkStatus: networkStatus.isOnline ? 'online' : 'offline',
    connectionQuality: networkStatus.quality === 'unknown' ? 'fair' : networkStatus.quality,
    joinRoom: (roomId: string) => {
      socketService.joinRoom(roomId);
    },
    leaveRoom: (roomId: string) => {
      socketService.leaveRoom(roomId);
    },
    sendMessage: (event: string, data: unknown) => {
      if (networkStatus.isOnline && isConnected) {
        socketService.sendMessage(event, data);
      } else {
        // Queue message for later when back online
        messageQueue.enqueue('chat_message', { event, data }, 'normal');
      }
    },
    subscribe: (event: string, callback: SocketEventCallback) => {
      socketService.on(event, callback);
    },
    unsubscribe: (event: string, callback: SocketEventCallback) => {
      socketService.off(event, callback);
    },
    // Add network status and additional properties
    getNetworkStatus: () => networkStatus,
    getQueueStatus: () => messageQueue.getStatus(),
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocketContext = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
