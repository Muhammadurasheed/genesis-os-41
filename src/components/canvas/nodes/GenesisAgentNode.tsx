import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const GenesisAgentNode: React.FC<any> = ({ data }) => {
  const statusColors = {
    ready: '#10b981',
    processing: '#f59e0b', 
    success: '#6366f1',
    error: '#ef4444',
    learning: '#8b5cf6'
  };

  const getStatusColor = () => statusColors[data?.status as keyof typeof statusColors] || '#6366f1';

  // Get AI model icon based on model type
  const getModelIcon = () => {
    const model = data?.model?.toLowerCase() || '';
    if (model.includes('anthropic') || model.includes('claude')) {
      return '🤖'; // Anthropic Claude
    } else if (model.includes('gpt') || model.includes('openai')) {
      return '🧠'; // OpenAI GPT
    } else if (model.includes('gemini')) {
      return '💎'; // Google Gemini
    } else if (model.includes('llama')) {
      return '🦙'; // Meta LLaMA
    }
    return '🤖'; // Default
  };

  return (
    <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 p-4 min-w-[200px] max-w-[220px] group hover:shadow-2xl transition-all duration-300">
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-gray-400 border-2 border-white shadow-sm"
      />
      
      {/* Status indicator */}
      <div 
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: getStatusColor() }}
      />

      {/* Main content */}
      <div className="text-center space-y-3">
        {/* Large icon/avatar */}
        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center text-2xl border border-purple-200">
          {getModelIcon()}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-gray-800 font-semibold text-sm leading-tight">
            {data?.label || 'AI Agent'}
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            {data?.role || 'Tools Agent'}
          </p>
        </div>

        {/* Model info */}
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <span className="font-medium">{data?.model || 'Anthropic Chat'}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data?.capabilities?.length || 0} Memory
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