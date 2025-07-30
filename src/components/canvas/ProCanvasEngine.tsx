import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  addEdge, 
  useNodesState, 
  useEdgesState, 
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionMode,
  MarkerType,
  ReactFlowProvider
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity,
  Sparkles,
  Cpu,
  LayoutGrid,
  Zap,
  Play,
  RotateCcw,
  Save,
  Users,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

// Advanced Node Components
import { GenesisAgentNode } from './nodes/GenesisAgentNode';
import { GenesisTriggerNode } from './nodes/GenesisTriggerNode';
import { GenesisIntegrationNode } from './nodes/GenesisIntegrationNode';
import { GenesisLogicNode } from './nodes/GenesisLogicNode';

// Advanced Edge Components
import { GenesisDataFlowEdge } from './edges/GenesisDataFlowEdge';
import { IntelligentDataFlowEdge } from './edges/IntelligentDataFlowEdge';

// UI Components
import { CollaborationPanel } from '../ui/CollaborationPanel';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

// Services and Stores
import { advancedGenesisCanvasEngine } from '../../services/canvas/advancedCanvasEngine';
import { useCanvasStore } from '../../stores/canvasStore';
import { useCanvasUIStore } from '../../stores/canvasUIStore';

// Types
import { Blueprint } from '../../types';

import '@xyflow/react/dist/style.css';
import './GenesisCanvas.css';

// Enhanced node types with advanced capabilities
const nodeTypes = {
  agent: GenesisAgentNode as any,
  trigger: GenesisTriggerNode as any,
  integration: GenesisIntegrationNode as any,
  logic: GenesisLogicNode as any,
  action: GenesisIntegrationNode as any,
  condition: GenesisLogicNode as any,
};

// Enhanced edge types with animation capabilities
const edgeTypes = {
  dataFlow: GenesisDataFlowEdge as any,
  intelligentDataFlow: IntelligentDataFlowEdge as any,
  smoothstep: IntelligentDataFlowEdge as any,
  step: GenesisDataFlowEdge as any,
  straight: GenesisDataFlowEdge as any,
};

interface ProCanvasEngineProps {
  blueprint?: Blueprint;
  onSave?: () => void;
  onExecute?: () => void;
  onNext?: () => void;
  className?: string;
}

const ProCanvasEngineComponent: React.FC<ProCanvasEngineProps> = ({
  blueprint,
  onSave,
  onExecute,
  onNext,
  className = ''
}) => {
  // State management
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasMode, setCanvasMode] = useState<'design' | 'execute' | 'debug'>('design');
  
  // Stores
  const { setWorkflowNodes, setWorkflowEdges } = useCanvasStore();
  const { showGrid, showMinimap, showNeuralNetwork } = useCanvasUIStore();
  
  // React Flow instance
  const reactFlowInstance = useReactFlow();

  // Mock collaboration data
  const [collaborators] = useState([
    { id: '1', name: 'Ahmed Ali', color: '#8b5cf6', isActive: true },
    { id: '2', name: 'Sara Khan', color: '#06b6d4', isActive: true },
    { id: '3', name: 'Omar Hassan', color: '#10b981', isActive: false },
  ]);

  const [cursorPositions] = useState({});

  // Execution metrics
  const [executionMetrics] = useState({
    activeNodes: 4,
    completedTasks: 12,
    averageTime: '2.4s',
    successRate: 98.5
  });

  // Generate canvas from blueprint
  const generateCanvas = useCallback(async () => {
    if (!blueprint) return;
    
    setIsGenerating(true);
    try {
      console.log('🎨 Pro Canvas: Generating world-class canvas from blueprint...');
      
      const result = await advancedGenesisCanvasEngine.generateAdvancedCanvas(blueprint);
      
      setNodes(result.nodes as any);
      setEdges(result.edges as any);
      setWorkflowNodes(result.nodes as any);
      setWorkflowEdges(result.edges as any);
      
      toast.success('✨ World-class canvas generated successfully!');
      
      // Auto-fit view after generation
      setTimeout(() => {
        reactFlowInstance?.fitView();
      }, 100);
      
    } catch (error) {
      console.error('Canvas generation failed:', error);
      toast.error('Failed to generate canvas');
    } finally {
      setIsGenerating(false);
    }
  }, [blueprint, setNodes, setEdges, setWorkflowNodes, setWorkflowEdges, reactFlowInstance]);

  // Generate canvas on blueprint change
  useEffect(() => {
    if (blueprint && nodes.length === 0) {
      generateCanvas();
    }
  }, [blueprint, generateCanvas, nodes.length]);

  // Connection handler
  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds: any) => addEdge(params, eds));
    },
    [setEdges]
  );

  // Save canvas
  const handleSave = useCallback(() => {
    console.log('💾 Saving canvas...');
    setWorkflowNodes(nodes);
    setWorkflowEdges(edges);
    onSave?.();
    toast.success('Canvas saved successfully!');
  }, [nodes, edges, setWorkflowNodes, setWorkflowEdges, onSave]);

  // Execute workflow
  const handleExecute = useCallback(() => {
    console.log('⚡ Executing workflow...');
    setIsExecuting(true);
    onExecute?.();
    
    // Simulate execution
    setTimeout(() => {
      setIsExecuting(false);
      toast.success('Workflow executed successfully!');
    }, 3000);
  }, [onExecute]);

  // Toggle sidebar
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Toggle fullscreen
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className={`flex h-full w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden ${className}`}>
      {/* Neural Network Background */}
      {showNeuralNetwork && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="text-white hover:bg-white/10"
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">Genesis Pro Canvas</span>
              <Badge variant="outline" className="border-purple-400 text-purple-400">
                Enterprise
              </Badge>
            </div>
          </div>

          {/* Center Section - Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {(['design', 'execute', 'debug'] as const).map((mode) => (
              <Button
                key={mode}
                variant={canvasMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setCanvasMode(mode)}
                className={`px-3 capitalize ${
                  canvasMode === mode 
                    ? 'bg-purple-600 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {mode === 'design' && <LayoutGrid className="w-4 h-4 mr-1" />}
                {mode === 'execute' && <Play className="w-4 h-4 mr-1" />}
                {mode === 'debug' && <Cpu className="w-4 h-4 mr-1" />}
                {mode}
              </Button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Zap className="w-4 h-4 mr-1" />
              {isExecuting ? 'Running...' : 'Execute'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-80 bg-black/95 backdrop-blur-xl border-r border-white/10 flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold mb-2">Canvas Controls</h3>
                <p className="text-white/60 text-sm">Professional workflow designer</p>
              </div>

              {/* Canvas Stats */}
              <div className="p-4 space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <h4 className="text-white text-sm font-medium">Performance</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-white/60">Nodes:</span>
                      <span className="text-white ml-1">{nodes.length}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Edges:</span>
                      <span className="text-white ml-1">{edges.length}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Success:</span>
                      <span className="text-green-400 ml-1">{executionMetrics.successRate}%</span>
                    </div>
                    <div>
                      <span className="text-white/60">Avg Time:</span>
                      <span className="text-blue-400 ml-1">{executionMetrics.averageTime}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCanvas}
                    disabled={isGenerating}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Regenerate'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reactFlowInstance?.fitView()}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Fit to View
                  </Button>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Collaboration Panel */}
              <div className="flex-1 p-4">
                <CollaborationPanel
                  collaborators={collaborators}
                  cursorPositions={cursorPositions}
                  className="bg-transparent border-none p-0"
                />
              </div>

              {/* Continue Button */}
              <div className="p-4 border-t border-white/10">
                <Button
                  onClick={onNext}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Continue to Triggers
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              className="bg-transparent"
              defaultEdgeOptions={{
                type: 'intelligentDataFlow',
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#8b5cf6', strokeWidth: 2 }
              }}
            >
              {/* Background */}
              <Background 
                color={showGrid ? "#374151" : "transparent"} 
                gap={16}
              />
              
              {/* Controls */}
              <Controls 
                className="bg-black/80 border border-white/20 rounded-lg"
                showInteractive={false}
              />
              
              {/* Minimap */}
              {showMinimap && (
                <MiniMap 
                  className="bg-black/80 border border-white/20 rounded-lg"
                  maskColor="rgba(0,0,0,0.8)"
                  nodeColor="#8b5cf6"
                />
              )}

              {/* Status Panel */}
              <Panel position="bottom-right" className="bg-black/80 backdrop-blur-lg rounded-lg p-3 border border-white/10">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-white/60">
                      {isExecuting ? 'Executing' : 'Ready'}
                    </span>
                  </div>
                  
                  <Separator orientation="vertical" className="h-4 bg-white/20" />
                  
                  <div className="flex items-center gap-1 text-white/60">
                    <Activity className="w-3 h-3" />
                    <span>{executionMetrics.activeNodes} active</span>
                  </div>
                  
                  <Separator orientation="vertical" className="h-4 bg-white/20" />
                  
                  <div className="flex items-center gap-1 text-white/60">
                    <Users className="w-3 h-3" />
                    <span>{collaborators.filter(c => c.isActive).length} online</span>
                  </div>
                </div>
              </Panel>

              {/* Loading Overlay */}
              {isGenerating && (
                <Panel position="top-center" className="bg-black/90 backdrop-blur-lg rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white">Generating world-class canvas...</span>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider
export const ProCanvasEngine: React.FC<ProCanvasEngineProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ProCanvasEngineComponent {...props} />
    </ReactFlowProvider>
  );
};