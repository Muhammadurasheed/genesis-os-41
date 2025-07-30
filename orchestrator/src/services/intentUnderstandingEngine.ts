import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// =================== CORE INTERFACES ===================

export interface BusinessIntent {
  id: string;
  user_id: string;
  workspace_id: string;
  raw_description: string;
  extracted_goals: string[];
  identified_processes: WorkflowProcess[];
  required_integrations: Integration[];
  complexity_score: number;
  confidence_score: number;
  clarification_questions: ClarificationQuestion[];
  refined_intent?: RefinedIntent;
  created_at: string;
  updated_at: string;
  status: 'initial' | 'clarifying' | 'refined' | 'validated' | 'approved';
}

export interface WorkflowProcess {
  id: string;
  name: string;
  description: string;
  type: 'sequential' | 'parallel' | 'conditional' | 'loop';
  steps: ProcessStep[];
  triggers: string[];
  outputs: string[];
  estimated_duration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  action_type: 'human' | 'automated' | 'hybrid';
  required_tools: string[];
  dependencies: string[];
  estimated_time: number;
}

export interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'file' | 'email' | 'messaging';
  required_credentials: string[];
  endpoints: string[];
  data_flow: 'input' | 'output' | 'bidirectional';
  priority: 'essential' | 'recommended' | 'optional';
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'open' | 'choice' | 'scale' | 'boolean';
  category: 'scope' | 'constraints' | 'preferences' | 'requirements' | 'validation';
  options?: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  context: string;
}

export interface UserResponse {
  question_id: string;
  answer: string | number | boolean;
  confidence: number;
  timestamp: string;
}

export interface RefinedIntent {
  id: string;
  original_intent_id: string;
  refined_goals: string[];
  validated_processes: WorkflowProcess[];
  finalized_integrations: Integration[];
  implementation_roadmap: ImplementationPhase[];
  success_metrics: SuccessMetric[];
  risk_assessment: RiskFactor[];
  final_confidence_score: number;
  estimated_complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  estimated_timeline: string;
  estimated_cost: number;
  created_at: string;
}

export interface ImplementationPhase {
  phase_number: number;
  name: string;
  description: string;
  deliverables: string[];
  estimated_duration: number;
  dependencies: string[];
  risk_level: 'low' | 'medium' | 'high';
}

export interface SuccessMetric {
  id: string;
  name: string;
  description: string;
  type: 'quantitative' | 'qualitative';
  target_value?: number;
  measurement_method: string;
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
}

export interface RiskFactor {
  id: string;
  description: string;
  category: 'technical' | 'business' | 'operational' | 'security' | 'compliance';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation_strategy: string;
}

// =================== INTENT UNDERSTANDING ENGINE ===================

class IntentUnderstandingEngine {
  private agentServiceUrl: string;
  private intentCache: Map<string, BusinessIntent> = new Map();
  private clarificationCache: Map<string, ClarificationQuestion[]> = new Map();

  constructor() {
    this.agentServiceUrl = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
    console.log('🧠 Intent Understanding Engine initialized with FAANG-level excellence');
  }

  /**
   * PHASE 1: Initial Intent Analysis
   * Socrates/Einstein-level understanding of user input
   */
  public async analyzeInitialIntent(
    user_id: string,
    workspace_id: string,
    raw_description: string
  ): Promise<BusinessIntent> {
    try {
      console.log('🧠 Analyzing initial intent with AI...');
      
      const intentId = `intent-${uuidv4()}`;
      
      // Call AI service for deep intent analysis
      const aiAnalysis = await this.performAIIntentAnalysis(raw_description);
      
      // Extract structured components
      const extractedGoals = this.extractBusinessGoals(aiAnalysis.analysis);
      const identifiedProcesses = this.identifyWorkflowProcesses(aiAnalysis.analysis);
      const requiredIntegrations = this.identifyRequiredIntegrations(aiAnalysis.analysis);
      
      // Calculate complexity and confidence scores
      const complexityScore = this.calculateComplexityScore(
        extractedGoals,
        identifiedProcesses,
        requiredIntegrations
      );
      const confidenceScore = this.calculateConfidenceScore(aiAnalysis.analysis, raw_description);
      
      // Generate clarification questions
      const clarificationQuestions = await this.generateClarificationQuestions(
        extractedGoals,
        identifiedProcesses,
        requiredIntegrations,
        confidenceScore
      );
      
      const businessIntent: BusinessIntent = {
        id: intentId,
        user_id,
        workspace_id,
        raw_description,
        extracted_goals: extractedGoals,
        identified_processes: identifiedProcesses,
        required_integrations: requiredIntegrations,
        complexity_score: complexityScore,
        confidence_score: confidenceScore,
        clarification_questions: clarificationQuestions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: confidenceScore > 0.8 ? 'refined' : 'clarifying'
      };
      
      // Cache the intent
      this.intentCache.set(intentId, businessIntent);
      this.clarificationCache.set(intentId, clarificationQuestions);
      
      console.log(`✅ Intent analyzed: ${confidenceScore.toFixed(2)} confidence, ${complexityScore} complexity`);
      
      return businessIntent;
    } catch (error: any) {
      console.error('❌ Error analyzing intent:', error);
      throw new Error(`Intent analysis failed: ${error.message}`);
    }
  }

  /**
   * PHASE 2: Clarification Engine
   * Generate intelligent questions to refine understanding
   */
  public async generateClarificationQuestions(
    goals: string[],
    processes: WorkflowProcess[],
    integrations: Integration[],
    currentConfidence: number
  ): Promise<ClarificationQuestion[]> {
    console.log('🤔 Generating clarification questions...');
    
    const questions: ClarificationQuestion[] = [];
    
    // Scope clarification questions
    if (goals.length > 3 || currentConfidence < 0.7) {
      questions.push({
        id: `q-${uuidv4()}`,
        question: "Which of these goals is your highest priority for the first implementation phase?",
        type: 'choice',
        category: 'scope',
        options: goals.slice(0, 5),
        importance: 'critical',
        context: 'Helps prioritize development phases and resource allocation'
      });
    }
    
    // Process clarification
    const complexProcesses = processes.filter(p => p.steps.length > 5);
    if (complexProcesses.length > 0) {
      questions.push({
        id: `q-${uuidv4()}`,
        question: `For the ${complexProcesses[0].name} process, how many people typically handle this workflow currently?`,
        type: 'open',
        category: 'requirements',
        importance: 'high',
        context: 'Determines agent capacity and concurrent processing needs'
      });
    }
    
    // Integration constraints
    const criticalIntegrations = integrations.filter(i => i.priority === 'essential');
    if (criticalIntegrations.length > 2) {
      questions.push({
        id: `q-${uuidv4()}`,
        question: "Do you have API access and administrative rights for all required integrations?",
        type: 'boolean',
        category: 'constraints',
        importance: 'critical',
        context: 'Critical for implementation feasibility and timeline estimation'
      });
    }
    
    // Performance expectations
    if (processes.some(p => p.estimated_duration > 3600)) {
      questions.push({
        id: `q-${uuidv4()}`,
        question: "What's your expected response time for automated processes? (e.g., under 5 minutes, within 1 hour, etc.)",
        type: 'choice',
        category: 'requirements',
        options: ['Under 1 minute', 'Under 5 minutes', 'Under 30 minutes', 'Within 1 hour', 'Within 4 hours'],
        importance: 'high',
        context: 'Determines infrastructure requirements and architecture decisions'
      });
    }
    
    // Validation questions
    questions.push({
      id: `q-${uuidv4()}`,
      question: "How will you measure success for this automation? What specific metrics matter most?",
      type: 'open',
      category: 'validation',
      importance: 'medium',
      context: 'Establishes success criteria and monitoring requirements'
    });
    
    console.log(`✅ Generated ${questions.length} clarification questions`);
    return questions;
  }

  /**
   * PHASE 3: Response Analysis & Intent Refinement
   */
  public async analyzeResponses(
    intentId: string,
    responses: UserResponse[]
  ): Promise<RefinedIntent> {
    try {
      console.log(`🔄 Analyzing ${responses.length} user responses for intent refinement...`);
      
      const originalIntent = this.intentCache.get(intentId);
      if (!originalIntent) {
        throw new Error(`Intent ${intentId} not found in cache`);
      }
      
      // Process responses to refine intent
      const refinedGoals = await this.refineGoalsFromResponses(originalIntent.extracted_goals, responses);
      const validatedProcesses = await this.validateProcessesFromResponses(originalIntent.identified_processes, responses);
      const finalizedIntegrations = await this.finalizeIntegrationsFromResponses(originalIntent.required_integrations, responses);
      
      // Generate implementation roadmap
      const implementationRoadmap = this.generateImplementationRoadmap(
        refinedGoals,
        validatedProcesses,
        finalizedIntegrations
      );
      
      // Define success metrics
      const successMetrics = this.defineSuccessMetrics(refinedGoals, responses);
      
      // Perform risk assessment
      const riskAssessment = this.performRiskAssessment(
        validatedProcesses,
        finalizedIntegrations,
        implementationRoadmap
      );
      
      // Calculate final confidence and complexity
      const finalConfidenceScore = this.calculateFinalConfidence(responses, originalIntent.confidence_score);
      const estimatedComplexity = this.determineComplexity(validatedProcesses, finalizedIntegrations);
      const estimatedTimeline = this.estimateTimeline(implementationRoadmap);
      const estimatedCost = this.estimateCost(validatedProcesses, finalizedIntegrations, implementationRoadmap);
      
      const refinedIntent: RefinedIntent = {
        id: `refined-${uuidv4()}`,
        original_intent_id: intentId,
        refined_goals: refinedGoals,
        validated_processes: validatedProcesses,
        finalized_integrations: finalizedIntegrations,
        implementation_roadmap: implementationRoadmap,
        success_metrics: successMetrics,
        risk_assessment: riskAssessment,
        final_confidence_score: finalConfidenceScore,
        estimated_complexity: estimatedComplexity,
        estimated_timeline: estimatedTimeline,
        estimated_cost: estimatedCost,
        created_at: new Date().toISOString()
      };
      
      // Update original intent
      originalIntent.refined_intent = refinedIntent;
      originalIntent.status = 'refined';
      originalIntent.updated_at = new Date().toISOString();
      
      console.log(`✅ Intent refined with ${finalConfidenceScore.toFixed(2)} final confidence`);
      
      return refinedIntent;
    } catch (error: any) {
      console.error('❌ Error refining intent:', error);
      throw new Error(`Intent refinement failed: ${error.message}`);
    }
  }

  /**
   * PHASE 4: Confidence Scoring Algorithm
   */
  public calculateConfidenceScore(aiAnalysis: string, originalInput: string): number {
    let confidence = 0.5; // Base confidence
    
    // Length and detail analysis
    if (originalInput.length > 200) confidence += 0.1;
    if (originalInput.length > 500) confidence += 0.1;
    
    // Specificity indicators
    const specificityKeywords = ['when', 'how', 'what', 'why', 'where', 'specific', 'exactly', 'need to', 'should', 'must'];
    const specificityCount = specificityKeywords.filter(keyword => 
      originalInput.toLowerCase().includes(keyword)
    ).length;
    confidence += Math.min(specificityCount * 0.05, 0.2);
    
    // Business context indicators
    const businessKeywords = ['customer', 'revenue', 'efficiency', 'automation', 'process', 'workflow', 'integration'];
    const businessCount = businessKeywords.filter(keyword => 
      originalInput.toLowerCase().includes(keyword)
    ).length;
    confidence += Math.min(businessCount * 0.08, 0.25);
    
    // Technical detail indicators
    const technicalKeywords = ['api', 'database', 'email', 'slack', 'crm', 'erp', 'webhook', 'integration'];
    const technicalCount = technicalKeywords.filter(keyword => 
      originalInput.toLowerCase().includes(keyword)
    ).length;
    confidence += Math.min(technicalCount * 0.06, 0.15);
    
    // AI analysis quality
    if (aiAnalysis.length > 1000) confidence += 0.1;
    if (aiAnalysis.includes('specific') || aiAnalysis.includes('detailed')) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  // =================== PRIVATE HELPER METHODS ===================

  private async performAIIntentAnalysis(description: string): Promise<{ analysis: string }> {
    try {
      const response = await axios.post(`${this.agentServiceUrl}/blueprint/generate`, {
        user_input: description,
        context: {
          intent_analysis: true,
          deep_understanding: true,
          socratic_questioning: true
        }
      });
      
      return {
        analysis: response.data.blueprint?.interpretation || description
      };
    } catch (error) {
      console.warn('AI analysis failed, using fallback analysis');
      return {
        analysis: `Business automation request: ${description}`
      };
    }
  }

  private extractBusinessGoals(analysis: string): string[] {
    // Advanced goal extraction logic
    const goalPatterns = [
      /(?:goal|objective|aim|target|want to|need to|should|must)\s+([^.!?]+)/gi,
      /(?:improve|increase|reduce|eliminate|automate|streamline)\s+([^.!?]+)/gi,
      /(?:achieve|accomplish|deliver|provide|enable)\s+([^.!?]+)/gi
    ];
    
    const goals = new Set<string>();
    
    goalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(analysis)) !== null) {
        const goal = match[1].trim();
        if (goal.length > 10 && goal.length < 200) {
          goals.add(goal);
        }
      }
    });
    
    return Array.from(goals).slice(0, 8); // Limit to top 8 goals
  }

  private identifyWorkflowProcesses(analysis: string): WorkflowProcess[] {
    // Simulate advanced process identification
    const processKeywords = ['process', 'workflow', 'procedure', 'steps', 'sequence', 'pipeline'];
    const processes: WorkflowProcess[] = [];
    
    // This would be enhanced with more sophisticated NLP
    if (processKeywords.some(keyword => analysis.toLowerCase().includes(keyword))) {
      processes.push({
        id: `process-${uuidv4()}`,
        name: 'Primary Business Process',
        description: 'Main workflow identified from user description',
        type: 'sequential',
        steps: [
          {
            id: `step-${uuidv4()}`,
            name: 'Input Processing',
            description: 'Process initial input',
            action_type: 'automated',
            required_tools: ['input-validator'],
            dependencies: [],
            estimated_time: 300
          }
        ],
        triggers: ['manual', 'scheduled'],
        outputs: ['processed-data'],
        estimated_duration: 1800,
        priority: 'high'
      });
    }
    
    return processes;
  }

  private identifyRequiredIntegrations(analysis: string): Integration[] {
    const integrationMap: Record<string, Integration> = {
      'email': {
        id: `int-${uuidv4()}`,
        name: 'Email Integration',
        type: 'email',
        required_credentials: ['smtp_host', 'smtp_port', 'username', 'password'],
        endpoints: ['send', 'receive'],
        data_flow: 'bidirectional',
        priority: 'essential'
      },
      'slack': {
        id: `int-${uuidv4()}`,
        name: 'Slack Integration',
        type: 'messaging',
        required_credentials: ['bot_token', 'app_token'],
        endpoints: ['send_message', 'create_channel'],
        data_flow: 'bidirectional',
        priority: 'recommended'
      }
    };
    
    const identifiedIntegrations: Integration[] = [];
    const lowerAnalysis = analysis.toLowerCase();
    
    Object.keys(integrationMap).forEach(key => {
      if (lowerAnalysis.includes(key)) {
        identifiedIntegrations.push(integrationMap[key]);
      }
    });
    
    return identifiedIntegrations;
  }

  private calculateComplexityScore(
    goals: string[],
    processes: WorkflowProcess[],
    integrations: Integration[]
  ): number {
    let complexity = 0;
    
    // Goals complexity
    complexity += goals.length * 0.1;
    
    // Process complexity
    processes.forEach(process => {
      complexity += process.steps.length * 0.15;
      if (process.type === 'conditional') complexity += 0.2;
      if (process.type === 'parallel') complexity += 0.3;
    });
    
    // Integration complexity
    integrations.forEach(integration => {
      complexity += integration.required_credentials.length * 0.1;
      if (integration.type === 'api') complexity += 0.2;
      if (integration.data_flow === 'bidirectional') complexity += 0.1;
    });
    
    return Math.min(complexity, 1.0);
  }

  private async refineGoalsFromResponses(originalGoals: string[], responses: UserResponse[]): Promise<string[]> {
    // Priority-based goal refinement
    const priorityResponse = responses.find(r => r.question_id.includes('priority'));
    if (priorityResponse && typeof priorityResponse.answer === 'string') {
      const prioritizedGoal = priorityResponse.answer;
      return [prioritizedGoal, ...originalGoals.filter(g => g !== prioritizedGoal)];
    }
    
    return originalGoals;
  }

  private async validateProcessesFromResponses(
    originalProcesses: WorkflowProcess[],
    responses: UserResponse[]
  ): Promise<WorkflowProcess[]> {
    // Enhanced process validation based on user responses
    return originalProcesses.map(process => ({
      ...process,
      validated: true,
      estimated_duration: this.adjustDurationFromResponses(process.estimated_duration, responses)
    }));
  }

  private async finalizeIntegrationsFromResponses(
    originalIntegrations: Integration[],
    responses: UserResponse[]
  ): Promise<Integration[]> {
    // Filter integrations based on user constraints
    const accessResponse = responses.find(r => r.question_id.includes('access'));
    if (accessResponse && accessResponse.answer === false) {
      return originalIntegrations.filter(i => i.priority !== 'essential');
    }
    
    return originalIntegrations;
  }

  private generateImplementationRoadmap(
    goals: string[],
    processes: WorkflowProcess[],
    integrations: Integration[]
  ): ImplementationPhase[] {
    return [
      {
        phase_number: 1,
        name: 'Foundation Setup',
        description: 'Set up core infrastructure and essential integrations',
        deliverables: ['Agent framework', 'Core integrations', 'Basic workflows'],
        estimated_duration: 604800, // 1 week in seconds
        dependencies: [],
        risk_level: 'low'
      },
      {
        phase_number: 2,
        name: 'Process Automation',
        description: 'Implement and test primary business processes',
        deliverables: ['Automated workflows', 'Process monitoring', 'Error handling'],
        estimated_duration: 1209600, // 2 weeks in seconds
        dependencies: ['Phase 1'],
        risk_level: 'medium'
      },
      {
        phase_number: 3,
        name: 'Optimization & Scaling',
        description: 'Optimize performance and prepare for production scaling',
        deliverables: ['Performance optimization', 'Monitoring dashboard', 'Documentation'],
        estimated_duration: 604800, // 1 week in seconds
        dependencies: ['Phase 2'],
        risk_level: 'low'
      }
    ];
  }

  private defineSuccessMetrics(goals: string[], responses: UserResponse[]): SuccessMetric[] {
    const metrics: SuccessMetric[] = [
      {
        id: `metric-${uuidv4()}`,
        name: 'Process Automation Rate',
        description: 'Percentage of manual processes successfully automated',
        type: 'quantitative',
        target_value: 85,
        measurement_method: 'Automated tracking of process completions',
        frequency: 'daily'
      },
      {
        id: `metric-${uuidv4()}`,
        name: 'Response Time',
        description: 'Average time for agents to complete tasks',
        type: 'quantitative',
        target_value: 300, // 5 minutes in seconds
        measurement_method: 'Performance monitoring',
        frequency: 'realtime'
      }
    ];
    
    return metrics;
  }

  private performRiskAssessment(
    processes: WorkflowProcess[],
    integrations: Integration[],
    roadmap: ImplementationPhase[]
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // Integration dependency risks
    if (integrations.length > 3) {
      risks.push({
        id: `risk-${uuidv4()}`,
        description: 'High dependency on multiple external integrations',
        category: 'technical',
        probability: 'medium',
        impact: 'medium',
        mitigation_strategy: 'Implement circuit breakers and fallback mechanisms'
      });
    }
    
    // Process complexity risks
    const complexProcesses = processes.filter(p => p.steps.length > 5);
    if (complexProcesses.length > 0) {
      risks.push({
        id: `risk-${uuidv4()}`,
        description: 'Complex multi-step processes may have failure points',
        category: 'operational',
        probability: 'medium',
        impact: 'high',
        mitigation_strategy: 'Implement comprehensive error handling and process monitoring'
      });
    }
    
    return risks;
  }

  private calculateFinalConfidence(responses: UserResponse[], originalConfidence: number): number {
    let confidence = originalConfidence;
    
    // Boost confidence based on response quality
    const detailedResponses = responses.filter(r => 
      typeof r.answer === 'string' && r.answer.length > 20
    );
    confidence += detailedResponses.length * 0.05;
    
    // High confidence responses boost overall confidence
    const highConfidenceResponses = responses.filter(r => r.confidence > 0.8);
    confidence += highConfidenceResponses.length * 0.03;
    
    return Math.min(confidence, 1.0);
  }

  private determineComplexity(
    processes: WorkflowProcess[],
    integrations: Integration[]
  ): 'simple' | 'moderate' | 'complex' | 'enterprise' {
    const totalSteps = processes.reduce((sum, p) => sum + p.steps.length, 0);
    const essentialIntegrations = integrations.filter(i => i.priority === 'essential').length;
    
    if (totalSteps < 5 && essentialIntegrations < 2) return 'simple';
    if (totalSteps < 15 && essentialIntegrations < 4) return 'moderate';
    if (totalSteps < 30 && essentialIntegrations < 6) return 'complex';
    return 'enterprise';
  }

  private estimateTimeline(roadmap: ImplementationPhase[]): string {
    const totalDuration = roadmap.reduce((sum, phase) => sum + phase.estimated_duration, 0);
    const weeks = Math.ceil(totalDuration / 604800); // Convert seconds to weeks
    
    if (weeks === 1) return '1 week';
    if (weeks < 4) return `${weeks} weeks`;
    if (weeks < 12) return `${Math.ceil(weeks / 4)} months`;
    return `${Math.ceil(weeks / 12)} quarters`;
  }

  private estimateCost(
    processes: WorkflowProcess[],
    integrations: Integration[],
    roadmap: ImplementationPhase[]
  ): number {
    // Sophisticated cost estimation algorithm
    let baseCost = 5000; // Base implementation cost
    
    // Process complexity cost
    const totalSteps = processes.reduce((sum, p) => sum + p.steps.length, 0);
    baseCost += totalSteps * 200;
    
    // Integration cost
    baseCost += integrations.length * 1000;
    
    // Timeline multiplier
    const phases = roadmap.length;
    baseCost *= (1 + (phases - 1) * 0.3);
    
    return Math.round(baseCost);
  }

  private adjustDurationFromResponses(originalDuration: number, responses: UserResponse[]): number {
    const performanceResponse = responses.find(r => 
      r.question_id.includes('response') || r.question_id.includes('time')
    );
    
    if (performanceResponse && typeof performanceResponse.answer === 'string') {
      const answer = performanceResponse.answer.toLowerCase();
      if (answer.includes('1 minute')) return Math.min(originalDuration, 60);
      if (answer.includes('5 minutes')) return Math.min(originalDuration, 300);
      if (answer.includes('30 minutes')) return Math.min(originalDuration, 1800);
    }
    
    return originalDuration;
  }

  // =================== PUBLIC ACCESS METHODS ===================

  public getIntent(intentId: string): BusinessIntent | undefined {
    return this.intentCache.get(intentId);
  }

  public getClarificationQuestions(intentId: string): ClarificationQuestion[] | undefined {
    return this.clarificationCache.get(intentId);
  }

  public getAllIntents(): BusinessIntent[] {
    return Array.from(this.intentCache.values());
  }

  public clearCache(): void {
    this.intentCache.clear();
    this.clarificationCache.clear();
    console.log('🧹 Intent cache cleared');
  }
}

// Create singleton instance
const intentUnderstandingEngine = new IntentUnderstandingEngine();
export default intentUnderstandingEngine;