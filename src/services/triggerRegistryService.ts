import { supabase } from '../lib/supabase';
import { TriggerDefinition } from '../components/ui/TriggerSystemBuilder';

interface TriggerExecution {
  id: string;
  trigger_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  input_data?: any;
  output_data?: any;
  error_message?: string;
}

interface WebhookEndpoint {
  id: string;
  trigger_id: string;
  url: string;
  secret_key: string;
  created_at: string;
  last_used?: string;
}

class TriggerRegistryService {
  private static instance: TriggerRegistryService;
  private activeTriggers: Map<string, TriggerDefinition> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private webhookEndpoints: Map<string, WebhookEndpoint> = new Map();

  public static getInstance(): TriggerRegistryService {
    if (!TriggerRegistryService.instance) {
      TriggerRegistryService.instance = new TriggerRegistryService();
    }
    return TriggerRegistryService.instance;
  }

  /**
   * Register a new trigger
   */
  async registerTrigger(trigger: Omit<TriggerDefinition, 'id'>): Promise<TriggerDefinition> {
    try {
      // Generate unique ID
      const id = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newTrigger: TriggerDefinition = {
        ...trigger,
        id,
        execution_count: 0,
        status: 'active'
      };

      // Store in Supabase
      const { error } = await supabase
        .from('workflow_triggers')
        .insert({
          id: newTrigger.id,
          workflow_id: newTrigger.workflow_id,
          type: newTrigger.type,
          config: newTrigger.config,
          status: newTrigger.status,
          execution_count: newTrigger.execution_count
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to register trigger in database:', error);
        // Continue with in-memory registration for demo
      }

      // Add to active triggers
      this.activeTriggers.set(id, newTrigger);

      // Set up the trigger based on type
      await this.setupTrigger(newTrigger);

      console.log(`✅ Trigger registered: ${newTrigger.type} for workflow ${newTrigger.workflow_id}`);
      
      return newTrigger;
    } catch (error) {
      console.error('Failed to register trigger:', error);
      throw new Error('Failed to register trigger');
    }
  }

  /**
   * Update an existing trigger
   */
  async updateTrigger(id: string, updates: Partial<TriggerDefinition>): Promise<TriggerDefinition> {
    const existingTrigger = this.activeTriggers.get(id);
    if (!existingTrigger) {
      throw new Error('Trigger not found');
    }

    const updatedTrigger = { ...existingTrigger, ...updates };
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('workflow_triggers')
        .update({
          type: updatedTrigger.type,
          config: updatedTrigger.config,
          status: updatedTrigger.status,
          execution_count: updatedTrigger.execution_count
        })
        .eq('id', id);

      if (error) {
        console.error('Failed to update trigger in database:', error);
      }

      // Update in memory
      this.activeTriggers.set(id, updatedTrigger);

      // Re-setup trigger if config changed
      if (updates.config || updates.status) {
        await this.teardownTrigger(id);
        if (updatedTrigger.status === 'active') {
          await this.setupTrigger(updatedTrigger);
        }
      }

      console.log(`✅ Trigger updated: ${id}`);
      
      return updatedTrigger;
    } catch (error) {
      console.error('Failed to update trigger:', error);
      throw new Error('Failed to update trigger');
    }
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(id: string): Promise<void> {
    try {
      // Remove from Supabase
      const { error } = await supabase
        .from('workflow_triggers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete trigger from database:', error);
      }

      // Teardown the trigger
      await this.teardownTrigger(id);

      // Remove from active triggers
      this.activeTriggers.delete(id);

      console.log(`✅ Trigger deleted: ${id}`);
    } catch (error) {
      console.error('Failed to delete trigger:', error);
      throw new Error('Failed to delete trigger');
    }
  }

  /**
   * Get all triggers for a workflow
   */
  async getWorkflowTriggers(workflowId: string): Promise<TriggerDefinition[]> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('workflow_triggers')
        .select('*')
        .eq('workflow_id', workflowId);

      if (!error && data) {
        // Update in-memory cache
        data.forEach((trigger: TriggerDefinition) => {
          this.activeTriggers.set(trigger.id, trigger);
        });
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch triggers from database:', error);
    }

    // Fallback to in-memory triggers
    return Array.from(this.activeTriggers.values())
      .filter(trigger => trigger.workflow_id === workflowId);
  }

  /**
   * Test a trigger manually
   */
  async testTrigger(id: string): Promise<void> {
    const trigger = this.activeTriggers.get(id);
    if (!trigger) {
      throw new Error('Trigger not found');
    }

    console.log(`🧪 Testing trigger: ${id}`);
    
    try {
      // Create test execution record
      const execution: TriggerExecution = {
        id: `exec_${Date.now()}`,
        trigger_id: id,
        started_at: new Date().toISOString(),
        status: 'running',
        input_data: { test: true, timestamp: new Date().toISOString() }
      };

      // Execute the workflow
      await this.executeTrigger(trigger, execution.input_data);

      // Update execution as completed
      execution.completed_at = new Date().toISOString();
      execution.status = 'completed';

      console.log(`✅ Trigger test completed: ${id}`);
    } catch (error) {
      console.error(`❌ Trigger test failed: ${id}`, error);
      throw error;
    }
  }

  /**
   * Set up a trigger based on its type
   */
  private async setupTrigger(trigger: TriggerDefinition): Promise<void> {
    switch (trigger.type) {
      case 'schedule':
        await this.setupScheduleTrigger(trigger);
        break;
      case 'webhook':
        await this.setupWebhookTrigger(trigger);
        break;
      case 'email':
        await this.setupEmailTrigger(trigger);
        break;
      case 'file_watch':
        await this.setupFileWatchTrigger(trigger);
        break;
      case 'database':
        await this.setupDatabaseTrigger(trigger);
        break;
      case 'manual':
        // Manual triggers don't need setup
        break;
      default:
        console.warn(`Unknown trigger type: ${trigger.type}`);
    }
  }

  /**
   * Set up a schedule trigger
   */
  private async setupScheduleTrigger(trigger: TriggerDefinition): Promise<void> {
    const config = trigger.config.schedule;
    if (!config) return;

    // Calculate interval in milliseconds
    let intervalMs = 0;
    switch (config.frequency) {
      case 'minutes':
        intervalMs = config.interval * 60 * 1000;
        break;
      case 'hours':
        intervalMs = config.interval * 60 * 60 * 1000;
        break;
      case 'days':
        intervalMs = config.interval * 24 * 60 * 60 * 1000;
        break;
      case 'weeks':
        intervalMs = config.interval * 7 * 24 * 60 * 60 * 1000;
        break;
      case 'months':
        intervalMs = config.interval * 30 * 24 * 60 * 60 * 1000; // Approximate
        break;
    }

    // Set up recurring execution
    const intervalId = setInterval(async () => {
      await this.executeTrigger(trigger, {
        timestamp: new Date().toISOString(),
        trigger_type: 'schedule'
      });
    }, intervalMs);

    this.scheduledJobs.set(trigger.id, intervalId);
    
    console.log(`⏰ Schedule trigger set up: ${trigger.id} (every ${config.interval} ${config.frequency})`);
  }

  /**
   * Set up a webhook trigger
   */
  private async setupWebhookTrigger(trigger: TriggerDefinition): Promise<void> {
    const config = trigger.config.webhook;
    if (!config) return;

    // Create webhook endpoint
    const webhook: WebhookEndpoint = {
      id: `webhook_${trigger.id}`,
      trigger_id: trigger.id,
      url: config.endpoint_url,
      secret_key: Math.random().toString(36).substr(2, 32),
      created_at: new Date().toISOString()
    };

    this.webhookEndpoints.set(trigger.id, webhook);
    
    console.log(`🌐 Webhook trigger set up: ${trigger.id} at ${webhook.url}`);
  }

  /**
   * Set up other trigger types (placeholders for now)
   */
  private async setupEmailTrigger(trigger: TriggerDefinition): Promise<void> {
    console.log(`📧 Email trigger set up: ${trigger.id} (placeholder)`);
  }

  private async setupFileWatchTrigger(trigger: TriggerDefinition): Promise<void> {
    console.log(`📁 File watch trigger set up: ${trigger.id} (placeholder)`);
  }

  private async setupDatabaseTrigger(trigger: TriggerDefinition): Promise<void> {
    console.log(`🗄️ Database trigger set up: ${trigger.id} (placeholder)`);
  }

  /**
   * Teardown a trigger
   */
  private async teardownTrigger(id: string): Promise<void> {
    // Clear scheduled jobs
    const scheduledJob = this.scheduledJobs.get(id);
    if (scheduledJob) {
      clearInterval(scheduledJob);
      this.scheduledJobs.delete(id);
    }

    // Remove webhook endpoints
    this.webhookEndpoints.delete(id);

    console.log(`🧹 Trigger torn down: ${id}`);
  }

  /**
   * Execute a trigger
   */
  private async executeTrigger(trigger: TriggerDefinition, inputData: any): Promise<void> {
    try {
      console.log(`🚀 Executing trigger: ${trigger.id} for workflow: ${trigger.workflow_id}`);

      // Increment execution count
      const updatedTrigger = {
        ...trigger,
        execution_count: trigger.execution_count + 1,
        last_execution: new Date().toISOString()
      };

      this.activeTriggers.set(trigger.id, updatedTrigger);

      // Update in database
      try {
        await supabase
          .from('workflow_triggers')
          .update({
            execution_count: updatedTrigger.execution_count,
            last_execution: updatedTrigger.last_execution
          })
          .eq('id', trigger.id);
      } catch (error) {
        console.error('Failed to update trigger execution count:', error);
      }

      // Here you would integrate with your workflow execution engine
      // For now, we'll just log the execution
      console.log(`📊 Workflow ${trigger.workflow_id} triggered with data:`, inputData);

      // TODO: Integrate with actual workflow execution engine
      // await workflowExecutionEngine.execute(trigger.workflow_id, inputData);

    } catch (error) {
      console.error(`❌ Failed to execute trigger: ${trigger.id}`, error);
      
      // Update trigger status to error
      await this.updateTrigger(trigger.id, { status: 'error' });
      
      throw error;
    }
  }

  /**
   * Get webhook endpoint for a trigger
   */
  getWebhookEndpoint(triggerId: string): WebhookEndpoint | undefined {
    return this.webhookEndpoints.get(triggerId);
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(url: string, payload: any): Promise<void> {
    // Find trigger by webhook URL
    const webhook = Array.from(this.webhookEndpoints.values())
      .find(w => w.url === url);

    if (!webhook) {
      throw new Error('Webhook endpoint not found');
    }

    const trigger = this.activeTriggers.get(webhook.trigger_id);
    if (!trigger) {
      throw new Error('Trigger not found for webhook');
    }

    if (trigger.status !== 'active') {
      throw new Error('Trigger is not active');
    }

    // Execute the trigger
    await this.executeTrigger(trigger, {
      ...payload,
      webhook_url: url,
      received_at: new Date().toISOString()
    });

    // Update webhook last used
    webhook.last_used = new Date().toISOString();
  }

  /**
   * Get trigger statistics
   */
  getTriggerStats(): {
    total: number;
    active: number;
    paused: number;
    error: number;
    byType: Record<string, number>;
  } {
    const triggers = Array.from(this.activeTriggers.values());
    
    return {
      total: triggers.length,
      active: triggers.filter(t => t.status === 'active').length,
      paused: triggers.filter(t => t.status === 'paused').length,
      error: triggers.filter(t => t.status === 'error').length,
      byType: triggers.reduce((acc, trigger) => {
        acc[trigger.type] = (acc[trigger.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const triggerRegistryService = TriggerRegistryService.getInstance();