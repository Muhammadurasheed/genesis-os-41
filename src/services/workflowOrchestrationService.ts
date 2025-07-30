import { supabase } from '../lib/supabase';

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_type: 'manual' | 'scheduled' | 'webhook' | 'event';
  input_data: any;
  execution_plan: ExecutionNode[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  output_data?: any;
  error_details?: any;
}

export interface ExecutionNode {
  id: string;
  node_id: string;
  type: 'trigger' | 'action' | 'condition' | 'integration' | 'agent';
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input: any;
  output?: any;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  error?: string;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'archived';
  trigger_config?: TriggerConfig;
  error_handling?: ErrorHandlingConfig;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'integration' | 'agent';
  position: { x: number; y: number };
  data: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  data?: any;
}

export interface TriggerConfig {
  type: 'manual' | 'scheduled' | 'webhook' | 'event';
  config: any;
}

export interface ErrorHandlingConfig {
  stop_on_failure: boolean;
  retry_count: number;
  retry_delay_ms: number;
}

export interface WorkflowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class WorkflowOrchestrationService {
  async createWorkflow(workflowData: Omit<WorkflowConfig, 'id' | 'created_at' | 'updated_at'>): Promise<WorkflowConfig> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-orchestration/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create workflow: ${error}`);
    }

    const result = await response.json();
    return result.workflow;
  }

  async executeWorkflow(
    workflowId: string,
    triggerType: 'manual' | 'scheduled' | 'webhook' | 'event' = 'manual',
    inputData: any = {},
    context: any = {}
  ): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-orchestration/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        trigger_type: triggerType,
        input_data: inputData,
        context
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Workflow execution failed: ${error}`);
    }

    const result = await response.json();
    return result.execution_id;
  }

  async getWorkflows(): Promise<WorkflowConfig[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-orchestration/workflows`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflows');
    }

    const result = await response.json();
    return result.workflows;
  }

  async getWorkflow(workflowId: string): Promise<WorkflowConfig> {
    const workflows = await this.getWorkflows();
    const workflow = workflows.find(w => w.id === workflowId);
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    return workflow;
  }

  async updateWorkflow(workflowId: string, updates: Partial<WorkflowConfig>): Promise<WorkflowConfig> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-orchestration?workflow_id=${workflowId}`,
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
      throw new Error(`Failed to update workflow: ${error}`);
    }

    const result = await response.json();
    return result.workflow;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-orchestration?workflow_id=${workflowId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete workflow');
    }
  }

  async validateWorkflow(workflowId: string): Promise<WorkflowValidation> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-orchestration/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ workflow_id: workflowId })
    });

    if (!response.ok) {
      throw new Error('Failed to validate workflow');
    }

    const result = await response.json();
    return result.validation;
  }

  async getExecutions(workflowId?: string, limit: number = 50): Promise<WorkflowExecution[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const params = new URLSearchParams();
    if (workflowId) params.append('workflow_id', workflowId);
    params.append('limit', limit.toString());

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-orchestration/executions?${params}`,
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

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/workflow-orchestration/status?execution_id=${executionId}`,
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
  async waitForExecution(executionId: string, timeoutMs: number = 600000): Promise<WorkflowExecution> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const execution = await this.getExecutionStatus(executionId);
      
      if (execution.status === 'completed') {
        return execution;
      }
      
      if (execution.status === 'failed') {
        throw new Error(`Workflow execution failed: ${execution.error_details?.message || 'Unknown error'}`);
      }
      
      if (execution.status === 'cancelled') {
        throw new Error('Workflow execution was cancelled');
      }
      
      // Wait 3 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    throw new Error('Workflow execution timeout');
  }

  async executeAndWait(
    workflowId: string,
    triggerType: 'manual' | 'scheduled' | 'webhook' | 'event' = 'manual',
    inputData: any = {},
    context: any = {},
    timeoutMs: number = 600000
  ): Promise<WorkflowExecution> {
    const executionId = await this.executeWorkflow(workflowId, triggerType, inputData, context);
    return this.waitForExecution(executionId, timeoutMs);
  }

  // Workflow testing and simulation
  async simulateWorkflow(workflowId: string, testInputs: any[]): Promise<{
    workflow_id: string;
    simulation_results: Array<{
      input: any;
      execution: WorkflowExecution;
      success: boolean;
      error?: string;
    }>;
    overall_success_rate: number;
  }> {
    const simulationResults = [];
    
    for (const input of testInputs) {
      try {
        const execution = await this.executeAndWait(workflowId, 'manual', input);
        simulationResults.push({
          input,
          execution,
          success: execution.status === 'completed'
        });
      } catch (error) {
        simulationResults.push({
          input,
          execution: null as any,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = simulationResults.filter(result => result.success).length;
    const overallSuccessRate = testInputs.length > 0 ? successCount / testInputs.length : 0;
    
    return {
      workflow_id: workflowId,
      simulation_results: simulationResults,
      overall_success_rate: overallSuccessRate
    };
  }

  // Workflow deployment management
  async deployWorkflow(workflowId: string): Promise<void> {
    // Validate workflow before deployment
    const validation = await this.validateWorkflow(workflowId);
    if (!validation.isValid) {
      throw new Error(`Cannot deploy invalid workflow: ${validation.errors.join(', ')}`);
    }
    
    await this.updateWorkflow(workflowId, { status: 'active' });
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, { status: 'archived' });
  }

  async resumeWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, { status: 'active' });
  }

  // Workflow analytics
  async getWorkflowAnalytics(workflowId: string, timeRange: string = '24h'): Promise<{
    execution_count: number;
    success_rate: number;
    avg_execution_time: number;
    error_rate: number;
    node_performance: Array<{ node_id: string; success_rate: number; avg_duration: number }>;
    execution_timeline: Array<{ timestamp: string; status: string; duration?: number }>;
  }> {
    const executions = await this.getExecutions(workflowId, 1000);
    
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
    const nodePerformance = this.calculateNodePerformance(filteredExecutions);
    const executionTimeline = this.buildExecutionTimeline(filteredExecutions);
    
    return {
      execution_count: executionCount,
      success_rate: successRate,
      avg_execution_time: avgExecutionTime,
      error_rate: errorRate,
      node_performance: nodePerformance,
      execution_timeline: executionTimeline
    };
  }

  // Frontend utility methods for workflow building
  validateWorkflowStructure(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for at least one trigger node
    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }

    // Check for orphaned nodes
    const nodeIds = new Set(nodes.map(node => node.id));
    const connectedNodes = new Set([
      ...edges.map(edge => edge.source),
      ...edges.map(edge => edge.target)
    ]);

    const orphanedNodes = nodes.filter(node => 
      node.type !== 'trigger' && !connectedNodes.has(node.id)
    );

    if (orphanedNodes.length > 0) {
      warnings.push(`${orphanedNodes.length} node(s) are not connected to the workflow`);
    }

    // Check for circular dependencies
    if (this.hasCircularDependencies(nodes, edges)) {
      errors.push('Circular dependencies detected in workflow');
    }

    // Validate edge connections
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge references non-existent target node: ${edge.target}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
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

  private calculateAverageExecutionTime(executions: WorkflowExecution[]): number {
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

  private calculateNodePerformance(executions: WorkflowExecution[]): Array<{ node_id: string; success_rate: number; avg_duration: number }> {
    const nodeStats: { [nodeId: string]: { successes: number; failures: number; durations: number[] } } = {};
    
    executions.forEach(exec => {
      exec.execution_plan?.forEach(node => {
        if (!nodeStats[node.node_id]) {
          nodeStats[node.node_id] = { successes: 0, failures: 0, durations: [] };
        }
        
        if (node.status === 'completed') {
          nodeStats[node.node_id].successes++;
          if (node.duration_ms) {
            nodeStats[node.node_id].durations.push(node.duration_ms);
          }
        } else if (node.status === 'failed') {
          nodeStats[node.node_id].failures++;
        }
      });
    });
    
    return Object.entries(nodeStats).map(([nodeId, stats]) => {
      const total = stats.successes + stats.failures;
      const successRate = total > 0 ? stats.successes / total : 0;
      const avgDuration = stats.durations.length > 0 
        ? stats.durations.reduce((sum, dur) => sum + dur, 0) / stats.durations.length 
        : 0;
      
      return {
        node_id: nodeId,
        success_rate: successRate,
        avg_duration: avgDuration
      };
    });
  }

  private buildExecutionTimeline(executions: WorkflowExecution[]): Array<{ timestamp: string; status: string; duration?: number }> {
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

  private hasCircularDependencies(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
    const adjacencyList: { [nodeId: string]: string[] } = {};
    
    // Build adjacency list
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });
    
    edges.forEach(edge => {
      adjacencyList[edge.source].push(edge.target);
    });
    
    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    function hasCycle(nodeId: string): boolean {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      for (const neighbor of adjacencyList[nodeId] || []) {
        if (hasCycle(neighbor)) return true;
      }
      
      recursionStack.delete(nodeId);
      return false;
    }
    
    for (const nodeId of Object.keys(adjacencyList)) {
      if (hasCycle(nodeId)) return true;
    }
    
    return false;
  }
}

export const workflowOrchestrationService = new WorkflowOrchestrationService();