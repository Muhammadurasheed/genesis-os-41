import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  Activity, 
  Terminal, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { simulationIntegrationService } from '../../services/simulationIntegrationService';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  data?: any;
}

interface ComprehensiveDebugPanelProps {
  simulationId?: string;
}

export const ComprehensiveDebugPanel: React.FC<ComprehensiveDebugPanelProps> = ({ 
  simulationId 
}) => {
  const [debugData, setDebugData] = useState<{
    real_time_logs: DebugLog[];
    performance_metrics: any;
    agent_interactions: any[];
    system_health: any;
  }>({
    real_time_logs: [],
    performance_metrics: {},
    agent_interactions: [],
    system_health: {}
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring && simulationId) {
      interval = setInterval(async () => {
        try {
          const data = await simulationIntegrationService.getSimulationDebugData(simulationId);
          setDebugData(data);
        } catch (error) {
          console.error('Failed to fetch debug data:', error);
        }
      }, 1000); // Real-time updates every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, simulationId]);

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-400" />;
      default: return <Terminal className="w-4 h-4 text-green-400" />;
    }
  };

  const filteredLogs = debugData.real_time_logs.filter(log => 
    selectedLogLevel === 'all' || log.level === selectedLogLevel
  );

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bug className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-white">Debug Panel</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isMonitoring ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-500/20 border border-gray-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-white">
              {isMonitoring ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedLogLevel}
            onChange={(e) => setSelectedLogLevel(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          >
            <option value="all">All Logs</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          
          <HolographicButton
            variant={isMonitoring ? "secondary" : "primary"}
            size="sm"
            onClick={toggleMonitoring}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </HolographicButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Performance Metrics */}
        <GlassCard variant="medium" className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">CPU Usage</span>
              <span className="text-sm text-white">{debugData.performance_metrics.cpu_usage || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Memory</span>
              <span className="text-sm text-white">{debugData.performance_metrics.memory_usage || 0}MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Response Time</span>
              <span className="text-sm text-white">{debugData.performance_metrics.response_time || 0}ms</span>
            </div>
          </div>
        </GlassCard>

        {/* System Health */}
        <GlassCard variant="medium" className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">System Health</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Status</span>
              <span className="text-sm text-green-400">{debugData.system_health.status || 'healthy'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Uptime</span>
              <span className="text-sm text-white">{debugData.system_health.uptime || '100%'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Active Agents</span>
              <span className="text-sm text-white">{debugData.agent_interactions.length}</span>
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard variant="medium" className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Terminal className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <HolographicButton variant="outline" size="sm" className="w-full">
              Clear Logs
            </HolographicButton>
            <HolographicButton variant="outline" size="sm" className="w-full">
              Export Debug Data
            </HolographicButton>
            <HolographicButton variant="outline" size="sm" className="w-full">
              Reset Metrics
            </HolographicButton>
          </div>
        </GlassCard>
      </div>

      {/* Real-time Logs */}
      <GlassCard variant="medium" className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Terminal className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Real-time Logs</h3>
          <span className="text-sm text-gray-400">({filteredLogs.length} entries)</span>
        </div>
        
        <div className="h-96 overflow-y-auto space-y-2 bg-black/30 rounded-lg p-4 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No logs available. Start monitoring to see real-time data.
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-3 py-1">
                <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                  {getLogLevelIcon(log.level)}
                  <span className="text-xs text-gray-400">{log.source}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-white break-words">{log.message}</span>
                  {log.data && (
                    <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </GlassCard>
  );
};