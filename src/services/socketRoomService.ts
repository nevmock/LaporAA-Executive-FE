import { Socket, Server } from 'socket.io';

export interface RoomConfig {
  name: string;
  type: 'admin' | 'user' | 'chat' | 'global';
  permissions: string[];
  maxMembers?: number;
  isPrivate: boolean;
}

export interface SocketUser {
  id: string;
  userId: string;
  role: 'user' | 'admin' | 'super-admin';
  sessionId: string;
  joinedAt: Date;
  rooms: string[];
}

/**
 * Service for managing Socket.IO rooms and user sessions
 * Features:
 * - Role-based room access
 * - User session tracking
 * - Automatic room cleanup
 * - Event filtering and broadcasting
 */
export class SocketRoomService {
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> socketIds
  private users: Map<string, SocketUser> = new Map(); // socketId -> user
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

  /**
   * Register a user and their socket connection
   */
  registerUser(socket: Socket, userId: string, role: string, sessionId: string): void {
    const socketId = socket.id;
    
    const user: SocketUser = {
      id: socketId,
      userId,
      role: role as SocketUser['role'],
      sessionId,
      joinedAt: new Date(),
      rooms: [],
    };

    this.users.set(socketId, user);
    this.socketToUser.set(socketId, userId);

    // Track user's sockets (users can have multiple connections)
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    // Auto-join appropriate rooms based on role
    this.autoJoinRoleBasedRooms(socket, user);

    console.log(`✅ User registered: ${userId} (${role}) - Socket: ${socketId}`);
  }

  /**
   * Unregister a user when they disconnect
   */
  unregisterUser(socketId: string): void {
    const user = this.users.get(socketId);
    if (!user) return;

    // Remove from all rooms
    for (const roomId of user.rooms) {
      this.leaveRoom(socketId, roomId, false);
    }

    // Clean up tracking maps
    this.users.delete(socketId);
    this.socketToUser.delete(socketId);
    
    const userSockets = this.userSockets.get(user.userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userSockets.delete(user.userId);
      }
    }

    console.log(`✅ User unregistered: ${user.userId} - Socket: ${socketId}`);
  }

  /**
   * Join a room with permission checks
   */
  joinRoom(socketId: string, roomId: string, checkPermissions = true): boolean {
    const user = this.users.get(socketId);
    if (!user) {
      console.warn(`❌ User not found for socket: ${socketId}`);
      return false;
    }

    // Check permissions if required
    if (checkPermissions && !this.canJoinRoom(user, roomId)) {
      console.warn(`❌ User ${user.userId} not authorized to join room: ${roomId}`);
      return false;
    }

    // Initialize room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    // Add socket to room
    const room = this.rooms.get(roomId)!;
    room.add(socketId);
    user.rooms.push(roomId);

    console.log(`✅ User ${user.userId} joined room: ${roomId}`);
    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(socketId: string, roomId: string, notify = true): boolean {
    const user = this.users.get(socketId);
    if (!user) return false;

    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Remove socket from room
    room.delete(socketId);
    
    // Remove room from user's list
    const roomIndex = user.rooms.indexOf(roomId);
    if (roomIndex !== -1) {
      user.rooms.splice(roomIndex, 1);
    }

    // Clean up empty rooms
    if (room.size === 0) {
      this.rooms.delete(roomId);
    }

    if (notify) {
      console.log(`✅ User ${user.userId} left room: ${roomId}`);
    }
    
    return true;
  }

  /**
   * Get all users in a room
   */
  getRoomUsers(roomId: string): SocketUser[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room)
      .map(socketId => this.users.get(socketId))
      .filter(user => user !== undefined) as SocketUser[];
  }

  /**
   * Get all rooms a user is in
   */
  getUserRooms(userId: string): string[] {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds) return [];

    const rooms = new Set<string>();
    for (const socketId of socketIds) {
      const user = this.users.get(socketId);
      if (user) {
        user.rooms.forEach(room => rooms.add(room));
      }
    }

    return Array.from(rooms);
  }

  /**
   * Broadcast event to a room with filtering
   */
  broadcastToRoom(
    io: Server,
    roomId: string,
    event: string,
    data: unknown,
    excludeSocketId?: string,
    filterFn?: (user: SocketUser) => boolean
  ): number {
    const room = this.rooms.get(roomId);
    if (!room) return 0;

    let sentCount = 0;
    for (const socketId of room) {
      if (socketId === excludeSocketId) continue;

      const user = this.users.get(socketId);
      if (!user) continue;

      // Apply filter if provided
      if (filterFn && !filterFn(user)) continue;

      io.to(socketId).emit(event, data);
      sentCount++;
    }

    console.log(`📡 Broadcasted ${event} to ${sentCount} users in room: ${roomId}`);
    return sentCount;
  }

  /**
   * Broadcast to all admin users
   */
  broadcastToAdmins(io: Server, event: string, data: unknown, excludeSocketId?: string): number {
    let sentCount = 0;
    
    for (const [socketId, user] of this.users) {
      if (socketId === excludeSocketId) continue;
      if (user.role !== 'admin' && user.role !== 'super-admin') continue;

      io.to(socketId).emit(event, data);
      sentCount++;
    }

    console.log(`📡 Broadcasted ${event} to ${sentCount} admin users`);
    return sentCount;
  }

  /**
   * Get room and user statistics
   */
  getStats() {
    const roomStats = Array.from(this.rooms.entries()).map(([roomId, sockets]) => ({
      roomId,
      userCount: sockets.size,
      users: Array.from(sockets).map(socketId => {
        const user = this.users.get(socketId);
        return user ? { userId: user.userId, role: user.role } : null;
      }).filter(Boolean),
    }));

    const roleStats = Array.from(this.users.values()).reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConnections: this.users.size,
      totalRooms: this.rooms.size,
      totalUsers: this.userSockets.size,
      roleStats,
      roomStats,
    };
  }

  /**
   * Auto-join rooms based on user role
   */
  private autoJoinRoleBasedRooms(socket: Socket, user: SocketUser): void {
    const socketId = socket.id;

    // All users join global room
    this.joinRoom(socketId, 'global', false);

    // Role-specific rooms
    switch (user.role) {
      case 'admin':
      case 'super-admin':
        this.joinRoom(socketId, 'admins', false);
        this.joinRoom(socketId, `admin-${user.userId}`, false);
        break;
        
      case 'user':
        this.joinRoom(socketId, `user-${user.userId}`, false);
        if (user.sessionId) {
          this.joinRoom(socketId, `chat-${user.sessionId}`, false);
        }
        break;
    }
  }

  /**
   * Check if user can join a specific room
   */
  private canJoinRoom(user: SocketUser, roomId: string): boolean {
    // Global room - everyone can join
    if (roomId === 'global') return true;

    // Admin rooms - only admins
    if (roomId === 'admins' || roomId.startsWith('admin-')) {
      return user.role === 'admin' || user.role === 'super-admin';
    }

    // User-specific rooms - only the specific user
    if (roomId.startsWith('user-')) {
      const targetUserId = roomId.substring(5);
      return user.userId === targetUserId;
    }

    // Chat rooms - user can join their own chat sessions
    if (roomId.startsWith('chat-')) {
      const chatSessionId = roomId.substring(5);
      return user.sessionId === chatSessionId || user.role === 'admin' || user.role === 'super-admin';
    }

    // Default: allow join (you can customize this logic)
    return true;
  }

  /**
   * Clean up inactive sessions (call periodically)
   */
  cleanupInactiveSessions(maxAgeMinutes = 60): number {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [socketId, user] of this.users) {
      if (user.joinedAt < cutoffTime) {
        this.unregisterUser(socketId);
        cleanedCount++;
      }
    }

    console.log(`🧹 Cleaned up ${cleanedCount} inactive sessions`);
    return cleanedCount;
  }
}

// Global room service instance
export const roomService = new SocketRoomService();

export default SocketRoomService;
