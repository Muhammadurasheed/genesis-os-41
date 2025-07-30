import React, { useCallback, useEffect, useState } from 'react';
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
  Edge,
  OnConnect,
  Connection,
  useReactFlow,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Mic, 
  MicOff, 
  Undo, 
  Redo,
  Brain,
  Zap,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { useCollaborationStore } from '../../stores/collaborationStore';
// import { realTimeCollaborationService } from '../../services/realTimeCollaborationService';
import '@xyflow/react/dist/style.css';

interface CollaborationCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastSeen: number;
}

interface VoiceCommand {
  id: string;
  command: string;
  timestamp: number;
  status: 'processing' | 'completed' | 'failed';
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export const CollaborativeCanvas: React.FC = () => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Collaboration state
  const [cursors] = useState<CollaborationCursor[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  
  // Real-time collaboration
  const { collaborators, isCollaborative } = useCollaborationStore();
  
  // Version control
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (nodes.length > 0 || edges.length > 0) {
        saveToHistory();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [nodes, edges]);

  const saveToHistory = useCallback(() => {
    const newSnapshot = { nodes: [...nodes], edges: [...edges] };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSnapshot);
    setHistory(newHistory.slice(-50)); // Keep last 50 versions
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevSnapshot = history[historyIndex - 1];
      setNodes(prevSnapshot.nodes);
      setEdges(prevSnapshot.edges);
      setHistoryIndex(historyIndex - 1);
      toast.info('Undid last change');
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextSnapshot = history[historyIndex + 1];
      setNodes(nextSnapshot.nodes);
      setEdges(nextSnapshot.edges);
      setHistoryIndex(historyIndex + 1);
      toast.info('Redid change');
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        source: params.source!,
        target: params.target!
      };
      setEdges((eds) => addEdge(newEdge, eds));
      toast.success('Agents connected successfully');
    },
    [setEdges]
  );

  // Smart agent creation
  const addSmartAgent = useCallback((type: 'coordinator' | 'analyzer' | 'executor' | 'communicator') => {
    const agentConfigs = {
      coordinator: {
        label: 'Coordination Agent',
        description: 'Manages workflow orchestration',
        color: '#8b5cf6',
        tools: ['project-management', 'communication', 'scheduling']
      },
      analyzer: {
        label: 'Data Analyst',
        description: 'Processes and analyzes information',
        color: '#06b6d4',
        tools: ['data-analysis', 'reporting', 'visualization']
      },
      executor: {
        label: 'Task Executor',
        description: 'Performs specific business actions',
        color: '#10b981',
        tools: ['automation', 'integration', 'execution']
      },
      communicator: {
        label: 'Communication Agent',
        description: 'Handles external communications',
        color: '#f59e0b',
        tools: ['email', 'slack', 'notifications']
      }
    };

    const config = agentConfigs[type];
    const newNode: Node = {
      id: `agent-${Date.now()}`,
      type: 'default',
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: config.label,
        description: config.description,
        tools: config.tools,
        type: type,
        status: 'active'
      },
      style: {
        background: config.color,
        color: 'white',
        border: '2px solid #ffffff20',
        borderRadius: '12px',
        padding: '10px',
        minWidth: '160px'
      }
    };

    setNodes((nds) => [...nds, newNode]);
    saveToHistory();
    toast.success(`${config.label} added to canvas`, {
      description: config.description
    });
  }, [setNodes, saveToHistory]);

  // Voice command processing
  const processVoiceCommand = useCallback(async (command: string) => {
    const commandId = `cmd-${Date.now()}`;
    const newCommand: VoiceCommand = {
      id: commandId,
      command,
      timestamp: Date.now(),
      status: 'processing'
    };
    
    setVoiceCommands(prev => [...prev, newCommand]);
    
    try {
      // Process natural language commands
      const lowerCommand = command.toLowerCase();
      
      if (lowerCommand.includes('add') && lowerCommand.includes('agent')) {
        if (lowerCommand.includes('coordinator') || lowerCommand.includes('manager')) {
          addSmartAgent('coordinator');
        } else if (lowerCommand.includes('analyst') || lowerCommand.includes('data')) {
          addSmartAgent('analyzer');
        } else if (lowerCommand.includes('executor') || lowerCommand.includes('worker')) {
          addSmartAgent('executor');
        } else if (lowerCommand.includes('communication') || lowerCommand.includes('messenger')) {
          addSmartAgent('communicator');
        } else {
          addSmartAgent('coordinator'); // Default
        }
      } else if (lowerCommand.includes('save') || lowerCommand.includes('backup')) {
        saveToHistory();
        toast.success('Canvas saved via voice command');
      } else if (lowerCommand.includes('undo')) {
        undo();
      } else if (lowerCommand.includes('clear') || lowerCommand.includes('reset')) {
        setNodes([]);
        setEdges([]);
        toast.info('Canvas cleared via voice command');
      } else {
        toast.info('Voice command not recognized', {
          description: 'Try "add coordinator agent" or "save canvas"'
        });
      }
      
      // Update command status
      setVoiceCommands(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { ...cmd, status: 'completed' }
            : cmd
        )
      );
      
    } catch (error) {
      console.error('Voice command failed:', error);
      setVoiceCommands(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { ...cmd, status: 'failed' }
            : cmd
        )
      );
    }
  }, [addSmartAgent, saveToHistory, undo, setNodes, setEdges]);

  // Auto-layout algorithm
  const autoLayout = useCallback(() => {
    const layoutedNodes = nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.max(200, nodes.length * 30);
      
      return {
        ...node,
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle)
        }
      };
    });
    
    setNodes(layoutedNodes);
    setTimeout(() => fitView(), 100);
    toast.success('Canvas auto-organized');
  }, [nodes, setNodes, fitView]);

  // Use processVoiceCommand for voice interface
  const handleVoiceCommand = useCallback((command: string) => {
    processVoiceCommand(command);
  }, [processVoiceCommand]);

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Collaboration Cursors */}
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.id}
            className="absolute pointer-events-none z-50"
            style={{
              left: cursor.x,
              top: cursor.y,
              color: cursor.color
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <div className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: cursor.color }}
              />
              <span className="text-xs bg-black/80 text-white px-2 py-1 rounded">
                {cursor.name}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Voice Commands Overlay */}
      {voiceCommands.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 z-40 space-y-2"
        >
          {voiceCommands.slice(-3).map((cmd) => (
            <Card key={cmd.id} className="bg-black/80 border-white/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    cmd.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                    cmd.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-white text-sm">{cmd.command}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-transparent"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#ffffff20"
        />
        
        <Controls className="bg-black/80 border-white/20" />
        
        <MiniMap 
          nodeStrokeColor={() => '#ffffff'}
          nodeColor={(node: Node) => (node.style?.background as string) || '#8b5cf6'}
          nodeBorderRadius={8}
          position="top-right"
          className="bg-black/80 border border-white/20"
        />

        {/* Enhanced Control Panel */}
        <Panel position="top-left" className="space-y-4">
          {/* Smart Agent Creation */}
          <Card className="bg-black/80 border-white/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Smart Agents
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  onClick={() => addSmartAgent('coordinator')}
                  className="bg-purple-600 hover:bg-purple-700 text-xs"
                >
                  Coordinator
                </Button>
                <Button
                  size="sm"
                  onClick={() => addSmartAgent('analyzer')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-xs"
                >
                  Analyst
                </Button>
                <Button
                  size="sm"
                  onClick={() => addSmartAgent('executor')}
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  Executor
                </Button>
                <Button
                  size="sm"
                  onClick={() => addSmartAgent('communicator')}
                  className="bg-amber-600 hover:bg-amber-700 text-xs"
                >
                  Messenger
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Canvas Controls */}
          <Card className="bg-black/80 border-white/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Canvas Tools
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={autoLayout}
                  className="border-white/20 text-white hover:bg-white/10 text-xs"
                >
                  Auto-Layout
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="border-white/20 text-white hover:bg-white/10 text-xs"
                >
                  <Undo className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="border-white/20 text-white hover:bg-white/10 text-xs"
                >
                  <Redo className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  className={`border-white/20 text-xs ${
                    isVoiceActive 
                      ? 'bg-green-600 text-white' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {isVoiceActive ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Status */}
          {isCollaborative && (
            <Card className="bg-black/80 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-white">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{collaborators.length + 1} Active</span>
                  <div className="flex -space-x-1">
                    {collaborators.slice(0, 3).map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white flex items-center justify-center text-xs font-bold"
                        title={collaborator.name}
                      >
                        {collaborator.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </Panel>

        {/* Canvas Stats */}
        <Panel position="bottom-right">
          <Card className="bg-black/80 border-white/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-4 text-sm text-white">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                  {nodes.length} Agents
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                  {edges.length} Connections
                </Badge>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  v{historyIndex + 1}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Panel>
      </ReactFlow>

      {/* Voice Command Interface */}
      {isVoiceActive && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="bg-black/90 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white">Voice commands active</span>
                <MessageSquare className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Try: "Add coordinator agent", "Auto layout", "Save canvas"
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVoiceCommand('add coordinator agent')}
                className="mt-2 border-white/20 text-white hover:bg-white/10 text-xs"
              >
                Test Voice Command
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};