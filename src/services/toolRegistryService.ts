// Phase 3 Sprint 3.2: Tool Registry Service
// Central registry for all available tools

import { integrationService } from './integrationService';
import { mcpIntegrationService } from './mcpIntegrationService';
import type {
  Tool,
  ToolRegistry,
  ToolSearchFilter,
  ToolDiscoveryResult,
  ToolCategory
} from '../types/tools';

export class ToolRegistryService {
  private toolRegistry: Map<string, Tool> = new Map();
  private categoryMap: Map<string, ToolCategory> = new Map();
  private lastUpdated: string = new Date().toISOString();

  constructor() {
    this.initializeRegistry();
  }

  private async initializeRegistry(): Promise<void> {
    console.log('[ToolRegistryService] Initializing tool registry...');
    
    // Load built-in integrations
    await this.loadBuiltInTools();
    
    // Load MCP tools
    await this.loadMCPTools();
    
    // Set up categories
    this.setupCategories();
    
    console.log(`[ToolRegistryService] Registry initialized with ${this.toolRegistry.size} tools`);
  }

  /**
   * Get all available tools
   */
  getAllTools(): ToolRegistry {
    return {
      tools: Array.from(this.toolRegistry.values()),
      categories: Array.from(this.categoryMap.values()),
      total_count: this.toolRegistry.size,
      last_updated: this.lastUpdated
    };
  }

  /**
   * Search tools with filters
   */
  searchTools(filters: ToolSearchFilter): ToolDiscoveryResult {
    let tools = Array.from(this.toolRegistry.values());

    // Apply query filter
    if (filters.query) {
      const query = filters.query.toLowerCase();
      tools = tools.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filters.category) {
      tools = tools.filter(tool => tool.category.id === filters.category);
    }

    // Apply authentication type filter
    if (filters.authentication_type) {
      tools = tools.filter(tool => tool.authentication.type === filters.authentication_type);
    }

    // Apply cost range filter
    if (filters.cost_range) {
      const [min, max] = filters.cost_range;
      tools = tools.filter(tool => {
        const cost = tool.cost_per_call || 0;
        return cost >= min && cost <= max;
      });
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      tools = tools.filter(tool => filters.status!.includes(tool.status));
    }

    // Apply examples filter
    if (filters.has_examples) {
      tools = tools.filter(tool => 
        tool.actions.some(action => action.examples && action.examples.length > 0)
      );
    }

    // Get popular and suggested tools
    const popularTools = this.getPopularTools();
    const suggestedTools = this.getSuggestedTools(filters);

    return {
      tools,
      total_count: tools.length,
      filters_applied: filters,
      popular_tools: popularTools,
      suggested_tools: suggestedTools
    };
  }

  /**
   * Get tool by ID
   */
  getToolById(toolId: string): Tool | undefined {
    return this.toolRegistry.get(toolId);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(categoryId: string): Tool[] {
    return Array.from(this.toolRegistry.values()).filter(
      tool => tool.category.id === categoryId
    );
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    this.toolRegistry.set(tool.id, tool);
    this.lastUpdated = new Date().toISOString();
    console.log(`[ToolRegistryService] Registered tool: ${tool.name}`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolId: string): boolean {
    const removed = this.toolRegistry.delete(toolId);
    if (removed) {
      this.lastUpdated = new Date().toISOString();
      console.log(`[ToolRegistryService] Unregistered tool: ${toolId}`);
    }
    return removed;
  }

  /**
   * Refresh MCP tools
   */
  async refreshMCPTools(): Promise<void> {
    console.log('[ToolRegistryService] Refreshing MCP tools...');
    
    // Remove existing MCP tools
    const mcpToolIds = Array.from(this.toolRegistry.keys()).filter(id => id.startsWith('mcp_'));
    mcpToolIds.forEach(id => this.toolRegistry.delete(id));
    
    // Reload MCP tools
    await this.loadMCPTools();
    
    this.lastUpdated = new Date().toISOString();
  }

  /**
   * Get tool categories
   */
  getCategories(): ToolCategory[] {
    return Array.from(this.categoryMap.values());
  }

  // Private methods
  private async loadBuiltInTools(): Promise<void> {
    const integrations = integrationService.getAllIntegrations();
    
    for (const integration of integrations) {
      const tool: Tool = {
        id: integration.id,
        name: integration.name,
        description: integration.description,
        category: this.getCategoryForIntegrationType(integration.type),
        authentication: {
          type: integration.authType === 'webhook' ? 'none' : integration.authType as any,
          config: {}
        },
        actions: integration.actions.map(action => ({
          id: action.id,
          name: action.name,
          description: action.description,
          input_schema: this.createSchemaFromParameters(action.parameters),
          output_schema: this.createDefaultOutputSchema(),
          examples: [{
            id: 'default_example',
            name: 'Default Example',
            description: `Example usage of ${action.name}`,
            input: this.generateExampleFromParameters(action.parameters),
            expected_output: { success: true, message: 'Action completed' }
          }]
        })),
        rate_limits: {
          requests_per_minute: 60,
          requests_per_hour: 1000
        },
        cost_per_call: 0.001, // Default cost
        metadata: {
          provider: 'genesis',
          version: '1.0',
          icon: integration.icon,
          tags: [integration.type, 'integration']
        },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.registerTool(tool);
    }
  }

  private async loadMCPTools(): Promise<void> {
    try {
      const mcpTools = mcpIntegrationService.getAllMCPTools();
      mcpTools.forEach(tool => this.registerTool(tool));
    } catch (error) {
      console.error('[ToolRegistryService] Failed to load MCP tools:', error);
    }
  }

  private setupCategories(): void {
    const categories: ToolCategory[] = [
      {
        id: 'communication',
        name: 'Communication',
        description: 'Email, messaging, and notification tools',
        icon: 'MessageSquare',
        color: 'hsl(142, 76%, 36%)'
      },
      {
        id: 'productivity',
        name: 'Productivity',
        description: 'Spreadsheets, documents, and project management',
        icon: 'FileText',
        color: 'hsl(221, 83%, 53%)'
      },
      {
        id: 'business',
        name: 'Business',
        description: 'CRM, accounting, and e-commerce tools',
        icon: 'Briefcase',
        color: 'hsl(262, 83%, 58%)'
      },
      {
        id: 'development',
        name: 'Development',
        description: 'Code repositories, project management, and deployment',
        icon: 'Code',
        color: 'hsl(46, 93%, 51%)'
      },
      {
        id: 'ai_ml',
        name: 'AI & ML',
        description: 'Artificial intelligence and machine learning services',
        icon: 'Brain',
        color: 'hsl(340, 82%, 52%)'
      },
      {
        id: 'data',
        name: 'Data & Analytics',
        description: 'Databases, analytics, and data processing',
        icon: 'Database',
        color: 'hsl(173, 58%, 39%)'
      },
      {
        id: 'media',
        name: 'Media & Content',
        description: 'Image, video, and audio processing tools',
        icon: 'Image',
        color: 'hsl(24, 95%, 53%)'
      },
      {
        id: 'infrastructure',
        name: 'Infrastructure',
        description: 'Cloud services, monitoring, and deployment',
        icon: 'Server',
        color: 'hsl(213, 93%, 67%)'
      },
      {
        id: 'mcp',
        name: 'MCP Tools',
        description: 'Tools provided via Model Context Protocol',
        icon: 'Zap',
        color: 'hsl(47, 96%, 53%)'
      }
    ];

    categories.forEach(category => this.categoryMap.set(category.id, category));
  }

  private getCategoryForIntegrationType(type: string): ToolCategory {
    const categoryMappings: Record<string, string> = {
      'email': 'communication',
      'slack': 'communication',
      'google_sheets': 'productivity',
      'google_drive': 'productivity',
      'api': 'development',
      'database': 'data',
      'webhook': 'infrastructure',
      'voice': 'media',
      'sms': 'communication',
      'calendar': 'productivity',
      'storage': 'infrastructure'
    };

    const categoryId = categoryMappings[type] || 'infrastructure';
    return this.categoryMap.get(categoryId) || this.categoryMap.get('infrastructure')!;
  }

  private createSchemaFromParameters(parameters: any[]): any {
    const properties: any = {};
    const required: string[] = [];

    parameters.forEach(param => {
      properties[param.name] = {
        type: param.type,
        description: param.description
      };

      if (param.required) {
        required.push(param.name);
      }
    });

    return {
      type: 'object',
      properties,
      required
    };
  }

  private generateExampleFromParameters(parameters: any[]): any {
    const example: any = {};

    parameters.forEach(param => {
      switch (param.type) {
        case 'string':
          example[param.name] = `example_${param.name}`;
          break;
        case 'number':
          example[param.name] = 42;
          break;
        case 'boolean':
          example[param.name] = true;
          break;
        case 'array':
          example[param.name] = ['example_item'];
          break;
        case 'json':
        case 'object':
          example[param.name] = { example: 'value' };
          break;
        default:
          example[param.name] = 'example_value';
      }
    });

    return example;
  }

  private createDefaultOutputSchema(): any {
    return {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: 'Whether the action was successful' },
        data: { type: 'any', description: 'Action result data' },
        message: { type: 'string', description: 'Human-readable message' }
      }
    };
  }

  private getPopularTools(): Tool[] {
    // Return most commonly used tools
    const popularToolIds = [
      'slack', 'gmail', 'google_sheets', 'elevenlabs', 'webhook'
    ];

    return popularToolIds
      .map(id => this.toolRegistry.get(id))
      .filter((tool): tool is Tool => tool !== undefined);
  }

  private getSuggestedTools(filters: ToolSearchFilter): Tool[] {
    // Return tools suggested based on current filters/context
    const allTools = Array.from(this.toolRegistry.values());
    
    if (filters.category) {
      return allTools
        .filter(tool => tool.category.id === filters.category)
        .slice(0, 3);
    }

    return allTools
      .filter(tool => tool.status === 'active')
      .slice(0, 3);
  }
}

// Singleton instance
export const toolRegistryService = new ToolRegistryService();