// Master Blueprint: Phase 1 Complete Type Definitions
// Following exact specifications from master_blueprint.md

// Sprint 1.1: User Management Schema
export interface User {
  id: string; // UUID
  email: string; // Primary identifier
  name: string;
  company_name?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
  last_active: string;
  onboarding_completed: boolean;
}

export interface Workspace {
  id: string;
  owner_id: string; // User.id
  name: string;
  billing_email: string;
  subscription_status: 'active' | 'past_due' | 'canceled';
  usage_limits: {
    max_agents: number;
    max_monthly_executions: number;
    max_integrations: number;
  };
  current_usage: {
    agents_count: number;
    monthly_executions: number;
    integrations_count: number;
  };
  created_at: string;
  updated_at: string;
}

// Sprint 1.2: Intent Understanding System (Enhanced)
export interface BusinessIntent {
  id: string;
  user_id: string;
  workspace_id: string;
  raw_description: string; // What user typed
  extracted_goals: string[]; // AI-parsed objectives
  identified_processes: WorkflowProcess[];
  suggested_agents: AgentSuggestion[];
  complexity_score: number; // 1-10
  estimated_cost: number; // Monthly USD
  status: 'draft' | 'refined' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface WorkflowProcess {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface AgentSuggestion {
  name: string;
  role: string;
  description: string;
  tools_needed: string[];
  estimated_cost: number;
}

// Sprint 1.3: Knowledge Base & Memory Architecture (Enhanced)
export interface KnowledgeBase {
  id: string;
  workspace_id: string;
  name: string;
  type: 'documents' | 'database' | 'api' | 'website';
  connection_config: ConnectionConfig;
  indexing_status: 'pending' | 'processing' | 'completed' | 'failed';
  last_updated: string;
  chunk_count?: number;
  error_message?: string;
  created_at: string;
}

export interface ConnectionConfig {
  // Document connections
  file_path?: string;
  file_metadata?: {
    original_name: string;
    size: number;
    mime_type: string;
  };
  // API connections
  api_endpoint?: string;
  api_key?: string;
  headers?: Record<string, string>;
  // Database connections
  connection_string?: string;
  query?: string;
  // Website connections
  url?: string;
  crawl_depth?: number;
}

export interface MemorySegment {
  id: string;
  agent_id: string;
  workspace_id: string;
  knowledge_base_id?: string;
  content: string;
  embedding: number[]; // Vector representation
  importance_score: number; // 0-1
  access_frequency: number;
  last_accessed: string;
  tags: string[];
  expires_at?: string;
  created_at: string;
}

// Sprint 1.4: Agent Runtime & Orchestration Core (Enhanced)
export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  tools: Tool[];
  memory_config: MemoryConfig;
  personality: PersonalityProfile;
  status: 'draft' | 'testing' | 'deployed' | 'paused';
  performance_metrics: PerformanceMetrics;
  created_at: string;
  updated_at: string;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  required_tools: string[];
  permission_level: 'read' | 'write' | 'admin';
  resource_limits: ResourceLimits;
}

export interface Tool {
  id: string;
  name: string;
  type: 'api' | 'database' | 'webhook' | 'email' | 'file' | 'ai_model';
  configuration: Record<string, any>;
  permissions: string[];
  rate_limits?: {
    requests_per_minute: number;
    requests_per_hour: number;
  };
}

export interface MemoryConfig {
  max_memory_segments: number;
  retention_days: number;
  importance_threshold: number;
  auto_cleanup: boolean;
}

export interface PersonalityProfile {
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
  communication_style: string;
  response_format_preferences: string[];
  custom_instructions?: string;
}

export interface PerformanceMetrics {
  total_executions: number;
  success_rate: number;
  average_response_time: number;
  last_execution_at?: string;
  error_count: number;
  cost_this_month: number;
}

export interface ResourceLimits {
  max_execution_time: number; // seconds
  max_memory_usage: number; // MB
  max_cost_per_execution: number; // USD
  max_daily_executions: number;
}

export interface WorkflowExecution {
  id: string;
  workspace_id: string;
  agent_id: string;
  workflow_id: string;
  trigger_type: 'manual' | 'scheduled' | 'webhook' | 'email';
  input_data: any;
  execution_steps: ExecutionStep[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error_details?: ErrorDetails;
  cost_breakdown: CostBreakdown;
  resource_usage: ResourceUsage;
}

export interface ExecutionStep {
  id: string;
  step_type: 'agent_call' | 'tool_use' | 'condition_check' | 'delay';
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  input_data: any;
  output_data?: any;
  error_message?: string;
  cost: number;
  duration_ms?: number;
}

export interface ErrorDetails {
  error_code: string;
  error_message: string;
  stack_trace?: string;
  retry_count: number;
  is_retryable: boolean;
}

export interface CostBreakdown {
  total_cost: number;
  ai_model_cost: number;
  tool_usage_cost: number;
  compute_cost: number;
  storage_cost: number;
}

export interface ResourceUsage {
  cpu_time_ms: number;
  memory_peak_mb: number;
  network_requests: number;
  storage_operations: number;
}

// File Upload Interface Specs
export interface FileUpload {
  id: string;
  workspace_id: string;
  original_name: string;
  file_path: string;
  size: number;
  mime_type: string;
  max_size: number; // 100MB
  supported_formats: string[]; // ['.pdf', '.docx', '.txt', '.csv', '.xlsx']
  processing_pipeline: 'extract' | 'chunk' | 'embed' | 'index';
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress_percentage: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

// Subscription & Usage Tracking
export interface SubscriptionTier {
  name: 'free' | 'pro' | 'enterprise';
  limits: {
    max_agents: number;
    max_monthly_executions: number;
    max_integrations: number;
    max_storage_gb: number;
    max_knowledge_bases: number;
  };
  features: string[];
  price_monthly: number;
}

export interface UsageTracking {
  workspace_id: string;
  period: string; // YYYY-MM format
  agents_created: number;
  executions_count: number;
  integrations_active: number;
  storage_used_gb: number;
  knowledge_bases_count: number;
  costs: {
    ai_models: number;
    compute: number;
    storage: number;
    integrations: number;
    total: number;
  };
  updated_at: string;
}