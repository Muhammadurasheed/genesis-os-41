
import React from 'react';
import { EnhancedNodeConfigPanel } from './EnhancedNodeConfigPanel';

interface NodeData {
  type: string;
  label: string;
  [key: string]: any;
}

interface NodeConfigPanelProps {
  nodeId: string;
  data: NodeData;
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onClose: () => void;
  onDelete?: (nodeId: string) => void;
  workflowId?: string;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ 
  nodeId, 
  data, 
  onUpdate, 
  onClose,
  onDelete,
  workflowId
}) => {
  // Use enhanced panel for better UX
  return (
    <EnhancedNodeConfigPanel
      nodeId={nodeId}
      data={data}
      onUpdate={onUpdate}
      onClose={onClose}
      onDelete={onDelete}
      workflowId={workflowId}
    />
  );
};
