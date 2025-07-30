
import React, { useState } from 'react';
import { Play, Pause, Globe, Bot, ExternalLink, Settings, Zap, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface ChannelDeploymentProps {
  guildId: string;
  onDeploy: (channelData: any) => void;
}

export const ChannelDeployment: React.FC<ChannelDeploymentProps> = ({ guildId, onDeploy }) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const channels = [
    { id: 'web', name: 'Web Chat', icon: Globe, description: 'Deploy as web widget' },
    { id: 'discord', name: 'Discord Bot', icon: Bot, description: 'Deploy to Discord server' },
    { id: 'slack', name: 'Slack Bot', icon: Bot, description: 'Deploy to Slack workspace' },
    { id: 'api', name: 'API Endpoint', icon: ExternalLink, description: 'Deploy as REST API' },
  ];

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleDeploy = () => {
    onDeploy({ channels: selectedChannels, guildId });
  };

  return (
    <GlassCard variant="medium" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Channel Deployment</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">Live</span>
          </div>
          <HolographicButton variant="secondary" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </HolographicButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const isSelected = selectedChannels.includes(channel.id);
          
          return (
            <div
              key={channel.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => toggleChannel(channel.id)}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-8 h-8 text-white" />
                <div>
                  <h3 className="text-lg font-semibold text-white">{channel.name}</h3>
                  <p className="text-sm text-white/60">{channel.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deployment Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Deployment Status</h3>
        <div className="space-y-3">
          {selectedChannels.map((channelId) => {
            const channel = channels.find(c => c.id === channelId);
            if (!channel) return null;
            
            return (
              <div key={channelId} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center space-x-3">
                  <channel.icon className="w-5 h-5 text-white" />
                  <span className="text-white">{channel.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-400">Active</span>
                  <HolographicButton variant="secondary" size="sm">
                    <Pause className="w-4 h-4" />
                  </HolographicButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Rate Limit (requests/minute)
            </label>
            <input
              type="number"
              defaultValue="100"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60"
              placeholder="Enter rate limit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Max Response Time (seconds)
            </label>
            <input
              type="number"
              defaultValue="30"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60"
              placeholder="Enter max response time"
            />
          </div>
        </div>
      </div>

      {/* Deployment Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-yellow-400">
            {selectedChannels.length} channels selected
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <HolographicButton variant="secondary" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
          </HolographicButton>
          <HolographicButton 
            variant="primary" 
            size="sm"
            onClick={handleDeploy}
            disabled={selectedChannels.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            Deploy Now
          </HolographicButton>
        </div>
      </div>
    </GlassCard>
  );
};
