import { memo } from 'react';
import { Plug, Settings, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

export interface IntegrationNodeData {
  label: string;
  service: string;
  action?: string;
  description?: string;
  status?: 'connected' | 'connecting' | 'error' | 'pending';
  icon?: any;
  color?: string;
  authenticated?: boolean;
  config?: Record<string, any>;
}

interface IntegrationNodeProps {
  data: IntegrationNodeData;
  selected: boolean;
}

export const IntegrationNode = memo(({ data, selected }: IntegrationNodeProps) => {
  const Icon = data.icon || Plug;
  
  const getStatusColor = () => {
    switch (data.status) {
      case 'connected': return 'border-emerald-500 shadow-emerald-500/20';
      case 'connecting': return 'border-blue-500 shadow-blue-500/20';
      case 'error': return 'border-red-500 shadow-red-500/20';
      default: return 'border-border/50';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'connected': return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case 'connecting': return <Clock className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'error': return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = () => {
    switch (data.status) {
      case 'connected': return <Badge variant="default" className="bg-emerald-500 text-white text-xs">Connected</Badge>;
      case 'connecting': return <Badge variant="secondary" className="text-xs">Connecting...</Badge>;
      case 'error': return <Badge variant="destructive" className="text-xs">Error</Badge>;
      default: return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  return (
    <div className={`
      relative min-w-[200px] rounded-xl border-2 transition-all duration-200
      ${selected ? 'border-primary shadow-lg shadow-primary/20' : getStatusColor()}
      bg-card/95 backdrop-blur-sm shadow-lg hover:shadow-xl
    `}>
      {/* Top gradient bar */}
      <div className={`h-1 rounded-t-xl bg-gradient-to-r ${data.color || 'from-blue-500 to-cyan-500'}`} />
      
      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 border-2 border-blue-500 bg-background"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 border-2 border-blue-500 bg-background"
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${data.color || 'from-blue-500 to-cyan-500'}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{data.label}</h3>
            <p className="text-xs text-muted-foreground">{data.service}</p>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
          </div>
        </div>

        {/* Action */}
        {data.action && (
          <div className="mb-3 p-2 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground">{data.action}</p>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Settings className="w-3 h-3" />
          </Button>
        </div>

        {/* Authentication indicator */}
        {data.authenticated !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${data.authenticated ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {data.authenticated ? 'Authenticated' : 'Auth Required'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

IntegrationNode.displayName = 'IntegrationNode';