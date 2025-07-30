// Phase 3 Sprint 3.2: MCP Integration Service
// Model Context Protocol for advanced tool capabilities

import type {
  MCPConnection,
  MCPAuth,
  MCPToolDefinition,
  Tool,
  JsonSchema
} from '../types/tools';

export class MCPIntegrationService {
  private connections: Map<string, MCPConnection> = new Map();
  private toolCache: Map<string, MCPToolDefinition[]> = new Map();
  private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeMCPService();
  }

  private async initializeMCPService(): Promise<void> {
    console.log('[MCPIntegrationService] Initializing MCP integration service...');
    
    // Load existing connections
    await this.loadConnections();
    
    // Start connection health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Connect to an MCP server
   */
  async connectToMCPServer(
    serverId: string,
    serverUrl: string,
    auth: MCPAuth,
    capabilities: string[] = []
  ): Promise<MCPConnection> {
    console.log(`[MCPIntegrationService] Connecting to MCP server: ${serverUrl}`);

    const connection: MCPConnection = {
      id: serverId,
      server_url: serverUrl,
      capabilities,
      authentication: auth,
      status: 'connecting',
      metadata: {
        version: '1.0',
        supported_protocols: ['mcp/1.0'],
        max_concurrent_requests: 10
      }
    };

    this.connections.set(serverId, connection);

    try {
      // Attempt to establish connection
      const isConnected = await this.establishConnection(connection);
      
      if (isConnected) {
        connection.status = 'connected';
        connection.last_ping = new Date().toISOString();
        
        // Discover available tools
        await this.discoverTools(serverId);
        
        console.log(`[MCPIntegrationService] Successfully connected to ${serverUrl}`);
      } else {
        connection.status = 'error';
        connection.error_message = 'Failed to establish connection';
      }
    } catch (error) {
      connection.status = 'error';
      connection.error_message = error instanceof Error ? error.message : 'Connection failed';
      console.error(`[MCPIntegrationService] Connection failed for ${serverUrl}:`, error);
    }

    return connection;
  }

  /**
   * Discover tools available on an MCP server
   */
  async discoverTools(serverId: string): Promise<MCPToolDefinition[]> {
    const connection = this.connections.get(serverId);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`MCP server ${serverId} is not connected`);
    }

    try {
      console.log(`[MCPIntegrationService] Discovering tools for server: ${serverId}`);
      
      // In a real implementation, this would make an actual MCP discovery call
      const tools = await this.makeDiscoveryCall(connection);
      
      this.toolCache.set(serverId, tools);
      return tools;
    } catch (error) {
      console.error(`[MCPIntegrationService] Tool discovery failed for ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Execute a tool via MCP protocol
   */
  async executeMCPTool(
    serverId: string,
    toolName: string,
    parameters: any
  ): Promise<any> {
    const connection = this.connections.get(serverId);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`MCP server ${serverId} is not available`);
    }

    try {
      console.log(`[MCPIntegrationService] Executing tool ${toolName} on server ${serverId}`);
      
      // Validate tool exists
      const tools = this.toolCache.get(serverId) || [];
      const tool = tools.find(t => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found on server ${serverId}`);
      }

      // Execute the tool
      const result = await this.makeToolCall(connection, toolName, parameters);
      
      return result;
    } catch (error) {
      console.error(`[MCPIntegrationService] Tool execution failed:`, error);
      throw error;
    }
  }

  /**
   * Convert MCP tool definitions to Genesis Tool format
   */
  convertMCPToolsToGenesisFormat(
    serverId: string,
    mcpTools: MCPToolDefinition[]
  ): Tool[] {
    return mcpTools.map(mcpTool => {
      const tool: Tool = {
        id: `mcp_${serverId}_${mcpTool.name}`,
        name: mcpTool.name,
        description: mcpTool.description,
        category: {
          id: 'mcp',
          name: 'MCP Tools',
          description: 'Tools provided via Model Context Protocol',
          icon: 'Zap',
          color: 'hsl(47, 96%, 53%)'
        },
        authentication: {
          type: 'none', // MCP handles auth at the server level
          config: {}
        },
        actions: [{
          id: `${mcpTool.name}_execute`,
          name: 'Execute',
          description: mcpTool.description,
          input_schema: mcpTool.input_schema,
          output_schema: mcpTool.output_schema || this.createDefaultOutputSchema(),
          examples: [{
            id: 'default_example',
            name: 'Default Example',
            description: `Example usage of ${mcpTool.name}`,
            input: this.generateExampleInput(mcpTool.input_schema),
            expected_output: {}
          }]
        }],
        rate_limits: {
          requests_per_minute: 60,
          concurrent_requests: 5
        },
        cost_per_call: mcpTool.cost_estimate || 0,
        metadata: {
          provider: 'mcp',
          version: '1.0',
          documentation_url: `mcp://${serverId}/tools/${mcpTool.name}`,
          icon: 'Zap',
          tags: ['mcp', serverId, ...mcpTool.capabilities]
        },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return tool;
    });
  }

  /**
   * Get all connected MCP servers
   */
  getConnectedServers(): MCPConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.status === 'connected');
  }

  /**
   * Get all available MCP tools across all servers
   */
  getAllMCPTools(): Tool[] {
    const allTools: Tool[] = [];
    
    for (const [serverId, tools] of this.toolCache.entries()) {
      const genesisTools = this.convertMCPToolsToGenesisFormat(serverId, tools);
      allTools.push(...genesisTools);
    }
    
    return allTools;
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectFromServer(serverId: string): Promise<boolean> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      return false;
    }

    try {
      console.log(`[MCPIntegrationService] Disconnecting from server: ${serverId}`);
      
      // Clear timeout
      const timeout = this.connectionTimeouts.get(serverId);
      if (timeout) {
        clearTimeout(timeout);
        this.connectionTimeouts.delete(serverId);
      }

      // Update status
      connection.status = 'disconnected';
      
      // Clear tool cache
      this.toolCache.delete(serverId);
      
      return true;
    } catch (error) {
      console.error(`[MCPIntegrationService] Disconnect failed for ${serverId}:`, error);
      return false;
    }
  }

  // Private implementation methods
  private async establishConnection(connection: MCPConnection): Promise<boolean> {
    if (import.meta.env.DEV) {
      // Mock connection for development
      console.log(`[MCPIntegrationService] Mock connection established to ${connection.server_url}`);
      return true;
    }

    try {
      // In a real implementation, this would establish a WebSocket or HTTP connection
      // and perform the MCP handshake protocol
      
      // Example WebSocket connection (commented out for now):
      /*
      const ws = new WebSocket(connection.server_url);
      
      return new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Send MCP handshake
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '1.0',
              capabilities: connection.capabilities,
              clientInfo: {
                name: 'GenesisOS',
                version: '1.0.0'
              }
            }
          }));
        };
        
        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          if (response.method === 'initialized') {
            resolve(true);
          }
        };
        
        ws.onerror = (error) => {
          reject(error);
        };
      });
      */
      
      return true;
    } catch (error) {
      console.error(`[MCPIntegrationService] Connection establishment failed:`, error);
      return false;
    }
  }

  private async makeDiscoveryCall(_connection: MCPConnection): Promise<MCPToolDefinition[]> {
    if (import.meta.env.DEV) {
      // Mock tool discovery for development
      return [
        {
          name: 'web_search',
          description: 'Search the web for information',
          input_schema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              max_results: { type: 'number', description: 'Maximum number of results' }
            },
            required: ['query']
          },
          capabilities: ['search', 'web'],
          cost_estimate: 0.01
        },
        {
          name: 'data_analysis',
          description: 'Analyze structured data',
          input_schema: {
            type: 'object',
            properties: {
              data: { type: 'array', description: 'Data to analyze' },
              analysis_type: { type: 'string', description: 'Type of analysis to perform' }
            },
            required: ['data']
          },
          capabilities: ['analysis', 'data'],
          cost_estimate: 0.05
        }
      ];
    }

    // Real implementation would make MCP discovery call
    try {
      // Example MCP discovery call:
      /*
      const response = await fetch(`${connection.server_url}/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.formatAuthHeader(connection.authentication)
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {}
        })
      });
      
      const data = await response.json();
      return data.result.tools;
      */
      
      return [];
    } catch (error) {
      console.error(`[MCPIntegrationService] Discovery call failed:`, error);
      throw error;
    }
  }

  private async makeToolCall(
    _connection: MCPConnection,
    toolName: string,
    parameters: any
  ): Promise<any> {
    if (import.meta.env.DEV) {
      // Mock tool execution for development
      return {
        tool: toolName,
        result: `Mock result for ${toolName}`,
        parameters,
        timestamp: new Date().toISOString()
      };
    }

    // Real implementation would make MCP tool call
    try {
      // Example MCP tool call:
      /*
      const response = await fetch(`${connection.server_url}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.formatAuthHeader(connection.authentication)
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: parameters
          }
        })
      });
      
      const data = await response.json();
      return data.result;
      */
      
      return { message: 'MCP tool execution not yet implemented' };
    } catch (error) {
      console.error(`[MCPIntegrationService] Tool call failed:`, error);
      throw error;
    }
  }

  private async loadConnections(): Promise<void> {
    // Load existing MCP connections from storage/database
    console.log('[MCPIntegrationService] Loading existing MCP connections...');
  }

  private startHealthMonitoring(): void {
    // Monitor connection health and reconnect if needed
    setInterval(() => {
      for (const [serverId, connection] of this.connections.entries()) {
        if (connection.status === 'connected') {
          this.pingServer(serverId).catch(() => {
            console.warn(`[MCPIntegrationService] Health check failed for server: ${serverId}`);
            connection.status = 'error';
            connection.error_message = 'Health check failed';
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async pingServer(serverId: string): Promise<boolean> {
    const connection = this.connections.get(serverId);
    if (!connection) return false;

    try {
      // Ping the MCP server
      if (import.meta.env.DEV) {
        connection.last_ping = new Date().toISOString();
        return true;
      }

      // Real implementation would ping the server
      return true;
    } catch (error) {
      console.error(`[MCPIntegrationService] Ping failed for ${serverId}:`, error);
      return false;
    }
  }

  private createDefaultOutputSchema(): JsonSchema {
    return {
      type: 'object',
      properties: {
        result: { type: 'any', description: 'Tool execution result' },
        metadata: { 
          type: 'object', 
          description: 'Execution metadata',
          properties: {
            timestamp: { type: 'string' },
            duration_ms: { type: 'number' }
          }
        }
      }
    };
  }

  private generateExampleInput(schema: JsonSchema): any {
    // Generate example input based on schema
    const example: any = {};
    
    if (schema.properties) {
      for (const [key, property] of Object.entries(schema.properties)) {
        switch ((property as any).type) {
          case 'string':
            example[key] = `example_${key}`;
            break;
          case 'number':
            example[key] = 42;
            break;
          case 'boolean':
            example[key] = true;
            break;
          case 'array':
            example[key] = ['example_item'];
            break;
          case 'object':
            example[key] = { example: 'value' };
            break;
          default:
            example[key] = 'example_value';
        }
      }
    }
    
    return example;
  }
}

// MCP Tool Adapter for universal tool interface
export class MCPToolAdapter {
  private mcpService: MCPIntegrationService;
  private serverId: string;
  private toolName: string;

  constructor(mcpService: MCPIntegrationService, serverId: string, toolName: string) {
    this.mcpService = mcpService;
    this.serverId = serverId;
    this.toolName = toolName;
  }

  async execute(params: any): Promise<any> {
    return await this.mcpService.executeMCPTool(this.serverId, this.toolName, params);
  }
}

// Singleton instance
export const mcpIntegrationService = new MCPIntegrationService();