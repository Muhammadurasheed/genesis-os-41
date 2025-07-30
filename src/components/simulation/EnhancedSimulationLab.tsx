
import React, { useState } from 'react';
import { 
  Play, 
  Pause,
  Settings,
  Users,
  Mic,
  Video,
  Bug
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { simulationIntegrationService } from '../../services/simulationIntegrationService';
import { ComprehensiveDebugPanel } from '../debugging/ComprehensiveDebugPanel';

interface EnhancedSimulationLabProps {
  guildId: string;
}

export const EnhancedSimulationLab: React.FC<EnhancedSimulationLabProps> = ({ guildId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('customer-service');
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const scenarios = [
    {
      id: 'customer-service',
      name: 'Customer Service Simulation',
      description: 'Simulates customer interactions and support processes.'
    },
    {
      id: 'sales-process',
      name: 'Sales Process Simulation', 
      description: 'Models the steps in a typical sales cycle.'
    },
    {
      id: 'marketing-campaign',
      name: 'Marketing Campaign Simulation',
      description: 'Simulates the impact of a marketing campaign on customer engagement.'
    }
  ];

  const handleRunSimulation = async () => {
    try {
      setIsRunning(true);
      
      const simulationRequest = {
        workflow_data: { scenario: selectedScenario, guild_id: guildId },
        simulation_type: videoEnabled ? 'video' : voiceEnabled ? 'voice' : 'basic' as 'basic' | 'voice' | 'video' | 'full',
        participants: {
          voice_enabled: voiceEnabled,
          video_enabled: videoEnabled
        },
        debug_mode: showDebugPanel
      };
      
      const simulationId = await simulationIntegrationService.runSimulation(simulationRequest);
      setCurrentSimulationId(simulationId);
      
      // Enable voice if requested
      if (voiceEnabled) {
        await simulationIntegrationService.enableVoiceSimulation(simulationId, {
          voice_id: 'alloy',
          conversation_flow: [
            { speaker: 'agent', message: 'Hello, how can I help you today?' }
          ]
        });
      }
      
      // Enable video if requested
      if (videoEnabled) {
        await simulationIntegrationService.enableVideoSimulation(simulationId, {
          persona: {
            name: 'Customer Service Agent',
            voice_id: 'alloy'
          },
          script: 'Welcome to our customer service simulation.',
          settings: {
            resolution: '1080p',
            duration: 30
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to start simulation:', error);
      setIsRunning(false);
    }
  };

  const handleStopSimulation = async () => {
    if (currentSimulationId) {
      try {
        await simulationIntegrationService.stopSimulation(currentSimulationId);
      } catch (error) {
        console.error('Failed to stop simulation:', error);
      }
    }
    setIsRunning(false);
    setCurrentSimulationId(null);
  };

  return (
    <div className="space-y-6">
      <GlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Enhanced Simulation Lab</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Live</span>
            </div>
            <HolographicButton 
              variant="secondary" 
              size="sm"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
            >
              <Bug className="w-4 h-4 mr-2" />
              Debug Panel
            </HolographicButton>
            <HolographicButton variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </HolographicButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Select Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Simulation Features
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="rounded border-white/20 bg-white/10"
                />
                <Mic className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white">Voice Conversation (ElevenLabs)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={videoEnabled}
                  onChange={(e) => setVideoEnabled(e.target.checked)}
                  className="rounded border-white/20 bg-white/10"
                />
                <Video className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white">Video Simulation (Tavus)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-yellow-400">
                Guild: {guildId}
              </span>
            </div>
            {currentSimulationId && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400">
                  Simulation ID: {currentSimulationId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <HolographicButton
              variant="primary"
              size="sm"
              onClick={isRunning ? handleStopSimulation : handleRunSimulation}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2 animate-pulse" />
                  Stop Simulation
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </HolographicButton>
          </div>
        </div>
      </GlassCard>

      {/* Debug Panel */}
      {showDebugPanel && currentSimulationId && (
        <ComprehensiveDebugPanel 
          simulationId={currentSimulationId}
        />
      )}
    </div>
  );
};
