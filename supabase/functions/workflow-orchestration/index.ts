import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkflowExecution {
  id: string
  workflow_id: string
  trigger_type: 'manual' | 'scheduled' | 'webhook' | 'event'
  input_data: any
  execution_plan: ExecutionNode[]
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  completed_at?: string
  error_details?: any
}

interface ExecutionNode {
  id: string
  node_id: string
  type: 'trigger' | 'action' | 'condition' | 'integration' | 'agent'
  dependencies: string[]
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input: any
  output?: any
  started_at?: string
  completed_at?: string
  duration_ms?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { method, url } = req
    const urlPath = new URL(url).pathname
    const pathSegments = urlPath.split('/').filter(Boolean)
    const action = pathSegments[pathSegments.length - 1]

    switch (method) {
      case 'POST':
        if (action === 'execute') {
          return await executeWorkflow(req, supabase, user.id)
        } else if (action === 'create') {
          return await createWorkflow(req, supabase, user.id)
        } else if (action === 'validate') {
          return await validateWorkflow(req, supabase, user.id)
        }
        break
      
      case 'GET':
        if (action === 'workflows') {
          return await getWorkflows(supabase, user.id)
        } else if (action === 'executions') {
          return await getExecutions(req, supabase, user.id)
        } else if (action === 'status') {
          return await getExecutionStatus(req, supabase, user.id)
        }
        break
      
      case 'PUT':
        return await updateWorkflow(req, supabase, user.id)
      
      case 'DELETE':
        return await deleteWorkflow(req, supabase, user.id)
    }

    return new Response(
      JSON.stringify({ error: 'Method not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function executeWorkflow(req: Request, supabase: any, userId: string) {
  const { workflow_id, trigger_type = 'manual', input_data = {}, context = {} } = await req.json()

  if (!workflow_id) {
    throw new Error('Workflow ID is required')
  }

  // Get workflow configuration
  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .select(`
      *,
      nodes,
      edges,
      agents:workflow_agents(agent_id, agent_config)
    `)
    .eq('id', workflow_id)
    .eq('owner_id', userId)
    .single()

  if (workflowError || !workflow) {
    throw new Error('Workflow not found or access denied')
  }

  // Validate workflow before execution
  const validationResult = await validateWorkflowStructure(workflow)
  if (!validationResult.isValid) {
    throw new Error(`Workflow validation failed: ${validationResult.errors.join(', ')}`)
  }

  // Create execution plan
  const executionPlan = buildExecutionPlan(workflow.nodes, workflow.edges)

  // Create execution record
  const execution: Omit<WorkflowExecution, 'id'> = {
    workflow_id,
    trigger_type,
    input_data,
    execution_plan,
    status: 'queued',
    started_at: new Date().toISOString()
  }

  const { data: executionRecord, error: execError } = await supabase
    .from('workflow_executions')
    .insert(execution)
    .select()
    .single()

  if (execError) throw execError

  // Start execution process (async)
  processWorkflowExecution(supabase, executionRecord.id, workflow, executionPlan, input_data, context)
    .catch(error => {
      console.error('Workflow execution failed:', error)
      // Update execution with error status
      supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_details: { message: error.message, stack: error.stack }
        })
        .eq('id', executionRecord.id)
    })

  return new Response(
    JSON.stringify({ 
      execution_id: executionRecord.id,
      status: 'started',
      message: 'Workflow execution initiated'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processWorkflowExecution(
  supabase: any,
  executionId: string,
  workflow: any,
  executionPlan: ExecutionNode[],
  inputData: any,
  context: any
) {
  // Update execution status to running
  await supabase
    .from('workflow_executions')
    .update({ status: 'running' })
    .eq('id', executionId)

  const executionContext = {
    workflow_id: workflow.id,
    execution_id: executionId,
    variables: { ...inputData },
    ...context
  }

  try {
    // Execute nodes in dependency order
    const completedNodes = new Set<string>()
    const runningNodes = new Map<string, Promise<any>>()

    while (completedNodes.size < executionPlan.length) {
      const readyNodes = executionPlan.filter(node => 
        node.status === 'pending' && 
        node.dependencies.every(dep => completedNodes.has(dep))
      )

      if (readyNodes.length === 0) {
        // Check if any nodes are still running
        if (runningNodes.size === 0) {
          throw new Error('Workflow deadlock detected - no nodes ready to execute')
        }
        // Wait for at least one running node to complete
        await Promise.race(runningNodes.values())
        continue
      }

      // Start execution of ready nodes
      for (const node of readyNodes) {
        node.status = 'running'
        node.started_at = new Date().toISOString()

        const nodePromise = executeWorkflowNode(supabase, node, executionContext)
          .then(result => {
            node.status = 'completed'
            node.completed_at = new Date().toISOString()
            node.duration_ms = Date.now() - new Date(node.started_at!).getTime()
            node.output = result

            // Update execution context with node output
            if (result && typeof result === 'object') {
              executionContext.variables = { ...executionContext.variables, ...result }
            }

            completedNodes.add(node.id)
            runningNodes.delete(node.id)
            return result
          })
          .catch(error => {
            node.status = 'failed'
            node.completed_at = new Date().toISOString()
            node.error = error.message

            completedNodes.add(node.id) // Mark as completed even if failed
            runningNodes.delete(node.id)
            
            // Depending on workflow configuration, we might want to stop or continue
            if (workflow.error_handling?.stop_on_failure !== false) {
              throw error
            }
          })

        runningNodes.set(node.id, nodePromise)
      }

      // Wait for at least one node to complete before checking for more ready nodes
      if (runningNodes.size > 0) {
        await Promise.race(runningNodes.values())
      }
    }

    // All nodes completed successfully
    await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        execution_plan: executionPlan,
        output_data: executionContext.variables
      })
      .eq('id', executionId)

  } catch (error) {
    await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        execution_plan: executionPlan,
        error_details: { message: error.message, stack: error.stack }
      })
      .eq('id', executionId)

    throw error
  }
}

async function executeWorkflowNode(
  supabase: any,
  node: ExecutionNode,
  context: any
): Promise<any> {
  switch (node.type) {
    case 'trigger':
      return executeTriggerNode(node, context)
    
    case 'action':
      return executeActionNode(node, context)
    
    case 'condition':
      return executeConditionNode(node, context)
    
    case 'integration':
      return executeIntegrationNode(node, context)
    
    case 'agent':
      return executeAgentNode(supabase, node, context)
    
    default:
      throw new Error(`Unknown node type: ${node.type}`)
  }
}

async function executeTriggerNode(node: ExecutionNode, context: any): Promise<any> {
  // Trigger nodes typically just pass through their input data
  return node.input || context.variables
}

async function executeActionNode(node: ExecutionNode, context: any): Promise<any> {
  const actionConfig = node.input.config || {}
  
  switch (actionConfig.action_type) {
    case 'data_transform':
      return executeDataTransform(actionConfig, context)
    
    case 'api_call':
      return executeAPICall(actionConfig, context)
    
    case 'delay':
      return executeDelay(actionConfig)
    
    default:
      throw new Error(`Unknown action type: ${actionConfig.action_type}`)
  }
}

async function executeConditionNode(node: ExecutionNode, context: any): Promise<any> {
  const conditionConfig = node.input.config || {}
  const condition = conditionConfig.condition || 'true'
  
  // Simple condition evaluation (in production, use a proper expression evaluator)
  const result = evaluateCondition(condition, context.variables)
  
  return { condition_result: result, passed: result }
}

async function executeIntegrationNode(node: ExecutionNode, context: any): Promise<any> {
  const integrationConfig = node.input.config || {}
  
  // Get credentials for the integration
  const credentialsId = integrationConfig.credentials_id
  if (!credentialsId) {
    throw new Error('Integration credentials not configured')
  }

  // Execute integration action
  return executeIntegrationAction(integrationConfig, context)
}

async function executeAgentNode(supabase: any, node: ExecutionNode, context: any): Promise<any> {
  const agentConfig = node.input.config || {}
  const agentId = agentConfig.agent_id
  
  if (!agentId) {
    throw new Error('Agent ID not configured')
  }

  // Call agent runtime service
  const agentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/agent-runtime/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent_id: agentId,
      input_data: node.input.data || context.variables,
      context: context
    })
  })

  if (!agentResponse.ok) {
    throw new Error(`Agent execution failed: ${await agentResponse.text()}`)
  }

  const agentResult = await agentResponse.json()
  return agentResult
}

// Helper functions

function buildExecutionPlan(nodes: any[], edges: any[]): ExecutionNode[] {
  const executionNodes: ExecutionNode[] = nodes.map(node => ({
    id: node.id,
    node_id: node.id,
    type: node.type,
    dependencies: findNodeDependencies(node.id, edges),
    status: 'pending',
    input: node.data || {}
  }))

  return topologicalSort(executionNodes)
}

function findNodeDependencies(nodeId: string, edges: any[]): string[] {
  return edges
    .filter(edge => edge.target === nodeId)
    .map(edge => edge.source)
}

function topologicalSort(nodes: ExecutionNode[]): ExecutionNode[] {
  const sorted: ExecutionNode[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(node: ExecutionNode) {
    if (visiting.has(node.id)) {
      throw new Error('Circular dependency detected in workflow')
    }
    if (visited.has(node.id)) {
      return
    }

    visiting.add(node.id)
    
    // Visit dependencies first
    for (const depId of node.dependencies) {
      const depNode = nodes.find(n => n.id === depId)
      if (depNode) {
        visit(depNode)
      }
    }

    visiting.delete(node.id)
    visited.add(node.id)
    sorted.push(node)
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      visit(node)
    }
  }

  return sorted
}

async function validateWorkflowStructure(workflow: any): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = []

  if (!workflow.nodes || workflow.nodes.length === 0) {
    errors.push('Workflow must have at least one node')
  }

  // Check for trigger nodes
  const triggerNodes = workflow.nodes.filter((node: any) => node.type === 'trigger')
  if (triggerNodes.length === 0) {
    errors.push('Workflow must have at least one trigger node')
  }

  // Validate node connections
  const nodeIds = new Set(workflow.nodes.map((node: any) => node.id))
  for (const edge of workflow.edges || []) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`)
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`)
    }
  }

  return { isValid: errors.length === 0, errors }
}

function executeDataTransform(config: any, context: any): any {
  // Simple data transformation
  const input = context.variables
  const transforms = config.transforms || []
  
  let result = { ...input }
  
  for (const transform of transforms) {
    switch (transform.type) {
      case 'map':
        result[transform.target] = result[transform.source]
        break
      case 'filter':
        // Apply filter logic
        break
      case 'aggregate':
        // Apply aggregation logic
        break
    }
  }
  
  return result
}

async function executeAPICall(config: any, context: any): Promise<any> {
  const url = substituteVariables(config.url, context.variables)
  const method = config.method || 'GET'
  const headers = config.headers || {}
  const body = config.body ? substituteVariables(JSON.stringify(config.body), context.variables) : undefined

  const response = await fetch(url, {
    method,
    headers,
    body
  })

  const responseData = await response.text()
  
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data: responseData
  }
}

async function executeDelay(config: any): Promise<any> {
  const delayMs = config.delay_ms || 1000
  await new Promise(resolve => setTimeout(resolve, delayMs))
  return { delayed_for_ms: delayMs }
}

async function executeIntegrationAction(config: any, context: any): Promise<any> {
  // Placeholder for integration execution
  // This would implement specific logic for different integrations
  return { integration_result: 'success', config, context: context.variables }
}

function evaluateCondition(condition: string, variables: any): boolean {
  // Simple condition evaluator (use a proper library in production)
  try {
    // Replace variables in condition
    let evaluatedCondition = condition
    for (const [key, value] of Object.entries(variables)) {
      evaluatedCondition = evaluatedCondition.replace(
        new RegExp(`\\b${key}\\b`, 'g'),
        JSON.stringify(value)
      )
    }
    
    // Evaluate simple conditions (extend as needed)
    return eval(evaluatedCondition)
  } catch (error) {
    console.error('Condition evaluation error:', error)
    return false
  }
}

function substituteVariables(template: string, variables: any): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  }
  return result
}

// CRUD operations

async function createWorkflow(req: Request, supabase: any, userId: string) {
  const workflowData = await req.json()
  
  const { data: workflow, error } = await supabase
    .from('workflows')
    .insert({
      ...workflowData,
      owner_id: userId,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ workflow }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getWorkflows(supabase: any, userId: string) {
  const { data: workflows, error } = await supabase
    .from('workflows')
    .select(`
      *,
      recent_executions:workflow_executions(id, status, started_at, completed_at)
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify({ workflows }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getExecutions(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const workflowId = url.searchParams.get('workflow_id')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  let query = supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow:workflows(id, name, owner_id)
    `)
    .eq('workflows.owner_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (workflowId) {
    query = query.eq('workflow_id', workflowId)
  }

  const { data: executions, error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify({ executions }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function validateWorkflow(req: Request, supabase: any, userId: string) {
  const { workflow_id } = await req.json()
  
  const { data: workflow, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflow_id)
    .eq('owner_id', userId)
    .single()

  if (error) throw error

  const validation = await validateWorkflowStructure(workflow)
  
  return new Response(
    JSON.stringify({ validation }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateWorkflow(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const workflowId = url.searchParams.get('workflow_id')
  const updates = await req.json()
  
  if (!workflowId) {
    throw new Error('Workflow ID is required')
  }

  const { data: workflow, error } = await supabase
    .from('workflows')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)
    .eq('owner_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ workflow }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteWorkflow(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const workflowId = url.searchParams.get('workflow_id')
  
  if (!workflowId) {
    throw new Error('Workflow ID is required')
  }

  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId)
    .eq('owner_id', userId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getExecutionStatus(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const executionId = url.searchParams.get('execution_id')
  
  if (!executionId) {
    throw new Error('Execution ID is required')
  }

  const { data: execution, error } = await supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow:workflows!inner(id, name, owner_id)
    `)
    .eq('id', executionId)
    .eq('workflow.owner_id', userId)
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ execution }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}