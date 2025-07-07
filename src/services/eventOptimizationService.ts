// Event Optimization Service - Selective Event Filtering & Performance
// Generated: July 4, 2025

export interface EventFilter {
  eventType: string;
  rooms: string[];
  roles: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  rateLimit?: number; // events per second
  batchable?: boolean;
}

export interface OptimizedEvent {
  id: string;
  type: string;
  data: unknown;
  target: 'global' | 'room' | 'user';
  rooms?: string[];
  userId?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: number;
  batchId?: string;
}

export interface EventBatch {
  id: string;
  events: OptimizedEvent[];
  targetRooms: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: number;
  flushAt: number;
}

/**
 * Service for optimizing socket events and reducing server load
 * Features:
 * - Event filtering by role and room
 * - Event batching for non-critical updates
 * - Rate limiting for high-frequency events
 * - Priority-based event processing
 * - Redundant event elimination
 */
export class EventOptimizationService {
  private eventFilters: Map<string, EventFilter> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();
  private pendingBatches: Map<string, EventBatch> = new Map();
  private processedEvents: Set<string> = new Set(); // For deduplication
  private batchTimeout: number = 100; // 100ms batch window
  private maxBatchSize: number = 10;

  constructor() {
    this.setupDefaultFilters();
    this.startBatchProcessor();
  }

  /**
   * Setup default event filters for common events
   */
  private setupDefaultFilters(): void {
    // High-priority events - immediate delivery
    this.addEventFilter('newMessage', {
      eventType: 'newMessage',
      rooms: ['global', 'admins'],
      roles: ['admin', 'super-admin'],
      priority: 'high',
      rateLimit: 10, // 10 messages per second max
      batchable: false
    });

    this.addEventFilter('systemAlert', {
      eventType: 'systemAlert',
      rooms: ['global'],
      roles: ['admin', 'super-admin', 'user'],
      priority: 'critical',
      batchable: false
    });

    this.addEventFilter('reportStatusUpdate', {
      eventType: 'reportStatusUpdate',
      rooms: ['admins', 'global'],
      roles: ['admin', 'super-admin'],
      priority: 'high',
      batchable: false
    });

    // Medium-priority events - can be batched
    this.addEventFilter('dashboardUpdate', {
      eventType: 'dashboardUpdate',
      rooms: ['admins'],
      roles: ['admin', 'super-admin'],
      priority: 'normal',
      rateLimit: 5, // 5 updates per second
      batchable: true
    });

    this.addEventFilter('liveStatsUpdate', {
      eventType: 'liveStatsUpdate',
      rooms: ['admins'],
      roles: ['admin', 'super-admin'],
      priority: 'normal',
      rateLimit: 2, // 2 updates per second
      batchable: true
    });

    // Low-priority events - heavily batched
    this.addEventFilter('userActivity', {
      eventType: 'userActivity',
      rooms: ['admins'],
      roles: ['admin', 'super-admin'],
      priority: 'low',
      rateLimit: 1, // 1 update per second
      batchable: true
    });

    this.addEventFilter('performanceMetrics', {
      eventType: 'performanceMetrics',
      rooms: ['admins'],
      roles: ['super-admin'],
      priority: 'low',
      rateLimit: 0.5, // 1 update per 2 seconds
      batchable: true
    });
  }

  /**
   * Add or update an event filter
   */
  addEventFilter(eventType: string, filter: EventFilter): void {
    this.eventFilters.set(eventType, filter);
    console.log(`📋 Event filter added: ${eventType}`);
  }

  /**
   * Process and optimize an event before emission
   */
  processEvent(event: OptimizedEvent): { shouldEmit: boolean; processedEvent?: OptimizedEvent } {
    const filter = this.eventFilters.get(event.type);
    
    // If no filter exists, allow the event with normal priority
    if (!filter) {
      return { shouldEmit: true, processedEvent: event };
    }

    // Check rate limiting
    if (!this.checkRateLimit(event.type, filter.rateLimit)) {
      console.log(`⚠️ Rate limit exceeded for event: ${event.type}`);
      return { shouldEmit: false };
    }

    // Check for duplicate events (deduplication)
    const eventKey = this.generateEventKey(event);
    if (this.processedEvents.has(eventKey)) {
      console.log(`🔄 Duplicate event filtered: ${event.type}`);
      return { shouldEmit: false };
    }

    // Add to processed events (cleanup after 5 seconds)
    this.processedEvents.add(eventKey);
    setTimeout(() => this.processedEvents.delete(eventKey), 5000);

    // Apply filter and set priority
    const processedEvent: OptimizedEvent = {
      ...event,
      priority: filter.priority,
      rooms: this.filterRooms(event.rooms || [], filter.rooms)
    };

    // Handle batching for non-critical events
    if (filter.batchable && filter.priority !== 'critical' && filter.priority !== 'high') {
      this.addToBatch(processedEvent);
      return { shouldEmit: false }; // Will be emitted in batch
    }

    return { shouldEmit: true, processedEvent };
  }

  /**
   * Check rate limiting for an event type
   */
  private checkRateLimit(eventType: string, limit?: number): boolean {
    if (!limit) return true;

    const now = Date.now();
    const key = eventType;
    const rateLimiter = this.rateLimiters.get(key);

    if (!rateLimiter || now >= rateLimiter.resetTime) {
      // Reset or initialize rate limiter
      this.rateLimiters.set(key, { count: 1, resetTime: now + 1000 });
      return true;
    }

    if (rateLimiter.count >= limit) {
      return false; // Rate limit exceeded
    }

    rateLimiter.count++;
    return true;
  }

  /**
   * Filter rooms based on event filter configuration
   */
  private filterRooms(eventRooms: string[], filterRooms: string[]): string[] {
    if (filterRooms.length === 0) return eventRooms;
    return eventRooms.filter(room => filterRooms.includes(room));
  }

  /**
   * Generate a unique key for event deduplication
   */
  private generateEventKey(event: OptimizedEvent): string {
    // Create a hash-like key based on event type, target, and essential data
    const dataKey = typeof event.data === 'object' 
      ? JSON.stringify(event.data).substring(0, 100) 
      : String(event.data);
    
    return `${event.type}-${event.target}-${event.userId || 'global'}-${dataKey}`;
  }

  /**
   * Add event to batch for later processing
   */
  private addToBatch(event: OptimizedEvent): void {
    const batchKey = this.getBatchKey(event);
    let batch = this.pendingBatches.get(batchKey);

    if (!batch) {
      batch = {
        id: batchKey,
        events: [],
        targetRooms: event.rooms || [],
        priority: event.priority,
        createdAt: Date.now(),
        flushAt: Date.now() + this.batchTimeout
      };
      this.pendingBatches.set(batchKey, batch);
    }

    batch.events.push(event);

    // If batch is full, flush immediately
    if (batch.events.length >= this.maxBatchSize) {
      this.flushBatch(batchKey);
    }
  }

  /**
   * Get batch key for grouping similar events
   */
  private getBatchKey(event: OptimizedEvent): string {
    const roomsKey = (event.rooms || []).sort().join(',');
    return `${event.type}-${event.priority}-${roomsKey}`;
  }

  /**
   * Start the batch processor timer
   */
  private startBatchProcessor(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [batchKey, batch] of this.pendingBatches) {
        if (now >= batch.flushAt) {
          this.flushBatch(batchKey);
        }
      }
    }, 50); // Check every 50ms
  }

  /**
   * Flush a batch of events
   */
  private flushBatch(batchKey: string): void {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch || batch.events.length === 0) return;

    console.log(`📦 Flushing batch: ${batchKey} with ${batch.events.length} events`);

    // Create a combined batch event
    const batchEvent: OptimizedEvent = {
      id: `batch-${batch.id}`,
      type: 'eventBatch',
      data: {
        batchId: batch.id,
        events: batch.events,
        count: batch.events.length,
        originalTypes: [...new Set(batch.events.map(e => e.type))]
      },
      target: 'room',
      rooms: batch.targetRooms,
      priority: batch.priority,
      timestamp: Date.now(),
      batchId: batch.id
    };

    // Emit the batch (this would be handled by the socket service)
    this.emitBatchEvent(batchEvent);

    // Remove the batch
    this.pendingBatches.delete(batchKey);
  }

  /**
   * Emit a batch event (placeholder for actual emission)
   */
  private emitBatchEvent(batchEvent: OptimizedEvent): void {
    // This would be implemented by the socket service
    console.log(`📡 Batch event ready for emission:`, {
      type: batchEvent.type,
      eventCount: (batchEvent.data as { count?: number })?.count || 0,
      rooms: batchEvent.rooms,
      priority: batchEvent.priority
    });
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const activeBatches = this.pendingBatches.size;
    const totalPendingEvents = Array.from(this.pendingBatches.values())
      .reduce((sum, batch) => sum + batch.events.length, 0);

    return {
      activeFilters: this.eventFilters.size,
      activeBatches,
      totalPendingEvents,
      processedEventsCount: this.processedEvents.size,
      rateLimitersActive: this.rateLimiters.size,
      optimizationRatio: this.calculateOptimizationRatio()
    };
  }

  /**
   * Calculate optimization ratio (how much we're reducing event load)
   */
  private calculateOptimizationRatio(): number {
    // This would track actual optimization metrics in a real implementation
    return 0.35; // Placeholder: 35% reduction in events
  }

  /**
   * Clean up expired rate limiters
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, limiter] of this.rateLimiters) {
      if (now >= limiter.resetTime) {
        this.rateLimiters.delete(key);
      }
    }
  }
}

// Global instance
export const eventOptimizer = new EventOptimizationService();

export default EventOptimizationService;
