
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Zap, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Cpu,
  Network,
  Brain
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';

interface CommunicationData {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: Date;
  type: 'request' | 'response' | 'broadcast';
  status: 'pending' | 'completed' | 'failed';
}

interface AgentStats {
  id: string;
  name: string;
  messagesProcessed: number;
  avgResponseTime: number;
  status: 'active' | 'idle' | 'busy';
  lastActivity: Date;
}

export const AgentCommunicationVisualizer: React.FC = () => {
  const [communications, setCommunications] = useState<CommunicationData[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Simulate real-time data
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newComm: CommunicationData = {
        id: Date.now().toString(),
        from: `Agent ${Math.floor(Math.random() * 5) + 1}`,
        to: `Agent ${Math.floor(Math.random() * 5) + 1}`,
        message: `Processing task #${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(),
        type: Math.random() > 0.5 ? 'request' : 'response',
        status: Math.random() > 0.8 ? 'failed' : 'completed'
      };

      setCommunications(prev => [newComm, ...prev.slice(0, 19)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Initialize sample data
  useEffect(() => {
    const sampleStats: AgentStats[] = [
      {
        id: '1',
        name: 'Data Processor',
        messagesProcessed: 1247,
        avgResponseTime: 0.34,
        status: 'active',
        lastActivity: new Date()
      },
      {
        id: '2', 
        name: 'Content Generator',
        messagesProcessed: 892,
        avgResponseTime: 1.2,
        status: 'busy',
        lastActivity: new Date(Date.now() - 30000)
      },
      {
        id: '3',
        name: 'Quality Checker',
        messagesProcessed: 543,
        avgResponseTime: 0.89,
        status: 'idle',
        lastActivity: new Date(Date.now() - 120000)
      }
    ];

    setAgentStats(sampleStats);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'idle': return 'text-gray-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const toggleLiveMode = () => {
    setIsLive(!isLive);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Network className="w-6 h-6" />
          Agent Communication
        </h2>
        <Button
          onClick={toggleLiveMode}
          variant={isLive ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {isLive ? 'Stop Live Feed' : 'Start Live Feed'}
        </Button>
      </div>

      {/* Agent Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agentStats.map((agent) => (
          <Card key={agent.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{agent.name}</h3>
              <div className={`px-2 py-1 rounded-full text-xs ${
                agent.status === 'active' ? 'bg-green-100 text-green-800' :
                agent.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {agent.status}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Messages:</span>
                <span className="font-medium">{agent.messagesProcessed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response:</span>
                <span className="font-medium">{agent.avgResponseTime}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Active:</span>
                <span className="font-medium">
                  {Math.floor((Date.now() - agent.lastActivity.getTime()) / 1000)}s ago
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Communication Feed */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Live Communication Feed
          </h3>
          {isLive && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-2 text-green-600"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Live</span>
            </motion.div>
          )}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {communications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No communications yet. Start live mode to see agent interactions.</p>
            </div>
          ) : (
            communications.map((comm) => (
              <motion.div
                key={comm.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-sm text-blue-600">{comm.from}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="font-medium text-sm text-purple-600">{comm.to}</span>
                  <span className="text-sm text-gray-600 truncate">{comm.message}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className={getStatusColor(comm.status)}>
                    {comm.status}
                  </span>
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">
                    {comm.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">3</div>
          <div className="text-sm text-gray-600">Active Agents</div>
        </Card>
        
        <Card className="p-4 text-center">
          <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <div className="text-2xl font-bold">{communications.length}</div>
          <div className="text-sm text-gray-600">Messages/Min</div>
        </Card>
        
        <Card className="p-4 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold">0.81s</div>
          <div className="text-sm text-gray-600">Avg Response</div>
        </Card>
        
        <Card className="p-4 text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold">98.2%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </Card>
      </div>
    </div>
  );
};
