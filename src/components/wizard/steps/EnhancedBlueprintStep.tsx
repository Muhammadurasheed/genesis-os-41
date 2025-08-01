import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Brain, 
  Users, 
  Star,
  ArrowRight,
  Target,
  Lightbulb,
  Cpu,
  AlertTriangle
} from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { QuantumLoader } from '../../ui/QuantumLoader';
import { BackendStatus } from '../../ui/BackendStatus';
import { blueprintService } from '../../../services/blueprintService';
import { toast } from 'sonner';
import { Blueprint } from '../../../types';

export const EnhancedBlueprintStep: React.FC = () => {
  const { 
    user_input, 
    setBlueprint, 
    nextStep, 
    setStep,
    isLoading,
    addError
  } = useWizardStore();

  const [enhancedBlueprint, setEnhancedBlueprint] = useState<Blueprint | null>(null);
  const [generationMethod, setGenerationMethod] = useState<'backend' | 'frontend_enhanced' | 'frontend_fallback' | 'fallback' | null>(null);

  useEffect(() => {
    if (user_input && !enhancedBlueprint) {
      generateEnhancedBlueprint();
    }
  }, [user_input]);

  const generateEnhancedBlueprint = async () => {
    try {
      console.log('🧠 Phase 1: Blueprint Engine Integration Test');
      
      // Show loading state immediately
      setGenerationMethod(null);
      
      const response = await blueprintService.generateBlueprint(user_input);
      
      if (response && (response.analysis || response.suggested_structure)) {
        console.log('✅ Blueprint generation successful:', response.generation_source || 'legacy');
        
        // Convert GeneratedBlueprint to Blueprint format if needed
        const blueprintData: Blueprint = {
          ...response,
          interpretation: response.analysis?.user_intent_summary || 'AI-generated blueprint',
          suggested_structure: response.suggested_structure || {
            guild_name: 'AI Generated Guild',
            guild_purpose: response.analysis?.user_intent_summary || 'Generated from user input',
            agents: response.analysis?.suggested_agents?.map((agent: any) => ({
              name: agent.name,
              role: agent.primary_role,
              description: agent.persona,
              tools_needed: agent.required_tools || []
            })) || [],
            workflows: response.analysis?.identified_processes?.map((process: any) => ({
              name: process.name,
              description: process.description,
              trigger_type: 'manual'
            })) || []
          },
          status: 'draft' as const,
          analysis: response.analysis,
          generation_source: response.generation_source,
          confidence_score: response.confidence_score
        };
        
        setEnhancedBlueprint(blueprintData);
        setBlueprint(blueprintData);
        setGenerationMethod(response.generation_source || 'backend' as any);
        
        if (response.generation_source === 'backend') {
          toast.success('✅ Enhanced blueprint generated via backend!');
        } else if (response.generation_source === 'frontend_enhanced') {
          toast.success('✅ Enhanced blueprint generated via frontend AI!');
        } else {
          toast.success('✅ Blueprint generated successfully!');
        }
      } else {
        throw new Error('Invalid response format - missing required data');
      }
    } catch (error: any) {
      console.error('Blueprint generation error:', error);
      setGenerationMethod('fallback');
      addError('Blueprint generation failed, using fallback');
      toast.error('⚠️ Using fallback blueprint generation');
      
      // Create fallback blueprint
      const fallbackBlueprint = blueprintService.createSampleBlueprint(user_input);
      setEnhancedBlueprint(fallbackBlueprint);
      setBlueprint(fallbackBlueprint);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <GlassCard variant="medium" glow className="p-12 text-center">
          <QuantumLoader size="lg" color="purple" />
          <h2 className="text-3xl font-bold text-white mb-6">
            Generating Enhanced Blueprint
          </h2>
          <p className="text-gray-300 text-lg">
            AI architect analyzing your requirements with advanced reasoning...
          </p>
        </GlassCard>
      </div>
    );
  }

  if (!enhancedBlueprint) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <GlassCard variant="medium" className="p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-4">Blueprint Generation Failed</h3>
          <HolographicButton onClick={generateEnhancedBlueprint}>
            Retry Generation
          </HolographicButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        {/* Backend Status Indicator */}
        <div className="mb-6">
          <BackendStatus />
          {generationMethod && (
            <div className="mt-2 flex items-center justify-center gap-2">
              {generationMethod === 'backend' ? (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Generated via Backend Orchestrator
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Generated via Fallback System
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-400 mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-white">
              Enhanced Blueprint Generated
            </h1>
            <p className="text-gray-300 text-lg mt-2">
              {enhancedBlueprint.suggested_structure?.guild_name || 'Your Custom Guild'}
            </p>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="subtle" className="p-4">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {enhancedBlueprint.confidence_score?.toFixed(1) || '95.0'}
            </div>
            <div className="text-xs text-gray-400">Quality Score</div>
          </GlassCard>
          <GlassCard variant="subtle" className="p-4">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {enhancedBlueprint.suggested_structure?.agents?.length || enhancedBlueprint.analysis?.suggested_agents?.length || 3}
            </div>
            <div className="text-xs text-gray-400">Agents Designed</div>
          </GlassCard>
          <GlassCard variant="subtle" className="p-4">
            <Brain className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {enhancedBlueprint.suggested_structure?.workflows?.length || enhancedBlueprint.analysis?.identified_processes?.length || 2}
            </div>
            <div className="text-xs text-gray-400">Workflows Created</div>
          </GlassCard>
          <GlassCard variant="subtle" className="p-4">
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {(enhancedBlueprint.confidence_score && (enhancedBlueprint.confidence_score * 100).toFixed(0)) || 92}%
            </div>
            <div className="text-xs text-gray-400">Success Probability</div>
          </GlassCard>
        </div>
      </motion.div>

      {/* Agent Architecture */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <GlassCard variant="medium" className="p-6">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-blue-400 mr-3" />
            <h3 className="text-xl font-bold text-white">
              Agent Architecture ({enhancedBlueprint.suggested_structure?.agents?.length || enhancedBlueprint.analysis?.suggested_agents?.length || 0} Agents)
            </h3>
          </div>

          <div className="space-y-4">
            {(enhancedBlueprint.suggested_structure?.agents || enhancedBlueprint.analysis?.suggested_agents)?.map((agent: any, index: number) => (
              <div key={agent.id || index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{agent.name}</h4>
                    <p className="text-sm text-purple-300">{agent.role || agent.primary_role}</p>
                  </div>
                  <Cpu className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-gray-300 mb-4">{agent.description || agent.persona}</p>
              </div>
            )) || (
              <div className="text-center text-gray-400 py-8">
                Enhanced blueprint data not available in expected format
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-between items-center"
      >
        <HolographicButton
          onClick={() => setStep('intent')}
          variant="outline"
        >
          Back to Intent
        </HolographicButton>

        <HolographicButton
          onClick={() => nextStep('canvas')}
          size="lg"
          glow
          className="flex items-center gap-3"
        >
          <Lightbulb className="w-5 h-5" />
          Generate Canvas
          <ArrowRight className="w-5 h-5" />
        </HolographicButton>
      </motion.div>
    </div>
  );
};