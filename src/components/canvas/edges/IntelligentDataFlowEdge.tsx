import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  MarkerType
} from '@xyflow/react';

interface IntelligentDataFlowEdgeProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: any;
  data?: {
    dataType?: string;
    flowRate?: string;
    explanation?: string;
    animated?: boolean;
    connectionType?: 'solid' | 'dashed' | 'dotted';
  };
}

export const IntelligentDataFlowEdge: React.FC<IntelligentDataFlowEdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine connection style based on data type
  const getConnectionStyle = () => {
    const baseStyle = {
      strokeWidth: 2,
      ...style
    };

    if (data?.connectionType === 'dashed') {
      return {
        ...baseStyle,
        strokeDasharray: '8,4',
        stroke: data?.dataType === 'feedback' ? '#f59e0b' : style.stroke
      };
    } else if (data?.connectionType === 'dotted') {
      return {
        ...baseStyle,
        strokeDasharray: '2,3',
        stroke: data?.dataType === 'control' ? '#8b5cf6' : style.stroke
      };
    }

    return baseStyle;
  };

  // Get connection color based on data type
  const getConnectionColor = () => {
    switch (data?.dataType) {
      case 'primary': return '#10b981';
      case 'secondary': return '#6366f1';
      case 'feedback': return '#f59e0b';
      case 'control': return '#8b5cf6';
      case 'error': return '#ef4444';
      default: return style.stroke || '#6366f1';
    }
  };

  const connectionStyle = getConnectionStyle();
  const color = getConnectionColor();

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={MarkerType.ArrowClosed}
        style={{
          ...connectionStyle,
          stroke: color
        }}
        className={data?.animated ? 'animate-pulse' : ''}
      />
      
      {/* Connection explanation tooltip */}
      {data?.explanation && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto group"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {/* Hover indicator */}
            <div className="w-3 h-3 bg-white/20 rounded-full border-2 border-white/40 cursor-help group-hover:bg-white/40 transition-colors" />
            
            {/* Explanation tooltip */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs rounded-lg p-3 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/20 backdrop-blur-sm z-50">
              <div className="font-medium mb-1">Connection Logic</div>
              <div className="text-white/80">{data.explanation}</div>
              
              {/* Arrow pointing down */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/20 rotate-45" />
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};