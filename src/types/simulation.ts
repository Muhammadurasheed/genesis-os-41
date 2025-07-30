// Phase 3 Sprint 3.3: Simulation Lab Type Definitions
// Following exact specifications from master blueprint

export interface SimulationEnvironment {
  id: string;
  workspace_id: string;
  workflow_id: string;
  name: string;
  description: string;
  mock_data: MockDataSet[];
  scenarios: TestScenario[];
  results: SimulationResult[];
  created_at: string;
  updated_at: string;
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed';
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  input_data: any;
  expected_outputs?: any;
  success_criteria: SuccessCriteria[];
  execution_order: number;
  timeout_ms: number;
  retry_config?: RetryConfig;
}

export interface SuccessCriteria {
  id: string;
  name: string;
  type: 'response_time' | 'accuracy' | 'completion_rate' | 'cost' | 'custom';
  operator: 'less_than' | 'greater_than' | 'equals' | 'contains' | 'matches_regex';
  expected_value: any;
  weight: number; // 0-1, for overall scoring
}

export interface MockDataSet {
  id: string;
  name: string;
  type: 'json' | 'csv' | 'api_response' | 'file_upload';
  data: any;
  schema?: JsonSchema;
  size_mb: number;
}

export interface SimulationResult {
  id: string;
  environment_id: string;
  scenario_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  execution_steps: SimulationExecutionStep[];
  performance_metrics: SimulationPerformanceMetrics;
  cost_breakdown: SimulationCostBreakdown;
  success_score: number; // 0-1
  errors: SimulationError[];
}

export interface SimulationExecutionStep {
  id: string;
  step_name: string;
  step_type: 'trigger' | 'action' | 'condition' | 'integration' | 'delay';
  node_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  input_data: any;
  output_data?: any;
  mock_response?: any;
  actual_api_call?: boolean;
  error_details?: SimulationError;
}

export interface SimulationPerformanceMetrics {
  total_execution_time: number;
  average_response_time: number;
  success_rate: number;
  throughput_per_second: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  network_requests_count: number;
  cache_hit_rate: number;
}

export interface SimulationCostBreakdown {
  total_cost: number;
  ai_model_cost: number;
  api_calls_cost: number;
  compute_cost: number;
  storage_cost: number;
  estimated_production_cost_monthly: number;
}

export interface SimulationError {
  id: string;
  step_id?: string;
  error_type: 'timeout' | 'validation' | 'api_error' | 'mock_error' | 'system_error';
  error_code: string;
  error_message: string;
  stack_trace?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_suggestion?: string;
}

// Mock Service Layer Interfaces
export interface MockService {
  service_name: string;
  service_id: string;
  base_url: string;
  endpoints: MockEndpoint[];
  response_patterns: ResponsePattern[];
  authentication: MockAuthConfig;
  global_latency: LatencyConfig;
  reliability_config: ReliabilityConfig;
}

export interface MockEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  response_templates: ResponseTemplate[];
  latency_simulation: LatencyConfig;
  failure_simulation: FailureConfig;
  rate_limit_simulation?: RateLimitConfig;
  conditional_responses: ConditionalResponse[];
}

export interface ResponseTemplate {
  id: string;
  name: string;
  status_code: number;
  headers: Record<string, string>;
  body: any;
  content_type: string;
  scenario_conditions?: string[]; // When to use this template
  probability_weight: number; // For random responses
}

export interface ResponsePattern {
  id: string;
  name: string;
  pattern_type: 'success' | 'error' | 'timeout' | 'rate_limit';
  trigger_conditions: string[];
  response_template_id: string;
  frequency_percent: number;
}

export interface LatencyConfig {
  min_ms: number;
  max_ms: number;
  distribution: 'uniform' | 'normal' | 'exponential';
  mean_ms?: number;
  std_dev_ms?: number;
}

export interface FailureConfig {
  enabled: boolean;
  failure_rate: number; // 0-1
  failure_types: FailureType[];
  recovery_time_ms?: number;
}

export interface FailureType {
  type: 'timeout' | 'server_error' | 'network_error' | 'rate_limit' | 'auth_error';
  probability: number; // 0-1
  error_response?: ResponseTemplate;
}

export interface RateLimitConfig {
  requests_per_minute: number;
  burst_limit: number;
  reset_interval_ms: number;
  rate_limit_response: ResponseTemplate;
}

export interface ConditionalResponse {
  id: string;
  condition: string; // JavaScript expression
  response_template_id: string;
  priority: number; // Higher priority evaluated first
}

export interface MockAuthConfig {
  type: 'none' | 'api_key' | 'bearer_token' | 'oauth';
  required_headers?: string[];
  valid_tokens?: string[];
  auth_failure_response?: ResponseTemplate;
}

export interface ReliabilityConfig {
  uptime_percentage: number; // 0-100
  downtime_simulation: DowntimeConfig[];
  circuit_breaker?: CircuitBreakerConfig;
}

export interface DowntimeConfig {
  start_time: string; // ISO timestamp or cron expression
  duration_ms: number;
  downtime_response: ResponseTemplate;
  affects_endpoints?: string[]; // Specific endpoints, or all if empty
}

export interface CircuitBreakerConfig {
  failure_threshold: number;
  recovery_timeout_ms: number;
  half_open_max_calls: number;
}

// Voice/Video Integration Interfaces
export interface ConversationSimulation {
  id: string;
  agent_id: string;
  simulation_environment_id: string;
  voice_config: ElevenLabsConfig;
  video_config: TavusConfig;
  conversation_script?: ConversationScript;
  real_time_interaction: boolean;
  session_config: ConversationSessionConfig;
  status: 'setup' | 'ready' | 'running' | 'completed' | 'failed';
  results?: ConversationSimulationResult;
}

export interface ElevenLabsConfig {
  voice_id: string;
  model_id: string;
  voice_settings: {
    stability: number; // 0-1
    similarity_boost: number; // 0-1
    style: number; // 0-1
    use_speaker_boost?: boolean;
  };
  output_format: 'mp3_44100_128' | 'pcm_16000' | 'pcm_22050';
  optimize_streaming_latency?: number; // 0-4
}

export interface TavusConfig {
  persona_id: string;
  background_setting: string;
  interaction_mode: 'listening' | 'speaking' | 'thinking';
  video_quality: 'low' | 'medium' | 'high' | 'ultra';
  frame_rate: 24 | 30 | 60;
  resolution: '720p' | '1080p' | '4k';
  background_blur?: boolean;
  custom_styling?: VideoStylingConfig;
}

export interface VideoStylingConfig {
  background_color?: string;
  lighting_preset?: 'natural' | 'studio' | 'warm' | 'cool';
  camera_angle?: 'front' | 'slight_angle' | 'profile';
  zoom_level?: 'close' | 'medium' | 'wide';
}

export interface ConversationScript {
  id: string;
  name: string;
  description: string;
  conversation_turns: ConversationTurn[];
  expected_duration_minutes: number;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface ConversationTurn {
  id: string;
  order: number;
  speaker: 'user' | 'agent';
  message: string;
  expected_response_pattern?: string; // Regex or keyword matching
  emotion_target?: 'neutral' | 'happy' | 'concerned' | 'frustrated' | 'excited';
  timing_requirements?: TimingRequirement;
}

export interface TimingRequirement {
  max_response_time_ms: number;
  pause_before_ms?: number;
  pause_after_ms?: number;
}

export interface ConversationSessionConfig {
  max_duration_minutes: number;
  auto_end_on_silence_ms: number;
  allow_interruptions: boolean;
  enable_sentiment_analysis: boolean;
  enable_keyword_detection: boolean;
  keywords_to_track?: string[];
  language: string;
  enable_transcription: boolean;
}

export interface ConversationSimulationResult {
  id: string;
  conversation_id: string;
  total_duration_ms: number;
  turn_count: number;
  successful_turns: number;
  conversation_transcript: ConversationTranscript[];
  sentiment_analysis: SentimentAnalysisResult[];
  voice_quality_metrics: VoiceQualityMetrics;
  video_quality_metrics: VideoQualityMetrics;
  performance_scores: ConversationPerformanceScores;
}

export interface ConversationTranscript {
  id: string;
  timestamp: string;
  speaker: 'user' | 'agent';
  message: string;
  confidence_score: number;
  response_time_ms?: number;
  emotion_detected?: string;
  keywords_matched?: string[];
}

export interface SentimentAnalysisResult {
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: EmotionScore[];
}

export interface EmotionScore {
  emotion: string;
  intensity: number; // 0-1
}

export interface VoiceQualityMetrics {
  average_latency_ms: number;
  audio_quality_score: number; // 0-1
  naturalness_score: number; // 0-1
  clarity_score: number; // 0-1
  interruption_count: number;
  silence_periods_ms: number[];
}

export interface VideoQualityMetrics {
  frame_rate_actual: number;
  resolution_actual: string;
  sync_accuracy_ms: number; // Audio-video sync
  visual_quality_score: number; // 0-1
  gesture_naturalness_score: number; // 0-1
  eye_contact_percentage: number; // 0-100
}

export interface ConversationPerformanceScores {
  overall_score: number; // 0-100
  communication_effectiveness: number; // 0-100
  technical_quality: number; // 0-100
  user_experience: number; // 0-100
  goal_achievement: number; // 0-100
  response_appropriateness: number; // 0-100
}

// Debug Panel Interfaces
export interface DebugPanel {
  simulation_id: string;
  execution_timeline: ExecutionStep[];
  variable_inspector: VariableState[];
  api_call_logs: APICallLog[];
  error_tracker: ErrorEvent[];
  performance_metrics: PerformanceMetric[];
  cost_breakdown: CostAnalysis;
  real_time_updates: boolean;
  filter_config: DebugFilterConfig;
}

export interface ExecutionStep {
  id: string;
  timestamp: string;
  step_type: 'start' | 'node_execution' | 'api_call' | 'decision' | 'error' | 'completion';
  node_id?: string;
  node_name?: string;
  duration_ms?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data?: any;
  output_data?: any;
  metadata?: Record<string, any>;
  parent_step_id?: string;
  child_step_ids?: string[];
}

export interface VariableState {
  id: string;
  variable_name: string;
  variable_type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  current_value: any;
  previous_value?: any;
  last_modified: string;
  scope: 'global' | 'workflow' | 'node' | 'step';
  scope_id: string;
  is_sensitive: boolean; // For masking PII/credentials
}

export interface APICallLog {
  id: string;
  timestamp: string;
  service_name: string;
  endpoint: string;
  method: string;
  request_headers: Record<string, string>;
  request_body?: any;
  response_status: number;
  response_headers: Record<string, string>;
  response_body?: any;
  duration_ms: number;
  cost: number;
  is_mock: boolean;
  error_details?: string;
  rate_limit_info?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: string;
  retry_after?: number;
}

export interface ErrorEvent {
  id: string;
  timestamp: string;
  error_type: 'system' | 'user' | 'integration' | 'validation' | 'timeout' | 'rate_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  error_code: string;
  error_message: string;
  error_source: string; // Component/service that generated the error
  stack_trace?: string;
  context: Record<string, any>;
  resolution_status: 'open' | 'investigating' | 'resolved' | 'ignored';
  resolution_notes?: string;
  affects_execution: boolean;
}

export interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_type: 'counter' | 'gauge' | 'histogram' | 'timer';
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
  threshold?: PerformanceThreshold;
}

export interface PerformanceThreshold {
  warning_value: number;
  critical_value: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
}

export interface CostAnalysis {
  total_cost: number;
  cost_by_category: CostCategory[];
  cost_by_time: TimeCostBreakdown[];
  projected_monthly_cost: number;
  cost_optimization_suggestions: CostOptimizationSuggestion[];
  budget_alerts?: BudgetAlert[];
}

export interface CostCategory {
  category: string;
  subcategory?: string;
  cost: number;
  usage_units: number;
  unit_cost: number;
  percentage_of_total: number;
}

export interface TimeCostBreakdown {
  timestamp: string;
  interval_cost: number;
  cumulative_cost: number;
  cost_rate_per_hour: number;
}

export interface CostOptimizationSuggestion {
  id: string;
  suggestion_type: 'reduce_api_calls' | 'optimize_model' | 'cache_responses' | 'batch_requests';
  description: string;
  potential_savings: number;
  implementation_effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface BudgetAlert {
  id: string;
  alert_type: 'approaching_limit' | 'exceeded_limit' | 'unusual_spending';
  threshold_value: number;
  current_value: number;
  alert_level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export interface DebugFilterConfig {
  time_range: {
    start: string;
    end: string;
  };
  log_levels: string[];
  error_types: string[];
  service_filters: string[];
  node_filters: string[];
  search_query?: string;
  show_mock_calls: boolean;
  show_successful_only: boolean;
}

// Utility Types
export interface JsonSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface RetryConfig {
  max_attempts: number;
  backoff_strategy: 'linear' | 'exponential' | 'fixed';
  base_delay_ms: number;
  max_delay_ms: number;
  retry_on_errors: string[];
}

// Simulation Configuration Types
export interface SimulationConfiguration {
  environment_settings: EnvironmentSettings;
  mock_services: MockService[];
  test_scenarios: TestScenario[];
  performance_targets: PerformanceTargets;
  voice_video_config?: ConversationSimulation;
  debug_config: DebugConfiguration;
}

export interface EnvironmentSettings {
  isolation_level: 'sandbox' | 'staging' | 'production_mirror';
  resource_limits: ResourceLimits;
  network_simulation: NetworkSimulation;
  data_privacy_mode: boolean;
}

export interface ResourceLimits {
  max_execution_time_ms: number;
  max_memory_mb: number;
  max_api_calls: number;
  max_cost_dollars: number;
}

export interface NetworkSimulation {
  enabled: boolean;
  latency_ms: number;
  bandwidth_kbps: number;
  packet_loss_percentage: number;
  connection_stability: number; // 0-1
}

export interface PerformanceTargets {
  max_response_time_ms: number;
  min_success_rate: number; // 0-1
  max_cost_per_execution: number;
  min_throughput_per_second: number;
}

export interface DebugConfiguration {
  enable_real_time_monitoring: boolean;
  log_level: 'debug' | 'info' | 'warn' | 'error';
  capture_full_request_response: boolean;
  enable_performance_profiling: boolean;
  enable_cost_tracking: boolean;
  auto_save_results: boolean;
}

// Export all simulation-related types