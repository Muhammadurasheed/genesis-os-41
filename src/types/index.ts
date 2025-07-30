// Core Genesis Types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  avatar_url?: string;
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  purpose: string;
  user_id: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  agents: Agent[];
  workflows: Workflow[];
  metadata: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  guild_id: string;
  personality: string;
  instructions: string;
  tools: AgentTool[];
  memory_config: AgentMemory;
  voice_config: VoiceConfig;
  status: 'active' | 'paused' | 'error';
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface AgentTool {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'external';
  config: Record<string, any>;
  credentials?: Record<string, string>;
}

export interface AgentMemory {
  short_term_enabled: boolean;
  long_term_enabled: boolean;
  memory_limit: number;
  retention_days: number;
}

export interface VoiceConfig {
  enabled: boolean;
  voice_id: string;
  voice_name: string;
  stability: number;
  similarity_boost: number;
  style: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  guild_id: string;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  config: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: 'agent' | 'action' | 'condition' | 'delay' | 'trigger';
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

// Master Blueprint: Enhanced Types for Phase 1.2 Intent Capture
export interface BusinessIntent {
  id: string;
  user_id: string;
  raw_description: string;
  extracted_goals: string[];
  identified_processes: Array<{
    name: string;
    description: string;
    inputs: string[];
    outputs: string[];
    frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    complexity: 'simple' | 'moderate' | 'complex';
  }>;
  suggested_agents: Array<{
    name: string;
    role: string;
    description: string;
    tools_needed: string[];
  }>;
  complexity_score: number;
  estimated_cost: number;
  status: 'draft' | 'refined' | 'approved';
  created_at: string;
  updated_at?: string;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    clarification_needed?: boolean;
    confidence_score?: number;
  };
}

export interface ConversationState {
  phase: 'gathering' | 'clarifying' | 'confirming' | 'completed';
  extracted_info?: BusinessIntent;
  pending_questions: string[];
  user_responses: Record<string, string>;
  messages: ConversationMessage[];
}

export interface Blueprint {
  id: string;
  user_input: string;
  interpretation: string;
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
  status: 'draft' | 'refined' | 'approved' | 'pending' | 'rejected';
  created_at: string;
  updated_at?: string;
  conversation_state?: ConversationState;
  refinement_count?: number;
}

export interface SimulationResult {
  id: string;
  guild_id: string;
  test_data: Record<string, any>;
  agent_responses: Array<{
    agent_id: string;
    response: string;
    thought_process: string[];
    execution_time: number;
  }>;
  overall_success: boolean;
  errors: string[];
  created_at: string;
}

// Enhanced Simulation Types for Phase 3
export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  type: 'stress-test' | 'integration' | 'performance' | 'behavior' | 'collaboration';
  environment: {
    constraints: Record<string, any>;
    resources: Record<string, any>;
    timeLimit?: number;
    complexity: 'low' | 'medium' | 'high' | 'extreme';
  };
  objectives: Array<{
    id: string;
    description: string;
    target: number;
    weight: number;
  }>;
  agents?: Array<{
    id: string;
    name: string;
    role: string;
    capabilities: string[];
  }>;
  interactions: Array<{
    id: string;
    type: string;
    description: string;
    frequency: number;
    source?: string;
  }>;
}

// UI State Types
export interface WizardState {
  step: 'welcome' | 'intent' | 'blueprint' | 'canvas' | 'credentials' | 'simulation' | 'deployment';
  user_input: string;
  blueprint?: Blueprint;
  credentials: Record<string, string>;
  errors: string[];
  channels: any[];
}

export interface CanvasState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode?: string;
  selectedEdge?: string;
  viewport: { x: number; y: number; zoom: number };
}

// Phase 2 Enhanced Types
export interface EnhancedWorkflowNode extends WorkflowNode {
  data: {
    label: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    status: 'ready' | 'executing' | 'completed' | 'error' | 'paused';
    metadata?: Record<string, any>;
    version?: string;
    lastModified?: string;
    performance?: {
      averageExecutionTime: number;
      successRate: number;
      lastExecution?: string;
    };
  };
}

export interface SmartSuggestion {
  id: string;
  type?: string;
  label?: string;
  description?: string;
  icon?: any;
  confidence?: number;
  reasoning?: string;
  position?: { x: number; y: number };
}

export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor: { x: number; y: number };
  selection?: string[];
  isActive: boolean;
}

export interface CanvasMetrics {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecutionTime?: Date;
  performanceScore: number;
}

export interface AutoLayoutOptions {
  algorithm: 'dagre' | 'hierarchical' | 'circular' | 'force';
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  spacing: { x: number; y: number };
  animate: boolean;
}

// Enhanced Agent Types for Phase 2
export interface EnhancedAgent extends Agent {
  capabilities: {
    reasoning: number;
    creativity: number;
    efficiency: number;
    collaboration: number;
  };
  learning: {
    interactions: number;
    improvements: number;
    feedback_score: number;
  };
  integrations: {
    connected_tools: number;
    api_calls_today: number;
    success_rate: number;
  };
}

// Canvas Theme System
export interface CanvasTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    node: string;
    edge: string;
    selection: string;
    grid: string;
  };
  effects: {
    particles: boolean;
    neural_network: boolean;
    glow: boolean;
    shadows: boolean;
  };
}

// Smart Node Templates
export interface NodeTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: 'Core' | 'Integration' | 'Logic' | 'Utility' | 'AI';
  defaultData: Record<string, any>;
  connectable: {
    input: boolean;
    output: boolean;
    multiple: boolean;
  };
}

// Workflow Execution Context
export interface ExecutionContext {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  start_time: Date;
  end_time?: Date;
  current_node?: string;
  variables: Record<string, any>;
  logs: ExecutionLog[];
  metrics: CanvasMetrics;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  node_id?: string;
  message: string;
  data?: Record<string, any>;
}

// Advanced Canvas Features
export interface CanvasShortcut {
  key: string;
  modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: string;
  description: string;
}

// Add missing uuid type for the deployment function
export const uuid = {
  v4: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

export interface CanvasPlugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
  hooks: {
    onNodeCreate?: (node: WorkflowNode) => WorkflowNode;
    onNodeUpdate?: (node: WorkflowNode) => WorkflowNode;
    onExecute?: (context: ExecutionContext) => void;
  };
}