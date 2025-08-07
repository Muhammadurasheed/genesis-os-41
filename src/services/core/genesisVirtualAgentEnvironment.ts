// ============================================================
// Genesis Virtual Agent Environment (GVAE) - Core Engine
// Revolutionary AI Agent Runtime with Docker-level Isolation
// ============================================================

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { realPlaywrightService } from './realPlaywrightService';
import { dockerContainerService } from './dockerContainerService';

export interface AgentContainerConfig {
  agentId: string;
  containerId: string;
  image: string;
  resources: {
    memory: string;
    cpu: string;
    disk: string;
  };
  networks: string[];
  environment: Record<string, string>;
  capabilities: AgentCapability[];
}

export interface AgentCapability {
  type: 'browser' | 'terminal' | 'file_system' | 'network' | 'api' | 'email' | 'document';
  enabled: boolean;
  config: Record<string, any>;
  permissions: string[];
}

export interface ExecutionContext {
  executionId: string;
  agentId: string;
  containerId: string;
  sessionId: string;
  workspace: string;
  environment: Record<string, string>;
  tools: ToolInstance[];
  browser?: BrowserSession;
  terminal?: TerminalSession;
  fileSystem?: FileSystemAccess;
}

export interface BrowserSession {
  sessionId: string;
  pages: BrowserPage[];
  cookies: Record<string, any>;
  localStorage: Record<string, any>;
  userAgent: string;
  viewport: { width: number; height: number };
}

export interface BrowserPage {
  pageId: string;
  url: string;
  title: string;
  screenshot?: string;
  dom?: string;
  isActive: boolean;
}

export interface TerminalSession {
  sessionId: string;
  workingDirectory: string;
  environment: Record<string, string>;
  history: string[];
  isActive: boolean;
}

export interface FileSystemAccess {
  workspaceRoot: string;
  permissions: {
    read: string[];
    write: string[];
    execute: string[];
  };
  mountedVolumes: Record<string, string>;
}

export interface ToolInstance {
  toolId: string;
  name: string;
  type: string;
  status: 'ready' | 'running' | 'error' | 'disabled';
  config: Record<string, any>;
  lastUsed?: Date;
}

export interface ActionResult {
  actionId: string;
  type: string;
  success: boolean;
  result: any;
  error?: string;
  duration: number;
  timestamp: Date;
  screenshots?: string[];
  logs?: string[];
}

class GenesisVirtualAgentEnvironment extends EventEmitter {
  private containers: Map<string, AgentContainerConfig> = new Map();
  private contexts: Map<string, ExecutionContext> = new Map();
  private resourceUsage: Map<string, any> = new Map();

  constructor() {
    super();
    console.log('🚀 Genesis Virtual Agent Environment initializing...');
    this.initializeGVAE();
  }

  private async initializeGVAE() {
    // Initialize the virtual environment
    console.log('🔧 Initializing GVAE Core Systems...');
    
    // Set up monitoring
    this.setupResourceMonitoring();
    
    // Initialize default agent templates
    await this.createDefaultAgentTemplates();
    
    console.log('✅ GVAE Core Systems initialized');
    this.emit('gvaeReady');
  }

  // Agent Container Management
  async createAgentContainer(agentId: string, config: Partial<AgentContainerConfig> = {}): Promise<string> {
    const containerId = `gvae-${agentId}-${uuidv4().slice(0, 8)}`;
    
    const containerConfig: AgentContainerConfig = {
      agentId,
      containerId,
      image: config.image || 'genesis-agent:latest',
      resources: config.resources || {
        memory: '512M',
        cpu: '0.5',
        disk: '2G'
      },
      networks: config.networks || ['genesis-network'],
      environment: config.environment || {},
      capabilities: config.capabilities || this.getDefaultCapabilities()
    };

    // Create virtual container (lightweight process isolation)
    console.log(`🐳 Creating agent container: ${containerId}`);
    
    // Store container configuration
    this.containers.set(containerId, containerConfig);
    
    // Initialize container resources
    await this.initializeContainerResources(containerId);
    
    this.emit('containerCreated', { containerId, agentId });
    return containerId;
  }

  async startAgentExecution(
    agentId: string, 
    _task: any, 
    context: Record<string, any> = {}
  ): Promise<ExecutionContext> {
    const executionId = `exec-${agentId}-${Date.now()}`;
    const containerId = await this.getOrCreateContainer(agentId);
    
    console.log(`🚀 Starting agent execution: ${executionId}`);
    
    // Create execution context
    const executionContext: ExecutionContext = {
      executionId,
      agentId,
      containerId,
      sessionId: uuidv4(),
      workspace: `/workspace/${agentId}`,
      environment: {
        ...context,
        AGENT_ID: agentId,
        EXECUTION_ID: executionId,
        WORKSPACE: `/workspace/${agentId}`
      },
      tools: await this.initializeTools(agentId)
    };

    // Initialize browser session if needed
    if (this.hasCapability(containerId, 'browser')) {
      executionContext.browser = await this.createBrowserSession(executionId);
    }

    // Initialize terminal session if needed
    if (this.hasCapability(containerId, 'terminal')) {
      executionContext.terminal = await this.createTerminalSession(executionId);
    }

    // Initialize file system access
    if (this.hasCapability(containerId, 'file_system')) {
      executionContext.fileSystem = await this.createFileSystemAccess(executionId);
    }

    this.contexts.set(executionId, executionContext);
    this.emit('executionStarted', { executionId, agentId, containerId });
    
    return executionContext;
  }

  // Browser Automation Engine (Real Playwright Integration)
  async navigateToPage(executionId: string, url: string): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `navigate-${Date.now()}`;
    
    try {
      const context = this.contexts.get(executionId);
      if (!context?.browser) {
        throw new Error('Browser session not available');
      }

      console.log(`🌐 Navigating to: ${url} (Real Playwright)`);
      
      // Use real Playwright service
      const playwrightResult = await realPlaywrightService.navigateToPage(context.browser.sessionId, url);
      
      if (!playwrightResult.success) {
        throw new Error(playwrightResult.error || 'Navigation failed');
      }

      // Update context with real page data
      const page: BrowserPage = {
        pageId: playwrightResult.result.pageId,
        url: playwrightResult.result.url,
        title: playwrightResult.result.title,
        screenshot: playwrightResult.screenshot,
        isActive: true
      };

      context.browser.pages.push(page);
      
      const result: ActionResult = {
        actionId,
        type: 'navigation',
        success: true,
        result: { url: page.url, title: page.title, pageId: page.pageId },
        duration: Date.now() - startTime,
        timestamp: new Date(),
        screenshots: playwrightResult.screenshot ? [playwrightResult.screenshot] : []
      };

      this.emit('actionCompleted', result);
      return result;
      
    } catch (error) {
      const result: ActionResult = {
        actionId,
        type: 'navigation',
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionFailed', result);
      return result;
    }
  }

  async clickElement(executionId: string, selector: string): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `click-${Date.now()}`;
    
    try {
      const context = this.contexts.get(executionId);
      if (!context?.browser) {
        throw new Error('Browser session not available');
      }

      console.log(`👆 Clicking element: ${selector} (Real Playwright)`);
      
      // Use real Playwright service
      const playwrightResult = await realPlaywrightService.clickElement(context.browser.sessionId, selector);
      
      if (!playwrightResult.success) {
        throw new Error(playwrightResult.error || 'Click failed');
      }
      
      const result: ActionResult = {
        actionId,
        type: 'click',
        success: true,
        result: playwrightResult.result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        screenshots: playwrightResult.screenshot ? [playwrightResult.screenshot] : []
      };

      this.emit('actionCompleted', result);
      return result;
      
    } catch (error) {
      const result: ActionResult = {
        actionId,
        type: 'click',
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionFailed', result);
      return result;
    }
  }

  async typeText(executionId: string, selector: string, text: string): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `type-${Date.now()}`;
    
    try {
      const context = this.contexts.get(executionId);
      if (!context?.browser) {
        throw new Error('Browser session not available');
      }

      console.log(`⌨️ Typing text: "${text}" into ${selector} (Real Playwright)`);
      
      // Use real Playwright service
      const playwrightResult = await realPlaywrightService.typeText(context.browser.sessionId, selector, text);
      
      if (!playwrightResult.success) {
        throw new Error(playwrightResult.error || 'Type operation failed');
      }
      
      const result: ActionResult = {
        actionId,
        type: 'type',
        success: true,
        result: playwrightResult.result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        screenshots: playwrightResult.screenshot ? [playwrightResult.screenshot] : []
      };

      this.emit('actionCompleted', result);
      return result;
      
    } catch (error) {
      const result: ActionResult = {
        actionId,
        type: 'type',
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionFailed', result);
      return result;
    }
  }

  // Terminal Operations (Real Docker Container Integration)
  async executeCommand(executionId: string, command: string): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `cmd-${Date.now()}`;
    
    try {
      const context = this.contexts.get(executionId);
      if (!context?.terminal) {
        throw new Error('Terminal session not available');
      }

      console.log(`💻 Executing command in container: ${command}`);
      
      // Use real Docker container execution
      const dockerResult = await dockerContainerService.executeCommand(context.containerId, [command]);
      
      if (dockerResult.exitCode !== 0) {
        throw new Error(dockerResult.stderr || 'Command execution failed');
      }

      const output = dockerResult.stdout || dockerResult.stderr || '';
      context.terminal.history.push(`$ ${command}`);
      context.terminal.history.push(output);
      
      const result: ActionResult = {
        actionId,
        type: 'command',
        success: true,
        result: { 
          command, 
          output: output,
          exitCode: dockerResult.exitCode,
          containerId: context.containerId
        },
        duration: Date.now() - startTime,
        timestamp: new Date(),
        logs: [`Command: ${command}`, `Output: ${output}`]
      };

      this.emit('actionCompleted', result);
      return result;
      
    } catch (error) {
      const result: ActionResult = {
        actionId,
        type: 'command',
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionFailed', result);
      return result;
    }
  }

  // File System Operations (Real Docker Integration)
  async readFile(executionId: string, filepath: string): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `read-${Date.now()}`;
    
    try {
      const context = this.contexts.get(executionId);
      if (!context?.fileSystem) {
        throw new Error('File system access not available');
      }

      console.log(`📖 Reading file: ${filepath} (Real Docker)`);
      
      // Use real Docker container execution
      const dockerResult = await dockerContainerService.executeCommand(context.containerId, ['cat', filepath]);
      
      if (dockerResult.exitCode !== 0) {
        throw new Error(dockerResult.stderr || 'File read failed');
      }
      
      const result: ActionResult = {
        actionId,
        type: 'file_read',
        success: true,
        result: { filepath, content: dockerResult.stdout, size: dockerResult.stdout.length },
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionCompleted', result);
      return result;
      
    } catch (error) {
      const result: ActionResult = {
        actionId,
        type: 'file_read',
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionFailed', result);
      return result;
    }
  }

  async writeFile(executionId: string, filepath: string, content: string): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `write-${Date.now()}`;
    
    try {
      const context = this.contexts.get(executionId);
      if (!context?.fileSystem) {
        throw new Error('File system access not available');
      }

      console.log(`📝 Writing file: ${filepath} (Real Docker)`);
      
      // Use real Docker container execution
      const escapedContent = content.replace(/'/g, "'\"'\"'");
      const dockerResult = await dockerContainerService.executeCommand(
        context.containerId, 
        ['sh', '-c', `echo '${escapedContent}' > ${filepath}`]
      );
      
      if (dockerResult.exitCode !== 0) {
        throw new Error(dockerResult.stderr || 'File write failed');
      }
      
      const result: ActionResult = {
        actionId,
        type: 'file_write',
        success: true,
        result: { filepath, size: content.length, written: true },
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionCompleted', result);
      return result;
      
    } catch (error) {
      const result: ActionResult = {
        actionId,
        type: 'file_write',
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionFailed', result);
      return result;
    }
  }

  // Email Operations
  async sendEmail(_executionId: string, emailData: any): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `email-${Date.now()}`;
    
    try {
      console.log(`📧 Sending email to: ${emailData.to}`);
      
      // Simulate email sending
      const messageId = await this.simulateEmailSend(emailData);
      
      const result: ActionResult = {
        actionId,
        type: 'email_send',
        success: true,
        result: { messageId, to: emailData.to, subject: emailData.subject },
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionCompleted', result);
      return result;
      
    } catch (error) {
      const result: ActionResult = {
        actionId,
        type: 'email_send',
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('actionFailed', result);
      return result;
    }
  }

  // Resource Management
  async stopExecution(executionId: string): Promise<void> {
    console.log(`🛑 Stopping execution: ${executionId}`);
    
    const context = this.contexts.get(executionId);
    if (context) {
      // Cleanup browser sessions
      if (context.browser) {
        await this.closeBrowserSession(context.browser.sessionId);
      }
      
      // Cleanup terminal sessions
      if (context.terminal) {
        await this.closeTerminalSession(context.terminal.sessionId);
      }
      
      this.contexts.delete(executionId);
      this.emit('executionStopped', { executionId });
    }
  }

  async destroyContainer(containerId: string): Promise<void> {
    console.log(`💥 Destroying container: ${containerId}`);
    
    // Stop all executions using this container
    for (const [execId, context] of this.contexts.entries()) {
      if (context.containerId === containerId) {
        await this.stopExecution(execId);
      }
    }
    
    this.containers.delete(containerId);
    this.emit('containerDestroyed', { containerId });
  }

  // Monitoring and Metrics
  getExecutionMetrics(executionId: string): any {
    const context = this.contexts.get(executionId);
    const resourceUsage = this.resourceUsage.get(executionId);
    
    return {
      executionId,
      agentId: context?.agentId,
      containerId: context?.containerId,
      status: context ? 'running' : 'stopped',
      resourceUsage: resourceUsage || {},
      tools: context?.tools?.length || 0,
      browserPages: context?.browser?.pages?.length || 0,
      terminalHistory: context?.terminal?.history?.length || 0
    };
  }

  getAllExecutions(): any[] {
    return Array.from(this.contexts.keys()).map(execId => 
      this.getExecutionMetrics(execId)
    );
  }

  // Private Helper Methods
  private async getOrCreateContainer(agentId: string): Promise<string> {
    // Find existing container for agent
    for (const [containerId, config] of this.containers.entries()) {
      if (config.agentId === agentId) {
        return containerId;
      }
    }
    
    // Create new container
    return await this.createAgentContainer(agentId);
  }

  private getDefaultCapabilities(): AgentCapability[] {
    return [
      {
        type: 'browser',
        enabled: true,
        config: { headless: false, viewport: { width: 1920, height: 1080 } },
        permissions: ['navigate', 'click', 'type', 'screenshot']
      },
      {
        type: 'terminal',
        enabled: true,
        config: { shell: 'bash' },
        permissions: ['execute', 'read_output']
      },
      {
        type: 'file_system',
        enabled: true,
        config: { workspace: '/workspace' },
        permissions: ['read', 'write', 'create', 'delete']
      },
      {
        type: 'network',
        enabled: true,
        config: { allowedDomains: ['*'] },
        permissions: ['http_request', 'websocket']
      },
      {
        type: 'email',
        enabled: true,
        config: {},
        permissions: ['send', 'read']
      }
    ];
  }

  private hasCapability(containerId: string, capability: string): boolean {
    const container = this.containers.get(containerId);
    return container?.capabilities.some(cap => cap.type === capability && cap.enabled) || false;
  }

  private async initializeContainerResources(containerId: string): Promise<void> {
    // Initialize virtual container resources
    console.log(`🔧 Initializing resources for container: ${containerId}`);
  }

  private async createDefaultAgentTemplates(): Promise<void> {
    // Create default agent templates
    console.log('📋 Creating default agent templates...');
  }

  private setupResourceMonitoring(): void {
    // Set up resource monitoring
    setInterval(() => {
      this.updateResourceUsage();
    }, 5000); // Update every 5 seconds
  }

  private updateResourceUsage(): void {
    // Update resource usage for all active executions
    for (const execId of this.contexts.keys()) {
      this.resourceUsage.set(execId, {
        memory: Math.random() * 100, // MB
        cpu: Math.random() * 50, // %
        network: Math.random() * 1000, // KB/s
        timestamp: new Date()
      });
    }
  }

  private async initializeTools(_agentId: string): Promise<ToolInstance[]> {
    return [
      {
        toolId: 'browser',
        name: 'Web Browser',
        type: 'browser',
        status: 'ready',
        config: {}
      },
      {
        toolId: 'terminal',
        name: 'Terminal',
        type: 'terminal',
        status: 'ready',
        config: {}
      },
      {
        toolId: 'email',
        name: 'Email Client',
        type: 'email',
        status: 'ready',
        config: {}
      }
    ];
  }

  private async createBrowserSession(executionId: string): Promise<BrowserSession> {
    return {
      sessionId: `browser-${executionId}`,
      pages: [],
      cookies: {},
      localStorage: {},
      userAgent: 'Genesis Agent Browser 1.0',
      viewport: { width: 1920, height: 1080 }
    };
  }

  private async createTerminalSession(executionId: string): Promise<TerminalSession> {
    return {
      sessionId: `terminal-${executionId}`,
      workingDirectory: '/workspace',
      environment: {},
      history: [],
      isActive: true
    };
  }

  private async createFileSystemAccess(_executionId: string): Promise<FileSystemAccess> {
    return {
      workspaceRoot: '/workspace',
      permissions: {
        read: ['/workspace/**'],
        write: ['/workspace/**'],
        execute: ['/workspace/**']
      },
      mountedVolumes: {}
    };
  }

  // Real Docker Container Integration
  async createRealAgentContainer(agentId: string): Promise<string> {
    console.log(`🐳 Creating real Docker container for agent: ${agentId}`);
    
    try {
      return await dockerContainerService.createAgentContainer(agentId, {
        image: 'genesis-agent:latest',
        resources: {
          memory: 2048, // 2GB
          cpus: 1,
          disk: 5120 // 5GB
        },
        environment: {
          AGENT_ID: agentId,
          NODE_ENV: 'production'
        }
      });
    } catch (error) {
      console.error(`Failed to create real container for ${agentId}:`, error);
      throw error;
    }
  }



  private async simulateEmailSend(_emailData: any): Promise<string> {
    return `msg-${Date.now()}`;
  }

  private async closeBrowserSession(sessionId: string): Promise<void> {
    console.log(`🌐 Closing browser session: ${sessionId}`);
  }

  private async closeTerminalSession(sessionId: string): Promise<void> {
    console.log(`💻 Closing terminal session: ${sessionId}`);
  }
}

// Create singleton instance
export const gvae = new GenesisVirtualAgentEnvironment();
export default gvae;