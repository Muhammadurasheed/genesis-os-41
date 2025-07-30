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
  Activity,
  Sparkles,
  Network,
  Cpu,
  MessageSquare
} from 'lucide-react';

import { GenesisAgentNode } from './nodes/GenesisAgentNode';
import { GenesisTriggerNode } from './nodes/GenesisTriggerNode';
import { GenesisIntegrationNode } from './nodes/GenesisIntegrationNode';
import { GenesisLogicNode } from './nodes/GenesisLogicNode';
import { GenesisDataFlowEdge } from './edges/GenesisDataFlowEdge';
import { IntelligentDataFlowEdge } from './edges/IntelligentDataFlowEdge';
import { WorkflowNarrator } from './narrator/WorkflowNarrator';
import { HolographicButton } from '../ui/HolographicButton';
import { CanvasToolbar } from '../ui/CanvasToolbar';
import { CollaborationPanel } from '../ui/CollaborationPanel';
import { PropertyPanel } from '../ui/PropertyPanel';
import { ExecutionMonitor } from '../ui/ExecutionMonitor';
import { AIAssistant } from '../ui/AIAssistant';
import { useRealtimeCollaboration } from '../../hooks/useRealtimeCollaboration';

import '@xyflow/react/dist/style.css';
import './GenesisCanvas.css';

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

interface GenesisCanvasProps {
  blueprint?: any;
  onSave?: () => void;
  onExecute?: () => void;
  className?: string;
}

export const GenesisCanvas: React.FC<GenesisCanvasProps> = ({
  blueprint,
  onSave,
  className = ''
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showNarrator, setShowNarrator] = useState(false);
  const [canvasMode, setCanvasMode] = useState<'design' | 'execute' | 'debug'>('design');
  const [executionState] = useState<any>({ status: 'ready', nodes: [], metrics: {} });

  const { collaborators, cursorPositions } = useRealtimeCollaboration();
  const { fitView } = useReactFlow();

  // Initialize canvas with blueprint
  useEffect(() => {
    if (blueprint) {
      generateCanvasFromBlueprint(blueprint);
    }
  }, [blueprint]);

  const generateCanvasFromBlueprint = async (blueprint: any) => {
    try {
      console.log('🎨 Genesis Canvas: Generating from blueprint...');
      
      const generatedNodes = await createIntelligentNodes(blueprint);
      const generatedEdges = await createIntelligentConnections(blueprint, generatedNodes);
      
      setNodes(generatedNodes as any);
      setEdges(generatedEdges as any);
      
      // Auto-layout with AI optimization
      setTimeout(() => {
        optimizeLayout(generatedNodes, generatedEdges);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error generating canvas:', error);
    }
  };

  const createIntelligentNodes = async (blueprint: any): Promise<Node[]> => {
    const nodes: Node[] = [];
    let yOffset = 0;
    const nodeSpacing = 250;

    // Get the actual structure from the blueprint
    const structure = blueprint?.suggested_structure;
    if (!structure) {
      console.warn('No suggested_structure found in blueprint');
      return nodes;
    }

    console.log('🎯 Creating nodes from real blueprint data:', structure);

    // Create trigger node
    nodes.push({
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 100, y: yOffset },
      data: {
        label: `${structure.guild_name} Trigger`,
        triggerType: 'manual',
        description: `Initiates ${structure.guild_purpose}`,
        status: 'active',
        brandLogo: '/api/assets/triggers/webhook.svg',
        realTimeMetrics: {
          successRate: 98.5,
          avgLatency: 45,
          triggerCount: 1247
        },
        aiSuggestions: [
          'Consider adding rate limiting for high-volume scenarios',
          'Add backup trigger for redundancy'
        ]
      }
    });
    yOffset += nodeSpacing;

    // Create agent nodes from real blueprint data
    structure.agents?.forEach((agent: any, index: number) => {
      nodes.push({
        id: `agent-${index + 1}`,
        type: 'agent',
        position: { x: 400, y: index * nodeSpacing },
        data: {
          label: agent.name,
          role: agent.role,
          description: agent.description,
          model: 'claude-3.5-sonnet',
          status: 'ready',
          brandLogo: '/api/assets/ai/anthropic.svg',
          capabilities: agent.tools_needed || [],
          personality: `Professional ${agent.role} specialist`,
          realTimeMetrics: {
            successRate: 96.8,
            avgLatency: 1200,
            tokensProcessed: 12847,
            currentLoad: 23
          },
          learningProgress: {
            interactions: 342,
            improvements: 15,
            feedbackScore: 4.7
          },
          aiSuggestions: [
            'Optimize token usage for cost efficiency',
            'Add memory persistence for context continuity'
          ]
        }
      });
    });

    // Create workflow nodes from real blueprint data
    structure.workflows?.forEach((workflow: any, index: number) => {
      nodes.push({
        id: `workflow-${index + 1}`,
        type: 'integration',
        position: { x: 700, y: index * (nodeSpacing / 2) },
        data: {
          label: workflow.name,
          service: workflow.trigger_type,
          description: workflow.description,
          status: 'connected',
          brandLogo: `/api/assets/integrations/${workflow.trigger_type.toLowerCase()}.svg`,
          apiHealth: {
            status: 'healthy',
            responseTime: 89,
            uptime: 99.95,
            rateLimit: { used: 245, limit: 1000 }
          },
          dataFlow: {
            inputSchema: { data: 'mixed' },
            outputSchema: { result: 'processed' },
            transformations: ['validate', 'process', 'output']
          },
          aiSuggestions: [
            'Implement retry logic for better reliability',
            'Cache frequent responses to improve performance'
          ]
        }
      });
    });

    return nodes;
  };

  const createIntelligentConnections = async (blueprint: any, nodes: Node[]): Promise<Edge[]> => {
    const edges: Edge[] = [];
    
    // Create intelligent branching connections based on workflow logic
    const structure = blueprint?.suggested_structure;
    
    if (nodes.length === 0) return edges;

    // Create main workflow path
    const triggerNode = nodes.find(n => n.type === 'trigger');
    const agentNodes = nodes.filter(n => n.type === 'agent');
    const integrationNodes = nodes.filter(n => n.type === 'integration');

    // Connect trigger to first agent
    if (triggerNode && agentNodes.length > 0) {
      edges.push({
        id: `trigger-to-agent-1`,
        source: triggerNode.id,
        target: agentNodes[0].id,
        type: 'intelligentDataFlow',
        data: {
          dataType: 'primary',
          explanation: `When ${structure?.guild_purpose || 'workflow'} is triggered, it activates the primary AI agent to begin processing`,
          connectionType: 'solid',
          animated: true
        },
        style: { stroke: '#10b981', strokeWidth: 3 },
        animated: true
      });
    }

    // Create intelligent agent-to-agent connections
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
          explanation: `${sourceAgent.data.label} processes data and hands off enriched context to ${targetAgent.data.label} for specialized handling`,
          connectionType: i % 2 === 0 ? 'solid' : 'dashed',
          animated: false
        },
        style: { stroke: '#6366f1', strokeWidth: 2 }
      });
    }

    // Connect agents to integrations with feedback loops
    agentNodes.forEach((agent, agentIndex) => {
      integrationNodes.forEach((integration, integrationIndex) => {
        if (agentIndex === integrationIndex || (agentIndex === 0 && integrationIndex === integrationNodes.length - 1)) {
          edges.push({
            id: `agent-${agentIndex}-to-integration-${integrationIndex}`,
            source: agent.id,
            target: integration.id,
            type: 'intelligentDataFlow',
            data: {
              dataType: 'control',
              explanation: `${agent.data.label} sends processed data to ${integration.data.label} for external system integration`,
              connectionType: 'dotted',
              animated: true
            },
            style: { stroke: '#f59e0b', strokeWidth: 2 }
          });

          // Add feedback connection
          if (agentIndex < agentNodes.length - 1) {
            edges.push({
              id: `feedback-${integrationIndex}-to-agent-${agentIndex + 1}`,
              source: integration.id,
              target: agentNodes[agentIndex + 1].id,
              type: 'intelligentDataFlow',
              data: {
                dataType: 'feedback',
                explanation: `${integration.data.label} provides confirmation and results back to ${agentNodes[agentIndex + 1].data.label} for continued processing`,
                connectionType: 'dashed',
                animated: false
              },
              style: { stroke: '#8b5cf6', strokeWidth: 1.5 }
            });
          }
        }
      });
    });

    return edges;
  };

  const optimizeLayout = useCallback((_nodes: Node[], _edges: Edge[]) => {
    // AI-powered layout optimization
    console.log('🧠 Optimizing canvas layout...');
    fitView({ padding: 0.2, duration: 800 });
  }, [fitView]);

  const onConnect = useCallback(
    (params: any) => {
      const newEdge = {
        ...params,
        type: 'dataFlow',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
        data: {
          dataType: 'mixed',
          flowRate: 'normal',
          transformations: [],
          realTimeMetrics: {
            dataVolume: 0,
            errorRate: 0,
            avgProcessingTime: 0
          }
        },
        style: {
          stroke: '#6366f1',
          strokeWidth: 3,
        },
        animated: true
      };
      
      (setEdges as any)((eds: any) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const handleCanvasModeChange = (mode: 'design' | 'execute' | 'debug') => {
    setCanvasMode(mode);
    if (mode === 'execute') {
      startWorkflowExecution();
    }
  };

  const startWorkflowExecution = async () => {
    console.log('🚀 Starting workflow execution...');
  };



  return (
    <div className={`genesis-canvas-container ${className}`}>
      {/* Advanced Toolbar */}
      <CanvasToolbar
        mode={canvasMode}
        onModeChange={handleCanvasModeChange}
        onSave={onSave}
        onExecute={() => startWorkflowExecution()}
        executionMetrics={executionState.metrics}
      />

      {/* Collaboration Panel */}
      <CollaborationPanel
        collaborators={collaborators}
        cursorPositions={cursorPositions}
        className="absolute top-4 right-4 z-10"
      />

      {/* Main Canvas */}
      <div className="canvas-main-area" ref={reactFlowWrapper}>
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
          className="genesis-flow"
          style={{ 
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #2d1b69 50%, #1a1a3e 75%, #0f0f23 100%)',
          }}
        >
          {/* Advanced Background */}
          <Background 
            color="#cbd5e1" 
            size={1} 
            gap={25}
            className="genesis-background"
          />
          
          {/* Enhanced Controls */}
          <Controls 
            className="genesis-controls !bg-white !border-gray-200 !shadow-lg"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          
          {/* Intelligent MiniMap */}
          <MiniMap 
            className="genesis-minimap !bg-white !border-gray-200 !shadow-lg"
            nodeColor={(node) => {
              const colors = {
                trigger: '#10b981',
                agent: '#6366f1',
                integration: '#f59e0b',
                logic: '#ef4444'
              };
              return colors[node.type as keyof typeof colors] || '#6366f1';
            }}
            maskColor="rgba(255, 255, 255, 0.8)"
            pannable
            zoomable
          />

          {/* Real-time Execution Overlay */}
          <Panel position="top-center" className="execution-status-panel">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 bg-black/50 backdrop-blur-lg rounded-lg px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Canvas Active</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm">{nodes.length} Nodes</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm">{edges.length} Connections</span>
              </div>
            </motion.div>
          </Panel>

          {/* AI Assistant Panel */}
          <Panel position="bottom-right" className="ai-assistant-panel">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col gap-2"
            >
              <HolographicButton
                variant="outline"
                size="sm"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </HolographicButton>
              
              <HolographicButton
                variant="outline"
                size="sm"
                onClick={() => setShowNarrator(!showNarrator)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Explain Workflow
              </HolographicButton>
            </motion.div>
          </Panel>

        </ReactFlow>
      </div>

      {/* Property Panel */}
      <PropertyPanel
        selectedNode={selectedNode ? (nodes as any).find((n: any) => n.id === selectedNode) : null}
        onNodeUpdate={(nodeId: string, updates: any) => {
          (setNodes as any)((nds: any) => nds.map((node: any) => 
            node.id === nodeId ? { ...node, ...updates } : node
          ));
        }}
        className="absolute left-4 top-20 z-10"
      />

      {/* Execution Monitor */}
      <ExecutionMonitor
        executionState={executionState}
        nodes={nodes}
        edges={edges}
        className="absolute right-4 bottom-20 z-10"
      />

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAIAssistant && (
          <AIAssistant
            workflow={{ nodes, edges }}
            onSuggestion={(suggestion) => {
              console.log('🤖 AI Suggestion:', suggestion);
            }}
            onClose={() => setShowAIAssistant(false)}
          />
        )}
      </AnimatePresence>

      {/* Workflow Narrator Modal */}
      <AnimatePresence>
        {showNarrator && (
          <WorkflowNarrator
            workflow={{ nodes, edges }}
            onClose={() => setShowNarrator(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};