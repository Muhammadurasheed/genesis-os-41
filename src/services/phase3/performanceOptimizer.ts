// ============================================================
// Phase 3: Performance Optimization Engine - Advanced Container Features
// Container warm-up, pooling, memory optimization, and resource allocation
// ============================================================

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { dockerContainerService } from '../core/dockerContainerService';

export interface PerformanceConfig {
  warmUpPoolSize: number;
  maxPoolSize: number;
  sessionReuseTimeout: number; // minutes
  memoryThreshold: number; // percentage
  cpuThreshold: number; // percentage
  garbageCollectionInterval: number; // minutes
  optimizationStrategy: 'aggressive' | 'balanced' | 'conservative';
}

export interface ContainerPool {
  poolId: string;
  imageType: string;
  warmContainers: WarmContainer[];
  activeContainers: ActiveContainer[];
  poolSize: number;
  maxSize: number;
  creationTemplate: ContainerTemplate;
}

export interface WarmContainer {
  containerId: string;
  imageType: string;
  created: Date;
  lastUsed: Date;
  warmUpCompleted: boolean;
  resourceUsage: ResourceMetrics;
  readyForUse: boolean;
}

export interface ActiveContainer {
  containerId: string;
  agentId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  resourceUsage: ResourceMetrics;
  performanceMetrics: PerformanceMetrics;
}

export interface ContainerTemplate {
  image: string;
  resources: {
    memory: number;
    cpus: number;
    disk: number;
  };
  environment: Record<string, string>;
  warmUpCommands: string[];
  healthCheckCommand: string;
  networks: string[];
}

export interface ResourceMetrics {
  cpu: number; // percentage
  memory: number; // MB
  disk: number; // MB
  network: number; // MB/s
  timestamp: Date;
}

export interface PerformanceMetrics {
  startupTime: number; // ms
  responseTime: number; // ms
  throughput: number; // requests/minute
  errorRate: number; // percentage
  memoryLeaks: number;
  gcFrequency: number; // per hour
}

export interface OptimizationRecommendation {
  type: 'scale_up' | 'scale_down' | 'memory_cleanup' | 'session_restart' | 'pool_adjust';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  estimatedImprovement: number; // percentage
  resourcesRequired: ResourceMetrics;
}

export interface BrowserSessionCache {
  sessionId: string;
  containerId: string;
  browserType: 'chromium' | 'firefox' | 'webkit';
  lastUsed: Date;
  pageCache: PageCacheEntry[];
  cookieStore: Record<string, any>;
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;
  tabs: BrowserTab[];
}

export interface PageCacheEntry {
  url: string;
  content: string;
  resources: CachedResource[];
  lastLoaded: Date;
  cacheSize: number; // bytes
}

export interface CachedResource {
  url: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'document';
  content: Buffer;
  headers: Record<string, string>;
  expires: Date;
}

export interface BrowserTab {
  tabId: string;
  url: string;
  title: string;
  active: boolean;
  cached: boolean;
  lastActivity: Date;
}

class PerformanceOptimizer extends EventEmitter {
  private config: PerformanceConfig;
  private containerPools: Map<string, ContainerPool> = new Map();
  private sessionCache: Map<string, BrowserSessionCache> = new Map();
  private resourceMonitor: ResourceMonitor;
  private garbageCollector: GarbageCollector;
  private optimizationEngine: OptimizationEngine;

  constructor(config: PerformanceConfig) {
    super();
    this.config = config;
    this.resourceMonitor = new ResourceMonitor();
    this.garbageCollector = new GarbageCollector(config);
    this.optimizationEngine = new OptimizationEngine(config);
    console.log('⚡ Performance Optimizer initializing...');
    this.startOptimizationLoop();
  }

  // Container Pool Management
  async createContainerPool(imageType: string, template: ContainerTemplate): Promise<string> {
    const poolId = uuidv4();
    console.log(`🏊 Creating container pool: ${poolId} for image ${imageType}`);

    const pool: ContainerPool = {
      poolId,
      imageType,
      warmContainers: [],
      activeContainers: [],
      poolSize: 0,
      maxSize: this.config.maxPoolSize,
      creationTemplate: template
    };

    this.containerPools.set(poolId, pool);

    // Pre-warm containers
    await this.preWarmContainers(pool, this.config.warmUpPoolSize);

    this.emit('poolCreated', pool);
    return poolId;
  }

  // Container Warm-up
  private async preWarmContainers(pool: ContainerPool, count: number): Promise<void> {
    console.log(`🔥 Pre-warming ${count} containers for pool ${pool.poolId}`);

    const warmUpPromises = Array.from({ length: count }, () => 
      this.createWarmContainer(pool)
    );

    await Promise.allSettled(warmUpPromises);
  }

  private async createWarmContainer(pool: ContainerPool): Promise<WarmContainer> {
    const containerId = await dockerContainerService.createContainer({
      image: pool.creationTemplate.image,
      resources: pool.creationTemplate.resources,
      environment: {
        ...pool.creationTemplate.environment,
        PREWARMED: 'true',
        POOL_ID: pool.poolId
      },
      networks: pool.creationTemplate.networks,
      name: `warm-${pool.imageType}-${Date.now()}`
    });

    // Start container
    await dockerContainerService.startContainer(containerId);

    // Execute warm-up commands
    for (const command of pool.creationTemplate.warmUpCommands) {
      await dockerContainerService.executeCommand(containerId, command.split(' '));
    }

    const warmContainer: WarmContainer = {
      containerId,
      imageType: pool.imageType,
      created: new Date(),
      lastUsed: new Date(),
      warmUpCompleted: true,
      resourceUsage: await this.getResourceMetrics(containerId),
      readyForUse: true
    };

    pool.warmContainers.push(warmContainer);
    pool.poolSize++;

    console.log(`✅ Warm container ready: ${containerId}`);
    return warmContainer;
  }

  // Fast Container Allocation
  async allocateContainer(imageType: string, agentId: string): Promise<string> {
    const pool = Array.from(this.containerPools.values())
      .find(p => p.imageType === imageType);

    if (!pool) {
      throw new Error(`No pool found for image type: ${imageType}`);
    }

    let container: WarmContainer | null = null;

    // Try to get warm container
    if (pool.warmContainers.length > 0) {
      container = pool.warmContainers.shift()!;
      console.log(`🚀 Allocated warm container: ${container.containerId} to agent ${agentId}`);
    } else {
      // Create new container if pool is empty
      container = await this.createWarmContainer(pool);
      console.log(`🆕 Created new container: ${container.containerId} for agent ${agentId}`);
    }

    // Move to active containers
    const activeContainer: ActiveContainer = {
      containerId: container.containerId,
      agentId,
      sessionId: uuidv4(),
      startTime: new Date(),
      lastActivity: new Date(),
      resourceUsage: container.resourceUsage,
      performanceMetrics: {
        startupTime: 0, // Already warmed up
        responseTime: 0,
        throughput: 0,
        errorRate: 0,
        memoryLeaks: 0,
        gcFrequency: 0
      }
    };

    pool.activeContainers.push(activeContainer);

    // Maintain pool size by creating replacement
    if (pool.warmContainers.length < this.config.warmUpPoolSize) {
      setImmediate(() => this.createWarmContainer(pool));
    }

    this.emit('containerAllocated', activeContainer);
    return container.containerId;
  }

  // Browser Session Reuse
  async reuseExistingSession(agentId: string, browserType: 'chromium' | 'firefox' | 'webkit'): Promise<string | null> {
    const reusableSessions = Array.from(this.sessionCache.values()).filter(session => 
      session.browserType === browserType && 
      Date.now() - session.lastUsed.getTime() < (this.config.sessionReuseTimeout * 60 * 1000)
    );

    if (reusableSessions.length === 0) {
      return null;
    }

    // Select best session based on cache hit rate
    const bestSession = reusableSessions.reduce((best, current) => 
      current.pageCache.length > best.pageCache.length ? current : best
    );

    bestSession.lastUsed = new Date();
    console.log(`♻️ Reusing browser session: ${bestSession.sessionId} for agent ${agentId}`);
    
    this.emit('sessionReused', bestSession);
    return bestSession.sessionId;
  }

  // Memory Optimization
  async optimizeMemory(containerId: string): Promise<void> {
    console.log(`🧹 Optimizing memory for container: ${containerId}`);

    // Force garbage collection
    await dockerContainerService.executeCommand(containerId, [
      'python3', '-c', 'import gc; gc.collect()'
    ]);

    // Clear browser cache if applicable
    await this.clearBrowserCache(containerId);

    // Compress memory
    await this.compressMemory(containerId);

    this.emit('memoryOptimized', { containerId });
  }

  private async clearBrowserCache(containerId: string): Promise<void> {
    // Clear browser cache through automation
    await dockerContainerService.executeCommand(containerId, [
      'python3', '-c', `
import asyncio
from playwright.async_api import async_playwright

async def clear_cache():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        await context.clear_cookies()
        await context.clear_permissions()
        await browser.close()

asyncio.run(clear_cache())
`
    ]);
  }

  private async compressMemory(containerId: string): Promise<void> {
    // Compress memory using container memory management
    await dockerContainerService.executeCommand(containerId, [
      'sh', '-c', 'echo 3 > /proc/sys/vm/drop_caches'
    ]);
  }

  // CPU Resource Allocation
  async optimizeCPUAllocation(): Promise<void> {
    console.log('⚡ Optimizing CPU allocation across containers...');

    const allContainers = dockerContainerService.getAllContainers();
    const cpuMetrics = await Promise.all(
      allContainers.map(async (container) => ({
        containerId: container.containerId,
        cpuUsage: (await this.getResourceMetrics(container.containerId)).cpu
      }))
    );

    // Redistribute CPU based on usage
    for (const metric of cpuMetrics) {
      if (metric.cpuUsage > this.config.cpuThreshold) {
        await this.increaseCPUAllocation(metric.containerId);
      } else if (metric.cpuUsage < 10) {
        await this.decreaseCPUAllocation(metric.containerId);
      }
    }

    this.emit('cpuOptimized', cpuMetrics);
  }

  private async increaseCPUAllocation(containerId: string): Promise<void> {
    // Increase CPU allocation
    await dockerContainerService.updateContainer(containerId, {
      cpus: '2.0' // Increase to 2 cores
    });
  }

  private async decreaseCPUAllocation(containerId: string): Promise<void> {
    // Decrease CPU allocation
    await dockerContainerService.updateContainer(containerId, {
      cpus: '0.5' // Decrease to 0.5 cores
    });
  }

  // Network Bandwidth Management
  async optimizeNetworkBandwidth(): Promise<void> {
    console.log('🌐 Optimizing network bandwidth allocation...');

    const activeContainers = Array.from(this.containerPools.values())
      .flatMap(pool => pool.activeContainers);

    // Prioritize based on activity
    for (const container of activeContainers) {
      const networkUsage = container.resourceUsage.network;
      
      if (networkUsage > 100) { // High usage
        await this.prioritizeNetworkTraffic(container.containerId, 'high');
      } else if (networkUsage < 10) { // Low usage
        await this.prioritizeNetworkTraffic(container.containerId, 'low');
      }
    }

    this.emit('networkOptimized');
  }

  private async prioritizeNetworkTraffic(containerId: string, priority: 'high' | 'medium' | 'low'): Promise<void> {
    const bandwidthLimit = priority === 'high' ? '1000mbit' : priority === 'medium' ? '500mbit' : '100mbit';
    
    await dockerContainerService.executeCommand(containerId, [
      'tc', 'qdisc', 'add', 'dev', 'eth0', 'root', 'tbf', 'rate', bandwidthLimit, 'burst', '32kbit', 'latency', '400ms'
    ]);
  }

  // Performance Analytics
  async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    console.log('📊 Generating optimization recommendations...');

    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze container pools
    for (const pool of this.containerPools.values()) {
      const poolRecommendations = await this.analyzePoolPerformance(pool);
      recommendations.push(...poolRecommendations);
    }

    // Analyze resource usage
    const resourceRecommendations = await this.analyzeResourceUsage();
    recommendations.push(...resourceRecommendations);

    // Sort by priority and impact
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || 
             b.estimatedImprovement - a.estimatedImprovement;
    });

    this.emit('recommendationsGenerated', recommendations);
    return recommendations;
  }

  private async analyzePoolPerformance(pool: ContainerPool): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check pool utilization
    const utilizationRate = pool.activeContainers.length / pool.maxSize;
    
    if (utilizationRate > 0.8) {
      recommendations.push({
        type: 'scale_up',
        priority: 'high',
        description: `Pool ${pool.poolId} is at ${Math.round(utilizationRate * 100)}% capacity`,
        impact: 'Increase pool size to prevent container allocation delays',
        estimatedImprovement: 25,
        resourcesRequired: {
          cpu: 20,
          memory: 512,
          disk: 100,
          network: 10,
          timestamp: new Date()
        }
      });
    }

    if (utilizationRate < 0.2 && pool.warmContainers.length > 2) {
      recommendations.push({
        type: 'scale_down',
        priority: 'medium',
        description: `Pool ${pool.poolId} is underutilized at ${Math.round(utilizationRate * 100)}%`,
        impact: 'Reduce pool size to save resources',
        estimatedImprovement: 15,
        resourcesRequired: {
          cpu: -10,
          memory: -256,
          disk: -50,
          network: -5,
          timestamp: new Date()
        }
      });
    }

    return recommendations;
  }

  private async analyzeResourceUsage(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Get system-wide metrics
    const systemMetrics = await this.getSystemMetrics();
    
    if (systemMetrics.memory > this.config.memoryThreshold) {
      recommendations.push({
        type: 'memory_cleanup',
        priority: 'critical',
        description: `System memory usage at ${systemMetrics.memory}%`,
        impact: 'Perform garbage collection and cache cleanup',
        estimatedImprovement: 30,
        resourcesRequired: {
          cpu: 5,
          memory: -1024,
          disk: 0,
          network: 0,
          timestamp: new Date()
        }
      });
    }

    return recommendations;
  }

  // Optimization Loop
  private startOptimizationLoop(): void {
    setInterval(async () => {
      try {
        await this.performOptimizationCycle();
      } catch (error) {
        console.error('Optimization cycle failed:', error);
      }
    }, this.config.garbageCollectionInterval * 60 * 1000);
  }

  private async performOptimizationCycle(): Promise<void> {
    console.log('🔄 Starting optimization cycle...');

    // Garbage collection
    await this.garbageCollector.collect();

    // Resource optimization
    await this.optimizeCPUAllocation();
    await this.optimizeNetworkBandwidth();

    // Generate recommendations
    const recommendations = await this.generateOptimizationRecommendations();
    
    // Apply critical recommendations automatically
    const criticalRecommendations = recommendations.filter(r => r.priority === 'critical');
    for (const recommendation of criticalRecommendations) {
      await this.applyRecommendation(recommendation);
    }

    this.emit('optimizationCycleCompleted', { recommendations });
  }

  private async applyRecommendation(recommendation: OptimizationRecommendation): Promise<void> {
    console.log(`🔧 Applying recommendation: ${recommendation.type}`);
    
    switch (recommendation.type) {
      case 'memory_cleanup':
        await this.performGlobalMemoryCleanup();
        break;
      case 'scale_up':
        // Implementation for scaling up
        break;
      case 'scale_down':
        // Implementation for scaling down
        break;
      default:
        console.log(`Unknown recommendation type: ${recommendation.type}`);
    }
  }

  private async performGlobalMemoryCleanup(): Promise<void> {
    const allContainers = dockerContainerService.getAllContainers();
    const cleanupPromises = allContainers.map(container => 
      this.optimizeMemory(container.containerId)
    );
    await Promise.allSettled(cleanupPromises);
  }

  // Helper Methods
  private async getResourceMetrics(containerId: string): Promise<ResourceMetrics> {
    const stats = await dockerContainerService.getContainerStats(containerId);
    return {
      cpu: stats.cpu_percent || 0,
      memory: stats.memory_usage || 0,
      disk: stats.disk_usage || 0,
      network: stats.network_io || 0,
      timestamp: new Date()
    };
  }

  private async getSystemMetrics(): Promise<ResourceMetrics> {
    // Get system-wide resource metrics
    return {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      timestamp: new Date()
    };
  }

  // Public Management Methods
  getPoolStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [poolId, pool] of this.containerPools) {
      stats[poolId] = {
        imageType: pool.imageType,
        warmContainers: pool.warmContainers.length,
        activeContainers: pool.activeContainers.length,
        totalSize: pool.poolSize,
        maxSize: pool.maxSize,
        utilizationRate: pool.activeContainers.length / pool.maxSize
      };
    }
    
    return stats;
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Performance Optimizer...');
    
    // Stop all warm containers
    for (const pool of this.containerPools.values()) {
      for (const container of pool.warmContainers) {
        await dockerContainerService.stopContainer(container.containerId);
      }
    }
    
    this.containerPools.clear();
    this.sessionCache.clear();
  }
}

// Supporting Classes
class ResourceMonitor {
  async getMetrics(containerId: string): Promise<ResourceMetrics> {
    // Implementation for resource monitoring
    return {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      timestamp: new Date()
    };
  }
}

class GarbageCollector {
  private config: PerformanceConfig;

  constructor(config: PerformanceConfig) {
    this.config = config;
  }

  async collect(): Promise<void> {
    console.log('🗑️ Running garbage collection...');
    // Implementation for garbage collection
  }
}

class OptimizationEngine {
  private config: PerformanceConfig;

  constructor(config: PerformanceConfig) {
    this.config = config;
  }

  async optimize(): Promise<void> {
    console.log('⚡ Running optimization engine...');
    // Implementation for optimization algorithms
  }
}

// Create singleton instance
export const performanceOptimizer = new PerformanceOptimizer({
  warmUpPoolSize: 3,
  maxPoolSize: 20,
  sessionReuseTimeout: 30, // 30 minutes
  memoryThreshold: 80, // 80%
  cpuThreshold: 75, // 75%
  garbageCollectionInterval: 15, // 15 minutes
  optimizationStrategy: 'balanced'
});

export default performanceOptimizer;