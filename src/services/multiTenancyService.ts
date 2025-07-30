import { supabase } from '../lib/supabase';
import { User, Workspace, SubscriptionTier, UsageTracking } from '../types/masterBlueprint';

class MultiTenancyService {
  // Subscription tiers configuration
  private subscriptionTiers: Record<string, SubscriptionTier> = {
    free: {
      name: 'free',
      limits: {
        max_agents: 3,
        max_monthly_executions: 1000,
        max_integrations: 5,
        max_storage_gb: 1,
        max_knowledge_bases: 2
      },
      features: ['Basic Workflows', 'Standard Support'],
      price_monthly: 0
    },
    pro: {
      name: 'pro',
      limits: {
        max_agents: 25,
        max_monthly_executions: 50000,
        max_integrations: 50,
        max_storage_gb: 100,
        max_knowledge_bases: 25
      },
      features: ['Advanced Workflows', 'Priority Support', 'Analytics Dashboard'],
      price_monthly: 99
    },
    enterprise: {
      name: 'enterprise',
      limits: {
        max_agents: -1, // Unlimited
        max_monthly_executions: -1,
        max_integrations: -1,
        max_storage_gb: -1,
        max_knowledge_bases: -1
      },
      features: ['Unlimited Everything', 'Dedicated Support', 'Custom Integrations', 'SLA'],
      price_monthly: 999
    }
  };

  // User Management
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'last_active'>): Promise<User> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        created_at: now,
        last_active: now
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        last_active: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  // Workspace Management
  async createWorkspace(workspaceData: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>): Promise<Workspace> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        ...workspaceData,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) throw error;

    // Initialize usage tracking for new workspace
    await this.initializeUsageTracking(data.id);
    
    return data;
  }

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Usage Tracking & Enforcement
  async getCurrentUsage(workspaceId: string): Promise<UsageTracking> {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('period', currentPeriod)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create new usage record if none exists
        return await this.initializeUsageTracking(workspaceId, currentPeriod);
      }
      throw error;
    }
    return data;
  }

  async initializeUsageTracking(workspaceId: string, period?: string): Promise<UsageTracking> {
    const usagePeriod = period || new Date().toISOString().slice(0, 7);
    const usageData: Omit<UsageTracking, 'updated_at'> = {
      workspace_id: workspaceId,
      period: usagePeriod,
      agents_created: 0,
      executions_count: 0,
      integrations_active: 0,
      storage_used_gb: 0,
      knowledge_bases_count: 0,
      costs: {
        ai_models: 0,
        compute: 0,
        storage: 0,
        integrations: 0,
        total: 0
      }
    };

    const { data, error } = await supabase
      .from('usage_tracking')
      .insert({
        ...usageData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async incrementUsage(
    workspaceId: string, 
    metric: keyof Pick<UsageTracking, 'agents_created' | 'executions_count' | 'integrations_active' | 'knowledge_bases_count'>,
    amount: number = 1
  ): Promise<void> {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    const { error } = await supabase.rpc('increment_usage', {
      p_workspace_id: workspaceId,
      p_period: currentPeriod,
      p_metric: metric,
      p_amount: amount
    });

    if (error) throw error;
  }

  async addCost(workspaceId: string, costType: 'ai_models' | 'compute' | 'storage' | 'integrations', amount: number): Promise<void> {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    const { error } = await supabase.rpc('add_cost', {
      p_workspace_id: workspaceId,
      p_period: currentPeriod,
      p_cost_type: costType,
      p_amount: amount
    });

    if (error) throw error;
  }

  // Subscription & Limits Enforcement
  async checkLimits(workspaceId: string, action: string): Promise<{ allowed: boolean; reason?: string }> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      return { allowed: false, reason: 'Workspace not found' };
    }

    const tier = this.subscriptionTiers[workspace.subscription_status === 'active' ? 'pro' : 'free'];
    const usage = await this.getCurrentUsage(workspaceId);

    switch (action) {
      case 'create_agent':
        if (tier.limits.max_agents !== -1 && usage.agents_created >= tier.limits.max_agents) {
          return { allowed: false, reason: `Agent limit reached (${tier.limits.max_agents})` };
        }
        break;
      
      case 'execute_workflow':
        if (tier.limits.max_monthly_executions !== -1 && usage.executions_count >= tier.limits.max_monthly_executions) {
          return { allowed: false, reason: `Monthly execution limit reached (${tier.limits.max_monthly_executions})` };
        }
        break;
      
      case 'create_integration':
        if (tier.limits.max_integrations !== -1 && usage.integrations_active >= tier.limits.max_integrations) {
          return { allowed: false, reason: `Integration limit reached (${tier.limits.max_integrations})` };
        }
        break;
      
      case 'create_knowledge_base':
        if (tier.limits.max_knowledge_bases !== -1 && usage.knowledge_bases_count >= tier.limits.max_knowledge_bases) {
          return { allowed: false, reason: `Knowledge base limit reached (${tier.limits.max_knowledge_bases})` };
        }
        break;
    }

    return { allowed: true };
  }

  async upgradeSubscription(workspaceId: string, newTier: 'free' | 'pro' | 'enterprise'): Promise<Workspace> {
    const newLimits = this.subscriptionTiers[newTier].limits;
    
    return await this.updateWorkspace(workspaceId, {
      subscription_status: 'active',
      usage_limits: newLimits
    });
  }

  // RLS Helper - Get workspace IDs user has access to
  async getUserAccessibleWorkspaces(userId: string): Promise<string[]> {
    const workspaces = await this.getUserWorkspaces(userId);
    return workspaces.map(w => w.id);
  }

  // Subscription Management
  getSubscriptionTiers(): Record<string, SubscriptionTier> {
    return this.subscriptionTiers;
  }

  calculateUsageCosts(usage: UsageTracking, tier: SubscriptionTier): number {
    // Simple cost calculation - can be enhanced with more sophisticated pricing
    let additionalCosts = 0;
    
    if (tier.limits.max_monthly_executions !== -1 && usage.executions_count > tier.limits.max_monthly_executions) {
      additionalCosts += (usage.executions_count - tier.limits.max_monthly_executions) * 0.01; // $0.01 per extra execution
    }
    
    if (tier.limits.max_storage_gb !== -1 && usage.storage_used_gb > tier.limits.max_storage_gb) {
      additionalCosts += (usage.storage_used_gb - tier.limits.max_storage_gb) * 5; // $5 per extra GB
    }

    return tier.price_monthly + additionalCosts;
  }
}

export const multiTenancyService = new MultiTenancyService();