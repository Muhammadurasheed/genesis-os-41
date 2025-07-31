/**
 * Blueprint Generation Service - Phase 1 Enhanced
 * Orchestrates blueprint generation with robust error handling
 */

import { enhancedEinsteinEngine } from './ai/enhancedEinsteinEngine';
import { backendIntegrationService } from './backendIntegrationService';
import { healthMonitoringService } from './healthMonitoringService';
import { EinsteinIntentAnalysis } from './ai/einsteinIntentEngine';

interface BlueprintGenerationOptions {
  includeAdvancedAnalysis?: boolean;
  includeCostPrediction?: boolean;
  includeMCPTools?: boolean;
  useBackendWhenAvailable?: boolean;
}

interface GeneratedBlueprint {
  id: string;
  analysis: EinsteinIntentAnalysis;
  generated_at: string;
  user_input: string;
  confidence_score: number;
  generation_source: 'backend' | 'frontend_enhanced' | 'frontend_fallback';
  health_status?: any;
}

class BlueprintGenerationService {
  constructor() {
    console.log('📋 Blueprint Generation Service initialized');
  }

  /**
   * Generate comprehensive blueprint with intelligent routing
   */
  async generateBlueprint(
    userInput: string, 
    options: BlueprintGenerationOptions = {}
  ): Promise<GeneratedBlueprint> {
    console.log('🎯 Generating comprehensive blueprint...');
    console.log('📝 User input:', userInput.substring(0, 100) + (userInput.length > 100 ? '...' : ''));

    const startTime = Date.now();
    
    // Check system readiness
    const readiness = await healthMonitoringService.getSystemReadiness();
    console.log('🏥 System readiness:', readiness.ready ? 'Ready' : 'Limited');

    let blueprint: GeneratedBlueprint;
    
    try {
      if (options.useBackendWhenAvailable !== false && readiness.ready) {
        blueprint = await this.generateWithBackendIntegration(userInput, options);
      } else {
        blueprint = await this.generateWithEnhancedFrontend(userInput, options);
      }
    } catch (error: any) {
      console.warn('🔄 Primary generation failed, using fallback:', error?.message);
      blueprint = await this.generateFallbackBlueprint(userInput);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Blueprint generated in ${duration}ms (${blueprint.generation_source})`);

    return blueprint;
  }

  /**
   * Generate blueprint using backend integration with proper timeout handling
   */
  private async generateWithBackendIntegration(
    userInput: string, 
    _options: BlueprintGenerationOptions
  ): Promise<GeneratedBlueprint> {
    console.log('🔗 Using backend integration for blueprint generation');

    try {
      // Set longer timeout for backend blueprint generation (3 minutes)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Backend timeout after 3 minutes')), 180000)
      );

      const resultPromise = backendIntegrationService.generateEnhancedBlueprint(userInput);
      
      const result = await Promise.race([resultPromise, timeoutPromise]) as any;
      
      if (!result.success || !result.data) {
        throw new Error('Backend integration failed');
      }

      return {
        id: `bp_${Date.now()}`,
        analysis: result.data.analysis || result.data,
        generated_at: new Date().toISOString(),
        user_input: userInput,
        confidence_score: result.data.analysis?.confidence_score || 0.8,
        generation_source: result.source === 'backend' ? 'backend' : 'frontend_enhanced'
      };
    } catch (error: any) {
      console.error('Backend integration error:', error);
      throw new Error(`Backend integration failed: ${error.message}`);
    }
  }

  /**
   * Generate blueprint using enhanced frontend engines
   */
  private async generateWithEnhancedFrontend(
    userInput: string, 
    _options: BlueprintGenerationOptions
  ): Promise<GeneratedBlueprint> {
    console.log('⚡ Using enhanced frontend generation');

    const analysis = await enhancedEinsteinEngine.analyzeUserIntent(userInput);

    return {
      id: `bp_frontend_${Date.now()}`,
      analysis,
      generated_at: new Date().toISOString(),
      user_input: userInput,
      confidence_score: analysis.confidence_score,
      generation_source: 'frontend_enhanced'
    };
  }

  /**
   * Generate basic fallback blueprint
   */
  private async generateFallbackBlueprint(userInput: string): Promise<GeneratedBlueprint> {
    console.log('🚨 Using basic fallback generation');

    const analysis: EinsteinIntentAnalysis = {
      user_intent_summary: `Fallback analysis: ${userInput}`,
      business_context: {
        industry: 'general',
        company_size: 'small',
        technical_expertise: 'basic',
        budget_range: '2000_10000',
        urgency: 'medium',
        compliance_requirements: []
      },
      extracted_goals: [userInput],
      success_metrics: ['Task completion', 'Time savings'],
      identified_processes: [{
        id: 'fallback_process',
        name: 'Primary Process',
        description: userInput,
        current_state: 'manual',
        pain_points: ['Manual work required'],
        desired_outcome: 'Automated process',
        frequency: 'daily',
        complexity_score: 5,
        automation_potential: 0.7,
        required_integrations: [],
        data_sources: [],
        outputs: [],
        stakeholders: []
      }],
      suggested_agents: [{
        id: 'fallback_agent',
        name: 'General Assistant',
        persona: 'Helpful automation assistant',
        primary_role: 'Process automation',
        capabilities: ['task execution', 'basic analysis'],
        personality_traits: ['reliable', 'efficient'],
        decision_authority: 'medium',
        communication_style: 'professional',
        specialization: 'General automation',
        required_tools: [],
        performance_metrics: ['Success rate', 'Response time'],
        escalation_triggers: ['Complex decisions', 'Errors']
      }],
      process_dependencies: [],
      agent_collaboration_patterns: [],
      required_integrations: [],
      complexity_assessment: {
        overall_score: 5,
        technical_complexity: 4,
        business_complexity: 5,
        integration_complexity: 3,
        reasoning: 'Moderate complexity with standard automation patterns'
      },
      cost_prediction: {
        estimated_monthly_cost: 120,
        cost_breakdown: { ai_models: 80, integrations: 25, infrastructure: 10, support: 5 },
        confidence_level: 0.6,
        assumptions: ['Standard usage patterns', 'Basic integrations']
      },
      risk_factors: [{
        risk: 'Limited analysis depth',
        probability: 'high',
        impact: 'medium',
        mitigation: 'Manual review and refinement'
      }],
      clarification_questions: [{
        question: 'What specific tools or systems do you currently use?',
        purpose: 'Identify integration requirements',
        impact_if_unclear: 'high'
      }],
      recommended_approach: {
        implementation_phases: [{
          phase: 'Phase 1',
          description: 'Basic automation setup',
          estimated_duration: '1-2 weeks',
          dependencies: []
        }],
        pilot_suggestions: ['Start with simple tasks', 'Test with limited scope']
      },
      confidence_score: 0.5,
      analysis_timestamp: new Date().toISOString()
    };

    return {
      id: `bp_fallback_${Date.now()}`,
      analysis,
      generated_at: new Date().toISOString(),
      user_input: userInput,
      confidence_score: 0.5,
      generation_source: 'frontend_fallback'
    };
  }

  /**
   * Validate blueprint completeness
   */
  validateBlueprint(blueprint: GeneratedBlueprint): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!blueprint.analysis) {
      errors.push('Missing analysis data');
    }

    if (!blueprint.analysis?.suggested_agents?.length) {
      warnings.push('No agents suggested');
    }

    if (!blueprint.analysis?.identified_processes?.length) {
      warnings.push('No processes identified');
    }

    if (blueprint.confidence_score < 0.5) {
      warnings.push('Low confidence score - consider manual review');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(): Promise<{
    systemHealth: any;
    capabilities: string[];
    recommendations: string[];
  }> {
    const readiness = await healthMonitoringService.getSystemReadiness();
    
    const capabilities = [
      'Einstein-level intent analysis',
      'Multi-agent system design',
      'Cost prediction',
      'Integration discovery'
    ];

    if (readiness.ready) {
      capabilities.push('Backend AI processing', 'Advanced reasoning');
    }

    return {
      systemHealth: readiness,
      capabilities,
      recommendations: readiness.recommendations
    };
  }
}

export const blueprintGenerationService = new BlueprintGenerationService();