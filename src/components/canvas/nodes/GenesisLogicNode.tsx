import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Filter, ToggleLeft } from 'lucide-react';

export const GenesisLogicNode: React.FC<any> = ({ data }) => {
  const getLogicIcon = () => {
    switch (data?.conditionType) {
      case 'if': return <GitBranch className="w-6 h-6 text-red-400" />;
      case 'filter': return <Filter className="w-6 h-6 text-purple-400" />;
      default: return <ToggleLeft className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-red-900/20 to-pink-900/20 border border-red-500/30 rounded-lg p-4 min-w-[180px] backdrop-blur-sm">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          {getLogicIcon()}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full" />
        </div>
        <div>
          <h3 className="text-white font-medium text-sm">{data?.label || 'Logic'}</h3>
          <p className="text-red-300 text-xs">{data?.conditionType || 'condition'}</p>
        </div>
      </div>

      <div className="text-xs text-red-200">
        {data?.condition || 'Decision point'}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};