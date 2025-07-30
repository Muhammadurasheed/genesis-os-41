import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CanvasGenerationRequest {
  blueprint: {
    id: string;
    user_intent: string;
    suggested_structure: {
      guild_name: string;
      guild_purpose: string;
      agents: Array<{
        name: string;
        role: string;
        description: string;
        tools_needed: string[];
      }>;
      workflows: Array<{
        name: string;
        description: string;
        trigger_type: string;
      }>;
    };
  };
  layoutAlgorithm?: string;
  complexity?: number;
}

interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description: string;
    icon?: string;
    color?: string;
    status: string;
    [key: string]: any;
  };
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  style: {
    stroke: string;
    strokeWidth: number;
  };
  data: {
    flowType: string;
    [key: string]: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Parse request
    const { blueprint, layoutAlgorithm = 'hybrid', complexity }: CanvasGenerationRequest = await req.json();

    console.log('🎨 Advanced Canvas Generation: Processing blueprint...', blueprint.id);

    // Validate blueprint
    if (!blueprint?.suggested_structure) {
      throw new Error('Invalid blueprint structure');
    }

    const structure = blueprint.suggested_structure;

    // Calculate complexity if not provided
    const calculatedComplexity = complexity || calculateComplexity(
      structure.agents?.length || 0,
      structure.workflows?.length || 0
    );

    // Generate advanced canvas
    const canvasResult = await generateAdvancedCanvas(structure, layoutAlgorithm, calculatedComplexity);

    // Store generation in database
    await supabase
      .from('canvas_generations')
      .insert({
        blueprint_id: blueprint.id,
        algorithm: layoutAlgorithm,
        complexity: calculatedComplexity,
        node_count: canvasResult.nodes.length,
        edge_count: canvasResult.edges.length,
        generated_at: new Date().toISOString(),
        metadata: {
          performance: canvasResult.metadata.performance,
          animations: canvasResult.metadata.animations
        }
      });

    console.log('✅ Advanced canvas generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        nodes: canvasResult.nodes,
        edges: canvasResult.edges,
        metadata: canvasResult.metadata
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Advanced canvas generation failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: 'Client-side generation recommended'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

/**
 * Generate advanced canvas with AI-powered layout
 */
async function generateAdvancedCanvas(
  structure: any,
  algorithm: string,
  complexity: number
): Promise<{
  nodes: NodeData[];
  edges: EdgeData[];
  metadata: any;
}> {
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];

  // Create Genesis trigger node
  nodes.push({
    id: 'genesis-trigger',
    type: 'trigger',
    position: calculateTriggerPosition(algorithm),
    data: {
      label: `🚀 ${structure.guild_name}`,
      description: `Genesis point for ${structure.guild_purpose}`,
      icon: '🚀',
      color: 'from-emerald-500 to-teal-500',
      status: 'ready',
      triggerType: 'manual',
      powerLevel: complexity,
      metadata: {
        genesisVersion: '2.0.0',
        createdAt: new Date().toISOString()
      }
    }
  });

  // Create coordinator agent for complex workflows
  if (complexity > 4) {
    nodes.push({
      id: 'coordinator-agent',
      type: 'agent',
      position: calculateCoordinatorPosition(algorithm),
      data: {
        label: '🧠 Workflow Coordinator',
        description: 'Orchestrates and monitors all workflow operations',
        icon: '🧠',
        color: 'from-blue-500 to-cyan-500',
        status: 'ready',
        role: 'coordinator',
        powerLevel: complexity,
        capabilities: ['workflow-orchestration', 'real-time-monitoring', 'error-recovery'],
        metadata: {
          isCoordinator: true,
          managedAgents: complexity
        }
      }
    });
  }

  // Create specialized agent nodes
  structure.agents.forEach((agent: any, index: number) => {
    const position = calculateAgentPosition(index, algorithm, structure.agents.length);
    
    nodes.push({
      id: `genesis-agent-${index + 1}`,
      type: 'agent',
      position,
      data: {
        label: `⚡ ${agent.name}`,
        description: agent.description,
        icon: getAgentIcon(agent.role),
        color: getAgentColor(index),
        status: 'ready',
        role: agent.role,
        tools: agent.tools_needed || [],
        powerLevel: Math.floor(complexity / 2) + 3,
        personality: generateAdvancedPersonality(agent.role),
        capabilities: getAgentCapabilities(agent.role),
        metadata: {
          specialization: agent.role,
          aiModel: 'Gemini Pro Ultra'
        }
      }
    });
  });

  // Create workflow action nodes
  structure.workflows?.forEach((workflow: any, index: number) => {
    const position = calculateWorkflowPosition(index, algorithm, structure.workflows.length);
    
    nodes.push({
      id: `workflow-action-${index + 1}`,
      type: 'action',
      position,
      data: {
        label: `⚙️ ${workflow.name}`,
        description: workflow.description,
        icon: getWorkflowIcon(workflow.trigger_type),
        color: getWorkflowColor(workflow.trigger_type),
        status: 'pending',
        actionType: mapTriggerToActionType(workflow.trigger_type),
        priority: index === 0 ? 'high' : 'medium',
        powerLevel: Math.floor(complexity / 3) + 2,
        metadata: {
          workflowType: workflow.trigger_type,
          dependencies: []
        }
      }
    });
  });

  // Create intelligent condition nodes for complex workflows
  if (complexity > 5) {
    nodes.push({
      id: 'logic-gate-1',
      type: 'condition',
      position: calculateConditionPosition(algorithm),
      data: {
        label: '🔀 Smart Router',
        description: 'Intelligently routes workflow based on conditions',
        icon: '🔀',
        color: 'from-violet-500 to-purple-500',
        status: 'ready',
        conditionType: 'switch',
        condition: 'workflow.priority === "high" || workflow.errorRate > 0.05',
        powerLevel: 4,
        metadata: {
          logicType: 'smart-routing',
          conditions: ['priority-based', 'error-rate-based']
        }
      }
    });
  }

  // Create intelligent connections
  const intelligentEdges = createIntelligentConnections(nodes, complexity);
  edges.push(...intelligentEdges);

  // Generate metadata
  const metadata = {
    generatedAt: new Date().toISOString(),
    algorithm,
    complexity,
    performance: {
      estimatedRenderTime: complexity * 100,
      memoryUsage: nodes.length * 50,
      animationLoad: complexity > 7 ? 'high' : 'medium'
    },
    animations: {
      dataFlowSpeed: complexity > 7 ? 'fast' : 'medium',
      particleIntensity: Math.min(complexity / 10, 1),
      transitionDuration: 800
    }
  };

  return { nodes, edges, metadata };
}

/**
 * Calculate complexity based on workflow elements
 */
function calculateComplexity(agentCount: number, workflowCount: number): number {
  return Math.min(Math.floor((agentCount * 2 + workflowCount * 1.5) / 2), 10);
}

/**
 * Calculate trigger position based on algorithm
 */
function calculateTriggerPosition(algorithm: string): { x: number; y: number } {
  switch (algorithm) {
    case 'hierarchical':
      return { x: 100, y: 300 };
    case 'circular':
      return { x: 600, y: 400 };
    case 'force-directed':
      return { x: 300, y: 200 };
    default:
      return { x: 100, y: 300 };
  }
}

/**
 * Calculate coordinator position
 */
function calculateCoordinatorPosition(algorithm: string): { x: number; y: number } {
  switch (algorithm) {
    case 'hierarchical':
      return { x: 400, y: 200 };
    case 'circular':
      return { x: 600, y: 200 };
    default:
      return { x: 400, y: 200 };
  }
}

/**
 * Calculate agent positions based on algorithm
 */
function calculateAgentPosition(
  index: number, 
  algorithm: string, 
  totalAgents: number
): { x: number; y: number } {
  switch (algorithm) {
    case 'hierarchical':
      return {
        x: 500 + (index % 3) * 350,
        y: 150 + Math.floor(index / 3) * 300
      };
    case 'circular':
      const angle = (index / totalAgents) * 2 * Math.PI;
      const radius = 250;
      return {
        x: 600 + Math.cos(angle) * radius,
        y: 400 + Math.sin(angle) * radius
      };
    case 'force-directed':
      return {
        x: 400 + (Math.random() - 0.5) * 600,
        y: 300 + (Math.random() - 0.5) * 400
      };
    default:
      return {
        x: 500 + (index % 3) * 350,
        y: 150 + Math.floor(index / 3) * 300
      };
  }
}

/**
 * Calculate workflow position
 */
function calculateWorkflowPosition(
  index: number,
  algorithm: string,
  totalWorkflows: number
): { x: number; y: number } {
  return {
    x: 200 + index * 400,
    y: 700
  };
}

/**
 * Calculate condition position
 */
function calculateConditionPosition(algorithm: string): { x: number; y: number } {
  return { x: 800, y: 400 };
}

/**
 * Create intelligent connections between nodes
 */
function createIntelligentConnections(nodes: NodeData[], complexity: number): EdgeData[] {
  const edges: EdgeData[] = [];
  
  const triggerNode = nodes.find(n => n.type === 'trigger');
  const coordinatorNode = nodes.find(n => n.data.role === 'coordinator');
  const agentNodes = nodes.filter(n => n.type === 'agent' && n.data.role !== 'coordinator');
  const actionNodes = nodes.filter(n => n.type === 'action');
  const conditionNodes = nodes.filter(n => n.type === 'condition');

  // Genesis Flow: Trigger → Coordinator or First Agent
  if (triggerNode) {
    const firstTarget = coordinatorNode || agentNodes[0];
    if (firstTarget) {
      edges.push({
        id: `genesis-${triggerNode.id}-${firstTarget.id}`,
        source: triggerNode.id,
        target: firstTarget.id,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: '#10b981',
          strokeWidth: 4
        },
        data: {
          flowType: 'genesis',
          powerLevel: complexity,
          particles: true
        }
      });
    }
  }

  // Coordinator to Agents
  if (coordinatorNode && agentNodes.length > 0) {
    agentNodes.forEach((agent, index) => {
      edges.push({
        id: `coordinator-${agent.id}`,
        source: coordinatorNode.id,
        target: agent.id,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: '#3b82f6',
          strokeWidth: 3
        },
        data: {
          flowType: 'coordination',
          sequenceIndex: index
        }
      });
    });
  }

  // Agent Chain Connections
  for (let i = 0; i < agentNodes.length - 1; i++) {
    const colors = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4'];
    const color = colors[i % colors.length];
    
    edges.push({
      id: `agent-chain-${i}`,
      source: agentNodes[i].id,
      target: agentNodes[i + 1].id,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: color,
        strokeWidth: 3
      },
      data: {
        flowType: 'intelligent',
        sequenceIndex: i
      }
    });
  }

  // Agent to Action Connections
  actionNodes.forEach((action, index) => {
    const sourceAgent = agentNodes[Math.min(index, agentNodes.length - 1)];
    if (sourceAgent) {
      edges.push({
        id: `action-${sourceAgent.id}-${action.id}`,
        source: sourceAgent.id,
        target: action.id,
        type: 'step',
        animated: true,
        style: {
          stroke: '#f59e0b',
          strokeWidth: 2
        },
        data: {
          flowType: 'execution',
          priority: 'high'
        }
      });
    }
  });

  // Condition Routing
  conditionNodes.forEach((condition) => {
    // Connect to condition
    if (agentNodes.length > 0) {
      const lastAgent = agentNodes[agentNodes.length - 1];
      edges.push({
        id: `condition-${lastAgent.id}-${condition.id}`,
        source: lastAgent.id,
        target: condition.id,
        type: 'straight',
        animated: false,
        style: {
          stroke: '#ef4444',
          strokeWidth: 2
        },
        data: {
          flowType: 'decision',
          condition: 'evaluate'
        }
      });
    }
    
    // Connect from condition to actions
    actionNodes.forEach((action) => {
      edges.push({
        id: `conditional-${condition.id}-${action.id}`,
        source: condition.id,
        target: action.id,
        type: 'step',
        animated: true,
        style: {
          stroke: '#8b5cf6',
          strokeWidth: 2
        },
        data: {
          flowType: 'conditional',
          condition: 'if-true'
        }
      });
    });
  });

  return edges;
}

// Helper functions
function getAgentIcon(role: string): string {
  const icons: Record<string, string> = {
    coordinator: '🧠',
    analyst: '📊',
    support: '💬',
    sales: '💰',
    marketing: '✨',
    finance: '💰',
    operations: '⚙️',
    hr: '👥',
    customer: '❤️',
    data: '🗄️',
    content: '📝',
    social: '🔗',
    email: '📧',
    intelligence: '🧠',
    specialist: '🎯'
  };
  
  const roleKey = Object.keys(icons).find(key => role.toLowerCase().includes(key));
  return icons[roleKey || 'specialist'] || '⚡';
}

function getAgentColor(index: number): string {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-violet-500 to-purple-500',
    'from-indigo-500 to-blue-500'
  ];
  return colors[index % colors.length];
}

function getWorkflowIcon(triggerType: string): string {
  const icons: Record<string, string> = {
    schedule: '⏰',
    webhook: '🌐',
    manual: '▶️',
    event: '⚡',
    email: '📧'
  };
  return icons[triggerType] || '⚙️';
}

function getWorkflowColor(triggerType: string): string {
  const colors: Record<string, string> = {
    schedule: 'from-blue-500 to-indigo-500',
    webhook: 'from-green-500 to-emerald-500',
    manual: 'from-purple-500 to-violet-500',
    event: 'from-yellow-500 to-orange-500',
    email: 'from-red-500 to-pink-500'
  };
  return colors[triggerType] || 'from-gray-500 to-slate-500';
}

function generateAdvancedPersonality(role: string): string {
  const personalities: Record<string, string> = {
    coordinator: 'Strategic mastermind with exceptional orchestration capabilities',
    analyst: 'Data-driven genius with deep analytical insights',
    support: 'Empathetic problem-solver with infinite patience',
    sales: 'Charismatic relationship builder with persuasive communication',
    marketing: 'Creative visionary with brand expertise',
    finance: 'Precision-focused expert with compliance mastery'
  };
  return personalities[role] || 'Intelligent specialist with advanced problem-solving capabilities';
}

function getAgentCapabilities(role: string): string[] {
  const capabilities: Record<string, string[]> = {
    coordinator: ['workflow-orchestration', 'real-time-monitoring', 'error-recovery'],
    analyst: ['data-analysis', 'pattern-recognition', 'predictive-modeling'],
    support: ['customer-service', 'issue-resolution', 'empathy-engine'],
    sales: ['lead-qualification', 'relationship-building', 'negotiation'],
    marketing: ['content-creation', 'brand-management', 'campaign-optimization'],
    finance: ['financial-analysis', 'compliance-checking', 'risk-assessment']
  };
  return capabilities[role] || ['general-intelligence', 'problem-solving'];
}

function mapTriggerToActionType(triggerType: string): string {
  const mapping: Record<string, string> = {
    schedule: 'database',
    webhook: 'api',
    manual: 'notification',
    event: 'webhook',
    email: 'email'
  };
  return mapping[triggerType] || 'api';
}