import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Activity,
  TrendingUp
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { backendSimulationService, SimulationConfig, SimulationResults } from '../../services/backendSimulationService';
import { toast } from 'sonner';

interface ProductionSimulationLabProps {
  guildId: string;
  agents: any[];
}

export const ProductionSimulationLab: React.FC<ProductionSimulationLabProps> = ({ 
  guildId, 
  agents = [] 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentResults, setCurrentResults] = useState<SimulationResults | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('comprehensive');
  const [loadFactor, setLoadFactor] = useState(1.0);
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [errorInjection, setErrorInjection] = useState(false);

  const scenarios = [
    {
      id: 'comprehensive',
      name: 'Comprehensive Guild Test',
      description: 'Full simulation testing all agents with realistic workloads',
      testScenarios: ['customer_service', 'data_analysis', 'workflow_optimization']
    },
    {
      id: 'stress_test',
      name: 'High Load Stress Test',
      description: 'Tests guild performance under heavy load conditions',
      testScenarios: ['high_volume_requests', 'concurrent_processing', 'resource_limits']
    },
    {
      id: 'error_resilience',
      name: 'Error Resilience Test',
      description: 'Validates how agents handle failures and recover',
      testScenarios: ['api_failures', 'timeout_scenarios', 'invalid_inputs']
    },
    {
      id: 'real_world',
      name: 'Real-world Simulation',
      description: 'Simulates actual production scenarios and use cases',
      testScenarios: ['customer_interactions', 'business_processes', 'integration_flows']
    }
  ];

  const handleRunSimulation = async () => {
    if (!guildId || agents.length === 0) {
      toast.error('Guild ID and agents are required for simulation');
      return;
    }

    const scenario = scenarios.find(s => s.id === selectedScenario);
    if (!scenario) {
      toast.error('Invalid scenario selected');
      return;
    }

    setIsRunning(true);
    setCurrentResults(null);

    try {
      const config: SimulationConfig = {
        guildId,
        agents,
        durationMinutes,
        loadFactor,
        errorInjection,
        testScenarios: scenario.testScenarios
      };

      toast.info('Starting simulation...', { 
        description: `Testing ${agents.length} agents with ${scenario.name}`
      });

      const results = await backendSimulationService.runSimulation(config);
      
      setCurrentResults(results);
      toast.success('Simulation completed successfully!', {
        description: `Processed ${agents.length} agents in ${results.metrics?.total_execution_time || 'unknown'} seconds`
      });

    } catch (error) {
      console.error('Simulation failed:', error);
      toast.error('Simulation failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopSimulation = () => {
    setIsRunning(false);
    toast.info('Simulation stopped');
  };

  const renderSimulationResults = () => {
    if (!currentResults) return null;

    return (
      <GlassCard variant="medium" className="mt-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Simulation Results</h3>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400">Completed</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Agent Responses</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {currentResults.agentResponses?.length || 0}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {currentResults.metrics?.success_rate ? `${(currentResults.metrics.success_rate * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">Avg Response Time</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {currentResults.metrics?.average_response_time ? `${currentResults.metrics.average_response_time.toFixed(0)}ms` : 'N/A'}
            </div>
          </div>
        </div>

        {currentResults.insights && currentResults.insights.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-3">Key Insights</h4>
            <div className="space-y-2">
              {currentResults.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-300">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentResults.recommendations && currentResults.recommendations.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Recommendations</h4>
            <div className="space-y-2">
              {currentResults.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    );
  };

  return (
    <div className="space-y-6">
      <GlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Production Simulation Lab</h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">{agents.length} Agents</span>
            </div>
            <HolographicButton variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Config
            </HolographicButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Simulation Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
              disabled={isRunning}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id} className="bg-gray-900">
                  {scenario.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {scenarios.find(s => s.id === selectedScenario)?.description}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Duration (minutes): {durationMinutes}
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full"
                disabled={isRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Load Factor: {loadFactor}x
              </label>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.1}
                value={loadFactor}
                onChange={(e) => setLoadFactor(Number(e.target.value))}
                className="w-full"
                disabled={isRunning}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="errorInjection"
                checked={errorInjection}
                onChange={(e) => setErrorInjection(e.target.checked)}
                className="rounded"
                disabled={isRunning}
              />
              <label htmlFor="errorInjection" className="text-sm text-white">
                Enable Error Injection Testing
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-yellow-400">
              Guild: {guildId}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <HolographicButton
              variant="primary"
              size="md"
              onClick={isRunning ? handleStopSimulation : handleRunSimulation}
              disabled={agents.length === 0}
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
            
            {currentResults && (
              <HolographicButton variant="secondary" size="md">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Full Report
              </HolographicButton>
            )}
          </div>
        </div>
      </GlassCard>

      {renderSimulationResults()}
    </div>
  );
};