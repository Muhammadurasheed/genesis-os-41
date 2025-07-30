/**
 * Model Context Protocol (MCP) Integration Service
 * Enables seamless tool interactions for Genesis agents
 * Phase 3: Agent Intelligence
 */

import microserviceManager from '../core/microserviceManager';
import { multiModelReasoningService } from './multiModelReasoningService';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  provider: string;
  category: 'communication' | 'data' | 'automation' | 'analysis' | 'creative';
  authentication?: {
    type: 'api_key' | 'oauth' | 'basic';
    required_fields: string[];
  };
}

export interface MCPConnection {
  id: string;
  name: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  tools: MCPTool[];
  credentials: Record<string, any>;
  lastUsed: Date;
  usageCount: number;
}

export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  tokensUsed?: number;
  metadata: Record<string, any>;
}

export class MCPIntegrationService {
  private connections: Map<string, MCPConnection> = new Map();
  private toolRegistry: Map<string, MCPTool> = new Map();

  constructor() {
    this.initializeBuiltInTools();
  }

  private initializeBuiltInTools() {
    const builtInTools: MCPTool[] = [
      {
        name: 'send_email',
        description: 'Send email to specified recipients',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'array', items: { type: 'string' } },
            subject: { type: 'string' },
            body: { type: 'string' },
            attachments: { type: 'array', items: { type: 'string' } }
          },
          required: ['to', 'subject', 'body']
        },
        outputSchema: {
          type: 'object',
          properties: {
            messageId: { type: 'string' },
            status: { type: 'string' }
          }
        },
        provider: 'smtp',
        category: 'communication'
      },
      {
        name: 'slack_message',
        description: 'Send message to Slack channel or user',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string' },
            message: { type: 'string' },
            user: { type: 'string' },
            thread_ts: { type: 'string' }
          },
          required: ['message']
        },
        outputSchema: {
          type: 'object',
          properties: {
            ts: { type: 'string' },
            channel: { type: 'string' }
          }
        },
        provider: 'slack',
        category: 'communication',
        authentication: {
          type: 'api_key',
          required_fields: ['SLACK_BOT_TOKEN']
        }
      },
      {
        name: 'google_sheets_update',
        description: 'Update Google Sheets with data',
        inputSchema: {
          type: 'object',
          properties: {
            spreadsheetId: { type: 'string' },
            range: { type: 'string' },
            values: { type: 'array' }
          },
          required: ['spreadsheetId', 'range', 'values']
        },
        outputSchema: {
          type: 'object',
          properties: {
            updatedCells: { type: 'number' },
            updatedRange: { type: 'string' }
          }
        },
        provider: 'google',
        category: 'data',
        authentication: {
          type: 'oauth',
          required_fields: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
        }
      },
      {
        name: 'create_calendar_event',
        description: 'Create calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            start: { type: 'string' },
            end: { type: 'string' },
            attendees: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' }
          },
          required: ['title', 'start', 'end']
        },
        outputSchema: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
            meetingLink: { type: 'string' }
          }
        },
        provider: 'google',
        category: 'automation'
      },
      {
        name: 'webhook_trigger',
        description: 'Trigger external webhook with data',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
            headers: { type: 'object' },
            data: { type: 'object' }
          },
          required: ['url']
        },
        outputSchema: {
          type: 'object',
          properties: {
            status: { type: 'number' },
            response: { type: 'object' }
          }
        },
        provider: 'http',
        category: 'automation'
      }
    ];

    builtInTools.forEach(tool => {
      this.toolRegistry.set(tool.name, tool);
    });

    console.log('🔧 MCP Integration Service initialized with built-in tools');
  }

  public async discoverTools(agentGoals: string[]): Promise<MCPTool[]> {
    console.log('🔍 Discovering relevant tools for agent goals');

    // Use multi-model reasoning to suggest tools
    const prompt = `
    Based on these agent goals, suggest the most relevant tools from our registry:
    
    Goals: ${agentGoals.join(', ')}
    
    Available tools: ${Array.from(this.toolRegistry.keys()).join(', ')}
    
    Return a JSON array of tool names that would be most useful for achieving these goals.
    `;

    try {
      const response = await multiModelReasoningService.reasonWithConsensus(prompt, {
        requiredCapabilities: ['reasoning', 'analysis'],
        minConsensus: 0.7
      });

      // Parse the response to get tool recommendations
      let recommendedTools: string[] = [];
      try {
        recommendedTools = JSON.parse(response.finalAnswer);
      } catch {
        // Fallback to extracting tool names from text
        recommendedTools = Array.from(this.toolRegistry.keys()).filter(toolName =>
          response.finalAnswer.toLowerCase().includes(toolName.toLowerCase())
        );
      }

      return recommendedTools
        .map(name => this.toolRegistry.get(name))
        .filter((tool): tool is MCPTool => tool !== undefined);

    } catch (error) {
      console.warn('⚠️ Tool discovery failed, returning default tools:', error);
      // Return some default useful tools
      return Array.from(this.toolRegistry.values()).slice(0, 3);
    }
  }

  public async executeTool(
    toolName: string,
    parameters: Record<string, any>,
    connectionId?: string
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      const tool = this.toolRegistry.get(toolName);
      if (!tool) {
        return {
          success: false,
          error: `Tool ${toolName} not found`,
          executionTime: Date.now() - startTime,
          metadata: { toolName }
        };
      }

      // Validate parameters against schema
      const validationResult = this.validateParameters(parameters, tool.inputSchema);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Invalid parameters: ${validationResult.errors.join(', ')}`,
          executionTime: Date.now() - startTime,
          metadata: { toolName, validationErrors: validationResult.errors }
        };
      }

      console.log(`🔧 Executing tool: ${toolName}`);

      // Execute the tool based on its provider
      let result: any;
      switch (tool.provider) {
        case 'smtp':
          result = await this.executeSMTPTool(toolName, parameters);
          break;
        case 'slack':
          result = await this.executeSlackTool(toolName, parameters, connectionId);
          break;
        case 'google':
          result = await this.executeGoogleTool(toolName, parameters, connectionId);
          break;
        case 'http':
          result = await this.executeHTTPTool(toolName, parameters);
          break;
        default:
          result = await this.executeGenericTool(toolName, parameters, connectionId);
      }

      const executionTime = Date.now() - startTime;

      // Update connection usage
      if (connectionId) {
        this.updateConnectionUsage(connectionId);
      }

      console.log(`✅ Tool ${toolName} executed successfully in ${executionTime}ms`);

      return {
        success: true,
        result,
        executionTime,
        metadata: {
          toolName,
          provider: tool.provider,
          category: tool.category
        }
      };

    } catch (error) {
      console.error(`❌ Tool execution failed: ${toolName}`, error);
      
      return {
        success: false,
        error: (error as Error).message,
        executionTime: Date.now() - startTime,
        metadata: { toolName }
      };
    }
  }

  private async executeSMTPTool(_toolName: string, params: Record<string, any>): Promise<any> {
    // Mock SMTP execution - in production, integrate with actual email service
    console.log(`📧 Sending email to: ${params.to.join(', ')}`);
    
    return {
      messageId: `msg_${Date.now()}`,
      status: 'sent'
    };
  }

  private async executeSlackTool(
    _toolName: string, 
    params: Record<string, any>,
    _connectionId?: string
  ): Promise<any> {
    // Mock Slack execution - integrate with Slack API
    console.log(`💬 Sending Slack message: ${params.message.substring(0, 50)}...`);
    
    return {
      ts: Date.now().toString(),
      channel: params.channel || '#general'
    };
  }

  private async executeGoogleTool(
    toolName: string,
    params: Record<string, any>,
    _connectionId?: string
  ): Promise<any> {
    // Mock Google API execution
    console.log(`📊 Executing Google tool: ${toolName}`);
    
    if (toolName === 'google_sheets_update') {
      return {
        updatedCells: params.values?.length || 0,
        updatedRange: params.range
      };
    }
    
    if (toolName === 'create_calendar_event') {
      return {
        eventId: `event_${Date.now()}`,
        meetingLink: 'https://meet.google.com/generated-link'
      };
    }

    return { success: true };
  }

  private async executeHTTPTool(_toolName: string, params: Record<string, any>): Promise<any> {
    console.log(`🌐 Making HTTP request: ${params.method || 'GET'} ${params.url}`);
    
    // Use microservice manager for HTTP calls
    try {
      const response = await microserviceManager.callService(
        'http-proxy',
        '/proxy',
        {
          url: params.url,
          method: params.method || 'GET',
          headers: params.headers || {},
          data: params.data || {}
        }
      );

      return {
        status: 200,
        response: response || { message: 'HTTP request completed' }
      };
    } catch (error) {
      return {
        status: 500,
        response: { error: (error as Error).message }
      };
    }
  }

  private async executeGenericTool(
    toolName: string,
    params: Record<string, any>,
    _connectionId?: string
  ): Promise<any> {
    // Generic tool execution fallback
    console.log(`🔧 Executing generic tool: ${toolName}`);
    
    return {
      success: true,
      message: `Tool ${toolName} executed with parameters`,
      parameters: params
    };
  }

  private validateParameters(
    params: Record<string, any>,
    schema: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic schema validation
    if (schema.required) {
      for (const field of schema.required) {
        if (!params[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Type validation for properties
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (params[field] !== undefined) {
          const expectedType = (fieldSchema as any).type;
          const actualType = Array.isArray(params[field]) ? 'array' : typeof params[field];
          
          if (expectedType !== actualType) {
            errors.push(`Field ${field} should be ${expectedType}, got ${actualType}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private updateConnectionUsage(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastUsed = new Date();
      connection.usageCount++;
      this.connections.set(connectionId, connection);
    }
  }

  public async registerConnection(connection: Omit<MCPConnection, 'id'>): Promise<string> {
    const connectionId = `conn_${Date.now()}`;
    
    const fullConnection: MCPConnection = {
      id: connectionId,
      ...connection,
      lastUsed: new Date(),
      usageCount: 0
    };

    this.connections.set(connectionId, fullConnection);

    // Register tools from this connection
    connection.tools.forEach(tool => {
      this.toolRegistry.set(tool.name, tool);
    });

    console.log(`✅ Registered MCP connection: ${connection.name}`);
    return connectionId;
  }

  public getConnections(): MCPConnection[] {
    return Array.from(this.connections.values());
  }

  public getAvailableTools(category?: string): MCPTool[] {
    const tools = Array.from(this.toolRegistry.values());
    
    if (category) {
      return tools.filter(tool => tool.category === category);
    }
    
    return tools;
  }

  public async testConnection(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    try {
      // Test with a simple tool if available
      const testTool = connection.tools[0];
      if (testTool) {
        await this.executeTool(testTool.name, {}, connectionId);
      }

      connection.status = 'connected';
      this.connections.set(connectionId, connection);
      
      return true;
    } catch (error) {
      console.error(`❌ Connection test failed for ${connectionId}:`, error);
      connection.status = 'error';
      this.connections.set(connectionId, connection);
      
      return false;
    }
  }
}

// Singleton instance
export const mcpIntegrationService = new MCPIntegrationService();