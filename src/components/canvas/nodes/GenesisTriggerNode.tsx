import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const GenesisTriggerNode: React.FC<any> = ({ data }) => {
  const getTriggerIcon = () => {
    const type = data?.triggerType || 'manual';
    switch (type) {
      case 'schedule': return '⏰';
      case 'webhook': return '🔗';
      case 'manual': return '👆';
      case 'form': return '📝';
      default: return '⚡';
    }
  };

  const getStatusColor = () => {
    if (data?.status === 'active') return '#10b981';
    if (data?.status === 'triggered') return '#f59e0b';
    return '#6b7280';
  };

  return (
    <div className="relative bg-white/95 backdrop-blur-sm rounded-full shadow-xl border-2 border-green-300 p-6 w-[160px] h-[160px] group hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center">
      {/* Status indicator */}
      <div 
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: getStatusColor() }}
      />

      {/* Main content */}
      <div className="text-center space-y-3">
        {/* Large icon */}
        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-2xl border border-green-200">
          {getTriggerIcon()}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-gray-800 font-semibold text-sm leading-tight">
            {data?.label || "On 'Create User' form"}
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            submission
          </p>
        </div>

        {/* Trigger info */}
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
          <div className="text-xs text-gray-600 text-center">
            <span className="font-medium capitalize">{data?.triggerType || 'manual'}</span> trigger
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-gray-400 border-2 border-white shadow-sm"
      />
    </div>
  );
};