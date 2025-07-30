/**
 * Autonomous Agent Service - Self-improving AI agents with learning capabilities
 * Phase 3: Agent Intelligence
 */

import { multiModelReasoningService } from './multiModelReasoningService';
import { mcpIntegrationService } from './mcpIntegrationService';
import agentMemoryService from '../memory/agentMemoryService';
// import microserviceManager from '../core/microserviceManager';

export interface AutonomousAgent {
  id: string;
  name: string;
  role: string;
  goals: string[];
  constraints: string[];
  capabilities: string[];
  performance: {
    successRate: number;
    averageResponseTime: number;
    taskCompletionRate: number;
    learningProgress: number;
    adaptabilityScore: number;
  };
  personality: {
    creativity: number;
    precision: number;
    empathy: number;
    assertiveness: number;
    curiosity: number;
  };
  learningModel: {
    experiences: number;
    patterns: string[];
    improvements: Array<{
      timestamp: Date;
      improvement: string;
      impactScore: number;
    }>;
  };
}

export interface AgentTask {
  id: string;
  agentId: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'learning';
  context: Record<string, any>;
  requiredTools: string[];
  expectedOutcome: string;
  startTime?: Date;
  endTime?: Date;
  result?: any;
  feedback?: {
    success: boolean;
    rating: number;
    comments: string;
    lessons: string[];
  };
}

export interface LearningInsight {
  id: string;
  agentId: string;
  insight: string;
  category: 'performance' | 'strategy' | 'tool_usage' | 'communication';
  confidence: number;
  applicableScenarios: string[];
  implementationStatus: 'pending' | 'implemented' | 'testing';
  impactScore: number;
}

export class AutonomousAgentService {
  private agents: Map<string, AutonomousAgent> = new Map();
  private taskQueue: Map<string, AgentTask[]> = new Map();
  private learningInsights: Map<string, LearningInsight[]> = new Map();
  private executionInterval: NodeJS.Timeout | null = null;
  private learningInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutonomousExecution();
    this.startLearningCycle();
    console.log('🤖 Autonomous Agent Service initialized');
  }

  public async createAutonomousAgent(config: {
    name: string;
    role: string;
    goals: string[];
    constraints?: string[];
    personality?: Partial<AutonomousAgent['personality']>;
  }): Promise<AutonomousAgent> {
    const agentId = `autonomous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Discover relevant tools based on goals
    const relevantTools = await mcpIntegrationService.discoverTools(config.goals);
    
    const agent: AutonomousAgent = {
      id: agentId,
      name: config.name,
      role: config.role,
      goals: config.goals,
      constraints: config.constraints || [
        'Follow ethical guidelines',
        'Respect user privacy',
        'Avoid harmful actions',
        'Seek clarification when uncertain'
      ],
      capabilities: relevantTools.map(tool => tool.name),
      performance: {
        successRate: 0.0,
        averageResponseTime: 0,
        taskCompletionRate: 0.0,
        learningProgress: 0.0,
        adaptabilityScore: 0.5
      },
      personality: {
        creativity: config.personality?.creativity || 0.5,
        precision: config.personality?.precision || 0.7,
        empathy: config.personality?.empathy || 0.6,
        assertiveness: config.personality?.assertiveness || 0.5,
        curiosity: config.personality?.curiosity || 0.8,
        ...config.personality
      },
      learningModel: {
        experiences: 0,
        patterns: [],
        improvements: []
      }
    };

    this.agents.set(agentId, agent);
    this.taskQueue.set(agentId, []);
    this.learningInsights.set(agentId, []);

    console.log(`✅ Created autonomous agent: ${agent.name} (${agentId})`);
    return agent;
  }

  public async assignTask(agentId: string, task: Omit<AgentTask, 'id' | 'agentId'>): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTask: AgentTask = {
      id: taskId,
      agentId,
      ...task,
      status: 'pending'
    };

    const queue = this.taskQueue.get(agentId) || [];
    
    // Insert task based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = queue.findIndex(t => 
      priorityOrder[t.priority] > priorityOrder[task.priority]
    );
    
    if (insertIndex === -1) {
      queue.push(fullTask);
    } else {
      queue.splice(insertIndex, 0, fullTask);
    }

    this.taskQueue.set(agentId, queue);

    console.log(`📋 Task assigned to ${agent.name}: ${task.description}`);
    return taskId;
  }

  private startAutonomousExecution(): void {
    this.executionInterval = setInterval(async () => {
      for (const [agentId, agent] of this.agents) {
        await this.processAgentTasks(agentId, agent);
      }
    }, 5000); // Process tasks every 5 seconds
  }

  private async processAgentTasks(agentId: string, agent: AutonomousAgent): Promise<void> {
    const queue = this.taskQueue.get(agentId) || [];
    const pendingTask = queue.find(task => task.status === 'pending');

    if (!pendingTask) return;

    console.log(`🔄 Agent ${agent.name} processing task: ${pendingTask.description}`);

    pendingTask.status = 'in_progress';
    pendingTask.startTime = new Date();

    try {
      const result = await this.executeTaskWithLearning(agent, pendingTask);
      
      pendingTask.status = 'completed';
      pendingTask.endTime = new Date();
      pendingTask.result = result;

      // Update performance metrics
      await this.updateAgentPerformance(agentId, pendingTask, true);

      console.log(`✅ Task completed successfully: ${pendingTask.description}`);

    } catch (error) {
      console.error(`❌ Task failed for agent ${agent.name}:`, error);
      
      pendingTask.status = 'failed';
      pendingTask.endTime = new Date();
      pendingTask.result = { error: (error as Error).message };

      // Update performance metrics
      await this.updateAgentPerformance(agentId, pendingTask, false);

      // Learn from failure
      await this.learnFromFailure(agent, pendingTask, error as Error);
    }

    // Update the task queue
    this.taskQueue.set(agentId, queue);
  }

  private async executeTaskWithLearning(
    agent: AutonomousAgent,
    task: AgentTask
  ): Promise<any> {
    // Retrieve relevant memories and insights (for future enhancement)
    // const _memories = await agentMemoryService.getConversationContext(
    //   agent.id,
    //   'autonomous_execution',
    //   task.description
    // );

    const insights = this.learningInsights.get(agent.id) || [];
    const relevantInsights = insights.filter(insight =>
      insight.applicableScenarios.some(scenario =>
        task.description.toLowerCase().includes(scenario.toLowerCase())
      )
    );

    // Build execution strategy
    const strategy = await this.buildExecutionStrategy(agent, task, relevantInsights);

    // Execute task steps
    const executionResult = await this.executeTaskSteps(agent, task, strategy);

    // Learn from execution
    await this.captureExecutionLearnings(agent, task, executionResult);

    return executionResult;
  }

  private async buildExecutionStrategy(
    agent: AutonomousAgent,
    task: AgentTask,
    insights: LearningInsight[]
  ): Promise<{
    approach: string;
    steps: string[];
    toolsToUse: string[];
    riskMitigation: string[];
  }> {
    const prompt = `
    As ${agent.name}, a ${agent.role} with goals: ${agent.goals.join(', ')}
    
    I need to complete this task: "${task.description}"
    
    My constraints: ${agent.constraints.join(', ')}
    Available tools: ${agent.capabilities.join(', ')}
    
    Previous insights that might help:
    ${insights.map(i => `- ${i.insight}`).join('\n')}
    
    Create a detailed execution strategy including:
    1. Overall approach
    2. Step-by-step plan
    3. Tools to use
    4. Risk mitigation strategies
    
    Return as JSON with keys: approach, steps, toolsToUse, riskMitigation
    `;

    try {
      const response = await multiModelReasoningService.reasonWithConsensus(prompt, {
        requiredCapabilities: ['reasoning', 'analysis'],
        minConsensus: 0.7
      });

      return JSON.parse(response.finalAnswer);
    } catch (error) {
      console.warn('⚠️ Strategy planning failed, using default approach');
      return {
        approach: 'Direct execution with available tools',
        steps: ['Analyze requirements', 'Execute using best available tools', 'Verify results'],
        toolsToUse: agent.capabilities.slice(0, 2),
        riskMitigation: ['Monitor execution closely', 'Have fallback plan ready']
      };
    }
  }

  private async executeTaskSteps(
    agent: AutonomousAgent,
    task: AgentTask,
    strategy: any
  ): Promise<any> {
    const results: any[] = [];

    for (const [index, step] of strategy.steps.entries()) {
      console.log(`🔄 Executing step ${index + 1}: ${step}`);

      try {
        // Determine which tool to use for this step
        const toolToUse = strategy.toolsToUse[index] || strategy.toolsToUse[0];
        
        if (toolToUse && agent.capabilities.includes(toolToUse)) {
          // Execute using MCP tool
          const toolResult = await mcpIntegrationService.executeTool(toolToUse, {
            instruction: step,
            context: task.context,
            agentGoals: agent.goals
          });

          results.push({
            step,
            toolUsed: toolToUse,
            result: toolResult.result,
            success: toolResult.success
          });
        } else {
          // Execute using reasoning model
          const prompt = `
          As ${agent.name}, execute this step: "${step}"
          
          Context: ${JSON.stringify(task.context)}
          Goal: ${task.description}
          
          Provide a detailed result of executing this step.
          `;

          const response = await multiModelReasoningService.reasonWithConsensus(prompt);
          
          results.push({
            step,
            toolUsed: 'reasoning',
            result: response.finalAnswer,
            success: true
          });
        }

        // Brief pause between steps
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Step ${index + 1} failed:`, error);
        results.push({
          step,
          error: (error as Error).message,
          success: false
        });
      }
    }

    return {
      strategy,
      stepResults: results,
      overallSuccess: results.every(r => r.success),
      completionTime: new Date()
    };
  }

  private async captureExecutionLearnings(
    agent: AutonomousAgent,
    task: AgentTask,
    result: any
  ): Promise<void> {
    // Store execution memory
    const memory = {
      task: task.description,
      approach: result.strategy.approach,
      outcome: result.overallSuccess ? 'success' : 'mixed',
      steps: result.stepResults,
      lessons: this.extractLessonsFromExecution(result)
    };

    await agentMemoryService.storeMemory(
      agent.id,
      JSON.stringify(memory),
      'execution',
      { taskId: task.id, autonomous: true },
      0.8
    );

    // Generate learning insights
    const learningPrompt = `
    Based on this task execution, what insights can be learned for future improvements?
    
    Task: ${task.description}
    Success: ${result.overallSuccess}
    Steps: ${result.stepResults.map((r: any) => r.step).join(', ')}
    
    Generate 2-3 specific insights that could improve future performance.
    Format as JSON array with objects having: insight, category, confidence, applicableScenarios
    `;

    try {
      const learningResponse = await multiModelReasoningService.reasonWithConsensus(learningPrompt);
      const insights = JSON.parse(learningResponse.finalAnswer);

      const agentInsights = this.learningInsights.get(agent.id) || [];
      
      for (const insight of insights) {
        const newInsight: LearningInsight = {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          agentId: agent.id,
          insight: insight.insight,
          category: insight.category || 'performance',
          confidence: insight.confidence || 0.7,
          applicableScenarios: insight.applicableScenarios || [task.description],
          implementationStatus: 'pending',
          impactScore: 0.5
        };

        agentInsights.push(newInsight);
      }

      this.learningInsights.set(agent.id, agentInsights);
      
      // Update agent's learning progress
      agent.learningModel.experiences++;
      agent.performance.learningProgress = Math.min(agent.learningModel.experiences / 100, 1.0);
      
      this.agents.set(agent.id, agent);

    } catch (error) {
      console.warn('⚠️ Failed to generate learning insights:', error);
    }
  }

  private extractLessonsFromExecution(result: any): string[] {
    const lessons: string[] = [];

    if (!result.overallSuccess) {
      const failedSteps = result.stepResults.filter((r: any) => !r.success);
      lessons.push(`${failedSteps.length} steps failed - review approach`);
    }

    const toolsUsed = result.stepResults.map((r: any) => r.toolUsed);
    const uniqueTools = [...new Set(toolsUsed)];
    lessons.push(`Successfully used tools: ${uniqueTools.join(', ')}`);

    if (result.strategy.approach.includes('direct')) {
      lessons.push('Direct approach was effective for this task type');
    }

    return lessons;
  }

  private async updateAgentPerformance(
    agentId: string,
    task: AgentTask,
    success: boolean
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const executionTime = task.endTime && task.startTime
      ? task.endTime.getTime() - task.startTime.getTime()
      : 0;

    // Update success rate
    const totalTasks = agent.learningModel.experiences + 1;
    const successfulTasks = agent.performance.successRate * agent.learningModel.experiences + (success ? 1 : 0);
    agent.performance.successRate = successfulTasks / totalTasks;

    // Update average response time
    const currentAvg = agent.performance.averageResponseTime;
    agent.performance.averageResponseTime = currentAvg === 0 
      ? executionTime 
      : (currentAvg + executionTime) / 2;

    // Update adaptability based on learning from failures
    if (!success) {
      agent.performance.adaptabilityScore = Math.min(agent.performance.adaptabilityScore + 0.1, 1.0);
    }

    this.agents.set(agentId, agent);
  }

  private async learnFromFailure(agent: AutonomousAgent, task: AgentTask, error: Error): Promise<void> {
    console.log(`📚 Agent ${agent.name} learning from failure`);

    const failureAnalysis = await this.analyzeFailure(agent, task, error);
    
    // Store failure analysis in memory
    await agentMemoryService.storeMemory(
      agent.id,
      JSON.stringify({
        failure: error.message,
        task: task.description,
        analysis: failureAnalysis,
        timestamp: new Date()
      }),
      'failure_analysis',
      { learning: true },
      0.9 // High importance for failures
    );

    // Create learning insight from failure
    const insight: LearningInsight = {
      id: `insight_failure_${Date.now()}`,
      agentId: agent.id,
      insight: `Avoid ${failureAnalysis.rootCause} when ${failureAnalysis.scenario}`,
      category: 'strategy',
      confidence: 0.8,
      applicableScenarios: [task.description],
      implementationStatus: 'implemented',
      impactScore: 0.7
    };

    const insights = this.learningInsights.get(agent.id) || [];
    insights.push(insight);
    this.learningInsights.set(agent.id, insights);
  }

  private async analyzeFailure(agent: AutonomousAgent, task: AgentTask, error: Error) {
    const prompt = `
    Analyze this task failure for learning purposes:
    
    Agent: ${agent.name} (${agent.role})
    Task: ${task.description}
    Error: ${error.message}
    
    Provide analysis with:
    - Root cause
    - Prevention strategy
    - Alternative approach
    - Scenario pattern
    
    Return as JSON.
    `;

    try {
      const response = await multiModelReasoningService.reasonWithConsensus(prompt);
      return JSON.parse(response.finalAnswer);
    } catch {
      return {
        rootCause: 'Unknown error',
        preventionStrategy: 'Add error handling',
        alternativeApproach: 'Use simpler tools',
        scenario: 'similar complex tasks'
      };
    }
  }

  private startLearningCycle(): void {
    this.learningInterval = setInterval(async () => {
      for (const [agentId, agent] of this.agents) {
        await this.performLearningCycle(agentId, agent);
      }
    }, 30000); // Learn every 30 seconds
  }

  private async performLearningCycle(agentId: string, agent: AutonomousAgent): Promise<void> {
    const insights = this.learningInsights.get(agentId) || [];
    const pendingInsights = insights.filter(i => i.implementationStatus === 'pending');

    if (pendingInsights.length === 0) return;

    console.log(`📚 Agent ${agent.name} performing learning cycle`);

    // Implement top insights
    for (const insight of pendingInsights.slice(0, 2)) {
      await this.implementInsight(agent, insight);
    }
  }

  private async implementInsight(agent: AutonomousAgent, insight: LearningInsight): Promise<void> {
    console.log(`💡 Implementing insight: ${insight.insight}`);

    // Update agent patterns
    if (!agent.learningModel.patterns.includes(insight.insight)) {
      agent.learningModel.patterns.push(insight.insight);
    }

    // Record improvement
    agent.learningModel.improvements.push({
      timestamp: new Date(),
      improvement: insight.insight,
      impactScore: insight.impactScore
    });

    // Update insight status
    insight.implementationStatus = 'implemented';

    // Update stored data
    this.agents.set(agent.id, agent);
    const insights = this.learningInsights.get(agent.id) || [];
    const index = insights.findIndex(i => i.id === insight.id);
    if (index !== -1) {
      insights[index] = insight;
      this.learningInsights.set(agent.id, insights);
    }

    console.log(`✅ Insight implemented for ${agent.name}`);
  }

  public getAgent(agentId: string): AutonomousAgent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values());
  }

  public getAgentTasks(agentId: string): AgentTask[] {
    return this.taskQueue.get(agentId) || [];
  }

  public getAgentInsights(agentId: string): LearningInsight[] {
    return this.learningInsights.get(agentId) || [];
  }

  public async pauseAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      // Mark current tasks as paused
      const tasks = this.taskQueue.get(agentId) || [];
      tasks.filter(t => t.status === 'in_progress').forEach(t => t.status = 'pending');
      
      console.log(`⏸️ Agent ${agent.name} paused`);
    }
  }

  public destroy(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
    
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }

    console.log('🛑 Autonomous Agent Service destroyed');
  }
}

// Singleton instance
export const autonomousAgentService = new AutonomousAgentService();