import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkflowNode {
  id: string
  type: string
  data: any
  position: { x: number; y: number }
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

interface WorkflowData {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  id: string
  name: string
}

interface ExecutionContext {
  executionId: string
  workflowId: string
  userId: string
  startTime: string
  currentNode?: string
  variables: Record<string, any>
  results: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { action, workflowData, executionId } = await req.json()

    switch (action) {
      case 'execute':
        return await executeWorkflow(supabaseClient, workflowData, user.id)
      case 'pause':
        return await pauseWorkflow(supabaseClient, executionId, user.id)
      case 'resume':
        return await resumeWorkflow(supabaseClient, executionId, user.id)
      case 'stop':
        return await stopWorkflow(supabaseClient, executionId, user.id)
      case 'status':
        return await getExecutionStatus(supabaseClient, executionId, user.id)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function executeWorkflow(supabaseClient: any, workflowData: WorkflowData, userId: string) {
  const executionId = crypto.randomUUID()
  const startTime = new Date().toISOString()

  // Create execution record
  const { data: execution, error: executionError } = await supabaseClient
    .from('workflow_executions')
    .insert({
      id: executionId,
      workflow_id: workflowData.id,
      status: 'running',
      start_time: startTime,
      progress: 0,
      metrics: {
        totalNodes: workflowData.nodes.length,
        completedNodes: 0,
        errorCount: 0,
        avgExecutionTime: 0
      },
      owner_id: userId
    })
    .select()
    .single()

  if (executionError) {
    throw new Error(`Failed to create execution: ${executionError.message}`)
  }

  // Start workflow execution
  const context: ExecutionContext = {
    executionId,
    workflowId: workflowData.id,
    userId,
    startTime,
    variables: {},
    results: {}
  }

  // Execute workflow asynchronously
  executeWorkflowNodes(supabaseClient, workflowData, context)

  return new Response(
    JSON.stringify({ 
      success: true, 
      executionId,
      message: 'Workflow execution started'
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function executeWorkflowNodes(supabaseClient: any, workflowData: WorkflowData, context: ExecutionContext) {
  try {
    const { nodes, edges } = workflowData
    const nodeMap = new Map(nodes.map(node => [node.id, node]))
    const edgeMap = new Map(edges.map(edge => [edge.source, edge]))
    
    let currentNodeId = findStartNode(nodes)
    let completedNodes = 0
    const totalNodes = nodes.length

    while (currentNodeId) {
      const currentNode = nodeMap.get(currentNodeId)
      if (!currentNode) break

      // Update current node in execution
      await updateExecutionStatus(supabaseClient, context.executionId, {
        current_node: currentNodeId,
        progress: Math.round((completedNodes / totalNodes) * 100)
      })

      // Execute node
      const nodeResult = await executeNode(supabaseClient, currentNode, context)
      context.results[currentNodeId] = nodeResult
      completedNodes++

      // Find next node
      const nextEdge = edges.find(edge => edge.source === currentNodeId)
      currentNodeId = nextEdge ? nextEdge.target : null

      // Add delay between nodes
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Mark execution as completed
    await updateExecutionStatus(supabaseClient, context.executionId, {
      status: 'completed',
      end_time: new Date().toISOString(),
      progress: 100,
      metrics: {
        totalNodes,
        completedNodes,
        errorCount: 0,
        avgExecutionTime: (Date.now() - new Date(context.startTime).getTime()) / completedNodes
      }
    })

  } catch (error) {
    console.error('Workflow execution error:', error)
    
    // Mark execution as failed
    await updateExecutionStatus(supabaseClient, context.executionId, {
      status: 'failed',
      end_time: new Date().toISOString(),
      error_details: error.message
    })
  }
}

async function executeNode(supabaseClient: any, node: WorkflowNode, context: ExecutionContext): Promise<any> {
  const { type, data } = node

  switch (type) {
    case 'agent':
      return await executeAgentNode(supabaseClient, data, context)
    case 'trigger':
      return await executeTriggerNode(supabaseClient, data, context)
    case 'action':
      return await executeActionNode(supabaseClient, data, context)
    case 'condition':
      return await executeConditionNode(supabaseClient, data, context)
    case 'delay':
      return await executeDelayNode(supabaseClient, data, context)
    default:
      throw new Error(`Unknown node type: ${type}`)
  }
}

async function executeAgentNode(supabaseClient: any, data: any, context: ExecutionContext): Promise<any> {
  // Simulate agent execution
  console.log(`Executing agent: ${data.name}`)
  
  // Update agent metrics
  const metrics = {
    executionTime: Math.random() * 2000 + 500,
    success: Math.random() > 0.1,
    responseTime: Math.random() * 1000 + 200
  }

  // Log execution
  await supabaseClient
    .from('agent_analytics')
    .insert({
      agent_id: data.id,
      status: metrics.success ? 'active' : 'error',
      response_time: metrics.responseTime,
      total_requests: 1,
      success_rate: metrics.success ? 100 : 0,
      timestamp: new Date().toISOString()
    })

  return {
    nodeType: 'agent',
    agentName: data.name,
    executionTime: metrics.executionTime,
    success: metrics.success,
    output: `Agent ${data.name} executed successfully`
  }
}

async function executeTriggerNode(supabaseClient: any, data: any, context: ExecutionContext): Promise<any> {
  console.log(`Executing trigger: ${data.triggerType}`)
  
  return {
    nodeType: 'trigger',
    triggerType: data.triggerType,
    triggered: true,
    timestamp: new Date().toISOString()
  }
}

async function executeActionNode(supabaseClient: any, data: any, context: ExecutionContext): Promise<any> {
  console.log(`Executing action: ${data.actionType}`)
  
  return {
    nodeType: 'action',
    actionType: data.actionType,
    executed: true,
    result: `Action ${data.actionType} completed`
  }
}

async function executeConditionNode(supabaseClient: any, data: any, context: ExecutionContext): Promise<any> {
  console.log(`Evaluating condition: ${data.condition}`)
  
  // Simple condition evaluation
  const result = Math.random() > 0.5
  
  return {
    nodeType: 'condition',
    condition: data.condition,
    result,
    output: `Condition evaluated to: ${result}`
  }
}

async function executeDelayNode(supabaseClient: any, data: any, context: ExecutionContext): Promise<any> {
  const duration = data.duration || 1000
  console.log(`Executing delay: ${duration}ms`)
  
  await new Promise(resolve => setTimeout(resolve, duration))
  
  return {
    nodeType: 'delay',
    duration,
    completed: true
  }
}

function findStartNode(nodes: WorkflowNode[]): string | null {
  // Find trigger nodes or nodes with no incoming edges
  const triggerNode = nodes.find(node => node.type === 'trigger')
  return triggerNode ? triggerNode.id : nodes[0]?.id || null
}

async function pauseWorkflow(supabaseClient: any, executionId: string, userId: string) {
  const { error } = await supabaseClient
    .from('workflow_executions')
    .update({ 
      status: 'paused',
      updated_at: new Date().toISOString()
    })
    .eq('id', executionId)
    .eq('owner_id', userId)

  if (error) {
    throw new Error(`Failed to pause workflow: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Workflow paused' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function resumeWorkflow(supabaseClient: any, executionId: string, userId: string) {
  const { error } = await supabaseClient
    .from('workflow_executions')
    .update({ 
      status: 'running',
      updated_at: new Date().toISOString()
    })
    .eq('id', executionId)
    .eq('owner_id', userId)

  if (error) {
    throw new Error(`Failed to resume workflow: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Workflow resumed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function stopWorkflow(supabaseClient: any, executionId: string, userId: string) {
  const { error } = await supabaseClient
    .from('workflow_executions')
    .update({ 
      status: 'cancelled',
      end_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', executionId)
    .eq('owner_id', userId)

  if (error) {
    throw new Error(`Failed to stop workflow: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Workflow stopped' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getExecutionStatus(supabaseClient: any, executionId: string, userId: string) {
  const { data, error } = await supabaseClient
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .eq('owner_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to get execution status: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, execution: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateExecutionStatus(supabaseClient: any, executionId: string, updates: any) {
  const { error } = await supabaseClient
    .from('workflow_executions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', executionId)

  if (error) {
    console.error('Failed to update execution status:', error)
  }
}