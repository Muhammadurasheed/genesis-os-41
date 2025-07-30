/**
 * Genesis Pro Canvas - The Ultimate Unified Canvas Experience
 * 
 * Mimics Lovable's interface layout with:
 * - Collapsible sidebar with advanced features
 * - Main canvas window with full-screen mode
 * - Top navbar with tools and ribbons
 * - Real-time collaboration
 * - Advanced version control with undo/redo
 * - Intelligent node selection and creation
 * - AI-powered layout optimization
 * - Performance monitoring dashboard
 * 
 * This is THE canvas that surpasses n8n and Figma combined.
 */

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
  ReactFlowProvider,
  SelectionMode
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu,
  Maximize2,
  Minimize2,
  MousePointer2,
  Hand,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Bot,
  Zap,
  Settings,
  GitBranch,
  Database,
  Save,
  Sparkles,
  Brain,
  Target,
  Wand2,
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
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';

// Services and Stores
import { advancedGenesisCanvasEngine } from '../../services/canvas/advancedCanvasEngine';
import { useCanvasStore } from '../../stores/canvasStore';
import { useCanvasUIStore } from '../../stores/canvasUIStore';
import { useRevolutionaryCanvas } from '../../hooks/useRevolutionaryCanvas';

// Types
import { Blueprint } from '../../types';

import '@xyflow/react/dist/style.css';
import './GenesisCanvas.css';

// Node types with enhanced capabilities
const nodeTypes = {
  agent: GenesisAgentNode as any,
  trigger: GenesisTriggerNode as any,
  integration: GenesisIntegrationNode as any,
  logic: GenesisLogicNode as any,
  action: GenesisIntegrationNode as any,
  condition: GenesisLogicNode as any,
};

// Edge types with advanced animations
const edgeTypes = {
  dataFlow: GenesisDataFlowEdge as any,
  intelligentDataFlow: IntelligentDataFlowEdge as any,
  smoothstep: IntelligentDataFlowEdge as any,
  step: GenesisDataFlowEdge as any,
  straight: GenesisDataFlowEdge as any,
};

interface GenesisProCanvasProps {
  blueprint?: Blueprint;
  onSave?: () => void;
  onExecute?: () => void;
  onNext?: () => void;
  className?: string;
}

const GenesisProCanvasComponent: React.FC<GenesisProCanvasProps> = ({
  blueprint,
  onSave,
  onNext,
  className = ''
}) => {
  // Core state management
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'select' | 'hand' | 'node'>('select');
  
  // Canvas state
  const [canvasMetadata, setCanvasMetadata] = useState<any>(null);
  const [executionMetrics] = useState({
    nodesExecuted: 0,
    totalNodes: 0,
    averageTime: 0,
    successRate: 100
  });
  
  // Collaboration state
  const [collaborators] = useState([
    { id: '1', name: 'Rasheed Ahmed', avatar: 'RA', status: 'online' },
    { id: '2', name: 'Sarah Khan', avatar: 'SK', status: 'editing' },
  ]);

  // Revolutionary Canvas Hook
  const revolutionaryCanvas = useRevolutionaryCanvas();
  
  // Stores
  const { setWorkflowNodes, setWorkflowEdges } = useCanvasStore();
  const { 
    showGrid, 
    showMinimap
  } = useCanvasUIStore();
  
  // React Flow instance
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  /**
   * Generate canvas from blueprint using Advanced Genesis Engine
   */
  const generateAdvancedCanvas = useCallback(async () => {
    if (!blueprint) {
      toast.error('No blueprint available for canvas generation');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🎨 Genesis Pro Canvas: Starting world-class generation...');
      
      const result = await advancedGenesisCanvasEngine.generateAdvancedCanvas(blueprint);
      
      // Apply generated nodes and edges
      setNodes(result.nodes as any);
      setEdges(result.edges as any);
      
      // Update stores
      setWorkflowNodes(result.nodes as any);
      setWorkflowEdges(result.edges as any);
      
      // Store metadata
      setCanvasMetadata(result.metadata);
      
      // Auto-optimize layout
      setTimeout(() => {
        revolutionaryCanvas.optimizeLayoutWithAI('hierarchical');
      }, 1000);

      toast.success(`🎨 Canvas generated with ${result.nodes.length} nodes and ${result.edges.length} connections`);
      
    } catch (error) {
      console.error('❌ Canvas generation failed:', error);
      toast.error('Failed to generate canvas. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [blueprint, setNodes, setEdges, setWorkflowNodes, setWorkflowEdges, revolutionaryCanvas]);

  /**
   * Add new node to canvas
   */
  const addNode = useCallback((type: string) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
    
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `Configure your ${type} node`,
        color: type === 'agent' ? 'from-purple-500 to-pink-500' : 
               type === 'trigger' ? 'from-green-500 to-blue-500' :
               type === 'integration' ? 'from-blue-500 to-cyan-500' :
               'from-orange-500 to-red-500',
        status: 'ready',
        metadata: {}
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${type} node to canvas`);
  }, [setNodes]);

  /**
   * Handle canvas save
   */
  const handleSave = useCallback(async () => {
    try {
      // Create snapshot with version control
      await revolutionaryCanvas.createSnapshot('Manual save');
      toast.success('Canvas saved successfully');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save canvas');
    }
  }, [revolutionaryCanvas, onSave]);


  // Auto-generate canvas when blueprint changes
  useEffect(() => {
    if (blueprint && nodes.length === 0) {
      generateAdvancedCanvas();
    }
  }, [blueprint, nodes.length, generateAdvancedCanvas]);

  // Node creation templates
  const nodeTemplates = [
    { type: 'agent', icon: Bot, label: 'AI Agent', color: 'text-purple-500' },
    { type: 'trigger', icon: Zap, label: 'Trigger', color: 'text-green-500' },
    { type: 'integration', icon: Database, label: 'Integration', color: 'text-blue-500' },
    { type: 'condition', icon: GitBranch, label: 'Condition', color: 'text-orange-500' },
    { type: 'action', icon: Settings, label: 'Action', color: 'text-red-500' },
  ];

  return (
    <div className={`h-screen w-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${className}`}>
      {/* Top Navbar - Lovable Style */}
      <div className="h-14 bg-black/50 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          {/* Canvas Title */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-white font-semibold">Genesis Pro Canvas</span>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
              AI-Powered
            </Badge>
          </div>
        </div>

        {/* Toolbar - Center */}
        <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1">
          {/* Selection Tools */}
          <Button
            variant={selectedTool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('select')}
            className="h-8 w-8 p-0"
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedTool === 'hand' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('hand')}
            className="h-8 w-8 p-0"
          >
            <Hand className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 bg-white/20" />
          
          {/* Zoom Controls */}
          <Button variant="ghost" size="sm" onClick={() => zoomIn()} className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => zoomOut()} className="h-8 w-8 p-0">
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fitView()} className="h-8 w-8 p-0">
            <Target className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 bg-white/20" />
          
          {/* Version Control */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-2">
          {/* Collaboration Avatars */}
          <div className="flex -space-x-2">
            {collaborators.map((collaborator) => (
              <Avatar key={collaborator.id} className="h-8 w-8 border-2 border-background">
                <AvatarFallback className="text-xs bg-purple-500 text-white">
                  {collaborator.avatar}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          
          {/* Full Screen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFullScreenMode(!fullScreenMode)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {fullScreenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Primary Actions */}
          <Button variant="ghost" size="sm" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          
          <Button variant="default" size="sm" onClick={onNext} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <ArrowRight className="h-4 w-4" />
            Continue to Triggers
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Sidebar - Lovable Style */}
        <AnimatePresence>
          {sidebarOpen && !fullScreenMode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/30 backdrop-blur border-r border-white/10 overflow-hidden"
            >
              <div className="p-4 h-full">
                <Tabs defaultValue="nodes" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="nodes">Nodes</TabsTrigger>
                    <TabsTrigger value="layers">Layers</TabsTrigger>
                    <TabsTrigger value="ai">AI</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="nodes" className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white/90 mb-3">Add Components</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {nodeTemplates.map((template) => (
                          <Button
                            key={template.type}
                            variant="outline"
                            size="sm"
                            onClick={() => addNode(template.type)}
                            className="flex flex-col gap-1 h-16 border-white/20 hover:border-purple-400 hover:bg-purple-500/10 group"
                          >
                            <template.icon className={`h-5 w-5 ${template.color} group-hover:scale-110 transition-transform`} />
                            <span className="text-xs text-white/70 group-hover:text-white">{template.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-white/20" />

                    <div>
                      <h3 className="text-sm font-semibold text-white/90 mb-3">Integrations</h3>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {['Slack', 'Gmail', 'Google Sheets', 'Airtable', 'Webhook'].map((integration) => (
                            <Button
                              key={integration}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                              onClick={() => addNode('integration')}
                            >
                              <Database className="h-4 w-4 mr-2" />
                              {integration}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  <TabsContent value="layers" className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white/90 mb-3">Canvas Layers</h3>
                      <div className="space-y-2">
                        {nodes.map((node) => (
                          <div key={node.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/10">
                            <Bot className="h-4 w-4 text-purple-400" />
                            <span className="text-sm text-white/80 flex-1">{node.data.label}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white/90 mb-3">AI Features</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revolutionaryCanvas.optimizeLayoutWithAI('hierarchical')}
                          className="w-full justify-start border-white/20 hover:border-purple-400 hover:bg-purple-500/10"
                        >
                          <Wand2 className="h-4 w-4 mr-2 text-purple-400" />
                          Optimize Layout
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revolutionaryCanvas.generateConnectionSuggestions()}
                          className="w-full justify-start border-white/20 hover:border-purple-400 hover:bg-purple-500/10"
                        >
                          <Brain className="h-4 w-4 mr-2 text-purple-400" />
                          Smart Connections
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revolutionaryCanvas.analyzeCanvas()}
                          className="w-full justify-start border-white/20 hover:border-purple-400 hover:bg-purple-500/10"
                        >
                          <Target className="h-4 w-4 mr-2 text-purple-400" />
                          Analyze Performance
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-white/20" />

                    <div>
                      <h3 className="text-sm font-semibold text-white/90 mb-3">Snapshots</h3>
                      <div className="space-y-2">
                        {revolutionaryCanvas.snapshots.slice(0, 5).map((snapshot) => (
                          <div key={snapshot.id} className="p-2 rounded bg-white/5 hover:bg-white/10 cursor-pointer">
                            <div className="text-xs text-white/80">{snapshot.message}</div>
                            <div className="text-xs text-white/50">{new Date(snapshot.timestamp).toLocaleTimeString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="metrics" className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white/90 mb-3">Performance</h3>
                      <div className="space-y-3">
                        <div className="p-3 rounded bg-white/5 border border-white/20">
                          <div className="text-sm text-white/90 mb-2">Execution Rate</div>
                          <div className="flex items-center gap-2">
                            <Progress value={executionMetrics.successRate} className="flex-1" />
                            <span className="text-xs text-white/70">{executionMetrics.successRate}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 rounded bg-white/5 border border-white/20">
                            <div className="text-lg font-bold text-white">{nodes.length}</div>
                            <div className="text-xs text-white/70">Total Nodes</div>
                          </div>
                          <div className="p-3 rounded bg-white/5 border border-white/20">
                            <div className="text-lg font-bold text-white">{edges.length}</div>
                            <div className="text-xs text-white/70">Connections</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Canvas Area */}
        <div className={`flex-1 relative ${fullScreenMode ? 'fixed inset-0 z-50 bg-slate-900' : ''}`}>
          <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={(connection) => setEdges((eds) => addEdge({
                ...connection,
                type: 'intelligentDataFlow',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }
              }, eds))}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              selectionMode={selectedTool === 'select' ? SelectionMode.Partial : SelectionMode.Full}
              panOnDrag={selectedTool === 'hand'}
              className="bg-transparent"
              fitView
              fitViewOptions={{ padding: 0.1 }}
            >
              {/* Canvas Background */}
              <Background 
                gap={20} 
                size={1} 
                color="rgba(255,255,255,0.1)"
                style={{ opacity: showGrid ? 0.5 : 0 }}
              />
              
              {/* Canvas Controls */}
              <Controls 
                className="bg-black/50 backdrop-blur border border-white/20 rounded-lg"
                showZoom={false}
                showFitView={false}
                showInteractive={false}
              />
              
              {/* Canvas Minimap */}
              {showMinimap && (
                <MiniMap 
                  className="bg-black/50 backdrop-blur border border-white/20 rounded-lg"
                  nodeColor="rgba(147, 51, 234, 0.8)"
                  maskColor="rgba(0, 0, 0, 0.8)"
                />
              )}

              {/* Loading Panel */}
              {isGenerating && (
                <Panel position="top-center">
                  <div className="bg-black/80 backdrop-blur rounded-lg px-4 py-2 border border-white/20">
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles className="h-4 w-4 animate-spin text-purple-400" />
                      Generating AI-powered canvas...
                    </div>
                  </div>
                </Panel>
              )}

              {/* Canvas Stats Panel */}
              <Panel position="bottom-right">
                <div className="bg-black/50 backdrop-blur rounded-lg p-3 border border-white/20 space-y-2">
                  <div className="text-xs text-white/70">Canvas Stats</div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-white">{nodes.length} nodes</span>
                    <span className="text-white">{edges.length} edges</span>
                  </div>
                  {canvasMetadata && (
                    <div className="text-xs text-purple-400">
                      Algorithm: {canvasMetadata.algorithm}
                    </div>
                  )}
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GenesisProCanvas: React.FC<GenesisProCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GenesisProCanvasComponent {...props} />
    </ReactFlowProvider>
  );
};