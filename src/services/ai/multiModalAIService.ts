/**
 * Multi-Modal AI Service - Phase 5: Advanced AI & Autonomous Learning
 * Handles text, image, audio, and video processing with multiple AI models
 */

import { createClient } from '@supabase/supabase-js';
import { multiModelReasoningService } from './multiModelReasoningService';

interface MultiModalRequest {
  id: string;
  agent_id: string;
  input_type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
  input_data: {
    text?: string;
    image_url?: string;
    audio_url?: string;
    video_url?: string;
    metadata?: Record<string, any>;
  };
  processing_options: {
    models: string[];
    tasks: string[];
    quality: 'fast' | 'balanced' | 'high';
    output_format: string[];
  };
  created_at: string;
}

interface MultiModalResponse {
  request_id: string;
  agent_id: string;
  processing_time_ms: number;
  results: {
    text_analysis?: any;
    image_analysis?: any;
    audio_transcription?: any;
    video_analysis?: any;
    combined_insights?: any;
  };
  confidence_scores: Record<string, number>;
  processing_cost: number;
  status: 'completed' | 'failed' | 'partial';
  error_details?: string;
}

export class MultiModalAIService {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );

  /**
   * Process multi-modal input with AI models
   */
  public async processMultiModal(request: Omit<MultiModalRequest, 'id' | 'created_at'>): Promise<MultiModalResponse> {
    const requestId = `mm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Store request in database
      await this.supabase
        .from('multimodal_requests')
        .insert([{
          id: requestId,
          ...request,
          created_at: new Date().toISOString()
        }]);

      // Process different modalities
      const results: any = {};
      const confidenceScores: Record<string, number> = {};
      let totalCost = 0;

      // Text processing
      if (request.input_data.text) {
        const textResult = await this.processText(request.input_data.text, request.processing_options);
        results.text_analysis = textResult.analysis;
        confidenceScores.text = textResult.confidence;
        totalCost += textResult.cost;
      }

      // Image processing
      if (request.input_data.image_url) {
        const imageResult = await this.processImage(request.input_data.image_url, request.processing_options);
        results.image_analysis = imageResult.analysis;
        confidenceScores.image = imageResult.confidence;
        totalCost += imageResult.cost;
      }

      // Audio processing
      if (request.input_data.audio_url) {
        const audioResult = await this.processAudio(request.input_data.audio_url, request.processing_options);
        results.audio_transcription = audioResult.transcription;
        results.audio_analysis = audioResult.analysis;
        confidenceScores.audio = audioResult.confidence;
        totalCost += audioResult.cost;
      }

      // Video processing
      if (request.input_data.video_url) {
        const videoResult = await this.processVideo(request.input_data.video_url, request.processing_options);
        results.video_analysis = videoResult.analysis;
        confidenceScores.video = videoResult.confidence;
        totalCost += videoResult.cost;
      }

      // Combined insights using multi-model reasoning
      if (Object.keys(results).length > 1) {
        results.combined_insights = await this.generateCombinedInsights(results, request.processing_options);
        confidenceScores.combined = 0.85; // High confidence for combined analysis
      }

      const processingTime = Date.now() - startTime;
      const response: MultiModalResponse = {
        request_id: requestId,
        agent_id: request.agent_id,
        processing_time_ms: processingTime,
        results,
        confidence_scores: confidenceScores,
        processing_cost: totalCost,
        status: 'completed'
      };

      // Store response in database
      await this.supabase
        .from('multimodal_responses')
        .insert([{
          id: requestId,
          ...response,
          created_at: new Date().toISOString()
        }]);

      return response;

    } catch (error) {
      console.error('Multi-modal processing failed:', error);
      
      const errorResponse: MultiModalResponse = {
        request_id: requestId,
        agent_id: request.agent_id,
        processing_time_ms: Date.now() - startTime,
        results: {},
        confidence_scores: {},
        processing_cost: 0,
        status: 'failed',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      };

      await this.supabase
        .from('multimodal_responses')
        .insert([{
          id: requestId,
          ...errorResponse,
          created_at: new Date().toISOString()
        }]);

      return errorResponse;
    }
  }

  private async processText(text: string, options: MultiModalRequest['processing_options']) {
    const analysis = await multiModelReasoningService.reasonWithConsensus(
      `Analyze this text comprehensively: "${text}"
      
      Provide insights on:
      1. Sentiment and emotional tone
      2. Key topics and themes
      3. Intent and purpose
      4. Language patterns
      5. Actionable recommendations
      
      Format as structured JSON.`,
      {
        requiredCapabilities: ['reasoning', 'analysis'],
        minConsensus: 0.8,
        modelIds: options.quality === 'fast' ? ['claude-3-5-haiku-20241022'] : ['claude-opus-4-20250514', 'gpt-4.1-2025-04-14']
      }
    );

    return {
      analysis: analysis.finalAnswer,
      confidence: analysis.confidence,
      cost: 0.02 // Estimated cost
    };
  }

  private async processImage(imageUrl: string, options: MultiModalRequest['processing_options']) {
    const analysis = await multiModelReasoningService.reasonWithConsensus(
      `Analyze this image in detail: ${imageUrl}
      
      Provide comprehensive analysis including:
      1. Visual description and composition
      2. Objects, people, and scenes identified
      3. Colors, lighting, and artistic elements
      4. Context and potential meaning
      5. Quality and technical aspects
      
      Format as structured JSON.`,
      {
        requiredCapabilities: ['vision', 'analysis'],
        minConsensus: 0.7,
        modelIds: options.quality === 'fast' ? ['claude-3-5-haiku-20241022'] : ['claude-opus-4-20250514', 'gpt-4.1-2025-04-14']
      }
    );

    return {
      analysis: analysis.finalAnswer,
      confidence: analysis.confidence,
      cost: 0.05 // Higher cost for image analysis
    };
  }

  private async processAudio(audioUrl: string, options: MultiModalRequest['processing_options']) {
    // Call Supabase Edge Function for audio processing
    const { data, error } = await this.supabase.functions.invoke('audio-processing', {
      body: {
        audio_url: audioUrl,
        tasks: options.tasks,
        quality: options.quality
      }
    });

    if (error) throw error;

    return {
      transcription: data.transcription,
      analysis: data.analysis,
      confidence: data.confidence,
      cost: 0.03
    };
  }

  private async processVideo(videoUrl: string, options: MultiModalRequest['processing_options']) {
    // Call Supabase Edge Function for video processing
    const { data, error } = await this.supabase.functions.invoke('video-analysis', {
      body: {
        video_url: videoUrl,
        tasks: options.tasks,
        quality: options.quality
      }
    });

    if (error) throw error;

    return {
      analysis: data.analysis,
      confidence: data.confidence,
      cost: 0.08 // Highest cost for video analysis
    };
  }

  private async generateCombinedInsights(results: any, _options: MultiModalRequest['processing_options']) {
    const combinedPrompt = `
      Analyze these multi-modal results and provide unified insights:
      
      ${JSON.stringify(results, null, 2)}
      
      Provide:
      1. Cross-modal correlations and patterns
      2. Unified interpretation and meaning
      3. Confidence assessment across modalities
      4. Actionable insights and recommendations
      5. Potential inconsistencies or conflicts
      
      Format as comprehensive JSON analysis.
    `;

    const combined = await multiModelReasoningService.reasonWithConsensus(
      combinedPrompt,
      {
        requiredCapabilities: ['reasoning', 'analysis', 'synthesis'],
        minConsensus: 0.85,
        modelIds: ['claude-opus-4-20250514', 'gpt-4.1-2025-04-14']
      }
    );

    return combined.finalAnswer;
  }

  /**
   * Get processing history for an agent
   */
  public async getProcessingHistory(agentId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('multimodal_responses')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get analytics for multi-modal processing
   */
  public async getProcessingAnalytics(agentId?: string) {
    let query = this.supabase
      .from('multimodal_responses')
      .select('*');
    
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data, error } = await query.limit(1000);
    if (error) throw error;

    const analytics = {
      total_requests: data.length,
      success_rate: data.filter(r => r.status === 'completed').length / data.length,
      avg_processing_time: data.reduce((sum, r) => sum + r.processing_time_ms, 0) / data.length,
      total_cost: data.reduce((sum, r) => sum + r.processing_cost, 0),
      modality_breakdown: this.analyzeModalityUsage(data),
      quality_distribution: this.analyzeQualityDistribution(data)
    };

    return analytics;
  }

  private analyzeModalityUsage(data: any[]) {
    const usage = { text: 0, image: 0, audio: 0, video: 0, mixed: 0 };
    data.forEach(item => {
      const resultTypes = Object.keys(item.results || {});
      if (resultTypes.length > 1) usage.mixed++;
      else if (resultTypes.includes('text_analysis')) usage.text++;
      else if (resultTypes.includes('image_analysis')) usage.image++;
      else if (resultTypes.includes('audio_transcription')) usage.audio++;
      else if (resultTypes.includes('video_analysis')) usage.video++;
    });
    return usage;
  }

  private analyzeQualityDistribution(data: any[]) {
    const distribution = { fast: 0, balanced: 0, high: 0 };
    // This would need to be stored in the request data
    data.forEach(_item => {
      distribution.balanced++; // Default assumption
    });
    return distribution;
  }
}

export const multiModalAIService = new MultiModalAIService();