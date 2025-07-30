
import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Network,
  Sliders,
  Settings
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface WorkflowExecution {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  duration: string;
  progress: number;
}

interface WorkflowMonitoringDashboardProps {
  onPauseWorkflow: (workflowId: string) => void;
  onResumeWorkflow: (workflowId: string) => void;
  onRestartWorkflow: (workflowId: string) => void;
}

export const WorkflowMonitoringDashboard: React.FC<WorkflowMonitoringDashboardProps> = ({
  onPauseWorkflow,
  onResumeWorkflow,
  onRestartWorkflow
}) => {
  const [executions] = useState<WorkflowExecution[]>([
    {
      id: '1',
      name: 'Customer Onboarding Flow',
      status: 'running',
      startTime: '2:30 PM',
      duration: '5m 23s',
      progress: 65
    },
    {
      id: '2', 
      name: 'Lead Processing Pipeline',
      status: 'completed',
      startTime: '1:15 PM',
      duration: '12m 45s',
      progress: 100
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'paused': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const renderActionButton = (execution: WorkflowExecution) => {
    if (execution.status === 'running') {
      return (
        <HolographicButton 
          variant="secondary" 
          size="sm"
          onClick={() => onPauseWorkflow(execution.id)}
        >
          <Pause className="w-4 h-4 mr-2" />
          Pause
        </HolographicButton>
      );
    } else if (execution.status === 'paused') {
      return (
        <HolographicButton 
          variant="primary" 
          size="sm"
          onClick={() => onResumeWorkflow(execution.id)}
        >
          <Play className="w-4 h-4 mr-2" />
          Resume
        </HolographicButton>
      );
    } else {
      return (
        <HolographicButton 
          variant="secondary" 
          size="sm"
          onClick={() => onRestartWorkflow(execution.id)}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart
        </HolographicButton>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Workflow Monitoring</h2>
        <HolographicButton variant="secondary" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </HolographicButton>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard variant="medium" className="p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-white/60">Active Workflows</p>
              <p className="text-xl font-bold text-white">3</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="p-4">
          <div className="flex items-center space-x-3">
            <Cpu className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-white/60">CPU Usage</p>
              <p className="text-xl font-bold text-white">45%</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="p-4">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-white/60">Memory</p>
              <p className="text-xl font-bold text-white">2.1GB</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="p-4">
          <div className="flex items-center space-x-3">
            <Network className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-sm text-white/60">Network</p>
              <p className="text-xl font-bold text-white">12MB/s</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Control Panel */}
      <GlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Quick Controls</h3>
          <Sliders className="w-5 h-5 text-white/60" />
        </div>
        
        <div className="flex space-x-4">
          <HolographicButton variant="primary" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Start All
          </HolographicButton>
          <HolographicButton variant="secondary" size="sm">
            <Pause className="w-4 h-4 mr-2" />
            Pause All
          </HolographicButton>
          <HolographicButton variant="secondary" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart All
          </HolographicButton>
        </div>
      </GlassCard>

      {/* Active Executions */}
      <GlassCard variant="medium" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Executions</h3>
        
        <div className="space-y-4">
          {executions.map((execution) => (
            <div 
              key={execution.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(execution.status)}
                  <div>
                    <h4 className="font-medium text-white">{execution.name}</h4>
                    <p className="text-sm text-white/60">
                      Started at {execution.startTime} • Duration: {execution.duration}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(execution.status)}`}>
                      {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                    </p>
                    <p className="text-sm text-white/60">{execution.progress}%</p>
                  </div>
                  {renderActionButton(execution)}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${execution.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
