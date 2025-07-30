/**
 * Service Discovery Service - FAANG Level Implementation
 * Handles service registration, discovery, and health monitoring
 */

interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  version: string;
  metadata: Record<string, any>;
  health: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: number;
    consecutiveFailures: number;
  };
  capabilities: string[];
  loadMetrics: {
    cpu: number;
    memory: number;
    activeConnections: number;
    requestsPerSecond: number;
  };
  registeredAt: number;
  lastHeartbeat: number;
}

interface ServiceDiscoveryConfig {
  healthCheckInterval: number;
  heartbeatTimeout: number;
  maxConsecutiveFailures: number;
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'weighted' | 'random';
}

export class ServiceDiscoveryService {
  private services: Map<string, ServiceInstance[]> = new Map();
  private roundRobinCounters: Map<string, number> = new Map();
  private config: ServiceDiscoveryConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ServiceDiscoveryConfig> = {}) {
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      heartbeatTimeout: 60000, // 1 minute
      maxConsecutiveFailures: 3,
      loadBalancingStrategy: 'round-robin',
      ...config
    };

    this.startHealthChecking();
    console.log('🔍 Service Discovery Service initialized');
  }

  /**
   * Register a service instance
   */
  async registerService(
    serviceName: string,
    instance: Omit<ServiceInstance, 'id' | 'registeredAt' | 'lastHeartbeat' | 'health'>
  ): Promise<string> {
    const serviceId = `${serviceName}-${instance.host}:${instance.port}-${Date.now()}`;
    
    const fullInstance: ServiceInstance = {
      ...instance,
      id: serviceId,
      health: {
        status: 'unknown',
        lastCheck: 0,
        consecutiveFailures: 0
      },
      registeredAt: Date.now(),
      lastHeartbeat: Date.now()
    };

    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, []);
    }

    const instances = this.services.get(serviceName)!;
    
    // Remove any existing instance with same host:port
    const existingIndex = instances.findIndex(
      inst => inst.host === instance.host && inst.port === instance.port
    );
    
    if (existingIndex >= 0) {
      instances[existingIndex] = fullInstance;
      console.log(`🔄 Updated service instance: ${serviceName} at ${instance.host}:${instance.port}`);
    } else {
      instances.push(fullInstance);
      console.log(`✅ Registered service instance: ${serviceName} at ${instance.host}:${instance.port}`);
    }

    // Perform initial health check
    await this.checkServiceHealth(fullInstance);

    return serviceId;
  }

  /**
   * Deregister a service instance
   */
  deregisterService(serviceName: string, serviceId: string): boolean {
    const instances = this.services.get(serviceName);
    if (!instances) return false;

    const index = instances.findIndex(inst => inst.id === serviceId);
    if (index >= 0) {
      const removed = instances.splice(index, 1)[0];
      console.log(`❌ Deregistered service instance: ${serviceName} (${removed.host}:${removed.port})`);
      
      // Clean up empty service entries
      if (instances.length === 0) {
        this.services.delete(serviceName);
        this.roundRobinCounters.delete(serviceName);
      }
      
      return true;
    }

    return false;
  }

  /**
   * Discover healthy service instances
   */
  discoverService(serviceName: string): ServiceInstance[] {
    const instances = this.services.get(serviceName) || [];
    
    return instances.filter(instance => 
      instance.health.status === 'healthy' &&
      Date.now() - instance.lastHeartbeat < this.config.heartbeatTimeout
    );
  }

  /**
   * Get a specific service instance using load balancing
   */
  getServiceInstance(serviceName: string): ServiceInstance | null {
    const healthyInstances = this.discoverService(serviceName);
    
    if (healthyInstances.length === 0) {
      console.warn(`⚠️ No healthy instances found for service: ${serviceName}`);
      return null;
    }

    return this.selectInstance(serviceName, healthyInstances);
  }

  /**
   * Select service instance based on load balancing strategy
   */
  private selectInstance(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        return this.roundRobinSelection(serviceName, instances);
      
      case 'least-connections':
        return this.leastConnectionsSelection(instances);
      
      case 'weighted':
        return this.weightedSelection(instances);
      
      case 'random':
      default:
        return instances[Math.floor(Math.random() * instances.length)];
    }
  }

  /**
   * Round-robin load balancing
   */
  private roundRobinSelection(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const counter = this.roundRobinCounters.get(serviceName) || 0;
    const selected = instances[counter % instances.length];
    this.roundRobinCounters.set(serviceName, counter + 1);
    return selected;
  }

  /**
   * Least connections load balancing
   */
  private leastConnectionsSelection(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((best, current) => 
      current.loadMetrics.activeConnections < best.loadMetrics.activeConnections ? current : best
    );
  }

  /**
   * Weighted load balancing based on CPU and memory
   */
  private weightedSelection(instances: ServiceInstance[]): ServiceInstance {
    const weights = instances.map(instance => {
      const cpuScore = Math.max(0, 100 - instance.loadMetrics.cpu);
      const memoryScore = Math.max(0, 100 - instance.loadMetrics.memory);
      return (cpuScore + memoryScore) / 2;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) {
      return instances[0]; // Fallback to first instance
    }

    let random = Math.random() * totalWeight;
    for (let i = 0; i < instances.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return instances[i];
      }
    }

    return instances[instances.length - 1]; // Fallback
  }

  /**
   * Update service heartbeat
   */
  heartbeat(serviceName: string, serviceId: string, loadMetrics?: Partial<ServiceInstance['loadMetrics']>): boolean {
    const instances = this.services.get(serviceName);
    if (!instances) return false;

    const instance = instances.find(inst => inst.id === serviceId);
    if (!instance) return false;

    instance.lastHeartbeat = Date.now();
    
    if (loadMetrics) {
      instance.loadMetrics = { ...instance.loadMetrics, ...loadMetrics };
    }

    return true;
  }

  /**
   * Get service discovery statistics
   */
  getDiscoveryStats(): {
    totalServices: number;
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
    serviceBreakdown: Record<string, { total: number; healthy: number; unhealthy: number }>;
  } {
    let totalInstances = 0;
    let healthyInstances = 0;
    let unhealthyInstances = 0;
    const serviceBreakdown: Record<string, { total: number; healthy: number; unhealthy: number }> = {};

    for (const [serviceName, instances] of this.services.entries()) {
      const healthy = instances.filter(inst => inst.health.status === 'healthy').length;
      const unhealthy = instances.length - healthy;

      serviceBreakdown[serviceName] = {
        total: instances.length,
        healthy,
        unhealthy
      };

      totalInstances += instances.length;
      healthyInstances += healthy;
      unhealthyInstances += unhealthy;
    }

    return {
      totalServices: this.services.size,
      totalInstances,
      healthyInstances,
      unhealthyInstances,
      serviceBreakdown
    };
  }

  /**
   * Check health of a specific service instance
   */
  private async checkServiceHealth(instance: ServiceInstance): Promise<void> {
    try {
      const healthUrl = `${instance.protocol}://${instance.host}:${instance.port}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(healthUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'GenesisOS-ServiceDiscovery/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        instance.health.status = 'healthy';
        instance.health.consecutiveFailures = 0;
      } else {
        throw new Error(`Health check failed with status: ${response.status}`);
      }

    } catch (error) {
      instance.health.consecutiveFailures++;
      
      if (instance.health.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        instance.health.status = 'unhealthy';
        console.warn(`🚨 Service instance marked unhealthy: ${instance.name} at ${instance.host}:${instance.port} (${instance.health.consecutiveFailures} consecutive failures)`);
      }
    }

    instance.health.lastCheck = Date.now();
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      const healthCheckPromises: Promise<void>[] = [];

      for (const instances of this.services.values()) {
        for (const instance of instances) {
          // Skip recent checks
          if (Date.now() - instance.health.lastCheck < this.config.healthCheckInterval) {
            continue;
          }

          healthCheckPromises.push(this.checkServiceHealth(instance));
        }
      }

      try {
        await Promise.allSettled(healthCheckPromises);
      } catch (error) {
        console.error('Error during health checks:', error);
      }

      // Remove stale instances (no heartbeat for extended period)
      this.removeStaleInstances();

    }, this.config.healthCheckInterval);
  }

  /**
   * Remove instances that haven't sent heartbeats
   */
  private removeStaleInstances(): void {
    const staleTimeout = this.config.heartbeatTimeout * 2; // Double the heartbeat timeout
    const now = Date.now();

    for (const [serviceName, instances] of this.services.entries()) {
      const staleInstances = instances.filter(instance => 
        now - instance.lastHeartbeat > staleTimeout
      );

      for (const staleInstance of staleInstances) {
        this.deregisterService(serviceName, staleInstance.id);
        console.warn(`🗑️ Removed stale service instance: ${serviceName} (${staleInstance.host}:${staleInstance.port})`);
      }
    }
  }

  /**
   * Shutdown service discovery
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.services.clear();
    this.roundRobinCounters.clear();
    
    console.log('🛑 Service Discovery Service shut down');
  }

  /**
   * Get all registered services
   */
  getAllServices(): Record<string, ServiceInstance[]> {
    const result: Record<string, ServiceInstance[]> = {};
    
    for (const [serviceName, instances] of this.services.entries()) {
      result[serviceName] = [...instances]; // Return copy to prevent external modification
    }

    return result;
  }
}

// Global singleton instance
export const serviceDiscoveryService = new ServiceDiscoveryService();