import { memo } from 'react';
import { GitBranch, Check, X, AlertCircle } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';

export interface ConditionNodeData {
  label: string;
  condition: string;
  description?: string;
  status?: 'active' | 'pending' | 'success' | 'error';
  trueLabel?: string;
  falseLabel?: string;
  config?: Record<string, any>;
}

interface ConditionNodeProps {
  data: ConditionNodeData;
  selected: boolean;
}

const ConditionNode = memo(({ data, selected }: ConditionNodeProps) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'active': return 'border-blue-500 shadow-blue-500/20';
      case 'success': return 'border-emerald-500 shadow-emerald-500/20';
      case 'error': return 'border-red-500 shadow-red-500/20';
      default: return 'border-border/50';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'success': return <Check className="w-3 h-3 text-emerald-500" />;
      case 'error': return <X className="w-3 h-3 text-red-500" />;
      case 'active': return <AlertCircle className="w-3 h-3 text-blue-500" />;
      default: return <GitBranch className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className={`
      relative min-w-[220px] rounded-xl border-2 transition-all duration-200
      ${selected ? 'border-primary shadow-lg shadow-primary/20' : getStatusColor()}
      bg-card/95 backdrop-blur-sm shadow-lg hover:shadow-xl
    `}>
      {/* Top gradient bar */}
      <div className="h-1 rounded-t-xl bg-gradient-to-r from-amber-500 to-orange-500" />
      
      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 border-2 border-amber-500 bg-background"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="true"
        className="w-3 h-3 border-2 border-emerald-500 bg-background"
        style={{ top: '35%' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="false"
        className="w-3 h-3 border-2 border-red-500 bg-background"
        style={{ top: '65%' }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{data.label}</h3>
            <p className="text-xs text-muted-foreground uppercase">Decision Point</p>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
          </div>
        </div>

        {/* Condition */}
        <div className="mb-3 p-2 bg-muted/50 rounded-lg">
          <p className="text-sm font-mono text-foreground">{data.condition}</p>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
        )}

        {/* True/False Labels */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-600">{data.trueLabel || 'True'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-600">{data.falseLabel || 'False'}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;