/**
 * Phase 3: Enterprise Deployment Service
 * Advanced deployment patterns with auto-scaling, blue-green deployments, and production monitoring
 */

import { v4 as uuid } from 'uuid';
import axios from 'axios';

interface DeploymentConfig {
  guildId: string;
  deploymentStrategy: 'blue-green' | 'rolling' | 'canary' | 'immutable';
  autoScaling: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetCPU: number;
    targetMemory: number;
  };
  healthChecks: {
    path: string;
    intervalSeconds: number;
    timeoutSeconds: number;
    failureThreshold: number;
  };
  rollbackPolicy: {
    enabled: boolean;
    automaticThreshold: number; // Error rate threshold for automatic rollback
    maxVersionsToKeep: number;
  };
  loadBalancing: {
    algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash';
    sessionAffinity: boolean;
  };
  monitoring: {
    metricsEnabled: boolean;
    loggingLevel: 'error' | 'warn' | 'info' | 'debug';
    alerting: {
      enabled: boolean;
      errorRateThreshold: number;
      responseTimeThreshold: number;
    };
  };
}

interface DeploymentInstance {
  id: string;
  version: string;
  status: 'starting' | 'healthy' | 'unhealthy' | 'terminating';
  endpoint: string;
  createdAt: Date;
  healthScore: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    requests: number;
  };
}

interface DeploymentEnvironment {
  id: string;
  name: string;
  type: 'production' | 'staging' | 'development';
  instances: DeploymentInstance[];
  loadBalancerEndpoint: string;
  status: 'active' | 'deploying' | 'rolling-back' | 'maintenance';
  configuration: DeploymentConfig;
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    throughput: number;
    uptime: number;
  };
}

interface DeploymentPipeline {
  id: string;
  guildId: string;
  currentVersion: string;
  targetVersion: string;
  environments: Map<string, DeploymentEnvironment>;
  status: 'idle' | 'deploying' | 'rolling-back' | 'failed';
  deploymentHistory: Array<{
    version: string;
    timestamp: Date;
    status: 'success' | 'failed' | 'rolled-back';
    duration: number;
    triggeredBy: string;
  }>;
}

export class EnterpriseDeploymentService {
  private deploymentPipelines: Map<string, DeploymentPipeline> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private autoScalers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.startContinuousMonitoring();
    console.log('🚀 Enterprise Deployment Service initialized');
  }

  async createDeploymentPipeline(
    guildId: string,
    config: Partial<DeploymentConfig> = {}
  ): Promise<string> {
    const pipelineId = `pipeline-${uuid()}`;
    
    const defaultConfig: DeploymentConfig = {
      guildId,
      deploymentStrategy: 'blue-green',
      autoScaling: {
        enabled: true,
        minInstances: 2,
        maxInstances: 10,
        targetCPU: 70,
        targetMemory: 80
      },
      healthChecks: {
        path: '/health',
        intervalSeconds: 30,
        timeoutSeconds: 10,
        failureThreshold: 3
      },
      rollbackPolicy: {
        enabled: true,
        automaticThreshold: 0.05, // 5% error rate
        maxVersionsToKeep: 5
      },
      loadBalancing: {
        algorithm: 'round-robin',
        sessionAffinity: false
      },
      monitoring: {
        metricsEnabled: true,
        loggingLevel: 'info',
        alerting: {
          enabled: true,
          errorRateThreshold: 0.01, // 1%
          responseTimeThreshold: 2000 // 2 seconds
        }
      },
      ...config
    };

    // Create production environment
    const productionEnv = await this.createEnvironment(
      `${pipelineId}-prod`,
      'production',
      defaultConfig
    );

    // Create staging environment
    const stagingEnv = await this.createEnvironment(
      `${pipelineId}-staging`,
      'staging',
      { ...defaultConfig, autoScaling: { ...defaultConfig.autoScaling, maxInstances: 3 } }
    );

    const pipeline: DeploymentPipeline = {
      id: pipelineId,
      guildId,
      currentVersion: '1.0.0',
      targetVersion: '1.0.0',
      environments: new Map([
        ['production', productionEnv],
        ['staging', stagingEnv]
      ]),
      status: 'idle',
      deploymentHistory: []
    };

    this.deploymentPipelines.set(pipelineId, pipeline);

    // Start auto-scaling for this pipeline
    this.startAutoScaling(pipelineId);

    console.log(`✅ Created deployment pipeline ${pipelineId} for guild ${guildId}`);
    return pipelineId;
  }

  private async createEnvironment(
    envId: string,
    type: 'production' | 'staging' | 'development',
    config: DeploymentConfig
  ): Promise<DeploymentEnvironment> {
    
    const initialInstances = config.autoScaling.minInstances;
    const instances: DeploymentInstance[] = [];

    // Create initial instances
    for (let i = 0; i < initialInstances; i++) {
      const instance = await this.createInstance(envId, '1.0.0');
      instances.push(instance);
    }

    const environment: DeploymentEnvironment = {
      id: envId,
      name: `${type}-environment`,
      type,
      instances,
      loadBalancerEndpoint: `https://${envId}.genesis-ai.com`,
      status: 'active',
      configuration: config,
      metrics: {
        totalRequests: 0,
        errorRate: 0,
        averageResponseTime: 150,
        throughput: 0,
        uptime: 100
      }
    };

    return environment;
  }

  private async createInstance(
    envId: string,
    version: string
  ): Promise<DeploymentInstance> {
    const instanceId = `${envId}-instance-${uuid().slice(0, 8)}`;
    
    const instance: DeploymentInstance = {
      id: instanceId,
      version,
      status: 'starting',
      endpoint: `https://${instanceId}.genesis-ai.com`,
      createdAt: new Date(),
      healthScore: 0,
      resourceUsage: {
        cpu: 10,
        memory: 20,
        requests: 0
      }
    };

    // Simulate instance startup
    setTimeout(() => {
      instance.status = 'healthy';
      instance.healthScore = 95 + Math.random() * 5;
    }, 5000);

    return instance;
  }

  async deployToEnvironment(
    pipelineId: string,
    environmentType: 'production' | 'staging',
    version: string
  ): Promise<void> {
    const pipeline = this.deploymentPipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const environment = pipeline.environments.get(environmentType);
    if (!environment) {
      throw new Error(`Environment ${environmentType} not found`);
    }

    console.log(`🚀 Starting ${environment.configuration.deploymentStrategy} deployment to ${environmentType}`);
    
    pipeline.status = 'deploying';
    pipeline.targetVersion = version;
    environment.status = 'deploying';

    const deploymentStart = Date.now();

    try {
      switch (environment.configuration.deploymentStrategy) {
        case 'blue-green':
          await this.executeBlueGreenDeployment(environment, version);
          break;
        case 'rolling':
          await this.executeRollingDeployment(environment, version);
          break;
        case 'canary':
          await this.executeCanaryDeployment(environment, version);
          break;
        case 'immutable':
          await this.executeImmutableDeployment(environment, version);
          break;
      }

      // Update pipeline after successful deployment
      pipeline.currentVersion = version;
      pipeline.status = 'idle';
      environment.status = 'active';

      // Record deployment history
      pipeline.deploymentHistory.push({
        version,
        timestamp: new Date(),
        status: 'success',
        duration: Date.now() - deploymentStart,
        triggeredBy: 'system'
      });

      console.log(`✅ Successfully deployed version ${version} to ${environmentType}`);

    } catch (error) {
      console.error(`❌ Deployment failed:`, error);
      
      pipeline.status = 'failed';
      environment.status = 'active'; // Revert to previous state

      // Record failed deployment
      pipeline.deploymentHistory.push({
        version,
        timestamp: new Date(),
        status: 'failed',
        duration: Date.now() - deploymentStart,
        triggeredBy: 'system'
      });

      // Automatic rollback if enabled
      if (environment.configuration.rollbackPolicy.enabled) {
        await this.rollbackEnvironment(pipelineId, environmentType);
      }

      throw error;
    }
  }

  private async executeBlueGreenDeployment(
    environment: DeploymentEnvironment,
    version: string
  ): Promise<void> {
    console.log('🔵 Executing blue-green deployment');

    // Create new "green" instances
    const greenInstances: DeploymentInstance[] = [];
    const targetInstanceCount = environment.instances.length;

    for (let i = 0; i < targetInstanceCount; i++) {
      const greenInstance = await this.createInstance(environment.id, version);
      greenInstances.push(greenInstance);
    }

    // Wait for green instances to be healthy
    await this.waitForInstancesHealthy(greenInstances);

    // Health check on green instances
    const allHealthy = await this.performHealthChecks(greenInstances, environment.configuration.healthChecks);
    
    if (!allHealthy) {
      throw new Error('Green instances failed health checks');
    }

    // Switch traffic to green instances (simulate load balancer switch)
    console.log('🔄 Switching traffic to green instances');
    await this.switchTraffic(environment, greenInstances);

    // Terminate old "blue" instances after successful traffic switch
    setTimeout(async () => {
      await this.terminateInstances(environment.instances);
    }, 30000); // 30 second grace period

    // Update environment with new instances
    environment.instances = greenInstances;
  }

  private async executeRollingDeployment(
    environment: DeploymentEnvironment,
    version: string
  ): Promise<void> {
    console.log('🔄 Executing rolling deployment');

    const batchSize = Math.max(1, Math.floor(environment.instances.length / 3));
    
    for (let i = 0; i < environment.instances.length; i += batchSize) {
      const batch = environment.instances.slice(i, i + batchSize);
      
      // Create new instances for this batch
      const newInstances: DeploymentInstance[] = [];
      for (const oldInstance of batch) {
        const newInstance = await this.createInstance(environment.id, version);
        newInstances.push(newInstance);
      }

      // Wait for new instances to be healthy
      await this.waitForInstancesHealthy(newInstances);

      // Health check
      const allHealthy = await this.performHealthChecks(newInstances, environment.configuration.healthChecks);
      if (!allHealthy) {
        throw new Error(`Rolling deployment batch ${i / batchSize + 1} failed health checks`);
      }

      // Replace old instances with new ones in environment
      for (let j = 0; j < batch.length; j++) {
        const oldIndex = environment.instances.findIndex(inst => inst.id === batch[j].id);
        if (oldIndex !== -1) {
          environment.instances[oldIndex] = newInstances[j];
        }
      }

      // Terminate old instances
      await this.terminateInstances(batch);

      console.log(`✅ Rolling deployment batch ${i / batchSize + 1} completed`);
      
      // Wait between batches
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async executeCanaryDeployment(
    environment: DeploymentEnvironment,
    version: string
  ): Promise<void> {
    console.log('🐤 Executing canary deployment');

    // Deploy canary instance (5% of traffic)
    const canaryInstance = await this.createInstance(environment.id, version);
    await this.waitForInstancesHealthy([canaryInstance]);

    // Monitor canary for 10 minutes
    console.log('📊 Monitoring canary instance...');
    const canaryMetrics = await this.monitorCanaryInstance(canaryInstance, 600000); // 10 minutes

    if (canaryMetrics.errorRate > environment.configuration.monitoring.alerting.errorRateThreshold) {
      await this.terminateInstances([canaryInstance]);
      throw new Error('Canary deployment failed due to high error rate');
    }

    // Gradually increase traffic to canary (20%, 50%, 100%)
    for (const trafficPercentage of [20, 50, 100]) {
      console.log(`🔄 Routing ${trafficPercentage}% traffic to canary`);
      await this.adjustCanaryTraffic(environment, canaryInstance, trafficPercentage);
      
      // Monitor for 5 minutes at each stage
      const metrics = await this.monitorCanaryInstance(canaryInstance, 300000);
      if (metrics.errorRate > environment.configuration.monitoring.alerting.errorRateThreshold) {
        await this.rollbackCanary(environment, canaryInstance);
        throw new Error(`Canary rollback triggered at ${trafficPercentage}% traffic`);
      }
    }

    // If canary is successful, roll out to all instances
    await this.executeRollingDeployment(environment, version);
  }

  private async executeImmutableDeployment(
    environment: DeploymentEnvironment,
    version: string
  ): Promise<void> {
    console.log('🔒 Executing immutable deployment');

    // Create completely new environment with new instances
    const newInstances: DeploymentInstance[] = [];
    
    for (let i = 0; i < environment.instances.length; i++) {
      const newInstance = await this.createInstance(environment.id, version);
      newInstances.push(newInstance);
    }

    // Wait for all instances to be healthy
    await this.waitForInstancesHealthy(newInstances);

    // Perform health checks
    const allHealthy = await this.performHealthChecks(newInstances, environment.configuration.healthChecks);
    if (!allHealthy) {
      await this.terminateInstances(newInstances);
      throw new Error('Immutable deployment failed health checks');
    }

    // Switch all traffic to new instances
    await this.switchTraffic(environment, newInstances);

    // Terminate old instances
    await this.terminateInstances(environment.instances);

    // Update environment
    environment.instances = newInstances;
  }

  private async waitForInstancesHealthy(instances: DeploymentInstance[]): Promise<void> {
    const timeout = 300000; // 5 minutes
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const allHealthy = instances.every(instance => instance.status === 'healthy');
      if (allHealthy) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout waiting for instances to become healthy');
  }

  private async performHealthChecks(
    instances: DeploymentInstance[],
    healthConfig: DeploymentConfig['healthChecks']
  ): Promise<boolean> {
    
    for (const instance of instances) {
      let failures = 0;
      
      for (let i = 0; i < 3; i++) { // Perform 3 health checks
        try {
          // Simulate health check HTTP request
          const isHealthy = Math.random() > 0.05; // 95% success rate
          
          if (isHealthy) {
            instance.healthScore = 95 + Math.random() * 5;
            break;
          } else {
            failures++;
            if (failures >= healthConfig.failureThreshold) {
              instance.status = 'unhealthy';
              return false;
            }
          }
        } catch (error) {
          failures++;
          if (failures >= healthConfig.failureThreshold) {
            instance.status = 'unhealthy';
            return false;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, healthConfig.intervalSeconds * 1000));
      }
    }

    return true;
  }

  private async switchTraffic(
    environment: DeploymentEnvironment,
    newInstances: DeploymentInstance[]
  ): Promise<void> {
    console.log('🔄 Switching load balancer traffic');
    
    // Simulate load balancer configuration update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update load balancer endpoint targets
    environment.loadBalancerEndpoint = `https://${environment.id}-v${newInstances[0].version.replace('.', '-')}.genesis-ai.com`;
  }

  private async terminateInstances(instances: DeploymentInstance[]): Promise<void> {
    for (const instance of instances) {
      instance.status = 'terminating';
      console.log(`🔥 Terminating instance ${instance.id}`);
    }
    
    // Simulate graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  private async monitorCanaryInstance(
    canaryInstance: DeploymentInstance,
    durationMs: number
  ): Promise<{ errorRate: number; responseTime: number; throughput: number }> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate canary metrics
        const metrics = {
          errorRate: Math.random() * 0.02, // 0-2% error rate
          responseTime: 100 + Math.random() * 200, // 100-300ms response time
          throughput: 50 + Math.random() * 100 // 50-150 requests/sec
        };
        
        canaryInstance.resourceUsage = {
          cpu: 20 + Math.random() * 40,
          memory: 30 + Math.random() * 30,
          requests: Math.floor(metrics.throughput * (durationMs / 1000))
        };
        
        resolve(metrics);
      }, Math.min(durationMs, 10000)); // Max 10 seconds for simulation
    });
  }

  private async adjustCanaryTraffic(
    environment: DeploymentEnvironment,
    canaryInstance: DeploymentInstance,
    percentage: number
  ): Promise<void> {
    console.log(`🎚️ Adjusting canary traffic to ${percentage}%`);
    
    // Simulate load balancer weight adjustment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update canary instance request load
    canaryInstance.resourceUsage.requests = Math.floor(
      canaryInstance.resourceUsage.requests * (percentage / 100)
    );
  }

  private async rollbackCanary(
    environment: DeploymentEnvironment,
    canaryInstance: DeploymentInstance
  ): Promise<void> {
    console.log('⏪ Rolling back canary deployment');
    
    // Remove canary from load balancer
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Terminate canary instance
    await this.terminateInstances([canaryInstance]);
  }

  async rollbackEnvironment(
    pipelineId: string,
    environmentType: 'production' | 'staging'
  ): Promise<void> {
    const pipeline = this.deploymentPipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const environment = pipeline.environments.get(environmentType);
    if (!environment) {
      throw new Error(`Environment ${environmentType} not found`);
    }

    console.log(`⏪ Rolling back ${environmentType} environment`);
    
    pipeline.status = 'rolling-back';
    environment.status = 'deploying';

    // Find previous successful version
    const previousDeployment = pipeline.deploymentHistory
      .filter(dep => dep.status === 'success')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[1]; // Second most recent

    if (!previousDeployment) {
      throw new Error('No previous version found for rollback');
    }

    const rollbackStart = Date.now();

    try {
      // Execute rollback using blue-green strategy (fastest)
      await this.executeBlueGreenDeployment(environment, previousDeployment.version);

      pipeline.currentVersion = previousDeployment.version;
      pipeline.status = 'idle';
      environment.status = 'active';

      // Record rollback in history
      pipeline.deploymentHistory.push({
        version: previousDeployment.version,
        timestamp: new Date(),
        status: 'rolled-back',
        duration: Date.now() - rollbackStart,
        triggeredBy: 'automatic'
      });

      console.log(`✅ Successfully rolled back to version ${previousDeployment.version}`);

    } catch (error) {
      console.error(`❌ Rollback failed:`, error);
      pipeline.status = 'failed';
      environment.status = 'maintenance';
      throw error;
    }
  }

  private startAutoScaling(pipelineId: string): void {
    const interval = setInterval(async () => {
      try {
        await this.performAutoScaling(pipelineId);
      } catch (error) {
        console.error(`Auto-scaling error for pipeline ${pipelineId}:`, error);
      }
    }, 60000); // Check every minute

    this.autoScalers.set(pipelineId, interval);
  }

  private async performAutoScaling(pipelineId: string): Promise<void> {
    const pipeline = this.deploymentPipelines.get(pipelineId);
    if (!pipeline) return;

    for (const [envType, environment] of pipeline.environments) {
      if (!environment.configuration.autoScaling.enabled) continue;

      const { minInstances, maxInstances, targetCPU, targetMemory } = environment.configuration.autoScaling;
      const currentInstances = environment.instances.length;

      // Calculate average resource usage
      const avgCPU = environment.instances.reduce((sum, inst) => sum + inst.resourceUsage.cpu, 0) / currentInstances;
      const avgMemory = environment.instances.reduce((sum, inst) => sum + inst.resourceUsage.memory, 0) / currentInstances;

      let targetInstanceCount = currentInstances;

      // Scale up if resource usage is high
      if (avgCPU > targetCPU || avgMemory > targetMemory) {
        targetInstanceCount = Math.min(maxInstances, currentInstances + 1);
      }

      // Scale down if resource usage is low
      if (avgCPU < targetCPU * 0.5 && avgMemory < targetMemory * 0.5 && currentInstances > minInstances) {
        targetInstanceCount = Math.max(minInstances, currentInstances - 1);
      }

      // Execute scaling
      if (targetInstanceCount !== currentInstances) {
        await this.scaleEnvironment(environment, targetInstanceCount);
        console.log(`📈 Auto-scaled ${envType} from ${currentInstances} to ${targetInstanceCount} instances`);
      }
    }
  }

  private async scaleEnvironment(environment: DeploymentEnvironment, targetCount: number): Promise<void> {
    const currentCount = environment.instances.length;

    if (targetCount > currentCount) {
      // Scale up - add instances
      const instancesToAdd = targetCount - currentCount;
      for (let i = 0; i < instancesToAdd; i++) {
        const newInstance = await this.createInstance(environment.id, environment.instances[0].version);
        environment.instances.push(newInstance);
      }
    } else if (targetCount < currentCount) {
      // Scale down - remove instances
      const instancesToRemove = currentCount - targetCount;
      const instancesToTerminate = environment.instances
        .sort((a, b) => a.resourceUsage.requests - b.resourceUsage.requests) // Remove least busy first
        .slice(0, instancesToRemove);

      await this.terminateInstances(instancesToTerminate);
      environment.instances = environment.instances.filter(
        inst => !instancesToTerminate.some(term => term.id === inst.id)
      );
    }
  }

  private startContinuousMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateEnvironmentMetrics();
      this.checkAlerts();
    }, 30000); // Every 30 seconds
  }

  private updateEnvironmentMetrics(): void {
    for (const pipeline of this.deploymentPipelines.values()) {
      for (const environment of pipeline.environments.values()) {
        // Simulate real-time metrics
        environment.metrics.totalRequests += Math.floor(Math.random() * 1000);
        environment.metrics.errorRate = Math.random() * 0.02; // 0-2%
        environment.metrics.averageResponseTime = 150 + Math.random() * 200; // 150-350ms
        environment.metrics.throughput = 100 + Math.random() * 200; // 100-300 req/sec
        environment.metrics.uptime = Math.max(95, environment.metrics.uptime - Math.random() * 0.1);

        // Update instance metrics
        for (const instance of environment.instances) {
          instance.resourceUsage.cpu = Math.max(5, Math.min(95, 
            instance.resourceUsage.cpu + (Math.random() - 0.5) * 10
          ));
          instance.resourceUsage.memory = Math.max(10, Math.min(90, 
            instance.resourceUsage.memory + (Math.random() - 0.5) * 10
          ));
          instance.resourceUsage.requests += Math.floor(Math.random() * 50);
          instance.healthScore = Math.max(70, Math.min(100, 
            instance.healthScore + (Math.random() - 0.5) * 5
          ));
        }
      }
    }
  }

  private checkAlerts(): void {
    for (const pipeline of this.deploymentPipelines.values()) {
      for (const [envType, environment] of pipeline.environments) {
        const { alerting } = environment.configuration.monitoring;
        
        if (!alerting.enabled) continue;

        // Check error rate threshold
        if (environment.metrics.errorRate > alerting.errorRateThreshold) {
          console.warn(`🚨 ALERT: High error rate in ${envType}: ${(environment.metrics.errorRate * 100).toFixed(2)}%`);
          
          // Trigger automatic rollback if in production and rollback is enabled
          if (envType === 'production' && environment.configuration.rollbackPolicy.enabled) {
            if (environment.metrics.errorRate > environment.configuration.rollbackPolicy.automaticThreshold) {
              console.warn(`⚠️ Triggering automatic rollback due to high error rate`);
              this.rollbackEnvironment(pipeline.id, 'production').catch(console.error);
            }
          }
        }

        // Check response time threshold
        if (environment.metrics.averageResponseTime > alerting.responseTimeThreshold) {
          console.warn(`🚨 ALERT: High response time in ${envType}: ${environment.metrics.averageResponseTime.toFixed(0)}ms`);
        }

        // Check instance health
        const unhealthyInstances = environment.instances.filter(inst => inst.healthScore < 80);
        if (unhealthyInstances.length > 0) {
          console.warn(`🚨 ALERT: ${unhealthyInstances.length} unhealthy instances in ${envType}`);
        }
      }
    }
  }

  getDeploymentStatus(pipelineId: string): any {
    const pipeline = this.deploymentPipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    return {
      pipeline: {
        id: pipeline.id,
        guildId: pipeline.guildId,
        currentVersion: pipeline.currentVersion,
        targetVersion: pipeline.targetVersion,
        status: pipeline.status
      },
      environments: Object.fromEntries(
        Array.from(pipeline.environments.entries()).map(([key, env]) => [
          key,
          {
            id: env.id,
            name: env.name,
            type: env.type,
            status: env.status,
            instanceCount: env.instances.length,
            healthyInstances: env.instances.filter(i => i.status === 'healthy').length,
            loadBalancerEndpoint: env.loadBalancerEndpoint,
            metrics: env.metrics,
            configuration: env.configuration
          }
        ])
      ),
      deploymentHistory: pipeline.deploymentHistory.slice(-10), // Last 10 deployments
      autoScalingStatus: this.autoScalers.has(pipelineId) ? 'enabled' : 'disabled'
    };
  }

  getAllPipelinesStatus(): any[] {
    return Array.from(this.deploymentPipelines.keys()).map(id => this.getDeploymentStatus(id));
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    for (const interval of this.autoScalers.values()) {
      clearInterval(interval);
    }
    
    this.autoScalers.clear();
    console.log('🛑 Enterprise Deployment Service destroyed');
  }
}

export const enterpriseDeploymentService = new EnterpriseDeploymentService();