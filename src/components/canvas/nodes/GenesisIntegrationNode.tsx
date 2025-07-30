import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const GenesisIntegrationNode: React.FC<any> = ({ data }) => {
  const getServiceIcon = () => {
    const service = data?.service?.toLowerCase() || '';
    if (service.includes('slack')) return '💬';
    if (service.includes('slack')) return '💬';
    if (service.includes('gmail') || service.includes('email')) return '📧';
    if (service.includes('database') || service.includes('db')) return '🗄️';
    if (service.includes('api')) return '🔌';
    if (service.includes('webhook')) return '🔗';
    if (service.includes('microsoft') || service.includes('entra')) return '🏢';
    if (service.includes('jira')) return '📋';
    return '🔌'; // Default API icon
  };

  const getStatusColor = () => {
    if (data?.status === 'connected') return '#10b981';
    if (data?.status === 'error') return '#ef4444';
    return '#6b7280';
  };

  const getServiceName = () => {
    const service = data?.service || '';
    if (service.toLowerCase().includes('microsoft')) return 'Microsoft Entra ID';
    if (service.toLowerCase().includes('jira')) return 'Jira Software';
    return service || 'External Service';
  };

  const getActionText = () => {
    const action = data?.action || '';
    if (action.toLowerCase().includes('create')) return 'getAll user';
    if (action.toLowerCase().includes('update')) return 'Update profile';
    return action || 'API Call';
  };

  return (
    <div className="relative bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border-2 border-blue-300 p-4 min-w-[180px] max-w-[200px] group hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
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
        {/* Large icon */}
        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-2xl border border-blue-200">
          {getServiceIcon()}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-gray-800 font-semibold text-sm leading-tight">
            {data?.label || getServiceName()}
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            {getActionText()}
          </p>
        </div>

        {/* Service info */}
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
          <div className="text-xs text-gray-600 text-center">
            <span className="font-medium">{getServiceName()}</span>
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