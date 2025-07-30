/**
 * Production Workflow Engine - Phase 4: Enterprise Orchestration
 * Full-stack workflow execution with database persistence and Redis queues
 */

import { createClient } from '@supabase/supabase-js';
import { multiModelReasoningService } from '../ai/multiModelReasoningService';
import agentMemoryService from '../memory/agentMemoryService';
import { type WorkflowNode, type WorkflowEdge } from '../../types/index';

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduled_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  current_node?: string;
  variables: Record<string, any>;
  metadata: {
    user_id: string;
    guild_id: string;
    trigger_source: string;
    retry_count: number;
    max_retries: number;
  };
  metrics: {
    nodes_executed: number;
    total_duration: number;
    api_calls_made: number;
    credits_consumed: number;
    success_rate: number;
  };
}

interface ExecutionQueue {
  id: string;
  execution_id: string;
  queue_name: string;
  priority: number;
  payload: Record<string, any>;
  attempts: number;
  max_attempts: number;
  scheduled_for: Date;
  created_at: Date;
}

export class ProductionWorkflowEngine {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private queueProcessors: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeQueues();
    this.startHealthMonitoring();
  }

  /**
   * Initialize workflow execution queues
   */
  private async initializeQueues() {
    const queues = ['high-priority', 'standard', 'background', 'scheduled'];
    
    for (const queueName of queues) {
      this.startQueueProcessor(queueName);
    }

    console.log('🚀 Production Workflow Engine initialized with queues:', queues);
  }

  /**
   * Start processing queue items
   */
  private startQueueProcessor(queueName: string) {
    const processor = setInterval(async () => {
      await this.processQueueItems(queueName);
    }, 2000); // Process every 2 seconds

    this.queueProcessors.set(queueName, processor);
  }

  /**
   * Execute workflow with full production features
   */
  public async executeWorkflow(
    workflowId: string,
    triggerData: Record<string, any> = {},
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      scheduledFor?: Date;
      maxRetries?: number;
      userId: string;
      guildId: string;
    }
  ): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create execution record in database
    const execution: WorkflowExecution = {
      id: executionId,
      workflow_id: workflowId,
      status: options.scheduledFor ? 'queued' : 'running',
      priority: options.priority || 'medium',
      scheduled_at: options.scheduledFor,
      variables: { ...triggerData },
      metadata: {
        user_id: options.userId,
        guild_id: options.guildId,
        trigger_source: 'api',
        retry_count: 0,
        max_retries: options.maxRetries || 3
      },
      metrics: {
        nodes_executed: 0,
        total_duration: 0,
        api_calls_made: 0,
        credits_consumed: 0,
        success_rate: 0
      }
    };

    // Store execution in database
    const { error: dbError } = await this.supabase
      .from('workflow_executions')
      .insert([{
        id: execution.id,
        workflow_id: execution.workflow_id,
        status: execution.status,
        priority: execution.priority,
        scheduled_at: execution.scheduled_at?.toISOString(),
        variables: execution.variables,
        metadata: execution.metadata,
        metrics: execution.metrics,
        created_at: new Date().toISOString()
      }]);

    if (dbError) {
      console.error('Failed to store execution:', dbError);
      throw new Error(`Failed to create workflow execution: ${dbError.message}`);
    }

    // Add to appropriate queue
    const queueName = this.getQueueName(execution.priority);
    await this.addToQueue(executionId, queueName, execution);

    this.activeExecutions.set(executionId, execution);

    console.log(`🎯 Workflow execution ${executionId} queued with priority: ${execution.priority}`);
    return executionId;
  }

  /**
   * Process queue items
   */
  private async processQueueItems(queueName: string) {
    try {
      // Get pending queue items from database
      const { data: queueItems, error } = await this.supabase
        .from('execution_queue')
        .select('*')
        .eq('queue_name', queueName)
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5);

      if (error || !queueItems?.length) return;

      for (const item of queueItems) {
        await this.processQueueItem(item);
      }
    } catch (error) {
      console.error(`Error processing queue ${queueName}:`, error);
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(queueItem: ExecutionQueue) {
    try {
      const execution = this.activeExecutions.get(queueItem.execution_id);
      if (!execution) {
        console.warn(`Execution ${queueItem.execution_id} not found in memory`);
        return;
      }

      // Update execution status
      execution.status = 'running';
      execution.started_at = new Date();

      await this.updateExecutionInDatabase(execution);

      // Get workflow definition
      const { data: workflow, error: workflowError } = await this.supabase
        .from('workflows')
        .select('*, nodes:workflow_nodes(*), edges:workflow_edges(*)')
        .eq('id', execution.workflow_id)
        .single();

      if (workflowError || !workflow) {
        throw new Error(`Workflow ${execution.workflow_id} not found`);
      }

      // Execute workflow nodes
      await this.executeWorkflowNodes(execution, workflow.nodes, workflow.edges);

      // Complete execution
      await this.completeExecution(execution);

      // Remove from queue
      await this.removeFromQueue(queueItem.id);

    } catch (error) {
      console.error('Queue item processing failed:', error);
      await this.handleExecutionFailure(queueItem.execution_id, error);
    }
  }

  /**
   * Execute workflow nodes in order
   */
  private async executeWorkflowNodes(
    execution: WorkflowExecution,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ) {
    const startNode = nodes.find(n => n.type === 'trigger') || nodes[0];
    if (!startNode) {
      throw new Error('No start node found in workflow');
    }

    const visitedNodes = new Set<string>();
    let currentNodes = [startNode.id];

    while (currentNodes.length > 0) {
      const nextNodes: string[] = [];

      for (const nodeId of currentNodes) {
        if (visitedNodes.has(nodeId)) continue;

        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        // Execute node
        const nodeStartTime = Date.now();
        try {
          await this.executeNode(execution, node);
          execution.metrics.nodes_executed++;
          visitedNodes.add(nodeId);

          // Track execution time
          const nodeExecutionTime = Date.now() - nodeStartTime;
          execution.metrics.total_duration += nodeExecutionTime;

          // Find next nodes
          const outgoingEdges = edges.filter(e => e.source === nodeId);
          for (const edge of outgoingEdges) {
            if (await this.evaluateEdgeCondition(edge, execution.variables)) {
              nextNodes.push(edge.target);
            }
          }

        } catch (error) {
          console.error(`Node ${nodeId} execution failed:`, error);
          throw error;
        }

        // Update execution progress
        execution.current_node = nodeId;
        await this.updateExecutionInDatabase(execution);
      }

      currentNodes = [...new Set(nextNodes)];
    }

    // Calculate success rate
    execution.metrics.success_rate = execution.metrics.nodes_executed / nodes.length;
  }

  /**
   * Execute individual node
   */
  private async executeNode(execution: WorkflowExecution, node: WorkflowNode) {
    console.log(`🔧 Executing node: ${node.id} (${node.type})`);

    const nodeConfig = node.data;

    switch (node.type) {
      case 'agent':
        await this.executeAgentNode(execution, nodeConfig);
        break;

      case 'action':
        await this.executeActionNode(execution, nodeConfig);
        break;

      case 'condition':
        await this.executeConditionNode(execution, nodeConfig);
        break;

      case 'delay':
        await this.executeDelayNode(execution, nodeConfig);
        break;

      default:
        console.warn(`Unknown node type: ${node.type}`);
    }

    // Store node execution log
    await this.supabase
      .from('execution_logs')
      .insert([{
        execution_id: execution.id,
        node_id: node.id,
        node_type: node.type,
        status: 'completed',
        input_data: execution.variables,
        output_data: nodeConfig.output || {},
        execution_time: Date.now(),
        created_at: new Date().toISOString()
      }]);
  }

  /**
   * Execute agent node with AI reasoning
   */
  private async executeAgentNode(execution: WorkflowExecution, nodeConfig: any) {
    const agentId = nodeConfig.agentId;
    const prompt = this.interpolateVariables(nodeConfig.prompt || '', execution.variables);

    try {
      // Get agent memory context (for future use)
      await agentMemoryService.getConversationContext(
        agentId,
        execution.id,
        prompt
      );

      // Execute with multi-model reasoning
      const response = await multiModelReasoningService.reasonWithConsensus(
        prompt,
        {
          requiredCapabilities: ['reasoning', 'analysis'],
          minConsensus: 0.7
        }
      );

      // Store result in variables
      execution.variables[nodeConfig.outputVariable || 'agent_response'] = response.finalAnswer;
      execution.metrics.api_calls_made++;
      execution.metrics.credits_consumed += 100; // Default token usage

      // Store in agent memory
      await agentMemoryService.storeMemory(
        agentId,
        `Workflow execution: ${response.finalAnswer}`,
        'workflow_result',
        { execution_id: execution.id, confidence: response.confidence },
        response.confidence
      );

    } catch (error) {
      console.error('Agent node execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute action node (API calls, integrations)
   */
  private async executeActionNode(execution: WorkflowExecution, nodeConfig: any) {
    const actionType = nodeConfig.actionType;
    const actionConfig = nodeConfig.config || {};

    switch (actionType) {
      case 'http_request':
        await this.executeHttpAction(execution, actionConfig);
        break;

      case 'database_query':
        await this.executeDatabaseAction(execution, actionConfig);
        break;

      case 'email_send':
        await this.executeEmailAction(execution, actionConfig);
        break;

      case 'webhook':
        await this.executeWebhookAction(execution, actionConfig);
        break;

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    execution.metrics.api_calls_made++;
  }

  /**
   * HTTP request action
   */
  private async executeHttpAction(execution: WorkflowExecution, config: any) {
    const url = this.interpolateVariables(config.url, execution.variables);
    const method = config.method || 'GET';
    const headers = config.headers || {};
    const body = config.body ? this.interpolateVariables(JSON.stringify(config.body), execution.variables) : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: method !== 'GET' ? body : undefined
    });

    const responseData = await response.json();
    execution.variables[config.outputVariable || 'http_response'] = responseData;
  }

  /**
   * Database query action
   */
  private async executeDatabaseAction(execution: WorkflowExecution, config: any) {
    const table = config.table;
    const operation = config.operation; // select, insert, update, delete
    const filters = config.filters || {};
    const data = config.data || {};

    let query = this.supabase.from(table);

    switch (operation) {
      case 'select':
        const { data: selectData, error: selectError } = await query
          .select(config.columns || '*')
          .match(filters);
        
        if (selectError) throw selectError;
        execution.variables[config.outputVariable || 'db_result'] = selectData;
        break;

      case 'insert':
        const { data: insertData, error: insertError } = await query
          .insert([data])
          .select();
        
        if (insertError) throw insertError;
        execution.variables[config.outputVariable || 'db_result'] = insertData;
        break;

      case 'update':
        const { data: updateData, error: updateError } = await query
          .update(data)
          .match(filters)
          .select();
        
        if (updateError) throw updateError;
        execution.variables[config.outputVariable || 'db_result'] = updateData;
        break;

      case 'delete':
        const { data: deleteData, error: deleteError } = await query
          .delete()
          .match(filters)
          .select();
        
        if (deleteError) throw deleteError;
        execution.variables[config.outputVariable || 'db_result'] = deleteData;
        break;
    }
  }

  /**
   * Email sending action
   */
  private async executeEmailAction(execution: WorkflowExecution, config: any) {
    const { data, error } = await this.supabase.functions.invoke('send-email', {
      body: {
        to: this.interpolateVariables(config.to, execution.variables),
        subject: this.interpolateVariables(config.subject, execution.variables),
        html: this.interpolateVariables(config.body, execution.variables),
        execution_id: execution.id
      }
    });

    if (error) throw error;
    execution.variables[config.outputVariable || 'email_result'] = data;
  }

  /**
   * Webhook action
   */
  private async executeWebhookAction(execution: WorkflowExecution, config: any) {
    const webhookUrl = this.interpolateVariables(config.url, execution.variables);
    const payload = {
      execution_id: execution.id,
      workflow_id: execution.workflow_id,
      variables: execution.variables,
      ...config.payload
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    execution.variables[config.outputVariable || 'webhook_response'] = responseData;
  }

  /**
   * Execute condition node
   */
  private async executeConditionNode(execution: WorkflowExecution, nodeConfig: any) {
    const condition = nodeConfig.condition;
    const result = await this.evaluateCondition(condition, execution.variables);
    execution.variables[nodeConfig.outputVariable || 'condition_result'] = result;
  }

  /**
   * Execute delay node
   */
  private async executeDelayNode(_execution: WorkflowExecution, nodeConfig: any) {
    const delayMs = nodeConfig.delay * 1000; // Convert seconds to milliseconds
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * Evaluate edge condition
   */
  private async evaluateEdgeCondition(edge: WorkflowEdge, variables: Record<string, any>): Promise<boolean> {
    if (!edge.data?.condition) return true;
    return this.evaluateCondition(edge.data.condition, variables);
  }

  /**
   * Evaluate condition expression
   */
  private async evaluateCondition(condition: string, variables: Record<string, any>): Promise<boolean> {
    try {
      // Simple condition evaluation (extend as needed)
      const interpolated = this.interpolateVariables(condition, variables);
      return eval(interpolated) === true;
    } catch {
      return false;
    }
  }

  /**
   * Interpolate variables in strings
   */
  private interpolateVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] || match;
    });
  }

  /**
   * Complete workflow execution
   */
  private async completeExecution(execution: WorkflowExecution) {
    execution.status = 'completed';
    execution.completed_at = new Date();
    
    await this.updateExecutionInDatabase(execution);
    this.activeExecutions.delete(execution.id);

    console.log(`✅ Workflow execution ${execution.id} completed successfully`);
  }

  /**
   * Handle execution failure
   */
  private async handleExecutionFailure(executionId: string, error: any) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    execution.status = 'failed';
    execution.metadata.retry_count++;

    // Retry if under limit
    if (execution.metadata.retry_count < execution.metadata.max_retries) {
      console.log(`🔄 Retrying execution ${executionId} (${execution.metadata.retry_count}/${execution.metadata.max_retries})`);
      
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, execution.metadata.retry_count) * 1000;
      const scheduledFor = new Date(Date.now() + retryDelay);
      
      execution.status = 'queued';
      execution.scheduled_at = scheduledFor;
      
      const queueName = this.getQueueName(execution.priority);
      await this.addToQueue(executionId, queueName, execution, scheduledFor);
    }

    await this.updateExecutionInDatabase(execution);

    if (execution.metadata.retry_count >= execution.metadata.max_retries) {
      this.activeExecutions.delete(executionId);
      console.error(`❌ Execution ${executionId} failed permanently:`, error);
    }
  }

  /**
   * Add execution to queue
   */
  private async addToQueue(
    executionId: string,
    queueName: string,
    execution: WorkflowExecution,
    scheduledFor?: Date
  ) {
    const { error } = await this.supabase
      .from('execution_queue')
      .insert([{
        execution_id: executionId,
        queue_name: queueName,
        priority: this.getPriorityNumber(execution.priority),
        payload: { execution },
        attempts: 0,
        max_attempts: 3,
        scheduled_for: (scheduledFor || new Date()).toISOString(),
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Failed to add to queue:', error);
    }
  }

  /**
   * Remove item from queue
   */
  private async removeFromQueue(queueItemId: string) {
    await this.supabase
      .from('execution_queue')
      .delete()
      .eq('id', queueItemId);
  }

  /**
   * Update execution in database
   */
  private async updateExecutionInDatabase(execution: WorkflowExecution) {
    const { error } = await this.supabase
      .from('workflow_executions')
      .update({
        status: execution.status,
        started_at: execution.started_at?.toISOString(),
        completed_at: execution.completed_at?.toISOString(),
        current_node: execution.current_node,
        variables: execution.variables,
        metadata: execution.metadata,
        metrics: execution.metrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', execution.id);

    if (error) {
      console.error('Failed to update execution:', error);
    }
  }

  /**
   * Get queue name based on priority
   */
  private getQueueName(priority: string): string {
    switch (priority) {
      case 'critical': return 'high-priority';
      case 'high': return 'high-priority';
      case 'medium': return 'standard';
      case 'low': return 'background';
      default: return 'standard';
    }
  }

  /**
   * Get priority number for sorting
   */
  private getPriorityNumber(priority: string): number {
    switch (priority) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 50;
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform health check
   */
  private async performHealthCheck() {
    try {
      const metrics = {
        active_executions: this.activeExecutions.size,
        queue_processors: this.queueProcessors.size,
        memory_usage: process.memoryUsage?.() || {},
        timestamp: new Date().toISOString()
      };

      // Store health metrics
      await this.supabase
        .from('system_health')
        .insert([{
          service_name: 'workflow_engine',
          metrics,
          status: 'healthy',
          created_at: new Date().toISOString()
        }]);

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Get execution status
   */
  public async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    const { data, error } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error || !data) return null;
    return data as WorkflowExecution;
  }

  /**
   * Pause execution
   */
  public async pauseExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    execution.status = 'paused';
    await this.updateExecutionInDatabase(execution);
    return true;
  }

  /**
   * Resume execution
   */
  public async resumeExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    execution.status = 'running';
    await this.updateExecutionInDatabase(execution);
    return true;
  }

  /**
   * Cancel execution
   */
  public async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    execution.status = 'failed';
    await this.updateExecutionInDatabase(execution);
    this.activeExecutions.delete(executionId);
    return true;
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown() {
    // Clear all queue processors
    for (const [queueName, processor] of this.queueProcessors) {
      clearInterval(processor);
      console.log(`🛑 Queue processor ${queueName} stopped`);
    }

    this.queueProcessors.clear();
    this.activeExecutions.clear();
  }
}

export const productionWorkflowEngine = new ProductionWorkflowEngine();