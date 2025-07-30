
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, Clock, Webhook, MousePointer, Settings } from 'lucide-react';

const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as any;

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'manual': return <MousePointer className="h-5 w-5" />;
      case 'schedule': return <Clock className="h-5 w-5" />;
      case 'webhook': return <Webhook className="h-5 w-5" />;
      case 'event': return <Zap className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'triggered': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-50 text-blue-600';
      case 'schedule': return 'bg-green-50 text-green-600';
      case 'webhook': return 'bg-purple-50 text-purple-600';
      case 'event': return 'bg-orange-50 text-orange-600';
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
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${getTriggerColor(nodeData.triggerType)}`}>
          {getTriggerIcon(nodeData.triggerType)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{nodeData.label}</h3>
          <p className="text-xs text-gray-600 capitalize">{nodeData.triggerType}</p>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Settings className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-2">
        <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(nodeData.status)}`}>
          <span className="capitalize">{nodeData.status}</span>
        </div>
        
        {nodeData.schedule && nodeData.triggerType === 'schedule' && (
          <div className="text-xs text-gray-600">
            Next: {nodeData.schedule.nextRun || 'Not scheduled'}
          </div>
        )}
        
        {nodeData.webhook && nodeData.triggerType === 'webhook' && (
          <div className="text-xs text-gray-600">
            Method: {nodeData.webhook.method || 'POST'}
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

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode;
