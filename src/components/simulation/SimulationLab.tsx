
import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Settings, 
  Monitor, 
  Bot
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface Scenario {
  id: string;
  name: string;
  description: string;
}

interface SimulationLabProps {
  onRunSimulation: (config: any) => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({
  onRunSimulation
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('customer-service');
  const [isRealTime, setIsRealTime] = useState(false);

  const scenarios: Scenario[] = [
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

  const handleRunSimulation = () => {
    setIsRunning(true);
    const config = {
      scenario: selectedScenario,
      realTime: isRealTime
    };
    onRunSimulation(config);
    setTimeout(() => setIsRunning(false), 5000);
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedScenario(e.target.value);
  };

  const handleRealTimeToggle = () => {
    setIsRealTime(!isRealTime);
  };

  return (
    <GlassCard variant="medium" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Simulation Lab</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">Live</span>
          </div>
          <HolographicButton variant="secondary" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </HolographicButton>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">
          Select Scenario
        </label>
        <select
          value={selectedScenario}
          onChange={handleScenarioChange}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
        >
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isRealTime}
            onChange={handleRealTimeToggle}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-sm font-medium text-white">Real-Time Simulation</span>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-yellow-400">
            Awaiting configuration
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <HolographicButton
            variant="secondary"
            size="sm"
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </HolographicButton>
          <HolographicButton
            variant="primary"
            size="sm"
            onClick={handleRunSimulation}
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
  );
};
