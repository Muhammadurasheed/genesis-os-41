
import React from 'react';
import { Bot, Plus, Settings, Play, Pause, BarChart3, Zap, Users, Brain } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { MagicalBackground } from '../ui/MagicalBackground';

export const AgentsPage: React.FC = () => {
  const agents = [
    {
      id: 'agent-1',
      name: 'Customer Support Assistant',
      role: 'Customer Support',
      description: 'Handles customer inquiries, resolves issues, and provides support',
      status: 'active',
      guild: 'Customer Success Guild',
      capabilities: ['Natural Language Processing', 'Issue Resolution', 'Knowledge Base'],
      metrics: {
        tasksCompleted: 456,
        successRate: 94.2,
        avgResponseTime: '2.3s'
      },
      personality: 'Helpful and empathetic',
      avatar: '👩‍💼'
    },
    {
      id: 'agent-2',
      name: 'Social Media Manager',
      role: 'Social Media',
      description: 'Creates and schedules content across social platforms',
      status: 'active',
      guild: 'Marketing Guild',
      capabilities: ['Content Creation', 'Social Media APIs', 'Analytics'],
      metrics: {
        tasksCompleted: 234,
        successRate: 89.7,
        avgResponseTime: '1.8s'
      },
      personality: 'Creative and engaging',
      avatar: '🎨'
    },
    {
      id: 'agent-3',
      name: 'Data Analyst',
      role: 'Data Analysis',
      description: 'Analyzes data, generates reports, and provides insights',
      status: 'active',
      guild: 'Operations Guild',
      capabilities: ['Data Processing', 'Statistical Analysis', 'Visualization'],
      metrics: {
        tasksCompleted: 189,
        successRate: 96.1,
        avgResponseTime: '4.2s'
      },
      personality: 'Analytical and precise',
      avatar: '📊'
    },
    {
      id: 'agent-4',
      name: 'Content Writer',
      role: 'Content Creation',
      description: 'Generates blog posts, articles, and marketing copy',
      status: 'paused',
      guild: 'Marketing Guild',
      capabilities: ['Creative Writing', 'SEO Optimization', 'Research'],
      metrics: {
        tasksCompleted: 78,
        successRate: 92.3,
        avgResponseTime: '3.1s'
      },
      personality: 'Creative and articulate',
      avatar: '✍️'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  return (
    <MagicalBackground variant="quantum" intensity="subtle">
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Agents</h1>
              <p className="text-white/80 text-lg">
                Manage your intelligent digital workers and their capabilities
              </p>
            </div>
            <Button variant="default" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-5 h-5 mr-2" />
              Create New Agent
            </Button>
          </div>

          {/* Agent Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">4</h3>
                <p className="text-white/60">Total Agents</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">3</h3>
                <p className="text-white/60">Active</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">93.1%</h3>
                <p className="text-white/60">Avg Success Rate</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">957</h3>
                <p className="text-white/60">Tasks Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-2xl">
                        {agent.avatar}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                          <span className="text-sm text-white/60">{getStatusText(agent.status)}</span>
                          <span className="text-sm text-white/40">•</span>
                          <span className="text-sm text-white/60">{agent.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                        {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-white/70 mb-4">{agent.description}</p>
                  
                  {/* Guild Assignment */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-4 h-4 text-white/60" />
                    <span className="text-sm text-white/60">Guild:</span>
                    <span className="text-sm text-white/80">{agent.guild}</span>
                  </div>
                  
                  {/* Capabilities */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-white/80 mb-2">Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities.map((capability, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/80 border border-white/20"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Personality */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-white/80 mb-1">Personality</h4>
                    <p className="text-sm text-white/70">{agent.personality}</p>
                  </div>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{agent.metrics.tasksCompleted}</div>
                      <div className="text-xs text-white/60">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{agent.metrics.successRate}%</div>
                      <div className="text-xs text-white/60">Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{agent.metrics.avgResponseTime}</div>
                      <div className="text-xs text-white/60">Response</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 text-white/80 border-white/20 hover:bg-white/10">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-white/80 border-white/20 hover:bg-white/10">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MagicalBackground>
  );
};
