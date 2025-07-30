import { useCallback, useState, useEffect, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Bot, Settings, Play, Share2, Users, Save, Zap, 
  Brain, Workflow, GitBranch, Plug, Database, Mail, Slack, Code,
  Eye, EyeOff, Grid3X3, Layers, 
  History, Palette, MousePointer2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { BackendStatus } from '../ui/BackendStatus';
import { useToast } from '../ui/use-toast';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { NodeData, CanvasEdge } from '../../types/canvas';
import { canvasIntegrationService } from '../../services/canvasIntegrationService';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import { IntegrationNode } from './nodes/IntegrationNode';

// Enhanced node types for enterprise-grade canvas
const EnhancedAgentNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const Icon = data.icon || Bot;
  return (
    <div className={`
      relative min-w-[240px] rounded-xl border-2 transition-all duration-300
      ${selected ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'border-border/50'}
      bg-card/95 backdrop-blur-sm shadow-lg hover:shadow-xl group
    `}>
      <div className={`h-1.5 rounded-t-xl bg-gradient-to-r ${data.color || 'from-purple-500 to-pink-500'}`} />
      
      {/* Agent Avatar & Status */}
      <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 border-2 border-background flex items-center justify-center">
        <Icon className="w-4 h-4 text-white" />
      </div>
      
      {/* Status Indicator */}
      <div className="absolute top-3 right-3">
        <div className={`w-3 h-3 rounded-full ${
          data.status === 'active' ? 'bg-emerald-500 animate-pulse' : 
          data.status === 'ready' ? 'bg-blue-500' : 'bg-gray-400'
        }`} />
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${data.color || 'from-purple-500 to-pink-500'} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg">{data.label}</h3>
            <p className="text-sm text-muted-foreground font-medium">{data.role}</p>
            {data.model && (
              <Badge variant="secondary" className="text-xs mt-1">{data.model}</Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{data.description}</p>

        {/* Capabilities */}
        {data.tools && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">CAPABILITIES</p>
            <div className="flex flex-wrap gap-1">
              {data.tools.slice(0, 3).map((tool: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tool}
                </Badge>
              ))}
              {data.tools.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{data.tools.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {data.metrics && (
          <div className="mb-4 p-2 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-semibold">{data.metrics.successRate || '95%'}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Avg Response</span>
              <span className="font-semibold">{data.metrics.avgResponse || '1.2s'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge 
            variant={data.status === 'active' ? 'default' : 'secondary'}
            className="text-xs font-medium"
          >
            {data.status || 'ready'}
          </Badge>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhancedTriggerNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const Icon = data.icon || Play;
  return (
    <div className={`
      relative min-w-[200px] rounded-xl border-2 transition-all duration-300
      ${selected ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105' : 'border-border/50'}
      bg-card/95 backdrop-blur-sm shadow-lg hover:shadow-xl group
    `}>
      <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-emerald-500 to-teal-500" />
      
      {/* Pulse Animation for Active Triggers */}
      {data.status === 'active' && (
        <div className="absolute inset-0 rounded-xl border-2 border-emerald-500 animate-ping opacity-20" />
      )}

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{data.label}</h3>
            <p className="text-xs text-muted-foreground uppercase font-medium">{data.triggerType}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{data.description}</p>

        {/* Schedule Info */}
        {data.schedule && (
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-3">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{data.schedule}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600">
            {data.status || 'ready'}
          </Badge>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  agent: EnhancedAgentNode,
  trigger: EnhancedTriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  integration: IntegrationNode,
};

interface EnterpriseQuantumCanvasProps {
  nodes?: Node<NodeData>[];
  edges?: CanvasEdge[];
  onSaveBlueprint: () => void;
  onRunSimulation: () => void;
  onInviteCollaborator?: () => void;
  onShareWorkflow?: () => void;
  isLoading?: boolean;
}

export function EnterpriseQuantumCanvas({ 
  nodes: initialNodes = [],
  edges: initialEdges = [],
  onSaveBlueprint, 
  onRunSimulation,
  onInviteCollaborator,
  onShareWorkflow,
  isLoading = false
}: EnterpriseQuantumCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const [isGridVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { toast } = useToast();

  // Update nodes when props change
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
        id: `e${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: true,
        style: { strokeWidth: 2, stroke: 'hsl(var(--primary))' },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }
      };
      setEdges((eds: CanvasEdge[]) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const handleCollaborate = useCallback(() => {
    setIsCollaborating(!isCollaborating);
    if (onInviteCollaborator) {
      onInviteCollaborator();
    }
    toast({
      title: "Collaboration Mode",
      description: isCollaborating ? "Collaboration disabled" : "Real-time collaboration enabled",
    });
  }, [isCollaborating, onInviteCollaborator, toast]);

  const handleShare = useCallback(() => {
    if (onShareWorkflow) {
      onShareWorkflow();
    }
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Workflow Shared",
      description: "Shareable link copied to clipboard",
    });
  }, [onShareWorkflow, toast]);

  const getNodeStats = () => {
    const agentCount = nodes.filter(n => n.type === 'agent').length;
    const triggerCount = nodes.filter(n => n.type === 'trigger').length;
    const actionCount = nodes.filter(n => n.type === 'action').length;
    const conditionCount = nodes.filter(n => n.type === 'condition').length;
    const integrationCount = nodes.filter(n => n.type === 'integration').length;
    
    return { 
      agentCount, 
      triggerCount, 
      actionCount, 
      conditionCount,
      integrationCount,
      connectionCount: edges.length,
      totalNodes: nodes.length 
    };
  };

  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = node.data.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || node.type === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [nodes, searchTerm, selectedFilter]);

  const stats = getNodeStats();

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-muted-foreground text-lg">Generating your enterprise workflow...</p>
          <p className="text-muted-foreground/60 text-sm mt-2">Orchestrating AI agents and integrations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-background">
      {/* Enhanced Top Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg">Genesis Canvas Pro</span>
                  <p className="text-xs text-muted-foreground">Enterprise AI Workflow Designer</p>
                </div>
              </div>
              
              {/* Backend Status Integration */}
              <BackendStatus />
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Bot className="w-4 h-4" />
                  <span>{stats.agentCount} Agents</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>{stats.connectionCount} Connections</span>
                </div>
                <div className="flex items-center gap-1">
                  <Workflow className="w-4 h-4" />
                  <span>{stats.totalNodes} Nodes</span>
                </div>
                <Badge variant={isCollaborating ? "default" : "secondary"} className="font-medium">
                  {isCollaborating ? "Live Collaboration" : "Design Mode"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsMinimapVisible(!isMinimapVisible)}
            className="bg-card/95 backdrop-blur-sm"
          >
            {isMinimapVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="bg-card/95 backdrop-blur-sm"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCollaborate}
            className="bg-card/95 backdrop-blur-sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Collaborate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSaveBlueprint}
            className="bg-card/95 backdrop-blur-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save & Version
          </Button>
          <Button 
            size="sm" 
            onClick={async () => {
              try {
                console.log('🚀 Phase 1: Canvas-to-Execution Pipeline Test');
                const safeNodes = nodes.map(n => ({ ...n, type: n.type || 'default' }));
                const result = await canvasIntegrationService.convertCanvasToWorkflow(safeNodes, edges);
                console.log('✅ Canvas converted to workflow:', result);
                onRunSimulation();
                toast({
                  title: "Simulation Launched",
                  description: `Workflow ${result.workflow_id} execution started`,
                });
              } catch (error) {
                console.error('Canvas execution failed:', error);
                toast({
                  title: "Simulation Failed", 
                  description: "Using fallback simulation mode",
                  variant: "destructive"
                });
                onRunSimulation(); // Still proceed with fallback
              }
            }}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Play className="w-4 h-4 mr-2" />
            Launch Simulation
          </Button>
        </div>
      </div>

      {/* Left Sidebar - Node Palette */}
      <div className="absolute left-4 top-20 bottom-4 z-10 w-80">
        <Card className="h-full bg-card/95 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 h-full">
            <Tabs defaultValue="nodes" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="nodes">Nodes</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="nodes" className="h-full mt-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Add Components</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <Bot className="w-4 h-4 mr-2" />
                      AI Agent
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Play className="w-4 h-4 mr-2" />
                      Trigger
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <GitBranch className="w-4 h-4 mr-2" />
                      Condition
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Plug className="w-4 h-4 mr-2" />
                      Integration
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold text-sm mb-3">Integrations</h3>
                    <div className="space-y-2">
                      {[
                        { name: 'Slack', icon: Slack, color: 'from-purple-500 to-purple-600' },
                        { name: 'Database', icon: Database, color: 'from-blue-500 to-blue-600' },
                        { name: 'Email', icon: Mail, color: 'from-emerald-500 to-emerald-600' },
                        { name: 'API', icon: Code, color: 'from-orange-500 to-orange-600' },
                      ].map((integration) => (
                        <Button 
                          key={integration.name}
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start"
                        >
                          <integration.icon className="w-4 h-4 mr-2" />
                          {integration.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="search" className="mt-4">
                <div className="space-y-3">
                  <Input 
                    placeholder="Search nodes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="agent">Agents</SelectItem>
                      <SelectItem value="trigger">Triggers</SelectItem>
                      <SelectItem value="action">Actions</SelectItem>
                      <SelectItem value="condition">Conditions</SelectItem>
                      <SelectItem value="integration">Integrations</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="space-y-1">
                    {filteredNodes.map(node => (
                      <div key={node.id} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-primary`} />
                          <span className="text-sm">{node.data.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="layers" className="mt-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Canvas Controls</h3>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Toggle Grid
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Layers className="w-4 h-4 mr-2" />
                      Layer Manager
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Palette className="w-4 h-4 mr-2" />
                      Theme Colors
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Canvas */}
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
        style={{ marginLeft: '320px' }}
      >
        <Background 
          variant={isGridVisible ? BackgroundVariant.Dots : BackgroundVariant.Lines}
          gap={20} 
          size={1} 
          className="opacity-30"
        />
        <Controls 
          className="bg-card border border-border shadow-lg"
          showInteractive={false}
        />
        {isMinimapVisible && (
          <MiniMap 
            nodeStrokeColor={() => 'hsl(var(--border))'}
            nodeColor={(node) => {
              if (node.type === 'agent') return 'hsl(var(--primary))';
              if (node.type === 'trigger') return 'hsl(var(--emerald-500))';
              if (node.type === 'action') return 'hsl(var(--orange-500))';
              if (node.type === 'condition') return 'hsl(var(--amber-500))';
              if (node.type === 'integration') return 'hsl(var(--blue-500))';
              return 'hsl(var(--muted))';
            }}
            nodeBorderRadius={8}
            position="bottom-right"
            className="bg-card border border-border shadow-lg rounded-lg overflow-hidden"
          />
        )}

        {/* Enhanced Features Panel */}
        <Panel position="bottom-center">
          <div className="flex gap-3 p-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Assistant</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Voice commands, auto-layout, intelligent suggestions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Live Collaboration</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Real-time editing, cursor tracking, voice chat
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Version Control</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-save, branching, time-travel debugging
                </p>
              </CardContent>
            </Card>
          </div>
        </Panel>

        {/* Collaboration Indicator */}
        {isCollaborating && (
          <Panel position="top-center">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-2 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">3 users online • Live sync active</span>
                </div>
              </CardContent>
            </Card>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}