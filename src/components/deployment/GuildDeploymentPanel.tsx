
import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  Users, 
  Bot, 
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Monitor,
  MessageSquare,
  Clock
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error';
  type: string;
  lastActivity: string;
  performance: number;
}

interface GuildDeploymentPanelProps {
  guildId: string;
  guildName: string;
  agents: Agent[];
  onDeploy: (guildId: string) => void;
  onPause: (guildId: string) => void;
  onConfigure: (guildId: string) => void;
}

export const GuildDeploymentPanel: React.FC<GuildDeploymentPanelProps> = ({
  guildId,
  guildName,
  agents,
  onDeploy,
  onPause,
  onConfigure
}) => {
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'deployed' | 'error'>('idle');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleDeploy = () => {
    setDeploymentStatus('deploying');
    onDeploy(guildId);
    // Simulate deployment process
    setTimeout(() => {
      setDeploymentStatus('deployed');
    }, 3000);
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const deploymentChannels = [
    { id: 'web', name: 'Web Interface', icon: Monitor, active: true },
    { id: 'api', name: 'API Gateway', icon: Zap, active: true },
    { id: 'chat', name: 'Chat Platform', icon: MessageSquare, active: false },
    { id: 'webhook', name: 'Webhooks', icon: Settings, active: false },
  ];

  return (
    <GlassCard variant="medium" className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{guildName}</h2>
            <p className="text-white/60">Guild Deployment Management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            deploymentStatus === 'deployed' 
              ? 'bg-green-500/20 text-green-400' 
              : deploymentStatus === 'deploying'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {deploymentStatus === 'deployed' ? 'Live' : 
             deploymentStatus === 'deploying' ? 'Deploying...' : 'Idle'}
          </div>
        </div>
      </div>

      {/* Deployment Channels */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Deployment Channels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {deploymentChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                className={`p-3 rounded-lg border transition-all ${
                  channel.active
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">{channel.name}</p>
                    <p className={`text-xs ${channel.active ? 'text-green-400' : 'text-gray-400'}`}>
                      {channel.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agents List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Agents ({agents.length})</h3>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAgents.includes(agent.id)
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => toggleAgentSelection(agent.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bot className="w-6 h-6 text-white" />
                  <div>
                    <h4 className="font-medium text-white">{agent.name}</h4>
                    <p className="text-sm text-white/60">{agent.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(agent.status)}
                      <span className={`text-sm font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-white/60">
                      <Clock className="w-3 h-3" />
                      <span>{agent.lastActivity}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{agent.performance}%</div>
                    <div className="text-xs text-white/60">Performance</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-white/60" />
            <span className="text-sm text-white/60">
              {selectedAgents.length} of {agents.length} agents selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-white/60" />
            <span className="text-sm text-white/60">
              Avg Performance: {Math.round(agents.reduce((acc, agent) => acc + agent.performance, 0) / agents.length)}%
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <HolographicButton
            variant="secondary"
            size="sm"
            onClick={() => onConfigure(guildId)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </HolographicButton>
          
          {deploymentStatus === 'deployed' ? (
            <HolographicButton
              variant="secondary"
              size="sm"
              onClick={() => onPause(guildId)}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </HolographicButton>
          ) : (
            <HolographicButton
              variant="primary"
              size="sm"
              onClick={handleDeploy}
              disabled={selectedAgents.length === 0 || deploymentStatus === 'deploying'}
            >
              <Play className="w-4 h-4 mr-2" />
              {deploymentStatus === 'deploying' ? 'Deploying...' : 'Deploy Guild'}
            </HolographicButton>
          )}
        </div>
      </div>

      {/* Deployment Progress */}
      {deploymentStatus === 'deploying' && (
        <div className="mt-4 p-4 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-400">Deploying guild to selected channels...</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
