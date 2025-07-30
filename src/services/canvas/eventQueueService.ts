// Event Queue Service - handles trigger event processing

interface QueuedEvent {
  id: string;
  triggerId: string;
  workflowId: string;
  eventType: string;
  payload: any;
  scheduledTime: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: {
    source: string;
    correlation_id?: string;
    user_id?: string;
    [key: string]: any;
  };
}

interface QueueConfiguration {
  maxConcurrentJobs: number;
  defaultRetryAttempts: number;
  retryDelayMs: number;
  maxQueueSize: number;
  priorityEnabled: boolean;
  deadLetterQueue: boolean;
}

interface ExecutionContext {
  eventId: string;
  workflowId: string;
  triggerId: string;
  payload: any;
  metadata: any;
}

class EventQueueService {
  private queue: Map<string, QueuedEvent> = new Map();
  private processingQueue: Set<string> = new Set();
  private config: QueueConfiguration;
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private deadLetterQueue: Map<string, QueuedEvent> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.config = {
      maxConcurrentJobs: 5,
      defaultRetryAttempts: 3,
      retryDelayMs: 5000,
      maxQueueSize: 1000,
      priorityEnabled: true,
      deadLetterQueue: true
    };

    console.log('🚀 Event Queue Service initialized');
    this.startProcessing();
  }

  /**
   * Enqueue an event for processing
   */
  async enqueueEvent(
    triggerId: string,
    workflowId: string,
    eventType: string,
    payload: any,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      scheduledTime?: Date;
      maxRetries?: number;
      metadata?: any;
    } = {}
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Check queue size limit
      if (this.queue.size >= this.config.maxQueueSize) {
        return { success: false, error: 'Queue is full' };
      }

      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const queuedEvent: QueuedEvent = {
        id: eventId,
        triggerId,
        workflowId,
        eventType,
        payload,
        scheduledTime: options.scheduledTime || now,
        status: 'pending',
        priority: options.priority || 'medium',
        retryCount: 0,
        maxRetries: options.maxRetries || this.config.defaultRetryAttempts,
        createdAt: now,
        updatedAt: now,
        metadata: options.metadata || {}
      };

      this.queue.set(eventId, queuedEvent);

      console.log(`📝 Event enqueued: ${eventId} (${eventType}) for workflow ${workflowId}`);
      
      // Emit event for listeners
      this.emitEvent('event_enqueued', { event: queuedEvent });

      return { success: true, eventId };

    } catch (error) {
      console.error('❌ Error enqueuing event:', error);
      return { success: false, error: 'Failed to enqueue event' };
    }
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processQueue();
      }
    }, 1000); // Check queue every second

    console.log('▶️ Queue processing started');
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏸️ Queue processing stopped');
    }
  }

  /**
   * Process pending events in the queue
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    try {
      // Get available processing slots
      const availableSlots = this.config.maxConcurrentJobs - this.processingQueue.size;
      if (availableSlots <= 0) return;

      // Get pending events ready for processing
      const pendingEvents = this.getPendingEvents(availableSlots);

      // Process each event
      for (const event of pendingEvents) {
        this.processEvent(event);
      }

    } catch (error) {
      console.error('❌ Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get pending events sorted by priority and scheduled time
   */
  private getPendingEvents(limit: number): QueuedEvent[] {
    const now = new Date();
    const pendingEvents: QueuedEvent[] = [];

    for (const event of this.queue.values()) {
      if (
        event.status === 'pending' &&
        event.scheduledTime <= now &&
        !this.processingQueue.has(event.id)
      ) {
        pendingEvents.push(event);
      }
    }

    // Sort by priority and scheduled time
    if (this.config.priorityEnabled) {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      pendingEvents.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.scheduledTime.getTime() - b.scheduledTime.getTime();
      });
    } else {
      pendingEvents.sort((a, b) => 
        a.scheduledTime.getTime() - b.scheduledTime.getTime()
      );
    }

    return pendingEvents.slice(0, limit);
  }

  /**
   * Process a single event
   */
  private async processEvent(event: QueuedEvent): Promise<void> {
    const eventId = event.id;
    
    try {
      // Mark as processing
      this.processingQueue.add(eventId);
      event.status = 'processing';
      event.processingStartedAt = new Date();
      event.updatedAt = new Date();

      console.log(`⚡ Processing event: ${eventId} (${event.eventType})`);

      // Emit processing started event
      this.emitEvent('event_processing_started', { event });

      // Execute the workflow
      const executionContext: ExecutionContext = {
        eventId: event.id,
        workflowId: event.workflowId,
        triggerId: event.triggerId,
        payload: event.payload,
        metadata: event.metadata || {}
      };

      const result = await this.executeWorkflow(executionContext);

      if (result.success) {
        // Mark as completed
        event.status = 'completed';
        event.completedAt = new Date();
        event.updatedAt = new Date();

        console.log(`✅ Event completed: ${eventId}`);
        this.emitEvent('event_completed', { event, result });
      } else {
        throw new Error(result.error || 'Workflow execution failed');
      }

    } catch (error) {
      console.error(`❌ Event processing failed: ${eventId}`, error);
      await this.handleEventFailure(event, error);
    } finally {
      // Remove from processing queue
      this.processingQueue.delete(eventId);
    }
  }

  /**
   * Handle event processing failure
   */
  private async handleEventFailure(event: QueuedEvent, error: unknown): Promise<void> {
    event.retryCount++;
    event.updatedAt = new Date();
    event.error = (error as Error)?.message || 'Unknown error';

    if (event.retryCount < event.maxRetries) {
      // Schedule retry
      const retryDelay = this.calculateRetryDelay(event.retryCount);
      event.scheduledTime = new Date(Date.now() + retryDelay);
      event.status = 'pending';

      console.log(`🔄 Event retry scheduled: ${event.id} (attempt ${event.retryCount + 1}/${event.maxRetries})`);
      this.emitEvent('event_retry_scheduled', { event });
    } else {
      // Move to dead letter queue
      event.status = 'failed';
      
      if (this.config.deadLetterQueue) {
        this.deadLetterQueue.set(event.id, { ...event });
        console.log(`💀 Event moved to dead letter queue: ${event.id}`);
      }

      this.emitEvent('event_failed', { event });
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    return this.config.retryDelayMs * Math.pow(2, retryCount - 1);
  }

  /**
   * Execute workflow (integration point with workflow engine)
   */
  private async executeWorkflow(context: ExecutionContext): Promise<{ success: boolean; error?: string; result?: any }> {
    try {
      // This would integrate with the actual workflow execution engine
      // For now, simulate execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

      // Simulate success/failure
      if (Math.random() > 0.1) { // 90% success rate
        return {
          success: true,
          result: {
            executionId: `exec_${context.eventId}`,
            completedAt: new Date(),
            output: { status: 'completed', data: 'Workflow executed successfully' }
          }
        };
      } else {
        throw new Error('Simulated workflow failure');
      }

    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message || 'Workflow execution failed'
      };
    }
  }

  /**
   * Get event status
   */
  getEventStatus(eventId: string): QueuedEvent | null {
    return this.queue.get(eventId) || this.deadLetterQueue.get(eventId) || null;
  }

  /**
   * Cancel a pending event
   */
  cancelEvent(eventId: string): boolean {
    const event = this.queue.get(eventId);
    
    if (event && event.status === 'pending') {
      event.status = 'cancelled';
      event.updatedAt = new Date();
      
      console.log(`❌ Event cancelled: ${eventId}`);
      this.emitEvent('event_cancelled', { event });
      return true;
    }

    return false;
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    deadLetterQueue: number;
    processingSlots: { used: number; available: number; total: number };
  } {
    const stats = {
      total: this.queue.size,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      deadLetterQueue: this.deadLetterQueue.size,
      processingSlots: {
        used: this.processingQueue.size,
        available: this.config.maxConcurrentJobs - this.processingQueue.size,
        total: this.config.maxConcurrentJobs
      }
    };

    for (const event of this.queue.values()) {
      switch (event.status) {
        case 'pending': stats.pending++; break;
        case 'processing': stats.processing++; break;
        case 'completed': stats.completed++; break;
        case 'failed': stats.failed++; break;
      }
    }

    return stats;
  }

  /**
   * Clean up old completed events
   */
  cleanupOldEvents(olderThanMs: number = 24 * 60 * 60 * 1000): number { // Default: 24 hours
    const cutoffTime = new Date(Date.now() - olderThanMs);
    let removedCount = 0;

    for (const [eventId, event] of this.queue.entries()) {
      if (
        (event.status === 'completed' || event.status === 'failed') &&
        event.updatedAt < cutoffTime
      ) {
        this.queue.delete(eventId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old events`);
    }

    return removedCount;
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('❌ Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<QueueConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Queue configuration updated:', newConfig);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): QueueConfiguration {
    return { ...this.config };
  }
}

export const eventQueueService = new EventQueueService();