// ============================================================
// Docker Container Management Service
// Real container spawning and orchestration for Genesis agents
// ============================================================

import Docker from 'dockerode';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface ContainerConfig {
  agentId: string;
  containerId: string;
  image: string;
  name: string;
  resources: {
    memory: number; // in MB
    cpus: number;   // CPU cores
    disk: number;   // in MB
  };
  environment: Record<string, string>;
  networks: string[];
  volumes: VolumeMount[];
  ports: PortMapping[];
  capabilities: string[];
}

export interface VolumeMount {
  source: string;
  destination: string;
  readOnly: boolean;
}

export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
}

export interface ContainerStatus {
  containerId: string;
  agentId: string;
  status: 'creating' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  health: 'healthy' | 'unhealthy' | 'starting' | 'none';
  uptime: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
  lastActivity: Date;
  logs: string[];
}

export interface NetworkConfig {
  name: string;
  driver: string;
  isolated: boolean;
  subnet?: string;
  gateway?: string;
}

class DockerContainerService extends EventEmitter {
  private docker: Docker;
  private containers: Map<string, ContainerConfig> = new Map();
  private containerStatuses: Map<string, ContainerStatus> = new Map();
  private networks: Map<string, NetworkConfig> = new Map();

  constructor() {
    super();
    this.docker = new Docker();
    console.log('🐳 Docker Container Service initializing...');
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Test Docker connection
      await this.docker.ping();
      console.log('✅ Docker connection established');

      // Create Genesis network if it doesn't exist
      await this.ensureGenesisNetwork();
      
      // Start monitoring existing containers
      await this.discoverExistingContainers();
      
      // Setup monitoring intervals
      this.setupMonitoring();
      
      this.emit('serviceReady');
    } catch (error) {
      console.error('❌ Failed to initialize Docker service:', error);
      throw new Error(`Docker service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Container Lifecycle Management
  async createAgentContainer(agentId: string, config: Partial<ContainerConfig> = {}): Promise<string> {
    const containerId = `genesis-agent-${agentId}-${uuidv4().slice(0, 8)}`;
    
    try {
      console.log(`🚀 Creating agent container: ${containerId}`);

      const containerConfig: ContainerConfig = {
        agentId,
        containerId,
        image: config.image || 'genesis-agent:latest',
        name: `genesis-agent-${agentId}`,
        resources: config.resources || {
          memory: 2048, // 2GB default
          cpus: 1,      // 1 CPU core default
          disk: 5120    // 5GB default
        },
        environment: {
          ...config.environment,
          AGENT_ID: agentId,
          CONTAINER_ID: containerId,
          GENESIS_WORKSPACE: '/workspace',
          NODE_ENV: 'production'
        },
        networks: config.networks || ['genesis-network'],
        volumes: config.volumes || [
          {
            source: `genesis-workspace-${agentId}`,
            destination: '/workspace',
            readOnly: false
          },
          {
            source: '/var/run/docker.sock',
            destination: '/var/run/docker.sock',
            readOnly: true
          }
        ],
        ports: config.ports || [
          {
            hostPort: 0, // Random port assignment
            containerPort: 3000,
            protocol: 'tcp'
          }
        ],
        capabilities: config.capabilities || [
          'SYS_ADMIN', // For browser automation
          'NET_ADMIN'  // For network operations
        ]
      };

      // Create container
      await this.docker.createContainer({
        Image: containerConfig.image,
        name: containerConfig.name,
        Env: Object.entries(containerConfig.environment).map(([key, value]) => `${key}=${value}`),
        HostConfig: {
          Memory: containerConfig.resources.memory * 1024 * 1024, // Convert to bytes
          CpuShares: containerConfig.resources.cpus * 1024,
          Binds: containerConfig.volumes.map(vol => 
            `${vol.source}:${vol.destination}${vol.readOnly ? ':ro' : ''}`
          ),
          PortBindings: containerConfig.ports.reduce((acc, port) => {
            acc[`${port.containerPort}/${port.protocol}`] = [{ HostPort: port.hostPort.toString() }];
            return acc;
          }, {} as any),
          NetworkMode: containerConfig.networks[0],
          CapAdd: containerConfig.capabilities,
          RestartPolicy: { Name: 'unless-stopped' },
          // Security settings
          SecurityOpt: ['no-new-privileges'],
          ReadonlyRootfs: false,
          Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=100m' }
        },
        NetworkingConfig: {
          EndpointsConfig: containerConfig.networks.reduce((acc, network) => {
            acc[network] = {};
            return acc;
          }, {} as any)
        },
        Labels: {
          'genesis.agent.id': agentId,
          'genesis.container.type': 'agent',
          'genesis.version': '1.0.0'
        }
      });

      // Store container configuration
      this.containers.set(containerId, containerConfig);
      
      // Initialize status tracking
      this.containerStatuses.set(containerId, {
        containerId,
        agentId,
        status: 'creating',
        health: 'none',
        uptime: 0,
        resourceUsage: { cpu: 0, memory: 0, network: 0 },
        lastActivity: new Date(),
        logs: []
      });

      this.emit('containerCreated', { containerId, agentId, config: containerConfig });
      console.log(`✅ Container created successfully: ${containerId}`);
      
      return containerId;

    } catch (error) {
      console.error(`❌ Failed to create container for agent ${agentId}:`, error);
      throw new Error(`Container creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async startContainer(containerId: string): Promise<void> {
    try {
      console.log(`▶️ Starting container: ${containerId}`);
      
      const container = this.docker.getContainer(containerId);
      await container.start();

      // Update status
      const status = this.containerStatuses.get(containerId);
      if (status) {
        status.status = 'starting';
        status.lastActivity = new Date();
      }

      this.emit('containerStarted', { containerId });
      console.log(`✅ Container started: ${containerId}`);

    } catch (error) {
      console.error(`❌ Failed to start container ${containerId}:`, error);
      
      const status = this.containerStatuses.get(containerId);
      if (status) {
        status.status = 'error';
      }
      
      this.emit('containerStartFailed', { containerId, error });
      throw new Error(`Container start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopContainer(containerId: string, timeout: number = 30): Promise<void> {
    try {
      console.log(`⏹️ Stopping container: ${containerId}`);
      
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: timeout });

      // Update status
      const status = this.containerStatuses.get(containerId);
      if (status) {
        status.status = 'stopped';
        status.lastActivity = new Date();
      }

      this.emit('containerStopped', { containerId });
      console.log(`✅ Container stopped: ${containerId}`);

    } catch (error) {
      console.error(`❌ Failed to stop container ${containerId}:`, error);
      this.emit('containerStopFailed', { containerId, error });
      throw new Error(`Container stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeContainer(containerId: string, force: boolean = false): Promise<void> {
    try {
      console.log(`🗑️ Removing container: ${containerId}`);
      
      const container = this.docker.getContainer(containerId);
      await container.remove({ force });

      // Clean up tracking
      this.containers.delete(containerId);
      this.containerStatuses.delete(containerId);

      this.emit('containerRemoved', { containerId });
      console.log(`✅ Container removed: ${containerId}`);

    } catch (error) {
      console.error(`❌ Failed to remove container ${containerId}:`, error);
      this.emit('containerRemoveFailed', { containerId, error });
      throw new Error(`Container removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Container Operations
  async executeCommand(containerId: string, command: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      console.log(`💻 Executing command in ${containerId}: ${command.join(' ')}`);
      
      const container = this.docker.getContainer(containerId);
      const exec = await container.exec({
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: false
      });

      const stream = await exec.start({ hijack: true, stdin: false });
      
      return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          if (chunk[0] === 1) { // stdout
            stdout += data.slice(8);
          } else if (chunk[0] === 2) { // stderr
            stderr += data.slice(8);
          }
        });

        stream.on('end', async () => {
          try {
            const inspectResult = await exec.inspect();
            resolve({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: inspectResult.ExitCode || 0
            });
          } catch (error) {
            reject(error);
          }
        });

        stream.on('error', reject);
      });

    } catch (error) {
      console.error(`❌ Command execution failed in ${containerId}:`, error);
      throw new Error(`Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContainerLogs(containerId: string, tail: number = 100): Promise<string[]> {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true
      });

      return logs.toString().split('\n').filter(line => line.trim());

    } catch (error) {
      console.error(`❌ Failed to get logs for ${containerId}:`, error);
      return [];
    }
  }

  // Monitoring and Status
  getContainerStatus(containerId: string): ContainerStatus | undefined {
    return this.containerStatuses.get(containerId);
  }

  getAllContainers(): ContainerStatus[] {
    return Array.from(this.containerStatuses.values());
  }

  getAgentContainers(agentId: string): ContainerStatus[] {
    return Array.from(this.containerStatuses.values())
      .filter(status => status.agentId === agentId);
  }

  // Network Management
  private async ensureGenesisNetwork(): Promise<void> {
    try {
      const networks = await this.docker.listNetworks();
      const genesisNetwork = networks.find(net => net.Name === 'genesis-network');
      
      if (!genesisNetwork) {
        console.log('📡 Creating Genesis network...');
        await this.docker.createNetwork({
          Name: 'genesis-network',
          Driver: 'bridge',
          IPAM: {
            Config: [{
              Subnet: '172.20.0.0/16',
              Gateway: '172.20.0.1'
            }]
          },
          Options: {
            'com.docker.network.bridge.enable_icc': 'true',
            'com.docker.network.bridge.enable_ip_masquerade': 'true'
          },
          Labels: {
            'genesis.network': 'true',
            'genesis.version': '1.0.0'
          }
        });
        console.log('✅ Genesis network created');
      }

      this.networks.set('genesis-network', {
        name: 'genesis-network',
        driver: 'bridge',
        isolated: true,
        subnet: '172.20.0.0/16',
        gateway: '172.20.0.1'
      });

    } catch (error) {
      console.error('❌ Failed to ensure Genesis network:', error);
      throw error;
    }
  }

  private async discoverExistingContainers(): Promise<void> {
    try {
      const containers = await this.docker.listContainers({ all: true });
      
      for (const containerInfo of containers) {
        const labels = containerInfo.Labels || {};
        
        if (labels['genesis.agent.id']) {
          const agentId = labels['genesis.agent.id'];
          const containerId = containerInfo.Id;
          
          // Reconstruct container status
          this.containerStatuses.set(containerId, {
            containerId,
            agentId,
            status: containerInfo.State as any,
            health: 'none',
            uptime: Date.now() - (containerInfo.Created * 1000),
            resourceUsage: { cpu: 0, memory: 0, network: 0 },
            lastActivity: new Date(),
            logs: []
          });
          
          console.log(`🔍 Discovered existing container: ${containerId} (${agentId})`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to discover existing containers:', error);
    }
  }

  private setupMonitoring(): void {
    // Monitor container resource usage every 30 seconds
    setInterval(() => {
      this.updateResourceUsage();
    }, 30000);

    // Health check every 2 minutes
    setInterval(() => {
      this.performHealthChecks();
    }, 120000);
  }

  private async updateResourceUsage(): Promise<void> {
    for (const containerId of this.containerStatuses.keys()) {
      try {
        const container = this.docker.getContainer(containerId);
        const stats = await container.stats({ stream: false });
        
        const status = this.containerStatuses.get(containerId);
        if (status && stats) {
          // Calculate CPU usage percentage
          const cpuUsage = this.calculateCpuUsage(stats as any);
          
          // Calculate memory usage
          const memoryUsage = stats.memory_stats?.usage || 0;
          
          status.resourceUsage = {
            cpu: cpuUsage,
            memory: memoryUsage / (1024 * 1024), // Convert to MB
            network: 0 // TODO: Calculate network usage
          };
        }
      } catch (error) {
        // Container might be stopped or removed
        console.debug(`Could not update stats for ${containerId}:`, error);
      }
    }
  }

  private calculateCpuUsage(stats: any): number {
    if (!stats.cpu_stats || !stats.precpu_stats) return 0;
    
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    
    if (systemDelta > 0 && cpuDelta > 0) {
      return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
    }
    return 0;
  }

  private async performHealthChecks(): Promise<void> {
    for (const containerId of this.containerStatuses.keys()) {
      try {
        const container = this.docker.getContainer(containerId);
        const info = await container.inspect();
        
        const status = this.containerStatuses.get(containerId);
        if (status) {
          status.status = info.State.Status as any;
          status.health = info.State.Health?.Status as any || 'none';
          
          if (info.State.Status === 'running') {
            status.uptime = Date.now() - new Date(info.State.StartedAt).getTime();
          }
        }
      } catch (error) {
        console.debug(`Health check failed for ${containerId}:`, error);
      }
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Docker Container Service...');
    
    const containerIds = Array.from(this.containers.keys());
    
    for (const containerId of containerIds) {
      try {
        await this.stopContainer(containerId, 10);
        await this.removeContainer(containerId, true);
      } catch (error) {
        console.error(`Failed to cleanup container ${containerId}:`, error);
      }
    }
    
    console.log('✅ Docker Container Service cleaned up');
  }
}

// Create singleton instance
export const dockerContainerService = new DockerContainerService();
export default dockerContainerService;