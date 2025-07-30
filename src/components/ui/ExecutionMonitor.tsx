import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Zap,
  Pause,
  Play,
  Square,
  BarChart3,
  Cpu,
  Database
} from 'lucide-react';
import { GlassCard } from './GlassCard';

interface ExecutionMonitorProps {
  executionState: any;
  nodes: any[];
  edges: any[];
  className?: string;
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
  nodes,
  edges,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock execution data
  const mockMetrics = {
    status: 'running',
    progress: 65,
    currentNode: 'agent-1',
    executedNodes: 3,
    totalNodes: nodes.length || 8,
    executionTime: '2.4s',
    throughput: '145/min',
    errorRate: '0.2%',
    activeConnections: edges.length || 6
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 text-green-400 animate-pulse" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'completed': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-64 ${className}`}
    >
      <GlassCard variant="intense" className="p-0 bg-black/90 border-white/40">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-white/10 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {getStatusIcon(mockMetrics.status)}
            <div>
              <h3 className="text-white font-medium text-sm">Execution Monitor</h3>
              <p className={`text-xs capitalize ${getStatusColor(mockMetrics.status)}`}>
                {mockMetrics.status}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-white text-sm font-medium">{mockMetrics.progress}%</p>
              <p className="text-white/60 text-xs">{mockMetrics.executedNodes}/{mockMetrics.totalNodes} nodes</p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="w-4 h-4 text-white/60"
            >
              ▼
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Progress Bar */}
              <div className="p-4 border-b border-white/10">
                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${mockMetrics.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>Progress</span>
                  <span>{mockMetrics.executionTime} elapsed</span>
                </div>
              </div>

              {/* Real-time Metrics */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-blue-400" />
                      <span className="text-white/80 text-xs">Throughput</span>
                    </div>
                    <p className="text-white font-medium text-sm">{mockMetrics.throughput}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      <span className="text-white/80 text-xs">Error Rate</span>
                    </div>
                    <p className="text-white font-medium text-sm">{mockMetrics.errorRate}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3 h-3 text-purple-400" />
                      <span className="text-white/80 text-xs">Active Nodes</span>
                    </div>
                    <p className="text-white font-medium text-sm">{mockMetrics.executedNodes}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3 text-green-400" />
                      <span className="text-white/80 text-xs">Connections</span>
                    </div>
                    <p className="text-white font-medium text-sm">{mockMetrics.activeConnections}</p>
                  </div>
                </div>

                {/* Current Execution */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-white/80 text-xs mb-2">Current Execution</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-blue-400 text-sm">Processing Agent</span>
                      </div>
                      <span className="text-white/60 text-xs">1.2s</span>
                    </div>

                    <div className="space-y-1">
                      {[
                        { name: 'Trigger', status: 'completed', time: '0.1s' },
                        { name: 'Data Validation', status: 'completed', time: '0.3s' },
                        { name: 'AI Processing', status: 'running', time: '1.2s' },
                        { name: 'Integration Call', status: 'waiting', time: '-' }
                      ].map((step, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {step.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400" />}
                            {step.status === 'running' && <Activity className="w-3 h-3 text-blue-400 animate-pulse" />}
                            {step.status === 'waiting' && <Clock className="w-3 h-3 text-gray-400" />}
                            <span className={`${step.status === 'completed' ? 'text-green-400' : step.status === 'running' ? 'text-blue-400' : 'text-white/60'}`}>
                              {step.name}
                            </span>
                          </div>
                          <span className="text-white/40">{step.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-3 h-3 text-purple-400" />
                    <span className="text-white/80 text-xs">Performance Trend</span>
                  </div>
                  <div className="flex items-end justify-between h-16 bg-white/5 rounded-lg p-2">
                    {[65, 72, 58, 81, 69, 75, 83, 78].map((value, index) => (
                      <motion.div
                        key={index}
                        className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-sm w-3"
                        initial={{ height: 0 }}
                        animate={{ height: `${(value / 100) * 100}%` }}
                        transition={{ delay: index * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="border-t border-white/10 p-4">
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm">
                    <Play className="w-3 h-3" />
                    Resume
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors text-sm">
                    <Pause className="w-3 h-3" />
                    Pause
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm">
                    <Square className="w-3 h-3" />
                    Stop
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
};