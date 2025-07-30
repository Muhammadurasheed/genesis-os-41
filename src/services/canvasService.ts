
import { Blueprint } from '../types';
import { Node, MarkerType } from '@xyflow/react';
import { 
  AgentNodeData, 
  TriggerNodeData, 
  ActionNodeData, 
  NodeData,
  CanvasEdge
} from '../types/canvas';
import { canvasEngine } from './canvas/canvasEngineService';

// Icons are imported dynamically in React components,
// here we just store their names as strings
import { 
  Bot, 
  BarChart,
  MessageSquare,
  DollarSign,
  Sparkles,
  Settings,
  Users,
  Heart,
  Database,
  FileText,
  Share2,
  Mail,
  Brain,
  Target,
  Play,
  Clock,
  Globe,
  Workflow,
  Zap,
  Rocket
} from 'lucide-react';



/**
 * Service for managing canvas operations
 */
export const canvasService = {
  /**
   * Generate canvas nodes and edges from a blueprint using the new Canvas Engine
   */
  generateCanvasFromBlueprint: async (blueprint: Blueprint): Promise<{ nodes: Node<NodeData>[], edges: CanvasEdge[] }> => {
    console.log('🎨 Canvas Service: Using Canvas Engine for blueprint generation');
    
    try {
      const result = await canvasEngine.generateCanvasFromBlueprint(blueprint);
      console.log('✅ Canvas generated successfully via Canvas Engine');
      return {
        nodes: result.nodes,
        edges: result.edges
      };
    } catch (error) {
      console.error('❌ Canvas Engine failed, falling back to local generation:', error);
      // Fall back to local generation if engine fails
      return generateCanvasLocally(blueprint);
    }
  },
  
  /**
   * Execute a workflow using the Canvas Engine
   */
  executeWorkflow: async (
    flowId: string, 
    nodes: Node<NodeData>[], 
    edges: CanvasEdge[],
    context: Record<string, any> = {}
  ): Promise<{ executionId: string }> => {
    try {
      console.log('⚡ Canvas Service: Executing workflow via Canvas Engine');
      const result = await canvasEngine.executeWorkflow(flowId, nodes, edges, context);
      return {
        executionId: result.executionId
      };
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      throw error;
    }
  },

  /**
   * Get workflow execution status
   */
  getExecutionStatus: async (executionId: string) => {
    try {
      return await canvasEngine.getExecutionStatus(executionId);
    } catch (error) {
      console.error('Failed to get execution status:', error);
      throw error;
    }
  },

  /**
   * Validate node configuration
   */
  validateNodeConfig: async (nodeId: string, config: Record<string, any>) => {
    try {
      return await canvasEngine.validateNodeConfig(nodeId, config);
    } catch (error) {
      console.error('Failed to validate node config:', error);
      throw error;
    }
  },

  /**
   * Save canvas state
   */
  saveCanvas: async (canvasId: string, nodes: Node<NodeData>[], edges: CanvasEdge[], metadata?: any) => {
    try {
      return await canvasEngine.saveCanvas(canvasId, nodes, edges, metadata);
    } catch (error) {
      console.error('Failed to save canvas:', error);
      throw error;
    }
  },

  /**
   * Load canvas state  
   */
  loadCanvas: async (canvasId: string, version?: string) => {
    try {
      return await canvasEngine.loadCanvas(canvasId, version);
    } catch (error) {
      console.error('Failed to load canvas:', error);
      throw error;
    }
  },

  /**
   * Auto-optimize canvas layout
   */
  optimizeLayout: async (nodes: Node<NodeData>[], edges: CanvasEdge[]) => {
    try {
      return await canvasEngine.optimizeLayout(nodes, edges);
    } catch (error) {
      console.error('Failed to optimize layout:', error);
      throw error;
    }
  },

  /**
   * Smart connection suggestions - Phase 2 Enhancement
   */
  // Simplified implementations for Phase 2 completion
  suggestConnections: async (_sourceNodeId: string, _targetPosition: { x: number; y: number }, _nodes: Node<NodeData>[]) => {
    return []; // Placeholder - engine integration pending
  },

  autoConnect: async (_nodes: Node<NodeData>[]) => {
    return []; // Placeholder - engine integration pending  
  },

  getDisclosureLevel: (_nodeType: string, _userExperience: 'beginner' | 'intermediate' | 'expert') => {
    return 'intermediate'; // Placeholder
  },

  getSmartSuggestions: async (_currentNodes: Node<NodeData>[], _userContext: any) => {
    return []; // Placeholder - engine integration pending
  },

  /**
   * Comprehensive validation
   */
  validateWorkflow: async (_nodes: Node<NodeData>[], _edges: CanvasEdge[]) => {
    // Placeholder implementation for Phase 2 completion
    return { isValid: true, errors: [], warnings: [], suggestions: [] };
  },

  /**
   * Real-time validation during editing
   */
  validateNodeInRealTime: async (_node: Node<NodeData>, _context: { allNodes: Node<NodeData>[], allEdges: CanvasEdge[] }) => {
    return { isValid: true, errors: [], warnings: [], suggestions: [] }; // Placeholder
  },

  // Simplified version control for Phase 2 completion
  createVersion: async (_canvasId: string, _nodes: Node<NodeData>[], _edges: CanvasEdge[], _metadata?: any) => {
    return { success: true, version: '1.0.0' }; // Placeholder
  },

  getVersionHistory: async (_canvasId: string) => {
    return []; // Placeholder
  },

  restoreVersion: async (_canvasId: string, _versionId: string) => {
    return { success: true }; // Placeholder
  },

  /**
   * Event queue operations for real-time collaboration
   */
  // Simplified event handling for Phase 2 completion
  publishCanvasEvent: async (_event: any) => {
    return { success: true }; // Placeholder
  },

  subscribeToCanvasEvents: (_canvasId: string, _callback: (event: any) => void) => {
    return () => {}; // Placeholder unsubscribe function
  },

  syncCollaborationState: async (_canvasId: string, _userId: string, _state: any) => {
    return { success: true }; // Placeholder
  },
};

/**
 * Generate canvas nodes and edges locally (client-side fallback)
 */
function generateCanvasLocally(blueprint: Blueprint): { nodes: Node<NodeData>[], edges: CanvasEdge[] } {
  if (!blueprint || !blueprint.suggested_structure) {
    throw new Error('Invalid blueprint structure');
  }
  
  const nodes: Node<NodeData>[] = [];
  const edges: CanvasEdge[] = [];
  
  // Create trigger node
  nodes.push({
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 50, y: 200 },
    data: {
      label: 'Guild Activation',
      triggerType: 'manual',
      description: `Initiates the ${blueprint.suggested_structure.guild_name} workflow`,
      icon: Rocket,
      color: 'from-emerald-500 to-teal-500',
      status: 'ready'
    } as TriggerNodeData,
  });
  
  // Create agent nodes with enterprise-grade layout algorithm
  blueprint.suggested_structure.agents.forEach((agent, index) => {
    // Use sophisticated layout: hierarchical flow for better organization
    const rowHeight = 400;
    const colWidth = 350;
    const agentsPerRow = Math.ceil(Math.sqrt(blueprint.suggested_structure.agents.length));
    const row = Math.floor(index / agentsPerRow);
    const col = index % agentsPerRow;
    const centerX = 600 + (col * colWidth);
    const centerY = 150 + (row * rowHeight);
    
    // Determine agent icon based on role
    const getAgentIcon = (role: string) => {
      const roleIcons: Record<string, any> = {
        'analyst': BarChart,
        'support': MessageSquare,
        'sales': DollarSign,
        'marketing': Sparkles,
        'finance': DollarSign,
        'operations': Settings,
        'hr': Users,
        'customer': Heart,
        'data': Database,
        'content': FileText,
        'social': Share2,
        'email': Mail,
        'report': FileText,
        'intelligence': Brain,
        'specialist': Target,
      };

      // Find a matching role keyword
      const roleKey = Object.keys(roleIcons).find(key => 
        role.toLowerCase().includes(key)
      );

      return roleIcons[roleKey || 'specialist'] || Bot;
    };
    
    // Determine agent color
    const getAgentColor = (index: number) => {
      const colors = [
        'from-purple-500 to-pink-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-red-500',
        'from-violet-500 to-purple-500',
        'from-indigo-500 to-blue-500',
      ];
      return colors[index % colors.length];
    };
    
    // Determine agent personality
    const getAgentPersonality = (role: string) => {
      const personalities: Record<string, string> = {
        'analyst': 'Data-driven, analytical, precise with strategic insights',
        'support': 'Empathetic, patient, solution-focused with customer care',
        'sales': 'Persuasive, relationship-focused, results-oriented',
        'marketing': 'Creative, brand-conscious, engagement-focused',
        'finance': 'Detail-oriented, compliance-focused, accuracy-driven',
        'operations': 'Efficient, process-oriented, optimization-focused',
      };
      
      const roleKey = Object.keys(personalities).find(key => 
        role.toLowerCase().includes(key)
      );
      
      return personalities[roleKey || 'analyst'] || 'Professional, intelligent, and goal-oriented';
    };
    
    const agentNode: Node<AgentNodeData> = {
      id: `agent-${index + 1}`,
      type: 'agent',
      position: { 
        x: centerX, 
        y: centerY 
      },
      data: {
        label: agent.name,
        role: agent.role,
        description: agent.description,
        tools: agent.tools_needed,
        personality: getAgentPersonality(agent.role),
        icon: getAgentIcon(agent.role),
        color: getAgentColor(index),
        status: 'ready',
        model: 'Gemini Pro',
        metrics: {
          successRate: '98%',
          avgResponse: '0.8s'
        }
      } as AgentNodeData,
    };
    nodes.push(agentNode);

    // Create intelligent connections between agents and trigger
    if (index === 0) {
      const edge: CanvasEdge = {
        id: `trigger-agent-${index + 1}`,
        source: 'trigger-1',
        target: `agent-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#10b981', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        sourceHandle: null,
        targetHandle: null
      };
      edges.push(edge);
    }

    // Create intelligent connections between agents
    if (index > 0) {
      const edge: CanvasEdge = {
        id: `agent-${index}-agent-${index + 1}`,
        source: `agent-${index}`,
        target: `agent-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
        sourceHandle: null,
        targetHandle: null
      };
      edges.push(edge);
    }
  });

  // Create workflow action nodes with enhanced layout
  const getWorkflowIcon = (triggerType: string) => {
    const triggerIcons: Record<string, any> = {
      'schedule': Clock,
      'webhook': Globe,
      'manual': Play,
      'event': Zap,
    };
    return triggerIcons[triggerType] || Workflow;
  };

  // Get workflow color
  const getWorkflowColor = (triggerType: string) => {
    const triggerColors: Record<string, string> = {
      'schedule': 'from-blue-500 to-indigo-500',
      'webhook': 'from-green-500 to-emerald-500',
      'manual': 'from-purple-500 to-violet-500',
      'event': 'from-yellow-500 to-orange-500',
    };
    return triggerColors[triggerType] || 'from-gray-500 to-slate-500';
  };

  // Map trigger type to action type
  const mapTriggerTypeToActionType = (triggerType: string): ActionNodeData['actionType'] => {
    const mapping: Record<string, ActionNodeData['actionType']> = {
      'schedule': 'database',
      'webhook': 'api',
      'manual': 'notification',
      'event': 'webhook',
    };
    return mapping[triggerType] || 'api';
  };

  blueprint.suggested_structure.workflows.forEach((workflow, index) => {
    const workflowNode: Node<ActionNodeData> = {
      id: `workflow-${index + 1}`,
      type: 'action',
      position: { 
        x: 200 + (index * 400), 
        y: 600 
      },
      data: {
        label: workflow.name,
        description: workflow.description,
        actionType: mapTriggerTypeToActionType(workflow.trigger_type),
        icon: getWorkflowIcon(workflow.trigger_type),
        color: getWorkflowColor(workflow.trigger_type),
        status: 'pending',
        validation: null,
        metrics: null,
        config: {}
      } as ActionNodeData,
    };
    nodes.push(workflowNode);

    // Connect agents to workflows intelligently
    if (blueprint.suggested_structure.agents.length > 0) {
      const targetAgentIndex = Math.min(index + 1, blueprint.suggested_structure.agents.length);
      const edge: CanvasEdge = {
        id: `agent-${targetAgentIndex}-workflow-${index + 1}`,
        source: `agent-${targetAgentIndex}`,
        target: `workflow-${index + 1}`,
        type: 'smoothstep',
        animated: true, 
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
        sourceHandle: null,
        targetHandle: null
      };
      edges.push(edge);
    }
  });

  return { nodes, edges };
}