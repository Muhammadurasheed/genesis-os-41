
import { toast } from 'sonner';

export interface WorkflowNode {
  id: string;
  type: 'agent' | 'trigger' | 'condition' | 'action' | 'delay';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  status: 'idle' | 'running' | 'completed' | 'failed' | 'waiting';
  lastExecution?: Date;
  executionCount: number;
  avgExecutionTime: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  weight: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  endTime?: Date;
  currentNode?: string;
  executionLog: Array<{
    nodeId: string;
    timestamp: Date;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    output?: any;
    error?: string;
  }>;
  metrics: {
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    totalExecutionTime: number;
    averageNodeTime: number;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'analysis' | 'communication' | 'integration';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  estimatedTime: number;
  complexity: 'simple' | 'medium' | 'complex';
  successRate: number;
}

class WorkflowExecutionEngine {
  private executions = new Map<string, WorkflowExecution>();
  private templates: WorkflowTemplate[] = [];

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    this.templates = [
      {
        id: 'weekly-reports',
        name: 'Weekly Business Reports',
        description: 'Automated weekly report generation and distribution',
        category: 'automation',
        estimatedTime: 300, // 5 minutes
        complexity: 'medium',
        successRate: 0.95,
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Weekly Schedule Trigger',
            config: { schedule: 'weekly', day: 'monday', time: '09:00' },
            position: { x: 100, y: 100 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 5
          },
          {
            id: 'agent-1',
            type: 'agent',
            name: 'Data Collector',
            config: { 
              role: 'data_analyst',
              sources: ['crm', 'analytics', 'financial'],
              timeframe: 'last_week'
            },
            position: { x: 300, y: 100 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 120
          },
          {
            id: 'agent-2',
            type: 'agent',
            name: 'Report Generator',
            config: {
              role: 'report_generator',
              template: 'weekly_business_summary',
              format: 'pdf'
            },
            position: { x: 500, y: 100 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 90
          },
          {
            id: 'action-1',
            type: 'action',
            name: 'Distribute Report',
            config: {
              channels: ['email', 'slack'],
              recipients: ['leadership@company.com', '#reports'],
              subject: 'Weekly Business Report - {{date}}'
            },
            position: { x: 700, y: 100 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 30
          }
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'agent-1', weight: 1 },
          { id: 'e2', source: 'agent-1', target: 'agent-2', weight: 1 },
          { id: 'e3', source: 'agent-2', target: 'action-1', weight: 1 }
        ]
      },
      {
        id: 'customer-support',
        name: 'AI Customer Support Flow',
        description: 'Intelligent customer inquiry handling with escalation',
        category: 'communication',
        estimatedTime: 180, // 3 minutes
        complexity: 'complex',
        successRate: 0.88,
        nodes: [
          {
            id: 'trigger-2',
            type: 'trigger',
            name: 'New Support Ticket',
            config: { source: 'support_email', webhook: true },
            position: { x: 100, y: 100 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 2
          },
          {
            id: 'agent-3',
            type: 'agent',
            name: 'Intent Classifier',
            config: {
              role: 'classifier',
              categories: ['technical', 'billing', 'general', 'complaint'],
              confidence_threshold: 0.8
            },
            position: { x: 300, y: 100 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 15
          },
          {
            id: 'condition-1',
            type: 'condition',
            name: 'High Confidence?',
            config: { condition: 'confidence > 0.8' },
            position: { x: 500, y: 100 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 1
          },
          {
            id: 'agent-4',
            type: 'agent',
            name: 'Auto Responder',
            config: {
              role: 'support_agent',
              knowledge_base: 'company_kb',
              tone: 'helpful_professional'
            },
            position: { x: 700, y: 50 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 45
          },
          {
            id: 'action-2',
            type: 'action',
            name: 'Escalate to Human',
            config: {
              assign_to: 'support_team',
              priority: 'normal',
              context: 'low_confidence_classification'
            },
            position: { x: 700, y: 150 },
            status: 'idle',
            executionCount: 0,
            avgExecutionTime: 5
          }
        ],
        edges: [
          { id: 'e4', source: 'trigger-2', target: 'agent-3', weight: 1 },
          { id: 'e5', source: 'agent-3', target: 'condition-1', weight: 1 },
          { 
            id: 'e6', 
            source: 'condition-1', 
            target: 'agent-4', 
            condition: 'confidence > 0.8',
            weight: 1 
          },
          { 
            id: 'e7', 
            source: 'condition-1', 
            target: 'action-2', 
            condition: 'confidence <= 0.8',
            weight: 1 
          }
        ]
      }
    ];
  }

  async executeWorkflow(
    nodes: WorkflowNode[], 
    edges: WorkflowEdge[],
    initialData?: any
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: `workflow_${Date.now()}`,
      status: 'running',
      startTime: new Date(),
      executionLog: [],
      metrics: {
        totalNodes: nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        totalExecutionTime: 0,
        averageNodeTime: 0
      }
    };

    this.executions.set(executionId, execution);

    try {
      console.log('🚀 Starting workflow execution:', executionId);
      
      // Find entry points (nodes with no incoming edges)
      const entryNodes = nodes.filter(node => 
        !edges.some(edge => edge.target === node.id)
      );

      if (entryNodes.length === 0) {
        throw new Error('No entry points found in workflow');
      }

      // Execute nodes in topological order
      const visited = new Set<string>();
      const executing = new Set<string>();
      
      for (const entryNode of entryNodes) {
        await this.executeNodeRecursive(
          entryNode, 
          nodes, 
          edges, 
          visited, 
          executing, 
          execution,
          initialData
        );
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.metrics.totalExecutionTime = 
        execution.endTime.getTime() - execution.startTime.getTime();
      execution.metrics.averageNodeTime = 
        execution.metrics.totalExecutionTime / execution.metrics.completedNodes;

      console.log('✅ Workflow execution completed:', executionId);
      toast.success('Workflow executed successfully', {
        description: `Completed ${execution.metrics.completedNodes} nodes in ${(execution.metrics.totalExecutionTime / 1000).toFixed(1)}s`
      });

    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      execution.status = 'failed';
      execution.endTime = new Date();
      
      toast.error('Workflow execution failed', {
        description: (error as Error).message
      });
    }

    return execution;
  }

  private async executeNodeRecursive(
    node: WorkflowNode,
    allNodes: WorkflowNode[],
    edges: WorkflowEdge[],
    visited: Set<string>,
    executing: Set<string>,
    execution: WorkflowExecution,
    data?: any
  ): Promise<any> {
    if (visited.has(node.id)) {
      return data;
    }

    if (executing.has(node.id)) {
      throw new Error(`Circular dependency detected at node: ${node.name}`);
    }

    executing.add(node.id);
    execution.currentNode = node.id;

    const startTime = Date.now();
    
    execution.executionLog.push({
      nodeId: node.id,
      timestamp: new Date(),
      status: 'started'
    });

    try {
      console.log(`🔄 Executing node: ${node.name}`);
      
      // Simulate node execution based on type
      const result = await this.executeNode(node, data);
      
      const duration = Date.now() - startTime;
      
      execution.executionLog.push({
        nodeId: node.id,
        timestamp: new Date(),
        status: 'completed',
        duration,
        output: result
      });

      execution.metrics.completedNodes++;
      visited.add(node.id);
      executing.delete(node.id);

      // Execute dependent nodes
      const outgoingEdges = edges.filter(edge => edge.source === node.id);
      
      for (const edge of outgoingEdges) {
        const targetNode = allNodes.find(n => n.id === edge.target);
        if (targetNode) {
          // Check edge condition if exists
          if (edge.condition && !this.evaluateCondition(edge.condition, result)) {
            continue;
          }
          
          await this.executeNodeRecursive(
            targetNode,
            allNodes,
            edges,
            visited,
            executing,
            execution,
            result
          );
        }
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      execution.executionLog.push({
        nodeId: node.id,
        timestamp: new Date(),
        status: 'failed',
        duration,
        error: (error as Error).message
      });

      execution.metrics.failedNodes++;
      executing.delete(node.id);
      
      throw error;
    }
  }

  private async executeNode(node: WorkflowNode, inputData?: any): Promise<any> {
    // Simulate execution time based on node type
    const executionTime = node.avgExecutionTime * 1000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, executionTime));

    switch (node.type) {
      case 'trigger':
        return {
          type: 'trigger',
          timestamp: new Date(),
          data: inputData || { triggered: true }
        };

      case 'agent':
        return {
          type: 'agent_result',
          agent: node.name,
          result: this.simulateAgentWork(node.config),
          confidence: 0.85 + Math.random() * 0.15,
          processingTime: executionTime
        };

      case 'condition':
        return {
          type: 'condition_result',
          condition: node.config.condition,
          result: Math.random() > 0.3, // 70% success rate
          evaluatedAt: new Date()
        };

      case 'action':
        return {
          type: 'action_result',
          action: node.name,
          success: Math.random() > 0.1, // 90% success rate
          executedAt: new Date()
        };

      case 'delay':
        const delayTime = node.config.delay || 1000;
        await new Promise(resolve => setTimeout(resolve, delayTime));
        return {
          type: 'delay_completed',
          delayTime,
          completedAt: new Date()
        };

      default:
        return {
          type: 'unknown',
          nodeType: node.type,
          warning: 'Unknown node type executed'
        };
    }
  }

  private simulateAgentWork(config: Record<string, any>): any {
    const role = config.role || 'generic';
    
    const roleResults = {
      data_analyst: {
        metrics: {
          revenue: 125000 + Math.random() * 50000,
          users: 1200 + Math.random() * 300,
          conversion: 0.12 + Math.random() * 0.05,
          growth: 0.08 + Math.random() * 0.04
        },
        insights: [
          'Revenue increased 12% week-over-week',
          'User engagement up significantly',
          'Conversion rate optimization showing results'
        ]
      },
      report_generator: {
        reportUrl: 'https://reports.genesis.ai/weekly-report-2024.pdf',
        format: config.format || 'pdf',
        pages: 8 + Math.floor(Math.random() * 5),
        generatedAt: new Date()
      },
      classifier: {
        category: ['technical', 'billing', 'general', 'complaint'][Math.floor(Math.random() * 4)],
        confidence: 0.75 + Math.random() * 0.25,
        keywords: ['urgent', 'payment', 'issue', 'help']
      },
      support_agent: {
        response: 'Thank you for contacting us. I understand your concern and here is how we can help...',
        sentiment: 'helpful',
        resolution_likelihood: 0.8 + Math.random() * 0.2
      }
    };

    return roleResults[role as keyof typeof roleResults] || {
      result: 'Task completed successfully',
      confidence: 0.9
    };
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluation
      // In production, use a proper expression evaluator
      if (condition.includes('confidence >')) {
        const threshold = parseFloat(condition.split('>')[1].trim());
        return data.confidence > threshold;
      }
      
      if (condition.includes('confidence <=')) {
        const threshold = parseFloat(condition.split('<=')[1].trim());
        return data.confidence <= threshold;
      }

      // Default to true for unknown conditions
      return true;
    } catch {
      return false;
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  getTemplates(): WorkflowTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): WorkflowTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
      toast.info('Workflow execution paused');
    }
  }

  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      toast.info('Workflow execution resumed');
    }
  }

  clearExecution(executionId: string): void {
    this.executions.delete(executionId);
  }

  getExecutionMetrics(): {
    totalExecutions: number;
    runningExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    successRate: number;
  } {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed');
    const running = executions.filter(e => e.status === 'running');

    const avgTime = completed.reduce((sum, e) => sum + e.metrics.totalExecutionTime, 0) / (completed.length || 1);
    const successRate = completed.length / (completed.length + failed.length || 1);

    return {
      totalExecutions: executions.length,
      runningExecutions: running.length,
      completedExecutions: completed.length,
      failedExecutions: failed.length,
      averageExecutionTime: avgTime,
      successRate
    };
  }
}

export const workflowExecutionEngine = new WorkflowExecutionEngine();
