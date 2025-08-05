import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  MarkerType
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network,
  Cpu,
  Play,
  Square,
  Monitor,
  Zap,
  Eye,
  Settings,
  BarChart3,
  Terminal
} from 'lucide-react';

import { GenesisAgentNode } from './nodes/GenesisAgentNode';
import { GenesisTriggerNode } from './nodes/GenesisTriggerNode';
import { GenesisIntegrationNode } from './nodes/GenesisIntegrationNode';
import { GenesisLogicNode } from './nodes/GenesisLogicNode';
import { GenesisDataFlowEdge } from './edges/GenesisDataFlowEdge';
import { IntelligentDataFlowEdge } from './edges/IntelligentDataFlowEdge';
import { HolographicButton } from '../ui/HolographicButton';
import { MagicalBackground } from '../ui/MagicalBackground';
import { GlassCard } from '../ui/GlassCard';
import gvae from '../../services/core/genesisVirtualAgentEnvironment';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  agent: GenesisAgentNode as any,
  trigger: GenesisTriggerNode as any,
  integration: GenesisIntegrationNode as any,
  logic: GenesisLogicNode as any,
};

const edgeTypes = {
  dataFlow: GenesisDataFlowEdge as any,
  intelligentDataFlow: IntelligentDataFlowEdge as any,
};

interface EnhancedGenesisCanvasProps {
  blueprint?: any;
  className?: string;
}

interface ExecutionState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentNode?: string;
  executionId?: string;
  startTime?: Date;
  metrics: {
    nodesExecuted: number;
    totalNodes: number;
    averageLatency: number;
    successRate: number;
  };
  liveData: {
    resourceUsage: {
      memory: number;
      cpu: number;
      network: number;
    };
    activeConnections: number;
    throughput: number;
  };
}

export const EnhancedGenesisCanvas: React.FC<EnhancedGenesisCanvasProps> = ({
  blueprint,
  className = ''
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [_selectedNode, setSelectedNode] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<'design' | 'execute' | 'debug' | 'monitor'>('design');
  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: 'idle',
    metrics: {
      nodesExecuted: 0,
      totalNodes: 0,
      averageLatency: 0,
      successRate: 100
    },
    liveData: {
      resourceUsage: { memory: 0, cpu: 0, network: 0 },
      activeConnections: 0,
      throughput: 0
    }
  });
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const { fitView } = useReactFlow();

  // Initialize canvas with blueprint
  useEffect(() => {
    if (blueprint) {
      generateCanvasFromBlueprint(blueprint);
    }
  }, [blueprint]);

  // Listen to GVAE events
  useEffect(() => {
    const handleExecutionStarted = (data: any) => {
      console.log('🚀 Execution started:', data);
      setExecutionState(prev => ({
        ...prev,
        status: 'running',
        executionId: data.executionId,
        startTime: new Date()
      }));
      setExecutionLogs(prev => [...prev, `🚀 Execution started: ${data.executionId}`]);
    };

    const handleActionCompleted = (data: any) => {
      console.log('✅ Action completed:', data);
      setExecutionLogs(prev => [...prev, `✅ ${data.type}: ${data.result?.message || 'Completed'}`]);
      
      // Update node status
      if (data.nodeId) {
        setNodes(prevNodes => 
          prevNodes.map(node => 
            node.id === data.nodeId 
              ? { ...node, data: { ...node.data, status: 'completed', lastResult: data.result } }
              : node
          )
        );
      }
    };

    const handleActionFailed = (data: any) => {
      console.log('❌ Action failed:', data);
      setExecutionLogs(prev => [...prev, `❌ ${data.type}: ${data.error}`]);
      
      // Update node status
      if (data.nodeId) {
        setNodes(prevNodes => 
          prevNodes.map(node => 
            node.id === data.nodeId 
              ? { ...node, data: { ...node.data, status: 'error', error: data.error } }
              : node
          )
        );
      }
    };

    const handleExecutionStopped = (data: any) => {
      console.log('🛑 Execution stopped:', data);
      setExecutionState(prev => ({
        ...prev,
        status: 'completed'
      }));
      setExecutionLogs(prev => [...prev, `🛑 Execution completed: ${data.executionId}`]);
    };

    // Subscribe to GVAE events
    gvae.on('executionStarted', handleExecutionStarted);
    gvae.on('actionCompleted', handleActionCompleted);
    gvae.on('actionFailed', handleActionFailed);
    gvae.on('executionStopped', handleExecutionStopped);

    return () => {
      gvae.off('executionStarted', handleExecutionStarted);
      gvae.off('actionCompleted', handleActionCompleted);
      gvae.off('actionFailed', handleActionFailed);
      gvae.off('executionStopped', handleExecutionStopped);
    };
  }, [setNodes]);

  // Update live metrics
  useEffect(() => {
    const interval = setInterval(() => {
      if (executionState.status === 'running') {
        setExecutionState(prev => ({
          ...prev,
          liveData: {
            resourceUsage: {
              memory: Math.random() * 100,
              cpu: Math.random() * 80,
              network: Math.random() * 1000
            },
            activeConnections: Math.floor(Math.random() * 10) + 1,
            throughput: Math.random() * 1000
          }
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [executionState.status]);

  const generateCanvasFromBlueprint = async (blueprint: any) => {
    try {
      console.log('🎨 Enhanced Genesis Canvas: Generating from blueprint...');
      
      const generatedNodes = await createIntelligentNodes(blueprint);
      const generatedEdges = await createIntelligentConnections(blueprint, generatedNodes);
      
      setNodes(generatedNodes as any);
      setEdges(generatedEdges as any);
      
      // Auto-layout with AI optimization
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
      
    } catch (error) {
      console.error('❌ Error generating canvas:', error);
    }
  };

  const createIntelligentNodes = async (blueprint: any): Promise<Node[]> => {
    const nodes: Node[] = [];
    let yOffset = 0;
    const nodeSpacing = 250;
    const structure = blueprint?.suggested_structure;

    if (!structure) return nodes;

    // Create trigger node with enhanced capabilities
    nodes.push({
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 100, y: yOffset },
      data: {
        label: `${structure.guild_name} Trigger`,
        triggerType: 'intelligent',
        description: `AI-powered trigger for ${structure.guild_purpose}`,
        status: 'ready',
        gvaeEnabled: true,
        capabilities: ['real_time_monitoring', 'auto_scaling', 'intelligent_routing'],
        metrics: {
          triggerCount: 0,
          successRate: 100,
          averageLatency: 0
        }
      }
    });
    yOffset += nodeSpacing;

    // Create enhanced agent nodes
    structure.agents?.forEach((agent: any, index: number) => {
      nodes.push({
        id: `agent-${index + 1}`,
        type: 'agent',
        position: { x: 400, y: index * nodeSpacing },
        data: {
          label: agent.name,
          role: agent.role,
          description: agent.description,
          model: 'gemini-2.0-flash',
          status: 'ready',
          gvaeEnabled: true,
          containerStatus: 'ready',
          capabilities: agent.tools_needed || [],
          executionContext: {
            browser: true,
            terminal: true,
            fileSystem: true,
            network: true
          },
          realTimeMetrics: {
            executionTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            networkActivity: 0
          },
          aiEnhancements: {
            autonomousLearning: true,
            contextMemory: true,
            errorRecovery: true,
            performanceOptimization: true
          }
        }
      });
    });

    // Create enhanced integration nodes
    structure.workflows?.forEach((workflow: any, index: number) => {
      nodes.push({
        id: `integration-${index + 1}`,
        type: 'integration',
        position: { x: 700, y: index * (nodeSpacing / 2) },
        data: {
          label: workflow.name,
          service: workflow.trigger_type,
          description: workflow.description,
          status: 'connected',
          gvaeEnabled: true,
          realTimeHealth: {
            status: 'healthy',
            responseTime: Math.floor(Math.random() * 100) + 50,
            uptime: 99.95,
            throughput: Math.floor(Math.random() * 1000) + 100
          },
          intelligentFeatures: {
            autoRetry: true,
            circuitBreaker: true,
            loadBalancing: true,
            caching: true
          }
        }
      });
    });

    return nodes;
  };

  const createIntelligentConnections = async (_blueprint: any, nodes: Node[]): Promise<Edge[]> => {
    const edges: Edge[] = [];
    
    if (nodes.length === 0) return edges;

    const triggerNode = nodes.find(n => n.type === 'trigger');
    const agentNodes = nodes.filter(n => n.type === 'agent');
    const integrationNodes = nodes.filter(n => n.type === 'integration');

    // Enhanced trigger to agent connections
    if (triggerNode && agentNodes.length > 0) {
      edges.push({
        id: `trigger-to-agent-1`,
        source: triggerNode.id,
        target: agentNodes[0].id,
        type: 'intelligentDataFlow',
        data: {
          dataType: 'primary',
          explanation: 'Intelligent workflow initiation with context preservation',
          connectionType: 'solid',
          animated: true,
          realTimeMetrics: {
            dataFlow: 0,
            latency: 0,
            errorRate: 0
          }
        },
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
        animated: true
      });
    }

    // Enhanced agent-to-agent connections
    for (let i = 0; i < agentNodes.length - 1; i++) {
      const sourceAgent = agentNodes[i];
      const targetAgent = agentNodes[i + 1];
      
      edges.push({
        id: `agent-${i}-to-${i + 1}`,
        source: sourceAgent.id,
        target: targetAgent.id,
        type: 'intelligentDataFlow',
        data: {
          dataType: 'secondary',
          explanation: `Intelligent handoff with context enrichment`,
          connectionType: 'solid',
          animated: false,
          smartRouting: true,
          contextPreservation: true
        },
        style: { stroke: 'hsl(var(--secondary))', strokeWidth: 2 }
      });
    }

    // Enhanced agent-to-integration connections
    agentNodes.forEach((agent, agentIndex) => {
      integrationNodes.forEach((integration, integrationIndex) => {
        if (agentIndex === integrationIndex) {
          edges.push({
            id: `agent-${agentIndex}-to-integration-${integrationIndex}`,
            source: agent.id,
            target: integration.id,
            type: 'intelligentDataFlow',
            data: {
              dataType: 'control',
              explanation: 'Intelligent system integration with auto-retry',
              connectionType: 'dotted',
              animated: true,
              errorRecovery: true,
              autoRetry: true
            },
            style: { stroke: 'hsl(var(--accent))', strokeWidth: 2 }
          });
        }
      });
    });

    return edges;
  };

  const onConnect = useCallback(
    (params: any) => {
      const newEdge = {
        ...params,
        type: 'intelligentDataFlow',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
        },
        data: {
          dataType: 'custom',
          flowRate: 'adaptive',
          intelligentRouting: true,
          realTimeMetrics: {
            dataVolume: 0,
            errorRate: 0,
            avgProcessingTime: 0
          }
        },
        style: {
          stroke: 'hsl(var(--primary))',
          strokeWidth: 3,
        },
        animated: true
      };
      
      (setEdges as any)((eds: any) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleStartExecution = async () => {
    console.log('🚀 Starting enhanced execution...');
    setExecutionState(prev => ({ ...prev, status: 'running' }));
    setShowExecutionPanel(true);
    
    // Start GVAE execution for each agent
    const agentNodes = nodes.filter(n => n.type === 'agent');
    for (const agentNode of agentNodes) {
      try {
        const context = await gvae.startAgentExecution(
          agentNode.id,
          { task: 'Execute workflow step' },
          { nodeId: agentNode.id }
        );
        console.log(`✅ Started execution for agent ${agentNode.id}:`, context.executionId);
      } catch (error) {
        console.error(`❌ Failed to start execution for agent ${agentNode.id}:`, error);
      }
    }
  };

  const handleStopExecution = async () => {
    console.log('🛑 Stopping execution...');
    setExecutionState(prev => ({ ...prev, status: 'idle' }));
    
    // Stop all GVAE executions
    const executions = gvae.getAllExecutions();
    for (const execution of executions) {
      await gvae.stopExecution(execution.executionId);
    }
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    
    // Show node-specific metrics if in monitor mode
    if (canvasMode === 'monitor') {
      setShowMetricsPanel(true);
    }
  }, [canvasMode]);

  const getStatusColor = (status: string) => {
    const colors = {
      idle: 'hsl(var(--muted-foreground))',
      running: 'hsl(var(--primary))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--warning))'
    };
    return colors[status as keyof typeof colors] || colors.idle;
  };

  return (
    <MagicalBackground variant="quantum" intensity="medium">
      <div className={`relative w-full h-screen ${className}`}>
        {/* Enhanced Toolbar */}
        <div className="absolute top-4 left-4 z-20">
          <GlassCard className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <HolographicButton
                  variant={canvasMode === 'design' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCanvasMode('design')}
                >
                  <Settings className="w-4 h-4" />
                  Design
                </HolographicButton>
                <HolographicButton
                  variant={canvasMode === 'execute' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCanvasMode('execute')}
                >
                  <Play className="w-4 h-4" />
                  Execute
                </HolographicButton>
                <HolographicButton
                  variant={canvasMode === 'debug' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCanvasMode('debug')}
                >
                  <Terminal className="w-4 h-4" />
                  Debug
                </HolographicButton>
                <HolographicButton
                  variant={canvasMode === 'monitor' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCanvasMode('monitor')}
                >
                  <Monitor className="w-4 h-4" />
                  Monitor
                </HolographicButton>
              </div>
              
              <div className="w-px h-6 bg-white/20" />
              
              <div className="flex items-center gap-2">
                {executionState.status === 'idle' ? (
                  <HolographicButton
                    variant="primary"
                    size="sm"
                    onClick={handleStartExecution}
                    glow
                  >
                    <Play className="w-4 h-4" />
                    Start Execution
                  </HolographicButton>
                ) : (
                  <HolographicButton
                    variant="outline"
                    size="sm"
                    onClick={handleStopExecution}
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </HolographicButton>
                )}
                
                <HolographicButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetricsPanel(!showMetricsPanel)}
                >
                  <BarChart3 className="w-4 h-4" />
                  Metrics
                </HolographicButton>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Main Canvas */}
        <div className="w-full h-full" ref={reactFlowWrapper}>
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
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            className="genesis-enhanced-flow"
          >
            {/* Enhanced Background */}
            <Background 
              color="hsl(var(--muted) / 0.3)" 
              size={1} 
              gap={25}
            />
            
            {/* Enhanced Controls */}
            <Controls 
              className="!bg-background/80 !backdrop-blur-md !border-border"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            
            {/* Enhanced MiniMap */}
            <MiniMap 
              className="!bg-background/80 !backdrop-blur-md !border-border"
              nodeColor={(node) => {
                const colors = {
                  trigger: 'hsl(var(--success))',
                  agent: 'hsl(var(--primary))',
                  integration: 'hsl(var(--warning))',
                  logic: 'hsl(var(--destructive))'
                };
                return colors[node.type as keyof typeof colors] || 'hsl(var(--primary))';
              }}
              maskColor="hsl(var(--background) / 0.8)"
              pannable
              zoomable
            />

            {/* Real-time Status Panel */}
            <Panel position="top-center" className="execution-status-panel">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
              >
                <GlassCard className="flex items-center gap-4 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(executionState.status) }}
                    />
                    <span className="text-sm font-medium">
                      Status: {executionState.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-primary" />
                    <span className="text-sm">{nodes.length} Nodes</span>
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-sm">{edges.length} Connections</span>
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-success" />
                    <span className="text-sm">
                      CPU: {executionState.liveData.resourceUsage.cpu.toFixed(1)}%
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            </Panel>

          </ReactFlow>
        </div>

        {/* Execution Panel */}
        <AnimatePresence>
          {showExecutionPanel && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 w-96 h-full z-30"
            >
              <GlassCard className="h-full p-6 rounded-none">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Live Execution</h3>
                  <HolographicButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExecutionPanel(false)}
                  >
                    <Eye className="w-4 h-4" />
                  </HolographicButton>
                </div>
                
                <div className="space-y-4">
                  {/* Execution Metrics */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Resource Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory</span>
                        <span>{executionState.liveData.resourceUsage.memory.toFixed(1)} MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>CPU</span>
                        <span>{executionState.liveData.resourceUsage.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Network</span>
                        <span>{executionState.liveData.resourceUsage.network.toFixed(1)} KB/s</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Execution Logs */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Execution Logs</h4>
                    <div className="h-64 overflow-y-auto space-y-1 text-xs font-mono bg-background/50 rounded p-2">
                      {executionLogs.map((log, index) => (
                        <div key={index} className="text-muted-foreground">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics Panel */}
        <AnimatePresence>
          {showMetricsPanel && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 h-64 z-20"
            >
              <GlassCard className="h-full p-6 rounded-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Real-Time Metrics</h3>
                  <HolographicButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMetricsPanel(false)}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </HolographicButton>
                </div>
                
                <div className="grid grid-cols-4 gap-4 h-full">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {executionState.metrics.nodesExecuted}
                    </div>
                    <div className="text-sm text-muted-foreground">Nodes Executed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {executionState.metrics.successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {executionState.liveData.activeConnections}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {executionState.liveData.throughput.toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Throughput/sec</div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MagicalBackground>
  );
};

export default EnhancedGenesisCanvas;