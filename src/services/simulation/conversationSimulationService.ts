// Phase 3 Sprint 3.3: Conversation Simulation Service
// Voice/Video Integration (Tavus + ElevenLabs) for agent testing

import {
  ConversationSimulation,
  ElevenLabsConfig,
  TavusConfig,
  ConversationScript,
  ConversationSimulationResult,
  ConversationTranscript,
  SentimentAnalysisResult,
  VoiceQualityMetrics,
  VideoQualityMetrics,
  ConversationPerformanceScores
} from '../../types/simulation';

export class ConversationSimulationService {
  private activeSimulations: Map<string, ConversationSimulation> = new Map();
  private simulationResults: Map<string, ConversationSimulationResult> = new Map();
  private elevenLabsApiKey: string | null = null;
  private tavusApiKey: string | null = null;

  constructor() {
    this.initializeAPIKeys();
  }

  // Configuration
  setElevenLabsApiKey(apiKey: string): void {
    this.elevenLabsApiKey = apiKey;
  }

  setTavusApiKey(apiKey: string): void {
    this.tavusApiKey = apiKey;
  }

  // Simulation Management
  async createConversationSimulation(
    agentId: string,
    simulationEnvironmentId: string,
    voiceConfig: ElevenLabsConfig,
    videoConfig?: TavusConfig,
    script?: ConversationScript
  ): Promise<ConversationSimulation> {
    const simulation: ConversationSimulation = {
      id: this.generateId(),
      agent_id: agentId,
      simulation_environment_id: simulationEnvironmentId,
      voice_config: voiceConfig,
      video_config: videoConfig || this.getDefaultTavusConfig(),
      conversation_script: script,
      real_time_interaction: !script, // If no script, enable real-time
      session_config: {
        max_duration_minutes: 30,
        auto_end_on_silence_ms: 10000,
        allow_interruptions: true,
        enable_sentiment_analysis: true,
        enable_keyword_detection: true,
        keywords_to_track: ['help', 'problem', 'error', 'thank you', 'goodbye'],
        language: 'en-US',
        enable_transcription: true
      },
      status: 'setup'
    };

    this.activeSimulations.set(simulation.id, simulation);
    return simulation;
  }

  async startConversationSimulation(simulationId: string): Promise<void> {
    const simulation = this.activeSimulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    if (simulation.status !== 'ready') {
      throw new Error(`Simulation not ready. Current status: ${simulation.status}`);
    }

    simulation.status = 'running';

    try {
      if (simulation.conversation_script) {
        await this.runScriptedConversation(simulation);
      } else {
        await this.runRealTimeConversation(simulation);
      }

      simulation.status = 'completed';
    } catch (error) {
      simulation.status = 'failed';
      throw error;
    }
  }

  async stopConversationSimulation(simulationId: string): Promise<void> {
    const simulation = this.activeSimulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    simulation.status = 'completed';
    
    // Cleanup any active connections
    await this.cleanupSimulation(simulationId);
  }

  getConversationSimulation(simulationId: string): ConversationSimulation | undefined {
    return this.activeSimulations.get(simulationId);
  }

  getSimulationResult(simulationId: string): ConversationSimulationResult | undefined {
    return this.simulationResults.get(simulationId);
  }

  // Voice Synthesis (ElevenLabs Integration)
  async synthesizeVoice(
    text: string,
    voiceConfig: ElevenLabsConfig
  ): Promise<VoiceSynthesisResult> {
    if (!this.elevenLabsApiKey) {
      // Return mock result for development
      return this.createMockVoiceSynthesis(text, voiceConfig);
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceConfig.voice_id, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text,
          model_id: voiceConfig.model_id,
          voice_settings: voiceConfig.voice_settings,
          output_format: voiceConfig.output_format || 'mp3_44100_128',
          optimize_streaming_latency: voiceConfig.optimize_streaming_latency || 0
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioUrl = URL.createObjectURL(new Blob([audioBuffer], { type: 'audio/mpeg' }));

      return {
        audio_url: audioUrl,
        duration_ms: this.estimateAudioDuration(text),
        synthesis_time_ms: Date.now() - Date.now(), // Would be tracked properly
        quality_score: 0.95,
        naturalness_score: 0.92,
        clarity_score: 0.89,
        voice_id: voiceConfig.voice_id,
        model_id: voiceConfig.model_id
      };

    } catch (error) {
      console.error('Voice synthesis failed:', error);
      throw new Error(`Voice synthesis failed: ${error}`);
    }
  }

  // Video Generation (Tavus Integration)
  async generateVideo(
    audioUrl: string,
    videoConfig: TavusConfig,
    duration_ms: number
  ): Promise<VideoGenerationResult> {
    if (!this.tavusApiKey) {
      // Return mock result for development
      return this.createMockVideoGeneration(audioUrl, videoConfig, duration_ms);
    }

    try {
      const response = await fetch('https://tavusapi.com/v2/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.tavusApiKey
        },
        body: JSON.stringify({
          script: {
            audio_url: audioUrl
          },
          persona_id: videoConfig.persona_id,
          background_setting: videoConfig.background_setting,
          quality: videoConfig.video_quality,
          frame_rate: videoConfig.frame_rate,
          resolution: videoConfig.resolution
        })
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return {
        video_id: result.video_id,
        video_url: result.video_url,
        thumbnail_url: result.thumbnail_url,
        duration_ms,
        generation_time_ms: result.generation_time_ms || 5000,
        quality_score: 0.88,
        frame_rate_actual: videoConfig.frame_rate,
        resolution_actual: videoConfig.resolution,
        persona_id: videoConfig.persona_id,
        status: 'completed'
      };

    } catch (error) {
      console.error('Video generation failed:', error);
      throw new Error(`Video generation failed: ${error}`);
    }
  }

  // Conversation Analysis
  async analyzeConversation(
    transcript: ConversationTranscript[]
  ): Promise<ConversationAnalysisResult> {
    const sentimentAnalysis = await this.analyzeSentiment(transcript);
    const performanceScores = this.calculatePerformanceScores(transcript, sentimentAnalysis);
    const keywordMatches = this.analyzeKeywords(transcript);
    const conversationFlow = this.analyzeConversationFlow(transcript);

    return {
      sentiment_analysis: sentimentAnalysis,
      performance_scores: performanceScores,
      keyword_matches: keywordMatches,
      conversation_flow: conversationFlow,
      total_turns: transcript.length,
      average_response_time: this.calculateAverageResponseTime(transcript),
      conversation_duration_ms: this.calculateConversationDuration(transcript),
      interruption_count: this.countInterruptions(transcript),
      silence_periods: this.detectSilencePeriods(transcript)
    };
  }

  // Voice Quality Assessment
  assessVoiceQuality(
    voiceConfig: ElevenLabsConfig,
    audioMetrics: any
  ): VoiceQualityMetrics {
    // In a real implementation, this would analyze the actual audio
    return {
      average_latency_ms: audioMetrics?.latency || 200,
      audio_quality_score: 0.92,
      naturalness_score: this.calculateNaturalnessScore(voiceConfig),
      clarity_score: 0.89,
      interruption_count: audioMetrics?.interruptions || 0,
      silence_periods_ms: audioMetrics?.silencePeriods || []
    };
  }

  // Video Quality Assessment
  assessVideoQuality(
    videoConfig: TavusConfig,
    videoMetrics: any
  ): VideoQualityMetrics {
    // In a real implementation, this would analyze the actual video
    return {
      frame_rate_actual: videoConfig.frame_rate,
      resolution_actual: videoConfig.resolution,
      sync_accuracy_ms: videoMetrics?.syncAccuracy || 50,
      visual_quality_score: 0.85,
      gesture_naturalness_score: 0.78,
      eye_contact_percentage: 75
    };
  }

  // Predefined Conversation Scripts
  getDefaultConversationScripts(): ConversationScript[] {
    return [
      {
        id: 'customer-support-basic',
        name: 'Basic Customer Support',
        description: 'Simple customer inquiry and resolution',
        conversation_turns: [
          {
            id: '1',
            order: 1,
            speaker: 'user',
            message: 'Hi, I\'m having trouble with my order',
            emotion_target: 'concerned'
          },
          {
            id: '2',
            order: 2,
            speaker: 'agent',
            message: 'I\'m sorry to hear that. I\'d be happy to help you with your order. Can you please provide me with your order number?',
            expected_response_pattern: '(order|number|#)',
            emotion_target: 'happy',
            timing_requirements: {
              max_response_time_ms: 3000
            }
          },
          {
            id: '3',
            order: 3,
            speaker: 'user',
            message: 'Sure, it\'s order #12345',
            emotion_target: 'neutral'
          },
          {
            id: '4',
            order: 4,
            speaker: 'agent',
            message: 'Thank you! Let me look that up for you. I can see your order here. What specific issue are you experiencing?',
            timing_requirements: {
              max_response_time_ms: 5000
            }
          }
        ],
        expected_duration_minutes: 5,
        difficulty_level: 'easy'
      },
      {
        id: 'sales-qualification',
        name: 'Sales Lead Qualification',
        description: 'Qualifying a potential sales lead',
        conversation_turns: [
          {
            id: '1',
            order: 1,
            speaker: 'agent',
            message: 'Hi! I understand you\'re interested in our enterprise solution. Could you tell me a bit about your current setup?',
            emotion_target: 'neutral'
          },
          {
            id: '2',
            order: 2,
            speaker: 'user',
            message: 'Yes, we\'re a mid-size company with about 200 employees. We\'re currently using a legacy system that\'s causing us issues.',
            emotion_target: 'frustrated'
          },
          {
            id: '3',
            order: 3,
            speaker: 'agent',
            message: 'I see. Those legacy systems can definitely be challenging. What are the main pain points you\'re experiencing?',
            expected_response_pattern: '(pain|problem|issue|challenge)',
            timing_requirements: {
              max_response_time_ms: 3000
            }
          }
        ],
        expected_duration_minutes: 10,
        difficulty_level: 'medium'
      }
    ];
  }

  // Private Methods
  private async initializeAPIKeys(): Promise<void> {
    // In a real implementation, these would be loaded from secure storage
    // For now, they'll be set via the setter methods
  }

  private getDefaultTavusConfig(): TavusConfig {
    return {
      persona_id: 'default-persona',
      background_setting: 'office',
      interaction_mode: 'speaking',
      video_quality: 'medium',
      frame_rate: 30,
      resolution: '720p',
      background_blur: false
    };
  }

  private async runScriptedConversation(simulation: ConversationSimulation): Promise<void> {
    if (!simulation.conversation_script) {
      throw new Error('No script provided for scripted conversation');
    }

    const transcript: ConversationTranscript[] = [];
    const startTime = Date.now();

    for (const turn of simulation.conversation_script.conversation_turns) {
      const timestamp = new Date().toISOString();
      
      if (turn.speaker === 'agent') {
        // Synthesize agent voice
        const voiceResult = await this.synthesizeVoice(turn.message, simulation.voice_config);
        
        // Generate video if configured
        if (simulation.video_config) {
          await this.generateVideo(
            voiceResult.audio_url,
            simulation.video_config,
            voiceResult.duration_ms
          );
        }

        // Simulate response time
        const responseTime = turn.timing_requirements?.max_response_time_ms || 2000;
        await new Promise(resolve => setTimeout(resolve, Math.random() * responseTime));
      }

      transcript.push({
        id: this.generateId(),
        timestamp,
        speaker: turn.speaker,
        message: turn.message,
        confidence_score: 0.95,
        response_time_ms: turn.speaker === 'agent' ? Math.random() * 3000 : undefined,
        emotion_detected: turn.emotion_target,
        keywords_matched: this.extractKeywords(turn.message, simulation.session_config.keywords_to_track || [])
      });
    }

    // Analyze conversation and store results
    const analysisResult = await this.analyzeConversation(transcript);
    const voiceQuality = this.assessVoiceQuality(simulation.voice_config, {});
    const videoQuality = simulation.video_config ? this.assessVideoQuality(simulation.video_config, {}) : undefined;

    const result: ConversationSimulationResult = {
      id: this.generateId(),
      conversation_id: simulation.id,
      total_duration_ms: Date.now() - startTime,
      turn_count: transcript.length,
      successful_turns: transcript.length, // All turns successful in scripted mode
      conversation_transcript: transcript,
      sentiment_analysis: analysisResult.sentiment_analysis,
      voice_quality_metrics: voiceQuality,
      video_quality_metrics: videoQuality || {
        frame_rate_actual: 30,
        resolution_actual: '720p',
        sync_accuracy_ms: 50,
        visual_quality_score: 0.85,
        gesture_naturalness_score: 0.78,
        eye_contact_percentage: 75
      },
      performance_scores: analysisResult.performance_scores
    };

    this.simulationResults.set(simulation.id, result);
  }

  private async runRealTimeConversation(simulation: ConversationSimulation): Promise<void> {
    // In a real implementation, this would handle real-time conversation
    // For now, simulate a basic conversation
    const transcript: ConversationTranscript[] = [
      {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        speaker: 'user',
        message: 'Hello, I need help with something',
        confidence_score: 0.92,
        emotion_detected: 'neutral'
      },
      {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        speaker: 'agent',
        message: 'Hello! I\'d be happy to help you. What can I assist you with today?',
        confidence_score: 0.98,
        response_time_ms: 1500,
        emotion_detected: 'helpful'
      }
    ];

    const analysisResult = await this.analyzeConversation(transcript);
    const voiceQuality = this.assessVoiceQuality(simulation.voice_config, {});
    const videoQuality = simulation.video_config ? this.assessVideoQuality(simulation.video_config, {}) : undefined;

    const result: ConversationSimulationResult = {
      id: this.generateId(),
      conversation_id: simulation.id,
      total_duration_ms: 30000, // 30 seconds mock duration
      turn_count: transcript.length,
      successful_turns: transcript.length,
      conversation_transcript: transcript,
      sentiment_analysis: analysisResult.sentiment_analysis,
      voice_quality_metrics: voiceQuality,
      video_quality_metrics: videoQuality || {
        frame_rate_actual: 30,
        resolution_actual: '720p',
        sync_accuracy_ms: 50,
        visual_quality_score: 0.85,
        gesture_naturalness_score: 0.78,
        eye_contact_percentage: 75
      },
      performance_scores: analysisResult.performance_scores
    };

    this.simulationResults.set(simulation.id, result);
  }

  private async cleanupSimulation(simulationId: string): Promise<void> {
    // Cleanup any resources, connections, etc.
    this.activeSimulations.delete(simulationId);
  }

  private createMockVoiceSynthesis(text: string, voiceConfig: ElevenLabsConfig): VoiceSynthesisResult {
    // Create a mock audio blob URL for development
    const mockAudioUrl = URL.createObjectURL(new Blob(['mock audio data'], { type: 'audio/mpeg' }));
    
    return {
      audio_url: mockAudioUrl,
      duration_ms: this.estimateAudioDuration(text),
      synthesis_time_ms: 500,
      quality_score: 0.90,
      naturalness_score: 0.85,
      clarity_score: 0.88,
      voice_id: voiceConfig.voice_id,
      model_id: voiceConfig.model_id
    };
  }

  private createMockVideoGeneration(_audioUrl: string, videoConfig: TavusConfig, duration_ms: number): VideoGenerationResult {
    return {
      video_id: this.generateId(),
      video_url: 'mock-video-url',
      thumbnail_url: 'mock-thumbnail-url',
      duration_ms,
      generation_time_ms: 3000,
      quality_score: 0.82,
      frame_rate_actual: videoConfig.frame_rate,
      resolution_actual: videoConfig.resolution,
      persona_id: videoConfig.persona_id,
      status: 'completed'
    };
  }

  private estimateAudioDuration(text: string): number {
    // Rough estimation: ~150 words per minute, ~5 characters per word
    const wordsPerMinute = 150;
    const charactersPerWord = 5;
    const words = text.length / charactersPerWord;
    const minutes = words / wordsPerMinute;
    return Math.ceil(minutes * 60 * 1000); // Convert to milliseconds
  }

  private async analyzeSentiment(transcript: ConversationTranscript[]): Promise<SentimentAnalysisResult[]> {
    // Mock sentiment analysis - in production would use AI service
    return transcript.map(turn => ({
      timestamp: turn.timestamp,
      sentiment: Math.random() > 0.7 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative',
      confidence: 0.8 + Math.random() * 0.2,
      emotions: [
        { emotion: 'happy', intensity: Math.random() * 0.5 },
        { emotion: 'neutral', intensity: 0.3 + Math.random() * 0.4 },
        { emotion: 'frustrated', intensity: Math.random() * 0.3 }
      ]
    }));
  }

  private calculatePerformanceScores(
    transcript: ConversationTranscript[],
    sentimentAnalysis: SentimentAnalysisResult[]
  ): ConversationPerformanceScores {
    const positiveResponses = sentimentAnalysis.filter(s => s.sentiment === 'positive').length;
    const totalResponses = sentimentAnalysis.length;
    const positiveSentimentRate = totalResponses > 0 ? positiveResponses / totalResponses : 0;

    const avgResponseTime = this.calculateAverageResponseTime(transcript);
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 100)); // Penalize slow responses

    return {
      overall_score: Math.round((positiveSentimentRate * 40 + responseTimeScore * 30 + 85 * 0.3)),
      communication_effectiveness: Math.round(positiveSentimentRate * 100),
      technical_quality: Math.round(responseTimeScore),
      user_experience: Math.round((positiveSentimentRate * 60 + responseTimeScore * 40)),
      goal_achievement: 85, // Mock score
      response_appropriateness: 88 // Mock score
    };
  }

  private analyzeKeywords(transcript: ConversationTranscript[]): string[] {
    const keywords: string[] = [];
    transcript.forEach(turn => {
      if (turn.keywords_matched) {
        keywords.push(...turn.keywords_matched);
      }
    });
    return [...new Set(keywords)]; // Remove duplicates
  }

  private analyzeConversationFlow(_transcript: ConversationTranscript[]): any {
    return {
      opening_quality: 'good',
      conversation_structure: 'logical',
      closing_quality: 'satisfactory',
      topic_transitions: 'smooth'
    };
  }

  private calculateAverageResponseTime(transcript: ConversationTranscript[]): number {
    const responseTimes = transcript
      .filter(turn => turn.response_time_ms !== undefined)
      .map(turn => turn.response_time_ms!);
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
  }

  private calculateConversationDuration(transcript: ConversationTranscript[]): number {
    if (transcript.length === 0) return 0;
    
    const firstTimestamp = new Date(transcript[0].timestamp).getTime();
    const lastTimestamp = new Date(transcript[transcript.length - 1].timestamp).getTime();
    
    return lastTimestamp - firstTimestamp;
  }

  private countInterruptions(_transcript: ConversationTranscript[]): number {
    // Mock implementation - would analyze actual conversation patterns
    return Math.floor(Math.random() * 3);
  }

  private detectSilencePeriods(_transcript: ConversationTranscript[]): number[] {
    // Mock implementation - would analyze actual audio
    return [1000, 500, 2000]; // Mock silence periods in ms
  }

  private calculateNaturalnessScore(voiceConfig: ElevenLabsConfig): number {
    // Calculate based on voice settings
    const stability = voiceConfig.voice_settings.stability;
    const similarity = voiceConfig.voice_settings.similarity_boost;
    const style = voiceConfig.voice_settings.style;
    
    return (stability + similarity + style) / 3;
  }

  private extractKeywords(message: string, keywords: string[]): string[] {
    const messageLower = message.toLowerCase();
    return keywords.filter(keyword => messageLower.includes(keyword.toLowerCase()));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Supporting Interfaces
interface VoiceSynthesisResult {
  audio_url: string;
  duration_ms: number;
  synthesis_time_ms: number;
  quality_score: number;
  naturalness_score: number;
  clarity_score: number;
  voice_id: string;
  model_id: string;
}

interface VideoGenerationResult {
  video_id: string;
  video_url: string;
  thumbnail_url: string;
  duration_ms: number;
  generation_time_ms: number;
  quality_score: number;
  frame_rate_actual: number;
  resolution_actual: string;
  persona_id: string;
  status: string;
}

interface ConversationAnalysisResult {
  sentiment_analysis: SentimentAnalysisResult[];
  performance_scores: ConversationPerformanceScores;
  keyword_matches: string[];
  conversation_flow: any;
  total_turns: number;
  average_response_time: number;
  conversation_duration_ms: number;
  interruption_count: number;
  silence_periods: number[];
}

// Export singleton instance
export const conversationSimulationService = new ConversationSimulationService();