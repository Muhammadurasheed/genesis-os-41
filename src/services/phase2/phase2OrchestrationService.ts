// ============================================================
// Phase 2 Orchestration Service - OpenAI Agent-Level Functionality
// Orchestrates web interaction, API integration, and document processing
// ============================================================

import { EventEmitter } from 'events';
import { webInteractionEngine } from './webInteractionEngine';
import { apiIntegrationFramework } from './apiIntegrationFramework';
import { documentProcessingEngine } from './documentProcessingEngine';


export interface Phase2Task {
  taskId: string;
  agentId: string;
  type: 'web_interaction' | 'api_integration' | 'document_processing' | 'complex_workflow';
  category: string;
  description: string;
  parameters: Record<string, any>;
  dependencies?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Phase2Result {
  taskId: string;
  agentId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  timestamp: Date;
  subTasks?: Phase2Result[];
}

export interface ComplexWorkflow {
  workflowId: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
}

export interface WorkflowStep {
  stepId: string;
  type: 'web_action' | 'api_call' | 'document_task' | 'condition' | 'loop' | 'wait';
  action: string;
  parameters: Record<string, any>;
  condition?: string;
  dependencies?: string[];
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

class Phase2OrchestrationService extends EventEmitter {
  private activeTasks: Map<string, Phase2Task> = new Map();
  private activeWorkflows: Map<string, ComplexWorkflow> = new Map();
  private taskQueue: Phase2Task[] = [];
  private processing = false;

  constructor() {
    super();
    console.log('🎼 Phase 2 Orchestration Service initializing...');
    this.startTaskProcessing();
  }

  // Execute High-Level Phase 2 Tasks
  async executeTask(task: Phase2Task): Promise<Phase2Result> {
    console.log(`🚀 Executing Phase 2 task: ${task.type} - ${task.category}`);
    
    this.activeTasks.set(task.taskId, task);
    const startTime = Date.now();

    try {
      let result: any;

      switch (task.type) {
        case 'web_interaction':
          result = await this.handleWebInteraction(task);
          break;
        
        case 'api_integration':
          result = await this.handleApiIntegration(task);
          break;
        
        case 'document_processing':
          result = await this.handleDocumentProcessing(task);
          break;
        
        case 'complex_workflow':
          result = await this.handleComplexWorkflow(task);
          break;
        
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      const phase2Result: Phase2Result = {
        taskId: task.taskId,
        agentId: task.agentId,
        success: true,
        result,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskCompleted', phase2Result);
      return phase2Result;

    } catch (error) {
      const phase2Result: Phase2Result = {
        taskId: task.taskId,
        agentId: task.agentId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskFailed', phase2Result);
      return phase2Result;
    } finally {
      this.activeTasks.delete(task.taskId);
    }
  }

  // Web Interaction Task Handler
  private async handleWebInteraction(task: Phase2Task): Promise<any> {
    const { category, parameters } = task;

    switch (category) {
      case 'ecommerce_search':
        return await webInteractionEngine.executeEcommerceWorkflow({
          taskId: task.taskId,
          type: 'search_product',
          site: parameters.site,
          parameters: {
            productName: parameters.productName
          }
        });

      case 'ecommerce_purchase':
        return await webInteractionEngine.executeEcommerceWorkflow({
          taskId: task.taskId,
          type: 'add_to_cart',
          site: parameters.site,
          parameters: {
            productUrl: parameters.productUrl,
            addToCartSelector: parameters.selector
          }
        });

      case 'form_filling':
        return await webInteractionEngine.executeEcommerceWorkflow({
          taskId: task.taskId,
          type: 'fill_form',
          site: parameters.site,
          parameters: {
            formUrl: parameters.formUrl,
            formData: parameters.formData
          }
        });

      case 'multi_tab_browsing':
        // Create browser session and handle multiple tabs
        const sessionId = await webInteractionEngine.createBrowserSession(task.taskId);
        const results = [];
        
        for (const url of parameters.urls) {
          const tabResult = await webInteractionEngine.openNewTab(sessionId, url);
          results.push(tabResult);
        }
        
        return { multiTabResults: results };

      default:
        throw new Error(`Unsupported web interaction category: ${category}`);
    }
  }

  // API Integration Task Handler
  private async handleApiIntegration(task: Phase2Task): Promise<any> {
    const { category, parameters } = task;

    switch (category) {
      case 'create_connector':
        return await apiIntegrationFramework.createConnector(parameters.config);

      case 'oauth_flow':
        if (parameters.step === 'initiate') {
          return await apiIntegrationFramework.initiateOAuthFlow(
            parameters.connectorId,
            parameters.oauthConfig
          );
        } else if (parameters.step === 'complete') {
          return await apiIntegrationFramework.completeOAuthFlow(
            parameters.connectorId,
            parameters.authCode,
            parameters.oauthConfig
          );
        }
        break;

      case 'api_request':
        return await apiIntegrationFramework.executeRequest({
          requestId: `req-${task.taskId}`,
          connectorId: parameters.connectorId,
          method: parameters.method,
          endpoint: parameters.endpoint,
          data: parameters.data,
          headers: parameters.headers
        });

      case 'shopify_integration':
        const shopifyConnectorId = await apiIntegrationFramework.createShopifyConnector(
          parameters.shop,
          parameters.accessToken
        );
        
        // Execute Shopify-specific requests
        const shopifyResults = [];
        for (const request of parameters.requests) {
          const result = await apiIntegrationFramework.executeRequest({
            requestId: `shopify-${Date.now()}`,
            connectorId: shopifyConnectorId,
            method: request.method,
            endpoint: request.endpoint,
            data: request.data
          });
          shopifyResults.push(result);
        }
        
        return { shopifyConnectorId, results: shopifyResults };

      case 'stripe_payment':
        const stripeConnectorId = await apiIntegrationFramework.createStripeConnector(
          parameters.secretKey
        );
        
        return await apiIntegrationFramework.executeRequest({
          requestId: `stripe-${task.taskId}`,
          connectorId: stripeConnectorId,
          method: 'POST',
          endpoint: '/charges',
          data: parameters.chargeData
        });

      default:
        throw new Error(`Unsupported API integration category: ${category}`);
    }
  }

  // Document Processing Task Handler
  private async handleDocumentProcessing(task: Phase2Task): Promise<any> {
    const { category, parameters } = task;

    const documentTask = {
      taskId: `doc-${task.taskId}`,
      type: category as any,
      inputData: parameters.inputData,
      outputPath: parameters.outputPath,
      template: parameters.template,
      agentId: task.agentId
    };

    return await documentProcessingEngine.processDocument(documentTask);
  }

  // Complex Workflow Handler
  private async handleComplexWorkflow(task: Phase2Task): Promise<any> {
    const workflow = parameters.workflow as ComplexWorkflow;
    console.log(`🔄 Executing complex workflow: ${workflow.name}`);

    this.activeWorkflows.set(workflow.workflowId, workflow);
    const results: Phase2Result[] = [];
    let workflowVariables = { ...workflow.variables };

    try {
      for (const step of workflow.steps) {
        console.log(`📋 Executing workflow step: ${step.stepId}`);

        // Check dependencies
        if (step.dependencies) {
          const dependencyResults = results.filter(r => 
            step.dependencies!.includes(r.taskId)
          );
          
          if (dependencyResults.some(r => !r.success)) {
            throw new Error(`Step ${step.stepId} dependencies failed`);
          }
        }

        // Execute step with retry logic
        let stepResult: Phase2Result;
        let attempts = 0;
        const maxAttempts = step.retry?.maxAttempts || 1;

        do {
          attempts++;
          try {
            stepResult = await this.executeWorkflowStep(step, workflowVariables, task.agentId);
            
            // Update workflow variables with step results
            if (stepResult.success && stepResult.result) {
              workflowVariables[`step_${step.stepId}_result`] = stepResult.result;
            }
            
            break;
          } catch (error) {
            if (attempts >= maxAttempts) {
              throw error;
            }
            
            // Wait before retry
            if (step.retry?.backoffMs) {
              await new Promise(resolve => setTimeout(resolve, step.retry!.backoffMs * attempts));
            }
          }
        } while (attempts < maxAttempts);

        results.push(stepResult!);

        // Stop if step failed and no retry
        if (!stepResult!.success) {
          throw new Error(`Workflow step ${step.stepId} failed: ${stepResult!.error}`);
        }
      }

      return {
        workflowId: workflow.workflowId,
        completed: true,
        steps: results,
        finalVariables: workflowVariables
      };

    } finally {
      this.activeWorkflows.delete(workflow.workflowId);
    }
  }

  // Execute Individual Workflow Step
  private async executeWorkflowStep(step: WorkflowStep, variables: Record<string, any>, agentId: string): Promise<Phase2Result> {
    const stepTaskId = `step-${step.stepId}-${Date.now()}`;
    
    switch (step.type) {
      case 'web_action':
        const webTask: Phase2Task = {
          taskId: stepTaskId,
          agentId,
          type: 'web_interaction',
          category: step.action,
          description: `Workflow step: ${step.stepId}`,
          parameters: this.interpolateVariables(step.parameters, variables),
          priority: 'medium'
        };
        return await this.executeTask(webTask);

      case 'api_call':
        const apiTask: Phase2Task = {
          taskId: stepTaskId,
          agentId,
          type: 'api_integration',
          category: step.action,
          description: `Workflow step: ${step.stepId}`,
          parameters: this.interpolateVariables(step.parameters, variables),
          priority: 'medium'
        };
        return await this.executeTask(apiTask);

      case 'document_task':
        const docTask: Phase2Task = {
          taskId: stepTaskId,
          agentId,
          type: 'document_processing',
          category: step.action,
          description: `Workflow step: ${step.stepId}`,
          parameters: this.interpolateVariables(step.parameters, variables),
          priority: 'medium'
        };
        return await this.executeTask(docTask);

      case 'wait':
        const waitTime = step.parameters.duration || 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return {
          taskId: stepTaskId,
          agentId,
          success: true,
          result: { waited: waitTime },
          duration: waitTime,
          timestamp: new Date()
        };

      case 'condition':
        const conditionResult = this.evaluateCondition(step.condition!, variables);
        return {
          taskId: stepTaskId,
          agentId,
          success: true,
          result: { conditionMet: conditionResult },
          duration: 0,
          timestamp: new Date()
        };

      default:
        throw new Error(`Unsupported workflow step type: ${step.type}`);
    }
  }

  // Common Workflow Templates
  async createEcommerceWorkflow(site: string, productName: string, agentId: string): Promise<ComplexWorkflow> {
    return {
      workflowId: `ecommerce-${Date.now()}`,
      name: 'E-commerce Product Search and Purchase',
      description: `Search for ${productName} on ${site} and add to cart`,
      variables: { site, productName },
      steps: [
        {
          stepId: 'search',
          type: 'web_action',
          action: 'ecommerce_search',
          parameters: {
            site: '{{site}}',
            productName: '{{productName}}'
          }
        },
        {
          stepId: 'add_to_cart',
          type: 'web_action',
          action: 'ecommerce_purchase',
          parameters: {
            site: '{{site}}',
            productUrl: '{{step_search_result.result.url}}'
          },
          dependencies: ['search']
        },
        {
          stepId: 'generate_receipt',
          type: 'document_task',
          action: 'pdf_generate',
          parameters: {
            inputData: {
              title: 'Purchase Receipt',
              content: ['Product: {{productName}}', 'Site: {{site}}']
            }
          },
          dependencies: ['add_to_cart']
        }
      ]
    };
  }

  // Utility Methods
  private interpolateVariables(obj: any, variables: Record<string, any>): any {
    const str = JSON.stringify(obj);
    const interpolated = str.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const value = this.getNestedValue(variables, variable.trim());
      return value !== undefined ? JSON.stringify(value) : match;
    });
    return JSON.parse(interpolated);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    // Simple condition evaluation - in production, use a more robust expression evaluator
    try {
      const interpolated = this.interpolateVariables(condition, variables);
      return new Function('return ' + interpolated)();
    } catch (error) {
      console.warn('Condition evaluation failed:', error);
      return false;
    }
  }

  private async startTaskProcessing(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    while (this.processing) {
      if (this.taskQueue.length > 0) {
        // Sort by priority
        this.taskQueue.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        const task = this.taskQueue.shift()!;
        
        // Execute task without blocking
        this.executeTask(task).catch(error => {
          console.error(`Task ${task.taskId} failed:`, error);
        });
      }
      
      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Public Management Methods
  async queueTask(task: Phase2Task): Promise<void> {
    this.taskQueue.push(task);
    this.emit('taskQueued', { taskId: task.taskId, queueLength: this.taskQueue.length });
  }

  getActiveTasks(): Phase2Task[] {
    return Array.from(this.activeTasks.values());
  }

  getActiveWorkflows(): ComplexWorkflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  getQueueStatus(): { pending: number; active: number } {
    return {
      pending: this.taskQueue.length,
      active: this.activeTasks.size
    };
  }

  async cancelTask(taskId: string): Promise<boolean> {
    // Remove from queue
    const queueIndex = this.taskQueue.findIndex(t => t.taskId === taskId);
    if (queueIndex >= 0) {
      this.taskQueue.splice(queueIndex, 1);
      this.emit('taskCancelled', { taskId });
      return true;
    }
    
    // Check if currently active
    if (this.activeTasks.has(taskId)) {
      this.emit('taskCancelled', { taskId });
      return true;
    }
    
    return false;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Phase 2 Orchestration Service...');
    
    this.processing = false;
    this.taskQueue.length = 0;
    this.activeTasks.clear();
    this.activeWorkflows.clear();
    
    // Cleanup sub-services
    await Promise.all([
      webInteractionEngine.cleanup(),
      apiIntegrationFramework.cleanup(),
      documentProcessingEngine.cleanup()
    ]);
  }
}

// Create singleton instance
export const phase2OrchestrationService = new Phase2OrchestrationService();
export default phase2OrchestrationService;