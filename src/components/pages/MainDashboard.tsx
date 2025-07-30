
import React from 'react';
import { Users, Bot, TrendingUp, Zap, Plus, ArrowRight, Play, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { MagicalBackground } from '../ui/MagicalBackground';

type AppPage = 'dashboard' | 'guilds' | 'agents' | 'marketplace' | 'wizard' | 'analytics';

interface MainDashboardProps {
  onNavigate?: (page: AppPage) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigate }) => {
  const stats = [
    {
      title: 'Active Digital Workers',
      value: '12',
      change: '+3 this week',
      icon: Bot,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Business Guilds',
      value: '4',
      change: '+1 this month',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Tasks Completed',
      value: '1,247',
      change: '+18% this week',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Automation Hours',
      value: '94.2h',
      change: '+12h this week',
      icon: Zap,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const recentActivity = [
    {
      agent: 'Customer Support Assistant',
      action: 'Handled 23 support tickets',
      time: '2 hours ago',
      status: 'success'
    },
    {
      agent: 'Social Media Manager',
      action: 'Posted across 5 platforms',
      time: '4 hours ago',
      status: 'success'
    },
    {
      agent: 'Content Writer',
      action: 'Created 3 blog posts',
      time: '6 hours ago',
      status: 'success'
    },
    {
      agent: 'Data Analyst',
      action: 'Generated weekly report',
      time: '8 hours ago',
      status: 'success'
    }
  ];

  const quickActions = [
    {
      title: 'Revolutionary Canvas',
      description: 'Design workflows with AI-powered features that surpass n8n & Figma',
      icon: Sparkles,
      action: 'canvas',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Create New Digital Worker',
      description: 'Build a custom AI agent for your business needs',
      icon: Plus,
      action: 'create',
      color: 'from-blue-500 to-purple-500'
    },
    {
      title: 'Launch Quick Setup',
      description: 'Get started with pre-built templates',
      icon: Play,
      action: 'setup',
      color: 'from-green-500 to-teal-500'
    }
  ];

  return (
    <MagicalBackground variant="quantum" intensity="subtle">
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to Your Digital Workforce
            </h1>
            <p className="text-white/80 text-lg">
              Manage your AI-powered business operations from one intelligent dashboard
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="backdrop-blur-sm bg-white/10 border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-white">{stat.value}</span>
                    </div>
                    <h3 className="text-white/90 font-medium mb-1">{stat.title}</h3>
                    <p className="text-white/60 text-sm">{stat.change}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Card className="backdrop-blur-sm bg-white/10 border-white/20 mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
                        onClick={() => {
                          if (action.action === 'canvas') {
                            onNavigate?.('wizard');
                          } else if (action.action === 'create') {
                            onNavigate?.('wizard');
                          } else if (action.action === 'setup') {
                            onNavigate?.('wizard');
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{action.title}</h3>
                            <p className="text-white/60 text-sm">{action.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Performance Insights */}
              <Card className="backdrop-blur-sm bg-white/10 border-white/20">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-white">Performance Insights</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Efficiency Score</span>
                      <span className="text-white font-semibold">94.2%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full" style={{ width: '94.2%' }} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Cost Savings</span>
                      <span className="text-white font-semibold">$12,450</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card className="backdrop-blur-sm bg-white/10 border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                    <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{activity.agent}</h3>
                          <p className="text-white/60 text-sm">{activity.action}</p>
                        </div>
                        <div className="text-right">
                          <div className="w-2 h-2 bg-green-500 rounded-full mb-1" />
                          <span className="text-white/60 text-sm">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="backdrop-blur-sm bg-white/10 border-white/20 mt-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-white">System Health</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-white/5">
                      <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-medium">All Systems</h3>
                      <p className="text-green-400 text-sm">Operational</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/5">
                      <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-medium">AI Agents</h3>
                      <p className="text-blue-400 text-sm">12 Active</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/5">
                      <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-medium">Guilds</h3>
                      <p className="text-purple-400 text-sm">4 Running</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MagicalBackground>
  );
};
