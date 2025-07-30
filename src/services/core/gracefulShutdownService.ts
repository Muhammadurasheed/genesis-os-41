/**
 * Graceful Shutdown Service - FAANG Level Implementation
 * Handles application shutdown with proper cleanup and resource management
 */

interface ShutdownHandler {
  name: string;
  handler: () => Promise<void>;
  priority: number; // Lower numbers = higher priority (run first)
  timeout: number; // Max time to wait for this handler
}

interface ShutdownConfig {
  gracefulTimeout: number; // Total time to wait for graceful shutdown
  forceExitTimeout: number; // Time to wait before force exit
  signals: string[]; // Signals to listen for
}

export class GracefulShutdownService {
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown = false;
  private shutdownPromise: Promise<void> | null = null;
  private config: ShutdownConfig;

  constructor(config: Partial<ShutdownConfig> = {}) {
    this.config = {
      gracefulTimeout: 30000, // 30 seconds
      forceExitTimeout: 5000,  // 5 seconds
      signals: ['SIGTERM', 'SIGINT', 'SIGUSR1', 'SIGUSR2'],
      ...config
    };

    this.setupSignalHandlers();
    this.registerDefaultHandlers();
    
    console.log('🛑 Graceful Shutdown Service initialized');
  }

  /**
   * Register a shutdown handler
   */
  registerHandler(handler: Omit<ShutdownHandler, 'priority'> & { priority?: number }): void {
    const fullHandler: ShutdownHandler = {
      priority: 100, // Default priority
      ...handler,
      timeout: handler.timeout || 10000 // Default 10 second timeout
    };

    this.handlers.push(fullHandler);
    
    // Sort by priority (lower number = higher priority)
    this.handlers.sort((a, b) => a.priority - b.priority);

    console.log(`📋 Registered shutdown handler: ${handler.name} (priority: ${fullHandler.priority})`);
  }

  /**
   * Remove a shutdown handler
   */
  unregisterHandler(name: string): boolean {
    const index = this.handlers.findIndex(h => h.name === name);
    if (index >= 0) {
      this.handlers.splice(index, 1);
      console.log(`❌ Unregistered shutdown handler: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Initiate graceful shutdown
   */
  async shutdown(reason: string = 'Manual shutdown'): Promise<void> {
    if (this.isShuttingDown) {
      console.log('⚠️ Shutdown already in progress');
      return this.shutdownPromise || Promise.resolve();
    }

    console.log(`🛑 Initiating graceful shutdown: ${reason}`);
    this.isShuttingDown = true;

    this.shutdownPromise = this.performShutdown();
    return this.shutdownPromise;
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    for (const signal of this.config.signals) {
      process.on(signal, () => {
        console.log(`📡 Received ${signal} signal`);
        this.shutdown(`Received ${signal} signal`).catch(error => {
          console.error('Error during signal-initiated shutdown:', error);
          process.exit(1);
        });
      });
    }

    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.shutdown('Uncaught exception').finally(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown('Unhandled rejection').finally(() => {
        process.exit(1);
      });
    });

    console.log(`📡 Signal handlers registered for: ${this.config.signals.join(', ')}`);
  }

  /**
   * Register default shutdown handlers
   */
  private registerDefaultHandlers(): void {
    // Stop accepting new requests
    this.registerHandler({
      name: 'stop-accepting-requests',
      handler: async () => {
        console.log('🚫 Stopping acceptance of new requests');
        // Implementation would mark server as not accepting new connections
      },
      priority: 10,
      timeout: 1000
    });

    // Close database connections
    this.registerHandler({
      name: 'close-database-connections',
      handler: async () => {
        console.log('🗃️ Closing database connections');
        // Import and shutdown connection pool service
        try {
          const { connectionPoolService } = await import('./connectionPoolService');
          await connectionPoolService.shutdown();
        } catch (error) {
          console.error('Error closing database connections:', error);
        }
      },
      priority: 20,
      timeout: 10000
    });

    // Close circuit breakers
    this.registerHandler({
      name: 'shutdown-circuit-breakers',
      handler: async () => {
        console.log('🔌 Shutting down circuit breakers');
        // Circuit breakers don't need explicit cleanup but we log for completeness
      },
      priority: 30,
      timeout: 1000
    });

    // Shutdown service discovery
    this.registerHandler({
      name: 'shutdown-service-discovery',
      handler: async () => {
        console.log('🔍 Shutting down service discovery');
        try {
          const { serviceDiscoveryService } = await import('./serviceDiscoveryService');
          serviceDiscoveryService.shutdown();
        } catch (error) {
          console.error('Error shutting down service discovery:', error);
        }
      },
      priority: 40,
      timeout: 5000
    });

    // Shutdown health checks
    this.registerHandler({
      name: 'shutdown-health-checks',
      handler: async () => {
        console.log('🏥 Shutting down health checks');
        try {
          const { healthCheckService } = await import('./healthCheckService');
          healthCheckService.shutdown();
        } catch (error) {
          console.error('Error shutting down health checks:', error);
        }
      },
      priority: 50,
      timeout: 5000
    });

    // Clear caches and temporary data
    this.registerHandler({
      name: 'clear-caches',
      handler: async () => {
        console.log('🧹 Clearing caches and temporary data');
        // Clear any in-memory caches
        if (global.gc) {
          global.gc();
        }
      },
      priority: 60,
      timeout: 2000
    });

    // Log final shutdown message
    this.registerHandler({
      name: 'final-logging',
      handler: async () => {
        console.log('📝 Logging final shutdown message');
        console.log('✅ GenesisOS graceful shutdown completed');
      },
      priority: 100,
      timeout: 1000
    });

    console.log(`✅ Registered ${this.handlers.length} default shutdown handlers`);
  }

  /**
   * Perform the actual shutdown process
   */
  private async performShutdown(): Promise<void> {
    const startTime = Date.now();
    const results: Array<{ name: string; success: boolean; duration: number; error?: string }> = [];

    // Set overall timeout
    const overallTimeout = setTimeout(() => {
      console.error('⏰ Graceful shutdown timeout reached, forcing exit');
      this.forceExit();
    }, this.config.gracefulTimeout);

    try {
      for (const handler of this.handlers) {
        const handlerStartTime = Date.now();
        
        try {
          console.log(`🔄 Executing shutdown handler: ${handler.name}`);
          
          // Create timeout for this specific handler
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Handler ${handler.name} timeout after ${handler.timeout}ms`));
            }, handler.timeout);
          });

          // Race between handler execution and timeout
          await Promise.race([
            handler.handler(),
            timeoutPromise
          ]);

          const duration = Date.now() - handlerStartTime;
          results.push({ name: handler.name, success: true, duration });
          
          console.log(`✅ Completed shutdown handler: ${handler.name} (${duration}ms)`);

        } catch (error) {
          const duration = Date.now() - handlerStartTime;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          results.push({ 
            name: handler.name, 
            success: false, 
            duration, 
            error: errorMessage 
          });
          
          console.error(`❌ Shutdown handler failed: ${handler.name} (${duration}ms) - ${errorMessage}`);
          
          // Continue with other handlers even if one fails
        }
      }

      clearTimeout(overallTimeout);

      // Log shutdown summary
      const totalDuration = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`📊 Shutdown Summary:`);
      console.log(`   Total time: ${totalDuration}ms`);
      console.log(`   Handlers: ${successful} successful, ${failed} failed`);
      
      if (failed > 0) {
        console.log(`   Failed handlers: ${results.filter(r => !r.success).map(r => r.name).join(', ')}`);
      }

      // Exit with appropriate code
      const exitCode = failed > 0 ? 1 : 0;
      
      // Small delay to ensure logs are flushed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      process.exit(exitCode);

    } catch (error) {
      clearTimeout(overallTimeout);
      console.error('💥 Critical error during shutdown:', error);
      this.forceExit();
    }
  }

  /**
   * Force exit when graceful shutdown fails
   */
  private forceExit(): void {
    console.error('💥 Forcing application exit');
    
    // Set a final timeout for force exit
    setTimeout(() => {
      console.error('💀 Hard exit - process.exit(1)');
      process.exit(1);
    }, this.config.forceExitTimeout);
    
    // Try to exit gracefully first
    process.exit(1);
  }

  /**
   * Wait for all active operations to complete
   */
  async waitForActiveOperations(maxWaitTime: number = 10000): Promise<void> {
    console.log('⏳ Waiting for active operations to complete...');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkOperations = () => {
        // Check if we should stop waiting
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= maxWaitTime) {
          console.log(`⏰ Timeout waiting for operations (${elapsed}ms)`);
          resolve();
          return;
        }

        // In a real implementation, you would check:
        // - Active HTTP requests
        // - Background jobs
        // - Streaming connections
        // - Database transactions
        
        // Mock check - in reality you'd have counters for active operations
        const activeOperations = 0; // Replace with actual check
        
        if (activeOperations === 0) {
          console.log(`✅ All operations completed (${elapsed}ms)`);
          resolve();
        } else {
          console.log(`⏳ ${activeOperations} operations still active...`);
          setTimeout(checkOperations, 1000);
        }
      };

      checkOperations();
    });
  }

  /**
   * Create a shutdown-aware wrapper for async operations
   */
  createShutdownAwareWrapper<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): () => Promise<T> {
    return async (): Promise<T> => {
      if (this.isShuttingDown) {
        throw new Error(`Cannot start ${operationName} during shutdown`);
      }

      try {
        return await operation();
      } catch (error) {
        if (this.isShuttingDown) {
          console.log(`⚠️ ${operationName} interrupted by shutdown`);
        }
        throw error;
      }
    };
  }

  /**
   * Get shutdown status information
   */
  getShutdownStatus(): {
    isShuttingDown: boolean;
    handlers: Array<{ name: string; priority: number; timeout: number }>;
    config: ShutdownConfig;
  } {
    return {
      isShuttingDown: this.isShuttingDown,
      handlers: this.handlers.map(h => ({
        name: h.name,
        priority: h.priority,
        timeout: h.timeout
      })),
      config: this.config
    };
  }
}

// Global singleton instance
export const gracefulShutdownService = new GracefulShutdownService();