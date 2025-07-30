import { supabase } from '../lib/supabase';
import { Agent, AgentCapability, WorkflowExecution, ExecutionStep } from '../types/masterBlueprint';
import { multiTenancyService } from './multiTenancyService';

class EnhancedAgentRuntimeService {
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private executionQueue: WorkflowExecution[] = [];

  // Agent Management with Full Capabilities
  async createAgent(agentData: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> {
    // Check workspace limits
    const limitsCheck = await multiTenancyService.checkLimits(agentData.workspace_id, 'create_agent');
    if (!limitsCheck.allowed) {
      throw new Error(limitsCheck.reason);
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('agents')
      .insert({
        ...agentData,
        created_at: now,
        updated_at: now,
        performance_metrics: {
          total_executions: 0,
          success_rate: 0,
          average_response_time: 0,
          error_count: 0,
          cost_this_month: 0
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Update usage tracking
    await multiTenancyService.incrementUsage(agentData.workspace_id, 'agents_created');
    
    return data;
  }

  async getAgent(agentId: string, workspaceId: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async updateAgent(agentId: string, updates: Partial<Agent>, workspaceId: string): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getWorkspaceAgents(workspaceId: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'deployed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Enhanced Workflow Execution with Resource Management
  async executeWorkflow(
    agentId: string, 
    workflowData: any, 
    workspaceId: string,
    triggerType: 'manual' | 'scheduled' | 'webhook' | 'email' = 'manual'
  ): Promise<WorkflowExecution> {
    // Check execution limits
    const limitsCheck = await multiTenancyService.checkLimits(workspaceId, 'execute_workflow');
    if (!limitsCheck.allowed) {
      throw new Error(limitsCheck.reason);
    }

    const agent = await this.getAgent(agentId, workspaceId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const executionId = crypto.randomUUID();
    const execution: WorkflowExecution = {
      id: executionId,
      workspace_id: workspaceId,
      agent_id: agentId,
      workflow_id: workflowData.workflow_id || 'manual',
      trigger_type: triggerType,
      input_data: workflowData,
      execution_steps: [],
      status: 'queued',
      started_at: new Date().toISOString(),
      cost_breakdown: {
        total_cost: 0,
        ai_model_cost: 0,
        tool_usage_cost: 0,
        compute_cost: 0,
        storage_cost: 0
      },
      resource_usage: {
        cpu_time_ms: 0,
        memory_peak_mb: 0,
        network_requests: 0,
        storage_operations: 0
      }
    };

    // Add to queue and start execution
    this.executionQueue.push(execution);
    this.activeExecutions.set(executionId, execution);

    // Process execution asynchronously
    this.processExecution(execution);

    // Update usage tracking
    await multiTenancyService.incrementUsage(workspaceId, 'executions_count');

    return execution;
  }

  private async processExecution(execution: WorkflowExecution): Promise<void> {
    try {
      execution.status = 'running';
      await this.updateExecutionInDatabase(execution);

      const agent = await this.getAgent(execution.agent_id, execution.workspace_id);
      if (!agent) {
        throw new Error('Agent not found during execution');
      }

      // Execute workflow steps based on agent capabilities
      for (const capability of agent.capabilities) {
        const step = await this.executeCapabilityStep(execution, agent, capability);
        execution.execution_steps.push(step);
        
        // Check resource limits
        if (this.checkResourceLimits(execution, capability.resource_limits)) {
          throw new Error('Resource limits exceeded');
        }
      }

      // Complete execution
      execution.status = 'completed';
      execution.completed_at = new Date().toISOString();
      
      // Update agent performance metrics
      await this.updateAgentMetrics(agent, execution);

    } catch (error) {
      execution.status = 'failed';
      execution.error_details = {
        error_code: 'EXECUTION_FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 0,
        is_retryable: true
      };
      execution.completed_at = new Date().toISOString();
    }

    // Update final execution state
    await this.updateExecutionInDatabase(execution);
    this.activeExecutions.delete(execution.id);
  }

  private async executeCapabilityStep(
    execution: WorkflowExecution, 
    agent: Agent, 
    capability: AgentCapability
  ): Promise<ExecutionStep> {
    const stepId = crypto.randomUUID();
    const startTime = Date.now();
    
    const step: ExecutionStep = {
      id: stepId,
      step_type: 'agent_call',
      step_name: capability.name,
      status: 'running',
      started_at: new Date().toISOString(),
      input_data: execution.input_data,
      cost: 0,
      duration_ms: 0
    };

    try {
      // Simulate capability execution based on tools required
      const result = await this.executeCapabilityLogic(capability, execution.input_data, agent);
      
      step.status = 'completed';
      step.output_data = result;
      step.cost = this.calculateStepCost(capability, result);
      
      // Update execution costs
      execution.cost_breakdown.total_cost += step.cost;
      execution.cost_breakdown.ai_model_cost += step.cost * 0.6; // 60% AI model cost
      execution.cost_breakdown.compute_cost += step.cost * 0.4; // 40% compute cost

    } catch (error) {
      step.status = 'failed';
      step.error_message = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      step.completed_at = new Date().toISOString();
      step.duration_ms = Date.now() - startTime;
      
      // Update resource usage
      execution.resource_usage.cpu_time_ms += step.duration_ms;
      execution.resource_usage.memory_peak_mb = Math.max(
        execution.resource_usage.memory_peak_mb, 
        this.estimateMemoryUsage(capability)
      );
      execution.resource_usage.network_requests += capability.required_tools.length;
    }

    return step;
  }

  private async executeCapabilityLogic(capability: AgentCapability, inputData: any, agent: Agent): Promise<any> {
    // Simulate different capability executions
    switch (capability.name.toLowerCase()) {
      case 'natural_language_processing':
        return await this.executeNLPCapability(inputData, agent);
      case 'data_analysis':
        return await this.executeDataAnalysisCapability(inputData, agent);
      case 'api_integration':
        return await this.executeAPIIntegrationCapability(inputData, agent);
      case 'email_automation':
        return await this.executeEmailAutomationCapability(inputData, agent);
      default:
        return { result: 'Capability executed successfully', processed_data: inputData };
    }
  }

  private async executeNLPCapability(_inputData: any, _agent: Agent): Promise<any> {
    // Simulate NLP processing with Gemini
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return {
      sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
      entities: ['entity1', 'entity2'],
      summary: 'Processed text using advanced NLP',
      confidence: Math.random()
    };
  }

  private async executeDataAnalysisCapability(_inputData: any, _agent: Agent): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    return {
      insights: ['Insight 1', 'Insight 2'],
      metrics: {
        count: Math.floor(Math.random() * 1000),
        average: Math.random() * 100,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      },
      recommendations: ['Recommendation 1', 'Recommendation 2']
    };
  }

  private async executeAPIIntegrationCapability(inputData: any, _agent: Agent): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
    return {
      api_response: { status: 'success', data: inputData },
      status_code: 200,
      response_time_ms: Math.floor(Math.random() * 1000)
    };
  }

  private async executeEmailAutomationCapability(_inputData: any, _agent: Agent): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return {
      emails_sent: Math.floor(Math.random() * 10) + 1,
      recipients: ['user@example.com'],
      delivery_status: 'delivered',
      open_rate: Math.random()
    };
  }

  private checkResourceLimits(execution: WorkflowExecution, limits: any): boolean {
    const { resource_usage } = execution;
    
    if (limits.max_execution_time && resource_usage.cpu_time_ms > limits.max_execution_time * 1000) {
      return true;
    }
    
    if (limits.max_memory_usage && resource_usage.memory_peak_mb > limits.max_memory_usage) {
      return true;
    }
    
    return false;
  }

  private calculateStepCost(capability: AgentCapability, _result: any): number {
    // Simple cost calculation based on capability complexity
    const baseCost = 0.01; // $0.01 base cost
    const complexityMultiplier = capability.required_tools.length * 0.005;
    return baseCost + complexityMultiplier;
  }

  private estimateMemoryUsage(capability: AgentCapability): number {
    // Estimate memory usage based on capability type
    return 50 + (capability.required_tools.length * 10); // MB
  }

  private async updateAgentMetrics(agent: Agent, execution: WorkflowExecution): Promise<void> {
    const metrics = agent.performance_metrics;
    metrics.total_executions += 1;
    metrics.last_execution_at = execution.completed_at;
    metrics.cost_this_month += execution.cost_breakdown.total_cost;
    
    if (execution.status === 'completed') {
      metrics.success_rate = ((metrics.success_rate * (metrics.total_executions - 1)) + 1) / metrics.total_executions;
    } else {
      metrics.error_count += 1;
      metrics.success_rate = ((metrics.success_rate * (metrics.total_executions - 1)) + 0) / metrics.total_executions;
    }
    
    const totalDuration = execution.execution_steps.reduce((sum, step) => sum + (step.duration_ms || 0), 0);
    metrics.average_response_time = ((metrics.average_response_time * (metrics.total_executions - 1)) + totalDuration) / metrics.total_executions;

    await this.updateAgent(agent.id, { performance_metrics: metrics }, agent.workspace_id);
  }

  private async updateExecutionInDatabase(execution: WorkflowExecution): Promise<void> {
    const { error } = await supabase
      .from('workflow_executions')
      .upsert(execution);

    if (error) {
      console.error('Failed to update execution in database:', error);
    }

    // Track costs
    if (execution.cost_breakdown.total_cost > 0) {
      await multiTenancyService.addCost(execution.workspace_id, 'ai_models', execution.cost_breakdown.ai_model_cost);
      await multiTenancyService.addCost(execution.workspace_id, 'compute', execution.cost_breakdown.compute_cost);
    }
  }

  // Execution Management
  async getExecutionStatus(executionId: string, workspaceId: string): Promise<WorkflowExecution | null> {
    // Check active executions first
    const activeExecution = this.activeExecutions.get(executionId);
    if (activeExecution && activeExecution.workspace_id === workspaceId) {
      return activeExecution;
    }

    // Query database
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async pauseExecution(executionId: string, workspaceId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (execution && execution.workspace_id === workspaceId) {
      execution.status = 'cancelled';
      await this.updateExecutionInDatabase(execution);
      this.activeExecutions.delete(executionId);
    }
  }

  async getWorkspaceExecutions(workspaceId: string, limit: number = 50): Promise<WorkflowExecution[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Runtime Monitoring
  getActiveExecutions(workspaceId: string): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values()).filter(
      execution => execution.workspace_id === workspaceId
    );
  }

  getQueuedExecutions(workspaceId: string): WorkflowExecution[] {
    return this.executionQueue.filter(execution => execution.workspace_id === workspaceId);
  }

  // Cleanup and maintenance
  async cleanupCompletedExecutions(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24); // Keep executions for 24 hours

    for (const [executionId, execution] of this.activeExecutions.entries()) {
      if ((execution.status === 'completed' || execution.status === 'failed') && 
          execution.completed_at && 
          new Date(execution.completed_at) < cutoffDate) {
        this.activeExecutions.delete(executionId);
      }
    }
  }
}

export const enhancedAgentRuntimeService = new EnhancedAgentRuntimeService();