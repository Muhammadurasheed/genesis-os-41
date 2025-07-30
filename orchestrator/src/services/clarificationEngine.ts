import { v4 as uuidv4 } from 'uuid';
import { 
  BusinessIntent, 
  ClarificationQuestion, 
  UserResponse, 
  RefinedIntent 
} from './intentUnderstandingEngine';

// =================== CLARIFICATION SESSION INTERFACES ===================

export interface ClarificationSession {
  id: string;
  intent_id: string;
  user_id: string;
  questions: ClarificationQuestion[];
  responses: UserResponse[];
  current_question_index: number;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  completion_percentage: number;
  estimated_remaining_time: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface QuestionContext {
  previous_responses: UserResponse[];
  user_behavior: UserBehavior;
  session_metadata: SessionMetadata;
}

export interface UserBehavior {
  response_time_avg: number;
  confidence_level_avg: number;
  detail_level: 'brief' | 'moderate' | 'detailed';
  engagement_score: number;
  completion_rate: number;
}

export interface SessionMetadata {
  device_type: string;
  session_duration: number;
  interruptions: number;
  backtrack_count: number;
}

export interface AdaptiveQuestionStrategy {
  prioritization: 'critical_first' | 'easy_first' | 'progressive' | 'adaptive';
  max_questions: number;
  time_budget: number;
  confidence_threshold: number;
}

// =================== CLARIFICATION ENGINE ===================

class ClarificationEngine {
  private sessionCache: Map<string, ClarificationSession> = new Map();
  private questionTemplates: Map<string, ClarificationQuestion[]> = new Map();
  private userBehaviorCache: Map<string, UserBehavior> = new Map();

  constructor() {
    this.initializeQuestionTemplates();
    console.log('🤔 Clarification Engine initialized with adaptive intelligence');
  }

  /**
   * Start interactive clarification session
   */
  public async startClarificationSession(
    intent: BusinessIntent,
    strategy: AdaptiveQuestionStrategy = this.getDefaultStrategy()
  ): Promise<ClarificationSession> {
    try {
      console.log(`🤔 Starting clarification session for intent: ${intent.id}`);
      
      const sessionId = `session-${uuidv4()}`;
      
      // Generate adaptive questions based on intent and strategy
      const questions = await this.generateAdaptiveQuestions(intent, strategy);
      
      // Prioritize questions based on strategy
      const prioritizedQuestions = this.prioritizeQuestions(questions, strategy);
      
      const session: ClarificationSession = {
        id: sessionId,
        intent_id: intent.id,
        user_id: intent.user_id,
        questions: prioritizedQuestions,
        responses: [],
        current_question_index: 0,
        status: 'active',
        completion_percentage: 0,
        estimated_remaining_time: this.estimateSessionTime(prioritizedQuestions),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.sessionCache.set(sessionId, session);
      
      console.log(`✅ Clarification session started with ${questions.length} questions`);
      return session;
    } catch (error: any) {
      console.error('❌ Error starting clarification session:', error);
      throw new Error(`Failed to start clarification session: ${error.message}`);
    }
  }

  /**
   * Get next question in the session
   */
  public getNextQuestion(sessionId: string): ClarificationQuestion | null {
    const session = this.sessionCache.get(sessionId);
    if (!session || session.status !== 'active') {
      return null;
    }

    if (session.current_question_index >= session.questions.length) {
      // Session completed
      session.status = 'completed';
      session.completed_at = new Date().toISOString();
      session.completion_percentage = 100;
      return null;
    }

    const question = session.questions[session.current_question_index];
    
    // Add adaptive context to question
    this.enhanceQuestionWithContext(question, session);
    
    return question;
  }

  /**
   * Process user response and adapt session
   */
  public async processResponse(
    sessionId: string,
    questionId: string,
    answer: string | number | boolean,
    confidence: number = 0.8
  ): Promise<{
    next_question: ClarificationQuestion | null;
    session_status: string;
    completion_percentage: number;
    insights?: string[];
  }> {
    try {
      const session = this.sessionCache.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Create response record
      const response: UserResponse = {
        question_id: questionId,
        answer,
        confidence,
        timestamp: new Date().toISOString()
      };

      session.responses.push(response);
      
      // Update user behavior analytics
      this.updateUserBehavior(session.user_id, response, session);
      
      // Analyze response for adaptive questioning
      const responseAnalysis = await this.analyzeResponse(response, session);
      
      // Determine if we need follow-up questions
      const followUpQuestions = await this.generateFollowUpQuestions(response, responseAnalysis, session);
      if (followUpQuestions.length > 0) {
        // Insert follow-up questions
        session.questions.splice(session.current_question_index + 1, 0, ...followUpQuestions);
      }
      
      // Move to next question
      session.current_question_index++;
      session.completion_percentage = Math.round((session.current_question_index / session.questions.length) * 100);
      session.updated_at = new Date().toISOString();
      
      // Check if session should be completed early
      const shouldComplete = await this.shouldCompleteEarly(session);
      if (shouldComplete) {
        session.status = 'completed';
        session.completed_at = new Date().toISOString();
        session.completion_percentage = 100;
      }
      
      const nextQuestion = this.getNextQuestion(sessionId);
      
      // Generate insights based on current responses
      const insights = this.generateSessionInsights(session);
      
      console.log(`✅ Response processed. ${session.completion_percentage}% complete`);
      
      return {
        next_question: nextQuestion,
        session_status: session.status,
        completion_percentage: session.completion_percentage,
        insights
      };
    } catch (error: any) {
      console.error('❌ Error processing response:', error);
      throw new Error(`Failed to process response: ${error.message}`);
    }
  }

  /**
   * Get comprehensive session summary
   */
  public getSessionSummary(sessionId: string): {
    session: ClarificationSession;
    key_insights: string[];
    confidence_assessment: number;
    readiness_score: number;
    next_steps: string[];
  } | null {
    const session = this.sessionCache.get(sessionId);
    if (!session) return null;

    const keyInsights = this.generateSessionInsights(session);
    const confidenceAssessment = this.calculateSessionConfidence(session);
    const readinessScore = this.calculateReadinessScore(session);
    const nextSteps = this.generateNextSteps(session, readinessScore);

    return {
      session,
      key_insights: keyInsights,
      confidence_assessment: confidenceAssessment,
      readiness_score: readinessScore,
      next_steps: nextSteps
    };
  }

  // =================== PRIVATE METHODS ===================

  private initializeQuestionTemplates(): void {
    // Business Context Templates
    this.questionTemplates.set('business_context', [
      {
        id: 'bc-industry',
        question: 'What industry or sector does your business operate in?',
        type: 'choice',
        category: 'scope',
        options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Other'],
        importance: 'medium',
        context: 'Industry context helps optimize agent behavior and compliance requirements'
      },
      {
        id: 'bc-size',
        question: 'How many employees does your organization have?',
        type: 'choice',
        category: 'scope',
        options: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
        importance: 'high',
        context: 'Team size determines scalability requirements and user management complexity'
      }
    ]);

    // Process Context Templates
    this.questionTemplates.set('process_context', [
      {
        id: 'pc-frequency',
        question: 'How often does this process typically run?',
        type: 'choice',
        category: 'requirements',
        options: ['Multiple times per day', 'Daily', 'Weekly', 'Monthly', 'As needed'],
        importance: 'high',
        context: 'Frequency determines infrastructure requirements and monitoring needs'
      },
      {
        id: 'pc-volume',
        question: 'What\'s the typical volume of items processed in each run?',
        type: 'choice',
        category: 'requirements',
        options: ['1-10', '11-100', '101-1000', '1000+'],
        importance: 'high',
        context: 'Volume impacts performance requirements and cost estimation'
      }
    ]);

    // Technical Context Templates
    this.questionTemplates.set('technical_context', [
      {
        id: 'tc-expertise',
        question: 'What\'s your team\'s technical expertise level?',
        type: 'choice',
        category: 'constraints',
        options: ['Non-technical', 'Basic', 'Intermediate', 'Advanced'],
        importance: 'high',
        context: 'Technical expertise determines implementation approach and support needs'
      }
    ]);
  }

  private async generateAdaptiveQuestions(
    intent: BusinessIntent,
    strategy: AdaptiveQuestionStrategy
  ): Promise<ClarificationQuestion[]> {
    const questions: ClarificationQuestion[] = [];
    
    // Start with critical questions based on confidence gaps
    if (intent.confidence_score < 0.6) {
      questions.push(...this.getCriticalQuestionsForLowConfidence(intent));
    }
    
    // Add process-specific questions
    intent.identified_processes.forEach(process => {
      questions.push(...this.generateProcessQuestions(process));
    });
    
    // Add integration-specific questions
    intent.required_integrations.forEach(integration => {
      questions.push(...this.generateIntegrationQuestions(integration));
    });
    
    // Add business context questions
    questions.push(...this.getBusinessContextQuestions());
    
    // Apply strategy constraints
    return questions.slice(0, strategy.max_questions);
  }

  private prioritizeQuestions(
    questions: ClarificationQuestion[],
    strategy: AdaptiveQuestionStrategy
  ): ClarificationQuestion[] {
    switch (strategy.prioritization) {
      case 'critical_first':
        return questions.sort((a, b) => {
          const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return importanceOrder[b.importance] - importanceOrder[a.importance];
        });
        
      case 'easy_first':
        return questions.sort((a, b) => {
          const difficultyScore = (q: ClarificationQuestion) => {
            if (q.type === 'boolean') return 1;
            if (q.type === 'choice') return 2;
            if (q.type === 'scale') return 3;
            return 4; // open
          };
          return difficultyScore(a) - difficultyScore(b);
        });
        
      case 'progressive':
        return this.createProgressiveFlow(questions);
        
      default:
        return questions;
    }
  }

  private createProgressiveFlow(questions: ClarificationQuestion[]): ClarificationQuestion[] {
    // Group questions by category
    const grouped = questions.reduce((acc, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(q);
      return acc;
    }, {} as Record<string, ClarificationQuestion[]>);
    
    // Create progressive flow: scope → requirements → constraints → preferences → validation
    const flow = ['scope', 'requirements', 'constraints', 'preferences', 'validation'];
    const result: ClarificationQuestion[] = [];
    
    flow.forEach(category => {
      if (grouped[category]) {
        result.push(...grouped[category]);
      }
    });
    
    return result;
  }

  private enhanceQuestionWithContext(question: ClarificationQuestion, session: ClarificationSession): void {
    // Add dynamic context based on previous responses
    const relevantResponses = session.responses.filter(r => 
      r.question_id.startsWith(question.category.substring(0, 2))
    );
    
    if (relevantResponses.length > 0) {
      question.context += ` Based on your previous responses, this will help us ${this.getContextualHelp(question, relevantResponses)}.`;
    }
  }

  private getContextualHelp(question: ClarificationQuestion, responses: UserResponse[]): string {
    const contextMap: Record<string, string> = {
      'scope': 'better define the project boundaries',
      'requirements': 'estimate performance and infrastructure needs',
      'constraints': 'identify potential implementation challenges',
      'preferences': 'customize the solution to your workflow',
      'validation': 'establish success criteria and monitoring'
    };
    
    return contextMap[question.category] || 'optimize the implementation approach';
  }

  private async analyzeResponse(response: UserResponse, session: ClarificationSession): Promise<{
    quality: 'low' | 'medium' | 'high';
    clarity: number;
    completeness: number;
    implications: string[];
  }> {
    const analysis = {
      quality: 'medium' as 'low' | 'medium' | 'high',
      clarity: response.confidence,
      completeness: 0.8,
      implications: [] as string[]
    };
    
    // Analyze response quality
    if (typeof response.answer === 'string') {
      const length = response.answer.length;
      if (length < 10) {
        analysis.quality = 'low';
        analysis.completeness = 0.3;
      } else if (length > 100) {
        analysis.quality = 'high';
        analysis.completeness = 1.0;
      }
      
      // Check for specific details
      if (response.answer.includes('specifically') || response.answer.includes('exactly')) {
        analysis.implications.push('User provided specific requirements');
      }
    }
    
    return analysis;
  }

  private async generateFollowUpQuestions(
    response: UserResponse,
    analysis: any,
    session: ClarificationSession
  ): Promise<ClarificationQuestion[]> {
    const followUps: ClarificationQuestion[] = [];
    
    // Generate follow-ups for unclear responses
    if (analysis.clarity < 0.6 && typeof response.answer === 'string') {
      followUps.push({
        id: `followup-${uuidv4()}`,
        question: `To clarify your previous answer "${response.answer}", could you provide a specific example?`,
        type: 'open',
        category: 'validation',
        importance: 'high',
        context: 'Follow-up question to improve clarity'
      });
    }
    
    // Generate follow-ups for high-impact responses
    if (response.answer === 'Enterprise' || response.answer === '1000+') {
      followUps.push({
        id: `followup-${uuidv4()}`,
        question: 'Given the enterprise scale, do you need multi-region deployment or specific compliance requirements?',
        type: 'open',
        category: 'requirements',
        importance: 'critical',
        context: 'Enterprise-scale requirements assessment'
      });
    }
    
    return followUps;
  }

  private async shouldCompleteEarly(session: ClarificationSession): Promise<boolean> {
    // Complete early if we have high confidence and critical questions answered
    const criticalAnswered = session.responses.filter(r => 
      session.questions.find(q => q.id === r.question_id)?.importance === 'critical'
    ).length;
    
    const totalCritical = session.questions.filter(q => q.importance === 'critical').length;
    const avgConfidence = session.responses.reduce((sum, r) => sum + r.confidence, 0) / session.responses.length;
    
    return criticalAnswered >= totalCritical && avgConfidence > 0.8 && session.responses.length >= 5;
  }

  private generateSessionInsights(session: ClarificationSession): string[] {
    const insights: string[] = [];
    
    // Analyze response patterns
    const avgConfidence = session.responses.reduce((sum, r) => sum + r.confidence, 0) / session.responses.length;
    if (avgConfidence > 0.8) {
      insights.push('User demonstrates high confidence in requirements');
    }
    
    // Analyze response types
    const detailedResponses = session.responses.filter(r => 
      typeof r.answer === 'string' && r.answer.length > 50
    ).length;
    
    if (detailedResponses > session.responses.length * 0.5) {
      insights.push('User provides detailed, thoughtful responses indicating deep business understanding');
    }
    
    // Domain-specific insights
    const businessSizeResponse = session.responses.find(r => r.question_id.includes('size'));
    if (businessSizeResponse && businessSizeResponse.answer === '1000+') {
      insights.push('Enterprise-scale implementation requiring advanced monitoring and compliance features');
    }
    
    return insights;
  }

  private calculateSessionConfidence(session: ClarificationSession): number {
    if (session.responses.length === 0) return 0;
    
    const responseConfidence = session.responses.reduce((sum, r) => sum + r.confidence, 0) / session.responses.length;
    const completionBonus = session.completion_percentage / 100 * 0.2;
    const criticalResponseBonus = this.getCriticalResponseBonus(session);
    
    return Math.min(responseConfidence + completionBonus + criticalResponseBonus, 1.0);
  }

  private getCriticalResponseBonus(session: ClarificationSession): number {
    const criticalQuestions = session.questions.filter(q => q.importance === 'critical');
    const criticalResponses = session.responses.filter(r => 
      criticalQuestions.some(q => q.id === r.question_id)
    );
    
    return (criticalResponses.length / criticalQuestions.length) * 0.15;
  }

  private calculateReadinessScore(session: ClarificationSession): number {
    const confidence = this.calculateSessionConfidence(session);
    const completion = session.completion_percentage / 100;
    const qualityScore = this.calculateResponseQuality(session);
    
    return (confidence * 0.4 + completion * 0.3 + qualityScore * 0.3);
  }

  private calculateResponseQuality(session: ClarificationSession): number {
    if (session.responses.length === 0) return 0;
    
    const qualityScores = session.responses.map(r => {
      if (typeof r.answer === 'string') {
        const length = r.answer.length;
        if (length < 5) return 0.2;
        if (length < 20) return 0.5;
        if (length < 100) return 0.8;
        return 1.0;
      }
      return 0.7; // Default for non-string answers
    });
    
    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  private generateNextSteps(session: ClarificationSession, readinessScore: number): string[] {
    const steps: string[] = [];
    
    if (readinessScore > 0.8) {
      steps.push('Proceed to blueprint generation');
      steps.push('Begin technical architecture design');
      steps.push('Prepare integration credentials setup');
    } else if (readinessScore > 0.6) {
      steps.push('Address remaining clarification questions');
      steps.push('Review and validate requirements');
      steps.push('Consider additional stakeholder input');
    } else {
      steps.push('Complete additional discovery sessions');
      steps.push('Gather more detailed requirements');
      steps.push('Involve technical stakeholders');
    }
    
    return steps;
  }

  private updateUserBehavior(userId: string, response: UserResponse, session: ClarificationSession): void {
    let behavior = this.userBehaviorCache.get(userId) || {
      response_time_avg: 60,
      confidence_level_avg: 0.7,
      detail_level: 'moderate',
      engagement_score: 0.5,
      completion_rate: 0.8
    };
    
    // Update averages (simple moving average for demo)
    behavior.confidence_level_avg = (behavior.confidence_level_avg + response.confidence) / 2;
    
    if (typeof response.answer === 'string') {
      const length = response.answer.length;
      if (length > 100) behavior.detail_level = 'detailed';
      else if (length < 20) behavior.detail_level = 'brief';
    }
    
    this.userBehaviorCache.set(userId, behavior);
  }

  private estimateSessionTime(questions: ClarificationQuestion[]): number {
    // Estimate based on question complexity
    return questions.reduce((time, q) => {
      const baseTime = 60; // 1 minute base
      const complexityMultiplier = {
        'boolean': 1,
        'choice': 1.5,
        'scale': 2,
        'open': 3
      };
      return time + (baseTime * complexityMultiplier[q.type]);
    }, 0);
  }

  private getDefaultStrategy(): AdaptiveQuestionStrategy {
    return {
      prioritization: 'progressive',
      max_questions: 12,
      time_budget: 900, // 15 minutes
      confidence_threshold: 0.8
    };
  }

  private getCriticalQuestionsForLowConfidence(intent: BusinessIntent): ClarificationQuestion[] {
    return [
      {
        id: `critical-${uuidv4()}`,
        question: 'What is the primary business problem you\'re trying to solve?',
        type: 'open',
        category: 'scope',
        importance: 'critical',
        context: 'Core problem definition for accurate solution design'
      }
    ];
  }

  private generateProcessQuestions(process: any): ClarificationQuestion[] {
    return [
      {
        id: `process-${uuidv4()}`,
        question: `For the ${process.name} process, how many people are typically involved?`,
        type: 'choice',
        category: 'requirements',
        options: ['1 person', '2-5 people', '6-15 people', '15+ people'],
        importance: 'high',
        context: 'Determines concurrent processing and collaboration requirements'
      }
    ];
  }

  private generateIntegrationQuestions(integration: any): ClarificationQuestion[] {
    return [
      {
        id: `integration-${uuidv4()}`,
        question: `Do you have admin access to ${integration.name}?`,
        type: 'boolean',
        category: 'constraints',
        importance: 'critical',
        context: 'Required for integration setup and configuration'
      }
    ];
  }

  private getBusinessContextQuestions(): ClarificationQuestion[] {
    return this.questionTemplates.get('business_context') || [];
  }

  // =================== PUBLIC ACCESS METHODS ===================

  public getSession(sessionId: string): ClarificationSession | undefined {
    return this.sessionCache.get(sessionId);
  }

  public pauseSession(sessionId: string): boolean {
    const session = this.sessionCache.get(sessionId);
    if (session && session.status === 'active') {
      session.status = 'paused';
      session.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  public resumeSession(sessionId: string): boolean {
    const session = this.sessionCache.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'active';
      session.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  public getActiveSessions(userId: string): ClarificationSession[] {
    return Array.from(this.sessionCache.values())
      .filter(session => session.user_id === userId && session.status === 'active');
  }

  public clearCache(): void {
    this.sessionCache.clear();
    this.userBehaviorCache.clear();
    console.log('🧹 Clarification cache cleared');
  }
}

// Create singleton instance
const clarificationEngine = new ClarificationEngine();
export default clarificationEngine;