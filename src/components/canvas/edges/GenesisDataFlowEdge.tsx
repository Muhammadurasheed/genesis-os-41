import React from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

export const GenesisDataFlowEdge: React.FC<any> = (props) => {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge 
      path={edgePath} 
      markerEnd={markerEnd} 
      style={{
        stroke: '#6366f1',
        strokeWidth: 2,
        ...style
      }} 
    />
  );
};