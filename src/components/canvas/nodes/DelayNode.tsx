
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock, Timer, Pause, Settings } from 'lucide-react';

const DelayNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as any;

  const getDelayIcon = (type: string) => {
    switch (type) {
      case 'fixed': return <Clock className="h-5 w-5" />;
      case 'dynamic': return <Timer className="h-5 w-5" />;
      case 'conditional': return <Pause className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paused': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDelayColor = (type: string) => {
    switch (type) {
      case 'fixed': return 'bg-blue-50 text-blue-600';
      case 'dynamic': return 'bg-purple-50 text-purple-600';
      case 'conditional': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div
      className={`
        relative bg-white rounded-lg shadow-md border-2 p-4 min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
      
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${getDelayColor(nodeData.delayType)}`}>
          {getDelayIcon(nodeData.delayType)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{nodeData.label}</h3>
          <p className="text-xs text-gray-600 capitalize">{nodeData.delayType}</p>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Settings className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-2">
        <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(nodeData.status)}`}>
          <span className="capitalize">{nodeData.status}</span>
        </div>
        
        {nodeData.duration && (
          <div className="text-xs text-gray-600">
            Duration: {nodeData.duration}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';

export default DelayNode;
