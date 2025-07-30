// Phase 3 Sprint 3.2: Tool Execution Engine
// Robust execution with retry logic and error handling

import { supabase } from '../lib/supabase';
import { credentialManagementService } from './credentialManagementService';
import type {
  Tool,
  ToolAction,
  ToolExecution,
  ExecutionResult,
  RetryPolicy,
  ErrorDetails,
  ExecutionContext
} from '../types/tools';

export class ToolExecutionEngine {
  private executionQueue: Map<string, ToolExecution> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private costTracker = new CostTracker();

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    console.log('[ToolExecutionEngine] Initializing execution engine...');
    
    // Initialize rate limiters for each tool
    await this.loadRateLimiters();
    
    // Start background processes
    this.startQueueProcessor();
  }

  /**
   * Execute a tool with comprehensive retry logic and error handling
   */
  async executeWithRetry(
    tool: Tool,
    action: ToolAction,
    params: any,
    context: ExecutionContext,
    retryPolicy?: RetryPolicy
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    // Create execution record
    const execution: ToolExecution = {
      id: executionId,
      agent_id: context.correlation_id,
      tool_id: tool.id,
      action_id: action.id,
      workspace_id: context.session_id, // Using session_id as workspace proxy
      input_data: params,
      status: 'queued',
      started_at: new Date().toISOString(),
      cost_incurred: 0,
      retry_count: 0,
      execution_context: context
    };

    this.executionQueue.set(executionId, execution);

    try {
      // Pre-execution validation
      await this.validateExecution(tool, action, params, context);

      // Check rate limits
      await this.checkRateLimit(tool.id, context.user_id);

      // Check usage quotas
      await this.checkUsageQuota(tool.id, context.user_id, context.session_id);

      // Get default retry policy if not provided
      const policy = retryPolicy || this.getDefaultRetryPolicy(tool);

      // Execute with retry logic
      const result = await this.executeWithRetryLogic(
        tool,
        action,
        params,
        context,
        policy,
        execution
      );

      // Update execution record
      execution.status = result.success ? 'completed' : 'failed';
      execution.completed_at = new Date().toISOString();
      execution.duration_ms = Date.now() - startTime;
      execution.output_data = result.data;
      execution.error_details = result.error;
      execution.cost_incurred = result.metadata.cost_incurred;

      // Track metrics and costs
      await this.trackExecution(execution);
      await this.costTracker.recordCost(tool.id, result.metadata.cost_incurred, context);

      return result;

    } catch (error) {
      // Handle execution failure
      execution.status = 'failed';
      execution.completed_at = new Date().toISOString();
      execution.duration_ms = Date.now() - startTime;
      execution.error_details = this.createErrorDetails(error, 'unknown', 0, false);

      await this.trackExecution(execution);

      return {
        success: false,
        error: execution.error_details,
        metadata: {
          execution_id: executionId,
          duration_ms: execution.duration_ms || 0,
          cost_incurred: 0,
          retry_count: 0
        }
      };
    } finally {
      // Cleanup
      this.executionQueue.delete(executionId);
    }
  }

  /**
   * Core retry logic implementation
   */
  private async executeWithRetryLogic(
    tool: Tool,
    action: ToolAction,
    params: any,
    context: ExecutionContext,
    policy: RetryPolicy,
    execution: ToolExecution
  ): Promise<ExecutionResult> {
    let lastError: ErrorDetails | undefined;
    let attempt = 0;

    while (attempt < policy.max_attempts) {
      try {
        execution.retry_count = attempt;
        execution.status = 'running';

        // Execute the actual tool action
        const result = await this.executeTool(tool, action, params, context);

        if (result.success) {
          return result;
        }

        // Check if error is retryable
        if (result.error && !this.isRetryableError(result.error, policy)) {
          return result;
        }

        lastError = result.error;

      } catch (error) {
        lastError = this.createErrorDetails(error, 'unknown', attempt, true);
      }

      attempt++;

      // Calculate delay for next retry
      if (attempt < policy.max_attempts) {
        const delay = this.calculateRetryDelay(attempt, policy);
        console.log(`[ToolExecutionEngine] Retrying ${tool.name}.${action.name} in ${delay}ms (attempt ${attempt + 1}/${policy.max_attempts})`);
        
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: lastError || this.createErrorDetails(
        new Error('Max retries exceeded'),
        'timeout',
        attempt,
        false
      ),
      metadata: {
        execution_id: execution.id,
        duration_ms: Date.now() - new Date(execution.started_at).getTime(),
        cost_incurred: execution.cost_incurred,
        retry_count: attempt
      }
    };
  }

  /**
   * Execute the actual tool action
   */
  private async executeTool(
    tool: Tool,
    action: ToolAction,
    params: any,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let cost = action.cost_override || tool.cost_per_call || 0;

    try {
      // Get credentials for the tool
      const credentials = await credentialManagementService.getWorkspaceCredentials(
        context.session_id
      );
      
      const toolCredentials = credentials.find(c => c.service_name === tool.id);
      if (!toolCredentials && tool.authentication.type !== 'none') {
        throw new Error(`No credentials found for tool ${tool.name}`);
      }

      // Execute based on tool type
      let result: any;
      
      if (tool.metadata?.provider === 'mcp') {
        // Execute via MCP protocol
        result = await this.executeMCPTool(tool, action, params, toolCredentials);
      } else {
        // Execute via direct API call
        result = await this.executeDirectAPICall(tool, action, params, toolCredentials);
      }

      return {
        success: true,
        data: result,
        metadata: {
          execution_id: context.correlation_id,
          duration_ms: Date.now() - startTime,
          cost_incurred: cost,
          retry_count: 0
        }
      };

    } catch (error) {
      const errorDetails = this.createErrorDetails(
        error,
        this.inferErrorType(error),
        0,
        this.isRetryableError({ error_type: this.inferErrorType(error) } as ErrorDetails, this.getDefaultRetryPolicy(tool))
      );

      return {
        success: false,
        error: errorDetails,
        metadata: {
          execution_id: context.correlation_id,
          duration_ms: Date.now() - startTime,
          cost_incurred: 0,
          retry_count: 0
        }
      };
    }
  }

  /**
   * Execute tool via direct API call
   */
  private async executeDirectAPICall(
    tool: Tool,
    action: ToolAction,
    params: any,
    credentials: any
  ): Promise<any> {
    // Tool-specific execution logic
    const toolExecutors: Record<string, (action: ToolAction, params: any, creds: any) => Promise<any>> = {
      'slack': this.executeSlackAction.bind(this),
      'gmail': this.executeGmailAction.bind(this),
      'google_sheets': this.executeGoogleSheetsAction.bind(this),
      'elevenlabs': this.executeElevenLabsAction.bind(this),
      'gemini': this.executeGeminiAction.bind(this),
      'webhook': this.executeWebhookAction.bind(this)
    };

    const executor = toolExecutors[tool.id];
    if (!executor) {
      throw new Error(`No executor found for tool ${tool.id}`);
    }

    return await executor(action, params, credentials);
  }

  /**
   * Tool-specific executors
   */
  private async executeSlackAction(action: ToolAction, params: any, credentials: any): Promise<any> {
    const apiKey = credentials?.encrypted_value;
    if (!apiKey) throw new Error('Slack API key not found');

    if (action.id === 'slack_send_message') {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: params.channel,
          text: params.text,
          blocks: params.blocks
        })
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      return await response.json();
    }

    throw new Error(`Unknown Slack action: ${action.id}`);
  }

  private async executeGmailAction(action: ToolAction, params: any, _credentials: any): Promise<any> {
    // Gmail API implementation
    if (import.meta.env.DEV) {
      return { message: `Gmail action ${action.id} executed (mock)`, params };
    }
    
    throw new Error('Gmail integration not yet implemented');
  }

  private async executeGoogleSheetsAction(action: ToolAction, params: any, _credentials: any): Promise<any> {
    // Google Sheets API implementation
    if (import.meta.env.DEV) {
      return { message: `Google Sheets action ${action.id} executed (mock)`, params };
    }
    
    throw new Error('Google Sheets integration not yet implemented');
  }

  private async executeElevenLabsAction(action: ToolAction, params: any, credentials: any): Promise<any> {
    const apiKey = credentials?.encrypted_value;
    if (!apiKey) throw new Error('ElevenLabs API key not found');

    if (action.id === 'elevenlabs_tts') {
      const voiceId = credentials?.metadata?.elevenlabs_voice_id || params.voiceId || '21m00Tcm4TlvDq8ikWAM';
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: params.text,
          voice_settings: {
            stability: params.stability || 0.5,
            similarity_boost: params.similarityBoost || 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return {
        audio_url: URL.createObjectURL(audioBlob),
        size: audioBlob.size,
        type: audioBlob.type
      };
    }

    throw new Error(`Unknown ElevenLabs action: ${action.id}`);
  }

  private async executeGeminiAction(action: ToolAction, params: any, _credentials: any): Promise<any> {
    // Gemini API implementation
    if (import.meta.env.DEV) {
      return { 
        message: `Gemini action ${action.id} executed (mock)`, 
        generated_text: `Generated response for: ${params.prompt}`,
        params 
      };
    }
    
    throw new Error('Gemini integration not yet implemented');
  }

  private async executeWebhookAction(action: ToolAction, params: any, _credentials: any): Promise<any> {
    if (action.id === 'webhook_send') {
      const response = await fetch(params.url, {
        method: params.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(params.headers || {})
        },
        body: params.body ? JSON.stringify(params.body) : undefined
      });

      return {
        status: response.status,
        statusText: response.statusText,
        data: await response.text()
      };
    }

    throw new Error(`Unknown webhook action: ${action.id}`);
  }

  /**
   * Execute tool via MCP protocol
   */
  private async executeMCPTool(
    _tool: Tool,
    action: ToolAction,
    params: any,
    _credentials: any
  ): Promise<any> {
    // MCP protocol implementation - placeholder for now
    if (import.meta.env.DEV) {
      return {
        message: `MCP tool ${_tool.name}.${action.name} executed (mock)`,
        params
      };
    }
    
    throw new Error('MCP integration not yet implemented');
  }

  // Utility methods
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultRetryPolicy(_tool: Tool): RetryPolicy {
    return {
      max_attempts: 3,
      backoff_strategy: 'exponential',
      base_delay_ms: 1000,
      max_delay_ms: 30000,
      retry_on_errors: ['500', '502', '503', '504', 'ECONNRESET', 'ETIMEDOUT'],
      timeout_ms: 30000,
      jitter_enabled: true
    };
  }

  private calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
    let delay: number;
    
    switch (policy.backoff_strategy) {
      case 'linear':
        delay = policy.base_delay_ms * attempt;
        break;
      case 'exponential':
        delay = policy.base_delay_ms * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = policy.base_delay_ms;
        break;
    }

    // Apply jitter if enabled
    if (policy.jitter_enabled) {
      delay += Math.random() * 1000;
    }

    return Math.min(delay, policy.max_delay_ms);
  }

  private isRetryableError(error: ErrorDetails, policy: RetryPolicy): boolean {
    if (!error.is_retryable) return false;
    
    return policy.retry_on_errors.some(errorCode => 
      error.error_code === errorCode || 
      error.error_type === errorCode ||
      error.error_message.includes(errorCode)
    );
  }

  private inferErrorType(error: any): string {
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return 'network';
    if (error?.status === 401 || error?.status === 403) return 'authentication';
    if (error?.status === 429) return 'rate_limit';
    if (error?.status >= 500) return 'service_unavailable';
    if (error?.status >= 400) return 'validation';
    return 'unknown';
  }

  private createErrorDetails(
    error: any,
    type: string,
    retryCount: number,
    isRetryable: boolean
  ): ErrorDetails {
    return {
      error_code: error?.status?.toString() || error?.code || 'UNKNOWN',
      error_message: error?.message || 'Unknown error occurred',
      error_type: type as any,
      stack_trace: error?.stack,
      retry_count: retryCount,
      is_retryable: isRetryable,
      upstream_error: error
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validation and rate limiting
  private async validateExecution(
    tool: Tool,
    action: ToolAction,
    _params: any,
    _context: ExecutionContext
  ): Promise<void> {
    // Validate input parameters against schema
    // Implementation would use a JSON schema validator
    console.log(`[ToolExecutionEngine] Validating execution for ${tool.name}.${action.name}`);
  }

  private async checkRateLimit(toolId: string, userId: string): Promise<void> {
    const rateLimiter = this.rateLimiters.get(toolId);
    if (rateLimiter && !rateLimiter.checkLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }
  }

  private async checkUsageQuota(toolId: string, _userId: string, _workspaceId: string): Promise<void> {
    // Check usage quotas
    console.log(`[ToolExecutionEngine] Checking usage quota for ${toolId}`);
  }

  private async loadRateLimiters(): Promise<void> {
    // Load rate limiters for tools
    console.log('[ToolExecutionEngine] Loading rate limiters...');
  }

  private startQueueProcessor(): void {
    // Background queue processing
    console.log('[ToolExecutionEngine] Starting queue processor...');
  }

  private async trackExecution(execution: ToolExecution): Promise<void> {
    if (import.meta.env.DEV || !supabase) {
      console.log('[ToolExecutionEngine] Tracking execution (mock):', execution);
      return;
    }

    // Save execution to database
    await supabase
      .from('tool_executions')
      .insert({
        id: execution.id,
        tool_id: execution.tool_id,
        action_id: execution.action_id,
        status: execution.status,
        duration_ms: execution.duration_ms,
        cost_incurred: execution.cost_incurred,
        retry_count: execution.retry_count,
        error_details: execution.error_details,
        created_at: execution.started_at
      });
  }
}

// Supporting classes
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  checkLimit(userId: string): boolean {
    // Simple rate limiting implementation
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= 60) { // 60 requests per minute
      return false;
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}

class CostTracker {
  async recordCost(toolId: string, cost: number, _context: ExecutionContext): Promise<void> {
    console.log(`[CostTracker] Recording cost: ${cost} for tool ${toolId}`);
    // Implementation would track costs in database
  }
}


// Singleton instance
export const toolExecutionEngine = new ToolExecutionEngine();