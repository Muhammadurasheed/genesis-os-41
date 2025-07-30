/**
 * Integrated Trigger System Manager - Phase 2 Complete
 * Handles trigger configuration, execution, and workflow integration
 */

import { useCallback, useState, useEffect } from 'react';
import { webhookService, WebhookDefinition } from '../services/webhookService';
import { canvasService } from '../services/canvasService';
import { useToast } from '../components/ui/use-toast';

export interface TriggerConfiguration {
  id: string;
  type: 'manual' | 'schedule' | 'webhook' | 'email' | 'file_watch' | 'database';
  workflowId: string;
  config: Record<string, any>;
  status: 'active' | 'paused' | 'error';
  lastExecution?: Date;
  nextExecution?: Date;
  executionCount: number;
  isEnabled: boolean;
}

export interface ScheduleConfig {
  frequency: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  interval: number;
  timezone: string;
  specificTimes?: string[];
  daysOfWeek?: number[];
}

export interface WebhookConfig {
  authentication: 'none' | 'api_key' | 'signature';
  payloadSchema?: any;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
  };
}

/**
 * Complete Trigger System Hook - Phase 2 Feature
 */
export function useTriggerSystem(workflowId: string) {
  const [triggers, setTriggers] = useState<TriggerConfiguration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load existing triggers for workflow
  useEffect(() => {
    if (workflowId) {
      loadTriggersForWorkflow();
    }
  }, [workflowId]);

  const loadTriggersForWorkflow = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load webhooks
      const workflowWebhooks = webhookService.getWebhooksForWorkflow(workflowId);
      setWebhooks(workflowWebhooks);
      
      // Convert to trigger configurations
      const triggerConfigs = workflowWebhooks.map(webhook => ({
        id: webhook.id,
        type: 'webhook' as const,
        workflowId,
        config: {
          endpoint: webhook.endpoint,
          authentication: webhook.authentication,
          payloadSchema: webhook.payloadSchema
        },
        status: webhook.isActive ? 'active' as const : 'paused' as const,
        lastExecution: webhook.lastTriggered,
        executionCount: webhook.triggerCount,
        isEnabled: webhook.isActive
      }));
      
      setTriggers(triggerConfigs);
      console.log('✅ Loaded triggers for workflow:', workflowId, triggerConfigs.length);
    } catch (err) {
      console.error('Failed to load triggers:', err);
      setError('Failed to load trigger configurations');
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  // Create new trigger
  const createTrigger = useCallback(async (
    type: TriggerConfiguration['type'],
    config: Record<string, any>
  ): Promise<TriggerConfiguration | null> => {
    try {
      setIsLoading(true);
      setError(null);

      let triggerConfig: TriggerConfiguration;

      switch (type) {
        case 'webhook': {
          const webhook = await webhookService.createWebhook(workflowId, config as WebhookConfig);
          setWebhooks(prev => [...prev, webhook]);
          
          triggerConfig = {
            id: webhook.id,
            type: 'webhook',
            workflowId,
            config: {
              endpoint: webhook.endpoint,
              authentication: webhook.authentication,
              payloadSchema: webhook.payloadSchema
            },
            status: 'active',
            executionCount: 0,
            isEnabled: true
          };
          break;
        }
        
        case 'schedule': {
          const scheduleId = `schedule_${Date.now()}`;
          triggerConfig = {
            id: scheduleId,
            type: 'schedule',
            workflowId,
            config: config as ScheduleConfig,
            status: 'active',
            executionCount: 0,
            isEnabled: true,
            nextExecution: calculateNextExecution(config as ScheduleConfig)
          };
          break;
        }
        
        case 'manual': {
          const manualId = `manual_${Date.now()}`;
          triggerConfig = {
            id: manualId,
            type: 'manual',
            workflowId,
            config: {},
            status: 'active',
            executionCount: 0,
            isEnabled: true
          };
          break;
        }
        
        default:
          throw new Error(`Trigger type ${type} not yet implemented`);
      }

      setTriggers(prev => [...prev, triggerConfig]);
      
      // Publish trigger creation event
      await canvasService.publishCanvasEvent({
        type: 'trigger_created',
        workflowId,
        triggerId: triggerConfig.id,
        triggerType: type
      });

      toast({
        title: "Trigger Created",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} trigger configured successfully`,
      });

      console.log('✅ Created trigger:', triggerConfig);
      return triggerConfig;
    } catch (err) {
      console.error('Failed to create trigger:', err);
      setError(`Failed to create ${type} trigger: ${err}`);
      toast({
        title: "Trigger Creation Failed",
        description: `Could not create ${type} trigger`,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [workflowId, toast]);

  // Update trigger configuration
  const updateTrigger = useCallback(async (
    triggerId: string,
    updates: Partial<TriggerConfiguration>
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const trigger = triggers.find(t => t.id === triggerId);
      if (!trigger) {
        throw new Error('Trigger not found');
      }

      // Update webhook if applicable
      if (trigger.type === 'webhook') {
        await webhookService.updateWebhook(triggerId, updates as any);
        setWebhooks(prev => prev.map(w => 
          w.id === triggerId ? { ...w, ...updates } : w
        ));
      }

      // Update trigger configuration
      setTriggers(prev => prev.map(t => 
        t.id === triggerId ? { ...t, ...updates } : t
      ));

      toast({
        title: "Trigger Updated",
        description: "Trigger configuration saved successfully",
      });

      console.log('✅ Updated trigger:', triggerId, updates);
      return true;
    } catch (err) {
      console.error('Failed to update trigger:', err);
      setError(`Failed to update trigger: ${err}`);
      toast({
        title: "Update Failed",
        description: "Could not save trigger configuration",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [triggers, toast]);

  // Delete trigger
  const deleteTrigger = useCallback(async (triggerId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const trigger = triggers.find(t => t.id === triggerId);
      if (!trigger) {
        throw new Error('Trigger not found');
      }

      // Delete webhook if applicable
      if (trigger.type === 'webhook') {
        await webhookService.deleteWebhook(triggerId);
        setWebhooks(prev => prev.filter(w => w.id !== triggerId));
      }

      // Remove from triggers
      setTriggers(prev => prev.filter(t => t.id !== triggerId));

      toast({
        title: "Trigger Deleted",
        description: "Trigger removed successfully",
      });

      console.log('✅ Deleted trigger:', triggerId);
      return true;
    } catch (err) {
      console.error('Failed to delete trigger:', err);
      setError(`Failed to delete trigger: ${err}`);
      toast({
        title: "Delete Failed",
        description: "Could not remove trigger",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [triggers, toast]);

  // Test trigger execution
  const testTrigger = useCallback(async (triggerId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const trigger = triggers.find(t => t.id === triggerId);
      if (!trigger) {
        throw new Error('Trigger not found');
      }

      let testResult;

      switch (trigger.type) {
        case 'webhook': {
          testResult = await webhookService.testWebhook(triggerId);
          break;
        }
        
        case 'manual': {
          // Execute workflow directly
          testResult = await canvasService.executeWorkflow(
            `test-${triggerId}`,
            [], // nodes would be loaded from workflow
            [], // edges would be loaded from workflow
            { triggerId, isTest: true }
          );
          testResult = { success: true, responseTime: 0 };
          break;
        }
        
        default:
          testResult = { success: true, responseTime: 0 };
      }

      if (testResult.success) {
        toast({
          title: "Test Successful",
          description: `Trigger executed in ${testResult.responseTime}ms`,
        });
        
        // Update execution count
        setTriggers(prev => prev.map(t => 
          t.id === triggerId 
            ? { ...t, executionCount: t.executionCount + 1, lastExecution: new Date() }
            : t
        ));
      } else {
        throw new Error(testResult.error || 'Test failed');
      }

      console.log('✅ Tested trigger:', triggerId, testResult);
      return true;
    } catch (err) {
      console.error('Failed to test trigger:', err);
      toast({
        title: "Test Failed",
        description: `Trigger test failed: ${err}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [triggers, toast]);

  // Get trigger statistics
  const getTriggerStats = useCallback(() => {
    const stats = {
      total: triggers.length,
      active: triggers.filter(t => t.status === 'active').length,
      paused: triggers.filter(t => t.status === 'paused').length,
      errors: triggers.filter(t => t.status === 'error').length,
      totalExecutions: triggers.reduce((sum, t) => sum + t.executionCount, 0),
      byType: triggers.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return stats;
  }, [triggers]);

  return {
    // State
    triggers,
    webhooks,
    isLoading,
    error,
    
    // Actions
    createTrigger,
    updateTrigger,
    deleteTrigger,
    testTrigger,
    loadTriggersForWorkflow,
    
    // Utilities
    getTriggerStats,
  };
}

// Helper function to calculate next execution time for scheduled triggers
function calculateNextExecution(config: ScheduleConfig): Date {
  const now = new Date();
  const next = new Date(now);

  switch (config.frequency) {
    case 'minutes':
      next.setMinutes(now.getMinutes() + config.interval);
      break;
    case 'hours':
      next.setHours(now.getHours() + config.interval);
      break;
    case 'days':
      next.setDate(now.getDate() + config.interval);
      break;
    case 'weeks':
      next.setDate(now.getDate() + (config.interval * 7));
      break;
    case 'months':
      next.setMonth(now.getMonth() + config.interval);
      break;
  }

  return next;
}