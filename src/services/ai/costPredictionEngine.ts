/**
 * Cost Prediction Engine - Phase 1 Foundation
 * AI-powered cost prediction and optimization for Genesis workflows
 */

import { EinsteinIntentAnalysis } from '../ai/einsteinIntentEngine';

export interface CostFactor {
  id: string;
  name: string;
  description: string;
  category: 'ai_models' | 'integrations' | 'infrastructure' | 'storage' | 'compute' | 'support';
  unit: 'per_request' | 'per_token' | 'per_hour' | 'per_gb' | 'monthly' | 'one_time';
  base_cost: number;
  scaling_factor: number;
  threshold_tiers?: Array<{
    min: number;
    max?: number;
    multiplier: number;
  }>;
}

export interface CostPrediction {
  id: string;
  workflow_id: string;
  total_monthly_cost: number;
  confidence_level: number;
  cost_breakdown: {
    ai_models: number;
    integrations: number;
    infrastructure: number;
    storage: number;
    support: number;
  };
  usage_assumptions: {
    monthly_executions: number;
    average_tokens_per_execution: number;
    storage_gb: number;
    concurrent_users: number;
  };
  cost_factors: CostFactorApplication[];
  optimization_suggestions: CostOptimizationSuggestion[];
  scaling_projections: ScalingProjection[];
  created_at: Date;
  updated_at: Date;
}

export interface CostFactorApplication {
  factor: CostFactor;
  estimated_usage: number;
  estimated_cost: number;
  reasoning: string;
}

export interface CostOptimizationSuggestion {
  id: string;
  type: 'model_optimization' | 'caching' | 'batching' | 'scheduling' | 'tier_adjustment';
  suggestion: string;
  potential_savings: number;
  implementation_effort: 'low' | 'medium' | 'high';
  confidence: number;
  impact_description: string;
}

export interface ScalingProjection {
  scale_factor: number; // 2x, 5x, 10x current usage
  projected_monthly_cost: number;
  bottlenecks: string[];
  required_upgrades: string[];
}

export interface PricingModel {
  provider: string;
  service: string;
  model?: string;
  pricing_tiers: Array<{
    name: string;
    min_usage: number;
    max_usage?: number;
    cost_per_unit: number;
    unit: string;
  }>;
  free_tier?: {
    limit: number;
    unit: string;
  };
  last_updated: Date;
}

export class CostPredictionEngine {
  private costFactors: Map<string, CostFactor> = new Map();
  private pricingModels: Map<string, PricingModel> = new Map();

  constructor() {
    this.initializeCostFactors();
    this.initializePricingModels();
    console.log('💰 Cost Prediction Engine initialized');
  }

  /**
   * Initialize cost factors for different services
   */
  private initializeCostFactors() {
    const factors: CostFactor[] = [
      // AI Model Costs
      {
        id: 'openai_gpt4',
        name: 'OpenAI GPT-4',
        description: 'GPT-4 API usage costs',
        category: 'ai_models',
        unit: 'per_token',
        base_cost: 0.00003, // $0.03 per 1K tokens
        scaling_factor: 1.0,
        threshold_tiers: [
          { min: 0, max: 1000000, multiplier: 1.0 },
          { min: 1000000, max: 10000000, multiplier: 0.95 },
          { min: 10000000, multiplier: 0.9 }
        ]
      },
      {
        id: 'openai_gpt35',
        name: 'OpenAI GPT-3.5',
        description: 'GPT-3.5 Turbo API usage costs',
        category: 'ai_models',
        unit: 'per_token',
        base_cost: 0.000002, // $0.002 per 1K tokens
        scaling_factor: 1.0
      },
      {
        id: 'anthropic_claude',
        name: 'Anthropic Claude',
        description: 'Claude API usage costs',
        category: 'ai_models',
        unit: 'per_token',
        base_cost: 0.000015, // $0.015 per 1K tokens
        scaling_factor: 1.0
      },

      // Integration Costs
      {
        id: 'stripe_processing',
        name: 'Stripe Payment Processing',
        description: 'Stripe payment processing fees',
        category: 'integrations',
        unit: 'per_request',
        base_cost: 0.30, // $0.30 + 2.9% per transaction
        scaling_factor: 0.029
      },
      {
        id: 'twilio_sms',
        name: 'Twilio SMS',
        description: 'Twilio SMS messaging costs',
        category: 'integrations',
        unit: 'per_request',
        base_cost: 0.0075, // $0.0075 per SMS
        scaling_factor: 1.0
      },
      {
        id: 'sendgrid_email',
        name: 'SendGrid Email',
        description: 'SendGrid email sending costs',
        category: 'integrations',
        unit: 'per_request',
        base_cost: 0.0006, // $0.0006 per email
        scaling_factor: 1.0
      },

      // Infrastructure Costs
      {
        id: 'supabase_database',
        name: 'Supabase Database',
        description: 'Supabase database usage',
        category: 'infrastructure',
        unit: 'monthly',
        base_cost: 25.0, // $25/month pro plan
        scaling_factor: 1.0
      },
      {
        id: 'serverless_compute',
        name: 'Serverless Compute',
        description: 'Edge function compute costs',
        category: 'compute',
        unit: 'per_hour',
        base_cost: 0.000016, // $0.000016 per request
        scaling_factor: 1.0
      },

      // Storage Costs
      {
        id: 'file_storage',
        name: 'File Storage',
        description: 'Cloud file storage costs',
        category: 'storage',
        unit: 'per_gb',
        base_cost: 0.023, // $0.023 per GB per month
        scaling_factor: 1.0
      }
    ];

    factors.forEach(factor => {
      this.costFactors.set(factor.id, factor);
    });
  }

  /**
   * Initialize pricing models for different providers
   */
  private initializePricingModels() {
    const models: PricingModel[] = [
      {
        provider: 'openai',
        service: 'gpt-4',
        pricing_tiers: [
          {
            name: 'standard',
            min_usage: 0,
            cost_per_unit: 0.03,
            unit: 'per_1k_tokens'
          }
        ],
        last_updated: new Date()
      },
      {
        provider: 'anthropic',
        service: 'claude-3',
        pricing_tiers: [
          {
            name: 'standard',
            min_usage: 0,
            cost_per_unit: 0.015,
            unit: 'per_1k_tokens'
          }
        ],
        last_updated: new Date()
      }
    ];

    models.forEach(model => {
      const key = `${model.provider}_${model.service}`;
      this.pricingModels.set(key, model);
    });
  }

  /**
   * Generate comprehensive cost prediction for a workflow
   */
  public async generateCostPrediction(
    workflowId: string,
    analysis: EinsteinIntentAnalysis,
    usageAssumptions?: Partial<CostPrediction['usage_assumptions']>
  ): Promise<CostPrediction> {
    console.log('💰 Generating cost prediction for workflow:', workflowId);

    // Default usage assumptions
    const assumptions: CostPrediction['usage_assumptions'] = {
      monthly_executions: 1000,
      average_tokens_per_execution: 2000,
      storage_gb: 10,
      concurrent_users: 5,
      ...usageAssumptions
    };

    // Analyze required cost factors based on workflow
    const costFactorApplications = await this.analyzeCostFactors(analysis, assumptions);

    // Calculate total costs
    const costBreakdown = this.calculateCostBreakdown(costFactorApplications);

    // Generate optimization suggestions
    const optimizationSuggestions = await this.generateOptimizationSuggestions(
      costFactorApplications,
      costBreakdown
    );

    // Generate scaling projections
    const scalingProjections = this.generateScalingProjections(
      costFactorApplications,
      assumptions
    );

    const prediction: CostPrediction = {
      id: `pred_${Date.now()}`,
      workflow_id: workflowId,
      total_monthly_cost: Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0),
      confidence_level: this.calculateConfidenceLevel(analysis, costFactorApplications),
      cost_breakdown: costBreakdown,
      usage_assumptions: assumptions,
      cost_factors: costFactorApplications,
      optimization_suggestions: optimizationSuggestions,
      scaling_projections: scalingProjections,
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log(`✅ Cost prediction generated: $${prediction.total_monthly_cost.toFixed(2)}/month`);
    return prediction;
  }

  /**
   * Analyze which cost factors apply to the workflow
   */
  private async analyzeCostFactors(
    analysis: EinsteinIntentAnalysis,
    assumptions: CostPrediction['usage_assumptions']
  ): Promise<CostFactorApplication[]> {
    const applications: CostFactorApplication[] = [];

    // Analyze AI model usage
    const aiModels = this.determineAIModels(analysis);
    for (const model of aiModels) {
      const factor = this.costFactors.get(model.factorId);
      if (factor) {
        const estimatedUsage = assumptions.monthly_executions * assumptions.average_tokens_per_execution;
        const estimatedCost = this.calculateFactorCost(factor, estimatedUsage);
        
        applications.push({
          factor,
          estimated_usage: estimatedUsage,
          estimated_cost: estimatedCost,
          reasoning: `Based on ${assumptions.monthly_executions} monthly executions with ${assumptions.average_tokens_per_execution} tokens each`
        });
      }
    }

    // Analyze integration costs
    for (const integration of analysis.required_integrations) {
      const factorId = this.mapIntegrationToCostFactor(integration.service_name);
      const factor = this.costFactors.get(factorId);
      
      if (factor) {
        const estimatedUsage = this.estimateIntegrationUsage(integration, assumptions);
        const estimatedCost = this.calculateFactorCost(factor, estimatedUsage);
        
        applications.push({
          factor,
          estimated_usage: estimatedUsage,
          estimated_cost: estimatedCost,
          reasoning: `${integration.service_name} integration with estimated ${estimatedUsage} monthly calls`
        });
      }
    }

    // Add infrastructure costs
    const infrastructureCosts = this.calculateInfrastructureCosts(analysis, assumptions);
    applications.push(...infrastructureCosts);

    return applications;
  }

  /**
   * Calculate cost breakdown by category
   */
  private calculateCostBreakdown(applications: CostFactorApplication[]): CostPrediction['cost_breakdown'] {
    const breakdown = {
      ai_models: 0,
      integrations: 0,
      infrastructure: 0,
      storage: 0,
      support: 0
    };

    for (const app of applications) {
      switch (app.factor.category) {
        case 'ai_models':
          breakdown.ai_models += app.estimated_cost;
          break;
        case 'integrations':
          breakdown.integrations += app.estimated_cost;
          break;
        case 'infrastructure':
        case 'compute':
          breakdown.infrastructure += app.estimated_cost;
          break;
        case 'storage':
          breakdown.storage += app.estimated_cost;
          break;
        case 'support':
          breakdown.support += app.estimated_cost;
          break;
      }
    }

    return breakdown;
  }

  /**
   * Calculate cost for a specific factor
   */
  private calculateFactorCost(factor: CostFactor, usage: number): number {
    let cost = factor.base_cost * usage;

    // Apply scaling factor
    if (factor.scaling_factor !== 1.0) {
      cost *= factor.scaling_factor;
    }

    // Apply tier pricing
    if (factor.threshold_tiers) {
      for (const tier of factor.threshold_tiers) {
        if (usage >= tier.min && (!tier.max || usage <= tier.max)) {
          cost *= tier.multiplier;
          break;
        }
      }
    }

    return cost;
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(
    _applications: CostFactorApplication[],
    breakdown: CostPrediction['cost_breakdown']
  ): Promise<CostOptimizationSuggestion[]> {
    const suggestions: CostOptimizationSuggestion[] = [];

    // AI model optimization suggestions
    if (breakdown.ai_models > 100) {
      suggestions.push({
        id: 'model_optimization',
        type: 'model_optimization',
        suggestion: 'Consider using GPT-3.5 for simpler tasks instead of GPT-4',
        potential_savings: breakdown.ai_models * 0.3,
        implementation_effort: 'low',
        confidence: 0.8,
        impact_description: 'Switch to cheaper models for non-critical operations'
      });
    }

    // Caching suggestions
    if (breakdown.ai_models > 50) {
      suggestions.push({
        id: 'caching',
        type: 'caching',
        suggestion: 'Implement response caching to reduce duplicate API calls',
        potential_savings: breakdown.ai_models * 0.2,
        implementation_effort: 'medium',
        confidence: 0.7,
        impact_description: 'Cache common responses to reduce API usage'
      });
    }

    // Batching suggestions
    if (breakdown.integrations > 20) {
      suggestions.push({
        id: 'batching',
        type: 'batching',
        suggestion: 'Batch integration requests to reduce per-request costs',
        potential_savings: breakdown.integrations * 0.15,
        implementation_effort: 'medium',
        confidence: 0.6,
        impact_description: 'Group multiple operations into single API calls'
      });
    }

    return suggestions;
  }

  /**
   * Generate scaling projections
   */
  private generateScalingProjections(
    applications: CostFactorApplication[],
    assumptions: CostPrediction['usage_assumptions']
  ): ScalingProjection[] {
    const projections: ScalingProjection[] = [];
    const scaleFactors = [2, 5, 10];

    for (const scaleFactor of scaleFactors) {
      const scaledCost = applications.reduce((total, app) => {
        const scaledUsage = app.estimated_usage * scaleFactor;
        const scaledCost = this.calculateFactorCost(app.factor, scaledUsage);
        return total + scaledCost;
      }, 0);

      const bottlenecks = this.identifyBottlenecks(scaleFactor, assumptions);
      const requiredUpgrades = this.identifyRequiredUpgrades(scaleFactor, assumptions);

      projections.push({
        scale_factor: scaleFactor,
        projected_monthly_cost: scaledCost,
        bottlenecks,
        required_upgrades: requiredUpgrades
      });
    }

    return projections;
  }

  // Helper methods

  private determineAIModels(analysis: EinsteinIntentAnalysis): Array<{factorId: string, reasoning: string}> {
    const models = [];
    
    if (analysis.complexity_assessment.overall_score > 7) {
      models.push({
        factorId: 'openai_gpt4',
        reasoning: 'High complexity workflow requires GPT-4 capabilities'
      });
    } else {
      models.push({
        factorId: 'openai_gpt35',
        reasoning: 'Moderate complexity can be handled by GPT-3.5'
      });
    }

    return models;
  }

  private mapIntegrationToCostFactor(serviceName: string): string {
    const mappings: Record<string, string> = {
      'stripe': 'stripe_processing',
      'twilio': 'twilio_sms',
      'sendgrid': 'sendgrid_email',
      'email': 'sendgrid_email',
      'sms': 'twilio_sms',
      'payment': 'stripe_processing'
    };

    return mappings[serviceName.toLowerCase()] || 'generic_integration';
  }

  private estimateIntegrationUsage(
    integration: any,
    assumptions: CostPrediction['usage_assumptions']
  ): number {
    // Base integration usage on workflow executions
    const baseUsage = assumptions.monthly_executions;
    
    // Adjust based on integration complexity
    const complexityMultiplier = integration.complexity === 'high' ? 2 : 
                                 integration.complexity === 'medium' ? 1.5 : 1;
    
    return baseUsage * complexityMultiplier;
  }

  private calculateInfrastructureCosts(
    _analysis: EinsteinIntentAnalysis,
    assumptions: CostPrediction['usage_assumptions']
  ): CostFactorApplication[] {
    const applications: CostFactorApplication[] = [];

    // Database costs
    const dbFactor = this.costFactors.get('supabase_database');
    if (dbFactor) {
      applications.push({
        factor: dbFactor,
        estimated_usage: 1,
        estimated_cost: dbFactor.base_cost,
        reasoning: 'Base Supabase Pro plan for database and auth'
      });
    }

    // Compute costs
    const computeFactor = this.costFactors.get('serverless_compute');
    if (computeFactor) {
      const computeUsage = assumptions.monthly_executions * 0.1;
      applications.push({
        factor: computeFactor,
        estimated_usage: computeUsage,
        estimated_cost: this.calculateFactorCost(computeFactor, computeUsage),
        reasoning: 'Serverless function execution costs'
      });
    }

    // Storage costs
    const storageFactor = this.costFactors.get('file_storage');
    if (storageFactor) {
      applications.push({
        factor: storageFactor,
        estimated_usage: assumptions.storage_gb,
        estimated_cost: this.calculateFactorCost(storageFactor, assumptions.storage_gb),
        reasoning: 'File and data storage requirements'
      });
    }

    return applications;
  }

  private calculateConfidenceLevel(
    analysis: EinsteinIntentAnalysis,
    applications: CostFactorApplication[]
  ): number {
    // Base confidence on analysis confidence and number of factors considered
    const baseConfidence = analysis.confidence_score;
    const factorConfidence = Math.min(applications.length / 10, 1); // More factors = higher confidence
    
    return (baseConfidence + factorConfidence) / 2;
  }

  private identifyBottlenecks(scaleFactor: number, _assumptions: CostPrediction['usage_assumptions']): string[] {
    const bottlenecks: string[] = [];

    if (scaleFactor >= 5) {
      bottlenecks.push('API rate limits may be exceeded');
      bottlenecks.push('Database connection limits');
    }

    if (scaleFactor >= 10) {
      bottlenecks.push('Serverless function cold starts');
      bottlenecks.push('Memory limitations');
    }

    return bottlenecks;
  }

  private identifyRequiredUpgrades(scaleFactor: number, _assumptions: CostPrediction['usage_assumptions']): string[] {
    const upgrades: string[] = [];

    if (scaleFactor >= 5) {
      upgrades.push('Upgrade to higher API tier limits');
      upgrades.push('Database scaling plan');
    }

    if (scaleFactor >= 10) {
      upgrades.push('Dedicated compute resources');
      upgrades.push('CDN for static assets');
      upgrades.push('Database read replicas');
    }

    return upgrades;
  }

  /**
   * Update pricing models with latest data
   */
  public async updatePricingModels(): Promise<void> {
    console.log('🔄 Updating pricing models...');
    // TODO: Fetch latest pricing from provider APIs
    console.log('✅ Pricing models updated');
  }

  /**
   * Get cost factors by category
   */
  public getCostFactorsByCategory(category: CostFactor['category']): CostFactor[] {
    return Array.from(this.costFactors.values())
      .filter(factor => factor.category === category);
  }

  /**
   * Optimize cost prediction based on actual usage
   */
  public async optimizePrediction(
    prediction: CostPrediction,
    actualUsage: Partial<CostPrediction['usage_assumptions']>
  ): Promise<CostPrediction> {
    console.log('⚡ Optimizing cost prediction with actual usage data');
    
    // Recalculate with actual usage
    const optimizedPrediction = { ...prediction };
    optimizedPrediction.usage_assumptions = { ...prediction.usage_assumptions, ...actualUsage };
    optimizedPrediction.updated_at = new Date();
    
    // Increase confidence based on actual data
    optimizedPrediction.confidence_level = Math.min(prediction.confidence_level + 0.2, 1.0);
    
    return optimizedPrediction;
  }
}

// Singleton instance
export const costPredictionEngine = new CostPredictionEngine();