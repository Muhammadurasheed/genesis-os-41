import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentExecution {
  id: string
  agent_id: string
  input_data: any
  execution_steps: ExecutionStep[]
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  completed_at?: string
  error_details?: any
}

interface ExecutionStep {
  id: string
  step_type: 'llm_call' | 'tool_execution' | 'knowledge_search' | 'data_transform'
  input: any
  output?: any
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string
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
          return await executeAgent(req, supabase, user.id)
        } else if (action === 'create') {
          return await createAgent(req, supabase, user.id)
        }
        break
      
      case 'GET':
        if (action === 'agents') {
          return await getAgents(supabase, user.id)
        } else if (action === 'executions') {
          return await getExecutions(req, supabase, user.id)
        } else if (action === 'status') {
          return await getExecutionStatus(req, supabase, user.id)
        }
        break
      
      case 'PUT':
        return await updateAgent(req, supabase, user.id)
      
      case 'DELETE':
        return await deleteAgent(req, supabase, user.id)
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

async function executeAgent(req: Request, supabase: any, userId: string) {
  const { agent_id, input_data, context = {} } = await req.json()

  if (!agent_id || !input_data) {
    throw new Error('Agent ID and input data are required')
  }

  // Get agent configuration
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select(`
      *,
      tools:agent_tools(tool_id, tool_config),
      memory_config
    `)
    .eq('id', agent_id)
    .eq('owner_id', userId)
    .single()

  if (agentError || !agent) {
    throw new Error('Agent not found or access denied')
  }

  // Create execution record
  const execution: Omit<AgentExecution, 'id'> = {
    agent_id,
    input_data,
    execution_steps: [],
    status: 'queued',
    started_at: new Date().toISOString()
  }

  const { data: executionRecord, error: execError } = await supabase
    .from('agent_executions')
    .insert(execution)
    .select()
    .single()

  if (execError) throw execError

  // Start execution process
  try {
    await processAgentExecution(supabase, executionRecord.id, agent, input_data, context)
  } catch (error) {
    // Update execution with error
    await supabase
      .from('agent_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_details: { message: error.message, stack: error.stack }
      })
      .eq('id', executionRecord.id)
  }

  return new Response(
    JSON.stringify({ 
      execution_id: executionRecord.id,
      status: 'started',
      message: 'Agent execution initiated'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processAgentExecution(
  supabase: any, 
  executionId: string, 
  agent: any, 
  inputData: any, 
  context: any
) {
  // Update execution status to running
  await supabase
    .from('agent_executions')
    .update({ status: 'running' })
    .eq('id', executionId)

  const executionSteps: ExecutionStep[] = []
  let currentData = inputData

  // Step 1: Knowledge retrieval (if agent has memory config)
  if (agent.memory_config?.use_knowledge_base) {
    const knowledgeStep = await executeKnowledgeSearch(
      supabase, 
      agent.memory_config.knowledge_base_ids || [], 
      inputData,
      agent.owner_id
    )
    executionSteps.push(knowledgeStep)
    
    if (knowledgeStep.status === 'completed' && knowledgeStep.output) {
      context.knowledge = knowledgeStep.output
    }
  }

  // Step 2: LLM Processing
  const llmStep = await executeLLMCall(agent, currentData, context)
  executionSteps.push(llmStep)
  
  if (llmStep.status === 'completed' && llmStep.output) {
    currentData = llmStep.output
  }

  // Step 3: Tool execution (if required)
  for (const tool of agent.tools || []) {
    if (shouldExecuteTool(tool, currentData, context)) {
      const toolStep = await executeAgentTool(tool, currentData, context)
      executionSteps.push(toolStep)
      
      if (toolStep.status === 'completed' && toolStep.output) {
        currentData = toolStep.output
      }
    }
  }

  // Update execution with final results
  await supabase
    .from('agent_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      execution_steps: executionSteps,
      output_data: currentData
    })
    .eq('id', executionId)

  // Update agent performance metrics
  await updateAgentMetrics(supabase, agent.id, executionSteps)
}

async function executeKnowledgeSearch(
  supabase: any, 
  knowledgeBaseIds: string[], 
  inputData: any,
  userId: string
): Promise<ExecutionStep> {
  const step: ExecutionStep = {
    id: crypto.randomUUID(),
    step_type: 'knowledge_search',
    input: { query: extractSearchQuery(inputData), knowledge_base_ids: knowledgeBaseIds },
    status: 'running',
    started_at: new Date().toISOString()
  }

  try {
    const searchQuery = extractSearchQuery(inputData)
    
    // Call knowledge management function
    const knowledgeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/knowledge-management/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: searchQuery,
        knowledge_base_ids: knowledgeBaseIds,
        limit: 5
      })
    })

    const knowledgeData = await knowledgeResponse.json()
    
    step.status = 'completed'
    step.completed_at = new Date().toISOString()
    step.duration_ms = Date.now() - new Date(step.started_at).getTime()
    step.output = knowledgeData.results || []

  } catch (error) {
    step.status = 'failed'
    step.error = error.message
    step.completed_at = new Date().toISOString()
  }

  return step
}

async function executeLLMCall(agent: any, inputData: any, context: any): Promise<ExecutionStep> {
  const step: ExecutionStep = {
    id: crypto.randomUUID(),
    step_type: 'llm_call',
    input: { agent_prompt: agent.prompt, input_data: inputData, context },
    status: 'running',
    started_at: new Date().toISOString()
  }

  try {
    // Construct prompt with agent personality and context
    const systemPrompt = buildSystemPrompt(agent, context)
    const userPrompt = buildUserPrompt(inputData, context)

    // In production, this would call the actual LLM service (OpenAI, Claude, etc.)
    const llmResponse = await callLLMService(systemPrompt, userPrompt, agent.model_config)

    step.status = 'completed'
    step.completed_at = new Date().toISOString()
    step.duration_ms = Date.now() - new Date(step.started_at).getTime()
    step.output = {
      response: llmResponse.content,
      reasoning: llmResponse.reasoning,
      confidence: llmResponse.confidence
    }

  } catch (error) {
    step.status = 'failed'
    step.error = error.message
    step.completed_at = new Date().toISOString()
  }

  return step
}

async function executeAgentTool(tool: any, inputData: any, context: any): Promise<ExecutionStep> {
  const step: ExecutionStep = {
    id: crypto.randomUUID(),
    step_type: 'tool_execution',
    input: { tool_id: tool.tool_id, config: tool.tool_config, data: inputData },
    status: 'running',
    started_at: new Date().toISOString()
  }

  try {
    // Execute tool based on its type
    let toolResult
    
    switch (tool.tool_id) {
      case 'email_sender':
        toolResult = await executeEmailTool(tool.tool_config, inputData, context)
        break
      case 'webhook_caller':
        toolResult = await executeWebhookTool(tool.tool_config, inputData, context)
        break
      case 'data_transformer':
        toolResult = await executeDataTransformTool(tool.tool_config, inputData, context)
        break
      default:
        throw new Error(`Unknown tool type: ${tool.tool_id}`)
    }

    step.status = 'completed'
    step.completed_at = new Date().toISOString()
    step.duration_ms = Date.now() - new Date(step.started_at).getTime()
    step.output = toolResult

  } catch (error) {
    step.status = 'failed'
    step.error = error.message
    step.completed_at = new Date().toISOString()
  }

  return step
}

// Helper functions

function extractSearchQuery(inputData: any): string {
  if (typeof inputData === 'string') return inputData
  if (inputData.query) return inputData.query
  if (inputData.message) return inputData.message
  return JSON.stringify(inputData)
}

function buildSystemPrompt(agent: any, context: any): string {
  let prompt = `You are ${agent.name}, ${agent.description}\n\n`
  
  if (agent.personality) {
    prompt += `Personality: ${agent.personality}\n\n`
  }
  
  if (context.knowledge && context.knowledge.length > 0) {
    prompt += `Relevant Knowledge:\n`
    context.knowledge.forEach((item: any, index: number) => {
      prompt += `${index + 1}. ${item.content}\n`
    })
    prompt += `\n`
  }
  
  prompt += `Instructions: ${agent.instructions || 'Provide helpful and accurate responses based on your capabilities.'}`
  
  return prompt
}

function buildUserPrompt(inputData: any, context: any): string {
  if (typeof inputData === 'string') return inputData
  if (inputData.prompt || inputData.query) return inputData.prompt || inputData.query
  return `Please process this data: ${JSON.stringify(inputData)}`
}

async function callLLMService(systemPrompt: string, userPrompt: string, modelConfig: any) {
  // Placeholder for LLM service call
  // In production, integrate with OpenAI, Anthropic, or other LLM providers
  
  return {
    content: `Processed: ${userPrompt.slice(0, 100)}... [AI response would be here]`,
    reasoning: 'AI reasoning process would be documented here',
    confidence: 0.85
  }
}

function shouldExecuteTool(tool: any, data: any, context: any): boolean {
  // Logic to determine if tool should be executed based on conditions
  if (tool.execution_condition) {
    // Evaluate condition (simplified)
    return true // Placeholder
  }
  return tool.auto_execute !== false
}

async function executeEmailTool(config: any, data: any, context: any) {
  // Email tool implementation
  return { message: 'Email sent successfully', recipients: config.to }
}

async function executeWebhookTool(config: any, data: any, context: any) {
  // Webhook tool implementation
  const response = await fetch(config.url, {
    method: config.method || 'POST',
    headers: config.headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  return { status: response.status, response: await response.text() }
}

async function executeDataTransformTool(config: any, data: any, context: any) {
  // Data transformation tool implementation
  return { transformed_data: data } // Placeholder
}

async function updateAgentMetrics(supabase: any, agentId: string, executionSteps: ExecutionStep[]) {
  const totalDuration = executionSteps.reduce((sum, step) => sum + (step.duration_ms || 0), 0)
  const successCount = executionSteps.filter(step => step.status === 'completed').length
  const successRate = executionSteps.length > 0 ? successCount / executionSteps.length : 0

  await supabase
    .from('agent_analytics')
    .insert({
      agent_id: agentId,
      execution_time_ms: totalDuration,
      success_rate: successRate,
      step_count: executionSteps.length,
      timestamp: new Date().toISOString()
    })
}

async function createAgent(req: Request, supabase: any, userId: string) {
  const agentData = await req.json()
  
  const { data: agent, error } = await supabase
    .from('agents')
    .insert({
      ...agentData,
      owner_id: userId,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ agent }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAgents(supabase: any, userId: string) {
  const { data: agents, error } = await supabase
    .from('agents')
    .select(`
      *,
      tools:agent_tools(tool_id, tool_config),
      recent_executions:agent_executions(id, status, started_at, completed_at)
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify({ agents }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getExecutions(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const agentId = url.searchParams.get('agent_id')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  let query = supabase
    .from('agent_executions')
    .select(`
      *,
      agent:agents(id, name, owner_id)
    `)
    .eq('agents.owner_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (agentId) {
    query = query.eq('agent_id', agentId)
  }

  const { data: executions, error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify({ executions }),
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
    .from('agent_executions')
    .select(`
      *,
      agent:agents!inner(id, name, owner_id)
    `)
    .eq('id', executionId)
    .eq('agent.owner_id', userId)
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ execution }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateAgent(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const agentId = url.searchParams.get('agent_id')
  const updates = await req.json()
  
  if (!agentId) {
    throw new Error('Agent ID is required')
  }

  const { data: agent, error } = await supabase
    .from('agents')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId)
    .eq('owner_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ agent }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteAgent(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const agentId = url.searchParams.get('agent_id')
  
  if (!agentId) {
    throw new Error('Agent ID is required')
  }

  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId)
    .eq('owner_id', userId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}