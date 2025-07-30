
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, Settings, Play, Pause, AlertCircle } from 'lucide-react';

const AgentNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as any;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'executing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executing': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'error': return <AlertCircle className="h-3 w-3" />;
      default: return null;
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
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Bot className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{nodeData.label}</h3>
          <p className="text-xs text-gray-600">{nodeData.role}</p>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Settings className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-2">
        <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(nodeData.status)}`}>
          <div className="flex items-center space-x-1">
            {getStatusIcon(nodeData.status)}
            <span className="capitalize">{nodeData.status}</span>
          </div>
        </div>
        
        {nodeData.tools && nodeData.tools.length > 0 && (
          <div className="text-xs text-gray-600">
            Tools: {nodeData.tools.slice(0, 2).join(', ')}
            {nodeData.tools.length > 2 && ` +${nodeData.tools.length - 2} more`}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
});

AgentNode.displayName = 'AgentNode';

export default AgentNode;
