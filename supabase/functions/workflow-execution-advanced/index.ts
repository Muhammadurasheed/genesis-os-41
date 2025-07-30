/**
 * Advanced Workflow Execution Edge Function
 * Phase 4: Production Orchestration - Full-stack execution with monitoring
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

// Types
interface WorkflowExecutionRequest {
  workflow_id: string;
  trigger_data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  scheduled_for?: string;
  max_retries?: number;
  user_id: string;
  guild_id: string;
}

interface ExecutionMetrics {
  nodes_executed: number;
  total_duration: number;
  api_calls_made: number;
  credits_consumed: number;
  success_rate: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { workflow_id, trigger_data = {}, priority = 'medium', scheduled_for, max_retries = 3, user_id, guild_id } = await req.json() as WorkflowExecutionRequest;

    // Validate request
    if (!workflow_id || !user_id || !guild_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: workflow_id, user_id, guild_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Get workflow definition
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select(`
        *,
        nodes:workflow_nodes(*),
        edges:workflow_edges(*),
        guild:guilds(*)
      `)
      .eq('id', workflow_id)
      .single();

    if (workflowError || !workflow) {
      return new Response(
        JSON.stringify({ error: `Workflow ${workflow_id} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check user permissions
    const { data: userGuild, error: permissionError } = await supabase
      .from('guild_members')
      .select('role')
      .eq('guild_id', guild_id)
      .eq('user_id', user_id)
      .single();

    if (permissionError || !userGuild) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create execution record
    const execution = {
      id: executionId,
      workflow_id,
      status: scheduled_for ? 'queued' : 'running',
      priority,
      scheduled_at: scheduled_for ? new Date(scheduled_for).toISOString() : null,
      started_at: scheduled_for ? null : new Date().toISOString(),
      variables: trigger_data,
      metadata: {
        user_id,
        guild_id,
        trigger_source: 'api',
        retry_count: 0,
        max_retries
      },
      metrics: {
        nodes_executed: 0,
        total_duration: 0,
        api_calls_made: 0,
        credits_consumed: 0,
        success_rate: 0
      } as ExecutionMetrics,
      created_at: new Date().toISOString()
    };

    // Store execution in database
    const { error: executionError } = await supabase
      .from('workflow_executions')
      .insert([execution]);

    if (executionError) {
      console.error('Failed to store execution:', executionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create execution record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If not scheduled, start execution immediately
    if (!scheduled_for) {
      try {
        await executeWorkflowNodes(executionId, workflow.nodes, workflow.edges, execution);
      } catch (error) {
        console.error('Immediate execution failed:', error);
        // Update execution status to failed
        await supabase
          .from('workflow_executions')
          .update({ 
            status: 'failed', 
            completed_at: new Date().toISOString(),
            error_message: error.message 
          })
          .eq('id', executionId);
      }
    } else {
      // Add to execution queue for scheduled processing
      await supabase
        .from('execution_queue')
        .insert([{
          execution_id: executionId,
          queue_name: getQueueName(priority),
          priority: getPriorityNumber(priority),
          payload: { execution },
          attempts: 0,
          max_attempts: max_retries,
          scheduled_for: new Date(scheduled_for).toISOString(),
          created_at: new Date().toISOString()
        }]);
    }

    // Log execution start
    await supabase
      .from('execution_logs')
      .insert([{
        execution_id: executionId,
        event_type: 'execution_started',
        message: `Workflow execution started for ${workflow_id}`,
        metadata: { trigger_data, priority, scheduled_for },
        created_at: new Date().toISOString()
      }]);

    return new Response(
      JSON.stringify({
        success: true,
        execution_id: executionId,
        status: execution.status,
        message: scheduled_for ? 'Execution scheduled successfully' : 'Execution started successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Workflow execution error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

/**
 * Execute workflow nodes in sequence
 */
async function executeWorkflowNodes(
  executionId: string,
  nodes: any[],
  edges: any[],
  execution: any
) {
  const startNode = nodes.find(n => n.type === 'trigger') || nodes[0];
  if (!startNode) {
    throw new Error('No start node found in workflow');
  }

  const visitedNodes = new Set<string>();
  let currentNodes = [startNode.id];
  const startTime = Date.now();

  while (currentNodes.length > 0) {
    const nextNodes: string[] = [];

    for (const nodeId of currentNodes) {
      if (visitedNodes.has(nodeId)) continue;

      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Execute node
      const nodeStartTime = Date.now();
      try {
        await executeNode(executionId, node, execution);
        execution.metrics.nodes_executed++;
        visitedNodes.add(nodeId);

        // Track execution time
        const nodeExecutionTime = Date.now() - nodeStartTime;
        execution.metrics.total_duration += nodeExecutionTime;

        // Find next nodes
        const outgoingEdges = edges.filter(e => e.source === nodeId);
        for (const edge of outgoingEdges) {
          if (await evaluateEdgeCondition(edge, execution.variables)) {
            nextNodes.push(edge.target);
          }
        }

        // Log node completion
        await supabase
          .from('execution_logs')
          .insert([{
            execution_id: executionId,
            node_id: nodeId,
            event_type: 'node_completed',
            message: `Node ${node.type} completed successfully`,
            execution_time: nodeExecutionTime,
            metadata: { node_data: node.data },
            created_at: new Date().toISOString()
          }]);

      } catch (error) {
        console.error(`Node ${nodeId} execution failed:`, error);
        
        // Log node failure
        await supabase
          .from('execution_logs')
          .insert([{
            execution_id: executionId,
            node_id: nodeId,
            event_type: 'node_failed',
            message: `Node ${node.type} failed: ${error.message}`,
            metadata: { error: error.message, node_data: node.data },
            created_at: new Date().toISOString()
          }]);
        
        throw error;
      }

      // Update execution progress
      execution.current_node = nodeId;
      await supabase
        .from('workflow_executions')
        .update({
          current_node: nodeId,
          variables: execution.variables,
          metrics: execution.metrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', executionId);
    }

    currentNodes = [...new Set(nextNodes)];
  }

  // Calculate final metrics
  execution.metrics.success_rate = execution.metrics.nodes_executed / nodes.length;
  execution.metrics.total_duration = Date.now() - startTime;

  // Complete execution
  await supabase
    .from('workflow_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metrics: execution.metrics,
      updated_at: new Date().toISOString()
    })
    .eq('id', executionId);

  // Log completion
  await supabase
    .from('execution_logs')
    .insert([{
      execution_id: executionId,
      event_type: 'execution_completed',
      message: 'Workflow execution completed successfully',
      metadata: { 
        total_nodes: nodes.length,
        executed_nodes: execution.metrics.nodes_executed,
        total_duration: execution.metrics.total_duration,
        success_rate: execution.metrics.success_rate
      },
      created_at: new Date().toISOString()
    }]);
}

/**
 * Execute individual node
 */
async function executeNode(executionId: string, node: any, execution: any) {
  const nodeConfig = node.data;

  switch (node.type) {
    case 'agent':
      await executeAgentNode(executionId, nodeConfig, execution);
      break;

    case 'action':
      await executeActionNode(executionId, nodeConfig, execution);
      break;

    case 'condition':
      await executeConditionNode(executionId, nodeConfig, execution);
      break;

    case 'delay':
      await executeDelayNode(executionId, nodeConfig, execution);
      break;

    case 'trigger':
      // Trigger nodes are entry points, no execution needed
      break;

    default:
      console.warn(`Unknown node type: ${node.type}`);
  }
}

/**
 * Execute agent node with AI reasoning
 */
async function executeAgentNode(executionId: string, nodeConfig: any, execution: any) {
  const prompt = interpolateVariables(nodeConfig.prompt || '', execution.variables);
  
  // Call AI service (simplified for this example)
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-workflow-optimizer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        execution_id: executionId,
        agent_config: nodeConfig
      })
    });

    const result = await response.json();
    
    // Store result in variables
    execution.variables[nodeConfig.outputVariable || 'agent_response'] = result.response;
    execution.metrics.api_calls_made++;
    execution.metrics.credits_consumed += result.tokens_used || 0;

  } catch (error) {
    console.error('Agent node execution failed:', error);
    throw error;
  }
}

/**
 * Execute action node
 */
async function executeActionNode(executionId: string, nodeConfig: any, execution: any) {
  const actionType = nodeConfig.actionType;
  const actionConfig = nodeConfig.config || {};

  switch (actionType) {
    case 'http_request':
      await executeHttpAction(executionId, actionConfig, execution);
      break;

    case 'database_query':
      await executeDatabaseAction(executionId, actionConfig, execution);
      break;

    case 'email_send':
      await executeEmailAction(executionId, actionConfig, execution);
      break;

    case 'webhook':
      await executeWebhookAction(executionId, actionConfig, execution);
      break;

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }

  execution.metrics.api_calls_made++;
}

/**
 * HTTP request action
 */
async function executeHttpAction(executionId: string, config: any, execution: any) {
  const url = interpolateVariables(config.url, execution.variables);
  const method = config.method || 'GET';
  const headers = config.headers || {};
  const body = config.body ? interpolateVariables(JSON.stringify(config.body), execution.variables) : undefined;

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
async function executeDatabaseAction(executionId: string, config: any, execution: any) {
  const table = config.table;
  const operation = config.operation;
  const filters = config.filters || {};
  const data = config.data || {};

  let query = supabase.from(table);

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
async function executeEmailAction(executionId: string, config: any, execution: any) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: interpolateVariables(config.to, execution.variables),
      subject: interpolateVariables(config.subject, execution.variables),
      html: interpolateVariables(config.body, execution.variables),
      execution_id: executionId
    }
  });

  if (error) throw error;
  execution.variables[config.outputVariable || 'email_result'] = data;
}

/**
 * Webhook action
 */
async function executeWebhookAction(executionId: string, config: any, execution: any) {
  const webhookUrl = interpolateVariables(config.url, execution.variables);
  const payload = {
    execution_id: executionId,
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
async function executeConditionNode(executionId: string, nodeConfig: any, execution: any) {
  const condition = nodeConfig.condition;
  const result = await evaluateCondition(condition, execution.variables);
  execution.variables[nodeConfig.outputVariable || 'condition_result'] = result;
}

/**
 * Execute delay node
 */
async function executeDelayNode(executionId: string, nodeConfig: any, execution: any) {
  const delayMs = nodeConfig.delay * 1000;
  await new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Evaluate edge condition
 */
async function evaluateEdgeCondition(edge: any, variables: Record<string, any>): Promise<boolean> {
  if (!edge.data?.condition) return true;
  return evaluateCondition(edge.data.condition, variables);
}

/**
 * Evaluate condition expression
 */
async function evaluateCondition(condition: string, variables: Record<string, any>): Promise<boolean> {
  try {
    const interpolated = interpolateVariables(condition, variables);
    // Simple evaluation - extend with proper expression parser
    return eval(interpolated) === true;
  } catch {
    return false;
  }
}

/**
 * Interpolate variables in strings
 */
function interpolateVariables(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match;
  });
}

/**
 * Get queue name based on priority
 */
function getQueueName(priority: string): string {
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
function getPriorityNumber(priority: string): number {
  switch (priority) {
    case 'critical': return 100;
    case 'high': return 75;
    case 'medium': return 50;
    case 'low': return 25;
    default: return 50;
  }
}