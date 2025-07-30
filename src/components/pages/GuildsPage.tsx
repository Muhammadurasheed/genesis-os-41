
import React from 'react';
import { Users, Plus, Settings, Play, Pause, BarChart3, Bot, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { MagicalBackground } from '../ui/MagicalBackground';

export const GuildsPage: React.FC = () => {
  const guilds = [
    {
      id: 'guild-1',
      name: 'Customer Success Guild',
      description: 'Handles customer support, onboarding, and retention',
      status: 'active',
      agents: [
        { name: 'Support Assistant', role: 'Customer Support', status: 'active' },
        { name: 'Onboarding Specialist', role: 'User Onboarding', status: 'active' },
        { name: 'Retention Expert', role: 'Customer Retention', status: 'active' }
      ],
      metrics: {
        tasksCompleted: 1247,
        efficiency: 94.2,
        costSavings: 12450
      }
    },
    {
      id: 'guild-2',
      name: 'Marketing Guild',
      description: 'Manages content creation, social media, and campaigns',
      status: 'active',
      agents: [
        { name: 'Content Creator', role: 'Content Writing', status: 'active' },
        { name: 'Social Media Manager', role: 'Social Media', status: 'active' },
        { name: 'Campaign Optimizer', role: 'Campaign Management', status: 'paused' }
      ],
      metrics: {
        tasksCompleted: 892,
        efficiency: 87.5,
        costSavings: 8200
      }
    },
    {
      id: 'guild-3',
      name: 'Operations Guild',
      description: 'Handles data analysis, reporting, and process optimization',
      status: 'active',
      agents: [
        { name: 'Data Analyst', role: 'Data Analysis', status: 'active' },
        { name: 'Report Generator', role: 'Reporting', status: 'active' }
      ],
      metrics: {
        tasksCompleted: 456,
        efficiency: 91.8,
        costSavings: 5600
      }
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
              <h1 className="text-3xl font-bold text-white mb-2">Business Guilds</h1>
              <p className="text-white/80 text-lg">
                Manage your organized teams of AI agents working together
              </p>
            </div>
            <Button variant="default" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-5 h-5 mr-2" />
              Create New Guild
            </Button>
          </div>

          {/* Guild Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">3</h3>
                <p className="text-white/60">Active Guilds</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">8</h3>
                <p className="text-white/60">Total Agents</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">91.2%</h3>
                <p className="text-white/60">Avg Efficiency</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">2,595</h3>
                <p className="text-white/60">Tasks Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Guilds Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {guilds.map((guild) => (
              <Card key={guild.id} className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{guild.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(guild.status)}`} />
                          <span className="text-sm text-white/60">{getStatusText(guild.status)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                        {guild.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-white/70 mb-4">{guild.description}</p>
                  
                  {/* Agents List */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-white/80">Agents ({guild.agents.length})</h4>
                    {guild.agents.map((agent, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                          <span className="text-sm text-white/80">{agent.name}</span>
                        </div>
                        <span className="text-xs text-white/60">{agent.role}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{guild.metrics.tasksCompleted}</div>
                      <div className="text-xs text-white/60">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{guild.metrics.efficiency}%</div>
                      <div className="text-xs text-white/60">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">${guild.metrics.costSavings}</div>
                      <div className="text-xs text-white/60">Saved</div>
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
