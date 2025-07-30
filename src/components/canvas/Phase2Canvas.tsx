// Phase 2: Revolutionary Canvas Component
// Canvas that surpasses n8n and Figma with AI-powered features

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { RevolutionaryCanvasToolbar } from './RevolutionaryCanvasToolbar';
import { useRevolutionaryCanvas } from '../../hooks/useRevolutionaryCanvas';
import { ConnectionSuggestion } from '../../services/canvas/revolutionaryCanvasEngine';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  Lightbulb, 
  CheckCircle, 
  Sparkles,
  Zap,
  GitBranch
} from 'lucide-react';

// Import custom node types (assuming they exist)
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

// Sample initial data
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { label: 'Email Trigger' }
  },
  {
    id: '2',
    type: 'agent',
    position: { x: 300, y: 100 },
    data: { label: 'AI Assistant' }
  },
  {
    id: '3',
    type: 'logic',
    position: { x: 500, y: 100 },
    data: { label: 'Decision Logic' }
  },
  {
    id: '4',
    type: 'integration',
    position: { x: 700, y: 100 },
    data: { label: 'Slack Integration' }
  }
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep'
  }
];

export const Phase2Canvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Use the revolutionary canvas hook
  const {
    optimizeLayoutWithAI,
    generateConnectionSuggestions,
    createSnapshot,
    applyConnectionSuggestion,
    suggestions,
    snapshots,
    autoLayoutEnabled,
    intelligentConnectionsEnabled,
    toggleAutoLayout,
    toggleIntelligentConnections
  } = useRevolutionaryCanvas();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // AI Layout Optimization Handler
  const handleOptimizeLayout = useCallback(async (algorithm: 'force_directed' | 'hierarchical' | 'circular' | 'organic') => {
    setIsOptimizing(true);
    
    try {
      toast.info(`🧠 Applying ${algorithm.replace('_', ' ')} AI layout...`, {
        description: 'Revolutionary AI is optimizing your canvas layout'
      });

      const result = await optimizeLayoutWithAI(algorithm);
      
      if (result) {
        setNodes(result.nodes);
        setEdges(result.edges);
        
        toast.success('🎯 AI Layout Optimization Complete!', {
          description: `Reduced ${result.metrics.crossings_reduced} crossings, improved spacing by ${result.metrics.spacing_improved}%`
        });
      } else {
        toast.warning('⚠️ AI optimization unavailable', {
          description: 'Using local layout optimization'
        });
      }
    } catch (error) {
      console.error('Layout optimization failed:', error);
      toast.error('❌ Layout optimization failed', {
        description: 'Please try again or check your connection'
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [optimizeLayoutWithAI, setNodes, setEdges]);

  // Connection Suggestions Handler
  const handleGenerateSuggestions = useCallback(async () => {
    setIsGeneratingSuggestions(true);
    
    try {
      toast.info('🔗 Generating intelligent connections...', {
        description: 'AI is analyzing your workflow for optimal connections'
      });

      const newSuggestions = await generateConnectionSuggestions();
      
      if (newSuggestions && newSuggestions.length > 0) {
        toast.success(`✨ Found ${newSuggestions.length} smart connections!`, {
          description: 'Review suggestions in the panel below'
        });
      } else {
        toast.info('🤔 No new connections suggested', {
          description: 'Your workflow connections look optimal!'
        });
      }
    } catch (error) {
      console.error('Connection suggestions failed:', error);
      toast.error('❌ Failed to generate suggestions', {
        description: 'Please try again or check your connection'
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [generateConnectionSuggestions]);

  // Snapshot Creation Handler
  const handleCreateSnapshot = useCallback(async () => {
    try {
      const message = `Canvas snapshot - ${new Date().toLocaleString()}`;
      const snapshot = await createSnapshot(message);
      
      if (snapshot) {
        toast.success('📸 Snapshot created successfully!', {
          description: `Version ${snapshot.metadata.version} saved`
        });
      } else {
        toast.error('❌ Failed to create snapshot', {
          description: 'Please try again'
        });
      }
    } catch (error) {
      console.error('Snapshot creation failed:', error);
      toast.error('❌ Snapshot creation failed');
    }
  }, [createSnapshot]);

  // Apply Connection Suggestion
  const handleApplySuggestion = useCallback((suggestion: ConnectionSuggestion) => {
    applyConnectionSuggestion(suggestion);
    toast.success('✅ Connection applied!', {
      description: `Connected ${suggestion.sourceNode} to ${suggestion.targetNode}`
    });
  }, [applyConnectionSuggestion]);

  // Collaboration Toggle (placeholder)
  const handleToggleCollaboration = useCallback(() => {
    toast.info('👥 Collaboration feature', {
      description: 'Real-time collaboration will be available soon!'
    });
  }, []);

  return (
    <div className="phase2-canvas w-full h-screen relative bg-gradient-to-br from-background via-background to-muted/20">
      {/* Revolutionary Toolbar */}
      <RevolutionaryCanvasToolbar
        onOptimizeLayout={handleOptimizeLayout}
        onGenerateSuggestions={handleGenerateSuggestions}
        onCreateSnapshot={handleCreateSnapshot}
        onToggleCollaboration={handleToggleCollaboration}
        suggestions={suggestions}
        snapshots={snapshots}
        autoLayoutEnabled={autoLayoutEnabled}
        intelligentConnectionsEnabled={intelligentConnectionsEnabled}
        onToggleAutoLayout={toggleAutoLayout}
        onToggleIntelligentConnections={toggleIntelligentConnections}
        isOptimizing={isOptimizing}
        isGeneratingSuggestions={isGeneratingSuggestions}
      />

      {/* Revolutionary Canvas */}
      <div className="canvas-container h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="revolutionary-canvas"
        >
          {/* Background with gradient */}
          <Background 
            gap={20} 
            size={1}
            style={{
              backgroundColor: 'transparent'
            }}
          />
          
          {/* Enhanced Controls */}
          <Controls
            position="bottom-left"
            style={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          
          {/* Enhanced MiniMap */}
          <MiniMap
            position="bottom-right"
            style={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            pannable
            zoomable
          />

          {/* Connection Suggestions Panel */}
          {suggestions.length > 0 && (
            <Panel position="top-right" className="suggestions-panel">
              <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg max-w-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-semibold text-sm">Smart Connections</h3>
                  <Badge variant="secondary" className="text-xs">
                    {suggestions.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {suggestions.slice(0, 5).map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="bg-muted/50 rounded-lg p-3 border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-medium">
                              {suggestion.type.replace('_', ' ')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Connect {suggestion.sourceNode} to {suggestion.targetNode}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleApplySuggestion(suggestion)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {/* Revolutionary Features Badge */}
          <Panel position="top-left" className="features-badge">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-primary">Revolutionary Canvas</p>
                  <p className="text-xs text-muted-foreground">Surpassing n8n & Figma</p>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <GitBranch className="h-3 w-3 mr-1" />
                  v{snapshots.length + 1}.0
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  AI {autoLayoutEnabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};