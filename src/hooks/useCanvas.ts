import { useState, useEffect, useCallback } from 'react';
import { Node, useNodesState, useEdgesState, Connection, addEdge, MarkerType } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvasStore';
import { useWizardStore } from '../stores/wizardStore';
import { canvasService } from '../services/canvasService';
import { NodeData, CanvasEdge } from '../types/canvas';
import { useToast } from '../components/ui/use-toast';

/**
 * Hook for managing canvas operations
 */
export function useCanvas() {
  const { 
    blueprint
  } = useWizardStore();
  
  const {
    addToHistory,
    workflowNodes,
    workflowEdges,
    setWorkflowNodes,
    setWorkflowEdges,
    isExecuting,
    setIsExecuting,
    updateExecutionMetrics
  } = useCanvasStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(workflowNodes as Node<NodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(workflowEdges as CanvasEdge[]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Load nodes and edges from blueprint
  useEffect(() => {
    if (blueprint && nodes.length === 0 && edges.length === 0) {
      console.log("Loading canvas from blueprint");
      try {
        loadCanvasFromBlueprint();
      } catch (error) {
        console.error("Error loading canvas:", error);
        setError("Failed to load canvas from blueprint");
      }
    }
  }, [blueprint]);
  
  // Update canvas store whenever nodes or edges change
  useEffect(() => {
    setWorkflowNodes(nodes);
    setWorkflowEdges(edges);
  }, [nodes, edges, setWorkflowNodes, setWorkflowEdges]);
  
  // Load canvas from blueprint
  const loadCanvasFromBlueprint = useCallback(async () => {
    if (!blueprint) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { nodes: blueprintNodes, edges: blueprintEdges } = await canvasService.generateCanvasFromBlueprint(blueprint);
      
      console.log("Canvas generated successfully:", { 
        nodes: blueprintNodes.length, 
        edges: blueprintEdges.length 
      });
      
      setNodes(blueprintNodes);
      setEdges(blueprintEdges);
      addToHistory(blueprintNodes, blueprintEdges);
      
      console.log('✅ Canvas loaded from blueprint:', blueprint.id);
    } catch (err) {
      console.error('Failed to load canvas from blueprint:', err);
      setError('Failed to generate canvas from blueprint');
    } finally {
      setIsLoading(false);
    }
  }, [blueprint, setNodes, setEdges, addToHistory]);
  
  // Handle connecting nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const edge: CanvasEdge = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source || '',
        target: params.target || '',
        sourceHandle: params.sourceHandle || null,
        targetHandle: params.targetHandle || null,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
      };
      const newEdges = addEdge(edge, edges);
      setEdges(newEdges);
      addToHistory(nodes, newEdges);
    },
    [edges, nodes, addToHistory, setEdges]
  );
  
  // Add a new node
  const addNode = useCallback((type: string, position?: { x: number; y: number }) => {
    // Implementation would be similar to the addSmartNode function in EnhancedQuantumCanvas
    // Not implementing fully here to avoid duplication
    console.log('Adding node of type:', type, 'at position:', position);
  }, [nodes, edges, addToHistory]);
  
  
  // Execute workflow with real-time monitoring
  const executeWorkflow = useCallback(async () => {
    if (!nodes.length) {
      toast({
        title: "No workflow to execute",
        description: "Please add nodes to your canvas first",
        variant: "destructive"
      });
      return;
    }
    
    console.log("🚀 Executing workflow with", nodes.length, "nodes");
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await canvasService.executeWorkflow(
        `flow-${Date.now()}`,
        nodes,
        edges,
        { 
          userId: 'user-123',
          timestamp: new Date().toISOString(),
          blueprint: blueprint?.id 
        }
      );
      
      setExecutionId(result.executionId);
      
      // Initialize node statuses
      const initialStatuses: Record<string, string> = {};
      nodes.forEach(node => {
        initialStatuses[node.id] = 'pending';
      });
      setNodeStatuses(initialStatuses);
      
      toast({
        title: "Workflow execution started",
        description: `Execution ID: ${result.executionId}`,
      });
      
      // Start monitoring execution
      monitorExecution(result.executionId);
      
      console.log('✅ Workflow execution initiated:', result.executionId);
      return result;
    } catch (err) {
      console.error('❌ Failed to execute workflow:', err);
      setError(`Execution failed: ${err}`);
      setIsExecuting(false);
      
      toast({
        title: "Execution failed",
        description: "Failed to start workflow execution",
        variant: "destructive"
      });
      
      throw err;
    }
  }, [nodes, edges, blueprint, toast]);

  // Monitor workflow execution in real-time
  const monitorExecution = useCallback(async (execId: string) => {
    const checkStatus = async () => {
      try {
        const status = await canvasService.getExecutionStatus(execId);
        
        if (status) {
          // Update node statuses
          const newStatuses: Record<string, string> = {};
          status.nodes?.forEach((nodeExec: any) => {
            newStatuses[nodeExec.id] = nodeExec.status;
          });
          setNodeStatuses(newStatuses);
          
          // Update execution metrics
          updateExecutionMetrics({
            totalNodes: nodes.length,
            completedNodes: status.nodes?.filter((n: any) => n.status === 'completed').length || 0,
            failedNodes: status.nodes?.filter((n: any) => n.status === 'failed').length || 0,
            lastExecutionTime: new Date()
          });
          
          if (status.status === 'completed') {
            setIsExecuting(false);
            toast({
              title: "Workflow completed",
              description: "All nodes executed successfully",
            });
          } else if (status.status === 'failed') {
            setIsExecuting(false);
            setError(`Execution failed: ${status.error}`);
            toast({
              title: "Workflow failed",
              description: status.error || "Unknown error occurred",
              variant: "destructive"
            });
          } else if (status.status === 'running') {
            // Continue monitoring
            setTimeout(checkStatus, 2000);
          }
        }
      } catch (err) {
        console.error('Failed to get execution status:', err);
        setIsExecuting(false);
      }
    };
    
    // Start monitoring
    checkStatus();
  }, [nodes.length, updateExecutionMetrics, toast]);

  // Validate node configuration with comprehensive validation
  const validateNode = useCallback(async (nodeId: string, config: Record<string, any>) => {
    try {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        return await canvasService.validateNodeInRealTime(node, { allNodes: nodes, allEdges: edges });
      }
      return await canvasService.validateNodeConfig(nodeId, config);
    } catch (err) {
      console.error('Node validation failed:', err);
      return { isValid: false, errors: ['Validation service unavailable'], warnings: [], suggestions: [] };
    }
  }, [nodes, edges]);

  // Comprehensive workflow validation
  const validateWorkflow = useCallback(async () => {
    try {
      return await canvasService.validateWorkflow(nodes, edges);
    } catch (err) {
      console.error('Workflow validation failed:', err);
      return { isValid: false, errors: ['Validation service unavailable'], warnings: [], suggestions: [] };
    }
  }, [nodes, edges]);

  // Smart connection suggestions
  const getSuggestedConnections = useCallback(async (sourceNodeId: string, targetPosition: { x: number; y: number }) => {
    try {
      return await canvasService.suggestConnections(sourceNodeId, targetPosition, nodes);
    } catch (err) {
      console.error('Failed to get connection suggestions:', err);
      return [];
    }
  }, [nodes]);

  // Auto-connect compatible nodes
  const autoConnectNodes = useCallback(async () => {
    try {
      const newEdges = await canvasService.autoConnect(nodes);
      if (newEdges.length > 0) {
        setEdges(prev => [...prev, ...newEdges as CanvasEdge[]]);
        addToHistory(nodes, [...edges, ...newEdges as CanvasEdge[]]);
        toast({
          title: "Smart connections added",
          description: `${newEdges.length} intelligent connections created`,
        });
      }
      return newEdges;
    } catch (err) {
      console.error('Auto-connect failed:', err);
      toast({
        title: "Auto-connect failed",
        description: "Could not create automatic connections",
        variant: "destructive"
      });
      return [];
    }
  }, [nodes, edges, setEdges, addToHistory, toast]);

  // Auto-optimize canvas layout
  const optimizeLayout = useCallback(async () => {
    if (!nodes.length) return;
    
    try {
      setIsLoading(true);
      const result = await canvasService.optimizeLayout(nodes, edges);
      
      setNodes(result.nodes);
      setEdges(result.edges);
      addToHistory(result.nodes, result.edges);
      
      toast({
        title: "Layout optimized",
        description: "Canvas layout has been automatically optimized",
      });
    } catch (err) {
      console.error('Layout optimization failed:', err);
      toast({
        title: "Optimization failed",
        description: "Failed to optimize canvas layout",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, setNodes, setEdges, addToHistory, toast]);

  // Enhanced save canvas with versioning
  const saveCanvas = useCallback(async () => {
    try {
      const canvasId = `canvas-${blueprint?.id || Date.now()}`;
      const metadata = {
        id: canvasId,
        name: blueprint?.suggested_structure?.guild_name || 'Untitled Canvas',
        description: blueprint?.suggested_structure?.guild_purpose || 'Canvas description',
        version: '1.0.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        author: 'User',
        tags: ['workflow', 'ai-generated'],
        stats: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          complexity: nodes.length > 10 ? 'high' : nodes.length > 5 ? 'medium' : 'low'
        }
      };
      
      const result = await canvasService.saveCanvas(canvasId, nodes, edges, metadata);
      
      if (result.success) {
        addToHistory(nodes, edges);
        toast({
          title: "Canvas saved",
          description: `Saved as version ${result.version}`,
        });
      }
      
      console.log('✅ Canvas saved:', result);
      return result;
    } catch (err) {
      console.error('Failed to save canvas:', err);
      toast({
        title: "Save failed",
        description: "Failed to save canvas",
        variant: "destructive"
      });
      throw err;
    }
  }, [nodes, edges, blueprint, addToHistory, toast]);
  
  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    saveCanvas,
    executeWorkflow,
    isLoading,
    error,
    loadCanvasFromBlueprint,
    // Core execution features
    isExecuting,
    executionId,
    nodeStatuses,
    monitorExecution,
    // Phase 2 Enhanced Features - Smart Canvas Operations
    validateNode,
    validateWorkflow,
    getSuggestedConnections,
    autoConnectNodes,
    optimizeLayout,
  };
}