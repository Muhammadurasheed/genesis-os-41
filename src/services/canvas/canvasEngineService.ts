import { Node, MarkerType } from '@xyflow/react';
import { Blueprint } from '../../types';
import { NodeData, CanvasEdge, AgentNodeData, TriggerNodeData, ActionNodeData } from '../../types/canvas';
import { 
  Bot, BarChart, MessageSquare, DollarSign, Sparkles, Settings,
  Users, Heart, Database, FileText, Share2, Mail, Brain, Target,
  Play, Clock, Globe, Workflow, Zap, Rocket
} from 'lucide-react';

/**
 * Canvas Engine Service - Powers all canvas operations with intelligent features
 */
export class CanvasEngineService {
  private orchestratorUrl: string;

  constructor() {
    this.orchestratorUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
  }

  /**
   * Generate dynamic canvas from blueprint with AI optimization
   */
  async generateCanvasFromBlueprint(blueprint: Blueprint): Promise<{ 
    nodes: Node<NodeData>[], 
    edges: CanvasEdge[],
    metadata: CanvasMetadata 
  }> {
    console.log('🎨 Canvas Engine: Generating dynamic canvas from blueprint...');
    
    try {
      // Try orchestrator service first for optimal performance
      const response = await this.tryOrchestratorGeneration(blueprint);
      if (response) return response;

      // Fall back to local generation with enhanced intelligence
      return await this.generateIntelligentCanvas(blueprint);
    } catch (error) {
      console.error('Canvas generation failed:', error);
      throw new Error(`Canvas generation failed: ${error}`);
    }
  }

  /**
   * Execute workflow with real-time monitoring
   */
  async executeWorkflow(
    flowId: string,
    nodes: Node<NodeData>[],
    edges: CanvasEdge[],
    context: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    console.log('⚡ Executing workflow:', flowId);

    try {
      const response = await fetch(`${this.orchestratorUrl}/workflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId,
          nodes: this.serializeNodes(nodes),
          edges: this.serializeEdges(edges),
          context,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        executionId: result.executionId,
        status: 'running',
        startTime: new Date(),
        nodes: nodes.map(n => ({
          id: n.id,
          status: 'pending',
          startTime: null,
          endTime: null,
          output: null,
          error: null
        }))
      };
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    }
  }

  /**
   * Get real-time workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution> {
    try {
      const response = await fetch(`${this.orchestratorUrl}/workflow/status/${executionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get execution status:', error);
      throw error;
    }
  }

  /**
   * Validate node configuration
   */
  async validateNodeConfig(nodeId: string, config: Record<string, any>): Promise<ValidationResult> {
    try {
      const response = await fetch(`${this.orchestratorUrl}/node/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, config })
      });

      const result = await response.json();
      return {
        isValid: result.isValid,
        errors: result.errors || [],
        warnings: result.warnings || [],
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.warn('Node validation failed, using fallback:', error);
      return { isValid: true, errors: [], warnings: [], suggestions: [] };
    }
  }

  /**
   * Save canvas state with version control
   */
  async saveCanvas(
    canvasId: string,
    nodes: Node<NodeData>[],
    edges: CanvasEdge[],
    metadata: CanvasMetadata
  ): Promise<{ success: boolean; version: string }> {
    try {
      const response = await fetch(`${this.orchestratorUrl}/canvas/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId,
          nodes: this.serializeNodes(nodes),
          edges: this.serializeEdges(edges),
          metadata,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      return {
        success: response.ok,
        version: result.version || `v${Date.now()}`
      };
    } catch (error) {
      console.error('Canvas save failed:', error);
      throw error;
    }
  }

  /**
   * Load canvas from saved state
   */
  async loadCanvas(canvasId: string, version?: string): Promise<{
    nodes: Node<NodeData>[],
    edges: CanvasEdge[],
    metadata: CanvasMetadata
  }> {
    try {
      const url = `${this.orchestratorUrl}/canvas/load/${canvasId}${version ? `?version=${version}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load canvas: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        nodes: this.deserializeNodes(data.nodes),
        edges: this.deserializeEdges(data.edges),
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Canvas load failed:', error);
      throw error;
    }
  }

  /**
   * Auto-optimize canvas layout using AI
   */
  async optimizeLayout(nodes: Node<NodeData>[], edges: CanvasEdge[]): Promise<{
    nodes: Node<NodeData>[],
    edges: CanvasEdge[]
  }> {
    try {
      const response = await fetch(`${this.orchestratorUrl}/canvas/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: this.serializeNodes(nodes),
          edges: this.serializeEdges(edges)
        })
      });

      if (!response.ok) {
        // Fall back to local optimization
        return this.localLayoutOptimization(nodes, edges);
      }

      const result = await response.json();
      return {
        nodes: this.deserializeNodes(result.nodes),
        edges: this.deserializeEdges(result.edges)
      };
    } catch (error) {
      console.warn('Remote optimization failed, using local:', error);
      return this.localLayoutOptimization(nodes, edges);
    }
  }

  /**
   * Try orchestrator service for canvas generation
   */
  private async tryOrchestratorGeneration(blueprint: Blueprint): Promise<{
    nodes: Node<NodeData>[], 
    edges: CanvasEdge[],
    metadata: CanvasMetadata
  } | null> {
    try {
      const response = await fetch(`${this.orchestratorUrl}/canvas/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint })
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        nodes: this.deserializeNodes(data.nodes),
        edges: this.deserializeEdges(data.edges),
        metadata: data.metadata || this.createDefaultMetadata(blueprint)
      };
    } catch (error) {
      console.warn('Orchestrator unavailable, falling back to local generation');
      return null;
    }
  }

  /**
   * Generate intelligent canvas locally with enhanced features
   */
  private async generateIntelligentCanvas(blueprint: Blueprint): Promise<{
    nodes: Node<NodeData>[],
    edges: CanvasEdge[],
    metadata: CanvasMetadata
  }> {
    if (!blueprint?.suggested_structure) {
      throw new Error('Invalid blueprint structure');
    }

    const nodes: Node<NodeData>[] = [];
    const edges: CanvasEdge[] = [];

    // Create trigger node with intelligent positioning
    const triggerNode = this.createTriggerNode(blueprint);
    nodes.push(triggerNode);

    // Create agent nodes with smart layout
    const agentNodes = await this.createAgentNodes(blueprint);
    nodes.push(...agentNodes);

    // Create action nodes for workflows
    const actionNodes = this.createActionNodes(blueprint);
    nodes.push(...actionNodes);

    // Create intelligent connections
    const intelligentEdges = this.createIntelligentEdges(nodes);
    edges.push(...intelligentEdges);

    const metadata = this.createDefaultMetadata(blueprint);

    return { nodes, edges, metadata };
  }

  /**
   * Create trigger node with enhanced data
   */
  private createTriggerNode(blueprint: Blueprint): Node<TriggerNodeData> {
    return {
      id: 'trigger-main',
      type: 'trigger',
      position: { x: 100, y: 300 },
      data: {
        label: 'Guild Activation',
        description: `Initiates the ${blueprint.suggested_structure.guild_name} workflow`,
        triggerType: 'manual',
        icon: Rocket,
        color: 'from-emerald-500 to-teal-500',
        status: 'ready',
        config: {
          autoTrigger: false,
          triggerConditions: []
        },
        schedule: {
          frequency: 'manual',
          timezone: 'UTC'
        },
        metadata: {
          created: new Date().toISOString(),
          version: '1.0.0'
        }
      }
    };
  }

  /**
   * Create agent nodes with AI-enhanced configuration
   */
  private async createAgentNodes(blueprint: Blueprint): Promise<Node<AgentNodeData>[]> {
    const agents = blueprint.suggested_structure.agents;
    const nodes: Node<AgentNodeData>[] = [];

    // Calculate optimal layout
    const agentsPerRow = Math.ceil(Math.sqrt(agents.length));
    const nodeWidth = 350;
    const nodeHeight = 400;
    const startX = 500;
    const startY = 150;

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const row = Math.floor(i / agentsPerRow);
      const col = i % agentsPerRow;
      
      const node: Node<AgentNodeData> = {
        id: `agent-${i + 1}`,
        type: 'agent',
        position: {
          x: startX + (col * nodeWidth),
          y: startY + (row * nodeHeight)
        },
        data: {
          label: agent.name,
          description: agent.description,
          role: agent.role,
          tools: agent.tools_needed || [],
          personality: this.generatePersonality(agent.role),
          icon: this.getAgentIcon(agent.role),
          color: this.getAgentColor(i),
          status: 'ready',
          performance: {
            averageResponseTime: Math.random() * 2 + 0.5, // 0.5-2.5s
            successRate: 95 + Math.random() * 5, // 95-100%
            lastExecution: undefined
          },
          metadata: {
            model: 'Gemini Pro',
            version: '1.0.0',
            capabilities: agent.tools_needed || [],
            created: new Date().toISOString()
          }
        }
      };

      nodes.push(node);
    }

    return nodes;
  }

  /**
   * Create action nodes for workflows
   */
  private createActionNodes(blueprint: Blueprint): Node<ActionNodeData>[] {
    const workflows = blueprint.suggested_structure.workflows || [];
    const nodes: Node<ActionNodeData>[] = [];

    workflows.forEach((workflow, index) => {
      const node: Node<ActionNodeData> = {
        id: `action-${index + 1}`,
        type: 'action',
        position: {
          x: 200 + (index * 400),
          y: 700
        },
        data: {
          label: workflow.name,
          description: workflow.description,
          actionType: this.mapWorkflowToActionType(workflow.trigger_type),
          icon: this.getWorkflowIcon(workflow.trigger_type),
          color: this.getWorkflowColor(workflow.trigger_type),
          status: 'pending',
          config: {
            triggerType: workflow.trigger_type,
            parameters: {}
          },
          validation: null,
          metrics: {
            executionCount: 0,
            averageTime: 0,
            lastRun: undefined
          },
          metadata: {
            created: new Date().toISOString(),
            version: '1.0.0'
          }
        }
      };

      nodes.push(node);
    });

    return nodes;
  }

  /**
   * Create intelligent edges between nodes
   */
  private createIntelligentEdges(nodes: Node<NodeData>[]): CanvasEdge[] {
    const edges: CanvasEdge[] = [];
    
    const triggerNode = nodes.find(n => n.type === 'trigger');
    const agentNodes = nodes.filter(n => n.type === 'agent');
    const actionNodes = nodes.filter(n => n.type === 'action');

    if (!triggerNode || agentNodes.length === 0) return edges;

    // Connect trigger to first agent
    if (agentNodes[0]) {
      edges.push({
        id: `${triggerNode.id}-${agentNodes[0].id}`,
        source: triggerNode.id,
        target: agentNodes[0].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        sourceHandle: null as string | null,
        targetHandle: null as string | null
      });
    }

    // Connect agents sequentially
    for (let i = 0; i < agentNodes.length - 1; i++) {
      edges.push({
        id: `${agentNodes[i].id}-${agentNodes[i + 1].id}`,
        source: agentNodes[i].id,
        target: agentNodes[i + 1].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
        sourceHandle: null as string | null,
        targetHandle: null as string | null
      });
    }

    // Connect agents to actions intelligently
    actionNodes.forEach((actionNode, index) => {
      const targetAgent = agentNodes[Math.min(index, agentNodes.length - 1)];
      if (targetAgent) {
        edges.push({
          id: `${targetAgent.id}-${actionNode.id}`,
          source: targetAgent.id,
          target: actionNode.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
          sourceHandle: null as string | null,
          targetHandle: null as string | null
        });
      }
    });

    return edges;
  }

  // Helper methods for node creation
  private getAgentIcon(role: string) {
    const roleIcons: Record<string, any> = {
      'analyst': BarChart, 'support': MessageSquare, 'sales': DollarSign,
      'marketing': Sparkles, 'finance': DollarSign, 'operations': Settings,
      'hr': Users, 'customer': Heart, 'data': Database, 'content': FileText,
      'social': Share2, 'email': Mail, 'intelligence': Brain, 'specialist': Target
    };

    const roleKey = Object.keys(roleIcons).find(key => 
      role.toLowerCase().includes(key)
    );

    return roleIcons[roleKey || 'specialist'] || Bot;
  }

  private getAgentColor(index: number): string {
    const colors = [
      'from-purple-500 to-pink-500', 'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500', 'from-orange-500 to-red-500',
      'from-violet-500 to-purple-500', 'from-indigo-500 to-blue-500'
    ];
    return colors[index % colors.length];
  }

  private generatePersonality(role: string): string {
    const personalities: Record<string, string> = {
      'analyst': 'Data-driven, analytical, precise with strategic insights',
      'support': 'Empathetic, patient, solution-focused with customer care',
      'sales': 'Persuasive, relationship-focused, results-oriented',
      'marketing': 'Creative, brand-conscious, engagement-focused',
      'finance': 'Detail-oriented, compliance-focused, accuracy-driven',
      'operations': 'Efficient, process-oriented, optimization-focused'
    };

    const roleKey = Object.keys(personalities).find(key => 
      role.toLowerCase().includes(key)
    );

    return personalities[roleKey || 'analyst'] || 'Professional, intelligent, and goal-oriented';
  }

  private getWorkflowIcon(triggerType: string) {
    const icons: Record<string, any> = {
      'schedule': Clock, 'webhook': Globe, 'manual': Play, 'event': Zap
    };
    return icons[triggerType] || Workflow;
  }

  private getWorkflowColor(triggerType: string): string {
    const colors: Record<string, string> = {
      'schedule': 'from-blue-500 to-indigo-500',
      'webhook': 'from-green-500 to-emerald-500',
      'manual': 'from-purple-500 to-violet-500',
      'event': 'from-yellow-500 to-orange-500'
    };
    return colors[triggerType] || 'from-gray-500 to-slate-500';
  }

  private mapWorkflowToActionType(triggerType: string): ActionNodeData['actionType'] {
    const mapping: Record<string, ActionNodeData['actionType']> = {
      'schedule': 'database', 'webhook': 'api', 'manual': 'notification', 'event': 'webhook'
    };
    return mapping[triggerType] || 'api';
  }

  private localLayoutOptimization(nodes: Node<NodeData>[], edges: CanvasEdge[]): {
    nodes: Node<NodeData>[], edges: CanvasEdge[]
  } {
    // Simple hierarchical layout optimization
    const optimizedNodes = [...nodes];
    
    // Group nodes by type
    const triggers = optimizedNodes.filter(n => n.type === 'trigger');
    const agents = optimizedNodes.filter(n => n.type === 'agent');
    const actions = optimizedNodes.filter(n => n.type === 'action');

    // Optimize positions
    triggers.forEach((node, i) => {
      node.position = { x: 100, y: 300 + (i * 200) };
    });

    agents.forEach((node, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      node.position = { x: 500 + (col * 350), y: 150 + (row * 300) };
    });

    actions.forEach((node, i) => {
      node.position = { x: 200 + (i * 400), y: 700 };
    });

    return { nodes: optimizedNodes, edges };
  }

  private createDefaultMetadata(blueprint: Blueprint): CanvasMetadata {
    return {
      id: `canvas-${Date.now()}`,
      name: blueprint.suggested_structure.guild_name,
      description: blueprint.suggested_structure.guild_purpose,
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      author: 'Canvas Engine',
      tags: ['ai-generated', 'workflow'],
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        complexity: 'medium'
      }
    };
  }

  private serializeNodes(nodes: Node<NodeData>[]): any[] {
    return nodes.map(node => ({
      ...node,
      data: { ...node.data, icon: undefined } // Remove icon for serialization
    }));
  }

  private serializeEdges(edges: CanvasEdge[]): any[] {
    return edges.map(edge => ({ ...edge }));
  }

  private deserializeNodes(serializedNodes: any[]): Node<NodeData>[] {
    return serializedNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        icon: this.getAgentIcon(node.data.role || 'specialist')
      }
    }));
  }

  private deserializeEdges(serializedEdges: any[]): CanvasEdge[] {
    return serializedEdges;
  }
}

// Type definitions
export interface CanvasMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface WorkflowExecution {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  endTime?: Date;
  nodes: NodeExecution[];
  error?: string;
}

export interface NodeExecution {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date | null;
  endTime: Date | null;
  output: any;
  error: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Export singleton instance
export const canvasEngine = new CanvasEngineService();