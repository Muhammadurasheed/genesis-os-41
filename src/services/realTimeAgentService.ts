import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

export interface AgentMetrics {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  cpu: number;
  memory: number;
  responseTime: number;
  lastActivity: string;
  totalRequests: number;
  successRate: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  progress: number;
  currentNode?: string;
  metrics: {
    totalNodes: number;
    completedNodes: number;
    errorCount: number;
    avgExecutionTime: number;
  };
}

class RealTimeAgentService {
  private socket: Socket | null = null;
  private metrics: AgentMetrics[] = [];
  private executions: WorkflowExecution[] = [];
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  async connect() {
    try {
      const orchestratorUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://genesisos-orchestrator.onrender.com'
        : 'ws://localhost:3002';

      this.socket = io(orchestratorUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('Connected to orchestrator');
        this.emit('connection_status', { connected: true });
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from orchestrator');
        this.emit('connection_status', { connected: false });
      });

      this.socket.on('agent_metrics', (data: AgentMetrics[]) => {
        this.metrics = data;
        this.emit('metrics_update', data);
        this.saveMetricsToDatabase(data);
      });

      this.socket.on('workflow_execution', (data: WorkflowExecution) => {
        const index = this.executions.findIndex(e => e.id === data.id);
        if (index >= 0) {
          this.executions[index] = data;
        } else {
          this.executions.push(data);
        }
        this.emit('execution_update', data);
        this.saveExecutionToDatabase(data);
      });

      this.socket.on('agent_communication', (data: any) => {
        this.emit('agent_communication', data);
        this.saveAgentCommunication(data);
      });

      this.socket.on('system_alert', (data: any) => {
        this.emit('system_alert', data);
      });

      return true;
    } catch (error) {
      console.error('Failed to connect to orchestrator:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(event: string, callback: (data: any) => void) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    this.subscribers.get(event)?.forEach(callback => callback(data));
  }

  async startWorkflowExecution(workflowData: any) {
    if (!this.socket) {
      throw new Error('Not connected to orchestrator');
    }

    const executionId = `exec_${Date.now()}`;
    
    this.socket.emit('start_workflow', {
      executionId,
      workflowData,
      timestamp: new Date().toISOString()
    });

    return executionId;
  }

  async pauseWorkflowExecution(executionId: string) {
    if (!this.socket) {
      throw new Error('Not connected to orchestrator');
    }

    this.socket.emit('pause_workflow', { executionId });
  }

  async resumeWorkflowExecution(executionId: string) {
    if (!this.socket) {
      throw new Error('Not connected to orchestrator');
    }

    this.socket.emit('resume_workflow', { executionId });
  }

  async stopWorkflowExecution(executionId: string) {
    if (!this.socket) {
      throw new Error('Not connected to orchestrator');
    }

    this.socket.emit('stop_workflow', { executionId });
  }

  async deployAgentToChannel(agentData: any, channelInfo: any) {
    if (!this.socket) {
      throw new Error('Not connected to orchestrator');
    }

    const deploymentId = `deploy_${Date.now()}`;
    
    this.socket.emit('deploy_agent', {
      deploymentId,
      agentData,
      channelInfo,
      timestamp: new Date().toISOString()
    });

    return deploymentId;
  }

  async getAgentAnalytics(agentId: string, timeRange: string) {
    try {
      const { data, error } = await supabase
        .from('agent_analytics')
        .select('*')
        .eq('agent_id', agentId)
        .gte('created_at', this.getTimeRangeDate(timeRange))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch agent analytics:', error);
      return [];
    }
  }

  async getWorkflowExecutionHistory(workflowId?: string) {
    try {
      let query = supabase
        .from('workflow_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch execution history:', error);
      return [];
    }
  }

  private async saveMetricsToDatabase(metrics: AgentMetrics[]) {
    try {
      const metricsData = metrics.map(metric => ({
        agent_id: metric.id,
        status: metric.status,
        cpu_usage: metric.cpu,
        memory_usage: metric.memory,
        response_time: metric.responseTime,
        total_requests: metric.totalRequests,
        success_rate: metric.successRate,
        timestamp: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('agent_analytics')
        .insert(metricsData);

      if (error) {
        console.error('Failed to save metrics:', error);
      }
    } catch (error) {
      console.error('Error saving metrics to database:', error);
    }
  }

  private async saveExecutionToDatabase(execution: WorkflowExecution) {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .upsert({
          id: execution.id,
          workflow_id: execution.workflowId,
          status: execution.status,
          start_time: execution.startTime,
          end_time: execution.endTime,
          progress: execution.progress,
          current_node: execution.currentNode,
          metrics: execution.metrics,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save execution:', error);
      }
    } catch (error) {
      console.error('Error saving execution to database:', error);
    }
  }

  private async saveAgentCommunication(data: any) {
    try {
      const { error } = await supabase
        .from('agent_communications')
        .insert({
          from_agent: data.from,
          to_agent: data.to,
          message_type: data.type,
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save agent communication:', error);
      }
    } catch (error) {
      console.error('Error saving agent communication:', error);
    }
  }

  private getTimeRangeDate(timeRange: string): string {
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
    return now.toISOString();
  }

  getCurrentMetrics(): AgentMetrics[] {
    return this.metrics;
  }

  getCurrentExecutions(): WorkflowExecution[] {
    return this.executions;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const realTimeAgentService = new RealTimeAgentService();