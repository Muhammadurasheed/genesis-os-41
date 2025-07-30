/**
 * Genesis Canvas Engine - The Revolutionary Phase 2 Canvas
 * The most advanced visual workflow editor with AI-powered features
 */

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  Node,
  OnConnect,
  Connection,
  MarkerType,
  SelectionMode,
  ConnectionMode,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Play,
  Users, 
  Zap, 
  Target,
  Sparkles,
  GitBranch,
  CheckCircle,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { NodeData, CanvasEdge } from '../../types/canvas';
import { useCanvas } from '../../hooks/useCanvas';
import { useCanvasStore } from '../../stores/canvasStore';
import { canvasService } from '../../services/canvasService';

// Enhanced node components with Phase 2 features
import { GenesisAgentNode } from './nodes/GenesisAgentNode';
import { GenesisTriggerNode } from './nodes/GenesisTriggerNode';
import { GenesisLogicNode } from './nodes/GenesisLogicNode';
import { GenesisIntegrationNode } from './nodes/GenesisIntegrationNode';

const nodeTypes = {
  agent: GenesisAgentNode,
  trigger: GenesisTriggerNode,
  logic: GenesisLogicNode,
  integration: GenesisIntegrationNode,
};

interface GenesisCanvasEngineProps {
  nodes?: Node<NodeData>[];
  edges?: CanvasEdge[];
  onSaveBlueprint: () => void;
  onRunSimulation: () => void;
  onInviteCollaborator?: () => void;
  onShareWorkflow?: () => void;
  isLoading?: boolean;
}

export function GenesisCanvasEngine({ 
  onRunSimulation,
  isLoading = false
}: GenesisCanvasEngineProps) {
  
  // Enhanced canvas hooks with Phase 2 features
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    validateWorkflow,
    autoConnectNodes,
    optimizeLayout,
  } = useCanvas();

  const {
    smartConnectionsEnabled,
    userExperienceLevel,
    validationResults,
    setValidationResults,
    suggestions,
    setSuggestions,
    collaborators,
    currentVersion
  } = useCanvasStore();

  const { toast } = useToast();

  // Enhanced connection handling with smart suggestions
  const onConnect: OnConnect = useCallback(
    async (params: Connection) => {
      const edge: CanvasEdge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: true,
        style: { strokeWidth: 3, stroke: 'hsl(var(--primary))' },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }
      };
      
      setEdges((eds: CanvasEdge[]) => addEdge(edge, eds));
      
      // Trigger real-time validation
      if (validationResults.isValid) {
        await validateCurrentCanvas();
      }
      
      // Show smart suggestions after connection
      if (smartConnectionsEnabled) {
        await generateSmartSuggestions();
      }
    },
    [setEdges, validationResults.isValid, smartConnectionsEnabled]
  );

  // Real-time canvas validation
  const validateCurrentCanvas = useCallback(async () => {
    try {
      const results = await validateWorkflow();
      setValidationResults(results as any);
      
      if (!(results as any).isValid) {
        toast({
          title: "Validation Issues Found",
          description: `${(results as any).errors?.length || 0} errors, ${(results as any).warnings?.length || 0} warnings`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Canvas validation failed:', error);
    }
  }, [validateWorkflow, setValidationResults, toast]);

  // Generate smart suggestions
  const generateSmartSuggestions = useCallback(async () => {
    try {
      const newSuggestions = await canvasService.getSmartSuggestions(nodes, {
        userExperience: userExperienceLevel,
        currentValidation: validationResults
      });
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  }, [nodes, userExperienceLevel, validationResults, setSuggestions]);

  // Auto-optimization handler
  const handleAutoOptimize = useCallback(async () => {
    try {
      const optimizedResult: any = await optimizeLayout();
      if (optimizedResult && optimizedResult.nodes && optimizedResult.edges) {
        setNodes(optimizedResult.nodes);
        setEdges(optimizedResult.edges);
        
        toast({
          title: "Canvas Optimized",
          description: "Layout has been automatically optimized for better flow",
        });
      }
    } catch (error) {
      console.error('Auto-optimization failed:', error);
      toast({
        title: "Optimization Failed",
        description: "Could not optimize canvas layout",
        variant: "destructive"
      });
    }
  }, [optimizeLayout, setNodes, setEdges, toast]);

  // Smart auto-connect handler
  const handleSmartConnect = useCallback(async () => {
    try {
      await autoConnectNodes();
    } catch (error) {
      console.error('Smart connect failed:', error);
    }
  }, [autoConnectNodes]);

  // Real-time validation on canvas changes
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(validateCurrentCanvas, 1000);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, validateCurrentCanvas]);

  // Generate suggestions when canvas changes
  useEffect(() => {
    if (nodes.length > 0 && smartConnectionsEnabled) {
      const timer = setTimeout(generateSmartSuggestions, 2000);
      return () => clearTimeout(timer);
    }
  }, [nodes, smartConnectionsEnabled, generateSmartSuggestions]);

  // Canvas statistics
  const getCanvasStats = () => {
    const agentCount = nodes.filter(n => n.type === 'agent').length;
    const triggerCount = nodes.filter(n => n.type === 'trigger').length;
    const logicCount = nodes.filter(n => n.type === 'logic').length;
    const integrationCount = nodes.filter(n => n.type === 'integration').length;
    const complexity = nodes.length > 15 ? 'Complex' : nodes.length > 8 ? 'Moderate' : 'Simple';
    
    return { 
      agentCount, 
      triggerCount, 
      logicCount,
      integrationCount,
      connectionCount: edges.length,
      complexity
    };
  };

  const stats = getCanvasStats();

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6 mx-auto" />
          <h3 className="text-xl font-semibold mb-2">Genesis Engine Initializing</h3>
          <p className="text-muted-foreground">Generating your intelligent workflow canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-background">
      {/* Enhanced Top Toolbar with Phase 2 Features */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Genesis Canvas Engine
                </span>
                {currentVersion && (
                  <Badge variant="outline" className="text-xs">
                    v{currentVersion}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{stats.agentCount} Agents</span>
                <span>{stats.connectionCount} Connections</span>
                <span>{stats.complexity} Complexity</span>
                <Badge variant={validationResults.isValid ? "default" : "destructive"}>
                  {validationResults.isValid ? "✓ Valid" : "⚠ Issues"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {/* Smart Features Toggle */}
          <Button 
            variant={smartConnectionsEnabled ? "default" : "outline"} 
            size="sm" 
            onClick={() => toast({ title: "Smart features", description: "Coming in next update" })}
            className="bg-card/95 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          
          {/* Auto-optimize */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAutoOptimize}
            className="bg-card/95 backdrop-blur-sm"
          >
            <Target className="w-4 h-4 mr-2" />
            Optimize
          </Button>

          {/* Smart Connect */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSmartConnect}
            className="bg-card/95 backdrop-blur-sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            Smart Connect
          </Button>

          {/* Version Control */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toast({ title: "Version control", description: "Save & version functionality" })}
            className="bg-card/95 backdrop-blur-sm"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Version
          </Button>
          
          <Button 
            size="sm" 
            onClick={onRunSimulation}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Play className="w-4 h-4 mr-2" />
            Launch Genesis
          </Button>
        </div>
      </div>

      {/* Enhanced ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        connectionMode={ConnectionMode.Loose}
        selectionMode={SelectionMode.Partial}
        className="bg-background"
        proOptions={{ hideAttribution: true }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={25} 
          size={1.5} 
          className="opacity-40"
        />
        <Controls 
          className="bg-card border border-border shadow-lg rounded-lg"
          showInteractive={true}
        />
        <MiniMap 
          nodeStrokeColor={() => 'hsl(var(--border))'}
          nodeColor={(node) => {
            if (node.type === 'agent') return 'hsl(var(--primary))';
            if (node.type === 'trigger') return 'hsl(240, 100%, 60%)';
            if (node.type === 'logic') return 'hsl(280, 100%, 60%)';
            if (node.type === 'integration') return 'hsl(200, 100%, 60%)';
            return 'hsl(var(--muted))';
          }}
          nodeBorderRadius={12}
          position="bottom-right"
          className="bg-card border border-border shadow-lg rounded-xl overflow-hidden"
        />

        {/* Enhanced Features Panel with Phase 2 Capabilities */}
        <Panel position="bottom-left">
          <div className="grid grid-cols-2 gap-3 p-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl min-w-[450px]">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Real-time Validation</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instant error detection, warnings, and optimization suggestions as you build.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Smart Connections</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI suggests optimal connections and auto-detects compatible nodes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Live Collaboration</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Multiple users, cursor tracking, conflict resolution, and shared state.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Version Control</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Branching, merging, rollback, and comprehensive change history.
                </p>
              </CardContent>
            </Card>
          </div>
        </Panel>

        {/* Validation Results Panel */}
        {!validationResults.isValid && validationResults.errors.length > 0 && (
          <Panel position="top-right">
            <Card className="bg-destructive/10 border-destructive/20 max-w-md">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Validation Issues</span>
                </div>
                <div className="space-y-1">
                  {validationResults.errors.slice(0, 3).map((error, idx) => (
                    <p key={idx} className="text-xs text-destructive/80">{error}</p>
                  ))}
                  {validationResults.errors.length > 3 && (
                    <p className="text-xs text-destructive/60">
                      +{validationResults.errors.length - 3} more issues
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Panel>
        )}

        {/* Smart Suggestions Panel */}
        {suggestions.length > 0 && (
          <Panel position="bottom-center">
            <Card className="bg-primary/10 border-primary/20 max-w-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Suggestions</span>
                </div>
                <div className="space-y-2">
                  {suggestions.slice(0, 2).map((suggestion, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{suggestion.message}</span>
                      {suggestion.action && (
                        <Button size="sm" variant="outline" onClick={suggestion.action}>
                          Apply
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Panel>
        )}

        {/* Collaboration Cursors */}
        {collaborators.map(collaborator => (
          collaborator.isActive && (
            <Panel 
              key={collaborator.id}
              position="top-left"
              style={{
                transform: `translate(${collaborator.cursor.x}px, ${collaborator.cursor.y}px)`,
                pointerEvents: 'none'
              }}
            >
              <div 
                className="w-3 h-3 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: collaborator.color }}
              />
              <div 
                className="mt-1 px-2 py-1 rounded text-xs text-white shadow-md"
                style={{ backgroundColor: collaborator.color }}
              >
                {collaborator.name}
              </div>
            </Panel>
          )
        ))}
      </ReactFlow>
    </div>
  );
}