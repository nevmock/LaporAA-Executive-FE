// Socket.IO Global Architecture - Type Definitions
// Generated: July 3, 2025

// Callback types for socket events
export type SocketEventCallback<T = unknown> = (data: T) => void;
export type SocketEventHandler = (...args: unknown[]) => void;

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (event: string, data: unknown) => void;
  subscribe: (event: string, callback: SocketEventCallback) => void;
  unsubscribe: (event: string, callback: SocketEventCallback) => void;
  reconnect: () => Promise<void>;
  offlineQueue: QueuedMessage[];
  networkStatus: 'online' | 'offline';
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  getNetworkStatus: () => NetworkStatusHook;
  getQueueStatus: () => QueueStatus;
}

export interface QueuedMessage {
  id: string;
  event: string;
  data: unknown;
  timestamp: Date;
  retryCount: number;
  priority: 'low' | 'medium' | 'high';
}

export interface QueueStatus {
  totalMessages: number;
  isProcessing: boolean;
  priorityCounts: Record<string, number>;
  oldestMessage: number | null;
}

export interface NetworkStatusHook {
  isOnline: boolean;
  connectionType: 'unknown' | 'ethernet' | 'wifi' | 'cellular' | 'bluetooth';
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  isSlowConnection: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

export interface SocketEvent {
  type: string;
  room?: string;
  userId?: string;
  adminId?: string;
  data: unknown;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface User {
  id: string;
  name: string;
  role: 'user' | 'admin' | 'super-admin';
  email?: string;
  sessionId?: string;
}

export interface AuthData {
  token: string;
  user: User;
  expiresAt: Date;
}

export interface ConnectionConfig {
  timeout: number;
  pingTimeout: number;
  pingInterval: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  maxReconnectionAttempts: number;
  randomizationFactor: number;
  autoConnect: boolean;
  forceNew: boolean;
  transports: string[];
}

export interface RoomConfig {
  chat: string;
  admin: string;
  dashboard: string;
  global: string;
  broadcast: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  userId?: string;
  adminId?: string;
  priority: 'low' | 'medium' | 'high';
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  url?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface NetworkStatus {
  online: boolean;
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

export interface ConnectionStats {
  connectTime: Date;
  reconnectCount: number;
  lastReconnectTime: Date | null;
  totalDataSent: number;
  totalDataReceived: number;
  averageLatency: number;
}

// Socket.IO type imports
import { Socket } from 'socket.io-client';

// Re-export Socket type for convenience
export { Socket };
