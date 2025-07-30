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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Bot, Settings, Play, Share2, Users, Save, Zap, BarChart, MessageSquare, Target } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { NodeData, CanvasEdge } from '../../types/canvas';

// Enhanced node types with professional styling
const AgentNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const Icon = data.icon || Bot;
  return (
    <div className={`
      relative min-w-[200px] rounded-xl border-2 transition-all duration-200
      ${selected ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/50'}
      bg-card/95 backdrop-blur-sm shadow-lg hover:shadow-xl
    `}>
      <div className={`h-1 rounded-t-xl bg-gradient-to-r ${data.color || 'from-purple-500 to-pink-500'}`} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${data.color || 'from-purple-500 to-pink-500'}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{data.label}</h3>
            <p className="text-xs text-muted-foreground">{data.role}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {data.tools?.slice(0, 2).map((tool: string, idx: number) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tool}
            </Badge>
          ))}
          {data.tools?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{data.tools.length - 2}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Badge 
            variant={data.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {data.status || 'ready'}
          </Badge>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const TriggerNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const Icon = data.icon || Play;
  return (
    <div className={`
      relative min-w-[180px] rounded-xl border-2 transition-all duration-200
      ${selected ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-border/50'}
      bg-card/95 backdrop-blur-sm shadow-lg hover:shadow-xl
    `}>
      <div className="h-1 rounded-t-xl bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{data.label}</h3>
            <p className="text-xs text-muted-foreground uppercase">{data.triggerType}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>
    </div>
  );
};

const ActionNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const Icon = data.icon || Zap;
  return (
    <div className={`
      relative min-w-[180px] rounded-xl border-2 transition-all duration-200
      ${selected ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-border/50'}
      bg-card/95 backdrop-blur-sm shadow-lg hover:shadow-xl
    `}>
      <div className={`h-1 rounded-t-xl bg-gradient-to-r ${data.color || 'from-orange-500 to-red-500'}`} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${data.color || 'from-orange-500 to-red-500'}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{data.label}</h3>
            <p className="text-xs text-muted-foreground uppercase">{data.actionType}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{data.description}</p>
        {data.metrics && (
          <div className="mt-3 p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Success: {data.metrics.successRate}% | Avg: {data.metrics.avgExecutionTime}ms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  agent: AgentNode,
  trigger: TriggerNode,
  action: ActionNode,
};

interface EnhancedQuantumCanvasProps {
  nodes?: Node<NodeData>[];
  edges?: CanvasEdge[];
  onSaveBlueprint: () => void;
  onRunSimulation: () => void;
  onInviteCollaborator?: () => void;
  onShareWorkflow?: () => void;
  isLoading?: boolean;
}

export function EnhancedQuantumCanvas({ 
  nodes: initialNodes = [],
  edges: initialEdges = [],
  onSaveBlueprint, 
  onRunSimulation,
  onInviteCollaborator,
  onShareWorkflow,
  isLoading = false
}: EnhancedQuantumCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isCollaborating, setIsCollaborating] = useState(false);
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
    return { agentCount, triggerCount, actionCount, connectionCount: edges.length };
  };

  const stats = getNodeStats();

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-muted-foreground">Generating your workflow canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-background">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Card className="bg-card/95 backdrop-blur-sm border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-semibold">AI Canvas Designer Pro</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{stats.agentCount} Agents</span>
                <span>{stats.connectionCount} Connections</span>
                <Badge variant={isCollaborating ? "default" : "secondary"}>
                  {isCollaborating ? "AI Optimized" : "Draft"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
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
            onClick={onRunSimulation}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Play className="w-4 h-4 mr-2" />
            Launch Simulation
          </Button>
        </div>
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
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          className="opacity-30"
        />
        <Controls 
          className="bg-card border border-border shadow-lg"
          showInteractive={false}
        />
        <MiniMap 
          nodeStrokeColor={() => 'hsl(var(--border))'}
          nodeColor={(node) => {
            if (node.type === 'agent') return 'hsl(var(--primary))';
            if (node.type === 'trigger') return 'hsl(var(--emerald-500))';
            if (node.type === 'action') return 'hsl(var(--orange-500))';
            return 'hsl(var(--muted))';
          }}
          nodeBorderRadius={8}
          position="bottom-right"
          className="bg-card border border-border shadow-lg rounded-lg overflow-hidden"
        />

        {/* Features Panel */}
        <Panel position="bottom-left">
          <div className="grid grid-cols-2 gap-3 p-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg min-w-[400px]">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Real-time Sync</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get notifications for status changes and updates. Collaborate live with team members.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Voice Commands</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Natural language editing: "Add coordinator agent", "Connect to analyzer", "Auto-layout"
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">AI Suggestions</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Intelligent recommendations for optimal workflow design and agent connections.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Version Control</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-save, undo/redo, and version history. Never lose your brilliant ideas.
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
                  <span className="text-sm font-medium">Live Collaboration Active</span>
                </div>
              </CardContent>
            </Card>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}