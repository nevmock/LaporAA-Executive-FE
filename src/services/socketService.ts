// Socket Service - Core Socket.IO Operations
// Generated: July 3, 2025

import { io, Socket } from 'socket.io-client';
import { 
  ConnectionConfig, 
  SocketEvent, 
  QueuedMessage, 
  AuthData, 
  ConnectionStats,
  NetworkStatus,
  SocketEventCallback,
  SocketEventHandler
} from '../types/socket.types';
import { eventOptimizer, OptimizedEvent } from './eventOptimizationService';
import { performanceMonitor } from './performanceMonitoringService';

class SocketService {
  private socket: Socket | null = null;
  private offlineQueue: QueuedMessage[] = [];
  private reconnectAttempts: number = 0;
  private lastConnected: Date | null = null;
  private connectionStats: ConnectionStats = {
    connectTime: new Date(),
    reconnectCount: 0,
    lastReconnectTime: null,
    totalDataSent: 0,
    totalDataReceived: 0,
    averageLatency: 0
  };
  private eventListeners: Map<string, SocketEventHandler[]> = new Map();
  private rooms: Set<string> = new Set();
  private networkStatus: NetworkStatus = { online: typeof navigator !== 'undefined' ? navigator.onLine : true };
  private authData: AuthData | null = null;
  private networkMonitoringSetup = false; // Track if network monitoring is setup

  // Default configuration
  private config: ConnectionConfig = {
    timeout: 86400000,        // 24 hours
    pingTimeout: 86400000,    // 24 hours
    pingInterval: 30000,      // 30 seconds
    reconnectionDelay: 1000,  // 1 second
    reconnectionDelayMax: 5000, // 5 seconds
    maxReconnectionAttempts: Infinity,
    randomizationFactor: 0.5,
    autoConnect: true,
    forceNew: false,
    transports: ['websocket', 'polling']
  };

  constructor() {
    // Only start performance monitoring (no window dependencies)
    performanceMonitor.startMonitoring();
  }

  /**
   * Initialize socket connection with authentication
   */
  async connect(apiUrl: string, authData?: AuthData, customConfig?: Partial<ConnectionConfig>): Promise<void> {
    if (this.socket && this.socket.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    // Setup network monitoring on first connect (client-side only)
    if (!this.networkMonitoringSetup) {
      this.setupNetworkMonitoring();
      this.networkMonitoringSetup = true;
    }

    // Merge custom config with defaults
    const finalConfig = { ...this.config, ...customConfig };
    this.authData = authData || null;

    console.log('🔌 Initializing socket connection to:', apiUrl);
    console.log('⚙️ Config:', finalConfig);

    try {
      this.socket = io(apiUrl, {
        timeout: finalConfig.timeout,
        forceNew: finalConfig.forceNew,
        autoConnect: finalConfig.autoConnect,
        reconnection: true,
        reconnectionAttempts: finalConfig.maxReconnectionAttempts,
        reconnectionDelay: finalConfig.reconnectionDelay,
        reconnectionDelayMax: finalConfig.reconnectionDelayMax,
        randomizationFactor: finalConfig.randomizationFactor,
        transports: finalConfig.transports,
        auth: this.authData ? {
          token: this.authData.token,
          userId: this.authData.user.id,
          role: this.authData.user.role,
          sessionId: this.authData.user.sessionId
        } : undefined
      });

      this.setupEventHandlers();
      this.connectionStats.connectTime = new Date();
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      throw error;
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.rooms.clear();
      this.eventListeners.clear();
    }
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Cannot join room: Socket not connected');
      return;
    }

    console.log(`🏠 Joining room: ${roomId}`);
    this.socket.emit('join_room', roomId);
    this.rooms.add(roomId);
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Cannot leave room: Socket not connected');
      return;
    }

    console.log(`🏠 Leaving room: ${roomId}`);
    this.socket.emit('leave_room', roomId);
    this.rooms.delete(roomId);
  }

  /**
   * Send message or event
   */
  sendMessage(event: string, data: unknown): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, queueing message');
      this.queueMessage(event, data);
      return;
    }

    console.log(`📤 Sending event: ${event}`, data);
    this.socket.emit(event, data);
    this.connectionStats.totalDataSent++;
  }

  /**
   * Emit event to server with optimization
   */
  emit(event: string, data?: unknown): void {
    if (this.socket && this.socket.connected) {
      // Create optimized event
      const optimizedEvent: OptimizedEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: event,
        data,
        target: 'global',
        priority: 'normal',
        timestamp: Date.now()
      };

      // Process through event optimizer
      const { shouldEmit, processedEvent } = eventOptimizer.processEvent(optimizedEvent);

      if (shouldEmit && processedEvent) {
        this.socket.emit(processedEvent.type, processedEvent.data);
        this.connectionStats.totalDataSent++;
        performanceMonitor.recordEventSent();
      }
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`);
    }
  }

  /**
   * Subscribe to event with performance tracking
   */
  on(event: string, callback: SocketEventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)?.push(callback);

    if (this.socket) {
      const wrappedCallback = (...args: unknown[]) => {
        // Record event reception
        performanceMonitor.recordEventReceived();
        this.connectionStats.totalDataReceived++;
        
        // Call original callback
        callback(...args);
      };
      
      this.socket.on(event, wrappedCallback);
    }
  }

  /**
   * Unsubscribe from event
   */
  off(event: string, callback?: SocketEventHandler): void {
    if (callback) {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  /**
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return { ...this.connectionStats };
  }

  /**
   * Get offline queue
   */
  getOfflineQueue(): QueuedMessage[] {
    return [...this.offlineQueue];
  }

  /**
   * Get joined rooms
   */
  getRooms(): string[] {
    return Array.from(this.rooms);
  }

  /**
   * Get network status
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Private: Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.lastConnected = new Date();
      this.reconnectAttempts = 0;
      this.processOfflineQueue();
      this.rejoinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.connectionStats.reconnectCount++;
      this.connectionStats.lastReconnectTime = new Date();
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    // Re-register existing event listeners
    this.eventListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback as any);
      });
    });
  }

  /**
   * Private: Queue message for offline processing
   */
  private queueMessage(event: string, data: unknown): void {
    const queuedMessage: QueuedMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      event,
      data,
      timestamp: new Date(),
      retryCount: 0,
      priority: 'medium'
    };

    this.offlineQueue.push(queuedMessage);
    
    // Limit queue size
    if (this.offlineQueue.length > 1000) {
      this.offlineQueue.shift();
    }

    console.log(`📦 Queued message for offline processing: ${event}`);
  }

  /**
   * Private: Process offline queue
   */
  private processOfflineQueue(): void {
    if (this.offlineQueue.length === 0) return;

    console.log(`📤 Processing ${this.offlineQueue.length} queued messages`);
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    queue.forEach((queuedMessage) => {
      this.sendMessage(queuedMessage.event, queuedMessage.data);
    });
  }

  /**
   * Private: Rejoin rooms after reconnection
   */
  private rejoinRooms(): void {
    this.rooms.forEach(roomId => {
      this.joinRoom(roomId);
    });
  }

  /**
   * Private: Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Only setup network monitoring on client side
    if (typeof window === 'undefined') return;
    
    // Basic online/offline detection
    window.addEventListener('online', () => {
      console.log('🌐 Network: Online');
      this.networkStatus.online = true;
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network: Offline');
      this.networkStatus.online = false;
    });

    // Network Information API (if available)
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkInfo = () => {
        this.networkStatus = {
          online: navigator.onLine,
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
      };

      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }

    // Visibility API for tab focus
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.socket && !this.socket.connected) {
        console.log('👁️ Tab visible, checking connection...');
        this.socket.connect();
      }
    });
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;
