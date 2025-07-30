
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Send, Mail, Database, Webhook, Bell, Settings, CheckCircle, XCircle } from 'lucide-react';

const ActionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as any;

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'api': return <Send className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      case 'webhook': return <Webhook className="h-5 w-5" />;
      case 'notification': return <Bell className="h-5 w-5" />;
      default: return <Send className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'executing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'api': return 'bg-blue-50 text-blue-600';
      case 'email': return 'bg-green-50 text-green-600';
      case 'database': return 'bg-purple-50 text-purple-600';
      case 'webhook': return 'bg-orange-50 text-orange-600';
      case 'notification': return 'bg-yellow-50 text-yellow-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'error': return <XCircle className="h-3 w-3" />;
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
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${getActionColor(nodeData.actionType)}`}>
          {getActionIcon(nodeData.actionType)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{nodeData.label}</h3>
          <p className="text-xs text-gray-600 capitalize">{nodeData.actionType}</p>
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
        
        {nodeData.validation && !nodeData.validation.isValid && (
          <div className="text-xs text-red-600">
            {nodeData.validation.errors.length} validation error(s)
          </div>
        )}
        
        {nodeData.metrics && (
          <div className="text-xs text-gray-600">
            Executed: {nodeData.metrics.executionCount} times
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode;
