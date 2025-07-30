/**
 * Enhanced Einstein Engine - Phase 1 Critical Fix
 * Addresses Gemini API issues and provides robust fallbacks
 */

import { aiService } from '../aiService';
import { EinsteinIntentAnalysis, einsteinIntentEngine } from './einsteinIntentEngine';

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

class EnhancedEinsteinEngine {
  private geminiConfig: GeminiConfig;
  private retryCount = 3;

  constructor() {
    this.geminiConfig = {
      apiKey: this.getGeminiApiKey(),
      model: 'gemini-1.5-pro-002',
      temperature: 0.3,
      maxTokens: 8192
    };
    
    console.log('🧠 Enhanced Einstein Engine initialized with Gemini Pro');
  }

  /**
   * Enhanced intent analysis with proper Gemini integration
   */
  async analyzeUserIntent(userInput: string): Promise<EinsteinIntentAnalysis> {
    console.log('🔍 Enhanced Einstein analyzing intent:', userInput.substring(0, 50) + '...');

    // Try Gemini API first with proper error handling
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const analysis = await this.performGeminiAnalysis(userInput);
        if (analysis) {
          console.log(`✅ Gemini analysis successful on attempt ${attempt}`);
          return analysis;
        }
      } catch (error: any) {
        console.warn(`⚠️ Gemini attempt ${attempt} failed:`, error?.message || error);
        
        if (attempt === this.retryCount) {
          console.log('🔄 Using enhanced fallback analysis');
          return this.performEnhancedFallbackAnalysis(userInput);
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return this.performEnhancedFallbackAnalysis(userInput);
  }

  /**
   * Perform analysis using Gemini API with structured prompting
   */
  private async performGeminiAnalysis(userInput: string): Promise<EinsteinIntentAnalysis> {
    if (!this.geminiConfig.apiKey || this.geminiConfig.apiKey === 'your_gemini_api_key') {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = this.createAnalysisPrompt();
    const userPrompt = this.createUserPrompt(userInput);

    try {
      const response = await aiService.generateWithGemini(userPrompt, {
        modelId: this.geminiConfig.model,
        temperature: this.geminiConfig.temperature,
        maxOutputTokens: this.geminiConfig.maxTokens,
        system: systemPrompt
      });

      return this.parseGeminiResponse(response, userInput);
    } catch (error: any) {
      if (error?.message?.includes('quota') || error?.message?.includes('429')) {
        throw new Error('Gemini API quota exceeded');
      }
      if (error?.message?.includes('auth') || error?.message?.includes('401')) {
        throw new Error('Gemini API authentication failed');
      }
      throw error;
    }
  }

  /**
   * Enhanced fallback analysis using local intelligence
   */
  private async performEnhancedFallbackAnalysis(userInput: string): Promise<EinsteinIntentAnalysis> {
    console.log('🤖 Performing enhanced local analysis');
    
    // Use existing Einstein engine as base
    const baseAnalysis = await einsteinIntentEngine.analyzeUserIntent(userInput);
    
    // Enhance with pattern matching and heuristics
    const enhancedAnalysis = this.enhanceLocalAnalysis(baseAnalysis, userInput);
    
    return enhancedAnalysis;
  }

  /**
   * Create structured analysis prompt for Gemini
   */
  private createAnalysisPrompt(): string {
    return `You are Einstein-level AI architect analyzing business automation requirements. 

Your task: Analyze user input to generate comprehensive blueprint for AI agent automation system.

Output MUST be valid JSON with this exact structure:
{
  "user_intent_summary": "Clear summary of what user wants to achieve",
  "business_context": {
    "industry": "detected industry",
    "company_size": "startup|small|medium|enterprise",
    "technical_expertise": "basic|intermediate|advanced",
    "budget_range": "500_2000|2000_10000|10000_50000|50000_plus",
    "urgency": "low|medium|high|critical",
    "compliance_requirements": ["list of requirements"]
  },
  "extracted_goals": ["goal1", "goal2"],
  "success_metrics": ["metric1", "metric2"],
  "identified_processes": [{
    "id": "unique_id",
    "name": "process name",
    "description": "detailed description",
    "current_state": "manual|semi_automated|automated",
    "pain_points": ["pain1", "pain2"],
    "desired_outcome": "what success looks like",
    "frequency": "real-time|hourly|daily|weekly|monthly",
    "complexity_score": 1-10,
    "automation_potential": 0.0-1.0,
    "required_integrations": ["tool1", "tool2"],
    "data_sources": ["source1"],
    "outputs": ["output1"],
    "stakeholders": ["role1"]
  }],
  "suggested_agents": [{
    "id": "agent_id",
    "name": "Agent Name",
    "persona": "personality description",
    "primary_role": "main responsibility",
    "capabilities": ["capability1", "capability2"],
    "personality_traits": ["trait1", "trait2"],
    "decision_authority": "low|medium|high",
    "communication_style": "description",
    "specialization": "area of expertise",
    "required_tools": ["tool1", "tool2"],
    "performance_metrics": ["metric1"],
    "escalation_triggers": ["trigger1"]
  }],
  "complexity_assessment": {
    "overall_score": 1-10,
    "technical_complexity": 1-10,
    "business_complexity": 1-10,
    "integration_complexity": 1-10,
    "reasoning": "explanation"
  },
  "cost_prediction": {
    "estimated_monthly_cost": 100,
    "cost_breakdown": {
      "ai_models": 70,
      "integrations": 20,
      "infrastructure": 10,
      "support": 0
    },
    "confidence_level": 0.0-1.0,
    "assumptions": ["assumption1"]
  },
  "required_integrations": [{
    "integration_type": "api|webhook|database|file_system|real_time",
    "service_name": "service name",
    "complexity": "low|medium|high",
    "estimated_setup_time": 30,
    "cost_impact": "low|medium|high"
  }],
  "confidence_score": 0.0-1.0
}

Be thorough, accurate, and practical. Focus on real business value.`;
  }

  /**
   * Create user-specific prompt
   */
  private createUserPrompt(userInput: string): string {
    return `Analyze this business automation requirement:

"${userInput}"

Provide comprehensive analysis as JSON following the exact structure specified in system prompt.`;
  }

  /**
   * Parse Gemini response into structured analysis
   */
  private parseGeminiResponse(response: string, userInput: string): EinsteinIntentAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and complete required fields
      return this.validateAndCompleteAnalysis(parsed, userInput);
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error('Invalid response format from Gemini');
    }
  }

  /**
   * Validate and complete analysis structure
   */
  private validateAndCompleteAnalysis(parsed: any, userInput: string): EinsteinIntentAnalysis {
    const timestamp = new Date().toISOString();
    
    return {
      user_intent_summary: parsed.user_intent_summary || `User wants to: ${userInput}`,
      business_context: {
        industry: parsed.business_context?.industry || 'general',
        company_size: parsed.business_context?.company_size || 'small',
        technical_expertise: parsed.business_context?.technical_expertise || 'basic',
        budget_range: parsed.business_context?.budget_range || '2000_10000',
        urgency: parsed.business_context?.urgency || 'medium',
        compliance_requirements: parsed.business_context?.compliance_requirements || []
      },
      extracted_goals: parsed.extracted_goals || [userInput],
      success_metrics: parsed.success_metrics || ['Automation success', 'Time savings'],
      identified_processes: parsed.identified_processes || [],
      suggested_agents: parsed.suggested_agents || [],
      process_dependencies: [],
      agent_collaboration_patterns: [],
      required_integrations: parsed.required_integrations || [],
      complexity_assessment: parsed.complexity_assessment || {
        overall_score: 5,
        technical_complexity: 5,
        business_complexity: 5,
        integration_complexity: 5,
        reasoning: 'Moderate complexity assessment'
      },
      cost_prediction: parsed.cost_prediction || {
        estimated_monthly_cost: 150,
        cost_breakdown: { ai_models: 100, integrations: 30, infrastructure: 15, support: 5 },
        confidence_level: 0.7,
        assumptions: ['Standard usage patterns']
      },
      risk_factors: [],
      clarification_questions: [],
      recommended_approach: {
        implementation_phases: [],
        pilot_suggestions: []
      },
      confidence_score: parsed.confidence_score || 0.8,
      analysis_timestamp: timestamp
    };
  }

  /**
   * Enhance local analysis with pattern matching
   */
  private enhanceLocalAnalysis(baseAnalysis: EinsteinIntentAnalysis, userInput: string): EinsteinIntentAnalysis {
    const enhanced = { ...baseAnalysis };

    // Enhance based on detected patterns
    const patterns = this.detectPatterns(userInput);
    
    if (patterns.ecommerce) {
      enhanced.suggested_agents.push({
        id: 'ecommerce_agent',
        name: 'E-commerce Assistant',
        persona: 'Sales and customer service expert',
        primary_role: 'Handle e-commerce operations',
        capabilities: ['order processing', 'customer support', 'inventory management'],
        personality_traits: ['helpful', 'efficient', 'customer-focused'],
        decision_authority: 'medium',
        communication_style: 'friendly and professional',
        specialization: 'E-commerce automation',
        required_tools: ['Shopify API', 'payment processors', 'email services'],
        performance_metrics: ['Order processing time', 'Customer satisfaction'],
        escalation_triggers: ['Payment issues', 'Complex customer requests']
      });
    }

    if (patterns.crm) {
      enhanced.required_integrations.push({
        integration_type: 'api',
        service_name: 'CRM System',
        complexity: 'medium',
        estimated_setup_time: 45,
        cost_impact: 'medium'
      });
    }

    // Improve confidence if we detected known patterns
    if (patterns.ecommerce || patterns.crm || patterns.support) {
      enhanced.confidence_score = Math.min(enhanced.confidence_score + 0.2, 1.0);
    }

    return enhanced;
  }

  /**
   * Detect common business patterns
   */
  private detectPatterns(userInput: string): Record<string, boolean> {
    const input = userInput.toLowerCase();
    
    return {
      ecommerce: /shop|store|order|product|inventory|customer|sale/.test(input),
      crm: /customer|lead|contact|sales|pipeline|opportunity/.test(input),
      support: /support|ticket|help|issue|problem|resolve/.test(input),
      marketing: /marketing|campaign|email|social|content|seo/.test(input),
      finance: /invoice|payment|accounting|expense|budget|financial/.test(input),
      hr: /employee|hr|human|resource|payroll|hiring|onboard/.test(input)
    };
  }

  /**
   * Get Gemini API key with proper validation
   */
  private getGeminiApiKey(): string {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      console.warn('⚠️ Gemini API key not configured - using fallback mode');
      return '';
    }
    
    return apiKey;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for Gemini integration
   */
  async checkGeminiHealth(): Promise<boolean> {
    try {
      if (!this.geminiConfig.apiKey) return false;
      
      const response = await aiService.generateWithGemini('Health check', {
        modelId: 'gemini-flash',
        maxOutputTokens: 10
      });
      
      return response.length > 0;
    } catch (error) {
      console.error('Gemini health check failed:', error);
      return false;
    }
  }
}

export const enhancedEinsteinEngine = new EnhancedEinsteinEngine();