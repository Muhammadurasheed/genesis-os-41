// Phase 3 Sprint 3.2: Universal Tool Interface
// Following exact specifications from master blueprint

export interface JsonSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  authentication: AuthenticationMethod;
  actions: ToolAction[];
  rate_limits: RateLimit;
  cost_per_call?: number;
  metadata?: {
    version?: string;
    provider?: string;
    documentation_url?: string;
    icon?: string;
    tags?: string[];
  };
  status: 'active' | 'inactive' | 'deprecated' | 'beta';
  created_at: string;
  updated_at: string;
}

export interface ToolAction {
  id: string;
  name: string;
  description: string;
  input_schema: JsonSchema;
  output_schema: JsonSchema;
  examples: ActionExample[];
  parameters?: ActionParameter[];
  rate_limit_override?: RateLimit;
  cost_override?: number;
  cacheable?: boolean;
}

export interface ActionExample {
  id: string;
  name: string;
  description: string;
  input: any;
  expected_output: any;
  notes?: string;
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default_value?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface AuthenticationMethod {
  type: 'api_key' | 'oauth' | 'basic_auth' | 'bearer_token' | 'webhook' | 'none';
  config: {
    header_name?: string;
    query_param?: string;
    oauth_scopes?: string[];
    token_endpoint?: string;
    refresh_endpoint?: string;
  };
}

export interface RateLimit {
  requests_per_second?: number;
  requests_per_minute?: number;
  requests_per_hour?: number;
  requests_per_day?: number;
  burst_limit?: number;
  concurrent_requests?: number;
}

// Tool Execution Engine Interfaces
export interface ToolExecution {
  id: string;
  agent_id: string;
  tool_id: string;
  action_id: string;
  workspace_id: string;
  input_data: any;
  output_data?: any;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_details?: ErrorDetails;
  cost_incurred: number;
  retry_count: number;
  execution_context?: ExecutionContext;
}

export interface ExecutionContext {
  user_id: string;
  session_id: string;
  correlation_id: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout_ms: number;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  error_code: string;
  error_message: string;
  error_type: 'network' | 'authentication' | 'rate_limit' | 'validation' | 'timeout' | 'service_unavailable' | 'unknown';
  stack_trace?: string;
  retry_count: number;
  is_retryable: boolean;
  next_retry_at?: string;
  upstream_error?: any;
}

export interface RetryPolicy {
  max_attempts: number;
  backoff_strategy: 'linear' | 'exponential' | 'fixed';
  base_delay_ms: number;
  max_delay_ms: number;
  retry_on_errors: string[]; // HTTP status codes or error types
  timeout_ms: number;
  jitter_enabled: boolean;
}

// MCP Integration Strategy Interfaces
export interface MCPConnection {
  id: string;
  server_url: string;
  capabilities: string[];
  authentication: MCPAuth;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  last_ping?: string;
  error_message?: string;
  metadata?: {
    version?: string;
    supported_protocols?: string[];
    max_concurrent_requests?: number;
  };
}

export interface MCPAuth {
  type: 'api_key' | 'oauth' | 'certificate' | 'none';
  credentials: Record<string, string>;
  expires_at?: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  input_schema: JsonSchema;
  output_schema?: JsonSchema;
  capabilities: string[];
  cost_estimate?: number;
}

// Tool Categories
export const TOOL_CATEGORIES: ToolCategory[] = [
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
  }
];

// Execution Result Types
export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: ErrorDetails;
  metadata: {
  execution_id: string;
  duration_ms: number;
  cost_incurred: number;
  retry_count: number;
  rate_limit_remaining?: number;
  quota_remaining?: number;
  cache_hit?: boolean;
  cached_at?: string;
  };
}

export interface ToolMetrics {
  tool_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration_ms: number;
  total_cost: number;
  success_rate: number;
  last_execution_at?: string;
  rate_limit_hits: number;
  error_breakdown: Record<string, number>;
}

export interface ToolUsageQuota {
  tool_id: string;
  user_id: string;
  workspace_id: string;
  period: 'daily' | 'weekly' | 'monthly';
  limit: number;
  used: number;
  remaining: number;
  resets_at: string;
}

// Tool Discovery and Registry
export interface ToolRegistry {
  tools: Tool[];
  categories: ToolCategory[];
  total_count: number;
  last_updated: string;
}

export interface ToolSearchFilter {
  query?: string;
  category?: string;
  authentication_type?: string;
  cost_range?: [number, number];
  status?: string[];
  tags?: string[];
  has_examples?: boolean;
}

export interface ToolDiscoveryResult {
  tools: Tool[];
  total_count: number;
  filters_applied: ToolSearchFilter;
  suggested_tools?: Tool[];
  popular_tools?: Tool[];
}