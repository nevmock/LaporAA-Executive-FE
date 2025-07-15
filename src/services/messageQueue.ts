import { v4 as uuidv4 } from 'uuid';

export interface QueuedMessage {
  id: string;
  type: 'chat_message' | 'admin_action' | 'status_update' | 'notification';
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface MessageQueueConfig {
  maxQueueSize: number;
  maxRetries: number;
  retryDelay: number;
  persistToStorage: boolean;
  storageKey: string;
}

/**
 * Service for managing offline message queue
 * Features:
 * - Queue messages when offline
 * - Auto-retry failed messages with exponential backoff
 * - Persist queue to localStorage
 * - Flush queue when reconnected
 * - Priority-based message ordering
 */
export class MessageQueueService {
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private config: MessageQueueConfig;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<MessageQueueConfig> = {}) {
    this.config = {
      maxQueueSize: 100,
      maxRetries: 3,
      retryDelay: 1000,
      persistToStorage: true,
      storageKey: 'lapor-aa-message-queue',
      ...config,
    };

    // Load persisted queue on initialization
    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * Add a message to the queue
   */
  enqueue(
    type: QueuedMessage['type'],
    payload: unknown,
    priority: QueuedMessage['priority'] = 'normal'
  ): string {
    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      // Remove oldest low-priority message to make room
      const oldestLowPriorityIndex = this.queue.findIndex(
        msg => msg.priority === 'low'
      );
      if (oldestLowPriorityIndex !== -1) {
        this.queue.splice(oldestLowPriorityIndex, 1);
      } else {
        console.warn('Message queue is full, dropping message');
        return '';
      }
    }

    const message: QueuedMessage = {
      id: uuidv4(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority,
    };

    // Insert message based on priority
    const insertIndex = this.findInsertIndex(priority);
    this.queue.splice(insertIndex, 0, message);

    // Persist to storage
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }

    console.log(`Queued ${type} message:`, message.id);
    return message.id;
  }

  /**
   * Process all messages in the queue
   */
  async flush(sendFunction: (message: QueuedMessage) => Promise<boolean>): Promise<void> {
    if (this.isProcessing) {
      console.log('Queue is already being processed');
      return;
    }

    this.isProcessing = true;
    console.log(`Processing ${this.queue.length} queued messages`);

    const failedMessages: QueuedMessage[] = [];

    for (const message of [...this.queue]) {
      try {
        const success = await sendFunction(message);
        
        if (success) {
          // Remove successful message from queue
          this.removeMessage(message.id);
          console.log(`Successfully sent message: ${message.id}`);
        } else {
          // Move to failed messages for retry
          failedMessages.push(message);
        }
      } catch (error) {
        console.error(`Error sending message ${message.id}:`, error);
        failedMessages.push(message);
      }
    }

    // Handle failed messages
    for (const failedMessage of failedMessages) {
      this.handleFailedMessage(failedMessage, sendFunction);
    }

    this.isProcessing = false;

    // Persist updated queue
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Handle a failed message with retry logic
   */
  private handleFailedMessage(
    message: QueuedMessage,
    sendFunction: (message: QueuedMessage) => Promise<boolean>
  ): void {
    message.retryCount++;

    if (message.retryCount >= message.maxRetries) {
      // Remove message after max retries
      this.removeMessage(message.id);
      console.warn(`Message ${message.id} dropped after ${message.maxRetries} retries`);
      return;
    }

    // Schedule retry with exponential backoff
    const retryDelay = this.config.retryDelay * Math.pow(2, message.retryCount - 1);
    console.log(`Retrying message ${message.id} in ${retryDelay}ms (attempt ${message.retryCount})`);

    const timeout = setTimeout(async () => {
      this.retryTimeouts.delete(message.id);
      
      try {
        const success = await sendFunction(message);
        if (success) {
          this.removeMessage(message.id);
          console.log(`Successfully sent message on retry: ${message.id}`);
        } else {
          this.handleFailedMessage(message, sendFunction);
        }
      } catch (error) {
        console.error(`Retry failed for message ${message.id}:`, error);
        this.handleFailedMessage(message, sendFunction);
      }
    }, retryDelay);

    this.retryTimeouts.set(message.id, timeout);
  }

  /**
   * Remove a message from the queue
   */
  removeMessage(messageId: string): boolean {
    const index = this.queue.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      
      // Clear any pending retry timeout
      const timeout = this.retryTimeouts.get(messageId);
      if (timeout) {
        clearTimeout(timeout);
        this.retryTimeouts.delete(messageId);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Clear all messages from the queue
   */
  clear(): void {
    // Clear all retry timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();

    this.queue = [];
    
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
    
    console.log('Message queue cleared');
  }

  /**
   * Get current queue status
   */
  getStatus() {
    const priorityCounts = this.queue.reduce((acc, msg) => {
      acc[msg.priority] = (acc[msg.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMessages: this.queue.length,
      isProcessing: this.isProcessing,
      priorityCounts,
      oldestMessage: this.queue.length > 0 ? this.queue[this.queue.length - 1].timestamp : null,
    };
  }

  /**
   * Find the correct insert index based on priority
   */
  private findInsertIndex(priority: QueuedMessage['priority']): number {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const priorityValue = priorityOrder[priority];

    for (let i = 0; i < this.queue.length; i++) {
      const currentPriorityValue = priorityOrder[this.queue[i].priority];
      if (priorityValue < currentPriorityValue) {
        return i;
      }
    }

    return this.queue.length;
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const queueData = {
        queue: this.queue,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(queueData));
    } catch (error) {
      console.error('Failed to save message queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const queueData = JSON.parse(stored);
        
        // Only load if not too old (24 hours)
        if (Date.now() - queueData.timestamp < 24 * 60 * 60 * 1000) {
          this.queue = queueData.queue || [];
          console.log(`Loaded ${this.queue.length} messages from storage`);
        } else {
          // Clear old data
          localStorage.removeItem(this.config.storageKey);
        }
      }
    } catch (error) {
      console.error('Failed to load message queue from storage:', error);
      // Clear corrupted data
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.config.storageKey);
      }
    }
  }
}

// Global message queue instance
export const messageQueue = new MessageQueueService();

export default MessageQueueService;
