/**
 * Enterprise Connection Pool Service - FAANG Level Implementation
 * Manages database connections, HTTP clients, and resource optimization
 */

interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  maxLifetimeMs: number;
  retryAttempts: number;
  healthCheckInterval: number;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingRequests: number;
  successfulAcquisitions: number;
  failedAcquisitions: number;
  timeouts: number;
  totalLifetimeMs: number;
}

interface PooledConnection {
  id: string;
  connection: any;
  createdAt: number;
  lastUsed: number;
  activeTime: number;
  totalUsage: number;
  isHealthy: boolean;
  inUse: boolean;
}

export class ConnectionPoolService {
  private pools: Map<string, PooledConnection[]> = new Map();
  private configs: Map<string, PoolConfig> = new Map();
  private metrics: Map<string, ConnectionMetrics> = new Map();
  private pendingRequests: Map<string, Array<{
    resolve: (connection: any) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }>> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    console.log('🏊 Connection Pool Service initialized');
    this.startGlobalCleanup();
  }

  /**
   * Create a new connection pool
   */
  createPool(
    poolName: string,
    connectionFactory: () => Promise<any>,
    healthChecker: (connection: any) => Promise<boolean>,
    destroyer: (connection: any) => Promise<void>,
    config: Partial<PoolConfig> = {}
  ): void {
    const defaultConfig: PoolConfig = {
      maxConnections: 20,
      minConnections: 2,
      acquireTimeoutMs: 10000,
      idleTimeoutMs: 300000, // 5 minutes
      maxLifetimeMs: 3600000, // 1 hour
      retryAttempts: 3,
      healthCheckInterval: 60000 // 1 minute
    };

    const fullConfig = { ...defaultConfig, ...config };
    this.configs.set(poolName, fullConfig);
    this.pools.set(poolName, []);
    this.pendingRequests.set(poolName, []);
    
    this.metrics.set(poolName, {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      pendingRequests: 0,
      successfulAcquisitions: 0,
      failedAcquisitions: 0,
      timeouts: 0,
      totalLifetimeMs: 0
    });

    // Pre-populate with minimum connections
    this.warmupPool(poolName, connectionFactory, healthChecker).catch(error => {
      console.error(`Failed to warmup pool ${poolName}:`, error);
    });

    // Start health checking
    this.startHealthChecking(poolName, healthChecker, destroyer);

    console.log(`🏊 Created connection pool: ${poolName} (min: ${fullConfig.minConnections}, max: ${fullConfig.maxConnections})`);
  }

  /**
   * Acquire a connection from the pool
   */
  async acquireConnection(poolName: string, connectionFactory?: () => Promise<any>): Promise<{
    connection: any;
    release: () => void;
  }> {
    const config = this.configs.get(poolName);
    const pool = this.pools.get(poolName);
    const metrics = this.metrics.get(poolName);

    if (!config || !pool || !metrics) {
      throw new Error(`Pool ${poolName} not found`);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removePendingRequest(poolName, resolve);
        metrics.timeouts++;
        metrics.failedAcquisitions++;
        reject(new Error(`Connection acquisition timeout for pool ${poolName}`));
      }, config.acquireTimeoutMs);

      const tryAcquire = async () => {
        try {
          // Find available connection
          const availableConnection = pool.find(conn => !conn.inUse && conn.isHealthy);
          
          if (availableConnection) {
            clearTimeout(timeoutId);
            this.removePendingRequest(poolName, resolve);
            
            availableConnection.inUse = true;
            availableConnection.lastUsed = Date.now();
            availableConnection.totalUsage++;
            
            metrics.activeConnections++;
            metrics.idleConnections--;
            metrics.successfulAcquisitions++;

            const releaseFunction = () => this.releaseConnection(poolName, availableConnection.id);
            
            resolve({
              connection: availableConnection.connection,
              release: releaseFunction
            });
            return;
          }

          // Try to create new connection if under limit
          if (pool.length < config.maxConnections && connectionFactory) {
            try {
              const newConnection = await connectionFactory();
              const pooledConnection: PooledConnection = {
                id: this.generateConnectionId(),
                connection: newConnection,
                createdAt: Date.now(),
                lastUsed: Date.now(),
                activeTime: 0,
                totalUsage: 1,
                isHealthy: true,
                inUse: true
              };

              pool.push(pooledConnection);
              metrics.totalConnections++;
              metrics.activeConnections++;
              metrics.successfulAcquisitions++;

              clearTimeout(timeoutId);
              this.removePendingRequest(poolName, resolve);

              const releaseFunction = () => this.releaseConnection(poolName, pooledConnection.id);
              
              resolve({
                connection: newConnection,
                release: releaseFunction
              });
              return;

            } catch (error) {
              console.error(`Failed to create new connection for pool ${poolName}:`, error);
            }
          }

          // Add to pending queue
          if (!this.pendingRequests.get(poolName)!.some(req => req.resolve === resolve)) {
            this.pendingRequests.get(poolName)!.push({
              resolve,
              reject,
              timestamp: Date.now()
            });
            metrics.pendingRequests++;
          }

        } catch (error) {
          clearTimeout(timeoutId);
          this.removePendingRequest(poolName, resolve);
          metrics.failedAcquisitions++;
          reject(error);
        }
      };

      tryAcquire();
    });
  }

  /**
   * Release a connection back to the pool
   */
  private releaseConnection(poolName: string, connectionId: string): void {
    const pool = this.pools.get(poolName);
    const metrics = this.metrics.get(poolName);
    
    if (!pool || !metrics) {
      console.error(`Pool ${poolName} not found for release`);
      return;
    }

    const connection = pool.find(conn => conn.id === connectionId);
    if (!connection) {
      console.error(`Connection ${connectionId} not found in pool ${poolName}`);
      return;
    }

    if (!connection.inUse) {
      console.warn(`Connection ${connectionId} already released`);
      return;
    }

    connection.inUse = false;
    connection.activeTime += Date.now() - connection.lastUsed;
    
    metrics.activeConnections--;
    metrics.idleConnections++;

    // Process pending requests
    this.processPendingRequests(poolName);

    console.log(`🔓 Released connection ${connectionId} to pool ${poolName}`);
  }

  /**
   * Process pending connection requests
   */
  private processPendingRequests(poolName: string): void {
    const pendingRequests = this.pendingRequests.get(poolName);
    const pool = this.pools.get(poolName);
    const metrics = this.metrics.get(poolName);

    if (!pendingRequests || !pool || !metrics || pendingRequests.length === 0) {
      return;
    }

    const availableConnection = pool.find(conn => !conn.inUse && conn.isHealthy);
    if (!availableConnection) {
      return;
    }

    const request = pendingRequests.shift();
    if (request) {
      metrics.pendingRequests--;
      
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();
      availableConnection.totalUsage++;
      
      metrics.activeConnections++;
      metrics.idleConnections--;
      metrics.successfulAcquisitions++;

      const releaseFunction = () => this.releaseConnection(poolName, availableConnection.id);
      
      request.resolve({
        connection: availableConnection.connection,
        release: releaseFunction
      });
    }
  }

  /**
   * Remove pending request from queue
   */
  private removePendingRequest(poolName: string, resolve: Function): void {
    const pendingRequests = this.pendingRequests.get(poolName);
    const metrics = this.metrics.get(poolName);
    
    if (pendingRequests && metrics) {
      const index = pendingRequests.findIndex(req => req.resolve === resolve);
      if (index >= 0) {
        pendingRequests.splice(index, 1);
        metrics.pendingRequests--;
      }
    }
  }

  /**
   * Warmup pool with minimum connections
   */
  private async warmupPool(
    poolName: string,
    connectionFactory: () => Promise<any>,
    healthChecker: (connection: any) => Promise<boolean>
  ): Promise<void> {
    const config = this.configs.get(poolName)!;
    const pool = this.pools.get(poolName)!;
    const metrics = this.metrics.get(poolName)!;

    for (let i = 0; i < config.minConnections; i++) {
      try {
        const connection = await connectionFactory();
        const isHealthy = await healthChecker(connection);

        const pooledConnection: PooledConnection = {
          id: this.generateConnectionId(),
          connection,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          activeTime: 0,
          totalUsage: 0,
          isHealthy,
          inUse: false
        };

        pool.push(pooledConnection);
        metrics.totalConnections++;
        metrics.idleConnections++;

      } catch (error) {
        console.error(`Failed to create warmup connection for pool ${poolName}:`, error);
      }
    }

    console.log(`🌡️ Warmed up pool ${poolName} with ${pool.length} connections`);
  }

  /**
   * Start health checking for pool
   */
  private startHealthChecking(
    poolName: string,
    healthChecker: (connection: any) => Promise<boolean>,
    destroyer: (connection: any) => Promise<void>
  ): void {
    const config = this.configs.get(poolName)!;
    
    const healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck(poolName, healthChecker, destroyer);
    }, config.healthCheckInterval);

    this.healthCheckIntervals.set(poolName, healthCheckInterval);
  }

  /**
   * Perform health check on all connections in pool
   */
  private async performHealthCheck(
    poolName: string,
    healthChecker: (connection: any) => Promise<boolean>,
    destroyer: (connection: any) => Promise<void>
  ): Promise<void> {
    const pool = this.pools.get(poolName);
    const config = this.configs.get(poolName);
    const metrics = this.metrics.get(poolName);

    if (!pool || !config || !metrics) return;

    const now = Date.now();
    const connectionsToRemove: string[] = [];

    for (const pooledConnection of pool) {
      // Skip connections in use
      if (pooledConnection.inUse) continue;

      // Check if connection exceeded max lifetime
      if (now - pooledConnection.createdAt > config.maxLifetimeMs) {
        connectionsToRemove.push(pooledConnection.id);
        continue;
      }

      // Check if connection is idle too long
      if (now - pooledConnection.lastUsed > config.idleTimeoutMs) {
        connectionsToRemove.push(pooledConnection.id);
        continue;
      }

      // Perform health check
      try {
        const isHealthy = await healthChecker(pooledConnection.connection);
        pooledConnection.isHealthy = isHealthy;
        
        if (!isHealthy) {
          connectionsToRemove.push(pooledConnection.id);
        }
      } catch (error) {
        console.error(`Health check failed for connection ${pooledConnection.id}:`, error);
        pooledConnection.isHealthy = false;
        connectionsToRemove.push(pooledConnection.id);
      }
    }

    // Remove unhealthy/expired connections
    for (const connectionId of connectionsToRemove) {
      await this.removeConnection(poolName, connectionId, destroyer);
    }

    console.log(`🏥 Health check completed for pool ${poolName}: ${connectionsToRemove.length} connections removed`);
  }

  /**
   * Remove connection from pool
   */
  private async removeConnection(
    poolName: string,
    connectionId: string,
    destroyer: (connection: any) => Promise<void>
  ): Promise<void> {
    const pool = this.pools.get(poolName);
    const metrics = this.metrics.get(poolName);

    if (!pool || !metrics) return;

    const index = pool.findIndex(conn => conn.id === connectionId);
    if (index >= 0) {
      const [removedConnection] = pool.splice(index, 1);
      
      try {
        await destroyer(removedConnection.connection);
      } catch (error) {
        console.error(`Failed to destroy connection ${connectionId}:`, error);
      }

      metrics.totalConnections--;
      if (removedConnection.inUse) {
        metrics.activeConnections--;
      } else {
        metrics.idleConnections--;
      }

      metrics.totalLifetimeMs += Date.now() - removedConnection.createdAt;

      console.log(`🗑️ Removed connection ${connectionId} from pool ${poolName}`);
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(poolName: string): (ConnectionMetrics & {
    config: PoolConfig;
    connections: Array<{
      id: string;
      createdAt: number;
      lastUsed: number;
      totalUsage: number;
      isHealthy: boolean;
      inUse: boolean;
      ageMs: number;
    }>;
  }) | null {
    const config = this.configs.get(poolName);
    const pool = this.pools.get(poolName);
    const metrics = this.metrics.get(poolName);

    if (!config || !pool || !metrics) {
      return null;
    }

    const now = Date.now();
    const connections = pool.map(conn => ({
      id: conn.id,
      createdAt: conn.createdAt,
      lastUsed: conn.lastUsed,
      totalUsage: conn.totalUsage,
      isHealthy: conn.isHealthy,
      inUse: conn.inUse,
      ageMs: now - conn.createdAt
    }));

    return {
      ...metrics,
      config,
      connections
    };
  }

  /**
   * Get all pools statistics
   */
  getAllPoolStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const poolName of this.pools.keys()) {
      stats[poolName] = this.getPoolStats(poolName);
    }

    return stats;
  }

  /**
   * Destroy a pool
   */
  async destroyPool(
    poolName: string,
    destroyer: (connection: any) => Promise<void>
  ): Promise<void> {
    const pool = this.pools.get(poolName);
    const healthCheckInterval = this.healthCheckIntervals.get(poolName);

    if (!pool) {
      console.warn(`Pool ${poolName} not found for destruction`);
      return;
    }

    // Clear health check interval
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      this.healthCheckIntervals.delete(poolName);
    }

    // Destroy all connections
    const destroyPromises = pool.map(async (pooledConnection) => {
      try {
        await destroyer(pooledConnection.connection);
      } catch (error) {
        console.error(`Failed to destroy connection ${pooledConnection.id}:`, error);
      }
    });

    await Promise.allSettled(destroyPromises);

    // Clean up data structures
    this.pools.delete(poolName);
    this.configs.delete(poolName);
    this.metrics.delete(poolName);
    this.pendingRequests.delete(poolName);

    console.log(`💥 Destroyed pool ${poolName} with ${pool.length} connections`);
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start global cleanup tasks
   */
  private startGlobalCleanup(): void {
    // Cleanup expired pending requests every minute
    setInterval(() => {
      const now = Date.now();
      
      for (const [poolName, pendingRequests] of this.pendingRequests.entries()) {
        const metrics = this.metrics.get(poolName);
        if (!metrics) continue;

        const config = this.configs.get(poolName);
        if (!config) continue;

        let removed = 0;
        for (let i = pendingRequests.length - 1; i >= 0; i--) {
          const request = pendingRequests[i];
          if (now - request.timestamp > config.acquireTimeoutMs) {
            const removedRequest = pendingRequests.splice(i, 1)[0];
            removedRequest.reject(new Error('Request expired'));
            metrics.failedAcquisitions++;
            metrics.pendingRequests--;
            removed++;
          }
        }

        if (removed > 0) {
          console.log(`🧹 Cleaned ${removed} expired requests from pool ${poolName}`);
        }
      }
    }, 60000); // 1 minute
  }

  /**
   * Shutdown all pools
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Connection Pool Service...');
    
    for (const poolName of this.pools.keys()) {
      try {
        await this.destroyPool(poolName, async (connection) => {
          // Generic connection cleanup
          if (connection && typeof connection.close === 'function') {
            await connection.close();
          } else if (connection && typeof connection.end === 'function') {
            await connection.end();
          }
        });
      } catch (error) {
        console.error(`Error destroying pool ${poolName}:`, error);
      }
    }

    console.log('✅ Connection Pool Service shutdown complete');
  }
}

// Global singleton instance
export const connectionPoolService = new ConnectionPoolService();