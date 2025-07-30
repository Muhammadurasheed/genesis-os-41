import { supabase } from '../lib/supabase';

// Legacy Agent interface for backward compatibility
export interface LegacyAgent {
  id: string;
  name: string;
  description?: string;
  role: string;
  tools: string[];
  personality?: string;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
  configuration: Record<string, any>;
  performance_metrics?: {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
    lastExecution?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  owner_id: string;
  execution_count: number;
  last_execution?: string;
}

export interface Guild {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  workflows: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  owner_id: string;
  deployment_config?: Record<string, any>;
}

export interface Deployment {
  id: string;
  type: 'discord' | 'slack' | 'telegram' | 'webhook';
  status: 'pending' | 'active' | 'failed' | 'stopped';
  config: Record<string, any>;
  agent_id?: string;
  guild_id?: string;
  workflow_id?: string;
  created_at: string;
  updated_at: string;
  last_ping?: string;
  error_message?: string;
}

class DatabaseService {
  // Legacy Agent CRUD operations (for backward compatibility)
  async createAgent(agentData: Omit<LegacyAgent, 'id' | 'created_at' | 'updated_at'>): Promise<LegacyAgent> {
    const { data, error } = await supabase
      .from('agents')
      .insert({
        ...agentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAgents(userId?: string): Promise<LegacyAgent[]> {
    let query = supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAgent(id: string): Promise<LegacyAgent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async updateAgent(id: string, updates: Partial<LegacyAgent>): Promise<LegacyAgent> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Workflow CRUD operations
  async createWorkflow(workflowData: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        ...workflowData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getWorkflows(userId?: string): Promise<Workflow[]> {
    let query = supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Guild CRUD operations
  async createGuild(guildData: Omit<Guild, 'id' | 'created_at' | 'updated_at'>): Promise<Guild> {
    const { data, error } = await supabase
      .from('guilds')
      .insert({
        ...guildData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGuilds(userId?: string): Promise<Guild[]> {
    let query = supabase
      .from('guilds')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getGuild(id: string): Promise<Guild | null> {
    const { data, error } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async updateGuild(id: string, updates: Partial<Guild>): Promise<Guild> {
    const { data, error } = await supabase
      .from('guilds')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGuild(id: string): Promise<void> {
    const { error } = await supabase
      .from('guilds')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Deployment CRUD operations
  async createDeployment(deploymentData: Omit<Deployment, 'id' | 'created_at' | 'updated_at'>): Promise<Deployment> {
    const { data, error } = await supabase
      .from('deployments')
      .insert({
        ...deploymentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDeployments(userId?: string): Promise<Deployment[]> {
    let query = supabase
      .from('deployments')
      .select('*, agents(name), guilds(name), workflows(name)')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment> {
    const { data, error } = await supabase
      .from('deployments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDeployment(id: string): Promise<void> {
    const { error } = await supabase
      .from('deployments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Analytics and metrics
  async getAgentMetrics(agentId: string, timeRange: string = '24h') {
    const startDate = this.getTimeRangeDate(timeRange);
    
    const { data, error } = await supabase
      .from('agent_analytics')
      .select('*')
      .eq('agent_id', agentId)
      .gte('timestamp', startDate)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getWorkflowExecutions(workflowId?: string, limit: number = 50) {
    let query = supabase
      .from('workflow_executions')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getSystemAnalytics(timeRange: string = '24h') {
    const startDate = this.getTimeRangeDate(timeRange);
    
    const [agentMetrics, executions, communications] = await Promise.all([
      supabase
        .from('agent_analytics')
        .select('*')
        .gte('timestamp', startDate),
      supabase
        .from('workflow_executions')
        .select('*')
        .gte('start_time', startDate),
      supabase
        .from('agent_communications')
        .select('*')
        .gte('timestamp', startDate)
    ]);

    return {
      agentMetrics: agentMetrics.data || [],
      executions: executions.data || [],
      communications: communications.data || []
    };
  }

  // Credential management
  async saveCredential(type: string, name: string, data: Record<string, any>, userId: string) {
    const { data: credential, error } = await supabase
      .from('credentials')
      .insert({
        type,
        name,
        encrypted_data: data, // This should be encrypted in production
        owner_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return credential;
  }

  async getCredentials(userId: string, type?: string) {
    let query = supabase
      .from('credentials')
      .select('id, type, name, created_at')
      .eq('owner_id', userId);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getCredential(id: string, userId: string) {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
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
}

export const databaseService = new DatabaseService();