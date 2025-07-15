// useAuthSocket Hook - Authentication Integration for Socket
// Generated: July 3, 2025

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { AuthData } from '../types/socket.types';

interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: 'user' | 'admin' | 'super-admin';
  sessionId?: string;
  token?: string;
}

interface UseAuthSocketOptions {
  autoConnect?: boolean;
  autoJoinUserRoom?: boolean;
  autoJoinRoleRoom?: boolean;
}

interface UseAuthSocketReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSocketReady: boolean;
  connectWithAuth: (authData: AuthData) => void;
  disconnectSocket: () => void;
  updateAuthData: (authData: AuthData) => void;
  socket: ReturnType<typeof useSocket>;
}

/**
 * Hook for authentication-based socket connection
 */
export const useAuthSocket = (options: UseAuthSocketOptions = {}): UseAuthSocketReturn => {
  const {
    // autoConnect = true, // Currently unused
    autoJoinUserRoom = true,
    autoJoinRoleRoom = true
  } = options;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [authDataState, setAuthDataState] = useState<AuthData | null>(null);

  const socket = useSocket();

  // Check for existing authentication
  useEffect(() => {
    const checkAuth = () => {
      // Only check on client side
      if (typeof window === 'undefined') return;
      
      // Check localStorage for auth data
      const storedAuth = localStorage.getItem('authData');
      const storedUser = localStorage.getItem('user');
      
      if (storedAuth && storedUser) {
        try {
          const parsedAuth = JSON.parse(storedAuth);
          const parsedUser = JSON.parse(storedUser);
          
          // Check if token is still valid
          if (new Date(parsedAuth.expiresAt) > new Date()) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            setAuthDataState(parsedAuth);
          } else {
            // Token expired, clear storage
            localStorage.removeItem('authData');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }
    };

    checkAuth();
  }, []);

  // Auto-join rooms based on user data
  useEffect(() => {
    if (socket.isConnected && user && isAuthenticated) {
      const roomsToJoin = [];

      if (autoJoinUserRoom) {
        roomsToJoin.push(`user_${user.id}`);
      }

      if (autoJoinRoleRoom) {
        roomsToJoin.push(user.role === 'admin' || user.role === 'super-admin' ? 'admin' : 'users');
      }

      // Join specific role rooms
      if (user.role === 'super-admin') {
        roomsToJoin.push('super-admin');
      }

      if (roomsToJoin.length > 0) {
        socket.joinRooms(roomsToJoin);
        console.log(`🏠 Auto-joined rooms: ${roomsToJoin.join(', ')}`);
      }
    }
  }, [socket.isConnected, user, isAuthenticated, autoJoinUserRoom, autoJoinRoleRoom, socket]); // Added missing dependency

  // Connect with authentication
  const connectWithAuth = useCallback((newAuthData: AuthData) => {
    setAuthDataState(newAuthData);
    setUser(newAuthData.user);
    setIsAuthenticated(true);

    // Store in localStorage (client-side only)
    if (typeof window !== 'undefined') {
      localStorage.setItem('authData', JSON.stringify(newAuthData));
      localStorage.setItem('user', JSON.stringify(newAuthData.user));
    }

    console.log('🔐 Authentication data updated for socket connection');
  }, []);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    socket.leaveRooms(socket.getCurrentRooms());
    setUser(null);
    setIsAuthenticated(false);
    setAuthDataState(null);

    // Clear localStorage (client-side only)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authData');
      localStorage.removeItem('user');
    }

    console.log('🔌 Socket disconnected and auth cleared');
  }, [socket]);

  // Update authentication data
  const updateAuthData = useCallback((newAuthData: AuthData) => {
    setAuthDataState(newAuthData);
    setUser(newAuthData.user);
    
    // Update localStorage
    localStorage.setItem('authData', JSON.stringify(newAuthData));
    localStorage.setItem('user', JSON.stringify(newAuthData.user));

    console.log('🔄 Authentication data updated');
  }, []);

  // Monitor authentication status
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authData' && !e.newValue) {
        // Auth data removed from another tab
        disconnectSocket();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [disconnectSocket]);

  return {
    user,
    isAuthenticated,
    isSocketReady: socket.isConnected && isAuthenticated,
    connectWithAuth,
    disconnectSocket,
    updateAuthData,
    socket
  };
};

export default useAuthSocket;
