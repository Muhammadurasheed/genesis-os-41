import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
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
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Settings, Play, Share2, Users, Save, Zap, Brain,
  GitBranch, Plug, Database, Mail, Slack, Code, Eye, EyeOff,
  Command, Layout, Mic, MicOff,
  Crown, Globe, Clock, Rocket, CheckCircle,
  Activity, TrendingUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { useToast } from '../ui/use-toast';
import { NodeData, CanvasEdge } from '../../types/canvas';

// Production-grade node components with enterprise design
const ProductionAgentNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const Icon = data.icon || Bot;
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`
        relative min-w-[280px] rounded-2xl border-2 transition-all duration-300
        ${selected ? 'border-primary shadow-2xl shadow-primary/30 scale-105' : 'border-border/30 hover:border-border/60'}
        bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm shadow-xl
        group cursor-pointer
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Status LED */}
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 border-4 border-background flex items-center justify-center shadow-lg">
        <div className={`w-2 h-2 rounded-full ${
          data.status === 'active' ? 'bg-emerald-400 animate-pulse' : 
          data.status === 'ready' ? 'bg-blue-400' : 'bg-gray-400'
        }`} />
      </div>
      
      {/* Performance Indicator */}
      <div className="absolute top-4 right-4">
        <Badge variant="secondary" className="text-xs font-medium bg-background/50 backdrop-blur-sm">
          {data.metrics?.successRate || '98%'}
        </Badge>
      </div>

      {/* Header with gradient accent */}
      <div className={`h-2 rounded-t-2xl bg-gradient-to-r ${data.color || 'from-purple-500 via-pink-500 to-purple-600'}`} />
      
      <div className="p-6">
        {/* Agent Title & Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-4 rounded-xl bg-gradient-to-r ${data.color || 'from-purple-500 to-pink-500'} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-xl mb-1">{data.label}</h3>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{data.role}</p>
            {data.model && (
              <Badge variant="outline" className="text-xs mt-2 font-mono">{data.model}</Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed line-clamp-2">{data.description}</p>

        {/* Capabilities Grid */}
        {data.tools && (
          <div className="mb-5">
            <p className="text-xs font-bold text-muted-foreground mb-3 tracking-wider">CAPABILITIES</p>
            <div className="grid grid-cols-2 gap-2">
              {data.tools.slice(0, 4).map((tool: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs justify-center py-1">
                  {tool}
                </Badge>
              ))}
              {data.tools.length > 4 && (
                <Badge variant="outline" className="text-xs justify-center py-1">
                  +{data.tools.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {data.metrics && (
          <div className="mb-5 p-3 bg-muted/20 rounded-xl border border-border/30">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block">Success Rate</span>
                <span className="font-bold text-emerald-600">{data.metrics.successRate || '98%'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Avg Response</span>
                <span className="font-bold text-blue-600">{data.metrics.avgResponse || '0.8s'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={data.status === 'active' ? 'default' : 'secondary'}
            className="text-xs font-medium px-3 py-1"
          >
            <Activity className="w-3 h-3 mr-1" />
            {data.status || 'ready'}
          </Badge>
          
          <AnimatePresence>
            {isHovered && (
              <motion.div 
                className="flex gap-1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Settings className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Connection Handles */}
      <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background border-2 border-border rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-muted rounded-full" />
      </div>
      <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background border-2 border-border rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-muted rounded-full" />
      </div>
    </motion.div>
  );
};

const ProductionTriggerNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const Icon = data.icon || Play;
  
  return (
    <motion.div
      className={`
        relative min-w-[240px] rounded-2xl border-2 transition-all duration-300
        ${selected ? 'border-emerald-500 shadow-2xl shadow-emerald-500/30 scale-105' : 'border-border/30 hover:border-emerald-500/50'}
        bg-gradient-to-br from-emerald-50/90 to-emerald-100/80 dark:from-emerald-950/90 dark:to-emerald-900/80 
        backdrop-blur-sm shadow-xl group cursor-pointer
      `}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Trigger Status Pulse */}
      {data.status === 'active' && (
        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 animate-ping opacity-30" />
      )}
      
      <div className="h-2 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
      
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg">{data.label}</h3>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{data.triggerType}</p>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{data.description}</p>

        {data.schedule && (
          <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl mb-4 border border-emerald-200/50 dark:border-emerald-800/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {data.schedule.frequency} • Next: {data.schedule.nextRun || 'Not scheduled'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
            <Zap className="w-3 h-3 mr-1" />
            {data.status || 'ready'}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

const ProductionIntegrationNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const Icon = data.icon || Plug;
  
  return (
    <motion.div
      className={`
        relative min-w-[200px] rounded-2xl border-2 transition-all duration-300
        ${selected ? 'border-blue-500 shadow-2xl shadow-blue-500/30 scale-105' : 'border-border/30 hover:border-blue-500/50'}
        bg-gradient-to-br from-blue-50/90 to-blue-100/80 dark:from-blue-950/90 dark:to-blue-900/80 
        backdrop-blur-sm shadow-xl group cursor-pointer
      `}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="h-2 rounded-t-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{data.label}</h3>
            <p className="text-xs text-muted-foreground uppercase font-medium">{data.integrationType}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{data.description}</p>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
            <Globe className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

const ProductionConditionNode = ({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <motion.div
      className={`
        relative min-w-[180px] rounded-2xl border-2 transition-all duration-300
        ${selected ? 'border-orange-500 shadow-2xl shadow-orange-500/30 scale-105' : 'border-border/30 hover:border-orange-500/50'}
        bg-gradient-to-br from-orange-50/90 to-orange-100/80 dark:from-orange-950/90 dark:to-orange-900/80 
        backdrop-blur-sm shadow-xl group cursor-pointer
      `}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="h-2 rounded-t-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{data.label}</h3>
            <p className="text-xs text-muted-foreground uppercase font-medium">{data.conditionType}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{data.condition}</p>

        {/* True/False handles */}
        <div className="flex justify-between text-xs">
          <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
            True
          </Badge>
          <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 dark:bg-red-950">
            False
          </Badge>
        </div>
      </div>

      {/* Special handles for conditions */}
      <div className="absolute bottom-0 left-6 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background transform translate-y-2">
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-emerald-600 font-bold">T</div>
      </div>
      <div className="absolute bottom-0 right-6 w-4 h-4 bg-red-500 rounded-full border-2 border-background transform translate-y-2">
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-bold">F</div>
      </div>
    </motion.div>
  );
};

const nodeTypes = {
  agent: ProductionAgentNode,
  trigger: ProductionTriggerNode,
  integration: ProductionIntegrationNode,
  condition: ProductionConditionNode,
};

interface ProductionCanvasProps {
  nodes?: Node<NodeData>[];
  edges?: CanvasEdge[];
  onSaveBlueprint: () => void;
  onRunSimulation: () => void;
  onInviteCollaborator?: () => void;
  onShareWorkflow?: () => void;
  isLoading?: boolean;
}

const ProductionCanvasInner = ({ 
  nodes: initialNodes = [],
  edges: initialEdges = [],
  onSaveBlueprint, 
  onRunSimulation,
  onShareWorkflow,
  isLoading = false
}: ProductionCanvasProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  // Update nodes and edges when props change
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const edge: CanvasEdge = {
        ...params,
        id: `e${params.source}-${params.target}-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        style: { 
          strokeWidth: 3, 
          stroke: '#6366f1',
          filter: 'drop-shadow(0px 2px 4px rgba(99, 102, 241, 0.3))'
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: '#6366f1',
          width: 20,
          height: 20
        }
      };
      setEdges((eds: CanvasEdge[]) => addEdge(edge, eds));
      
      toast({
        title: "Connection Created",
        description: "Agents are now linked in your workflow",
      });
    },
    [setEdges, toast]
  );

  const addSmartNode = useCallback((type: string) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { 
        x: Math.random() * 500 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: getNodeDefaults(type)
    };
    
    setNodes((nds) => [...nds, newNode as any]);
    
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Added`,
      description: "New component added to your workflow",
    });
  }, [setNodes, toast]);

  const getNodeDefaults = (type: string): NodeData => {
    const defaults: Record<string, any> = {
      agent: {
        label: `AI Agent ${Date.now().toString().slice(-4)}`,
        role: 'Intelligent Assistant',
        description: 'Autonomous AI agent ready for task execution',
        tools: ['analysis', 'communication', 'automation'],
        icon: Bot,
        color: 'from-purple-500 to-pink-500',
        status: 'ready',
        model: 'Gemini Pro',
        metrics: { successRate: '98%', avgResponse: '0.8s' }
      },
      trigger: {
        label: `Smart Trigger ${Date.now().toString().slice(-4)}`,
        triggerType: 'manual',
        description: 'Initiates workflow execution',
        icon: Play,
        color: 'from-emerald-500 to-teal-500',
        status: 'ready'
      },
      integration: {
        label: `Integration ${Date.now().toString().slice(-4)}`,
        integrationType: 'api',
        description: 'External service integration',
        icon: Plug,
        color: 'from-blue-500 to-cyan-500',
        status: 'connected'
      },
      condition: {
        label: `Logic Gate ${Date.now().toString().slice(-4)}`,
        conditionType: 'if',
        condition: 'value > threshold',
        status: 'ready'
      }
    };
    return defaults[type] || defaults.agent;
  };

  const getNodeStats = () => {
    const agentCount = nodes.filter(n => n.type === 'agent').length;
    const triggerCount = nodes.filter(n => n.type === 'trigger').length;
    const integrationCount = nodes.filter(n => n.type === 'integration').length;
    const conditionCount = nodes.filter(n => n.type === 'condition').length;
    
    return { 
      agentCount, 
      triggerCount, 
      integrationCount,
      conditionCount,
      connectionCount: edges.length,
      totalNodes: nodes.length 
    };
  };

  const stats = getNodeStats();

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <motion.div
              className="absolute inset-0 w-24 h-24 border-4 border-pink-500/20 border-b-pink-500 rounded-full animate-spin mx-auto"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">AI Canvas Generation</h2>
          <p className="text-gray-300 mb-3 text-lg">Orchestrating your intelligent workflow...</p>
          <div className="flex items-center justify-center gap-2 text-purple-300">
            <Brain className="w-5 h-5" />
            <span>Neural network optimization in progress</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Left Sidebar - Enterprise Node Palette */}
      <motion.div 
        className={`absolute left-0 top-0 bottom-0 z-20 bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-2xl transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}
        initial={{ x: -320 }}
        animate={{ x: 0 }}
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-bold text-lg">Component Library</h2>
                <p className="text-sm text-muted-foreground">Drag to add components</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              <Layout className="w-4 h-4" />
            </Button>
          </div>
          
          {!sidebarCollapsed && (
            <Input 
              placeholder="Search components..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          )}
        </div>

        <div className="p-4 space-y-6">
          {!sidebarCollapsed ? (
            <>
              {/* AI Agents Section */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">AI Agents</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => addSmartNode('agent')}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">AI Agent</div>
                      <div className="text-xs text-muted-foreground">Intelligent task executor</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Triggers Section */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Triggers</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => addSmartNode('trigger')}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Smart Trigger</div>
                      <div className="text-xs text-muted-foreground">Workflow initiator</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Logic Section */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Logic & Flow</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => addSmartNode('condition')}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
                      <GitBranch className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Condition</div>
                      <div className="text-xs text-muted-foreground">Decision logic</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Integrations Section */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Integrations</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Slack', icon: Slack, color: 'from-purple-500 to-purple-600' },
                    { name: 'Database', icon: Database, color: 'from-blue-500 to-blue-600' },
                    { name: 'Email', icon: Mail, color: 'from-emerald-500 to-emerald-600' },
                    { name: 'API', icon: Code, color: 'from-orange-500 to-orange-600' },
                  ].map((integration) => (
                    <Button 
                      key={integration.name}
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start gap-3 h-10"
                      onClick={() => addSmartNode('integration')}
                    >
                      <div className={`p-1.5 rounded-md bg-gradient-to-r ${integration.color}`}>
                        <integration.icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-medium">{integration.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-12 p-0"
                onClick={() => addSmartNode('agent')}
              >
                <Bot className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-12 p-0"
                onClick={() => addSmartNode('trigger')}
              >
                <Play className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-12 p-0"
                onClick={() => addSmartNode('condition')}
              >
                <GitBranch className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Top Control Bar */}
      <div className={`absolute top-0 right-0 z-10 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-80'}`}>
        <div className="bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg p-4">
          <div className="flex items-center justify-between">
            {/* Left: Canvas Info */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl">Genesis Enterprise Canvas</h1>
                  <p className="text-sm text-muted-foreground">Production-grade AI workflow designer</p>
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-12" />
              
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <Bot className="w-3 h-3" />
                  {stats.agentCount} Agents
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="w-3 h-3" />
                  {stats.connectionCount} Connections
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats.totalNodes} Total Nodes
                </Badge>
              </div>
            </div>

            {/* Right: Action Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVoiceActive(!isVoiceActive)}
                className={isVoiceActive ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : ''}
              >
                {isVoiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                Voice AI
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCollaborating(!isCollaborating)}
                className={isCollaborating ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
              >
                <Users className="w-4 h-4 mr-1" />
                Collaborate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMinimapVisible(!isMinimapVisible)}
              >
                {isMinimapVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onShareWorkflow}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onSaveBlueprint}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>

              <Button
                size="sm"
                onClick={onRunSimulation}
                className="bg-gradient-to-r from-primary to-primary/80 shadow-lg"
              >
                <Rocket className="w-4 h-4 mr-1" />
                Launch
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-80'} h-full pt-20`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          selectionMode={SelectionMode.Partial}
          snapToGrid={true}
          snapGrid={[15, 15]}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.1}
          maxZoom={2}
          className="bg-transparent"
          fitView
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            className="opacity-30"
          />
          
          <Controls 
            className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          
          {isMinimapVisible && (
            <MiniMap 
              className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg"
              nodeColor="#6366f1"
              maskColor="rgba(0, 0, 0, 0.1)"
              position="bottom-right"
            />
          )}

          {/* Floating Action Panel */}
          <Panel position="bottom-center">
            <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-muted-foreground">Canvas Active</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Command className="w-3 h-3 mr-1" />
                    Cmd+K for commands
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export const ProductionCanvas = (props: ProductionCanvasProps) => {
  return (
    <ReactFlowProvider>
      <ProductionCanvasInner {...props} />
    </ReactFlowProvider>
  );
};