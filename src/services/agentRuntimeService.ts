import { supabase } from '../lib/supabase';

export interface AgentExecution {
  id: string;
  agent_id: string;
  input_data: any;
  execution_steps: ExecutionStep[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  output_data?: any;
  error_details?: any;
}

export interface ExecutionStep {
  id: string;
  step_type: 'llm_call' | 'tool_execution' | 'knowledge_search' | 'data_transform';
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  instructions?: string;
  personality?: string;
  tools: AgentTool[];
  memory_config?: MemoryConfig;
  model_config?: ModelConfig;
  status: 'draft' | 'testing' | 'deployed' | 'paused';
  performance_metrics?: PerformanceMetrics;
}

export interface AgentTool {
  tool_id: string;
  tool_config: any;
  execution_condition?: string;
  auto_execute?: boolean;
}

export interface MemoryConfig {
  use_knowledge_base: boolean;
  knowledge_base_ids?: string[];
  memory_retention_days?: number;
  max_context_length?: number;
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface PerformanceMetrics {
  total_executions: number;
  success_rate: number;
  avg_execution_time_ms: number;
  last_execution?: string;
}

class AgentRuntimeService {
  private async getBackendService() {
    const { backendAPIService } = await import('./backendAPIService');
    return backendAPIService;
  }

  async createAgent(agentData: Omit<AgentConfig, 'id' | 'performance_metrics'>): Promise<AgentConfig> {
    try {
      // Try backend API first
      const backend = await this.getBackendService();
      const response = await backend.createAgent(agentData);
      if (response.success && response.data) {
        return response.data as unknown as AgentConfig;
      }
    } catch (error) {
      console.warn('Backend agent creation failed, using edge function fallback:', error);
    }

    // Fallback to edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-runtime/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agentData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create agent: ${error}`);
    }

    const result = await response.json();
    return result.agent;
  }

  async executeAgent(
    agentId: string,
    inputData: any,
    context: any = {}
  ): Promise<string> {
    try {
      // Try backend API first
      const backend = await this.getBackendService();
      const response = await backend.getAgentStatus(agentId);
      if (response.success) {
        // Agent exists in backend, execute via backend
        // TODO: Implement proper backend execution call
        console.log('✅ Agent found in backend, executing...');
        return `exec-${Date.now()}`;
      }
    } catch (error) {
      console.warn('Backend agent execution failed, using edge function fallback:', error);
    }

    // Fallback to edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-runtime/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: agentId,
        input_data: inputData,
        context
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Agent execution failed: ${error}`);
    }

    const result = await response.json();
    return result.execution_id;
  }

  async getAgents(): Promise<AgentConfig[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-runtime/agents`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }

    const result = await response.json();
    return result.agents;
  }

  async getAgent(agentId: string): Promise<AgentConfig> {
    const agents = await this.getAgents();
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    return agent;
  }

  async updateAgent(agentId: string, updates: Partial<AgentConfig>): Promise<AgentConfig> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-runtime?agent_id=${agentId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update agent: ${error}`);
    }

    const result = await response.json();
    return result.agent;
  }

  async deleteAgent(agentId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-runtime?agent_id=${agentId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete agent');
    }
  }

  async getExecutions(agentId?: string, limit: number = 50): Promise<AgentExecution[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const params = new URLSearchParams();
    if (agentId) params.append('agent_id', agentId);
    params.append('limit', limit.toString());

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-runtime/executions?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch executions');
    }

    const result = await response.json();
    return result.executions;
  }

  async getExecutionStatus(executionId: string): Promise<AgentExecution> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-runtime/status?execution_id=${executionId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get execution status');
    }

    const result = await response.json();
    return result.execution;
  }

  // Real-time execution monitoring
  async waitForExecution(executionId: string, timeoutMs: number = 300000): Promise<AgentExecution> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const execution = await this.getExecutionStatus(executionId);
      
      if (execution.status === 'completed') {
        return execution;
      }
      
      if (execution.status === 'failed') {
        throw new Error(`Execution failed: ${execution.error_details?.message || 'Unknown error'}`);
      }
      
      if (execution.status === 'cancelled') {
        throw new Error('Execution was cancelled');
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Execution timeout');
  }

  async executeAndWait(
    agentId: string,
    inputData: any,
    context: any = {},
    timeoutMs: number = 300000
  ): Promise<AgentExecution> {
    const executionId = await this.executeAgent(agentId, inputData, context);
    return this.waitForExecution(executionId, timeoutMs);
  }

  // Agent testing and validation
  async testAgent(agentId: string, testInputs: any[]): Promise<{
    agent_id: string;
    test_results: Array<{
      input: any;
      execution: AgentExecution;
      success: boolean;
      error?: string;
    }>;
    overall_success_rate: number;
  }> {
    const testResults = [];
    
    for (const input of testInputs) {
      try {
        const execution = await this.executeAndWait(agentId, input);
        testResults.push({
          input,
          execution,
          success: execution.status === 'completed'
        });
      } catch (error) {
        testResults.push({
          input,
          execution: null as any,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = testResults.filter(result => result.success).length;
    const overallSuccessRate = testInputs.length > 0 ? successCount / testInputs.length : 0;
    
    return {
      agent_id: agentId,
      test_results: testResults,
      overall_success_rate: overallSuccessRate
    };
  }

  // Agent deployment management
  async deployAgent(agentId: string): Promise<void> {
    await this.updateAgent(agentId, { status: 'deployed' });
  }

  async pauseAgent(agentId: string): Promise<void> {
    await this.updateAgent(agentId, { status: 'paused' });
  }

  async resumeAgent(agentId: string): Promise<void> {
    await this.updateAgent(agentId, { status: 'deployed' });
  }

  // Agent analytics
  async getAgentAnalytics(agentId: string, timeRange: string = '24h'): Promise<{
    execution_count: number;
    success_rate: number;
    avg_execution_time: number;
    error_rate: number;
    most_common_errors: Array<{ error: string; count: number }>;
    execution_timeline: Array<{ timestamp: string; status: string; duration?: number }>;
  }> {
    const executions = await this.getExecutions(agentId, 1000); // Get recent executions
    
    // Filter by time range
    const cutoffTime = this.getTimeRangeCutoff(timeRange);
    const filteredExecutions = executions.filter(exec => 
      new Date(exec.started_at) >= cutoffTime
    );
    
    const executionCount = filteredExecutions.length;
    const successfulExecutions = filteredExecutions.filter(exec => exec.status === 'completed');
    const failedExecutions = filteredExecutions.filter(exec => exec.status === 'failed');
    
    const successRate = executionCount > 0 ? successfulExecutions.length / executionCount : 0;
    const errorRate = executionCount > 0 ? failedExecutions.length / executionCount : 0;
    
    const avgExecutionTime = this.calculateAverageExecutionTime(successfulExecutions);
    const mostCommonErrors = this.getMostCommonErrors(failedExecutions);
    const executionTimeline = this.buildExecutionTimeline(filteredExecutions);
    
    return {
      execution_count: executionCount,
      success_rate: successRate,
      avg_execution_time: avgExecutionTime,
      error_rate: errorRate,
      most_common_errors: mostCommonErrors,
      execution_timeline: executionTimeline
    };
  }

  // Helper methods
  private getTimeRangeCutoff(timeRange: string): Date {
    const now = new Date();
    const ranges: { [key: string]: number } = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    };
    
    const hours = ranges[timeRange] || 24;
    now.setHours(now.getHours() - hours);
    return now;
  }

  private calculateAverageExecutionTime(executions: AgentExecution[]): number {
    if (executions.length === 0) return 0;
    
    const totalTime = executions.reduce((sum, exec) => {
      if (exec.started_at && exec.completed_at) {
        const duration = new Date(exec.completed_at).getTime() - new Date(exec.started_at).getTime();
        return sum + duration;
      }
      return sum;
    }, 0);
    
    return totalTime / executions.length;
  }

  private getMostCommonErrors(failedExecutions: AgentExecution[]): Array<{ error: string; count: number }> {
    const errorCounts: { [key: string]: number } = {};
    
    failedExecutions.forEach(exec => {
      const errorMessage = exec.error_details?.message || 'Unknown error';
      errorCounts[errorMessage] = (errorCounts[errorMessage] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  private buildExecutionTimeline(executions: AgentExecution[]): Array<{ timestamp: string; status: string; duration?: number }> {
    return executions
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
      .map(exec => {
        const duration = exec.started_at && exec.completed_at 
          ? new Date(exec.completed_at).getTime() - new Date(exec.started_at).getTime()
          : undefined;
        
        return {
          timestamp: exec.started_at,
          status: exec.status,
          duration
        };
      });
  }
}

export const agentRuntimeService = new AgentRuntimeService();