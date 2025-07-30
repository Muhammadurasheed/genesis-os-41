
import { useState, useCallback } from 'react';
import { Node, useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvasStore';
import { NodeData, CanvasEdge } from '../types/canvas';

/**
 * Hook for providing enhanced canvas control functionality
 */
export function useCanvasControls() {
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [isNodeConfigOpen, setIsNodeConfigOpen] = useState(false);

  const reactFlowInstance = useReactFlow();
  const { getNode } = reactFlowInstance || {}; 
  const { 
    addToHistory, 
    setSelectedNode: storeSetSelectedNode,
    undo,
    redo,
    history,
    historyIndex
  } = useCanvasStore();
  
  // Calculate undo/redo availability
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  // Clear history function
  const clearHistory = useCallback(() => {
    // This would need to be implemented in the store
    console.log('Clear history called');
  }, []);
  
  // Open the node configuration panel
  const openNodeConfig = useCallback((nodeId: string) => {
    if (!getNode) {
      console.error('React Flow not initialized. Cannot find node.');
      return;
    }
    
    const node = getNode(nodeId);
    if (node) {
      const typedNode = node as Node<NodeData>;
      setSelectedNode(typedNode);
      storeSetSelectedNode(typedNode);
      setIsNodeConfigOpen(true);
    }
  }, [getNode, storeSetSelectedNode]);

  // Close the node configuration panel
  const closeNodeConfig = useCallback(() => {
    setIsNodeConfigOpen(false);
    setSelectedNode(null);
    storeSetSelectedNode(null);
  }, [storeSetSelectedNode]);

  // Update a node's data
  const updateNodeData = useCallback((
    nodeId: string, 
    newData: Partial<NodeData>
  ) => {
    if (!reactFlowInstance) {
      console.error('React Flow not initialized');
      return null;
    }
    
    const { getNodes, getEdges, setNodes } = reactFlowInstance;
    
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    const updatedNodes = currentNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data as NodeData,
            ...newData
          }
        };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    addToHistory(updatedNodes as Node<NodeData>[], currentEdges as CanvasEdge[]);
    
    return updatedNodes.find(node => node.id === nodeId);
  }, [reactFlowInstance, addToHistory]);

  // Delete a node
  const deleteNode = useCallback((nodeId: string) => {
    if (!reactFlowInstance) {
      console.error('React Flow not initialized');
      return;
    }
    
    const { getNodes, getEdges, setNodes, setEdges } = reactFlowInstance;
    
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    
    const updatedNodes = currentNodes.filter(node => node.id !== nodeId);
    const updatedEdges = currentEdges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    
    addToHistory(updatedNodes as Node<NodeData>[], updatedEdges as CanvasEdge[]);
    
    // Close the config panel if the deleted node is currently selected
    if (selectedNode?.id === nodeId) {
      closeNodeConfig();
    }
    storeSetSelectedNode(null);
  }, [selectedNode, closeNodeConfig, addToHistory, reactFlowInstance, storeSetSelectedNode]);

  return {
    selectedNode,
    isNodeConfigOpen,
    openNodeConfig,
    closeNodeConfig,
    updateNodeData,
    deleteNode,
    // History functionality
    history,
    historyIndex,
    canUndo,
    canRedo,
    addToHistory,
    undo,
    redo,
    clearHistory
  };
}
