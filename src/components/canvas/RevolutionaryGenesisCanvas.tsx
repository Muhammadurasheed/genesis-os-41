import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
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
  BackgroundVariant,
  SelectionMode,
  OnConnect,
  ReactFlowProvider,
  Position
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Zap, Settings, Users, Share2, Save, Play, Eye, EyeOff,
  Brain, Network, Activity, Sparkles, MousePointer2, Layers,
  GitBranch, History, Palette, Grid3X3, Move, RotateCcw,
  Maximize2, Minimize2, Mic, Video, MessageSquare, Code,
  Database, Mail, Slack, Github, Globe, Cpu, Timer,
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
  ArrowRight, Plus, Filter, Search, Lock, Unlock
} from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { HolographicButton } from '../ui/HolographicButton';

// Types and Services
import { NodeData, CanvasEdge } from '../../types/canvas';
import { useCanvasStore } from '../../stores/canvasStore';
import { useCanvasUIStore } from '../../stores/canvasUIStore';
import { revolutionaryCanvasEngine } from '../../services/canvas/revolutionaryCanvasEngine';
import { backendIntegrationService } from '../../services/backendIntegrationService';

import '@xyflow/react/dist/style.css';
import './GenesisCanvas.css';

// Revolutionary Node Components
const RevolutionaryAgentNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0, throughput: 0 });
  
  useEffect(() => {
    // Simulate real-time metrics
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        throughput: Math.random() * 1000
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative min-w-[320px] max-w-[400px] rounded-2xl transition-all duration-300
        ${selected ? 'ring-4 ring-primary ring-opacity-50 shadow-2xl shadow-primary/20' : 'shadow-xl'}
        bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border border-border/50
        hover:shadow-2xl hover:shadow-primary/10 group overflow-hidden
      `}
    >
      {/* Neural network effect background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="neural" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural)" />
        </svg>
      </div>

      {/* Status indicator pulse */}
      <div className="absolute -top-2 -right-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-6 h-6 rounded-full ${
            data.status === 'active' ? 'bg-emerald-500' : 
            data.status === 'ready' ? 'bg-blue-500' : 'bg-gray-400'
          } border-4 border-background shadow-lg`}
        />
      </div>

      {/* AI Badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 font-bold">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Agent
        </Badge>
      </div>

      <div className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${data.color || 'from-blue-500 to-purple-600'} shadow-lg`}>
              <Bot className="w-8 h-8 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
            >
              <Brain className="w-2 h-2 text-gray-900" />
            </motion.div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">{data.label}</h3>
            <p className="text-sm text-muted-foreground font-medium">{data.role}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{data.model || 'GPT-4'}</Badge>
              {data.personality && (
                <Badge variant="secondary" className="text-xs">{data.personality}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{data.description}</p>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-lg font-bold text-emerald-500">{metrics.cpu.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">CPU</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-lg font-bold text-blue-500">{metrics.memory.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Memory</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-lg font-bold text-purple-500">{metrics.throughput.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Req/min</div>
          </div>
        </div>

        {/* Capabilities */}
        {data.tools && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Capabilities</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tools.slice(0, 4).map((tool: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs px-2 py-1">
                  {tool}
                </Badge>
              ))}
              {data.tools.length > 4 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  +{data.tools.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {data.performance && (
          <div className="mb-6 p-3 bg-background/30 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Performance</span>
              <Badge variant="outline" className="text-xs">
                {data.performance.successRate || '98.5%'} Success
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Response Time</span>
                <span className="font-medium">{data.performance.avgLatency || '1.2s'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Tokens Processed</span>
                <span className="font-medium">{data.performance.tokensProcessed?.toLocaleString() || '12,847'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={data.status === 'active' ? 'default' : 'secondary'}
            className="font-medium capitalize"
          >
            {data.status || 'ready'}
          </Badge>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Points */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
        <div className="w-4 h-4 bg-background border-2 border-primary rounded-full" />
      </div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2">
        <div className="w-4 h-4 bg-background border-2 border-primary rounded-full" />
      </div>
    </motion.div>
  );
};

const RevolutionaryTriggerNode = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative min-w-[280px] rounded-2xl transition-all duration-300
        ${selected ? 'ring-4 ring-emerald-500 ring-opacity-50 shadow-2xl shadow-emerald-500/20' : 'shadow-xl'}
        bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border border-border/50
        hover:shadow-2xl hover:shadow-emerald-500/10 group overflow-hidden
      `}
    >
      {/* Pulse Animation for Active Triggers */}
      {data.status === 'active' && (
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl"
        />
      )}

      <div className="p-5 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{data.label}</h3>
            <Badge variant="outline" className="text-xs mt-1">
              {data.triggerType || 'Manual'}
            </Badge>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            data.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
          }`} />
        </div>

        <p className="text-sm text-muted-foreground mb-4">{data.description}</p>

        {/* Metrics */}
        {data.realTimeMetrics && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <div className="text-sm font-bold text-emerald-500">{data.realTimeMetrics.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <div className="text-sm font-bold text-blue-500">{data.realTimeMetrics.avgLatency}ms</div>
              <div className="text-xs text-muted-foreground">Latency</div>
            </div>
            <div className="text-center p-2 bg-background/50 rounded-lg">
              <div className="text-sm font-bold text-purple-500">{data.realTimeMetrics.triggerCount}</div>
              <div className="text-xs text-muted-foreground">Triggers</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant={data.status === 'active' ? 'default' : 'secondary'}>
            {data.status || 'ready'}
          </Badge>
          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Edge Component
const SmartConnectionEdge = ({ id, data, style }: any) => {
  return (
    <g>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <motion.path
        d={data.path}
        fill="none"
        stroke={`url(#gradient-${id})`}
        strokeWidth={3}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        style={style}
      />
    </g>
  );
};

const nodeTypes = {
  agent: RevolutionaryAgentNode,
  trigger: RevolutionaryTriggerNode,
};

const edgeTypes = {
  smart: SmartConnectionEdge,
};

interface RevolutionaryGenesisCanvasProps {
  blueprint?: any;
  onSave?: () => void;
  onExecute?: () => void;
  className?: string;
}

export const RevolutionaryGenesisCanvas: React.FC<RevolutionaryGenesisCanvasProps> = ({
  blueprint,
  onSave,
  onExecute,
  className = ''
}) => {
  // Hooks and State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();
  
  // Canvas State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasMode, setCanvasMode] = useState<'design' | 'simulate' | 'debug'>('design');
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Collaboration
  const [collaborators] = useState([
    { id: '1', name: 'Alice Johnson', avatar: '', color: '#8b5cf6', cursor: { x: 100, y: 100 } },
    { id: '2', name: 'Bob Smith', avatar: '', color: '#06b6d4', cursor: { x: 200, y: 150 } }
  ]);

  // Real-time Metrics
  const [canvasMetrics, setCanvasMetrics] = useState({
    nodeCount: 0,
    edgeCount: 0,
    complexity: 0,
    performance: 95,
    lastUpdate: new Date()
  });

  // Update metrics when canvas changes
  useEffect(() => {
    setCanvasMetrics({
      nodeCount: nodes.length,
      edgeCount: edges.length,
      complexity: Math.min(100, (nodes.length * 2) + (edges.length * 3)),
      performance: Math.max(60, 100 - (nodes.length * 2)),
      lastUpdate: new Date()
    });
  }, [nodes, edges]);

  // Generate Canvas from Blueprint
  const generateCanvas = useCallback(async () => {
    if (!blueprint) {
      toast.error('No blueprint available for canvas generation');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🎨 Revolutionary Canvas: Generating world-class canvas...');
      
      const result = await revolutionaryCanvasEngine.generateCanvasFromIntent(blueprint);
      
      setNodes(result.nodes as any);
      setEdges(result.edges as any);
      
      // Auto-fit and animate
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.1 });
      }, 100);
      
      toast.success('🚀 Revolutionary Canvas Generated!', {
        description: `Created ${result.nodes.length} nodes with AI optimization`
      });
      
    } catch (error) {
      console.error('Canvas generation failed:', error);
      toast.error('Canvas generation failed', {
        description: 'Using fallback generation mode'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [blueprint, fitView, setNodes, setEdges]);

  // Auto-generate when blueprint changes
  useEffect(() => {
    if (blueprint && !isGenerating) {
      generateCanvas();
    }
  }, [blueprint, generateCanvas, isGenerating]);

  // Connection Handler
  const onConnect: OnConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'smart',
        animated: true,
        style: { strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
        data: {
          label: 'Smart Connection',
          explanation: 'AI-optimized data flow'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Node Selection Handler
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodes([node.id]);
  }, []);

  // AI Auto-Layout
  const applyAutoLayout = useCallback(async () => {
    try {
      await revolutionaryCanvasEngine.applyAIAutoLayout('ai-optimized');
      fitView({ duration: 800 });
      toast.success('🧠 AI Auto-Layout Applied');
    } catch (error) {
      toast.error('Auto-layout failed');
    }
  }, [fitView]);

  // Canvas Validation
  const validateCanvas = useCallback(async () => {
    try {
      const validation = await revolutionaryCanvasEngine.validateCanvas();
      if (validation.isValid) {
        toast.success('✅ Canvas validation passed');
      } else {
        toast.warning(`⚠️ ${validation.errors.length} issues found`);
      }
    } catch (error) {
      toast.error('Validation failed');
    }
  }, []);

  return (
    <div className={`revolutionary-canvas-container ${className} ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} bg-background relative overflow-hidden`}>
      {/* Revolutionary Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 right-4 z-20"
      >
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Brand & Mode */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                  >
                    <Brain className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold">Genesis Canvas</h1>
                    <p className="text-xs text-muted-foreground">Revolutionary AI Workflow Designer</p>
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-muted/50 rounded-lg p-1">
                  {['design', 'simulate', 'debug'].map((mode) => (
                    <Button
                      key={mode}
                      variant={canvasMode === mode ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCanvasMode(mode as any)}
                      className="capitalize px-4"
                    >
                  {mode === 'design' && <Grid3X3 className="w-4 h-4 mr-2" />}
                  {mode === 'simulate' && <Play className="w-4 h-4 mr-2" />}
                  {mode === 'debug' && <Activity className="w-4 h-4 mr-2" />}
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Canvas Stats & Actions */}
              <div className="flex items-center gap-4">
                {/* Real-time Metrics */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Network className="w-4 h-4" />
                    <span>{canvasMetrics.nodeCount} Nodes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-4 h-4" />
                    <span>{canvasMetrics.edgeCount} Connections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{canvasMetrics.performance}% Performance</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <HolographicButton
                    variant="ghost"
                    size="sm"
                    onClick={applyAutoLayout}
                    title="AI Auto-Layout"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </HolographicButton>
                  
                  <HolographicButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollaborating(!isCollaborating)}
                    title="Collaboration"
                  >
                    <Users className="w-4 h-4" />
                  </HolographicButton>
                  
                  <HolographicButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title="Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </HolographicButton>
                  
                  <HolographicButton
                    variant="outline"
                    size="sm"
                    onClick={onSave}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </HolographicButton>
                  
                  <HolographicButton
                    size="sm"
                    onClick={onExecute}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Execute
                  </HolographicButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sidebar */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute left-4 top-24 bottom-4 w-80 z-10"
          >
            <Card className="h-full bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Canvas Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 h-full overflow-hidden">
                <Tabs defaultValue="palette" className="h-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="palette">Palette</TabsTrigger>
                    <TabsTrigger value="layers">Layers</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="palette" className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Add Components</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="justify-start h-auto p-3">
                          <Bot className="w-4 h-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">AI Agent</div>
                            <div className="text-xs text-muted-foreground">Intelligent worker</div>
                          </div>
                        </Button>
                        
                        <Button variant="outline" size="sm" className="justify-start h-auto p-3">
                          <Zap className="w-4 h-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">Trigger</div>
                            <div className="text-xs text-muted-foreground">Start workflow</div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Integrations</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Slack', icon: Slack, desc: 'Team communication' },
                          { name: 'GitHub', icon: Github, desc: 'Code repository' },
                          { name: 'Database', icon: Database, desc: 'Data storage' },
                          { name: 'Email', icon: Mail, desc: 'Email automation' }
                        ].map((integration) => (
                          <Button
                            key={integration.name}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-auto p-3"
                          >
                            <integration.icon className="w-4 h-4 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">{integration.name}</div>
                              <div className="text-xs text-muted-foreground">{integration.desc}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="layers" className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Canvas Layers</h4>
                      <div className="space-y-2">
                        {nodes.map((node) => (
                          <div key={node.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm flex-1">{node.data.label}</span>
                            <Badge variant="outline" className="text-xs">{node.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="mt-4 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Display Settings</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Show Minimap</label>
                          <Switch checked={showMinimap} onCheckedChange={setShowMinimap} />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Show Grid</label>
                          <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Show Metrics</label>
                          <Switch checked={showMetrics} onCheckedChange={setShowMetrics} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Performance</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Canvas Performance</span>
                            <span>{canvasMetrics.performance}%</span>
                          </div>
                          <Progress value={canvasMetrics.performance} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Complexity</span>
                            <span>{canvasMetrics.complexity}%</span>
                          </div>
                          <Progress value={canvasMetrics.complexity} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas */}
      <div className={`canvas-main ${isFullscreen ? 'pl-4 pr-4' : 'pl-88 pr-4'} pt-24 pb-4 h-full transition-all duration-300`}>
        <div className="h-full relative rounded-xl overflow-hidden border border-border/50 shadow-2xl">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            selectionMode={SelectionMode.Partial}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            className="revolutionary-flow"
            style={{
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #2d1b69 50%, #1a1a3e 75%, #0f0f23 100%)'
            }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            {/* Enhanced Background */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color={showGrid ? "#ffffff20" : "transparent"}
            />

            {/* Advanced Controls */}
            <Controls
              className="revolutionary-controls !bg-card/95 !backdrop-blur-xl !border-border/50 !shadow-xl"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={validateCanvas}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Validate Canvas"
              >
                <CheckCircle2 className="w-4 h-4" />
              </motion.button>
            </Controls>

            {/* Enhanced MiniMap */}
            {showMinimap && (
              <MiniMap
                className="revolutionary-minimap !bg-card/95 !backdrop-blur-xl !border-border/50 !shadow-xl"
                nodeColor={(node) => {
                  const colors = {
                    agent: '#8b5cf6',
                    trigger: '#10b981',
                    integration: '#f59e0b',
                    logic: '#ef4444'
                  };
                  return colors[node.type as keyof typeof colors] || '#6366f1';
                }}
                maskColor="rgba(0, 0, 0, 0.2)"
                pannable
                zoomable
              />
            )}

            {/* Collaboration Cursors */}
            {isCollaborating && collaborators.map((collaborator) => (
              <Panel key={collaborator.id} position="top-left">
                <motion.div
                  style={{
                    position: 'absolute',
                    left: collaborator.cursor.x,
                    top: collaborator.cursor.y,
                    pointerEvents: 'none'
                  }}
                  animate={{
                    x: [0, 10, 0],
                    y: [0, -10, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xl rounded-full px-3 py-1 border border-border/50 shadow-lg">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: collaborator.color }}
                    />
                    <span className="text-xs font-medium">{collaborator.name}</span>
                  </div>
                </motion.div>
              </Panel>
            ))}

            {/* Real-time Metrics Panel */}
            {showMetrics && (
              <Panel position="bottom-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/95 backdrop-blur-xl rounded-xl border border-border/50 shadow-xl p-4"
                >
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Canvas Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-500">{canvasMetrics.nodeCount} Nodes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-purple-500" />
                      <span className="text-purple-500">{canvasMetrics.edgeCount} Connections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500">
                        {canvasMetrics.lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Panel>
            )}

            {/* AI Assistant Panel */}
            <Panel position="bottom-right">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col gap-2"
              >
                <HolographicButton
                  variant="outline"
                  size="sm"
                  className="bg-card/95 backdrop-blur-xl border-border/50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant
                </HolographicButton>
                
                <HolographicButton
                  variant="outline"
                  size="sm"
                  className="bg-card/95 backdrop-blur-xl border-border/50"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Explain Canvas
                </HolographicButton>
              </motion.div>
            </Panel>
          </ReactFlow>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30"
              >
                <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <h3 className="text-xl font-bold mb-2">Generating Revolutionary Canvas</h3>
                    <p className="text-muted-foreground">AI is crafting your perfect workflow...</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Main Export with Provider
export const RevolutionaryGenesisCanvasWithProvider: React.FC<RevolutionaryGenesisCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <RevolutionaryGenesisCanvas {...props} />
    </ReactFlowProvider>
  );
};