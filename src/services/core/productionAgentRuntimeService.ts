// ============================================================
// Production Agent Runtime Service - Enhanced Backend Support
// Real container spawning and management for Phase 1 completion
// ============================================================

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { dockerContainerService } from './dockerContainerService';
import { realPlaywrightService } from './realPlaywrightService';
import { gvae } from './genesisVirtualAgentEnvironment';

export interface ProductionAgentConfig {
  agentId: string;
  containerId?: string;
  image: string;
  capabilities: string[];
  resources: {
    memory: number;
    cpus: number;
    disk: number;
  };
  environment: Record<string, string>;
  networks: string[];
}

export interface AgentRuntimeStatus {
  agentId: string;
  containerId: string;
  status: 'created' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  playwrightSession?: string;
  uptime: number;
  lastActivity: Date;
  resourceUsage: {
    memory: number;
    cpu: number;
    network: number;
  };
}

export interface TaskExecution {
  taskId: string;
  agentId: string;
  containerId: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

class ProductionAgentRuntimeService extends EventEmitter {
  private agents: Map<string, AgentRuntimeStatus> = new Map();
  private tasks: Map<string, TaskExecution> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    console.log('🚀 Production Agent Runtime Service initializing...');
    this.startHealthChecking();
  }

  // Agent Lifecycle Management
  async createProductionAgent(config: ProductionAgentConfig): Promise<string> {
    const agentId = config.agentId || `agent-${uuidv4().slice(0, 8)}`;
    
    try {
      console.log(`🐳 Creating production agent container: ${agentId}`);
      
      // Create real Docker container
      const containerId = await dockerContainerService.createAgentContainer(agentId, {
        image: config.image,
        resources: config.resources,
        environment: {
          ...config.environment,
          AGENT_ID: agentId,
          GENESIS_MODE: 'production'
        },
        capabilities: config.capabilities,
        networks: config.networks
      });

      // Start the container
      await dockerContainerService.startContainer(containerId);

      // Create Playwright session if browser capability is enabled
      let playwrightSession: string | undefined;
      if (config.capabilities.includes('browser')) {
        playwrightSession = await realPlaywrightService.createBrowserSession(
          `agent-${agentId}`,
          {
            headless: false,
            screenshotOnAction: true,
            timeout: 30000
          }
        );
      }

      // Register agent status
      const agentStatus: AgentRuntimeStatus = {
        agentId,
        containerId,
        status: 'running',
        playwrightSession,
        uptime: 0,
        lastActivity: new Date(),
        resourceUsage: { memory: 0, cpu: 0, network: 0 }
      };

      this.agents.set(agentId, agentStatus);
      
      // Also register with GVAE for unified management
      await gvae.createAgentContainer(agentId, {
        image: config.image,
        capabilities: config.capabilities.map(cap => ({
          type: cap as any,
          enabled: true,
          config: {},
          permissions: ['all']
        })),
        resources: {
          memory: `${config.resources.memory}M`,
          cpu: config.resources.cpus.toString(),
          disk: `${config.resources.disk}M`
        }
      });

      this.emit('agentCreated', { agentId, containerId });
      console.log(`✅ Production agent created: ${agentId} (Container: ${containerId})`);
      
      return agentId;
      
    } catch (error) {
      console.error(`❌ Failed to create production agent ${agentId}:`, error);
      throw new Error(`Agent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Task Execution Engine
  async executeTask(agentId: string, task: any): Promise<string> {
    const taskId = `task-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status !== 'running') {
      throw new Error(`Agent ${agentId} is not running (status: ${agent.status})`);
    }

    try {
      console.log(`🎯 Executing task ${taskId} on agent ${agentId}`);
      
      const taskExecution: TaskExecution = {
        taskId,
        agentId,
        containerId: agent.containerId,
        command: task.command || task.type,
        status: 'running',
        startTime: new Date()
      };

      this.tasks.set(taskId, taskExecution);
      agent.lastActivity = new Date();

      // Route task to appropriate handler
      let result: any;
      
      switch (task.type) {
        case 'navigation':
          result = await this.handleNavigationTask(agentId, task);
          break;
        case 'click':
          result = await this.handleClickTask(agentId, task);
          break;
        case 'type':
          result = await this.handleTypeTask(agentId, task);
          break;
        case 'command':
          result = await this.handleCommandTask(agentId, task);
          break;
        case 'file_operation':
          result = await this.handleFileTask(agentId, task);
          break;
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      // Update task completion
      taskExecution.status = 'completed';
      taskExecution.result = result;
      taskExecution.endTime = new Date();
      taskExecution.duration = taskExecution.endTime.getTime() - taskExecution.startTime.getTime();

      this.emit('taskCompleted', { taskId, agentId, result });
      console.log(`✅ Task ${taskId} completed in ${taskExecution.duration}ms`);
      
      return taskId;
      
    } catch (error) {
      const taskExecution = this.tasks.get(taskId);
      if (taskExecution) {
        taskExecution.status = 'failed';
        taskExecution.error = error instanceof Error ? error.message : 'Unknown error';
        taskExecution.endTime = new Date();
        taskExecution.duration = taskExecution.endTime.getTime() - taskExecution.startTime.getTime();
      }

      this.emit('taskFailed', { taskId, agentId, error });
      console.error(`❌ Task ${taskId} failed:`, error);
      throw error;
    }
  }

  // Task Handlers
  private async handleNavigationTask(agentId: string, task: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent?.playwrightSession) {
      throw new Error('Browser session not available');
    }

    return await realPlaywrightService.navigateToPage(agent.playwrightSession, task.url);
  }

  private async handleClickTask(agentId: string, task: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent?.playwrightSession) {
      throw new Error('Browser session not available');
    }

    return await realPlaywrightService.clickElement(agent.playwrightSession, task.selector);
  }

  private async handleTypeTask(agentId: string, task: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent?.playwrightSession) {
      throw new Error('Browser session not available');
    }

    return await realPlaywrightService.typeText(agent.playwrightSession, task.selector, task.text);
  }

  private async handleCommandTask(agentId: string, task: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    return await dockerContainerService.executeCommand(agent.containerId, [task.command]);
  }

  private async handleFileTask(agentId: string, task: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    switch (task.operation) {
      case 'read':
        return await dockerContainerService.executeCommand(
          agent.containerId, 
          ['cat', task.filepath]
        );
      case 'write':
        return await dockerContainerService.executeCommand(
          agent.containerId,
          ['sh', '-c', `echo '${task.content}' > ${task.filepath}`]
        );
      case 'list':
        return await dockerContainerService.executeCommand(
          agent.containerId,
          ['ls', '-la', task.directory || '/workspace']
        );
      default:
        throw new Error(`Unsupported file operation: ${task.operation}`);
    }
  }

  // Agent Management
  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    try {
      console.log(`🛑 Stopping agent: ${agentId}`);
      
      agent.status = 'stopping';

      // Close Playwright session
      if (agent.playwrightSession) {
        await realPlaywrightService.closeBrowserSession(agent.playwrightSession);
      }

      // Stop and remove container
      await dockerContainerService.stopContainer(agent.containerId);
      await dockerContainerService.removeContainer(agent.containerId);

      agent.status = 'stopped';
      this.emit('agentStopped', { agentId });
      
      console.log(`✅ Agent stopped: ${agentId}`);
      
    } catch (error) {
      agent.status = 'error';
      console.error(`❌ Error stopping agent ${agentId}:`, error);
      throw error;
    }
  }

  async destroyAgent(agentId: string): Promise<void> {
    await this.stopAgent(agentId);
    this.agents.delete(agentId);
    
    // Remove from GVAE
    const containerIds = Array.from(gvae['containers'].keys());
    for (const containerId of containerIds) {
      const config = gvae['containers'].get(containerId);
      if (config?.agentId === agentId) {
        await gvae.destroyContainer(containerId);
        break;
      }
    }

    this.emit('agentDestroyed', { agentId });
    console.log(`💥 Agent destroyed: ${agentId}`);
  }

  // Status and Monitoring
  getAgentStatus(agentId: string): AgentRuntimeStatus | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentRuntimeStatus[] {
    return Array.from(this.agents.values());
  }

  getTaskStatus(taskId: string): TaskExecution | undefined {
    return this.tasks.get(taskId);
  }

  getAgentTasks(agentId: string): TaskExecution[] {
    return Array.from(this.tasks.values()).filter(task => task.agentId === agentId);
  }

  // Health Monitoring
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  private async performHealthChecks(): Promise<void> {
    for (const [agentId, agent] of this.agents.entries()) {
      try {
        // Check container health
        const containerStatus = await dockerContainerService.getContainerStatus(agent.containerId);
        
        if (containerStatus && containerStatus.status === 'running') {
          agent.status = 'running';
          agent.uptime += 30; // Add 30 seconds
          
          // Update resource usage from container stats
          agent.resourceUsage = {
            memory: containerStatus.resourceUsage?.memory || 0,
            cpu: containerStatus.resourceUsage?.cpu || 0,
            network: containerStatus.resourceUsage?.network || 0
          };
        } else {
          agent.status = 'error';
          console.warn(`⚠️ Agent ${agentId} container is not running`);
        }
        
      } catch (error) {
        agent.status = 'error';
        console.error(`❌ Health check failed for agent ${agentId}:`, error);
      }
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Production Agent Runtime Service...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Stop all agents
    const agentIds = Array.from(this.agents.keys());
    await Promise.all(
      agentIds.map(agentId => this.destroyAgent(agentId).catch(console.error))
    );

    console.log('✅ Production Agent Runtime Service cleaned up');
  }
}

// Create singleton instance
export const productionAgentRuntimeService = new ProductionAgentRuntimeService();
export default productionAgentRuntimeService;