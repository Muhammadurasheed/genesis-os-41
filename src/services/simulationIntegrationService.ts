import { backendAPIService } from './backendAPIService';
import { supabase } from '../lib/supabase';

interface SimulationRequest {
  workflow_data: any;
  simulation_type: 'basic' | 'voice' | 'video' | 'full';
  participants?: {
    voice_enabled: boolean;
    video_enabled: boolean;
    tavus_config?: any;
    elevenlabs_config?: any;
  };
  debug_mode: boolean;
}

interface SimulationResult {
  simulation_id: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  results: {
    success_rate: number;
    execution_time: number;
    debug_logs: DebugLog[];
    voice_interactions?: VoiceInteraction[];
    video_outputs?: VideoOutput[];
  };
  metrics: {
    agent_performance: Record<string, any>;
    workflow_efficiency: number;
    error_count: number;
  };
}

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  data?: any;
}

interface VoiceInteraction {
  timestamp: string;
  speaker: string;
  text: string;
  audio_url?: string;
  sentiment?: string;
}

interface VideoOutput {
  timestamp: string;
  video_url: string;
  transcript?: string;
  metadata?: any;
}

class SimulationIntegrationService {
  /**
   * Phase 2: Advanced Simulation Lab Integration
   */
  async runSimulation(request: SimulationRequest): Promise<string> {
    try {
      console.log('🧪 Simulation Lab: Starting advanced simulation...');
      
      // Try backend simulation orchestrator first
      try {
        const response = await backendAPIService.runSimulation(request);
        if (response.success) {
          console.log('✅ Simulation started via backend orchestrator');
          return response.data.simulationId;
        }
      } catch (backendError) {
        console.warn('Backend simulation failed, using edge function fallback:', backendError);
      }
      
      // Fallback to edge function simulation
      return await this.runSimulationViaEdgeFunction(request);
    } catch (error) {
      console.error('Simulation execution failed:', error);
      throw error;
    }
  }

  private async runSimulationViaEdgeFunction(request: SimulationRequest): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await supabase.functions.invoke('workflow-execution-advanced', {
      body: {
        action: 'simulate',
        workflow_data: request.workflow_data,
        simulation_type: request.simulation_type,
        participants: request.participants,
        debug_mode: request.debug_mode
      }
    });

    if (response.error) {
      throw new Error(`Simulation failed: ${response.error.message}`);
    }

    return response.data.simulation_id;
  }

  /**
   * Phase 2: Voice Conversation Simulation with ElevenLabs
   */
  async enableVoiceSimulation(simulationId: string, config: {
    voice_id: string;
    stability?: number;
    similarity_boost?: number;
    conversation_flow: Array<{
      speaker: string;
      message: string;
      expected_response?: string;
    }>;
  }): Promise<void> {
    try {
      console.log('🎤 Voice Simulation: Integrating ElevenLabs...');
      
      // Try backend voice orchestrator first
      try {
        const response = await backendAPIService.enableVoiceSimulation(simulationId, config);
        if (response.success) {
          console.log('✅ Voice simulation enabled via backend orchestrator');
          return;
        }
      } catch (backendError) {
        console.warn('Backend voice simulation failed, using edge function fallback:', backendError);
      }
      
      // Fallback to edge function voice synthesis
      const response = await supabase.functions.invoke('voice-synthesis', {
        body: {
          simulation_id: simulationId,
          voice_config: config,
          action: 'start_conversation'
        }
      });

      if (response.error) {
        throw new Error(`Voice simulation setup failed: ${response.error.message}`);
      }

      console.log('✅ Voice simulation enabled with ElevenLabs');
    } catch (error) {
      console.error('Voice simulation setup failed:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Video Simulation with Tavus Integration
   */
  async enableVideoSimulation(simulationId: string, config: {
    persona: {
      name: string;
      voice_id: string;
      background_url?: string;
    };
    script: string;
    settings: {
      resolution: string;
      duration: number;
    };
  }): Promise<string> {
    try {
      console.log('📹 Video Simulation: Integrating Tavus...');
      
      // Generate video simulation
      const response = await supabase.functions.invoke('video-generation', {
        body: {
          simulation_id: simulationId,
          video_config: config,
          action: 'generate_simulation_video'
        }
      });

      if (response.error) {
        throw new Error(`Video simulation setup failed: ${response.error.message}`);
      }

      console.log('✅ Video simulation enabled with Tavus');
      return response.data.video_id;
    } catch (error) {
      console.error('Video simulation setup failed:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Real-time Simulation Monitoring
   */
  async getSimulationStatus(simulationId: string): Promise<SimulationResult> {
    try {
      // Try backend monitoring first
      const response = await backendAPIService.getSimulationResults(simulationId);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.warn('Backend simulation monitoring failed, using direct query:', error);
    }

    // Fallback to direct database query
    const { data, error } = await supabase
      .from('simulations')
      .select(`
        *,
        debug_logs (*),
        voice_interactions (*),
        video_outputs (*)
      `)
      .eq('id', simulationId)
      .single();

    if (error) {
      throw new Error(`Failed to get simulation status: ${error.message}`);
    }

    return {
      simulation_id: data.id,
      status: data.status,
      results: {
        success_rate: data.success_rate || 0,
        execution_time: data.execution_time || 0,
        debug_logs: data.debug_logs || [],
        voice_interactions: data.voice_interactions || [],
        video_outputs: data.video_outputs || []
      },
      metrics: data.metrics || {
        agent_performance: {},
        workflow_efficiency: 0,
        error_count: 0
      }
    };
  }

  /**
   * Phase 2: Advanced Debug Panel Integration
   */
  async getSimulationDebugData(simulationId: string): Promise<{
    real_time_logs: DebugLog[];
    performance_metrics: any;
    agent_interactions: any[];
    system_health: any;
  }> {
    try {
      console.log('🐛 Debug Panel: Fetching real-time debug data...');
      
      // Get real-time logs from backend
      const response = await fetch('/api/simulation/debug', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend debug data failed, using database fallback:', error);
    }

    // Fallback to database query
    const { data: logs } = await supabase
      .from('debug_logs')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('timestamp', { ascending: false })
      .limit(100);

    return {
      real_time_logs: logs || [],
      performance_metrics: {
        cpu_usage: 0,
        memory_usage: 0,
        response_time: 0
      },
      agent_interactions: [],
      system_health: {
        status: 'healthy',
        uptime: '100%'
      }
    };
  }

  /**
   * Phase 2: Simulation Control Methods
   */
  async pauseSimulation(simulationId: string): Promise<void> {
    try {
      await this.updateSimulationStatus(simulationId, 'paused');
      console.log('⏸️ Simulation paused');
    } catch (error) {
      console.error('Failed to pause simulation:', error);
      throw error;
    }
  }

  async resumeSimulation(simulationId: string): Promise<void> {
    try {
      await this.updateSimulationStatus(simulationId, 'running');
      console.log('▶️ Simulation resumed');
    } catch (error) {
      console.error('Failed to resume simulation:', error);
      throw error;
    }
  }

  async stopSimulation(simulationId: string): Promise<void> {
    try {
      await this.updateSimulationStatus(simulationId, 'completed');
      console.log('⏹️ Simulation stopped');
    } catch (error) {
      console.error('Failed to stop simulation:', error);
      throw error;
    }
  }

  private async updateSimulationStatus(simulationId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('simulations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', simulationId);

    if (error) {
      throw new Error(`Failed to update simulation status: ${error.message}`);
    }
  }

  /**
   * Phase 2: Simulation Analytics and Reporting
   */
  async generateSimulationReport(simulationId: string): Promise<{
    summary: any;
    detailed_metrics: any;
    recommendations: string[];
    export_formats: string[];
  }> {
    const simulationData = await this.getSimulationStatus(simulationId);
    const debugData = await this.getSimulationDebugData(simulationId);

    return {
      summary: {
        simulation_id: simulationId,
        status: simulationData.status,
        success_rate: simulationData.results.success_rate,
        total_time: simulationData.results.execution_time,
        error_count: simulationData.metrics.error_count
      },
      detailed_metrics: {
        agent_performance: simulationData.metrics.agent_performance,
        workflow_efficiency: simulationData.metrics.workflow_efficiency,
        debug_insights: debugData.real_time_logs.slice(0, 10)
      },
      recommendations: this.generateRecommendations(simulationData),
      export_formats: ['pdf', 'json', 'csv']
    };
  }

  private generateRecommendations(simulation: SimulationResult): string[] {
    const recommendations: string[] = [];

    if (simulation.results.success_rate < 0.8) {
      recommendations.push('Consider optimizing agent configurations for better success rate');
    }

    if (simulation.results.execution_time > 30000) {
      recommendations.push('Workflow execution time is high, consider parallel processing');
    }

    if (simulation.metrics.error_count > 5) {
      recommendations.push('High error count detected, review agent tool configurations');
    }

    return recommendations;
  }
}

export const simulationIntegrationService = new SimulationIntegrationService();