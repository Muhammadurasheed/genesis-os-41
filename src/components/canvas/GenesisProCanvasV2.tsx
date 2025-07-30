import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge, 
  Node,
  Panel,
  ConnectionMode,
  SelectionMode,
  ReactFlowProvider
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Save,
  Zap,
  Settings,
  Eye,
  Maximize2,
  Minimize2,
  GitBranch,
  Clock,
  BarChart3,
  Brain,
  Plus,
  Grid,
  Layers,
  Target,
  Cpu,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Gauge,
  Network
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Create simple Card components
const Card = ({ children, className = '', ...props }: any) => (
  <div className={`rounded-lg border ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '', ...props }: any) => (
  <div className={`p-6 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }: any) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '', ...props }: any) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

// Custom Node Components
import AgentNode from './nodes/AgentNode';
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import DelayNode from './nodes/DelayNode';

// Services
import { advancedGenesisCanvasEngine } from '../../services/canvas/advancedCanvasEngine';
import { revolutionaryCanvasEngine } from '../../services/canvas/revolutionaryCanvasEngine';

// Types
import { Blueprint } from '../../types';

// Node types for React Flow
const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  action: ActionNode,
  delay: DelayNode
};

interface GenesisProCanvasV2Props {
  blueprint?: Blueprint;
  mode?: 'design' | 'simulation' | 'execution' | 'collaboration';
  readOnly?: boolean;
  collaborators?: any[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: (nodes: Node[], edges: Edge[]) => void;
  onContinue?: () => void;
}

// Main Canvas Component
const GenesisProCanvasV2Component: React.FC<GenesisProCanvasV2Props> = ({
  blueprint,
  mode = 'design',
  collaborators = [],
  onSave,
  onExecute,
  onContinue
}) => {
  // Core Canvas State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [canvasMode, setCanvasMode] = useState<'design' | 'execute' | 'debug'>(mode === 'execution' ? 'execute' : 'design');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Canvas Analytics
  const [canvasMetrics, setCanvasMetrics] = useState({
    nodeCount: 0,
    edgeCount: 0,
    complexity: 0,
    performance: { renderTime: 0, memoryUsage: 0 },
    suggestions: [] as string[]
  });

  // Validation State
  const [validationResults] = useState({
    isValid: true,
    errors: [] as any[],
    warnings: [] as any[],
    suggestions: [] as any[]
  });

  // Collaboration State
  const [activeCollaborators] = useState(collaborators);

  // Version Control
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [currentVersion] = useState('v1.0.0');

  // AI Suggestions
  const [connectionSuggestions, setConnectionSuggestions] = useState<any[]>([]);

  // Generate initial canvas from blueprint
  useEffect(() => {
    if (blueprint) {
      generateCanvasFromBlueprint();
    }
  }, [blueprint]);

  // Real-time analytics
  useEffect(() => {
    updateCanvasAnalytics();
  }, [nodes, edges]);

  // Generate canvas from blueprint
  const generateCanvasFromBlueprint = useCallback(async () => {
    if (!blueprint) return;
    
    try {
      console.log('🎨 Generating revolutionary canvas from blueprint...');
      const result = await advancedGenesisCanvasEngine.generateAdvancedCanvas(blueprint);
      
      setNodes(result.nodes as any);
      setEdges(result.edges as any);
      
      // Create initial snapshot
      await createSnapshot('Initial canvas generation from blueprint', ['genesis', 'ai-generated']);
      
      console.log('✅ Revolutionary canvas generated successfully');
    } catch (error) {
      console.error('Canvas generation failed:', error);
    }
  }, [blueprint, setNodes, setEdges]);

  // Connection handler with AI suggestions
  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗 Creating intelligent connection...');
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      };
      setEdges((eds) => addEdge(newEdge, eds) as any);
    },
    [setEdges]
  );

  // AI-powered layout optimization
  const optimizeLayout = useCallback(async () => {
    try {
      console.log('🧠 Applying AI layout optimization...');
      const result = await revolutionaryCanvasEngine.optimizeLayout(nodes, edges);
      
      if (result) {
        setNodes(result.nodes as any);
        setEdges(result.edges as any);
        await createSnapshot('AI layout optimization', ['optimization', 'ai']);
      }
    } catch (error) {
      console.error('Layout optimization failed:', error);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Create version snapshot
  const createSnapshot = useCallback(async (message: string, tags: string[] = []) => {
    try {
      revolutionaryCanvasEngine.createSnapshot(
        message,
        tags
      );
      
      // Update snapshots list
      const updatedSnapshots = revolutionaryCanvasEngine.getSnapshots();
      setSnapshots(updatedSnapshots);
      
      console.log(`📸 Snapshot created: ${message}`);
    } catch (error) {
      console.error('Snapshot creation failed:', error);
    }
  }, [nodes, edges]);

  // Generate AI connection suggestions
  const generateConnectionSuggestions = useCallback(async () => {
    try {
      const suggestions = await revolutionaryCanvasEngine.generateConnectionSuggestions(
        nodes
      );
      setConnectionSuggestions(suggestions);
    } catch (error) {
      console.error('Connection suggestion generation failed:', error);
    }
  }, [nodes]);

  // Update canvas analytics
  const updateCanvasAnalytics = useCallback(async () => {
    try {
      const metrics = await revolutionaryCanvasEngine.analyzeCanvasMetrics(nodes, edges);
      setCanvasMetrics(metrics);
    } catch (error) {
      console.error('Analytics update failed:', error);
    }
  }, [nodes, edges]);

  // Save canvas
  const handleSave = useCallback(async () => {
    try {
      await createSnapshot('Manual save', ['manual-save']);
      onSave?.(nodes, edges);
      console.log('💾 Canvas saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [nodes, edges, onSave, createSnapshot]);

  // Execute workflow
  const handleExecute = useCallback(() => {
    console.log('⚡ Launching workflow execution...');
    onExecute?.(nodes, edges);
  }, [nodes, edges, onExecute]);

  // Node templates for sidebar
  const nodeTemplates = useMemo(() => [
    {
      type: 'trigger',
      label: 'Trigger',
      description: 'Start your workflow',
      icon: Zap,
      color: 'from-emerald-500 to-teal-500',
      category: 'Core'
    },
    {
      type: 'agent',
      label: 'AI Agent',
      description: 'Intelligent digital worker',
      icon: Bot,
      color: 'from-purple-500 to-pink-500',
      category: 'Core'
    },
    {
      type: 'action',
      label: 'Action',
      description: 'Execute specific tasks',
      icon: Settings,
      color: 'from-blue-500 to-cyan-500',
      category: 'Core'
    },
    {
      type: 'condition',
      label: 'Condition',
      description: 'Smart decision making',
      icon: GitBranch,
      color: 'from-orange-500 to-red-500',
      category: 'Logic'
    },
    {
      type: 'delay',
      label: 'Delay',
      description: 'Time-based waiting',
      icon: Clock,
      color: 'from-violet-500 to-purple-500',
      category: 'Control'
    }
  ], []);

  // Canvas controls
  const canvasControls = useMemo(() => [
    {
      icon: Save,
      label: 'Save Canvas',
      shortcut: 'Ctrl+S',
      action: handleSave,
      variant: 'outline' as const
    },
    {
      icon: Play,
      label: 'Execute Workflow',
      shortcut: 'Ctrl+R',
      action: handleExecute,
      variant: 'default' as const
    },
    {
      icon: Brain,
      label: 'AI Optimize',
      shortcut: 'Ctrl+O',
      action: optimizeLayout,
      variant: 'secondary' as const
    },
    {
      icon: GitBranch,
      label: 'Create Snapshot',
      shortcut: 'Ctrl+Shift+S',
      action: () => createSnapshot('Manual snapshot', ['manual']),
      variant: 'outline' as const
    }
  ], [handleSave, handleExecute, optimizeLayout, createSnapshot]);

  return (
    <div className={`flex h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* AI Neural Network Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="neural-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="currentColor" className="text-purple-400" opacity="0.3"/>
              <line x1="50" y1="50" x2="100" y2="0" stroke="currentColor" className="text-purple-400" strokeWidth="0.5" opacity="0.2"/>
              <line x1="50" y1="50" x2="100" y2="100" stroke="currentColor" className="text-purple-400" strokeWidth="0.5" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-grid)"/>
        </svg>
      </div>

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          {/* Left: Canvas Info & Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">Genesis Pro Canvas</span>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {currentVersion}
              </Badge>
            </div>
            
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <Button
                variant={canvasMode === 'design' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCanvasMode('design')}
                className="px-3"
              >
                <Grid className="w-4 h-4 mr-1" />
                Design
              </Button>
              <Button
                variant={canvasMode === 'execute' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCanvasMode('execute')}
                className="px-3"
              >
                <Play className="w-4 h-4 mr-1" />
                Execute
              </Button>
              <Button
                variant={canvasMode === 'debug' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCanvasMode('debug')}
                className="px-3"
              >
                <Cpu className="w-4 h-4 mr-1" />
                Debug
              </Button>
            </div>
          </div>

          {/* Center: Quick Actions */}
          <div className="flex items-center gap-2">
            {canvasControls.map((control, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={control.variant}
                      size="sm"
                      onClick={control.action}
                      className="flex items-center gap-1"
                    >
                      <control.icon className="w-4 h-4" />
                      <span className="hidden md:inline">{control.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{control.label} ({control.shortcut})</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* Right: View Controls */}
          <div className="flex items-center gap-2">
            {/* Collaborators */}
            {activeCollaborators.length > 0 && (
              <div className="flex -space-x-2">
                {activeCollaborators.slice(0, 3).map((collaborator, index) => (
                  <Avatar key={index} className="w-8 h-8 border-2 border-purple-500">
                    <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                    <AvatarFallback>{collaborator.name?.[0]}</AvatarFallback>
                  </Avatar>
                ))}
                {activeCollaborators.length > 3 && (
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white border-2 border-purple-500">
                    +{activeCollaborators.length - 3}
                  </div>
                )}
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Left Sidebar */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col z-10"
            style={{ marginTop: '80px' }}
          >
            <Tabs defaultValue="nodes" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-white/5 m-2">
                <TabsTrigger value="nodes" className="text-xs">
                  <Layers className="w-4 h-4 mr-1" />
                  Nodes
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="versions" className="text-xs">
                  <GitBranch className="w-4 h-4 mr-1" />
                  Versions
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs">
                  <Brain className="w-4 h-4 mr-1" />
                  AI
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 p-2">
                {/* Node Library */}
                <TabsContent value="nodes" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white">Node Library</h3>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Input
                      placeholder="Search nodes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {nodeTemplates
                        .filter(template => 
                          template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((template, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="cursor-pointer"
                            draggable
                            onDragStart={(event: any) => {
                              event.dataTransfer.setData('application/reactflow', template.type);
                              event.dataTransfer.effectAllowed = 'move';
                            }}
                          >
                            <Card className="bg-white/5 border-white/20 hover:bg-white/10 transition-all duration-200">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color}`}>
                                    <template.icon className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-white text-sm">{template.label}</div>
                                    <div className="text-xs text-white/60">{template.description}</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Analytics Panel */}
                <TabsContent value="analytics" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Canvas Analytics</h3>
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="bg-white/5 border-white/20">
                        <CardContent className="p-3 text-center">
                          <div className="text-lg font-bold text-white">{canvasMetrics.nodeCount}</div>
                          <div className="text-xs text-white/60">Nodes</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/5 border-white/20">
                        <CardContent className="p-3 text-center">
                          <div className="text-lg font-bold text-white">{canvasMetrics.edgeCount}</div>
                          <div className="text-xs text-white/60">Connections</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Complexity Score */}
                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white">Complexity</span>
                          <span className="text-sm text-white">{canvasMetrics.complexity}/100</span>
                        </div>
                        <Progress value={canvasMetrics.complexity} className="h-2" />
                      </CardContent>
                    </Card>

                    {/* Performance Metrics */}
                    <Card className="bg-white/5 border-white/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white">Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/60">Render Time</span>
                          <span className="text-white">{canvasMetrics.performance.renderTime}ms</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/60">Memory Usage</span>
                          <span className="text-white">{Math.round(canvasMetrics.performance.memoryUsage / 1024)}KB</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suggestions */}
                    {canvasMetrics.suggestions.length > 0 && (
                      <Card className="bg-white/5 border-white/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {canvasMetrics.suggestions.map((suggestion, index) => (
                            <div key={index} className="text-xs text-white/80 p-2 bg-white/5 rounded">
                              {suggestion}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Version Control */}
                <TabsContent value="versions" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white">Version History</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => createSnapshot('Manual snapshot', ['manual'])}
                        className="p-1"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-2">
                        {snapshots.map((snapshot) => (
                          <Card key={snapshot.id} className="bg-white/5 border-white/20 hover:bg-white/10 transition-colors cursor-pointer">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-medium text-white">v1.0.0</div>
                                <div className="text-xs text-white/60">
                                  {new Date(snapshot.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-xs text-white/80 mb-2">{snapshot.message || 'No message'}</div>
                              <div className="flex gap-1">
                                {snapshot.tags?.map((tag: string, tagIndex: number) => (
                                  <Badge key={tagIndex} variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* AI Assistant */}
                <TabsContent value="ai" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">AI Assistant</h3>
                    
                    {/* Connection Suggestions */}
                    {connectionSuggestions.length > 0 && (
                      <Card className="bg-white/5 border-white/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white flex items-center gap-2">
                            <Network className="w-4 h-4" />
                            Smart Connections
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {connectionSuggestions.map((suggestion) => (
                            <div key={suggestion.id} className="p-2 bg-white/5 rounded text-xs">
                              <div className="text-white font-medium mb-1">
                                {suggestion.sourceNode} → {suggestion.targetNode}
                              </div>
                              <div className="text-white/60 mb-1">{suggestion.reasoning}</div>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(suggestion.confidence * 100)}% confidence
                                </Badge>
                                <Button variant="ghost" size="sm" className="text-xs h-6">
                                  Apply
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* AI Actions */}
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateConnectionSuggestions}
                        className="w-full justify-start"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Suggestions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={optimizeLayout}
                        className="w-full justify-start"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Optimize Layout
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          selectionMode={SelectionMode.Partial}
          fitView
          className="bg-transparent"
          style={{ marginTop: '80px' }}
        >
          {/* Canvas Background */}
          <Background 
            gap={20} 
            size={1}
            color="rgba(255, 255, 255, 0.1)"
            style={{ display: showGrid ? 'block' : 'none' }}
          />
          
          {/* Canvas Controls */}
          <Controls 
            className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-lg"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          
          {/* Minimap */}
          {showMinimap && (
            <MiniMap
              className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-lg"
              nodeColor="#8b5cf6"
              nodeStrokeColor="#a855f7"
              nodeBorderRadius={8}
            />
          )}

          {/* Canvas Panels */}
          <Panel position="top-right" className="space-y-2">
            {/* View Controls */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 p-2">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMinimap(!showMinimap)}
                        className={`p-2 ${showMinimap ? 'bg-white/20' : ''}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle Minimap</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-2 ${showGrid ? 'bg-white/20' : ''}`}
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle Grid</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </Card>

            {/* Performance Monitor */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 p-2">
              <div className="flex items-center gap-2 text-xs text-white">
                <Activity className="w-3 h-3 text-green-400" />
                <span>{canvasMetrics.performance.renderTime}ms</span>
                <Gauge className="w-3 h-3 text-blue-400 ml-2" />
                <span>{Math.round(canvasMetrics.performance.memoryUsage / 1024)}KB</span>
              </div>
            </Card>
          </Panel>

          {/* Bottom Status Panel */}
          <Panel position="bottom-center">
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 p-3">
              <div className="flex items-center gap-4 text-sm text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Canvas Ready</span>
                </div>
                
                <Separator orientation="vertical" className="h-4 bg-white/20" />
                
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>{nodes.length} nodes, {edges.length} connections</span>
                </div>
                
                {validationResults.errors.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4 bg-white/20" />
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationResults.errors.length} errors</span>
                    </div>
                  </>
                )}
                
                {onContinue && (
                  <>
                    <Separator orientation="vertical" className="h-4 bg-white/20" />
                    <Button 
                      onClick={onContinue}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <ChevronRight className="w-4 h-4 mr-1" />
                      Continue to Triggers
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrapped component with ReactFlowProvider
export const GenesisProCanvasV2: React.FC<GenesisProCanvasV2Props> = (props) => {
  return (
    <ReactFlowProvider>
      <GenesisProCanvasV2Component {...props} />
    </ReactFlowProvider>
  );
};

export default GenesisProCanvasV2;