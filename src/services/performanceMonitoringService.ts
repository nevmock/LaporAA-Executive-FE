// Performance Monitoring Service - Testing & Debugging
// Generated: July 4, 2025

export interface PerformanceMetrics {
  connectionCount: number;
  eventsSentPerSecond: number;
  eventsReceivedPerSecond: number;
  averageLatency: number;
  memoryUsage: number;
  reconnectionRate: number;
  errorRate: number;
  lastUpdated: number;
}

export interface ConnectionTest {
  id: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  latency?: number;
  error?: string;
}

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  socketConnections: number;
  eventListeners: number;
}

/**
 * Service for monitoring Socket.IO performance and detecting issues
 * Features:
 * - Real-time performance metrics
 * - Memory leak detection
 * - Connection stability testing
 * - Event delivery verification
 * - Load testing simulation
 */
export class PerformanceMonitoringService {
  private metrics: PerformanceMetrics = {
    connectionCount: 0,
    eventsSentPerSecond: 0,
    eventsReceivedPerSecond: 0,
    averageLatency: 0,
    memoryUsage: 0,
    reconnectionRate: 0,
    errorRate: 0,
    lastUpdated: Date.now()
  };

  private connectionTests: Map<string, ConnectionTest> = new Map();
  private memorySnapshots: MemorySnapshot[] = [];
  private eventCounters = {
    sent: 0,
    received: 0,
    errors: 0,
    lastReset: Date.now()
  };
  private latencyMeasurements: number[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 Performance monitoring started');

    // Reset counters
    this.resetCounters();

    // Start monitoring intervals
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.takeMemorySnapshot();
    }, 1000); // Update every second
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Record a sent event
   */
  recordEventSent(): void {
    this.eventCounters.sent++;
  }

  /**
   * Record a received event
   */
  recordEventReceived(): void {
    this.eventCounters.received++;
  }

  /**
   * Record an error
   */
  recordError(error: string): void {
    this.eventCounters.errors++;
    console.error('🔴 Socket error recorded:', error);
  }

  /**
   * Record latency measurement
   */
  recordLatency(latency: number): void {
    this.latencyMeasurements.push(latency);
    
    // Keep only last 100 measurements
    if (this.latencyMeasurements.length > 100) {
      this.latencyMeasurements.shift();
    }
  }

  /**
   * Start a connection test
   */
  startConnectionTest(): string {
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const test: ConnectionTest = {
      id: testId,
      startTime: Date.now(),
      success: false
    };

    this.connectionTests.set(testId, test);
    return testId;
  }

  /**
   * Complete a connection test
   */
  completeConnectionTest(testId: string, success: boolean, error?: string): void {
    const test = this.connectionTests.get(testId);
    if (!test) return;

    test.endTime = Date.now();
    test.success = success;
    test.latency = test.endTime - test.startTime;
    
    if (error) {
      test.error = error;
    }

    // Record latency if successful
    if (success && test.latency) {
      this.recordLatency(test.latency);
    }

    console.log(`🧪 Connection test ${testId}: ${success ? 'PASS' : 'FAIL'} (${test.latency}ms)`);
  }

  /**
   * Simulate load testing
   */
  async simulateLoad(connectionCount: number, duration: number): Promise<void> {
    console.log(`🔄 Starting load test: ${connectionCount} connections for ${duration}ms`);
    
    const testConnections: string[] = [];
    
    // Start multiple connection tests
    for (let i = 0; i < connectionCount; i++) {
      const testId = this.startConnectionTest();
      testConnections.push(testId);
      
      // Simulate connection delay
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95% success rate
        this.completeConnectionTest(testId, success, success ? undefined : 'Simulated failure');
      }, Math.random() * 1000);
    }

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, duration));

    // Calculate results
    const completedTests = testConnections
      .map(id => this.connectionTests.get(id))
      .filter(test => test && test.endTime);

    const successfulTests = completedTests.filter(test => test!.success);
    const successRate = (successfulTests.length / completedTests.length) * 100;
    const avgLatency = successfulTests.reduce((sum, test) => sum + (test!.latency || 0), 0) / successfulTests.length;

    console.log(`✅ Load test completed: ${successRate.toFixed(1)}% success rate, ${avgLatency.toFixed(0)}ms avg latency`);

    // Clean up test data
    testConnections.forEach(id => this.connectionTests.delete(id));
  }

  /**
   * Check for memory leaks
   */
  detectMemoryLeaks(): { hasLeak: boolean; trend: 'increasing' | 'stable' | 'decreasing'; details: string } {
    if (this.memorySnapshots.length < 10) {
      return { hasLeak: false, trend: 'stable', details: 'Insufficient data for analysis' };
    }

    const recentSnapshots = this.memorySnapshots.slice(-10);
    const oldSnapshots = this.memorySnapshots.slice(-20, -10);

    const recentAvg = recentSnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / recentSnapshots.length;
    const oldAvg = oldSnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / oldSnapshots.length;

    const difference = recentAvg - oldAvg;
    const percentageIncrease = (difference / oldAvg) * 100;

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (difference > 0) trend = 'increasing';
    else if (difference < 0) trend = 'decreasing';

    const hasLeak = percentageIncrease > 10; // More than 10% increase suggests a leak

    return {
      hasLeak,
      trend,
      details: `Memory usage ${trend} by ${Math.abs(percentageIncrease).toFixed(1)}% over last 10 measurements`
    };
  }

  /**
   * Verify event delivery
   */
  async verifyEventDelivery(testEvent: { type: string; data: unknown }, timeout = 5000): Promise<{ delivered: boolean; latency?: number }> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const timeoutHandle = setTimeout(() => {
        resolve({ delivered: false });
      }, timeout);

      // Simulate event delivery check (in real implementation, this would use actual socket events)
      const deliveryCheck = () => {
        const delivered = Math.random() > 0.1; // 90% delivery success rate
        if (delivered) {
          clearTimeout(timeoutHandle);
          const latency = Date.now() - startTime;
          resolve({ delivered: true, latency });
        } else {
          setTimeout(deliveryCheck, 100);
        }
      };

      deliveryCheck();
    });
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const now = Date.now();
    const timeDiff = (now - this.eventCounters.lastReset) / 1000; // Convert to seconds

    this.metrics = {
      connectionCount: this.getConnectionCount(),
      eventsSentPerSecond: this.eventCounters.sent / timeDiff,
      eventsReceivedPerSecond: this.eventCounters.received / timeDiff,
      averageLatency: this.calculateAverageLatency(),
      memoryUsage: this.getCurrentMemoryUsage(),
      reconnectionRate: this.calculateReconnectionRate(),
      errorRate: this.eventCounters.errors / timeDiff,
      lastUpdated: now
    };

    // Reset counters every minute
    if (timeDiff >= 60) {
      this.resetCounters();
    }
  }

  /**
   * Take a memory snapshot
   */
  private takeMemorySnapshot(): void {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: this.getCurrentMemoryUsage(),
      heapTotal: this.getTotalMemory(),
      external: 0, // Would be populated in Node.js environment
      arrayBuffers: 0, // Would be populated in Node.js environment
      socketConnections: this.getConnectionCount(),
      eventListeners: this.getEventListenerCount()
    };

    this.memorySnapshots.push(snapshot);

    // Keep only last 100 snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots.shift();
    }
  }

  /**
   * Reset event counters
   */
  private resetCounters(): void {
    this.eventCounters = {
      sent: 0,
      received: 0,
      errors: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Calculate average latency
   */
  private calculateAverageLatency(): number {
    if (this.latencyMeasurements.length === 0) return 0;
    return this.latencyMeasurements.reduce((sum, lat) => sum + lat, 0) / this.latencyMeasurements.length;
  }

  /**
   * Get current memory usage (simplified for browser)
   */
  private getCurrentMemoryUsage(): number {
    // Check if the browser supports memory API
    const performanceWithMemory = performance as Performance & { 
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } 
    };
    if (typeof performanceWithMemory.memory !== 'undefined') {
      return performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Get total memory (simplified for browser)
   */
  private getTotalMemory(): number {
    // Check if the browser supports memory API
    const performanceWithMemory = performance as Performance & { 
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } 
    };
    if (typeof performanceWithMemory.memory !== 'undefined') {
      return performanceWithMemory.memory.totalJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Get connection count (would be implemented by socket service)
   */
  private getConnectionCount(): number {
    // Placeholder - would be provided by socket service
    return 1;
  }

  /**
   * Calculate reconnection rate
   */
  private calculateReconnectionRate(): number {
    // Placeholder - would track actual reconnections
    return 0;
  }

  /**
   * Get event listener count
   */
  private getEventListenerCount(): number {
    // Placeholder - would count actual event listeners
    return 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get memory snapshots
   */
  getMemorySnapshots(): MemorySnapshot[] {
    return [...this.memorySnapshots];
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const metrics = this.getMetrics();
    const memoryLeak = this.detectMemoryLeaks();

    return `
📊 Socket.IO Performance Report
==============================

Connections: ${metrics.connectionCount}
Events/sec: ↑${metrics.eventsSentPerSecond.toFixed(1)} ↓${metrics.eventsReceivedPerSecond.toFixed(1)}
Latency: ${metrics.averageLatency.toFixed(0)}ms avg
Memory: ${metrics.memoryUsage.toFixed(1)}MB
Errors/sec: ${metrics.errorRate.toFixed(2)}

Memory Status: ${memoryLeak.hasLeak ? '⚠️  LEAK DETECTED' : '✅ Stable'}
Trend: ${memoryLeak.trend} (${memoryLeak.details})

Last Updated: ${new Date(metrics.lastUpdated).toLocaleTimeString()}
    `.trim();
  }

  /**
   * Export performance data for analysis
   */
  exportData() {
    return {
      metrics: this.getMetrics(),
      memorySnapshots: this.getMemorySnapshots(),
      connectionTests: Array.from(this.connectionTests.values()),
      memoryLeakAnalysis: this.detectMemoryLeaks()
    };
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitoringService();

export default PerformanceMonitoringService;
