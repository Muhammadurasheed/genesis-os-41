import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsQuery {
  type: 'agent' | 'workflow' | 'system' | 'deployment'
  entityId?: string
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d'
  metrics?: string[]
  groupBy?: 'hour' | 'day' | 'week'
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

    const query: AnalyticsQuery = await req.json()
    let analyticsData

    switch (query.type) {
      case 'agent':
        analyticsData = await getAgentAnalytics(supabaseClient, query, user.id)
        break
      case 'workflow':
        analyticsData = await getWorkflowAnalytics(supabaseClient, query, user.id)
        break
      case 'system':
        analyticsData = await getSystemAnalytics(supabaseClient, query, user.id)
        break
      case 'deployment':
        analyticsData = await getDeploymentAnalytics(supabaseClient, query, user.id)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid analytics type' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: analyticsData,
        query: query,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

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

async function getAgentAnalytics(supabaseClient: any, query: AnalyticsQuery, userId: string) {
  const startTime = getTimeRangeStart(query.timeRange)
  
  // Get agent performance metrics
  let analyticsQuery = supabaseClient
    .from('agent_analytics')
    .select(`
      *,
      agents!inner(name, owner_id)
    `)
    .eq('agents.owner_id', userId)
    .gte('timestamp', startTime)
    .order('timestamp', { ascending: true })

  if (query.entityId) {
    analyticsQuery = analyticsQuery.eq('agent_id', query.entityId)
  }

  const { data: metricsData, error: metricsError } = await analyticsQuery

  if (metricsError) {
    throw new Error(`Failed to fetch agent metrics: ${metricsError.message}`)
  }

  // Get agent communication data
  const { data: commData, error: commError } = await supabaseClient
    .from('agent_communications')
    .select(`
      *,
      from_agent:agents!agent_communications_from_agent_fkey(name),
      to_agent:agents!agent_communications_to_agent_fkey(name)
    `)
    .gte('timestamp', startTime)
    .order('timestamp', { ascending: true })

  if (commError) {
    console.error('Communication data error:', commError)
  }

  // Process and aggregate data
  const processedData = processAgentMetrics(metricsData, query.groupBy)
  const communicationStats = processCommunicationData(commData || [])

  return {
    metrics: processedData,
    communication: communicationStats,
    summary: generateAgentSummary(metricsData),
    trends: calculateTrends(processedData)
  }
}

async function getWorkflowAnalytics(supabaseClient: any, query: AnalyticsQuery, userId: string) {
  const startTime = getTimeRangeStart(query.timeRange)
  
  // Get workflow execution data
  let executionQuery = supabaseClient
    .from('workflow_executions')
    .select(`
      *,
      workflows!inner(name, owner_id)
    `)
    .eq('workflows.owner_id', userId)
    .gte('start_time', startTime)
    .order('start_time', { ascending: true })

  if (query.entityId) {
    executionQuery = executionQuery.eq('workflow_id', query.entityId)
  }

  const { data: executionsData, error: executionsError } = await executionQuery

  if (executionsError) {
    throw new Error(`Failed to fetch workflow executions: ${executionsError.message}`)
  }

  // Process execution data
  const processedData = processWorkflowExecutions(executionsData, query.groupBy)
  const performanceMetrics = calculateWorkflowPerformance(executionsData)

  return {
    executions: processedData,
    performance: performanceMetrics,
    summary: generateWorkflowSummary(executionsData),
    trends: calculateExecutionTrends(processedData)
  }
}

async function getSystemAnalytics(supabaseClient: any, query: AnalyticsQuery, userId: string) {
  const startTime = getTimeRangeStart(query.timeRange)
  
  // Get system-wide metrics
  const [agentMetrics, workflowExecutions, deployments, systemMetrics] = await Promise.all([
    supabaseClient
      .from('agent_analytics')
      .select(`
        *,
        agents!inner(owner_id)
      `)
      .eq('agents.owner_id', userId)
      .gte('timestamp', startTime),
    
    supabaseClient
      .from('workflow_executions')
      .select(`
        *,
        workflows!inner(owner_id)
      `)
      .eq('workflows.owner_id', userId)
      .gte('start_time', startTime),
    
    supabaseClient
      .from('deployments')
      .select('*')
      .eq('owner_id', userId)
      .gte('created_at', startTime),
    
    supabaseClient
      .from('system_metrics')
      .select('*')
      .gte('timestamp', startTime)
      .order('timestamp', { ascending: true })
  ])

  if (agentMetrics.error || workflowExecutions.error || deployments.error) {
    throw new Error('Failed to fetch system analytics data')
  }

  return {
    overview: generateSystemOverview(
      agentMetrics.data,
      workflowExecutions.data,
      deployments.data
    ),
    resourceUsage: calculateResourceUsage(agentMetrics.data),
    performance: calculateSystemPerformance(
      agentMetrics.data,
      workflowExecutions.data
    ),
    deploymentStats: processDeploymentStats(deployments.data),
    systemHealth: calculateSystemHealth(systemMetrics.data || [])
  }
}

async function getDeploymentAnalytics(supabaseClient: any, query: AnalyticsQuery, userId: string) {
  const startTime = getTimeRangeStart(query.timeRange)
  
  // Get deployment data
  let deploymentQuery = supabaseClient
    .from('deployments')
    .select(`
      *,
      agents(name),
      guilds(name),
      workflows(name)
    `)
    .eq('owner_id', userId)
    .gte('created_at', startTime)
    .order('created_at', { ascending: true })

  if (query.entityId) {
    deploymentQuery = deploymentQuery.eq('id', query.entityId)
  }

  const { data: deploymentsData, error: deploymentsError } = await deploymentQuery

  if (deploymentsError) {
    throw new Error(`Failed to fetch deployment data: ${deploymentsError.message}`)
  }

  return {
    deployments: deploymentsData,
    statusDistribution: calculateStatusDistribution(deploymentsData),
    typeDistribution: calculateTypeDistribution(deploymentsData),
    uptimeStats: calculateUptimeStats(deploymentsData),
    trends: calculateDeploymentTrends(deploymentsData, query.groupBy)
  }
}

// Helper functions
function getTimeRangeStart(timeRange: string): string {
  const now = new Date()
  const hours = {
    '1h': 1,
    '6h': 6,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
  }[timeRange] || 24

  now.setHours(now.getHours() - hours)
  return now.toISOString()
}

function processAgentMetrics(data: any[], groupBy: string = 'hour') {
  // Group metrics by time period
  const grouped = groupByTimePeriod(data, 'timestamp', groupBy)
  
  return Object.entries(grouped).map(([time, metrics]) => ({
    time,
    averageResponseTime: average(metrics.map((m: any) => m.response_time)),
    averageSuccessRate: average(metrics.map((m: any) => m.success_rate)),
    totalRequests: sum(metrics.map((m: any) => m.total_requests)),
    activeAgents: new Set(metrics.map((m: any) => m.agent_id)).size,
    cpuUsage: average(metrics.map((m: any) => m.cpu_usage).filter(Boolean)),
    memoryUsage: average(metrics.map((m: any) => m.memory_usage).filter(Boolean))
  }))
}

function processWorkflowExecutions(data: any[], groupBy: string = 'hour') {
  const grouped = groupByTimePeriod(data, 'start_time', groupBy)
  
  return Object.entries(grouped).map(([time, executions]) => ({
    time,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter((e: any) => e.status === 'completed').length,
    failedExecutions: executions.filter((e: any) => e.status === 'failed').length,
    averageExecutionTime: average(
      executions
        .filter((e: any) => e.end_time)
        .map((e: any) => new Date(e.end_time).getTime() - new Date(e.start_time).getTime())
    ),
    averageProgress: average(executions.map((e: any) => e.progress || 0))
  }))
}

function generateAgentSummary(data: any[]) {
  if (!data.length) return {}
  
  return {
    totalMetrics: data.length,
    averageResponseTime: average(data.map(m => m.response_time)),
    overallSuccessRate: average(data.map(m => m.success_rate)),
    uniqueAgents: new Set(data.map(m => m.agent_id)).size,
    totalRequests: sum(data.map(m => m.total_requests)),
    healthScore: calculateHealthScore(data)
  }
}

function generateWorkflowSummary(data: any[]) {
  if (!data.length) return {}
  
  const completed = data.filter(e => e.status === 'completed')
  const failed = data.filter(e => e.status === 'failed')
  
  return {
    totalExecutions: data.length,
    successRate: (completed.length / data.length) * 100,
    failureRate: (failed.length / data.length) * 100,
    averageExecutionTime: average(
      completed.map(e => 
        e.end_time ? new Date(e.end_time).getTime() - new Date(e.start_time).getTime() : 0
      ).filter(Boolean)
    ),
    uniqueWorkflows: new Set(data.map(e => e.workflow_id)).size
  }
}

function calculateTrends(processedData: any[]) {
  if (processedData.length < 2) return {}
  
  const latest = processedData[processedData.length - 1]
  const previous = processedData[processedData.length - 2]
  
  return {
    responseTimeTrend: calculatePercentageChange(
      previous.averageResponseTime,
      latest.averageResponseTime
    ),
    successRateTrend: calculatePercentageChange(
      previous.averageSuccessRate,
      latest.averageSuccessRate
    ),
    requestsTrend: calculatePercentageChange(
      previous.totalRequests,
      latest.totalRequests
    )
  }
}

// Utility functions
function groupByTimePeriod(data: any[], timeField: string, groupBy: string) {
  return data.reduce((acc, item) => {
    const date = new Date(item[timeField])
    let key: string
    
    switch (groupBy) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
        break
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
        break
      default:
        key = date.toISOString()
    }
    
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

function average(numbers: number[]): number {
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n))
  return validNumbers.length > 0 ? validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length : 0
}

function sum(numbers: number[]): number {
  return numbers.filter(n => typeof n === 'number' && !isNaN(n)).reduce((a, b) => a + b, 0)
}

function calculatePercentageChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function calculateHealthScore(metrics: any[]): number {
  if (!metrics.length) return 0
  
  const avgSuccessRate = average(metrics.map(m => m.success_rate))
  const avgResponseTime = average(metrics.map(m => m.response_time))
  
  // Simple health score calculation (0-100)
  const successComponent = avgSuccessRate * 0.6
  const responseComponent = Math.max(0, (1000 - avgResponseTime) / 1000) * 40
  
  return Math.min(100, successComponent + responseComponent)
}

function processCommunicationData(data: any[]) {
  return {
    totalMessages: data.length,
    messagesByType: data.reduce((acc, msg) => {
      acc[msg.message_type] = (acc[msg.message_type] || 0) + 1
      return acc
    }, {}),
    mostActiveAgents: Object.entries(
      data.reduce((acc, msg) => {
        acc[msg.from_agent?.name || 'Unknown'] = (acc[msg.from_agent?.name || 'Unknown'] || 0) + 1
        return acc
      }, {})
    ).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 5)
  }
}

function calculateWorkflowPerformance(executions: any[]) {
  const completed = executions.filter(e => e.status === 'completed')
  
  return {
    averageExecutionTime: average(
      completed.map(e => 
        e.end_time ? new Date(e.end_time).getTime() - new Date(e.start_time).getTime() : 0
      ).filter(Boolean)
    ),
    successRate: executions.length > 0 ? (completed.length / executions.length) * 100 : 0,
    throughput: executions.length,
    errorRate: executions.length > 0 ? (executions.filter(e => e.status === 'failed').length / executions.length) * 100 : 0
  }
}

function generateSystemOverview(agents: any[], executions: any[], deployments: any[]) {
  return {
    totalAgents: new Set(agents.map(a => a.agent_id)).size,
    totalExecutions: executions.length,
    totalDeployments: deployments.length,
    systemUptime: calculateSystemUptime(deployments),
    overallPerformance: calculateOverallPerformance(agents, executions)
  }
}

function calculateResourceUsage(agentMetrics: any[]) {
  if (!agentMetrics.length) return { cpu: 0, memory: 0 }
  
  return {
    cpu: average(agentMetrics.map(m => m.cpu_usage).filter(Boolean)),
    memory: average(agentMetrics.map(m => m.memory_usage).filter(Boolean))
  }
}

function calculateSystemPerformance(agents: any[], executions: any[]) {
  return {
    agentPerformance: {
      averageResponseTime: average(agents.map(a => a.response_time)),
      successRate: average(agents.map(a => a.success_rate))
    },
    workflowPerformance: calculateWorkflowPerformance(executions)
  }
}

function processDeploymentStats(deployments: any[]) {
  return {
    total: deployments.length,
    byStatus: deployments.reduce((acc, dep) => {
      acc[dep.status] = (acc[dep.status] || 0) + 1
      return acc
    }, {}),
    byType: deployments.reduce((acc, dep) => {
      acc[dep.type] = (acc[dep.type] || 0) + 1
      return acc
    }, {})
  }
}

function calculateSystemHealth(systemMetrics: any[]) {
  // Placeholder for system health calculation
  return {
    score: 85,
    status: 'healthy',
    lastCheck: new Date().toISOString()
  }
}

function calculateStatusDistribution(deployments: any[]) {
  return deployments.reduce((acc, dep) => {
    acc[dep.status] = (acc[dep.status] || 0) + 1
    return acc
  }, {})
}

function calculateTypeDistribution(deployments: any[]) {
  return deployments.reduce((acc, dep) => {
    acc[dep.type] = (acc[dep.type] || 0) + 1
    return acc
  }, {})
}

function calculateUptimeStats(deployments: any[]) {
  const activeDeployments = deployments.filter(d => d.status === 'active')
  const totalUptime = activeDeployments.reduce((acc, dep) => {
    const startTime = new Date(dep.created_at).getTime()
    const now = Date.now()
    return acc + (now - startTime)
  }, 0)
  
  return {
    averageUptime: activeDeployments.length > 0 ? totalUptime / activeDeployments.length : 0,
    totalActiveDeployments: activeDeployments.length,
    uptimePercentage: deployments.length > 0 ? (activeDeployments.length / deployments.length) * 100 : 0
  }
}

function calculateDeploymentTrends(deployments: any[], groupBy: string = 'day') {
  const grouped = groupByTimePeriod(deployments, 'created_at', groupBy)
  
  return Object.entries(grouped).map(([time, deps]) => ({
    time,
    newDeployments: deps.length,
    activeDeployments: deps.filter((d: any) => d.status === 'active').length,
    failedDeployments: deps.filter((d: any) => d.status === 'failed').length
  }))
}

function calculateExecutionTrends(processedData: any[]) {
  return calculateTrends(processedData)
}

function calculateSystemUptime(deployments: any[]): number {
  const activeDeployments = deployments.filter(d => d.status === 'active')
  return deployments.length > 0 ? (activeDeployments.length / deployments.length) * 100 : 0
}

function calculateOverallPerformance(agents: any[], executions: any[]): number {
  const agentScore = agents.length > 0 ? average(agents.map(a => a.success_rate)) : 0
  const executionScore = executions.length > 0 ? 
    (executions.filter(e => e.status === 'completed').length / executions.length) * 100 : 0
  
  return (agentScore + executionScore) / 2
}