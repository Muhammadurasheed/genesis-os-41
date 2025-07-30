/**
 * Autonomous Agent Learning System - Phase 5: Advanced AI & Autonomous Learning
 * Full-stack self-improving AI with experience database and real-time adaptation
 */

import { createClient } from '@supabase/supabase-js';
import { multiModelReasoningService } from '../ai/multiModelReasoningService';

interface LearningExperience {
  id: string;
  agent_id: string;
  execution_id: string;
  scenario_type: string;
  input_context: Record<string, any>;
  agent_response: string;
  outcome_quality: number; // 0-1 scale
  user_feedback?: number; // 1-5 scale
  performance_metrics: {
    response_time: number;
    accuracy: number;
    creativity: number;
    efficiency: number;
  };
  lessons_learned: string[];
  improvement_suggestions: string[];
  created_at: string;
}

interface AgentCapabilityModel {
  agent_id: string;
  capability: string;
  proficiency_level: number; // 0-1 scale
  confidence_interval: number;
  learning_velocity: number;
  last_improvement: string;
  training_examples: number;
}

export class AutonomousLearningSystem {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );

  /**
   * Record agent experience for learning
   */
  public async recordExperience(experience: Omit<LearningExperience, 'id' | 'created_at'>): Promise<string> {
    const experienceId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store experience in database
    const { error } = await this.supabase
      .from('agent_learning_experiences')
      .insert([{
        id: experienceId,
        ...experience,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Failed to record experience:', error);
      throw error;
    }

    // Trigger learning analysis
    await this.analyzeAndLearn(experience.agent_id, experienceId);

    return experienceId;
  }

  /**
   * Analyze experience and update agent capabilities
   */
  private async analyzeAndLearn(agentId: string, experienceId: string) {
    try {
      // Get recent experiences for pattern analysis
      const { data: experiences, error } = await this.supabase
        .from('agent_learning_experiences')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !experiences?.length) return;

      // Use Claude 4 for advanced learning analysis
      const learningPrompt = `
        Analyze the following agent experiences and identify learning patterns:
        
        ${JSON.stringify(experiences.slice(0, 10), null, 2)}
        
        Provide insights on:
        1. Performance trends across different scenarios
        2. Areas of strength and weakness
        3. Specific improvement recommendations
        4. Capability progression patterns
        
        Format as JSON with structured analysis.
      `;

      const learningAnalysis = await multiModelReasoningService.reasonWithConsensus(
        learningPrompt,
        {
          requiredCapabilities: ['reasoning', 'analysis'],
          minConsensus: 0.8,
          modelIds: ['claude-opus-4-20250514', 'gpt-4.1-2025-04-14']
        }
      );

      // Update agent capabilities based on analysis
      await this.updateAgentCapabilities(agentId, learningAnalysis.finalAnswer);

      // Store learning insights
      await this.supabase
        .from('agent_learning_insights')
        .insert([{
          agent_id: agentId,
          experience_id: experienceId,
          analysis: learningAnalysis.finalAnswer,
          confidence: learningAnalysis.confidence,
          created_at: new Date().toISOString()
        }]);

    } catch (error) {
      console.error('Learning analysis failed:', error);
    }
  }

  /**
   * Get agent's current learning status
   */
  public async getAgentLearningStatus(agentId: string) {
    const { data: capabilities, error } = await this.supabase
      .from('agent_capabilities')
      .select('*')
      .eq('agent_id', agentId);

    if (error) return null;

    const { data: recentExperiences } = await this.supabase
      .from('agent_learning_experiences')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      capabilities: capabilities || [],
      recent_experiences: recentExperiences || [],
      learning_velocity: this.calculateLearningVelocity(recentExperiences || []),
      improvement_areas: this.identifyImprovementAreas(capabilities || [])
    };
  }

  private calculateLearningVelocity(experiences: LearningExperience[]): number {
    if (experiences.length < 2) return 0;

    const qualityTrend = experiences.slice(0, 5).map(exp => exp.outcome_quality);
    const avgImprovement = qualityTrend.reduce((acc, curr, idx) => {
      if (idx === 0) return acc;
      return acc + (curr - qualityTrend[idx - 1]);
    }, 0) / Math.max(qualityTrend.length - 1, 1);

    return Math.max(0, Math.min(1, avgImprovement + 0.5));
  }

  private identifyImprovementAreas(capabilities: AgentCapabilityModel[]): string[] {
    return capabilities
      .filter(cap => cap.proficiency_level < 0.7)
      .sort((a, b) => a.proficiency_level - b.proficiency_level)
      .slice(0, 3)
      .map(cap => cap.capability);
  }

  private async updateAgentCapabilities(agentId: string, analysisResult: string) {
    // Implementation for updating capabilities based on learning analysis
    // This would parse the analysis and update the agent_capabilities table
    console.log(`Updating capabilities for agent ${agentId} based on analysis:`, analysisResult);
  }
}

export const autonomousLearningSystem = new AutonomousLearningSystem();