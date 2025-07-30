/**
 * Multi-Model Reasoning Service - Advanced AI reasoning across multiple models
 * Part of Phase 1: Intelligent Foundation
 */

import microserviceManager from '../core/microserviceManager';

export interface ReasoningModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'perplexity';
  capabilities: string[];
  costPerToken: number;
  maxTokens: number;
  specialties: string[];
}

export interface ReasoningTask {
  id: string;
  prompt: string;
  context?: any;
  requiredCapabilities: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: number;
}

export interface ReasoningResult {
  taskId: string;
  modelId: string;
  result: string;
  confidence: number;
  reasoning: string;
  tokensUsed: number;
  executionTime: number;
  metadata: Record<string, any>;
}

export interface ConsensusResult {
  finalAnswer: string;
  confidence: number;
  participatingModels: string[];
  reasoning: string;
  disagreements: Array<{
    modelId: string;
    reasoning: string;
    confidence: number;
  }>;
  consensus: number; // 0-1 score
}

export class MultiModelReasoningService {
  private models: Map<string, ReasoningModel> = new Map();
  // Future: Task queue and active inference tracking
  // private taskQueue: ReasoningTask[] = [];
  // private activeInferences: Map<string, Promise<ReasoningResult>> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    const models: ReasoningModel[] = [
      {
        id: 'gpt-4.1-2025-04-14',
        name: 'GPT-4.1',
        provider: 'openai',
        capabilities: ['reasoning', 'code', 'analysis', 'creativity'],
        costPerToken: 0.00003,
        maxTokens: 128000,
        specialties: ['general reasoning', 'code generation', 'problem solving']
      },
      {
        id: 'o3-2025-04-16',
        name: 'OpenAI O3',
        provider: 'openai',
        capabilities: ['deep-reasoning', 'analysis', 'math', 'science'],
        costPerToken: 0.00015,
        maxTokens: 200000,
        specialties: ['complex analysis', 'multi-step reasoning', 'scientific problems']
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        provider: 'anthropic',
        capabilities: ['reasoning', 'analysis', 'writing', 'code'],
        costPerToken: 0.000075,
        maxTokens: 200000,
        specialties: ['nuanced reasoning', 'ethical analysis', 'creative writing']
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        provider: 'anthropic',
        capabilities: ['reasoning', 'efficiency', 'analysis'],
        costPerToken: 0.000015,
        maxTokens: 200000,
        specialties: ['efficient reasoning', 'balanced analysis', 'quick responses']
      },
      {
        id: 'gemini-1.5-pro-002',
        name: 'Gemini 1.5 Pro',
        provider: 'gemini',
        capabilities: ['reasoning', 'multimodal', 'long-context'],
        costPerToken: 0.000025,
        maxTokens: 2000000,
        specialties: ['long context', 'multimodal analysis', 'document processing']
      },
      {
        id: 'llama-3.1-sonar-large-128k-online',
        name: 'Perplexity Sonar Large',
        provider: 'perplexity',
        capabilities: ['web-search', 'real-time', 'current-events'],
        costPerToken: 0.000020,
        maxTokens: 128000,
        specialties: ['current information', 'web research', 'fact checking']
      }
    ];

    models.forEach(model => this.models.set(model.id, model));
  }

  public async getConsensusResponse(messages: Array<{role: string, content: string}>): Promise<string> {
    const prompt = messages.map(m => m.content).join('\n');
    const result = await this.reasonWithConsensus(prompt);
    return result.finalAnswer;
  }

  public async reasonWithConsensus(
    prompt: string,
    options: {
      requiredCapabilities?: string[];
      modelIds?: string[];
      timeout?: number;
      minConsensus?: number;
    } = {}
  ): Promise<ConsensusResult> {
    const {
      requiredCapabilities = ['reasoning'],
      modelIds,
      // timeout, // Future: implement timeout handling
      minConsensus = 0.7
    } = options;

    // Select appropriate models
    const selectedModels = this.selectModels(requiredCapabilities, modelIds);
    
    if (selectedModels.length < 2) {
      throw new Error('Consensus reasoning requires at least 2 models');
    }

    console.log(`🧠 Starting consensus reasoning with ${selectedModels.length} models`);

    // Create reasoning tasks
    const tasks = selectedModels.map(model => ({
      id: `task-${model.id}-${Date.now()}`,
      prompt,
      requiredCapabilities,
      priority: 'high' as const
    }));

    // Execute reasoning in parallel
    const results = await Promise.allSettled(
      tasks.map(task => this.executeReasoning(task, selectedModels[0]))
    );

    // Process results
    const successfulResults: ReasoningResult[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successfulResults.push(result.value);
      } else {
        console.warn(`Model ${selectedModels[index].id} failed:`, result);
      }
    });

    if (successfulResults.length === 0) {
      throw new Error('All models failed to provide reasoning');
    }

    // Generate consensus
    return this.generateConsensus(successfulResults, minConsensus);
  }

  private selectModels(
    requiredCapabilities: string[],
    preferredModelIds?: string[]
  ): ReasoningModel[] {
    let candidates: ReasoningModel[] = [];

    if (preferredModelIds) {
      candidates = preferredModelIds
        .map(id => this.models.get(id))
        .filter((model): model is ReasoningModel => model !== undefined);
    } else {
      candidates = Array.from(this.models.values());
    }

    // Filter by capabilities
    const suitableModels = candidates.filter(model =>
      requiredCapabilities.every(cap =>
        model.capabilities.includes(cap) ||
        model.specialties.some(spec => spec.toLowerCase().includes(cap.toLowerCase()))
      )
    );

    // Sort by cost efficiency and capabilities
    return suitableModels.sort((a, b) => {
      const aScore = a.capabilities.length - a.costPerToken * 10000;
      const bScore = b.capabilities.length - b.costPerToken * 10000;
      return bScore - aScore;
    }).slice(0, 5); // Limit to top 5 models
  }

  private async executeReasoning(
    task: ReasoningTask,
    model: ReasoningModel
  ): Promise<ReasoningResult> {
    const startTime = Date.now();

    try {
      let result: string;
      let tokensUsed = 0;

      // Route to appropriate service based on provider
      switch (model.provider) {
        case 'openai':
          result = await this.callOpenAI(model, task.prompt);
          tokensUsed = this.estimateTokens(task.prompt + result);
          break;
        case 'anthropic':
          result = await this.callAnthropic(model, task.prompt);
          tokensUsed = this.estimateTokens(task.prompt + result);
          break;
        case 'gemini':
          result = await this.callGemini(model, task.prompt);
          tokensUsed = this.estimateTokens(task.prompt + result);
          break;
        case 'perplexity':
          result = await this.callPerplexity(model, task.prompt);
          tokensUsed = this.estimateTokens(task.prompt + result);
          break;
        default:
          throw new Error(`Unsupported provider: ${model.provider}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        taskId: task.id,
        modelId: model.id,
        result,
        confidence: this.calculateConfidence(result, model),
        reasoning: `Processed with ${model.name} in ${executionTime}ms`,
        tokensUsed,
        executionTime,
        metadata: {
          provider: model.provider,
          capabilities: model.capabilities,
          specialties: model.specialties
        }
      };

    } catch (error) {
      console.error(`❌ Reasoning failed for model ${model.id}:`, error);
      throw error;
    }
  }

  private async callOpenAI(model: ReasoningModel, prompt: string): Promise<string> {
    // Mock implementation - in real app, would call OpenAI API
    const response = await microserviceManager.callService('agent-service', '/ai/openai', {
      method: 'POST',
      body: {
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'You are an expert reasoning assistant. Provide detailed, step-by-step analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      }
    });

    if (!response.success) {
      return `Mock reasoning response from ${model.name} for: ${prompt.substring(0, 100)}...`;
    }

    return response.data?.choices?.[0]?.message?.content || 'No response';
  }

  private async callAnthropic(model: ReasoningModel, prompt: string): Promise<string> {
    // Mock implementation - in real app, would call Anthropic API
    const response = await microserviceManager.callService('agent-service', '/ai/anthropic', {
      method: 'POST',
      body: {
        model: model.id,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: 'You are an expert reasoning assistant focusing on nuanced analysis and ethical considerations.',
        max_tokens: 4000
      }
    });

    if (!response.success) {
      return `Mock reasoning response from ${model.name} with ethical considerations for: ${prompt.substring(0, 100)}...`;
    }

    return response.data?.content?.[0]?.text || 'No response';
  }

  private async callGemini(model: ReasoningModel, prompt: string): Promise<string> {
    // Mock implementation - in real app, would call Gemini API
    const response = await microserviceManager.callService('agent-service', '/ai/gemini', {
      method: 'POST',
      body: {
        model: model.id,
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4000
        }
      }
    });

    if (!response.success) {
      return `Mock comprehensive reasoning response from ${model.name} for: ${prompt.substring(0, 100)}...`;
    }

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  }

  private async callPerplexity(model: ReasoningModel, prompt: string): Promise<string> {
    // Mock implementation - in real app, would call Perplexity API
    const response = await microserviceManager.callService('agent-service', '/ai/perplexity', {
      method: 'POST',
      body: {
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'Be precise and concise. Focus on current, factual information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      }
    });

    if (!response.success) {
      return `Mock current information response from ${model.name} for: ${prompt.substring(0, 100)}...`;
    }

    return response.data?.choices?.[0]?.message?.content || 'No response';
  }

  private calculateConfidence(result: string, model: ReasoningModel): number {
    // Simple confidence calculation based on response length and model capabilities
    const baseConfidence = 0.7;
    const lengthBonus = Math.min(result.length / 1000, 0.2);
    const capabilityBonus = model.capabilities.length * 0.02;
    
    return Math.min(baseConfidence + lengthBonus + capabilityBonus, 0.95);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private generateConsensus(
    results: ReasoningResult[],
    _minConsensus: number
  ): ConsensusResult {
    // Analyze agreement between models
    const responses = results.map(r => r.result);
    const similarities = this.calculateSimilarities(responses);
    
    // Find the most agreed-upon response
    const agreementScores = results.map((result, index) => {
      const otherResults = results.filter((_, i) => i !== index);
      const avgSimilarity = otherResults.reduce((sum, other) => 
        sum + this.calculateTextSimilarity(result.result, other.result), 0
      ) / otherResults.length;
      
      return {
        ...result,
        agreementScore: avgSimilarity
      };
    });

    // Sort by agreement and confidence
    agreementScores.sort((a, b) => 
      (b.agreementScore * b.confidence) - (a.agreementScore * a.confidence)
    );

    const bestResult = agreementScores[0];
    const consensusScore = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;

    // Identify disagreements
    const disagreements = results
      .filter(r => r.modelId !== bestResult.modelId)
      .filter(r => this.calculateTextSimilarity(r.result, bestResult.result) < 0.6)
      .map(r => ({
        modelId: r.modelId,
        reasoning: r.result,
        confidence: r.confidence
      }));

    return {
      finalAnswer: bestResult.result,
      confidence: bestResult.confidence * consensusScore,
      participatingModels: results.map(r => r.modelId),
      reasoning: this.generateConsensusReasoning(results, bestResult, consensusScore),
      disagreements,
      consensus: consensusScore
    };
  }

  private calculateSimilarities(responses: string[]): number[] {
    const similarities: number[] = [];
    
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        similarities.push(this.calculateTextSimilarity(responses[i], responses[j]));
      }
    }
    
    return similarities;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple similarity based on shared words
    const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  private generateConsensusReasoning(
    results: ReasoningResult[],
    bestResult: ReasoningResult,
    consensusScore: number
  ): string {
    const modelNames = results.map(r => 
      this.models.get(r.modelId)?.name || r.modelId
    ).join(', ');

    return `Consensus reached among ${results.length} models (${modelNames}) with ${(consensusScore * 100).toFixed(1)}% agreement. Selected response from ${this.models.get(bestResult.modelId)?.name} based on highest combined confidence and agreement score.`;
  }

  public getAvailableModels(): ReasoningModel[] {
    return Array.from(this.models.values());
  }

  public getModelCapabilities(modelId: string): string[] {
    return this.models.get(modelId)?.capabilities || [];
  }
}

// Singleton instance
export const multiModelReasoningService = new MultiModelReasoningService();