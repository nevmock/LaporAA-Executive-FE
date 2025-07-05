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
  private lastApiUrl: string | null = null; // Store last API URL for reconnection
  private healthCheckInterval: NodeJS.Timeout | null = null; // Background health check
  private reconnectionBackoffTimer: NodeJS.Timeout | null = null; // Reconnection timer
  private isManuallyDisconnected = false; // Track if user manually disconnected

  // Default configuration
  private config: ConnectionConfig = {
    timeout: 20000,           // 20 seconds
    pingTimeout: 60000,       // 60 seconds  
    pingInterval: 25000,      // 25 seconds
    reconnectionDelay: 1000,  // 1 second
    reconnectionDelayMax: 10000, // 10 seconds max delay
    maxReconnectionAttempts: Infinity, // Unlimited attempts 
    randomizationFactor: 0.5,
    autoConnect: true,
    forceNew: false,
    transports: ['websocket', 'polling'] // Keep both transports
  };

  constructor() {
    // Only start performance monitoring (no window dependencies)
    performanceMonitor.startMonitoring();
    
    // Setup browser extension error handling
    this.setupBrowserExtensionErrorHandling();
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
    this.lastApiUrl = apiUrl; // Store for reconnection

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
        // Enhanced connection options for stability
        upgrade: true,
        rememberUpgrade: true,
        withCredentials: false,
        auth: this.authData ? {
          token: this.authData.token,
          userId: this.authData.user.id,
          role: this.authData.user.role,
          sessionId: this.authData.user.sessionId
        } : undefined
      });

      this.setupEventHandlers();
      this.connectionStats.connectTime = new Date();
      this.startBackgroundHealthCheck(); // Start monitoring for disconnections
      
      console.log('✅ Socket configuration applied successfully');
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      throw error;
    }
  }

  /**
   * Disconnect socket safely
   */
  disconnect(): void {
    if (!this.socket) return;
    
    try {
      console.log('🔌 Disconnecting socket...');
      
      // Mark as manually disconnected to stop background reconnection
      this.isManuallyDisconnected = true;
      
      // Stop background health monitoring
      this.stopBackgroundHealthCheck();
      
      // Clear any pending reconnection timers
      if (this.reconnectionBackoffTimer) {
        clearTimeout(this.reconnectionBackoffTimer);
        this.reconnectionBackoffTimer = null;
      }
      
      // Remove all event listeners first
      this.eventListeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket?.off(event, callback as any);
        });
      });
      
      // Clear internal state
      this.eventListeners.clear();
      this.rooms.clear();
      
      // Disconnect the socket
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      // Clean up socket reference
      this.socket.removeAllListeners();
      this.socket = null;
      
      console.log('✅ Socket disconnected safely');
    } catch (error) {
      console.debug('Socket disconnect error (safe to ignore during cleanup):', error);
      // Force cleanup even if there's an error
      this.socket = null;
      this.eventListeners.clear();
      this.rooms.clear();
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
   * Check connection health and attempt recovery if needed
   */
  checkConnectionHealth(): boolean {
    if (!this.socket) return false;
    
    const isConnected = this.socket.connected;
    const timeSinceLastConnect = this.lastConnected ? 
      Date.now() - this.lastConnected.getTime() : Infinity;
    
    // If disconnected for more than 1 minute, attempt manual reconnection
    if (!isConnected && timeSinceLastConnect > 60000 && !this.isManuallyDisconnected) {
      console.log('🔄 Connection health check: attempting manual reconnection...');
      this.attemptReconnection();
      return false;
    }
    
    return isConnected;
  }

  /**
   * Start background health monitoring for persistent reconnection
   */
  private startBackgroundHealthCheck(): void {
    // Clear any existing interval
    this.stopBackgroundHealthCheck();
    
    console.log('💚 Starting background health monitoring...');
    
    this.healthCheckInterval = setInterval(() => {
      // Don't check if manually disconnected
      if (this.isManuallyDisconnected) return;
      
      // Only attempt reconnection if we're supposed to be connected but aren't
      if (this.lastApiUrl && (!this.socket || !this.socket.connected)) {
        console.log('🔄 Background health check: Backend might be back online, attempting reconnection...');
        this.attemptBackgroundReconnection();
      }
    }, 10000); // Check every 10 seconds (more frequent)
  }

  /**
   * Stop background health monitoring
   */
  private stopBackgroundHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('💚 Stopped background health monitoring');
    }
  }

  /**
   * Attempt background reconnection with exponential backoff
   */
  private attemptBackgroundReconnection(): void {
    if (this.isManuallyDisconnected) return;
    if (!this.lastApiUrl) return;
    
    // Clear any existing backoff timer
    if (this.reconnectionBackoffTimer) {
      clearTimeout(this.reconnectionBackoffTimer);
    }
    
    // Calculate exponential backoff delay (max 20 seconds)
    const baseDelay = 1000; // 1 second
    const maxDelay = 20000; // 20 seconds (reduced from 30s)
    const backoffDelay = Math.min(maxDelay, baseDelay * Math.pow(1.5, Math.min(this.reconnectAttempts, 6)));
    
    console.log(`🔄 Scheduling background reconnection attempt in ${backoffDelay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectionBackoffTimer = setTimeout(async () => {
      try {
        // Quick health check - try to connect and see if backend responds
        console.log('🔄 Background reconnection: Testing backend availability...');
        
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        
        // Attempt fresh connection
        await this.connect(this.lastApiUrl!, this.authData || undefined);
        
        if (this.isConnected()) {
          console.log('✅ Background reconnection successful! Backend is back online.');
          this.reconnectAttempts = 0; // Reset attempts on success
        }
      } catch (error) {
        console.log(`⚠️ Background reconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        this.reconnectAttempts++;
        
        // Continue background monitoring for next attempt
        if (this.reconnectAttempts < 200) { // Increased limit for better persistence
          this.attemptBackgroundReconnection();
        }
      }
    }, backoffDelay);
  }

  /**
   * Attempt manual reconnection with fallback strategies
   */
  private attemptReconnection(): void {
    if (!this.socket) return;
    
    console.log('🔄 Attempting smart reconnection...');
    
    const strategies = [
      // Strategy 1: Normal reconnection
      () => {
        if (!this.socket?.connected) {
          this.socket?.connect();
        }
      },
      
      // Strategy 2: Force polling (browser extension compatibility)
      () => {
        if (this.socket && !this.socket.connected) {
          console.log('🔄 Switching to polling transport...');
          this.socket.io.opts.transports = ['polling'];
          this.socket.connect();
        }
      },
      
      // Strategy 3: Full reconnection with new instance
      () => {
        console.log('🔄 Creating new socket instance...');
        this.disconnect();
        if (this.lastApiUrl) {
          this.connect(this.lastApiUrl, this.authData || undefined);
        }
      }
    ];
    
    let strategyIndex = 0;
    
    const tryNextStrategy = () => {
      if (strategyIndex < strategies.length && !this.socket?.connected) {
        strategies[strategyIndex]();
        strategyIndex++;
        
        setTimeout(() => {
          if (!this.socket?.connected) {
            tryNextStrategy();
          } else {
            // Success - restore websocket preference
            setTimeout(() => {
              if (this.socket?.connected) {
                this.socket.io.opts.transports = ['websocket', 'polling'];
              }
            }, 5000);
          }
        }, 3000);
      }
    };
    
    tryNextStrategy();
  }

  /**
   * Manual reconnection method for UI/context use
   */
  async reconnect(): Promise<void> {
    if (!this.lastApiUrl) {
      console.warn('⚠️ Cannot reconnect: No previous API URL stored');
      return;
    }

    console.log('🔄 Manual reconnection requested...');
    
    // Reset manual disconnect flag
    this.isManuallyDisconnected = false;
    
    // Disconnect current socket if exists
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    try {
      // Attempt fresh connection
      await this.connect(this.lastApiUrl, this.authData || undefined);
      console.log('✅ Manual reconnection successful');
    } catch (error) {
      console.error('❌ Manual reconnection failed:', error);
      throw error;
    }
  }

  /**
   * Get connection statistics and health info
   */
  getConnectionHealth() {
    return {
      isConnected: this.socket?.connected || false,
      socketId: this.socket?.id || null,
      lastConnected: this.lastConnected,
      reconnectAttempts: this.reconnectAttempts,
      currentRooms: Array.from(this.rooms),
      transportName: this.socket?.io?.engine?.transport?.name || 'unknown',
      connectionStats: this.connectionStats,
      isManuallyDisconnected: this.isManuallyDisconnected,
      hasHealthCheck: this.healthCheckInterval !== null
    };
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
      this.isManuallyDisconnected = false; // Reset manual disconnect flag on successful connection
      this.processOfflineQueue();
      this.rejoinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      
      // Handle different disconnect reasons
      const reasonStr = String(reason);
      switch (reasonStr) {
        case 'transport close':
          console.log('🔄 Transport closed (likely backend restart), will attempt reconnection');
          // This is likely a server restart - not manual disconnect
          this.isManuallyDisconnected = false;
          break;
        case 'ping timeout':
          console.log('🔄 Ping timeout (connection lost), will attempt reconnection');
          this.isManuallyDisconnected = false;
          break;
        case 'transport error':
          console.log('⚠️ Transport error occurred, will attempt reconnection');
          this.isManuallyDisconnected = false;
          break;
        case 'io server disconnect':
          console.log('🔌 Server disconnected the client (likely backend restart)');
          this.isManuallyDisconnected = false;
          break;
        case 'io client disconnect':
          console.log('🔌 Client disconnected manually');
          // Keep manual disconnect flag as-is (set in disconnect() method)
          break;
        case 'client namespace disconnect':
          console.log('🔌 Client disconnected manually');
          // Keep manual disconnect flag as-is
          break;
        default:
          console.log(`🔄 Disconnected: ${reasonStr} - will attempt reconnection`);
          // Assume non-manual disconnect for unknown reasons
          this.isManuallyDisconnected = false;
      }
      
      // Start background health check if not manually disconnected
      if (!this.isManuallyDisconnected) {
        this.startBackgroundHealthCheck();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message || error);
      this.reconnectAttempts++;
      
      // Handle specific connection errors
      if (error.message?.includes('websocket error')) {
        console.log('🔄 WebSocket error detected, falling back to polling...');
        // Force fallback to polling on next connection attempt
        if (this.socket) {
          this.socket.io.opts.transports = ['polling'];
        }
      }
      
      // If too many failed attempts, increase delay
      if (this.reconnectAttempts > 5) {
        console.log('⚠️ Many failed reconnection attempts, increasing delay...');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.connectionStats.reconnectCount++;
      this.connectionStats.lastReconnectTime = new Date();
      
      // Reset transport options after successful reconnection
      if (this.socket) {
        this.socket.io.opts.transports = ['websocket', 'polling'];
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error.message || error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after all attempts');
      console.log('🔄 Switching to background health monitoring for backend restart detection...');
      
      // Don't give up - start background health monitoring
      if (!this.isManuallyDisconnected) {
        this.startBackgroundHealthCheck();
      }
    });

    // Handle WebSocket specific errors
    this.socket.on('error', (error) => {
      console.error('❌ Socket general error:', error);
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

  /**
   * Private: Setup browser extension error handling to prevent "Receiving end does not exist" errors
   */
  private setupBrowserExtensionErrorHandling(): void {
    if (typeof window === 'undefined') return;
    
    // Handle browser extension errors
    window.addEventListener('error', (event) => {
      if (event.error?.message?.includes('Receiving end does not exist')) {
        console.warn('🔧 Browser extension interference detected, switching to polling...');
        if (this.socket) {
          this.socket.io.opts.transports = ['polling'];
          this.attemptReconnection();
        }
      }
    });
    
    // Handle unhandled promise rejections from extensions
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Could not establish connection')) {
        console.warn('🔧 Extension connection error, using fallback...');
        event.preventDefault(); // Prevent error display
        this.queueMessage('connection_error', { reason: 'extension_interference' });
      }
    });
  }

  /**
   * Wrapper for socket operations with timeout and error handling
   */
  async safeEmit(event: string, data: unknown, timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        console.warn('⚠️ Socket not connected for safeEmit');
        resolve(false);
        return;
      }

      // Set timeout to prevent hanging promises
      const timeoutId = setTimeout(() => {
        console.warn(`⚠️ Socket emit timeout for event: ${event}`);
        resolve(false);
      }, timeout);

      try {
        this.socket.emit(event, data, (response: unknown) => {
          clearTimeout(timeoutId);
          resolve(true);
        });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`❌ Socket emit error for event ${event}:`, error);
        resolve(false);
      }
    });
  }

  /**
   * Safe wrapper for event listeners that won't throw on unmounted components
   */
  safeOn(event: string, callback: (...args: unknown[]) => void): void {
    const wrappedCallback = (...args: unknown[]) => {
      try {
        callback(...args);
      } catch (error) {
        if (error instanceof Error && 
            (error.message.includes('Could not establish connection') ||
             error.message.includes('Receiving end does not exist'))) {
          console.debug('🔄 Connection error in event listener (safe to ignore):', error.message);
        } else {
          console.error(`❌ Error in socket event listener for ${event}:`, error);
        }
      }
    };

    this.on(event, wrappedCallback);
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;
