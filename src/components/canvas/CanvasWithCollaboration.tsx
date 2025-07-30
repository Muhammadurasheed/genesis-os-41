import { useState } from 'react';
import { ProductionCanvas } from './ProductionCanvas';
import { InviteCollaboratorDialog } from '../collaboration/InviteCollaboratorDialog';
import { Node } from '@xyflow/react';
import { NodeData, CanvasEdge } from '../../types/canvas';

interface CanvasWithCollaborationProps {
  nodes?: Node<NodeData>[];
  edges?: CanvasEdge[];
  onSaveBlueprint: () => void;
  onRunSimulation: () => void;
  isLoading?: boolean;
}

export function CanvasWithCollaboration({
  nodes = [],
  edges = [],
  onSaveBlueprint,
  onRunSimulation,
  isLoading = false
}: CanvasWithCollaborationProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const handleInviteCollaborator = () => {
    setShowInviteDialog(true);
  };

  const handleShareWorkflow = () => {
    const shareUrl = `${window.location.origin}/canvas/shared/${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <>
      <ProductionCanvas
        nodes={nodes}
        edges={edges}
        onSaveBlueprint={onSaveBlueprint}
        onRunSimulation={onRunSimulation}
        onInviteCollaborator={handleInviteCollaborator}
        onShareWorkflow={handleShareWorkflow}
        isLoading={isLoading}
      />
      
      <InviteCollaboratorDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        workflowId={`workflow-${Date.now()}`}
      />
    </>
  );
}