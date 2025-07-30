import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface ExecutionMonitorProps {
  isExecuting: boolean;
  executionId: string | null;
  nodeStatuses: Record<string, string>;
  totalNodes: number;
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
  isExecuting,
  executionId,
  nodeStatuses,
  totalNodes
}) => {
  const completedNodes = Object.values(nodeStatuses).filter(status => status === 'completed').length;
  const failedNodes = Object.values(nodeStatuses).filter(status => status === 'failed').length;
  const runningNodes = Object.values(nodeStatuses).filter(status => status === 'running').length;
  const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };


  if (!isExecuting && !executionId) {
    return (
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-white/60">
            <Zap className="w-4 h-4" />
            <span className="text-sm">Ready to execute workflow</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-white/10 border-white/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Execution Monitor</h3>
          <Badge 
            variant={isExecuting ? "default" : completedNodes === totalNodes ? "secondary" : "destructive"}
            className="text-xs"
          >
            {isExecuting ? 'Running' : completedNodes === totalNodes ? 'Completed' : 'Failed'}
          </Badge>
        </div>
        {executionId && (
          <p className="text-white/60 text-xs font-mono">{executionId}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/80">
            <span>Progress</span>
            <span>{completedNodes}/{totalNodes} nodes</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>{completedNodes} completed</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400">
            <Activity className="w-3 h-3" />
            <span>{runningNodes} running</span>
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <XCircle className="w-3 h-3" />
            <span>{failedNodes} failed</span>
          </div>
        </div>

        {/* Node Status List */}
        {Object.keys(nodeStatuses).length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(nodeStatuses).map(([nodeId, status]) => (
              <div key={nodeId} className="flex items-center justify-between text-xs">
                <span className="text-white/70 truncate">{nodeId}</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(status)}
                  <span className="text-white/60 capitalize">{status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};